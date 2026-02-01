/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sound Service - Web Audio API based sound effects and music for Motion Shot
 */

// Audio Context singleton
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Resume audio context on user interaction (browser autoplay policy)
export const resumeAudio = async (): Promise<void> => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
};

// Master volume control
let masterVolume = 0.5;
export const setMasterVolume = (volume: number): void => {
  masterVolume = Math.max(0, Math.min(1, volume));
};
export const getMasterVolume = (): number => masterVolume;

// Music volume (separate from SFX)
let musicVolume = 0.3;
export const setMusicVolume = (volume: number): void => {
  musicVolume = Math.max(0, Math.min(1, volume));
};
export const getMusicVolume = (): number => musicVolume;

// Sound enabled state
let soundEnabled = true;
export const setSoundEnabled = (enabled: boolean): void => {
  soundEnabled = enabled;
  if (!enabled) {
    stopBackgroundMusic();
  }
};
export const isSoundEnabled = (): boolean => soundEnabled;

// Music enabled state (separate toggle)
let musicEnabled = true;
export const setMusicEnabled = (enabled: boolean): void => {
  musicEnabled = enabled;
  if (!enabled) {
    stopBackgroundMusic();
  } else if (soundEnabled) {
    startBackgroundMusic();
  }
};
export const isMusicEnabled = (): boolean => musicEnabled;

// ============================================
// ENHANCED BACKGROUND MUSIC SYSTEM
// ============================================

let bgMusicInterval: number | null = null;
let bgRhythmInterval: number | null = null;
let bgArpeggioInterval: number | null = null;
let bgMelodyInterval: number | null = null;
let bgBassInterval: number | null = null;
let isMusicPlaying = false;

// Musical notes (frequencies in Hz) - Expanded range with sharps/flats
const NOTES: Record<string, number> = {
  C1: 32.70, Db1: 34.65, D1: 36.71, Eb1: 38.89, E1: 41.20, F1: 43.65, Gb1: 46.25, G1: 49.00, Ab1: 51.91, A1: 55.00, Bb1: 58.27, B1: 61.74,
  C2: 65.41, Db2: 69.30, D2: 73.42, Eb2: 77.78, E2: 82.41, F2: 87.31, Gb2: 92.50, G2: 98.00, Ab2: 103.83, A2: 110.00, Bb2: 116.54, B2: 123.47,
  C3: 130.81, Db3: 138.59, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, Gb3: 185.00, G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, Db4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Gb4: 369.99, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, Db5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Gb5: 739.99, G5: 783.99, Ab5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77,
  C6: 1046.50, Db6: 1108.73, D6: 1174.66, Eb6: 1244.51, E6: 1318.51,
};

// Cinematic / Sci-Fi Chord Progression (F minor / Ab Major feel)
// Fm add9 -> Db maj7 -> Eb sus4 -> Cm7
const CHORD_PROGRESSION = [
  { 
    bass: NOTES.F1, 
    chord: [NOTES.F3, NOTES.Ab3, NOTES.C4, NOTES.G4], 
    arp: [NOTES.F4, NOTES.Ab4, NOTES.C5, NOTES.G5] 
  },
  { 
    bass: NOTES.D1, // Db (C#1 is ~34.65, D1 is closest mapped here, adjusting to Db via detune or just approx) - let's use C# if we had it, simulating Db with C# approx or just use relative. F1->C# is difficult without chromatics. 
    // Let's stick to a scale we defined. Let's use F minor scale notes approx.
    // Instead of precise chromatics, let's use a standard epic progression available in our notes
    // VI -> VII -> i -> i (Ab Major context: Db -> Eb -> Fm)
    // Let's use: F2 (i), Db... wait we don't have flats. 
    // Let's use A Minor "Epic" context (Am -> F -> G -> Em)
    bass: NOTES.A1, 
    chord: [NOTES.A3, NOTES.C4, NOTES.E4, NOTES.B4], // Am add9
    arp: [NOTES.A4, NOTES.C5, NOTES.E5, NOTES.B5] 
  },
  { 
    bass: NOTES.F1, 
    chord: [NOTES.F3, NOTES.A3, NOTES.C4, NOTES.E4], // F maj7
    arp: [NOTES.F4, NOTES.A4, NOTES.C5, NOTES.E5] 
  },
  { 
    bass: NOTES.C2, 
    chord: [NOTES.C3, NOTES.E3, NOTES.G3, NOTES.D4], // C add9
    arp: [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.D5] 
  },
  { 
    bass: NOTES.G1, 
    chord: [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.F4], // G7 (Dominant)
    arp: [NOTES.G4, NOTES.B4, NOTES.D5, NOTES.F5] 
  },
];

