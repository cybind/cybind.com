export function createHiddenTriggers(messageSystem, entity) {
  const state = {
    firstMoveShown: false,
    idle15Shown: false,
    idle45Shown: false,
    entityClickShown: false,
  };

  // Entity click (near center of viewport)
  window.addEventListener('click', (e) => {
    if (state.entityClickShown) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < Math.min(window.innerWidth, window.innerHeight) * 0.2) {
      state.entityClickShown = true;
      entity.react({ pulse: 1.0, morphBoost: 0.4, hue: 0.85 });
      messageSystem.showReaction('entityClick');
    }
  });

  function update(time, mouseTracker) {
    if (mouseTracker.hasMoved && !state.firstMoveShown) {
      state.firstMoveShown = true;
      entity.react({ pulse: 0.3 });
      messageSystem.showReaction('firstMove');
    }

    if (mouseTracker.idleTime > 15 && !state.idle15Shown && mouseTracker.hasMoved) {
      state.idle15Shown = true;
      messageSystem.showReaction('idle15');
    }

    if (mouseTracker.idleTime > 45 && !state.idle45Shown && mouseTracker.hasMoved) {
      state.idle45Shown = true;
      messageSystem.showReaction('idle45');
    }
  }

  return { update };
}
