/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Story Page Component - Professional Game Introduction
 * "From Stones to Gestures: A Story of Play Across Time"
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowRight, ArrowLeft, Zap, Play, Volume2, VolumeX } from 'lucide-react';
import * as Sound from '../services/soundService';

interface StoryPageProps {
  onContinue: () => void;
}

// Story chapters data
const CHAPTERS = [
  {
    id: 0,
    chapter: 'PROLOGUE',
    title: 'The Dawn of Play',
    quote: '"Long time ago, before electricity, before screens..."',
    description: 'People played using only their bodies, their minds, and nature. The hand was the main tool — to throw, to aim, to defend, and to survive.',
    visual: '🪨',
    theme: {
      primary: '#D97706',
      secondary: '#92400E',
      bg: 'from-amber-950/95 via-stone-950/98 to-black',
      accent: 'amber',
    },
  },
  {
    id: 1,
    chapter: 'CHAPTER I',
    title: 'Lessons of Fire',
    quote: '"Every movement mattered..."',
    description: 'Children threw stones to hit targets. Warriors trained their hands and eyes. Games were lessons of life — teaching focus, patience, and skill.',
    visual: '🔥',
    theme: {
      primary: '#EA580C',
      secondary: '#9A3412',
      bg: 'from-orange-950/95 via-stone-950/98 to-black',
      accent: 'orange',
    },
  },
  {
    id: 2,
    chapter: 'CHAPTER II',
    title: 'The Forgetting',
    quote: '"Something was slowly lost..."',
    description: 'Games moved from fields to boards, then to screens. Buttons replaced hands. Controllers replaced movement. The natural connection faded.',
    visual: '📺',
    theme: {
      primary: '#6B7280',
      secondary: '#374151',
      bg: 'from-slate-950/95 via-gray-950/98 to-black',
      accent: 'gray',
    },
  },
  {
    id: 3,
    chapter: 'CHAPTER III',
    title: 'The Return',
    quote: '"Technology comes full circle..."',
    description: 'With hand-motion control, the hand becomes the interface again. No buttons. No weapons. Just gestures — pinch, pull, and release.',
    visual: '✋',
    theme: {
      primary: '#8B5CF6',
      secondary: '#6D28D9',
      bg: 'from-purple-950/95 via-indigo-950/98 to-black',
      accent: 'purple',
    },
  },
  {
    id: 4,
    chapter: 'EPILOGUE',
    title: 'Your Journey Begins',
    quote: '"The hand that shaped history now shapes the future..."',
    description: 'This is not just a game. It is a bridge between ancient wisdom and modern technology. The power returns to your hands.',
    visual: '🎯',
    theme: {
      primary: '#EC4899',
      secondary: '#BE185D',
      bg: 'from-pink-950/95 via-purple-950/98 to-black',
      accent: 'pink',
    },
    isFinal: true,
  },
];