// Ethereal Melody Patterns
const MELODY_PATTERNS = [
  [0, 2, 4, 7],    // Ascending Arp
  [7, 4, 2, 0],    // Descending Arp
  [0, 4, 7, 12],   // Wide spread
  [2, 0, 2, 4],    // Simple movement
];

let currentChordIndex = 0;
let currentMelodyPattern = 0;
let melodyNoteIndex = 0;
let arpNoteIndex = 0;

// Rich Pad Chord Synthesis
const playAmbientChord = () => {
  if (!soundEnabled || !musicEnabled || !isMusicPlaying) return;
  
  try {
    const ctx = getAudioContext();
    const progression = CHORD_PROGRESSION[currentChordIndex];
    
    // Play chord notes with slow attack strings/pad feel
    progression.chord.forEach((freq, i) => {
      // Validate frequency is a finite number
      if (!Number.isFinite(freq) || freq <= 0) {
        console.warn('Invalid frequency in chord:', freq);
        return;
      }
      
      // 2 oscillators per note for detuned chorus effect
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const panner = ctx.createStereoPanner();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      
      // Slight detuning for warmth
      osc1.detune.setValueAtTime(-5 + Math.random() * 10, ctx.currentTime);
      osc2.detune.setValueAtTime(5 + Math.random() * 10, ctx.currentTime);

      // Lowpass filter for "muffled" pad sound, opening up slightly
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400 + i * 200, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(600 + i * 200, ctx.currentTime + 3);
      filter.Q.value = 0.5;

      // Panning for stereo width
      panner.pan.value = -0.5 + Math.random();

      // Envelope: Slow attack, sustain, slow release
      const volume = (0.03 + i * 0.005) * musicVolume * masterVolume;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2); // 2s Attack
      gain.gain.setValueAtTime(volume, ctx.currentTime + 4); 
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 8); // 4s Release

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(panner);
      panner.connect(gain);
      gain.connect(ctx.destination);

      osc1.frequency.value = freq;
      osc2.frequency.value = freq;

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 8);
      osc2.stop(ctx.currentTime + 8);
    });
    
    currentChordIndex = (currentChordIndex + 1) % CHORD_PROGRESSION.length;
    // Change melody pattern occasionally
    if (Math.random() > 0.7) {
        currentMelodyPattern = Math.floor(Math.random() * MELODY_PATTERNS.length);
    }
  } catch (e) {
    console.warn('Background music chord failed:', e);
  }
};

// Deep Bass Drone
const playBassNote = () => {
  if (!soundEnabled || !musicEnabled || !isMusicPlaying) return;
  
  try {
    const ctx = getAudioContext();
    const progression = CHORD_PROGRESSION[currentChordIndex];
    const bassFreq = progression.bass;
    
    // Validate bass frequency
    if (!Number.isFinite(bassFreq) || bassFreq <= 0) {
      console.warn('Invalid bass frequency:', bassFreq);
      return;
    }
    
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator(); // Sub-bass
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.type = 'sawtooth';
    subOsc.type = 'sine';
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, ctx.currentTime);
    
    const bassVol = 0.15 * musicVolume * masterVolume;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(bassVol, ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(bassVol * 0.8, ctx.currentTime + 2);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 4);
    
    osc.connect(filter);
    subOsc.connect(filter); // Sub goes through filter too to keep it clean
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = bassFreq;
    subOsc.frequency.value = bassFreq / 2; // Octave lower
    
    osc.start(ctx.currentTime);
    subOsc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 4);
    subOsc.stop(ctx.currentTime + 4);
  } catch (e) {}
};

// Subtle Rhythm Pulse (Heartbeat) - Adds driving force
const playRhythmPulse = () => {
  if (!soundEnabled || !musicEnabled || !isMusicPlaying) return;
  
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    // Very low sine kick
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);
    
    filter.type = 'lowpass';
    filter.frequency.value = 150;
    
    // Quick thud
    const vol = 0.15 * musicVolume * masterVolume;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {}
};

