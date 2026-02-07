import './style.css';
import { createScene } from './scene/createScene.js';
import { createEntity } from './scene/createEntity.js';
import { createParticleField } from './scene/createParticleField.js';
import { createPostProcessing } from './scene/postProcessing.js';
import { createAnimationLoop } from './scene/animate.js';
import { createMouseTracker } from './interaction/mouseTracker.js';
import { createMessageSystem } from './text/messageSystem.js';
import { createHiddenTriggers } from './interaction/hiddenTriggers.js';
import { createAudioController } from './interaction/audioController.js';

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  || window.innerWidth < 768;

// Scene
const { scene, camera, renderer } = createScene();

// Entity
const entity = createEntity(scene, isMobile);

// Particles + neural web
const particles = createParticleField(scene, isMobile);

// Post-processing
const postProcessing = createPostProcessing(renderer, scene, camera, isMobile);

// Interaction
const mouseTracker = createMouseTracker();
const audioController = createAudioController();

// Message system — reactions trigger entity + particles + audio
const messageSystem = createMessageSystem((opts) => {
  entity.react(opts);
  if (opts.pulse > 0.4) {
    const burstColor = opts.emotion ? entity.getEmotionBurstColor() : 0x00ffe0;
    particles.triggerBurst(burstColor);
    audioController.glitchBurst();
  }
  // Emotion-triggered burst (even at lower pulse levels)
  if (opts.emotion && opts.pulse <= 0.4) {
    particles.triggerBurst(entity.getEmotionBurstColor());
  }
});

const hiddenTriggers = createHiddenTriggers(messageSystem, entity);

// Animation loop
const animate = createAnimationLoop({
  entity,
  particles,
  postProcessing,
  camera,
  mouseTracker,
  messageSystem,
  hiddenTriggers,
  audioController,
  isMobile,
});

animate();
