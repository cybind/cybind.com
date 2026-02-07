import { ambientPhases, chatResponses, defaultResponses, reactionMessages } from './messages.js';
import { createTextRenderer } from './textRenderer.js';
import { keywordShapes } from '../scene/createEntity.js';
import { keywordSequences } from '../scene/shapes.js';
import { keywordEmotions } from '../scene/emotions.js';

const keywordHues = {
  hello: 0.48, hi: 0.48,
  who: 0.55, what: 0.55,
  why: 0.6,
  help: 0.72, hire: 0.72, work: 0.72,
  cybind: 0.65,
  ai: 0.5, alive: 0.58,
  human: 0.45,
  love: 0.85, god: 0.75,
  fear: 0.0,
  secret: 0.6, purpose: 0.55, name: 0.5, bye: 0.62,
};

export function createMessageSystem(entityReact) {
  const renderer = createTextRenderer();
  const state = {
    startTime: null,
    lastAmbientTime: 0,
    messageIndex: 0,
    isResponding: false,
    messageCount: 0,
    contactRevealed: false,
    hasChattedOnce: false,
  };

  const chatInput = document.getElementById('chat-input');
  const contactReveal = document.getElementById('contact-reveal');

  function getElapsed() {
    if (!state.startTime) return 0;
    return (performance.now() - state.startTime) / 1000;
  }

  function getCurrentPhase() {
    const elapsed = getElapsed();
    let phase = ambientPhases[0];
    for (const p of ambientPhases) {
      if (elapsed >= p.startTime) phase = p;
    }
    return phase;
  }

  function showAmbient() {
    if (state.isResponding) return;
    const phase = getCurrentPhase();
    const msg = phase.messages[state.messageIndex % phase.messages.length];
    state.messageIndex++;

    // Big cinematic text on overlay
    renderer.showAmbient(msg);

    // Subtle pulse on entity
    entityReact?.({ pulse: 0.15, morphBoost: 0.05 });
  }

  function findKeyword(input) {
    const lower = input.toLowerCase().trim();
    for (const keyword of Object.keys(chatResponses)) {
      if (lower.includes(keyword)) return keyword;
    }
    return null;
  }

  function findShape(input) {
    const lower = input.toLowerCase().trim();
    for (const [keyword, shape] of Object.entries(keywordShapes)) {
      if (lower.includes(keyword)) return shape;
    }
    return null;
  }

  function findSequence(input) {
    const lower = input.toLowerCase().trim();
    for (const [keyword, seqName] of Object.entries(keywordSequences)) {
      if (lower.includes(keyword)) return seqName;
    }
    return null;
  }

  function findEmotion(input) {
    const lower = input.toLowerCase().trim();
    for (const [keyword, emotionName] of Object.entries(keywordEmotions)) {
      if (lower.includes(keyword)) return emotionName;
    }
    return null;
  }

  function findResponse(keyword) {
    if (keyword && chatResponses[keyword]) {
      const responses = chatResponses[keyword];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  async function handleUserMessage(text) {
    if (!text.trim()) return;

    state.messageCount++;
    state.hasChattedOnce = true;

    // Hide ambient overlay when chatting
    renderer.hideAmbient();

    // Show user message in chat
    renderer.addMessage(text, 'user');

    const keyword = findKeyword(text);
    const shapeName = findShape(text);
    const sequenceName = findSequence(text);
    const emotionName = findEmotion(text);

    // Visual reaction + shape morph + sequence + emotion
    entityReact?.({
      pulse: 0.3,
      morphBoost: 0.15,
      hue: keyword && keywordHues[keyword] !== undefined ? keywordHues[keyword] : null,
      shapeName,
      sequenceName,
      emotion: emotionName,
      emotionIntensity: emotionName ? 0.8 : 0,
    });

    state.isResponding = true;
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 800));

    const response = findResponse(keyword);
    entityReact?.({ morphBoost: 0.15 });

    await renderer.addMessage(response, 'observer');
    state.isResponding = false;
    state.lastAmbientTime = getElapsed();

    if (state.messageCount >= 5 && !state.contactRevealed) {
      checkContactReveal();
    }
  }

  function checkContactReveal() {
    if (state.contactRevealed) return;
    const elapsed = getElapsed();
    if (state.messageCount >= 5 || elapsed > 300) {
      state.contactRevealed = true;
      contactReveal.classList.add('visible');
    }
  }

  function showReaction(key) {
    const msg = reactionMessages[key];
    if (!msg) return;
    // Reactions go to the big overlay
    renderer.showAmbient(msg);
    entityReact?.({ pulse: 0.2 });
    state.lastAmbientTime = getElapsed();
  }

  // Chat input
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = chatInput.value;
      chatInput.value = '';
      handleUserMessage(text);
    }
  });

  // Focus input on keypress
  window.addEventListener('keydown', (e) => {
    if (document.activeElement !== chatInput && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      chatInput.focus();
    }
  });

  function update(time) {
    if (!state.startTime) state.startTime = performance.now();
    const elapsed = getElapsed();

    // Ambient messages: longer interval when user has chatted
    const interval = state.hasChattedOnce ? 20 : 12;
    if (!state.isResponding && elapsed - state.lastAmbientTime > interval) {
      state.lastAmbientTime = elapsed;
      showAmbient();
    }

    checkContactReveal();
  }

  return {
    update,
    showReaction,
    handleUserMessage,
    renderer,
    get isTyping() { return chatInput === document.activeElement; },
  };
}
