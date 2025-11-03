#ifdef GL_ES
precision highp float;
#endif

varying vec3 vNormal;
varying vec2 vUv;

void main() {
    vec2 clampedUv = clamp(vUv, 0., 1.);
    gl_FragColor = vec4(clampedUv, 1., 1.);
}