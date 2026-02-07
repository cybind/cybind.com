// Emotion presets: target offsets applied on top of existing shape/reaction state
// All values are additive offsets or multipliers — they compose with shapes, not replace them
export const emotionPresets = {
  neutral: {
    hueShift: 0,
    saturation: 0.65,
    brightness: 0,
    breathSpeed: 1.0,
    agitationAdd: 0,
    morphBoostAdd: 0,
    scaleOffset: 0,
    mouseInfluenceMul: 1.0,
    coreSpeedMul: 1.0,
    chromaticAdd: 0,
    burstColor: 0x00ffe0,
  },
  happy: {
    hueShift: 0.08,       // warm shift
    saturation: 0.8,
    brightness: 0.06,
    breathSpeed: 1.3,
    agitationAdd: 0,
    morphBoostAdd: 0.04,
    scaleOffset: 0.03,    // slight expansion
    mouseInfluenceMul: 1.0,
    coreSpeedMul: 1.1,
    chromaticAdd: 0,
    burstColor: 0xffaa22,  // amber
  },
  curious: {
    hueShift: 0.03,
    saturation: 0.7,
    brightness: 0.02,
    breathSpeed: 1.1,
    agitationAdd: 0.05,
    morphBoostAdd: 0.02,
    scaleOffset: 0,
    mouseInfluenceMul: 2.0,  // stronger mouse follow
    coreSpeedMul: 1.4,
    chromaticAdd: 0,
    burstColor: 0x44ddff,  // cyan
  },
  sad: {
    hueShift: -0.05,
    saturation: 0.35,      // desaturated
    brightness: -0.06,     // dim
    breathSpeed: 0.5,      // slow breathing
    agitationAdd: 0,
    morphBoostAdd: 0,
    scaleOffset: -0.04,    // shrink
    mouseInfluenceMul: 0.3,
    coreSpeedMul: 0.5,
    chromaticAdd: 0,
    burstColor: 0x4466aa,  // muted blue
  },
  angry: {
    hueShift: -0.15,       // toward red
    saturation: 0.85,
    brightness: 0.03,
    breathSpeed: 2.0,      // fast tight breathing
    agitationAdd: 0.3,     // high agitation
    morphBoostAdd: 0.1,
    scaleOffset: 0.01,
    mouseInfluenceMul: 0.5,
    coreSpeedMul: 1.8,
    chromaticAdd: 0.008,   // chromatic aberration
    burstColor: 0xff2222,  // red
  },
  surprised: {
    hueShift: 0.02,
    saturation: 0.75,
    brightness: 0.12,      // bright flash
    breathSpeed: 1.6,
    agitationAdd: 0.15,
    morphBoostAdd: 0.15,
    scaleOffset: 0.08,     // pop expand (will contract via decay)
    mouseInfluenceMul: 1.0,
    coreSpeedMul: 1.3,
    chromaticAdd: 0.004,
    burstColor: 0xffffff,  // white
  },
  thinking: {
    hueShift: 0.01,
    saturation: 0.6,
    brightness: 0.01,
    breathSpeed: 0.8,      // steady rhythmic
    agitationAdd: 0.02,
    morphBoostAdd: 0.03,
    scaleOffset: 0,
    mouseInfluenceMul: 0.6,
    coreSpeedMul: 0.9,
    chromaticAdd: 0,
    burstColor: 0x8888ff,  // soft purple
  },
  peaceful: {
    hueShift: 0.12,        // pastel shift
    saturation: 0.45,
    brightness: 0.03,
    breathSpeed: 0.6,      // slow smooth
    agitationAdd: 0,
    morphBoostAdd: 0,
    scaleOffset: 0.01,
    mouseInfluenceMul: 0.8,
    coreSpeedMul: 0.6,
    chromaticAdd: 0,
    burstColor: 0x88ffcc,  // soft green
  },
  excited: {
    hueShift: 0.06,
    saturation: 0.9,       // vivid
    brightness: 0.08,
    breathSpeed: 2.2,      // fast everything
    agitationAdd: 0.2,
    morphBoostAdd: 0.12,
    scaleOffset: 0.04,
    mouseInfluenceMul: 1.5,
    coreSpeedMul: 2.0,
    chromaticAdd: 0.005,
    burstColor: 0xffdd00,  // gold
  },
};

// Keywords → emotion name
export const keywordEmotions = {
  // Happy
  happy: 'happy', joy: 'happy', glad: 'happy', wonderful: 'happy',
  great: 'happy', awesome: 'happy', amazing: 'happy', smile: 'happy',
  laugh: 'happy', fun: 'happy', yay: 'happy', excellent: 'happy',

  // Curious
  curious: 'curious', wonder: 'curious', how: 'curious', why: 'curious',
  what: 'curious', interesting: 'curious', explore: 'curious', question: 'curious',

  // Sad
  sad: 'sad', sorry: 'sad', alone: 'sad', lonely: 'sad',
  miss: 'sad', cry: 'sad', depressed: 'sad', lost: 'sad',
  grief: 'sad', hurt: 'sad',

  // Angry
  angry: 'angry', hate: 'angry', rage: 'angry', furious: 'angry',
  mad: 'angry', annoyed: 'angry', frustrated: 'angry',

  // Surprised
  wow: 'surprised', surprised: 'surprised', omg: 'surprised', whoa: 'surprised',
  incredible: 'surprised', unbelievable: 'surprised', shocking: 'surprised',
  'no way': 'surprised',

  // Thinking
  think: 'thinking', thinking: 'thinking', hmm: 'thinking', consider: 'thinking',
  ponder: 'thinking', maybe: 'thinking', perhaps: 'thinking',

  // Peaceful
  peace: 'peaceful', calm: 'peaceful', relax: 'peaceful', serene: 'peaceful',
  quiet: 'peaceful', gentle: 'peaceful', zen: 'peaceful', breathe: 'peaceful',
  meditate: 'peaceful',

  // Excited
  excited: 'excited', amazing: 'excited', incredible: 'excited',
  'let\'s go': 'excited', hype: 'excited', epic: 'excited', insane: 'excited',
};
