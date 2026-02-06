import * as THREE from 'three';
import neuralWebVert from '../shaders/neuralWeb.vert';
import neuralWebFrag from '../shaders/neuralWeb.frag';

export function createParticleField(scene, isMobile) {
  const group = new THREE.Group();

  // === Star field ===
  const starCount = isMobile ? 800 : 2500;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    const r = 8 + Math.random() * 25;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos[i3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i3 + 2] = r * Math.cos(phi);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0x8899cc,
    size: 0.02,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  group.add(stars);

  // === Nebula particles (warm + cool colors mixed) ===
  const nebulaCount = isMobile ? 200 : 600;
  const nebulaGeo = new THREE.BufferGeometry();
  const nebulaPos = new Float32Array(nebulaCount * 3);
  const nebulaColors = new Float32Array(nebulaCount * 3);
  const nebulaVelocities = new Float32Array(nebulaCount * 3);

  const palette = [
    [0.0, 0.8, 0.75],   // cyan
    [0.0, 0.6, 0.55],   // teal
    [0.4, 0.2, 0.8],    // purple
    [0.8, 0.3, 0.1],    // warm amber
    [0.15, 0.05, 0.4],  // deep violet
    [0.9, 0.1, 0.2],    // red accent
  ];

  for (let i = 0; i < nebulaCount; i++) {
    const i3 = i * 3;
    const r = 2.5 + Math.random() * 7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    nebulaPos[i3] = r * Math.sin(phi) * Math.cos(theta);
    nebulaPos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    nebulaPos[i3 + 2] = r * Math.cos(phi);

    const c = palette[Math.floor(Math.random() * palette.length)];
    nebulaColors[i3] = c[0];
    nebulaColors[i3 + 1] = c[1];
    nebulaColors[i3 + 2] = c[2];

    nebulaVelocities[i3] = (Math.random() - 0.5) * 0.003;
    nebulaVelocities[i3 + 1] = (Math.random() - 0.5) * 0.003;
    nebulaVelocities[i3 + 2] = (Math.random() - 0.5) * 0.003;
  }

  nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));
  nebulaGeo.setAttribute('color', new THREE.BufferAttribute(nebulaColors, 3));

  const nebula = new THREE.Points(nebulaGeo, new THREE.PointsMaterial({
    size: isMobile ? 0.06 : 0.04,
    transparent: true,
    opacity: 0.35,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  group.add(nebula);

  // === Neural network nodes + connections ===
  const nodeCount = isMobile ? 30 : 60;
  const nodes = [];
  for (let i = 0; i < nodeCount; i++) {
    const r = 3.5 + Math.random() * 5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    nodes.push(new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    ));
  }

  const nodeGeo = new THREE.BufferGeometry();
  const nodePos = new Float32Array(nodeCount * 3);
  nodes.forEach((n, i) => {
    nodePos[i * 3] = n.x;
    nodePos[i * 3 + 1] = n.y;
    nodePos[i * 3 + 2] = n.z;
  });
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
  group.add(new THREE.Points(nodeGeo, new THREE.PointsMaterial({
    color: 0x00ccaa,
    size: 0.05,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })));

  // Connections
  const maxDist = 4;
  const connections = [];
  const linePos = [];
  const lineAlphas = [];
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      const dist = nodes[i].distanceTo(nodes[j]);
      if (dist < maxDist) {
        connections.push({ from: i, to: j });
        linePos.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
        const alpha = 1.0 - dist / maxDist;
        lineAlphas.push(alpha, alpha);
      }
    }
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
  lineGeo.setAttribute('aAlpha', new THREE.Float32BufferAttribute(lineAlphas, 1));
  group.add(new THREE.LineSegments(lineGeo, new THREE.ShaderMaterial({
    vertexShader: neuralWebVert,
    fragmentShader: neuralWebFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })));

  // Synaptic pulses
  const pulseCount = isMobile ? 5 : 12;
  const pulseGeo = new THREE.BufferGeometry();
  const pulsePos = new Float32Array(pulseCount * 3);
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
  const pulseDots = new THREE.Points(pulseGeo, new THREE.PointsMaterial({
    color: 0x00ffe0,
    size: 0.08,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  group.add(pulseDots);

  const pulses = [];
  for (let i = 0; i < pulseCount; i++) {
    pulses.push({ active: false, connIdx: 0, progress: 0, speed: 0.5 + Math.random(), nextFire: Math.random() * 3 });
  }

  // === Burst particles (triggered on events) ===
  const burstCount = isMobile ? 40 : 80;
  const burstGeo = new THREE.BufferGeometry();
  const burstPos = new Float32Array(burstCount * 3);
  const burstVel = new Float32Array(burstCount * 3);
  const burstLife = new Float32Array(burstCount);
  burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));

  const burstMat = new THREE.PointsMaterial({
    color: 0x00ffe0,
    size: 0.04,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const burstPoints = new THREE.Points(burstGeo, burstMat);
  group.add(burstPoints);

  let burstActive = false;

  function triggerBurst(color = 0x00ffe0) {
    burstMat.color.setHex(color);
    burstMat.opacity = 0.8;
    burstActive = true;

    for (let i = 0; i < burstCount; i++) {
      const i3 = i * 3;
      burstPos[i3] = 0;
      burstPos[i3 + 1] = 0;
      burstPos[i3 + 2] = 0;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 2 + Math.random() * 4;
      burstVel[i3] = Math.sin(phi) * Math.cos(theta) * speed;
      burstVel[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      burstVel[i3 + 2] = Math.cos(phi) * speed;
      burstLife[i] = 1.0;
    }
    burstGeo.attributes.position.needsUpdate = true;
  }

  scene.add(group);

  function update(time, delta) {
    // Slow rotation
    group.rotation.y += delta * 0.008;
    group.rotation.x += delta * 0.004;

    // Nebula drift
    const nPos = nebulaGeo.attributes.position.array;
    for (let i = 0; i < nebulaCount; i++) {
      const i3 = i * 3;
      nPos[i3] += nebulaVelocities[i3];
      nPos[i3 + 1] += nebulaVelocities[i3 + 1];
      nPos[i3 + 2] += nebulaVelocities[i3 + 2];
      // Gentle orbit
      const x = nPos[i3], z = nPos[i3 + 2];
      const a = 0.0002;
      nPos[i3] = x * Math.cos(a) - z * Math.sin(a);
      nPos[i3 + 2] = x * Math.sin(a) + z * Math.cos(a);
    }
    nebulaGeo.attributes.position.needsUpdate = true;

    // Synaptic pulses
    const pPos = pulseGeo.attributes.position.array;
    for (let i = 0; i < pulseCount; i++) {
      const p = pulses[i];
      if (!p.active) {
        p.nextFire -= delta;
        if (p.nextFire <= 0 && connections.length > 0) {
          p.active = true;
          p.connIdx = Math.floor(Math.random() * connections.length);
          p.progress = 0;
        }
        pPos[i * 3 + 2] = -100;
        continue;
      }
      p.progress += delta * p.speed;
      if (p.progress >= 1) {
        p.active = false;
        p.nextFire = 0.5 + Math.random() * 2;
        continue;
      }
      const c = connections[p.connIdx];
      const from = nodes[c.from], to = nodes[c.to];
      const t = p.progress;
      pPos[i * 3] = from.x + (to.x - from.x) * t;
      pPos[i * 3 + 1] = from.y + (to.y - from.y) * t;
      pPos[i * 3 + 2] = from.z + (to.z - from.z) * t;
    }
    pulseGeo.attributes.position.needsUpdate = true;

    // Burst animation
    if (burstActive) {
      let allDead = true;
      for (let i = 0; i < burstCount; i++) {
        if (burstLife[i] <= 0) continue;
        allDead = false;
        const i3 = i * 3;
        burstLife[i] -= delta * 1.5;
        burstPos[i3] += burstVel[i3] * delta;
        burstPos[i3 + 1] += burstVel[i3 + 1] * delta;
        burstPos[i3 + 2] += burstVel[i3 + 2] * delta;
        // Slow down
        burstVel[i3] *= 0.97;
        burstVel[i3 + 1] *= 0.97;
        burstVel[i3 + 2] *= 0.97;
      }
      burstGeo.attributes.position.needsUpdate = true;
      burstMat.opacity = Math.max(0, burstMat.opacity - delta * 0.8);
      if (allDead || burstMat.opacity <= 0) {
        burstActive = false;
        burstMat.opacity = 0;
      }
    }
  }

  return { group, update, triggerBurst };
}
