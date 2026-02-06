varying float vAlpha;

void main() {
  vec3 color = vec3(0.0, 0.6, 0.55);
  gl_FragColor = vec4(color, vAlpha * 0.15);
}