const StoryPage: React.FC<StoryPageProps> = ({ onContinue }) => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Initialize audio
  const initializeAudio = useCallback(async () => {
    if (audioInitialized) return;
    try {
      await Sound.resumeAudio();
      Sound.setSoundEnabled(true);
      Sound.setMusicEnabled(musicEnabled);
      if (musicEnabled) {
        Sound.startBackgroundMusic();
      }
      setAudioInitialized(true);
    } catch (e) {
      console.warn('Audio init failed:', e);
    }
  }, [audioInitialized, musicEnabled]);

  // Cinematic particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Cinematic dust particles
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      decay: number;
    }> = [];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.5 - 0.1,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4,
        decay: Math.random() * 0.002 + 0.001,
      });
    }

    let time = 0;
    const chapter = CHAPTERS[currentChapter];
    
    const animate = () => {
      // Cinematic letterbox fade
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx + Math.sin(time * 0.001 + p.y * 0.01) * 0.1;
        p.y += p.vy;
        
        // Fade in/out based on position
        const yRatio = p.y / canvas.height;
        p.alpha = Math.sin(yRatio * Math.PI) * 0.3;

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        // Draw particle with glow - convert hex to rgb for proper alpha support
        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : { r: 255, g: 255, b: 255 };
        };
        
        const rgb = hexToRgb(chapter.theme.primary);
        const safeAlpha = Math.max(0, Math.min(1, p.alpha));
        
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${safeAlpha})`);
        gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${safeAlpha * 0.5})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ambient light rays - use rgba for proper color format
      const hexToRgbRay = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
      };
      const rayRgb = hexToRgbRay(chapter.theme.primary);
      
      const rayCount = 3;
      for (let i = 0; i < rayCount; i++) {
        const x = canvas.width * (0.2 + i * 0.3) + Math.sin(time * 0.0005 + i) * 100;
        const gradient = ctx.createLinearGradient(x, 0, x + 200, canvas.height);
        gradient.addColorStop(0, `rgba(${rayRgb.r}, ${rayRgb.g}, ${rayRgb.b}, 0.03)`);
        gradient.addColorStop(0.5, `rgba(${rayRgb.r}, ${rayRgb.g}, ${rayRgb.b}, 0.01)`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 200, canvas.height);
        ctx.lineTo(x - 100, canvas.height);
        ctx.lineTo(x - 50, 0);
        ctx.fill();
      }

      time++;
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentChapter]);

  // Show content with delay for cinematic effect
  useEffect(() => {
    setShowContent(false);
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, [currentChapter]);

  // Navigate chapters
  const goToChapter = useCallback((index: number, dir: 'next' | 'prev') => {
    if (isAnimating || index < 0 || index >= CHAPTERS.length) return;
    
    setIsAnimating(true);
    setDirection(dir);
    Sound.playUIClickSound();
    
    setTimeout(() => {
      setCurrentChapter(index);
      setTimeout(() => setIsAnimating(false), 600);
    }, 400);
  }, [isAnimating]);

  // Handle continue to game
  const handleContinue = useCallback(async () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    await Sound.resumeAudio();
    Sound.playGameStartSound();
    
    setTimeout(() => onContinue(), 1000);
  }, [onContinue, isTransitioning]);

  // Toggle music
  const toggleMusic = useCallback(async () => {
    await Sound.resumeAudio();
    const newState = !musicEnabled;
    setMusicEnabled(newState);
    Sound.setMusicEnabled(newState);
    if (newState) Sound.startBackgroundMusic();
    else Sound.stopBackgroundMusic();
    Sound.playUIClickSound();
    setAudioInitialized(true);
  }, [musicEnabled]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        if (currentChapter < CHAPTERS.length - 1) goToChapter(currentChapter + 1, 'next');
        else if (CHAPTERS[currentChapter].isFinal) handleContinue();
      } else if (e.key === 'ArrowLeft' && currentChapter > 0) {
        goToChapter(currentChapter - 1, 'prev');
      } else if (e.key === 'Enter' && CHAPTERS[currentChapter].isFinal) {
        handleContinue();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChapter, goToChapter, handleContinue]);

  const chapter = CHAPTERS[currentChapter];

  return (
    <div 
      className={`fixed inset-0 bg-gradient-to-b ${chapter.theme.bg} overflow-hidden transition-all duration-1000`}
      onClick={initializeAudio}
    >
      {/* Cinematic Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0" />

      {/* Cinematic Letterbox */}
      <div className="fixed top-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-b from-black to-transparent z-20 pointer-events-none" />
      <div className="fixed bottom-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-t from-black to-transparent z-20 pointer-events-none" />

      {/* Vignette */}
      <div className="fixed inset-0 z-10 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.7) 100%)',
      }} />

      {/* Film Grain Overlay */}
      <div className="fixed inset-0 z-30 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      {/* Top Bar - Game Title & Audio */}
      <div className="fixed top-0 left-0 right-0 z-40 px-6 sm:px-10 py-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* Game Logo */}
          <div className="flex flex-col">
            <span className="text-xs font-mono tracking-[0.3em] text-white/40 uppercase">Experience</span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              <span className="text-white">MOTION</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"> SHOT</span>
            </h1>
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={toggleMusic}
          className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
        >
          {musicEnabled ? (
            <Volume2 className="w-5 h-5 text-white/70 group-hover:text-white" />
          ) : (
            <VolumeX className="w-5 h-5 text-white/40 group-hover:text-white/70" />
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative z-20 h-full flex items-center justify-center px-6 sm:px-12 lg:px-20">
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Left Side - Visual */}
          <div 
            className={`
              relative flex items-center justify-center order-1
              transition-all duration-700 ease-out
              ${isAnimating ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}
              ${showContent ? 'translate-y-0' : 'translate-y-8'}
            `}
          >
            {/* Visual Container */}
            <div className="relative">
              {/* Glow Ring */}
              <div 
                className="absolute inset-0 rounded-full blur-3xl opacity-30 animate-pulse"
                style={{ background: `radial-gradient(circle, ${chapter.theme.primary}, transparent 70%)` }}
              />
              
              {/* Main Visual */}
              <div 
                className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${chapter.theme.secondary}40, transparent)`,
                  boxShadow: `0 0 80px ${chapter.theme.primary}20, inset 0 0 60px ${chapter.theme.primary}10`,
                }}
              >
                <div 
                  className="absolute inset-2 rounded-full border opacity-30"
                  style={{ borderColor: chapter.theme.primary }}
                />
                <div 
                  className="absolute inset-6 rounded-full border opacity-20"
                  style={{ borderColor: chapter.theme.primary }}
                />
                
                {/* Icon */}
                <span className="text-7xl sm:text-8xl lg:text-9xl filter drop-shadow-2xl transform hover:scale-110 transition-transform duration-500">
                  {chapter.visual}
                </span>
              </div>

              {/* Orbiting particles */}
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: chapter.theme.primary,
                    boxShadow: `0 0 10px ${chapter.theme.primary}`,
                    top: '50%',
                    left: '50%',
                    animation: `orbit ${8 + i * 2}s linear infinite`,
                    animationDelay: `${i * -2}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right Side - Text Content */}
          <div 
            className={`
              order-2 text-center lg:text-left
              transition-all duration-700 ease-out delay-100
              ${isAnimating ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}
              ${showContent ? 'translate-y-0' : 'translate-y-8'}
            `}
          >
            {/* Chapter Label */}
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-gradient-to-r from-transparent" style={{ background: `linear-gradient(to right, transparent, ${chapter.theme.primary})` }} />
              <span 
                className="text-xs sm:text-sm font-mono tracking-[0.4em] uppercase"
                style={{ color: chapter.theme.primary }}
              >
                {chapter.chapter}
              </span>
              <div className="h-px w-8" style={{ background: `linear-gradient(to left, transparent, ${chapter.theme.primary})` }} />
            </div>

            {/* Title */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
              {chapter.title}
            </h2>

            {/* Quote */}
            <p 
              className="text-lg sm:text-xl lg:text-2xl font-serif italic mb-6 leading-relaxed"
              style={{ color: `${chapter.theme.primary}` }}
            >
              {chapter.quote}
            </p>

            {/* Description */}
            <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              {chapter.description}
            </p>

            {/* Final Chapter - Play Button */}
            {chapter.isFinal && (
              <div 
                className={`
                  transition-all duration-500 delay-300
                  ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                `}
              >
                <button
                  onClick={handleContinue}
                  disabled={isTransitioning}
                  className={`
                    group relative px-10 sm:px-14 py-4 sm:py-5 font-bold text-base sm:text-lg tracking-wider
                    transition-all duration-300 transform
                    ${isTransitioning ? 'scale-95' : 'hover:scale-105 active:scale-95'}
                  `}
                >
                  {/* Button Glow */}
                  <div 
                    className="absolute -inset-1 rounded-xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity"
                    style={{ background: `linear-gradient(135deg, ${chapter.theme.primary}, ${chapter.theme.secondary})` }}
                  />
                  
                  {/* Button Background */}
                  <div 
                    className="absolute inset-0 rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${chapter.theme.primary}, ${chapter.theme.secondary})` }}
                  />
                  
                  {/* Button Border */}
                  <div className="absolute inset-0 rounded-xl border border-white/20" />

                  {/* Button Content */}
                  <div className="relative flex items-center gap-3 text-white">
                    {isTransitioning ? (
                      <>
                        <Zap className="w-5 h-5 animate-spin" />
                        <span>INITIALIZING</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current" />
                        <span>PLAY NOW</span>
                      </>
                    )}
                  </div>
                </button>

                <p className="mt-4 text-white/30 text-sm font-mono">
                  Press ENTER or click to begin
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-6 sm:px-10 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Left - Prev Button */}
          <button
            onClick={() => goToChapter(currentChapter - 1, 'prev')}
            disabled={currentChapter === 0 || isAnimating}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-all
              ${currentChapter === 0 
                ? 'text-white/20 cursor-not-allowed' 
                : 'text-white/60 hover:text-white hover:bg-white/10'
              }
            `}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">Previous</span>
          </button>

          {/* Center - Progress */}
          <div className="flex items-center gap-3">
            {CHAPTERS.map((c, i) => (
              <button
                key={i}
                onClick={() => goToChapter(i, i > currentChapter ? 'next' : 'prev')}
                disabled={isAnimating}
                className="group relative p-1"
              >
                <div 
                  className={`
                    h-1 rounded-full transition-all duration-500
                    ${currentChapter === i ? 'w-8 sm:w-12' : 'w-2 sm:w-3'}
                  `}
                  style={{ 
                    background: currentChapter >= i 
                      ? `linear-gradient(to right, ${CHAPTERS[i].theme.primary}, ${CHAPTERS[Math.min(i+1, CHAPTERS.length-1)].theme.primary})`
                      : 'rgba(255,255,255,0.2)'
                  }}
                />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 rounded text-[10px] text-white/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {c.chapter}
                </div>
              </button>
            ))}
          </div>

          {/* Right - Next Button */}
          <button
            onClick={() => {
              if (currentChapter < CHAPTERS.length - 1) goToChapter(currentChapter + 1, 'next');
              else handleContinue();
            }}
            disabled={isAnimating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <span className="hidden sm:inline text-sm font-medium">
              {currentChapter === CHAPTERS.length - 1 ? 'Play' : 'Next'}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Skip Button */}
      <button
        onClick={handleContinue}
        className="fixed bottom-6 right-6 z-50 px-3 py-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
      >
        Skip →
      </button>

      {/* Keyboard Hints */}
      <div className="fixed bottom-6 left-6 z-50 hidden sm:flex items-center gap-4 text-white/20 text-xs">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">←</kbd>
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">→</kbd>
          <span className="ml-1">Navigate</span>
        </span>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes orbit {
          from { transform: translate(-50%, -50%) rotate(0deg) translateX(120px) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg) translateX(120px) rotate(-360deg); }
        }
      `}</style>
    </div>
  );
};

export default StoryPage;
