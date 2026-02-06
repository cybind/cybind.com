// shapes.js
// Sphere-deformation generators — each takes (count, spherePositions, scale)
// Vertices are mapped FROM sphere positions to preserve wireframe topology.
// Sphere's horizontal angle (theta) → position along the shape's curve
// Sphere's vertical position (ny) → depth/thickness of the 3D shape

function getDir(sPos, i) {
  const x = sPos[i * 3], y = sPos[i * 3 + 1], z = sPos[i * 3 + 2];
  const len = Math.sqrt(x * x + y * y + z * z) || 1;
  return [x / len, y / len, z / len];
}

// Heart: parametric heart curve with lenticular depth
export function heartShape(count, sPos, scale = 1.2) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [nx, ny, nz] = getDir(sPos, i);

    // Sphere horizontal angle → heart curve parameter (0 to 2PI)
    const t = Math.atan2(nx, nz) + Math.PI;

    // Classic heart parametric curve
    const sint = Math.sin(t);
    const hx = sint * sint * sint;
    const rawY = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const hy = (rawY + 5) / 17;

    // Lenticular depth — thicker in the middle of the shape, thinner at edges
    const curveR = Math.sqrt(hx * hx + hy * hy);
    const thickness = 0.4 * Math.pow(Math.max(curveR, 0.1), 0.5);

    out[i * 3]     = hx * scale;
    out[i * 3 + 1] = hy * scale;
    out[i * 3 + 2] = ny * thickness * scale;
  }
  return out;
}

// Human: Vitruvian Man — parametric outline with Catmull-Rom spline
// Sphere horizontal angle traces the silhouette, ny controls depth.

// Vitruvian outline control points — closed loop
// The curve is parameterized [0, 1) tracing clockwise from the right leg.
const _vitruvianPts = [
  // t,    x,     y        — clockwise from right foot
  [0.000,  0.32, -0.95],   // right foot tip
  [0.035,  0.22, -0.55],   // right shin
  [0.065,  0.20, -0.20],   // right knee
  [0.090,  0.16, -0.05],   // right hip
  [0.110,  0.14,  0.20],   // right waist
  [0.125,  0.16,  0.32],   // right armpit
  [0.160,  0.50,  0.36],   // right elbow
  [0.195,  0.92,  0.38],   // right fingertip
  [0.230,  0.50,  0.32],   // right elbow return
  [0.260,  0.16,  0.42],   // right shoulder
  [0.290,  0.08,  0.68],   // right neck
  [0.330,  0.12,  0.82],   // right head
  [0.370,  0.00,  0.92],   // crown
  [0.410, -0.12,  0.82],   // left head
  [0.450, -0.08,  0.68],   // left neck
  [0.480, -0.16,  0.42],   // left shoulder
  [0.510, -0.50,  0.32],   // left elbow return
  [0.545, -0.92,  0.38],   // left fingertip
  [0.580, -0.50,  0.36],   // left elbow
  [0.610, -0.16,  0.32],   // left armpit
  [0.630, -0.14,  0.20],   // left waist
  [0.650, -0.16, -0.05],   // left hip
  [0.675, -0.20, -0.20],   // left knee
  [0.705, -0.22, -0.55],   // left shin
  [0.735, -0.32, -0.95],   // left foot tip
  [0.790, -0.06, -0.95],   // left foot inner
  [0.845,  0.00, -0.15],   // crotch
  [0.900,  0.06, -0.95],   // right foot inner
  [0.955,  0.32, -0.95],   // right foot tip (closes to t=0)
];

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

function evalVitruvianOutline(tNorm) {
  const pts = _vitruvianPts;
  const n = pts.length;

  // tNorm ∈ [0, 1) — wrap
  const tClamped = ((tNorm % 1) + 1) % 1;

  // Find which segment we're in
  let seg = n - 1; // default: last segment wraps to first
  for (let s = 0; s < n - 1; s++) {
    if (tClamped >= pts[s][0] && tClamped < pts[s + 1][0]) {
      seg = s;
      break;
    }
  }

  // Compute local t within segment
  let segT;
  if (seg === n - 1) {
    // Wrap segment: from last point to first point
    const gap = 1.0 - pts[n - 1][0] + pts[0][0];
    const dt = tClamped >= pts[n - 1][0] ? tClamped - pts[n - 1][0] : tClamped + 1.0 - pts[n - 1][0];
    segT = dt / (gap || 0.001);
  } else {
    segT = (tClamped - pts[seg][0]) / (pts[seg + 1][0] - pts[seg][0] || 0.001);
  }

  // Catmull-Rom needs 4 points — wrap indices for closed loop
  const wrap = (idx) => ((idx % n) + n) % n;
  const i0 = wrap(seg - 1);
  const i1 = wrap(seg);
  const i2 = wrap(seg + 1);
  const i3 = wrap(seg + 2);

  const x = catmullRom(pts[i0][1], pts[i1][1], pts[i2][1], pts[i3][1], segT);
  const y = catmullRom(pts[i0][2], pts[i1][2], pts[i2][2], pts[i3][2], segT);

  return [x, y];
}

