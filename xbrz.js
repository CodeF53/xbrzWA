let instance;
let xbrzScale;

const ColorFormat = {
  RGB: 0,
  ARGB: 1,
  ARGB_UNBUFFERED: 2
};
const ScalerCfg = {
  luminanceWeight: 1,
  equalColorTolerance: 30,
  centerDirectionBias: 4,
  dominantDirectionThreshold: 3.6,
  steepDirectionThreshold: 2.2,
  newTestAttribute: 0
};

async function initialize() {
  const result = await WebAssembly.instantiateStreaming(fetch('xbrz.wasm'), {
    wasi_snapshot_preview1: {
      fd_write: () => {},
      fd_close: () => {},
      fd_seek: () => {},
      proc_exit: () => {}
    }
  });

  instance = result.instance;
  xbrzScale = result.instance.exports.xbrz_scale;
}

async function scale(canvas, scaleFactor) {
  // Read in xbrzScale from WASM if we haven't already
  if (!xbrzScale) {
    await initialize();
  }

  const { width, height } = canvas;
  const scaleWidth = width * scaleFactor;
  const scaleHeight = height * scaleFactor;

  // get image data
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, width, height);
  const srcData = new Uint32Array(imageData.data.buffer);
  // create target array
  const trgData = new Uint32Array(scaleWidth * scaleHeight);

  // pointer blackMagic
  const inputSize = srcData.length * srcData.BYTES_PER_ELEMENT;
  const inputOffset = instance.exports.stackAlloc(inputSize);
  const inputBuffer = new Uint8Array(instance.exports.memory.buffer, inputOffset, inputSize);
  inputBuffer.set(new Uint8Array(srcData.buffer));

  const resultOffset = xbrzScale(
    scaleFactor,
    inputOffset,
    trgData,
    width,
    height,
    ColorFormat.ARGB_UNBUFFERED,
    ScalerCfg, // TODO: it doesn't like this config
    0,
    scaleHeight
  );

  const resultData = new Uint32Array(instance.exports.memory.buffer, resultOffset, trgData.length);

  instance.exports.stackRestore(inputOffset);

  const scaledCanvas = document.createElement('canvas');
  scaledCanvas.width = scaleWidth;
  scaledCanvas.height = scaleHeight;
  const scaledCtx = scaledCanvas.getContext('2d');
  const scaledImageData = scaledCtx.createImageData(scaleWidth, scaleHeight);
  const scaledData = new Uint32Array(scaledImageData.data.buffer);
  scaledData.set(resultData);
  scaledCtx.putImageData(scaledImageData, 0, 0);

  return scaledCanvas;
}

export { scale, initialize };