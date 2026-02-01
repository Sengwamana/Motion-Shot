/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Story Page Component - "From Stones to Gestures: A Story of Play Across Time"
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronDown, Hand, Flame, Monitor, Gamepad2, Sparkles, ArrowRight, Clock, Heart, Target, Zap } from 'lucide-react';
import * as Sound from '../services/soundService';

interface StoryPageProps {
  onContinue: () => void;
}

const StoryPage: React.FC<StoryPageProps> = ({ onContinue }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Particle system for ambient effects
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

    // Particles representing different eras
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      type: 'stone' | 'ember' | 'pixel' | 'glow';
    }> = [];

    // Initialize particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 - 0.2,
        size: Math.random() * 4 + 2,
        alpha: Math.random() * 0.5 + 0.2,
        type: ['stone', 'ember', 'pixel', 'glow'][Math.floor(Math.random() * 4)] as any,
      });
    }

    let time = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = 0.2 + 0.3 * Math.sin(time * 0.02 + p.x * 0.01);

        // Wrap around
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        // Draw based on type
        ctx.globalAlpha = p.alpha;
        switch (p.type) {
          case 'stone':
            ctx.fillStyle = '#8B7355';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'ember':
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            gradient.addColorStop(0, '#FF6B35');
            gradient.addColorStop(0.5, '#F7931E');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'pixel':
            ctx.fillStyle = '#00FF88';
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            break;
          case 'glow':
            const glowGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
            glowGrad.addColorStop(0, '#A78BFA');
            glowGrad.addColorStop(0.5, '#6366F1');
            glowGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
      });

      ctx.globalAlpha = 1;
      time++;
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const progress = scrollTop / scrollHeight;
      setScrollProgress(progress);

      // Determine current section
      const sectionCount = 5;
      const newSection = Math.min(Math.floor(progress * sectionCount), sectionCount - 1);
      if (newSection !== currentSection) {
        setCurrentSection(newSection);
        Sound.playUIClickSound();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentSection]);

  // Handle continue
  const handleContinue = useCallback(async () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    await Sound.resumeAudio();
    Sound.playGameStartSound();
    
    setTimeout(() => {
      onContinue();
    }, 800);
  }, [onContinue, isTransitioning]);

  // Section backgrounds based on era
  const getSectionBackground = (index: number) => {
    switch (index) {
      case 0: return 'from-amber-950/90 via-stone-900/80 to-stone-950/90'; // Ancient
      case 1: return 'from-orange-950/90 via-amber-900/80 to-stone-950/90'; // Fire/Village
      case 2: return 'from-slate-900/90 via-gray-800/80 to-slate-950/90'; // Industrial
      case 3: return 'from-indigo-950/90 via-purple-900/80 to-slate-950/90'; // Modern
      case 4: return 'from-purple-950/90 via-indigo-900/80 to-blue-950/90'; // Future
      default: return 'from-slate-900/90 via-gray-900/80 to-slate-950/90';
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Animated Background Canvas */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 z-0 opacity-40"
      />

      {/* Dynamic gradient overlay based on section */}
      <div 
        className={`fixed inset-0 z-5 bg-gradient-to-b ${getSectionBackground(currentSection)} transition-all duration-1000`}
      />

      {/* Progress indicator */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`
              w-2 h-8 rounded-full transition-all duration-500
              ${currentSection >= i 
                ? 'bg-gradient-to-b from-amber-400 via-purple-500 to-blue-400 shadow-lg shadow-purple-500/30' 
                : 'bg-white/20'
              }
            `}
          />
        ))}
      </div>

      {/* Scroll container */}
      <div 
        ref={containerRef}
        className="relative z-10 h-full overflow-y-auto overflow-x-hidden scroll-smooth snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Section 1: Opening - Long Time Ago */}
        <section className="min-h-screen snap-start flex items-center justify-center px-6 py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Ancient symbol */}
            <div className="mb-8 animate-fadeIn">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-800/50 to-stone-900/50 border-2 border-amber-600/30 shadow-2xl">
                <span className="text-4xl">🪨</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-light text-amber-100 mb-6 animate-fadeInUp leading-tight">
              From Stones to Gestures
            </h1>
            <p className="text-lg sm:text-xl text-amber-300/80 font-serif italic mb-8 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
              A Story of Play Across Time
            </p>

            <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mb-12" />

            <div className="space-y-6 text-amber-100/70 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto animate-fadeInUp" style={{ animationDelay: '400ms' }}>
              <p className="flex items-center justify-center gap-3">
                <Clock className="w-5 h-5 text-amber-500/70" />
                <span className="font-serif italic text-amber-400">Long time ago…</span>
              </p>
              <p>
                Before electricity, before screens, and before machines could understand humans, 
                <span className="text-amber-300"> people played using only their bodies, their minds, and nature.</span>
              </p>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
              <ChevronDown className="w-8 h-8 text-amber-400/50" />
            </div>
          </div>
        </section>

        {/* Section 2: Ancient Games */}
        <section className="min-h-screen snap-start flex items-center justify-center px-6 py-20 relative">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Visual side */}
              <div className="relative order-2 md:order-1">
                <div className="aspect-square rounded-full bg-gradient-to-br from-orange-900/30 via-amber-800/20 to-transparent p-8 border border-amber-700/20">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-800/40 to-amber-900/30 flex items-center justify-center relative overflow-hidden">
                    {/* Fire glow effect */}
                    <div className="absolute inset-0 animate-pulse">
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-40 bg-gradient-to-t from-orange-500/30 via-amber-500/20 to-transparent rounded-full blur-xl" />
                    </div>
                    <div className="text-center relative z-10">
                      <Flame className="w-16 h-16 text-orange-400 mx-auto mb-4 animate-flicker" />
                      <div className="flex items-center justify-center gap-4 mt-4">
                        <span className="text-4xl">🎯</span>
                        <span className="text-4xl">🪃</span>
                        <span className="text-4xl">🏹</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text side */}
              <div className="space-y-6 order-1 md:order-2">
                <h2 className="text-2xl sm:text-4xl font-serif text-amber-200 leading-tight">
                  In villages and ancient communities
                </h2>
                <div className="space-y-4 text-amber-100/70 text-base sm:text-lg leading-relaxed">
                  <p>
                    Games were <span className="text-amber-300 font-medium">simple but meaningful.</span> Children threw stones to hit a target, 
                    elders practiced spear throwing for hunting, and warriors trained their hands and eyes to protect their people.
                  </p>
                  <div className="p-4 border-l-2 border-orange-500/50 bg-orange-950/30 rounded-r-lg">
                    <p className="text-orange-200 italic">
                      "Every movement mattered. The hand was the main tool — 
                      to throw, to aim, to defend, and to survive."
                    </p>
                  </div>
                  <p>
                    Games were not just for fun; they were <span className="text-amber-300 font-medium">lessons of life,</span> teaching focus, patience, and skill.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Around the Fire */}
        <section className="min-h-screen snap-start flex items-center justify-center px-6 py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Campfire scene */}
            <div className="mb-12 relative">
              <div className="inline-flex items-center justify-center">
                <div className="relative">
                  <span className="text-6xl sm:text-8xl">🔥</span>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-orange-500/30 rounded-full blur-lg" />
                </div>
              </div>
              
              {/* Sitting figures */}
              <div className="flex justify-center gap-8 mt-4 opacity-60">
                <span className="text-2xl transform -scale-x-100">👤</span>
                <span className="text-2xl">👤</span>
                <span className="text-2xl transform -scale-x-100">👤</span>
              </div>
            </div>

            <blockquote className="text-xl sm:text-2xl md:text-3xl font-serif text-amber-200 italic leading-relaxed max-w-3xl mx-auto mb-8">
              "Around the fire at night, stories were told about great hunters who never missed their target, 
              and young players dreamed of mastering the same hand movements one day."
            </blockquote>

            <div className="h-px w-48 mx-auto bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-12" />

            <div className="flex items-center justify-center gap-3 text-gray-400">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <span className="text-sm font-mono tracking-widest uppercase">Time passed...</span>
              <div className="w-2 h-2 rounded-full bg-gray-500" />
            </div>
          </div>
        </section>

        {/* Section 4: The Change */}
        <section className="min-h-screen snap-start flex items-center justify-center px-6 py-20 relative">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Text side */}
              <div className="space-y-6">
                <h2 className="text-2xl sm:text-4xl font-serif text-gray-200 leading-tight">
                  Civilizations grew. <br />Tools became smarter.
                </h2>
                <div className="space-y-4 text-gray-300/70 text-base sm:text-lg leading-relaxed">
                  <p>
                    Games moved from <span className="text-gray-200">fields to boards,</span> then from <span className="text-gray-200">boards to screens.</span>
                  </p>
                  <div className="flex items-center gap-3 py-4">
                    <div className="flex items-center gap-2">
                      <Hand className="w-5 h-5 text-amber-500" />
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="w-5 h-5 text-blue-500" />
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-purple-500" />
                    </div>
                  </div>
                  <p className="text-gray-400">
                    Buttons replaced hands. Controllers replaced movement.
                  </p>
                  <p className="text-lg text-gray-300">
                    People played more — <span className="text-red-400/80">but moved less.</span>
                  </p>
                </div>
              </div>

              {/* Visual side */}
              <div className="relative">
                <div className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/30">
                  <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(99,102,241,0.1),_transparent_70%)]" />
                    <div className="text-center z-10">
                      <Monitor className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <div className="flex items-center justify-center gap-2 text-slate-500">
                        <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-xs">⬆️</div>
                        <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-xs">⬇️</div>
                        <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-xs">A</div>
                        <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-xs">B</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning message */}
                <div className="mt-6 p-4 bg-red-950/30 border border-red-800/30 rounded-lg">
                  <p className="text-red-300/80 text-sm italic text-center">
                    "Something important was slowly forgotten: <br />
                    <span className="text-red-200 font-medium">the natural connection between the human body and play.</span>"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Nowadays - The Return */}
        <section className="min-h-screen snap-start flex items-center justify-center px-6 py-20 relative">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-mono text-purple-300 tracking-wider uppercase">Nowadays</span>
              </div>
            </div>

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 mb-8 leading-tight">
              Technology has come full circle.
            </h2>

            <div className="max-w-3xl mx-auto space-y-8 mb-12">
              <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
                With <span className="text-purple-300 font-medium">hand-motion shooting,</span> the hand becomes the controller again.
              </p>
              
              <div className="flex items-center justify-center gap-4 text-2xl">
                <span className="opacity-50 line-through text-gray-500">🎮</span>
                <span className="opacity-50 line-through text-gray-500">⌨️</span>
                <ArrowRight className="w-6 h-6 text-purple-500" />
                <span className="text-4xl animate-pulse">✋</span>
              </div>

              <p className="text-gray-400 text-lg">
                No buttons. No weapons. <span className="text-purple-300">Just gestures.</span>
              </p>

              {/* Gesture demonstration */}
              <div className="p-6 bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-blue-900/30 rounded-2xl border border-purple-500/20 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">🤏</span>
                    <span className="text-xs text-gray-400 font-mono">PINCH</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-500/50" />
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">✊</span>
                    <span className="text-xs text-gray-400 font-mono">PULL</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-500/50" />
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">🖐️</span>
                    <span className="text-xs text-gray-400 font-mono">RELEASE</span>
                  </div>
                </div>
                <p className="mt-4 text-purple-300/70 text-sm italic">
                  Just like throwing a stone long ago...
                </p>
              </div>

              <p className="text-gray-400 leading-relaxed">
                But now, the target is digital. The playground is virtual. 
                And the <span className="text-blue-300">screen understands the human body.</span>
              </p>
            </div>

            {/* The Message */}
            <div className="max-w-2xl mx-auto mb-12 p-8 bg-gradient-to-br from-indigo-950/50 to-purple-950/50 rounded-2xl border border-indigo-500/20">
              <Heart className="w-8 h-8 text-pink-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">The Message</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                This is not just a game. It is a <span className="text-purple-300 font-medium">bridge between the past and the present.</span>
              </p>
              <p className="text-gray-400 text-sm">
                From traditional hand-based play to modern hand-motion shooting, 
                we see that technology did not replace humanity — <span className="text-blue-300">it returned power to it.</span>
              </p>
            </div>

            {/* Final statement */}
            <div className="mb-12">
              <p className="text-xl sm:text-2xl font-serif text-gray-200 italic">
                "The hand that once shaped history <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 font-bold not-italic">
                  is now shaping the future of gaming.
                </span>"
              </p>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={isTransitioning}
              className={`
                group relative px-12 py-5 font-bold text-lg tracking-wider
                transition-all duration-500 transform
                ${isTransitioning ? 'scale-95 opacity-70' : 'hover:scale-105'}
              `}
            >
              {/* Button background */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 rounded-xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity" />
              
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/50 rounded-tl-lg" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/50 rounded-br-lg" />

              {/* Content */}
              <div className="relative flex items-center gap-4 text-white">
                {isTransitioning ? (
                  <>
                    <Zap className="w-5 h-5 animate-spin" />
                    <span>LOADING...</span>
                  </>
                ) : (
                  <>
                    <Hand className="w-5 h-5" />
                    <span>BEGIN YOUR JOURNEY</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>

            <p className="mt-6 text-gray-500 text-sm">
              Experience the connection between ancient play and modern technology
            </p>
          </div>
        </section>
      </div>

      {/* Skip button */}
      <button
        onClick={handleContinue}
        className="fixed top-6 right-6 z-50 px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg backdrop-blur-sm transition-all hover:bg-white/5"
      >
        Skip Story →
      </button>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes flicker {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.95); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 1s ease-out both;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out both;
        }
        
        .animate-flicker {
          animation: flicker 2s ease-in-out infinite;
        }
        
        /* Hide scrollbar but keep functionality */
        ::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default StoryPage;
