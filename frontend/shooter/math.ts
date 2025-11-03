class Vec3 {
  x: number;
  y: number;
  z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

class Vec2 {
  u: number
  v: number

  constructor(u: number, v: number) {
    this.u = u;
    this.v = v;
  }
}

class mat4 {
  elements: number[];

  constructor(fillValue?: number) {
    if (typeof fillValue === 'number') {
      this.elements = new Array(16).fill(fillValue);
    } else {
      // default to identity matrix
      this.elements = new Array(16).fill(0);
      this.elements[0] = 1;
      this.elements[5] = 1;
      this.elements[10] = 1;
      this.elements[15] = 1;
    }
  }

  multiplyMatrix(b: mat4): mat4 {
    const a = this;
    const ae = a.elements;
    const be = b.elements;
    const result = new mat4();
    const re = result.elements;

    // column-major multiplication: re[col*4 + row] = sum_k ae[k*4 + row] *
    // be[col*4 + k]
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          sum += ae[k * 4 + row] * be[col * 4 + k];
        }
        re[col * 4 + row] = sum;
      }
    }

    return result;
  }

  translate(v: Vec3): mat4 {
    const t = new mat4();
    const te = t.elements;

    // identity
    te[0] = 1;
    te[5] = 1;
    te[10] = 1;
    te[15] = 1;
    // translation in column-major is indices 12,13,14
    te[12] = v.x;
    te[13] = v.y;
    te[14] = v.z;

    return this.multiplyMatrix(t);
  }

  rotate(angleRad: number, axis: Vec3): mat4 {
    const x = axis.x;
    const y = axis.y;
    const z = axis.z;
    const len = Math.hypot(x, y, z);
    if (len === 0) return this;  // cannot rotate around zero vector

    const nx = x / len;
    const ny = y / len;
    const nz = z / len;

    const c = Math.cos(angleRad);
    const s = Math.sin(angleRad);
    const t = 1 - c;

    // 3x3 rotation matrix components (Rodrigues), then placed into 4x4
    // column-major
    const r = new mat4();
    const re = r.elements;

    re[0] = t * nx * nx + c;
    re[1] = t * nx * ny - s * nz;
    re[2] = t * nx * nz + s * ny;
    re[3] = 0;

    re[4] = t * nx * ny + s * nz;
    re[5] = t * ny * ny + c;
    re[6] = t * ny * nz - s * nx;
    re[7] = 0;

    re[8] = t * nx * nz - s * ny;
    re[9] = t * ny * nz + s * nx;
    re[10] = t * nz * nz + c;
    re[11] = 0;

    re[12] = 0;
    re[13] = 0;
    re[14] = 0;
    re[15] = 1;

    return this.multiplyMatrix(r);
  }
  rotateX(angleRad: number): mat4 {
    return this.rotate(angleRad, new Vec3(1, 0, 0));
  }
  rotateY(angleRad: number): mat4 {
    return this.rotate(angleRad, new Vec3(0, 1, 0));
  }
  rotateZ(angleRad: number): mat4 {
    return this.rotate(angleRad, new Vec3(0, 0, 1));
  }

  perspective(fovRad: number, aspect: number, near: number, far: number): mat4 {
    const f = 1.0 / Math.tan(fovRad / 2);
    const nf = 1 / (near - far);

    const p = new mat4();
    const pe = p.elements;

    pe[0] = f / aspect;
    pe[1] = 0;
    pe[2] = 0;
    pe[3] = 0;

    pe[4] = 0;
    pe[5] = f;
    pe[6] = 0;
    pe[7] = 0;

    pe[8] = 0;
    pe[9] = 0;
    pe[10] = (far + near) * nf;
    pe[11] = -1;

    pe[12] = 0;
    pe[13] = 0;
    pe[14] = (2 * far * near) * nf;
    pe[15] = 0;

    return this.multiplyMatrix(p);
  }
}

export {Vec3, Vec2, mat4};