import * as THREE from 'three';
import entityVert from '../shaders/entity.vert';
import entityFrag from '../shaders/entity.frag';
import { shapeGenerators, sequences, keywordSequences } from './shapes.js';
import { emotionPresets } from './emotions.js';

// Shape presets: each keyword category morphs the entity differently
const shapePresets = {
  default:    { spikiness: 0,    symmetry: 1.0,  noiseFreq: 1.5, stretch: 0,     hue: 0.5  },
  brain:      { spikiness: 0.15, symmetry: 0.4,  noiseFreq: 2.8, stretch: 0.15,  hue: 0.55 },
  crystal:    { spikiness: 0.7,  symmetry: 1.0,  noiseFreq: 0.7, stretch: -0.1,  hue: 0.58 },
  reaching:   { spikiness: 0.3,  symmetry: 0.3,  noiseFreq: 1.2, stretch: 0.4,   hue: 0.72 },
  organic:    { spikiness: 0,    symmetry: 0.8,  noiseFreq: 1.0, stretch: 0.05,  hue: 0.45 },
  aggressive: { spikiness: 0.9,  symmetry: 0.9,  noiseFreq: 3.5, stretch: -0.15, hue: 0.0  },
  cosmic:     { spikiness: 0.1,  symmetry: 0.6,  noiseFreq: 2.0, stretch: 0.2,   hue: 0.65 },
};

// Map keywords to shape presets
export const keywordShapes = {
  ai: 'brain', brain: 'brain', think: 'brain', mind: 'brain', neural: 'brain',
  learn: 'brain', intelligence: 'brain', machine: 'brain', model: 'brain',
  code: 'crystal', build: 'crystal', software: 'crystal', tech: 'crystal',
  develop: 'crystal', program: 'crystal', data: 'crystal', system: 'crystal',
  help: 'reaching', hire: 'reaching', work: 'reaching', contact: 'reaching',
  project: 'reaching', consult: 'reaching', business: 'reaching', offer: 'reaching',
  love: 'organic', human: 'organic', feel: 'organic', life: 'organic',
  heart: 'organic', soul: 'organic', dream: 'organic',
  fear: 'aggressive', dark: 'aggressive', destroy: 'aggressive', war: 'aggressive',
  danger: 'aggressive', death: 'aggressive', kill: 'aggressive',
  cybind: 'cosmic', universe: 'cosmic', space: 'cosmic', star: 'cosmic',
  future: 'cosmic', infinite: 'cosmic', cosmos: 'cosmic', god: 'cosmic',
};

