

class ShaderProcessor {
  gl: WebGLRenderingContext;
  shaderSources: {[key: string]: string} = {};
  shaders: {[key: string]: WebGLShader} = {};
  shaderPrograms: {[key: string]: WebGLProgram} = {};

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }

  public async loadShaders() {
    this.shaderSources = await this.getShaders();

    // Example: Compile and link a basic shader program
    const vertexShaderSource = this.shaderSources['basic.vert'];
    const fragmentShaderSource = this.shaderSources['basic.frag'];

    if (!vertexShaderSource || !fragmentShaderSource) {
      throw new Error('Required shader files are missing.');
    }

    const shaderProgram =
        this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
    this.shaderPrograms['basic'] = shaderProgram;

    console.log('Shaders loaded and compiled successfully.');
  }

  private async getShaders() {
    // Get the shader list
    const response = await fetch('/api/shaderlist');
    const shaderFiles: string[] = await response.json();

    const shaders: {[key: string]: string} = {};

    for (const fileName of shaderFiles) {
      const fileResponse = await fetch(`/shaders/${fileName}`);
      const shaderSource = await fileResponse.text();
      shaders[fileName] = shaderSource;

      console.log(`Loaded shader: ${fileName}`);
    }

    return shaders;
  }

  private compileShader(source: string, type: number): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) {
      throw new Error('Unable to create shader.');
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error('An error occurred compiling the shaders: ' + info);
    }

    return shader;
  }

  private createShaderProgram(
      vertexShaderSource: string, fragmentShaderSource: string): WebGLProgram {
    const vertexShader =
        this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
    const fragmentShader =
        this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);

    const shaderProgram = this.gl.createProgram();
    if (!shaderProgram) {
      throw new Error('Unable to create shader program.');
    }

    this.gl.attachShader(shaderProgram, vertexShader);
    this.gl.attachShader(shaderProgram, fragmentShader);
    this.gl.linkProgram(shaderProgram);

    if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(shaderProgram);
      throw new Error('Unable to initialize the shader program: ' + info);
    }

    return shaderProgram;
  }
}

export default ShaderProcessor;