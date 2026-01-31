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
// BACKGROUND MUSIC SYSTEM
// ============================================

let bgMusicInterval: number | null = null;
let bgRhythmInterval: number | null = null;
let isMusicPlaying = false;

// Musical notes (frequencies in Hz)
const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
};

// Ambient chord progressions (dreamy, space-like feel)
const CHORD_PROGRESSION = [
  [NOTES.C3, NOTES.E4, NOTES.G4, NOTES.B4],      // Cmaj7
  [NOTES.A3, NOTES.C4, NOTES.E4, NOTES.G4],      // Am7
  [NOTES.F3, NOTES.A4, NOTES.C5, NOTES.E5],      // Fmaj7
  [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.F4],      // G7
  [NOTES.E3, NOTES.G4, NOTES.B4, NOTES.D5],      // Em7
  [NOTES.D3, NOTES.F4, NOTES.A4, NOTES.C5],      // Dm7
];

let currentChordIndex = 0;

const playAmbientChord = () => {
  if (!soundEnabled || !musicEnabled || !isMusicPlaying) return;
  
  try {
    const ctx = getAudioContext();
    const chord = CHORD_PROGRESSION[currentChordIndex];
    
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sine';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 + i * 200, ctx.currentTime);
      filter.Q.setValueAtTime(1, ctx.currentTime);
      
      const noteVolume = (0.03 + i * 0.01) * musicVolume * masterVolume;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(noteVolume, ctx.currentTime + 1.5);
      gain.gain.linearRampToValueAtTime(noteVolume * 0.7, ctx.currentTime + 3);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 4.5);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 5);
    });
    
    currentChordIndex = (currentChordIndex + 1) % CHORD_PROGRESSION.length;
  } catch (e) {
    console.warn('Background music chord failed:', e);
  }
};

const playRhythmPulse = () => {
  if (!soundEnabled || !musicEnabled || !isMusicPlaying) return;
  
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    
    const pulseVol = 0.04 * musicVolume * masterVolume;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(pulseVol, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
};

export const startBackgroundMusic = (): void => {
  if (isMusicPlaying || !soundEnabled || !musicEnabled) return;
  
  isMusicPlaying = true;
  currentChordIndex = 0;
  playAmbientChord();
  
  bgMusicInterval = window.setInterval(() => {
    playAmbientChord();
  }, 4000);
  
  bgRhythmInterval = window.setInterval(() => {
    if (isMusicPlaying) playRhythmPulse();
  }, 2000);
};

export const stopBackgroundMusic = (): void => {
  isMusicPlaying = false;
  if (bgMusicInterval) { clearInterval(bgMusicInterval); bgMusicInterval = null; }
  if (bgRhythmInterval) { clearInterval(bgRhythmInterval); bgRhythmInterval = null; }
};

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