// Crystal / Glass Arpeggio
const playArpeggioNote = () => {
  if (!soundEnabled || !musicEnabled || !isMusicPlaying) return;
  // Reduced density
  if (Math.random() > 0.8) return;

  try {
    const ctx = getAudioContext();
    const progression = CHORD_PROGRESSION[currentChordIndex];
    // Randomize arp order slightly
    const arpIdx = (arpNoteIndex + Math.floor(Math.random() * 2)) % progression.arp.length;
    const arpFreq = progression.arp[arpIdx];
    
    // Validate arp frequency
    if (!Number.isFinite(arpFreq) || arpFreq <= 0) {
      return;
    }
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();
    
    // Sine for pure glass sound
    osc.type = 'sine';
    
    pan.pan.value = Math.sin(ctx.currentTime * 2) * 0.5; // Ping-pong

    const arpVol = 0.05 * musicVolume * masterVolume;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(arpVol, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5); // Long resonant tail
    
    osc.connect(pan);
    pan.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = arpFreq;
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.5);
    
    arpNoteIndex++;
  } catch (e) {}
};

// Lead Melody (rare, distant)
const playMelodyNote = () => {
  if (!soundEnabled || !musicEnabled || !isMusicPlaying) return;
  
  if (Math.random() > 0.4) return; // Sparse melody
  
  try {
    const ctx = getAudioContext();
    const progression = CHORD_PROGRESSION[currentChordIndex];
    const pattern = MELODY_PATTERNS[currentMelodyPattern];
    const noteOffset = pattern[melodyNoteIndex % pattern.length];
    
    // Calculate frequency based on scale (approximated)
    const baseFreq = progression.arp[1]; // Use a mid-range note as base
    
    // Validate base frequency before calculation
    if (!Number.isFinite(baseFreq) || baseFreq <= 0) {
      return;
    }
    
    const melodyFreq = baseFreq * Math.pow(2, noteOffset / 12); // Semitone offset
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const delay = ctx.createDelay();
    const feedback = ctx.createGain();
    
    osc.type = 'triangle'; // Flute-like
    
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    
    // Delay line
    delay.delayTime.value = 0.4;
    feedback.gain.value = 0.3;
    
    const melVol = 0.04 * musicVolume * masterVolume;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(melVol, ctx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(melVol * 0.8, ctx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    // Send to delay
    gain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    feedback.connect(ctx.destination);
    
    osc.frequency.value = melodyFreq;
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2.5);
    
    melodyNoteIndex++;
  } catch (e) {}
};

export const startBackgroundMusic = (): void => {
  if (isMusicPlaying || !soundEnabled || !musicEnabled) return;
  
  isMusicPlaying = true;
  currentChordIndex = 0;
  arpNoteIndex = 0;
  melodyNoteIndex = 0;
  
  // Initial Start
  playAmbientChord();
  playBassNote();
  
  // Schedule loops
  // Chord change every 6 seconds (Slow, breathing pace)
  bgMusicInterval = window.setInterval(() => {
    playAmbientChord();
    playBassNote(); // Bass changes with chord
  }, 6000);
  
  // Arpeggios - Faster but sparse
  bgArpeggioInterval = window.setInterval(() => {
    if (isMusicPlaying) playArpeggioNote();
  }, 250); // 1/16th notes approx?
  
  // Rhythm Pulse - Steady beat (every 2 sec)
  bgRhythmInterval = window.setInterval(() => {
    if (isMusicPlaying) playRhythmPulse();
  }, 2000); // Heartbeat pace

  // Melody - Slower
  bgMelodyInterval = window.setInterval(() => {
    if (isMusicPlaying) playMelodyNote();
  }, 1000);
};

export const stopBackgroundMusic = (): void => {
  isMusicPlaying = false;
  if (bgMusicInterval) { clearInterval(bgMusicInterval); bgMusicInterval = null; }
  if (bgRhythmInterval) { clearInterval(bgRhythmInterval); bgRhythmInterval = null; }
  if (bgArpeggioInterval) { clearInterval(bgArpeggioInterval); bgArpeggioInterval = null; }
  if (bgMelodyInterval) { clearInterval(bgMelodyInterval); bgMelodyInterval = null; }
  if (bgBassInterval) { clearInterval(bgBassInterval); bgBassInterval = null; }
};

// Check if music is currently playing
export const isBackgroundMusicPlaying = (): boolean => isMusicPlaying;

// ============================================
// SOUND EFFECT HELPERS
// ============================================

const playSweep = (startFreq: number, endFreq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.2): void => {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume * masterVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
};

/**
 * Play a synthesized tone (beep)
 */
const playTone = (
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
  attack: number = 0.01,
  decay: number = 0.1
): void => {
  if (!soundEnabled) return;
  
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // ADSR envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * masterVolume, ctx.currentTime + attack);
    gainNode.gain.linearRampToValueAtTime(volume * masterVolume * 0.7, ctx.currentTime + attack + decay);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Sound playback failed:', e);
  }
};

