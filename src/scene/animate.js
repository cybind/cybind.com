export function createAnimationLoop(ctx) {
  const { entity, particles, postProcessing, camera, mouseTracker, messageSystem, hiddenTriggers, isMobile } = ctx;
  const clock = { elapsed: 0, delta: 0, last: performance.now() };

  function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    clock.delta = Math.min((now - clock.last) / 1000, 0.1);
    clock.last = now;
    clock.elapsed += clock.delta;

    const time = clock.elapsed;
    const delta = clock.delta;

    // Mouse
    mouseTracker.update(delta);

    // Typing → agitation
    const isTyping = messageSystem.isTyping;
    const targetAgitation = isTyping ? 0.2 : 0;
    entity.uniforms.uTypingJitter.value +=
      (targetAgitation - entity.uniforms.uTypingJitter.value) * 0.1;

    // Entity
    entity.update(time, delta, mouseTracker);

    // Particles + neural web
    particles.update(time, delta);

    // Camera orbit (spherical coordinates around origin)
    const orbitRadius = isMobile ? 8.5 : 5;
    const autoTheta = time * (isMobile ? 0.025 : 0.06);
    const theta = autoTheta + mouseTracker.smoothX * 0.7;
    const phi = Math.PI * 0.5 - mouseTracker.smoothY * 0.35;
    const phiClamped = Math.max(0.3, Math.min(Math.PI - 0.3, phi));

    camera.position.x = orbitRadius * Math.sin(phiClamped) * Math.sin(theta);
    camera.position.y = orbitRadius * Math.cos(phiClamped);
    camera.position.z = orbitRadius * Math.sin(phiClamped) * Math.cos(theta);
    camera.lookAt(0, 0, 0);

    // Post-processing
    postProcessing.grainUniforms.uTime.value = time;
    const pulseChromatic = entity.uniforms.uPulseIntensity.value * 0.012;
    postProcessing.chromaticUniforms.uOffset.value = 0.002 + pulseChromatic;

    // Messages & triggers
    messageSystem.update(time);
    hiddenTriggers.update(time, mouseTracker);

    // Render
    postProcessing.composer.render();
  }

  return animate;
}
