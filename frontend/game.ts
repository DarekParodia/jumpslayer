// Config for the game
import config from './shooter/config.js';
import ShaderProcessor from './shooter/shaders.js';

document.addEventListener('DOMContentLoaded', main);

async function main() {
  const {canvas, gl} = await setupCanvas();
  const shaderProcessor = new ShaderProcessor(gl);
  await shaderProcessor.loadShaders();
}

async function setupCanvas() {
  const canvas = document.getElementById(config.CANVAS_ID) as HTMLCanvasElement;

  if (!canvas) {
    throw new Error(`Canvas element with ID '${config.CANVAS_ID}' not found.`);
  }

  const gl = canvas.getContext('webgl');

  if (gl === null) {
    throw new Error(
        'Unable to initialize WebGL. Your browser or machine may not support it.');
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  console.log('WebGL context initialized successfully.');

  return {canvas, gl};
}