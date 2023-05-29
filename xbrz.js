let instance;

const ColorFormat = {
  RGB: 0,
  ARGB: 1,
  ARGB_UNBUFFERED: 2
};

// If you are going to run `scale` in parallel, make sure to run this first
// Otherwise, each instance of `scale` will try initializing their own environment
// That leads to crashes on firefox (especially when there are more than 20)
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
  instance = result.instance;
}

async function scale(canvas, scaleFactor) {
  // Load WASM env if not already loaded
  if (!instance) { await initialize(); }

  const { width, height } = canvas;
  const scaleWidth = width * scaleFactor;
  const scaleHeight = height * scaleFactor;

  // get image data
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, width, height);
  const srcData = new Uint32Array(imageData.data.buffer);

  // create memory region for input
  const inputSize = srcData.length * srcData.BYTES_PER_ELEMENT; // calculate buffer size in bytes
  const inputOffset = instance.exports.malloc(inputSize); // allocate memory on the stack
  // copy input into to memory region
  const inputBuffer = new Uint8Array(instance.exports.memory.buffer, inputOffset, inputSize);
  inputBuffer.set(new Uint8Array(srcData.buffer));

  // create memory region for output
  const outputLength = scaleWidth * scaleHeight;
  const outputOffset = instance.exports.malloc(outputLength * srcData.BYTES_PER_ELEMENT);

  // scale (fills output memory region with scaled image)
  instance.exports.xbrz_scale(
    scaleFactor,
    inputOffset,
    outputOffset,
    width,
    height,
    ColorFormat.ARGB_UNBUFFERED,
    0,
    scaleHeight
  );

  // read scaled image from memory
  const resultData = new Uint32Array(instance.exports.memory.buffer, outputOffset, outputLength);
  // free memory
  instance.exports.free(inputOffset);
  instance.exports.free(outputOffset);

  // create result canvas
  const scaledCanvas = document.createElement('canvas');
  scaledCanvas.width = scaleWidth;
  scaledCanvas.height = scaleHeight;
  const scaledCtx = scaledCanvas.getContext('2d');

  // draw scaled image to result canvas
  const scaledImageData = scaledCtx.createImageData(scaleWidth, scaleHeight);
  const scaledData = new Uint32Array(scaledImageData.data.buffer);
  scaledData.set(resultData);
  scaledCtx.putImageData(scaledImageData, 0, 0);

  return scaledCanvas;
}

export { scale, initialize };