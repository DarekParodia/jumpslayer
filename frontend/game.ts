// Config for the game
import config from './shooter/config.js';

document.addEventListener('DOMContentLoaded', main);

async function main() {
  setupCanvas();
}
async function setupCanvas() {
  const canvas = document.getElementById(config.CANVAS_ID) as HTMLCanvasElement;

  if (!canvas) {
    throw new Error(`Canvas element with ID '${config.CANVAS_ID}' not found.`);
  }

  const gl = canvas.getContext('webgl');

  // Only continue if WebGL is available and working
  if (gl === null) {
    throw new Error(
        'Unable to initialize WebGL. Your browser or machine may not support it.');
  }

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  console.log('WebGL context initialized successfully.');
}