export function createAudioController() {
  let ctx = null;
  let masterGain = null;
  let started = false;
  let droneOscs = [];
  let noiseNode = null;

  function init() {
    if (started) return;
    started = true;

    ctx = new (window.AudioContext || window.webkitAudioContext)();

    masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);

    // Fade in
    masterGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 3);

    // Deep drone - detuned sine oscillators
    const droneFreqs = [55, 55.3, 82.5, 110.2];
    for (const freq of droneFreqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.04;
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      droneOscs.push({ osc, gain });
    }

    // Filtered noise shimmer
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 800;
    noiseFilter.Q.value = 2;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.008;

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseNode.start();

    // Slowly modulate filter
    function modulateFilter() {
      if (!ctx) return;
      const t = ctx.currentTime;
      noiseFilter.frequency.linearRampToValueAtTime(
        600 + Math.sin(t * 0.1) * 400,
        t + 0.1
      );
      requestAnimationFrame(modulateFilter);
    }
    modulateFilter();
  }

  function glitchBurst() {
    if (!ctx || !started) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 120 + Math.random() * 200;
    gain.gain.value = 0.06;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  // Start on first user interaction
  function tryStart() {
    if (!started) {
      init();
    } else if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  window.addEventListener('click', tryStart, { once: false });
  window.addEventListener('touchstart', tryStart, { once: false });

  return { init, glitchBurst };
}
