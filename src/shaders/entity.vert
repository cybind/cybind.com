uniform float uTime;
uniform float uMorphIntensity;
uniform float uMorphSpeed;
uniform float uAgitation;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform float uBreathScale;

// Shape controls
uniform float uSpikiness;
uniform float uSymmetry;
uniform float uNoiseFreq;
uniform float uStretch;

// Morph target
attribute vec3 aMorphTarget;
uniform float uMorphProgress;

varying float vDisplacement;
varying vec3 vWorldPos;

// Simplex 3D noise
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  float f = 1.0;
  for (int i = 0; i < 4; i++) {
    v += a * snoise(p * f);
    a *= 0.5;
    f *= 2.0;
  }
  return v;
}

void main() {
  vec3 pos = position;

  // FBM displacement with adjustable frequency
  float t = uTime * uMorphSpeed;
  float noise = fbm(pos * uNoiseFreq + t);

  // Spikiness: sharpen the noise peaks
  noise = mix(noise, sign(noise) * pow(abs(noise), 0.4), uSpikiness);

  // Asymmetry: weight displacement by vertical position
  // symmetry=1.0 → even everywhere, symmetry=0.0 → concentrated on top
  float asymFactor = mix(0.3 + normalize(position).y * 0.9, 1.0, uSymmetry);

  // Reduce displacement during morph for cleaner wireframe shapes
  float morphedIntensity = uMorphIntensity * (1.0 - uMorphProgress * 0.8);
  float displacement = noise * morphedIntensity * asymFactor;

  // Vertical stretch: elongate or flatten the form
  pos.y *= 1.0 + uStretch * 0.3;

  // Mouse influence
  vec3 mouseDir = vec3(uMouse.x, uMouse.y, 0.5);
  float mouseDot = max(dot(normalize(pos), normalize(mouseDir)), 0.0);
  displacement += mouseDot * uMouseInfluence * 0.25;

  // Agitation
  if (uAgitation > 0.0) {
    displacement += snoise(pos * 10.0 + uTime * 20.0) * uAgitation * 0.06;
  }

  // Apply
  vec3 spherePos = pos * uBreathScale + normal * displacement;

  // Morph target blending
  vec3 targetPos = aMorphTarget * uBreathScale + normal * displacement;
  pos = mix(spherePos, targetPos, uMorphProgress);

  vDisplacement = displacement;
  vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
