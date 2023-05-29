import { initialize, scale } from '../xbrz.js';

async function loadImage() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  // Load the source image into the canvas
  const image = new Image();
  image.onload = async function() {
    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);

    document.body.appendChild(canvas);

    // Initialize webassembly environment (technically optional, but advised if scaling in parallel)
    await initialize();

    // Call the scale function with the canvas and scale factor
    const scaleFactor = 4;
    const scaleCanvas = await scale(canvas, scaleFactor);

    document.body.appendChild(scaleCanvas)
  };
  image.src = 'source.png';
}

// Call the loadImage function when the page has finished loading
window.addEventListener('load', loadImage);