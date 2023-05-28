let instance;
let xbrzScale;

const ColorFormat = {
  RGB: 0,
  ARGB: 1,
  ARGB_UNBUFFERED: 2
};

async function initialize() {
  // Get the correct location of xbrz.wasm
  const wasmPath = new URL('xbrz.wasm', import.meta.url).href;

  // Load in xbrz.wasm
  const result = await WebAssembly.instantiateStreaming(fetch(wasmPath), {
    wasi_snapshot_preview1: {
      fd_write: () => {},
      fd_close: () => {},
      fd_seek: () => {},
      proc_exit: () => {}
    }
  });
  // Save WASM instance and xbrzScale function in the global scope
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

  // black magic
  const inputSize = srcData.length * srcData.BYTES_PER_ELEMENT;
  const inputOffset = instance.exports.stackAlloc(inputSize);
  const inputBuffer = new Uint8Array(instance.exports.memory.buffer, inputOffset, inputSize);
  inputBuffer.set(new Uint8Array(srcData.buffer));

  const resultOffset = xbrzScale(
    scaleFactor,
    inputOffset,
    width,
    height,
    ColorFormat.ARGB_UNBUFFERED,
    0,
    scaleHeight
  );

  // obtain result using black magic
  const resultData = new Uint32Array(instance.exports.memory.buffer, resultOffset, scaleWidth * scaleHeight);
  instance.exports.stackRestore(inputOffset);

  // create result canvas
  const scaledCanvas = document.createElement('canvas');
  scaledCanvas.width = scaleWidth;
  scaledCanvas.height = scaleHeight;
  const scaledCtx = scaledCanvas.getContext('2d');

  // draw result canvas
  const scaledImageData = scaledCtx.createImageData(scaleWidth, scaleHeight);
  const scaledData = new Uint32Array(scaledImageData.data.buffer);
  scaledData.set(resultData);
  scaledCtx.putImageData(scaledImageData, 0, 0);

  return scaledCanvas;
}

export { scale, initialize };