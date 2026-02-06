uniform float uTime;
uniform float uHueShift;
uniform float uPulseIntensity;
uniform float uBaseHue;
uniform float uMorphProgress;

varying float vDisplacement;
varying vec3 vWorldPos;

vec3 hsl2rgb(float h, float s, float l) {
  vec3 rgb = clamp(
    abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0,
    0.0, 1.0
  );
  return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
}

void main() {
  // Base hue shifts with time and reaction
  float hue = uBaseHue + uHueShift + sin(uTime * 0.15) * 0.02;
  hue = fract(hue);

  // Saturation and lightness from displacement
  float sat = 0.65;
  float light = 0.35 + vDisplacement * 0.25;

  // Pulse flash (subtle)
  light += uPulseIntensity * 0.12;
  sat -= uPulseIntensity * 0.05;

  // Height-based variation
  float yFactor = vWorldPos.y * 0.03;
  hue = fract(hue + yFactor);

  vec3 color = hsl2rgb(hue, sat, light);

  // Slight emission boost for bloom to pick up
  color *= 1.0 + uPulseIntensity * 0.15;

  gl_FragColor = vec4(color, 0.55 + uPulseIntensity * 0.3);
}
