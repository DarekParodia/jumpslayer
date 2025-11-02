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
}

class Mesh {
  id: string;
  path: string;
  objMesh: ObjMesh|null = null;

  constructor(id: string, path: string) {
    this.id = id;
    this.path = path;
  }

  load() {
    // fetch the OBJ file and parse it
    return fetch(this.path)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load mesh from ${this.path}`);
          }
          return response.text();
        })
        .then(data => {
          this.objMesh = new ObjMesh(data);
        })
        .catch(error => {
          console.error('Error loading mesh:', error);
        });
  }
}

export default Mesh;