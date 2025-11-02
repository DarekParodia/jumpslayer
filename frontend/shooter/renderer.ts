import mesh from './mesh.js';
import ShaderProcessor from './shaders.js';

class Renderer {
  gl: WebGLRenderingContext;
  shaderProcessor: ShaderProcessor;

  posBuffer: WebGLBuffer|null = null;
  colorBuffer: WebGLBuffer|null = null
  indexBuffer: WebGLBuffer|null = null;

  constructor(gl: WebGLRenderingContext, shaderProcessor: ShaderProcessor) {
    this.gl = gl;
    this.shaderProcessor = shaderProcessor;
  }

  public async initialize() {
    console.log('Renderer initialized.');
  }

  // Further rendering methods would go here
  public async draw() {}
}

export default Renderer;