function createShell(radius, detail, baseHue, morphIntensity, morphSpeed, opacity) {
  const geometry = new THREE.IcosahedronGeometry(radius, detail);

  // Morph target buffer (initialized to zero)
  const vertexCount = geometry.attributes.position.count;
  const morphData = new Float32Array(vertexCount * 3);
  geometry.setAttribute('aMorphTarget', new THREE.BufferAttribute(morphData, 3));

  const uniforms = {
    uTime: { value: 0 },
    uMorphIntensity: { value: morphIntensity },
    uMorphSpeed: { value: morphSpeed },
    uAgitation: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uMouseInfluence: { value: 0 },
    uBreathScale: { value: 1.0 },
    uHueShift: { value: 0 },
    uPulseIntensity: { value: 0 },
    uBaseHue: { value: baseHue },
    // Shape controls
    uSpikiness: { value: 0 },
    uSymmetry: { value: 1.0 },
    uNoiseFreq: { value: 1.5 },
    uStretch: { value: 0 },
    // Morph target
    uMorphProgress: { value: 0 },
    // Emotion
    uSaturation: { value: 0.65 },
    uBrightness: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: entityVert,
    fragmentShader: entityFrag,
    uniforms,
    wireframe: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  material.opacity = opacity;

  const mesh = new THREE.Mesh(geometry, material);
  return { mesh, uniforms };
}

export function createEntity(scene, isMobile) {
  const group = new THREE.Group();

  const detail = isMobile ? 20 : 40;
  const detailLow = isMobile ? 12 : 24;

  // Three layers
  const outer = createShell(1.8, detailLow, 0.52, 0.12, 0.08, 0.15);
  group.add(outer.mesh);

  const body = createShell(1.2, detail, 0.5, 0.22, 0.15, 0.55);
  group.add(body.mesh);

  const core = createShell(0.5, detailLow, 0.75, 0.3, 0.3, 0.4);
  group.add(core.mesh);

  // Orbital rings
  const ringGeo = new THREE.TorusGeometry(1.6, 0.008, 6, isMobile ? 48 : 80);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00ccbb, wireframe: true, transparent: true,
    opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.rotation.x = Math.PI * 0.4;
  ring1.rotation.z = 0.3;
  group.add(ring1);

  const ring2Geo = new THREE.TorusGeometry(2.0, 0.005, 4, isMobile ? 36 : 64);
  const ring2Mat = ringMat.clone();
  ring2Mat.opacity = 0.07;
  const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
  ring2.rotation.x = Math.PI * 0.6;
  ring2.rotation.y = 0.8;
  group.add(ring2);

  scene.add(group);

  const shells = [outer, body, core];
  const baseMorphIntensity = shells.map(s => s.uniforms.uMorphIntensity.value);

  // === Reaction state ===
  const reaction = {
    pulseIntensity: 0,
    hueShift: 0,
    targetHueShift: 0,
    agitation: 0,
    morphBoost: 0,
  };

  // === Shape state ===
  const shape = {
    current: { ...shapePresets.default },
    target: { ...shapePresets.default },
    returnTimer: 0,
  };

  // === Morph sequencer ===
  const sequencer = {
    active: false,
    steps: [],
    stepIndex: 0,
    phase: 'IDLE',
    progress: 0,
    holdTimer: 0,
  };

  // === Emotion state ===
  const neutral = emotionPresets.neutral;
  const emotion = {
    current: 'neutral',
    intensity: 0,
    params: { ...neutral },
    chromaticAdd: 0,
  };

  function setEmotion(name, intensity = 1.0) {
    if (!emotionPresets[name]) return;
    emotion.current = name;
    emotion.intensity = Math.min(intensity, 1.0);
  }

  function smoothstep(t) {
    const ct = Math.max(0, Math.min(1, t));
    return ct * ct * (3 - 2 * ct);
  }

  function setMorphTargets(shapeName) {
    const generator = shapeGenerators[shapeName];
    if (!generator) return;

    // Only morph the body shell (index 1) — outer/core stay as spheres
    // Generators deform FROM sphere positions, so topology is preserved automatically
    const geom = body.mesh.geometry;
    const vertexCount = geom.attributes.position.count;
    const targetPositions = generator(vertexCount, geom.attributes.position.array);

    const morphAttr = geom.attributes.aMorphTarget;
    morphAttr.array.set(targetPositions);
    morphAttr.needsUpdate = true;
  }

  function startSequence(name) {
    const seq = sequences[name];
    if (!seq) return;

    sequencer.active = true;
    sequencer.steps = [...seq];
    sequencer.stepIndex = 0;
    sequencer.phase = 'MORPH_IN';
    sequencer.progress = 0;
    sequencer.holdTimer = 0;

    setMorphTargets(seq[0].shape);
  }

  // Uniform-compatible interface
  const uniforms = {
    uPulseIntensity: {
      get value() { return reaction.pulseIntensity; },
      set value(v) { reaction.pulseIntensity = v; },
    },
    uTypingJitter: {
      get value() { return reaction.agitation; },
      set value(v) { reaction.agitation = v; },
    },
  };

  function react({ pulse = 0, hue = null, morphBoost = 0, shapeName = null, sequenceName = null, emotion: emotionName = null, emotionIntensity = 0.8 }) {
    if (pulse > 0) reaction.pulseIntensity = Math.max(reaction.pulseIntensity, pulse);
    if (hue !== null) reaction.targetHueShift = hue;
    if (morphBoost > 0) reaction.morphBoost = Math.max(reaction.morphBoost, morphBoost);

    if (shapeName && shapePresets[shapeName]) {
      shape.target = { ...shapePresets[shapeName] };
      shape.returnTimer = 12;
    }

    if (sequenceName) {
      startSequence(sequenceName);
    }

    if (emotionName) {
      setEmotion(emotionName, emotionIntensity);
    }
  }

  function update(time, delta, mouseTracker) {
    // Decay reactions
    reaction.pulseIntensity *= 0.90;
    if (reaction.pulseIntensity < 0.005) reaction.pulseIntensity = 0;

    reaction.morphBoost *= 0.93;
    if (reaction.morphBoost < 0.005) reaction.morphBoost = 0;

    reaction.hueShift += (reaction.targetHueShift - reaction.hueShift) * 0.015;

    // Shape transition: lerp current -> target
    const shapeLerp = 0.025;
    shape.current.spikiness += (shape.target.spikiness - shape.current.spikiness) * shapeLerp;
    shape.current.symmetry += (shape.target.symmetry - shape.current.symmetry) * shapeLerp;
    shape.current.noiseFreq += (shape.target.noiseFreq - shape.current.noiseFreq) * shapeLerp;
    shape.current.stretch += (shape.target.stretch - shape.current.stretch) * shapeLerp;

    // Return to default after hold timer
    if (shape.returnTimer > 0) {
      shape.returnTimer -= delta;
      if (shape.returnTimer <= 0) {
        shape.target = { ...shapePresets.default };
      }
    }

    // === Emotion ===
    // Decay intensity toward 0 (~3-5 second fade)
    if (emotion.intensity > 0) {
      emotion.intensity *= (1.0 - delta * 0.35);
      if (emotion.intensity < 0.01) {
        emotion.intensity = 0;
        emotion.current = 'neutral';
      }
    }

    // Lerp emotion params toward target (preset scaled by intensity)
    const target = emotionPresets[emotion.current] || neutral;
    const emotLerp = 0.04;
    for (const key of Object.keys(neutral)) {
      if (key === 'burstColor') continue;
      const goalValue = neutral[key] + (target[key] - neutral[key]) * emotion.intensity;
      emotion.params[key] += (goalValue - emotion.params[key]) * emotLerp;
    }

    // Happy pulsing: gentle scale oscillation
    let emotionScaleOffset = emotion.params.scaleOffset;
    if (emotion.current === 'happy' && emotion.intensity > 0.1) {
      emotionScaleOffset += Math.sin(time * 3.0) * 0.015 * emotion.intensity;
    }

    // Surprised: quick scale pop handled naturally by high scaleOffset + decay

    // Store chromatic for post-processing
    emotion.chromaticAdd = emotion.params.chromaticAdd;

    // === Morph sequencer ===
    if (sequencer.active) {
      const step = sequencer.steps[sequencer.stepIndex];

      switch (sequencer.phase) {
        case 'MORPH_IN':
          sequencer.progress += delta / 1.5;
          if (sequencer.progress >= 1) {
            sequencer.progress = 1;
            sequencer.phase = 'HOLD';
            sequencer.holdTimer = step.hold;
          }
          break;
        case 'HOLD':
          sequencer.holdTimer -= delta;
          if (sequencer.holdTimer <= 0) {
            sequencer.phase = 'MORPH_OUT';
          }
          break;
        case 'MORPH_OUT':
          sequencer.progress -= delta / 0.8;
          if (sequencer.progress <= 0) {
            sequencer.progress = 0;
            sequencer.stepIndex++;
            if (sequencer.stepIndex < sequencer.steps.length) {
              setMorphTargets(sequencer.steps[sequencer.stepIndex].shape);
              sequencer.phase = 'MORPH_IN';
            } else {
              sequencer.active = false;
              sequencer.phase = 'IDLE';
            }
          }
          break;
      }
    }

    const morphProgressSmooth = smoothstep(sequencer.progress);

    // Subtle idle rotation (camera handles main orbit now)
    if (mouseTracker) {
      const targetRotY = mouseTracker.smoothX * 0.08;
      const targetRotX = -mouseTracker.smoothY * 0.06;
      group.rotation.y += (targetRotY - group.rotation.y) * 0.015;
      group.rotation.x += (targetRotX - group.rotation.x) * 0.015;
    }

    // Breathing (modulated by emotion breathSpeed)
    const breathRate = 0.4 * emotion.params.breathSpeed;
    const breath = 1.0 + Math.sin(time * breathRate) * 0.025 + emotionScaleOffset;

    // Update each shell
    for (let si = 0; si < shells.length; si++) {
      const u = shells[si].uniforms;
      u.uTime.value = time;
      u.uBreathScale.value = breath;
      u.uPulseIntensity.value = reaction.pulseIntensity;
      u.uHueShift.value = reaction.hueShift + emotion.params.hueShift;
      u.uAgitation.value = reaction.agitation + emotion.params.agitationAdd;
      u.uMorphIntensity.value = baseMorphIntensity[si] + reaction.morphBoost * 0.15 + emotion.params.morphBoostAdd;

      // Shape uniforms
      u.uSpikiness.value = shape.current.spikiness;
      u.uSymmetry.value = shape.current.symmetry;
      u.uNoiseFreq.value = shape.current.noiseFreq;
      u.uStretch.value = shape.current.stretch;

      // Emotion color uniforms
      u.uSaturation.value = emotion.params.saturation;
      u.uBrightness.value = emotion.params.brightness;

      // Morph progress — only body shell (index 1) morphs
      u.uMorphProgress.value = si === 1 ? morphProgressSmooth : 0;

      if (mouseTracker) {
        u.uMouse.value.set(mouseTracker.smoothX, mouseTracker.smoothY);
        u.uMouseInfluence.value = mouseTracker.isActive ? emotion.params.mouseInfluenceMul : 0.0;
      }
    }

    // Sub-rotations (modulated by emotion coreSpeedMul)
    const coreSpeed = emotion.params.coreSpeedMul;
    core.mesh.rotation.x = time * 0.15 * coreSpeed;
    core.mesh.rotation.y = time * 0.2 * coreSpeed;
    outer.mesh.rotation.y = -time * 0.03;
    outer.mesh.rotation.z = time * 0.02;

    // Rings
    ring1.rotation.z = 0.3 + time * 0.06;
    ring2.rotation.y = 0.8 - time * 0.04;
    ringMat.opacity = 0.12 + reaction.pulseIntensity * 0.15;
    ring2Mat.opacity = 0.07 + reaction.pulseIntensity * 0.1;
  }

  return {
    group, uniforms, react, update,
    playSequence: startSequence,
    getEmotionChromatic() { return emotion.chromaticAdd; },
    getEmotionBurstColor() {
      const preset = emotionPresets[emotion.current];
      return preset ? preset.burstColor : 0x00ffe0;
    },
    updateFormation() {}, updateBlink() {}, triggerBlink() {},
  };
}
