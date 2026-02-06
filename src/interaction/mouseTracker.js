export function createMouseTracker() {
  const state = {
    rawX: 0,
    rawY: 0,
    smoothX: 0,
    smoothY: 0,
    velocityX: 0,
    velocityY: 0,
    isActive: false,
    interactionLevel: 0,
    idleTime: 0,
    lastMoveTime: 0,
    hasMoved: false,
    isErratic: false,
    prevRawX: 0,
    prevRawY: 0,
  };

  function onMouseMove(e) {
    state.prevRawX = state.rawX;
    state.prevRawY = state.rawY;
    state.rawX = (e.clientX / window.innerWidth) * 2 - 1;
    state.rawY = -(e.clientY / window.innerHeight) * 2 + 1;
    state.isActive = true;
    state.idleTime = 0;
    state.lastMoveTime = performance.now();

    if (!state.hasMoved) {
      state.hasMoved = true;
      state.onFirstMove?.();
    }
  }

  function onTouchMove(e) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      state.prevRawX = state.rawX;
      state.prevRawY = state.rawY;
      state.rawX = (touch.clientX / window.innerWidth) * 2 - 1;
      state.rawY = -(touch.clientY / window.innerHeight) * 2 + 1;
      state.isActive = true;
      state.idleTime = 0;
      state.lastMoveTime = performance.now();

      if (!state.hasMoved) {
        state.hasMoved = true;
        state.onFirstMove?.();
      }
    }
  }

  // DeviceMotion for mobile shake detection
  let shakeThreshold = 15;
  let lastShakeTime = 0;
  state.isShaking = false;

  function onDeviceMotion(e) {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;
    const total = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
    const now = performance.now();
    if (total > shakeThreshold && now - lastShakeTime > 1000) {
      lastShakeTime = now;
      state.isShaking = true;
      state.isErratic = true;
      state.isActive = true;
      state.idleTime = 0;
      if (!state.hasMoved) {
        state.hasMoved = true;
        state.onFirstMove?.();
      }
    }
  }

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('devicemotion', onDeviceMotion, { passive: true });

  state.update = function (delta) {
    // Reset shake flag each frame
    state.isShaking = false;
    // Smooth lerp
    state.smoothX += (state.rawX - state.smoothX) * 0.05;
    state.smoothY += (state.rawY - state.smoothY) * 0.05;

    // Velocity
    state.velocityX = state.rawX - state.prevRawX;
    state.velocityY = state.rawY - state.prevRawY;
    const speed = Math.sqrt(state.velocityX ** 2 + state.velocityY ** 2);

    // Erratic detection
    state.isErratic = speed > 0.08;

    // Idle tracking
    state.idleTime += delta;

    // Interaction level ramps with activity
    if (state.isActive && speed > 0.001) {
      state.interactionLevel = Math.min(state.interactionLevel + delta * 0.1, 1);
    } else {
      state.interactionLevel = Math.max(state.interactionLevel - delta * 0.02, 0);
    }
  };

  return state;
}