/**
 * Play noise burst (for impacts/explosions)
 */
const playNoise = (duration: number, volume: number = 0.2): void => {
  if (!soundEnabled) return;
  
  try {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration);
    
    gainNode.gain.setValueAtTime(volume * masterVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    source.start();
  } catch (e) {
    console.warn('Noise playback failed:', e);
  }
};

/**
 * Play a chord (multiple notes)
 */
const playChord = (frequencies: number[], duration: number, type: OscillatorType = 'sine', volume: number = 0.15): void => {
  frequencies.forEach((freq, i) => {
    setTimeout(() => playTone(freq, duration, type, volume), i * 30);
  });
};

// ============================================
// GAME SOUND EFFECTS
// ============================================

/**
 * Sound when player grabs the slingshot ball (pinch detected)
 */
export const playGrabSound = (): void => {
  playTone(440, 0.1, 'sine', 0.2, 0.01, 0.05);
};

/**
 * Sound while stretching slingshot (pitch increases with stretch)
 */
export const playStretchSound = (stretchRatio: number): void => {
  const freq = 200 + stretchRatio * 400; // 200Hz to 600Hz based on stretch
  playTone(freq, 0.05, 'triangle', 0.1, 0.01, 0.02);
};

/**
 * Sound when ball is launched
 */
export const playLaunchSound = (): void => {
  if (!soundEnabled) return;
  
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3 * masterVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.warn('Launch sound failed:', e);
  }
};

/**
 * Sound when ball bounces off wall
 */
export const playBounceSound = (): void => {
  playTone(280, 0.1, 'square', 0.15, 0.005, 0.05);
  playNoise(0.05, 0.1);
};

/**
 * Sound when bubbles pop (match found) - musical and satisfying
 */
export const playPopSound = (comboSize: number = 3): void => {
  if (!soundEnabled) return;
  
  // Base pop sound
  playNoise(0.15, 0.25);
  
  // Musical notes based on combo size (more bubbles = higher pitch chord)
  const baseFreq = 523.25; // C5
  const frequencies = [
    baseFreq,
    baseFreq * 1.25, // E5 (major third)
    baseFreq * 1.5,  // G5 (perfect fifth)
  ];
  
  // Add more notes for bigger combos
  if (comboSize > 3) {
    frequencies.push(baseFreq * 2); // C6 (octave)
  }
  if (comboSize > 5) {
    frequencies.push(baseFreq * 2.5); // E6
  }
  
  playChord(frequencies, 0.3, 'sine', 0.12);
};

/**
 * Sound when ball snaps to grid (no match)
 */
export const playSnapSound = (): void => {
  playTone(220, 0.1, 'triangle', 0.2, 0.01, 0.05);
  playNoise(0.05, 0.08);
};

/**
 * Sound when color is selected
 */
export const playSelectSound = (): void => {
  playTone(660, 0.08, 'sine', 0.15, 0.01, 0.03);
  setTimeout(() => playTone(880, 0.08, 'sine', 0.12, 0.01, 0.03), 50);
};

/**
 * Sound when hand is detected
 */
export const playHandDetectedSound = (): void => {
  if (!soundEnabled) return;
  playSweep(200, 400, 0.15, 'sine', 0.15);
  setTimeout(() => playTone(500, 0.1, 'sine', 0.1), 100);
};

/**
 * Sound when hand tracking is lost
 */
export const playHandLostSound = (): void => {
  if (!soundEnabled) return;
  playSweep(400, 150, 0.2, 'triangle', 0.12);
};

