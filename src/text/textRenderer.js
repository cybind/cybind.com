const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#αβγδεζ01';

export function createTextRenderer() {
  const ambientEl = document.getElementById('ambient-message');
  const chatLog = document.getElementById('chat-log');

  let ambientAnimId = null;
  let ambientTimeout = null;
  let typewriterTimer = null;

  // === Scramble/decrypt effect for ambient overlay ===
  function showAmbient(text) {
    // Cancel previous
    if (ambientAnimId) cancelAnimationFrame(ambientAnimId);
    if (ambientTimeout) clearTimeout(ambientTimeout);

    ambientEl.classList.add('scrambling');
    ambientEl.classList.add('visible');

    const length = text.length;
    const duration = 800 + length * 25;
    const startTime = performance.now();

    function tick() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease: faster at start, slower at end
      const eased = 1 - Math.pow(1 - progress, 2);
      const revealed = Math.floor(eased * length);

      let display = '';
      for (let i = 0; i < length; i++) {
        if (text[i] === ' ') {
          display += ' ';
        } else if (i < revealed) {
          display += text[i];
        } else {
          display += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      }
      ambientEl.textContent = display;

      if (progress < 1) {
        ambientAnimId = requestAnimationFrame(tick);
      } else {
        ambientEl.textContent = text;
        ambientEl.classList.remove('scrambling');
        ambientAnimId = null;

        // Fade out after display
        ambientTimeout = setTimeout(() => {
          ambientEl.classList.remove('visible');
        }, 5500);
      }
    }

    ambientAnimId = requestAnimationFrame(tick);
  }

  function hideAmbient() {
    if (ambientAnimId) cancelAnimationFrame(ambientAnimId);
    if (ambientTimeout) clearTimeout(ambientTimeout);
    ambientEl.classList.remove('visible', 'scrambling');
  }

  // === Chat messages (typewriter for observer, instant for user) ===
  function addMessage(text, sender = 'observer', { glitch = false } = {}) {
    if (typewriterTimer) {
      clearInterval(typewriterTimer);
      typewriterTimer = null;
      const typing = chatLog.querySelector('.typing');
      if (typing) {
        typing.classList.remove('typing');
        const cursor = typing.querySelector('.cursor');
        if (cursor) cursor.remove();
      }
    }

    const el = document.createElement('div');
    el.className = `chat-message ${sender}`;
    if (glitch) el.classList.add('glitch');

    if (sender === 'user') {
      el.textContent = text;
      chatLog.appendChild(el);
      scrollToBottom();
      return Promise.resolve();
    }

    // Observer: scramble-in effect for chat too (faster)
    el.classList.add('typing');
    chatLog.appendChild(el);
    scrollToBottom();

    return new Promise((resolve) => {
      const length = text.length;
      const duration = 500 + length * 18;
      const startTime = performance.now();

      function tick() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 2.5);
        const revealed = Math.floor(eased * length);

        let display = '';
        for (let i = 0; i < length; i++) {
          if (text[i] === ' ') {
            display += ' ';
          } else if (i < revealed) {
            display += text[i];
          } else {
            display += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          }
        }
        el.textContent = display;
        scrollToBottom();

        if (progress < 1) {
          typewriterTimer = requestAnimationFrame(tick);
        } else {
          el.textContent = text;
          el.classList.remove('typing');
          typewriterTimer = null;
          resolve();
        }
      }

      typewriterTimer = requestAnimationFrame(tick);
    });
  }

  function addAmbientChat(text) {
    const el = document.createElement('div');
    el.className = 'chat-message observer ambient';
    el.textContent = text;
    chatLog.appendChild(el);
    scrollToBottom();

    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 1000);
    }, 8000);
  }

  function scrollToBottom() {
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  return { showAmbient, hideAmbient, addMessage, addAmbientChat };
}
