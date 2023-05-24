let instance;
let xbrzScale;

const ColorFormat = {
  RGB: 0,
  ARGB: 1,
  ARGB_UNBUFFERED: 2
};

async function initialize() {
  const result = await WebAssembly.instantiateStreaming(fetch('https://codef53.github.io/xbrzWA/xbrz.wasm'), {
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

  // pointer black magic
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
    0,
    scaleHeight
  );

  // obtain result using black magic
  const resultData = new Uint32Array(instance.exports.memory.buffer, resultOffset, trgData.length);
  instance.exports.stackRestore(inputOffset);

  // create output canvas
  const scaledCanvas = document.createElement('canvas');
  scaledCanvas.width = scaleWidth;
  scaledCanvas.height = scaleHeight;
  // add image to new canvas
  const scaledCtx = scaledCanvas.getContext('2d');
  const scaledImageData = scaledCtx.createImageData(scaleWidth, scaleHeight);
  const scaledData = new Uint32Array(scaledImageData.data.buffer);
  scaledData.set(resultData);
  scaledCtx.putImageData(scaledImageData, 0, 0);

  return scaledCanvas;
}

export { scale, initialize };