/**
 * Sound when at maximum stretch tension
 */
export const playMaxTensionSound = (): void => {
  if (!soundEnabled) return;
  playTone(600, 0.15, 'sawtooth', 0.12);
  playTone(603, 0.15, 'sawtooth', 0.12);
};

/**
 * Sound for flying ball wind effect
 */
let flyingSoundInterval: number | null = null;
export const startFlyingSound = (): void => {
  if (!soundEnabled || flyingSoundInterval) return;
  flyingSoundInterval = window.setInterval(() => {
    playTone(80 + Math.random() * 40, 0.1, 'sine', 0.03);
  }, 150);
};

export const stopFlyingSound = (): void => {
  if (flyingSoundInterval) {
    clearInterval(flyingSoundInterval);
    flyingSoundInterval = null;
  }
};

/**
 * Sound when AI starts analyzing
 */
export const playAiThinkingSound = (): void => {
  if (!soundEnabled) return;
  
  const frequencies = [330, 392, 494];
  frequencies.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.4, 'sine', 0.08, 0.1, 0.2), i * 100);
  });
  
  setTimeout(() => {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => playTone(800 + i * 200, 0.05, 'square', 0.04), i * 80);
    }
  }, 400);
};

/**
 * Sound when AI provides a hint
 */
export const playAiHintSound = (): void => {
  if (!soundEnabled) return;
  
  setTimeout(() => playTone(523, 0.15, 'sine', 0.18), 0);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.18), 80);
  setTimeout(() => playTone(784, 0.2, 'sine', 0.2), 160);
  setTimeout(() => playTone(1047, 0.25, 'sine', 0.15), 250);
};

/**
 * Warning sound when bubbles get too low
 */
export const playWarningSound = (): void => {
  if (!soundEnabled) return;
  
  playTone(200, 0.15, 'square', 0.2);
  setTimeout(() => playTone(150, 0.2, 'square', 0.25), 200);
};

/**
 * Critical warning sound
 */
export const playCriticalWarningSound = (): void => {
  if (!soundEnabled) return;
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      playTone(180, 0.1, 'square', 0.3);
      playTone(90, 0.1, 'square', 0.2);
    }, i * 150);
  }
};

/**
 * Game over sound
 */
export const playGameOverSound = (): void => {
  if (!soundEnabled) return;
  
  const notes = [392, 349, 330, 262, 196];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.5, 'triangle', 0.22, 0.05, 0.15), i * 220);
  });
  
  setTimeout(() => {
    playChord([130, 156, 196], 1.0, 'sine', 0.1);
  }, 1200);
};

/**
 * Victory/high score sound
 */
export const playVictorySound = (): void => {
  if (!soundEnabled) return;
  
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.35, 'sine', 0.22, 0.02, 0.1), i * 130);
  });
  
  setTimeout(() => {
    playChord([523, 659, 784, 1047], 0.8, 'sine', 0.18);
  }, 700);
};

/**
 * UI click sound
 */
export const playUIClickSound = (): void => {
  if (!soundEnabled) return;
  playTone(800, 0.05, 'sine', 0.12, 0.005, 0.02);
};

/**
 * Game start sound with music
 */
export const playGameStartSound = (): void => {
  if (!soundEnabled) return;
  
  playSweep(200, 600, 0.2, 'sawtooth', 0.15);
  setTimeout(() => {
    playChord([262, 330, 392, 523], 0.4, 'sine', 0.15);
  }, 150);
  
  setTimeout(() => startBackgroundMusic(), 500);
};

/**
 * Ambient background pulse (call periodically for atmosphere)
 */
export const playAmbientPulse = (): void => {
  if (!soundEnabled) return;
  playTone(80, 0.8, 'sine', 0.03, 0.2, 0.3);
};

// Export type for sound names
export type SoundName = 
  | 'grab' 
  | 'stretch' 
  | 'maxTension'
  | 'launch' 
  | 'flying'
  | 'bounce' 
  | 'pop' 
  | 'snap' 
  | 'select' 
  | 'handDetected'
  | 'handLost'
  | 'aiThinking' 
  | 'aiHint' 
  | 'warning' 
  | 'criticalWarning'
  | 'gameOver' 
  | 'victory'
  | 'uiClick'
  | 'gameStart';