export function humanShape(count, sPos, scale = 1.1) {
  const out = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const [nx, ny, nz] = getDir(sPos, i);

    // Sphere horizontal angle → outline parameter [0, 1)
    const t = (Math.atan2(nx, nz) + Math.PI) / (2 * Math.PI);
    const [hx, hy] = evalVitruvianOutline(t);

    // Lenticular depth — thicker at body center, thinner at extremities
    const bodyDist = Math.sqrt(hx * hx + hy * hy);
    const thickness = 0.32 * Math.pow(Math.max(1.0 - bodyDist * 0.5, 0.12), 0.5);

    out[i * 3]     = hx * scale;
    out[i * 3 + 1] = hy * scale;
    out[i * 3 + 2] = ny * thickness * scale;
  }
  return out;
}

// DNA: double helix — two intertwined strands
export function dnaShape(count, sPos, scale = 1.2) {
  const out = new Float32Array(count * 3);
  const turns = 2.5;
  const helixR = 0.45;   // radius of helix
  const tubeR = 0.09;    // thickness of each strand

  for (let i = 0; i < count; i++) {
    const [nx, ny, nz] = getDir(sPos, i);

    // ny → height along the helix
    const yOut = ny * 1.6;
    const helixAngle = ny * turns * Math.PI * 2;

    // Sphere's horizontal angle → which strand + tube position
    const theta = Math.atan2(nz, nx);

    // Smooth strand assignment (avoids hard cut between strands)
    const strandBlend = Math.sin(theta) * 0.5 + 0.5; // 0..1
    const strandOffset = strandBlend > 0.5 ? Math.PI : 0;

    // Position on helix backbone
    const cx = Math.cos(helixAngle + strandOffset) * helixR;
    const cz = Math.sin(helixAngle + strandOffset) * helixR;

    // Local tube cross-section
    const localAngle = theta * 2;
    const tx = Math.cos(localAngle) * tubeR;
    const tz = Math.sin(localAngle) * tubeR;

    const radialLen = Math.max(Math.sqrt(cx * cx + cz * cz), 0.01);
    const radialX = cx / radialLen;
    const radialZ = cz / radialLen;

    out[i * 3]     = (cx + radialX * tx + tz * 0.3) * scale;
    out[i * 3 + 1] = yOut * scale;
    out[i * 3 + 2] = (cz + radialZ * tx - radialX * tz * 0.3) * scale;
  }
  return out;
}

// Cube: project sphere radially onto cube faces
export function cubeShape(count, sPos, scale = 1.2) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [nx, ny, nz] = getDir(sPos, i);
    const m = Math.max(Math.abs(nx), Math.abs(ny), Math.abs(nz)) || 1;
    const r = scale / m;
    out[i * 3]     = nx * r;
    out[i * 3 + 1] = ny * r;
    out[i * 3 + 2] = nz * r;
  }
  return out;
}

// Galaxy: spiral disc — sphere flattened into disc with visible spiral arms
export function galaxyShape(count, sPos, scale = 1.5) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [nx, ny, nz] = getDir(sPos, i);

    // Map sphere to disc: ny controls radial distance, theta stays
    const angle = Math.atan2(nz, nx);
    const r = (1.0 - Math.abs(ny)) * 1.2; // poles→center, equator→edge

    // Spiral arm: twist angle based on radius (logarithmic spiral)
    const armCount = 3;
    const spiralTwist = r * 4.0;
    const spiralAngle = angle + spiralTwist;

    // Arm intensity: how much to pull toward arm centers
    const armPhase = ((spiralAngle * armCount / (2 * Math.PI)) % 1 + 1) % 1;
    const armStrength = Math.pow(Math.cos(armPhase * Math.PI * 2) * 0.5 + 0.5, 2.0);

    // Radial modulation: arms are denser (push outward), gaps are thinner
    const armR = r * (0.85 + armStrength * 0.25);

    // Vertical wobble along arms + disc thickness
    const discThick = 0.04 * (1.0 - r * 0.7); // thinner at edges
    const armWobble = Math.sin(spiralAngle * armCount) * 0.06 * armStrength;
    const yOut = ny * discThick + armWobble;

    // Bright core: compress inner vertices
    const coreR = armR < 0.2 ? armR * 0.8 : armR;

    out[i * 3]     = Math.cos(angle) * coreR * scale;
    out[i * 3 + 1] = yOut * scale;
    out[i * 3 + 2] = Math.sin(angle) * coreR * scale;
  }
  return out;
}

// Infinity: parametric lemniscate (figure-8) with depth
export function infinityShape(count, sPos, scale = 1.3) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [nx, ny, nz] = getDir(sPos, i);

    // Sphere horizontal angle → lemniscate parameter
    const t = Math.atan2(nx, nz) + Math.PI;

    const sint = Math.sin(t), cost = Math.cos(t);
    const denom = 1 + sint * sint;

    const lx = cost / denom;
    const ly = sint * cost / denom;

    // Depth from sphere's vertical position
    const thickness = 0.35;

    out[i * 3]     = lx * scale * 1.6;
    out[i * 3 + 1] = ly * scale * 0.9;
    out[i * 3 + 2] = ny * thickness * scale;
  }
  return out;
}

