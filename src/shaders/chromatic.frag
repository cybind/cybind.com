uniform sampler2D tDiffuse;
uniform float uOffset;

varying vec2 vUv;

void main() {
  vec2 dir = vUv - vec2(0.5);
  float dist = length(dir);
  float offset = uOffset * dist;

  float r = texture2D(tDiffuse, vUv + dir * offset).r;
  float g = texture2D(tDiffuse, vUv).g;
  float b = texture2D(tDiffuse, vUv - dir * offset).b;

  gl_FragColor = vec4(r, g, b, 1.0);
}
