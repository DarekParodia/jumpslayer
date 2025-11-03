// some basics for now
import {Vec2, Vec3} from './math.js';

interface MeshFace {
  f: Vec3[];
}

interface MeshGroup {
  o: string;
  v: Vec3[];
  vn: Vec3[];
  vt: Vec2[];
  s: Number;
  f: MeshFace[];
}

interface glBuffer {
  positions: Float32Array;
  normals: Float32Array;
  texcoords: Float32Array;
  indices: Uint16Array;
}

class ObjMesh {
  groups: MeshGroup[] = [];

  constructor(objData: string) {
    // parse objData and populate groups
    const lines = objData.split(/\r?\n/);  // split on newlines

    for (const line of lines) {
      const parts = line.trim().split(' ');
      const prefix = parts[0];

      switch (prefix) {
        case 'o': {
          // New object/group
          const groupName = parts[1];
          this.groups.push({o: groupName, v: [], vn: [], vt: [], s: 0, f: []});
          break;
        }
        case 'v': {
          // Vertex position
          const x = parseFloat(parts[1]);
          const y = parseFloat(parts[2]);
          const z = parseFloat(parts[3]);
          this.groups[this.groups.length - 1].v.push(new Vec3(x, y, z));
          break;
        }
        case 'vn': {
          // Vertex normal
          const x = parseFloat(parts[1]);
          const y = parseFloat(parts[2]);
          const z = parseFloat(parts[3]);
          this.groups[this.groups.length - 1].vn.push(new Vec3(x, y, z));
          break;
        }
        case 'vt': {
          // Vertex texture coordinate
          const u = parseFloat(parts[1]);
          const v = parseFloat(parts[2]);
          this.groups[this.groups.length - 1].vt.push(new Vec2(u, v));
          break;
        }
        case 'f': {
          // Face definition
          const faceVertices: Vec3[] = parts.slice(1).map(part => {
            const indices = part.split('/').map(idx => parseInt(idx, 10));
            return new Vec3(
                indices[0],       // vertex index
                indices[1] || 0,  // texture index
                indices[2] || 0   // normal index
            );
          });
          this.groups[this.groups.length - 1].f.push({f: faceVertices});
          break;
        }
          // Handle other prefixes as needed
      }
    }

    console.log('OBJ Mesh parsed.', this.groups);
  }

  async toGLBuffer(): Promise<glBuffer> {
    // Convert the parsed OBJ data into WebGL buffers
    // This is a simplified example; real implementation would be more complex
    const positions: number[] = [];
    const normals: number[] = [];
    const texcoords: number[] = [];
    const indices: number[] = [];

    let indexOffset = 0;

    for (const group of this.groups) {
      for (const face of group.f) {
        for (const vertex of face.f) {
          const vIdx = vertex.x - 1;  // OBJ indices are 1-based
          const vtIdx = vertex.y - 1;
          const vnIdx = vertex.z - 1;

          const position = group.v[vIdx];
          positions.push(position.x, position.y, position.z);

          if (vnIdx >= 0) {
            const normal = group.vn[vnIdx];
            normals.push(normal.x, normal.y, normal.z);
          }

          if (vtIdx >= 0) {
            const texcoord = group.vt[vtIdx];
            texcoords.push(texcoord.u, texcoord.v);
          }

          indices.push(indexOffset++);
        }
      }
    }

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      texcoords: new Float32Array(texcoords),
      indices: new Uint16Array(indices),
    };
  }
}

class Mesh {
  id: string;
  path: string;
  objMesh: ObjMesh|null = null;

  // gl buffers
  gl: WebGLRenderingContext;
  positionBuffer: WebGLBuffer|null = null;
  normalBuffer: WebGLBuffer|null = null;
  texcoordBuffer: WebGLBuffer|null = null;
  indexBuffer: WebGLBuffer|null = null;
  indexCount: number = 0;

  constructor(id: string, path: string, gl: WebGLRenderingContext) {
    this.id = id;
    this.path = path;
    this.gl = gl;
  }

  async load() {
    // fetch the OBJ file and parse it
    let response = await fetch(this.path);
    if (!response.ok) {
      throw new Error(
          `Failed to load mesh from ${this.path}: ${response.statusText}`);
    }
    let objData = await response.text();
    this.objMesh = new ObjMesh(objData);

    // load to gpu
    let glBuffer = await this.objMesh.toGLBuffer();

    // positions
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(
        this.gl.ARRAY_BUFFER, glBuffer.positions, this.gl.STATIC_DRAW);

    // normals
    this.normalBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
    this.gl.bufferData(
        this.gl.ARRAY_BUFFER, glBuffer.normals, this.gl.STATIC_DRAW);

    // texcoords
    this.texcoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
    this.gl.bufferData(
        this.gl.ARRAY_BUFFER, glBuffer.texcoords, this.gl.STATIC_DRAW);

    // indices
    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(
        this.gl.ELEMENT_ARRAY_BUFFER, glBuffer.indices, this.gl.STATIC_DRAW);

    this.indexCount = glBuffer.indices.length;


    console.log(`Mesh ${this.id} loaded from ${this.path}`);
  }

  async draw(program: WebGLProgram) {
    const gl = this.gl;

    gl.useProgram(program);

    // positions
    const posLoc = gl.getAttribLocation(program, 'aPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    // normals
    const normalLoc = gl.getAttribLocation(program, 'aNormal');
    if (normalLoc >= 0 && this.normalBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.enableVertexAttribArray(normalLoc);
      gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    }

    // texcoords
    const texLoc = gl.getAttribLocation(program, 'aTexcoord');
    if (texLoc >= 0 && this.texcoordBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
      gl.enableVertexAttribArray(texLoc);
      gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);
    }

    // indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  }
}

export default Mesh;