// Small sphere: uniform scale down
export function smallSphereShape(count, sPos, scale = 0.5) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [nx, ny, nz] = getDir(sPos, i);
    out[i * 3]     = nx * scale;
    out[i * 3 + 1] = ny * scale;
    out[i * 3 + 2] = nz * scale;
  }
  return out;
}

// Tree: smooth trunk→canopy with organic taper
export function treeShape(count, sPos, scale = 1.3) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [nx, ny, nz] = getDir(sPos, i);

    // ny: -1 (roots) to +1 (crown)
    // Smooth width profile using a combination of functions
    const h = ny; // height parameter

    // Trunk region: smoothly narrow below, wide canopy above
    // Using smoothstep-like blending
    const trunkTop = -0.1;
    const canopyBot = 0.1;

    let w, yOut;

    if (h < trunkTop) {
      // Trunk: tapers slightly toward roots
      const trunkT = (h + 1) / (trunkTop + 1); // 0 at roots, 1 at trunk top
      const trunkW = 0.06 + trunkT * 0.04;
      // Roots flare
      const rootFlare = Math.max(0, 1 - trunkT * 3) * 0.08;
      w = trunkW + rootFlare;
      yOut = -0.4 + (h + 1) * 0.45;
    } else if (h < canopyBot) {
      // Smooth transition zone
      const blend = (h - trunkTop) / (canopyBot - trunkTop);
      const s = blend * blend * (3 - 2 * blend); // smoothstep
      w = 0.10 * (1 - s) + 0.55 * s;
      yOut = 0.0 + s * 0.15;
    } else {
      // Canopy: dome shape, widest in middle, tapers at top
      const canopyT = (h - canopyBot) / (1 - canopyBot); // 0 at bottom, 1 at crown
      // Dome profile: sine curve for natural canopy shape
      w = 0.55 * Math.sin(canopyT * Math.PI * 0.85 + 0.15) + 0.08;
      yOut = 0.15 + canopyT * 0.8;
      // Slight random-looking bumps on canopy edge
      const angle = Math.atan2(nz, nx);
      w += Math.sin(angle * 5 + canopyT * 3) * 0.06 * (1 - canopyT);
    }

    out[i * 3]     = nx * w * scale;
    out[i * 3 + 1] = yOut * scale;
    out[i * 3 + 2] = nz * w * scale;
  }
  return out;
}

// Animation sequences: array of { shape, hold } steps
export const sequences = {
  love: [
    { shape: 'heart', hold: 3.5 },
    { shape: 'smallSphere', hold: 1.5 },
    { shape: 'human', hold: 3 },
    { shape: 'heart', hold: 2.5 },
  ],
  ai: [
    { shape: 'dna', hold: 3 },
    { shape: 'galaxy', hold: 3 },
    { shape: 'infinity', hold: 2.5 },
  ],
  code: [
    { shape: 'cube', hold: 3 },
    { shape: 'dna', hold: 2.5 },
    { shape: 'cube', hold: 2 },
  ],
  cosmic: [
    { shape: 'infinity', hold: 3 },
    { shape: 'galaxy', hold: 3.5 },
  ],
  life: [
    { shape: 'tree', hold: 3 },
    { shape: 'dna', hold: 2.5 },
    { shape: 'heart', hold: 2.5 },
  ],
  hire: [
    { shape: 'human', hold: 2.5 },
    { shape: 'infinity', hold: 3 },
    { shape: 'cube', hold: 2 },
  ],
};

// Map keywords → sequence names
export const keywordSequences = {
  love: 'love', heart: 'love', feel: 'love', emotion: 'love', soul: 'love',
  ai: 'ai', brain: 'ai', think: 'ai', mind: 'ai', neural: 'ai',
  intelligence: 'ai', machine: 'ai', learn: 'ai', model: 'ai',
  code: 'code', build: 'code', software: 'code', tech: 'code',
  develop: 'code', program: 'code', data: 'code', system: 'code',
  cybind: 'cosmic', universe: 'cosmic', space: 'cosmic', star: 'cosmic',
  future: 'cosmic', infinite: 'cosmic', cosmos: 'cosmic', god: 'cosmic',
  life: 'life', grow: 'life', nature: 'life', alive: 'life', tree: 'life',
  human: 'life', dream: 'life',
  hire: 'hire', work: 'hire', help: 'hire', project: 'hire',
  consult: 'hire', business: 'hire', contact: 'hire', offer: 'hire',
};

// Shape generator lookup
export const shapeGenerators = {
  heart: heartShape,
  human: humanShape,
  dna: dnaShape,
  cube: cubeShape,
  galaxy: galaxyShape,
  infinity: infinityShape,
  smallSphere: smallSphereShape,
  tree: treeShape,
};
