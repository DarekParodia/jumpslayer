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

export {Vec3, Vec2};