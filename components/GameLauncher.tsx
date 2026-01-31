/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Game Launcher Component - Professional Homepage with menu music
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Volume2, VolumeX, Info, Zap, Target, BrainCircuit, Hand, Sparkles, ChevronRight, Star, Trophy, Gamepad2 } from 'lucide-react';
import * as Sound from '../services/soundService';

interface GameLauncherProps {
  onStartGame: () => void;
}

// Particle system for background
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
}

const BUBBLE_COLORS = [
  'rgba(239, 83, 80, 0.6)',   // Red
  'rgba(66, 165, 245, 0.6)',  // Blue
  'rgba(102, 187, 106, 0.6)', // Green
  'rgba(255, 238, 88, 0.6)',  // Yellow
  'rgba(171, 71, 188, 0.6)',  // Purple
  'rgba(255, 167, 38, 0.6)',  // Orange
];

const GameLauncher: React.FC<GameLauncherProps> = ({ onStartGame }) => {
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [hoverButton, setHoverButton] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const mousePos = useRef({ x: 0, y: 0 });

  // Initialize and animate particle background
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

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < 50; i++) {
        particlesRef.current.push({
          id: i,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5 - 0.3,
          size: Math.random() * 40 + 20,
          color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
          alpha: Math.random() * 0.3 + 0.1,
          life: Math.random() * 100,
        });
      }
    };
    initParticles();

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    let time = 0;
    const animate = () => {
      // Clear with gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGradient.addColorStop(0, '#0a0f1a');
      bgGradient.addColorStop(0.5, '#0d1525');
      bgGradient.addColorStop(1, '#0a0a15');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      const offsetX = (time * 0.2) % gridSize;
      const offsetY = (time * 0.15) % gridSize;
      
      for (let x = -gridSize + offsetX; x < canvas.width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = -gridSize + offsetY; y < canvas.height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw glowing orbs in background
      const orbPositions = [
        { x: canvas.width * 0.2, y: canvas.height * 0.3, size: 300, color: 'rgba(99, 102, 241, 0.08)' },
        { x: canvas.width * 0.8, y: canvas.height * 0.7, size: 400, color: 'rgba(168, 85, 247, 0.06)' },
        { x: canvas.width * 0.5, y: canvas.height * 0.5, size: 500, color: 'rgba(59, 130, 246, 0.04)' },
      ];
      
      orbPositions.forEach(orb => {
        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size);
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(orb.x - orb.size, orb.y - orb.size, orb.size * 2, orb.size * 2);
      });

      // Update and draw particles
      particlesRef.current.forEach((p, index) => {
        // Mouse interaction - subtle attraction
        const dx = mousePos.current.x - p.x;
        const dy = mousePos.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          p.vx += dx * 0.00005;
          p.vy += dy * 0.00005;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.5;

        // Wrap around edges
        if (p.x < -p.size) p.x = canvas.width + p.size;
        if (p.x > canvas.width + p.size) p.x = -p.size;
        if (p.y < -p.size) {
          p.y = canvas.height + p.size;
          p.x = Math.random() * canvas.width;
        }
        if (p.y > canvas.height + p.size) p.y = -p.size;

        // Draw bubble with glow
        const pulseAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.life * 0.03));
        
        // Outer glow
        const glowGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.5);
        glowGradient.addColorStop(0, p.color.replace('0.6', String(pulseAlpha * 0.5)));
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Inner bubble
        const bubbleGradient = ctx.createRadialGradient(
          p.x - p.size * 0.3, p.y - p.size * 0.3, 0,
          p.x, p.y, p.size
        );
        bubbleGradient.addColorStop(0, `rgba(255, 255, 255, ${pulseAlpha * 0.4})`);
        bubbleGradient.addColorStop(0.5, p.color.replace('0.6', String(pulseAlpha)));
        bubbleGradient.addColorStop(1, p.color.replace('0.6', String(pulseAlpha * 0.3)));
        
        ctx.fillStyle = bubbleGradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x - p.size * 0.25, p.y - p.size * 0.25, p.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw connecting lines between nearby particles
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.globalAlpha = (1 - dist / 150) * 0.3;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      time++;
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Initialize audio on first interaction
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
      console.warn('Audio initialization failed:', e);
    }
  }, [audioInitialized, musicEnabled]);

  // Handle first user interaction
  const handleInteraction = useCallback(() => {
    initializeAudio();
  }, [initializeAudio]);

  // Toggle music
  const toggleMusic = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    await Sound.resumeAudio();
    const newState = !musicEnabled;
    setMusicEnabled(newState);
    Sound.setMusicEnabled(newState);
    
    if (newState) {
      Sound.startBackgroundMusic();
    } else {
      Sound.stopBackgroundMusic();
    }
    
    Sound.playUIClickSound();
    setAudioInitialized(true);
  }, [musicEnabled]);

  // Handle start game
  const handleStartGame = useCallback(async () => {
    if (isStarting) return;
    
    setIsStarting(true);
    await Sound.resumeAudio();
    Sound.playGameStartSound();
    
    setTimeout(() => {
      onStartGame();
    }, 600);
  }, [onStartGame, isStarting]);

  // Toggle how to play
  const toggleHowToPlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowHowToPlay(!showHowToPlay);
    Sound.playUIClickSound();
  }, [showHowToPlay]);

  return (
    <div 
      className="fixed inset-0 overflow-y-auto overflow-x-hidden select-none"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {/* Animated Background Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0" />
      
      {/* Vignette overlay */}
      <div 
        className="fixed inset-0 z-5 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-full px-4 py-8">
        
        {/* Logo / Title Section */}
        <div className="text-center mb-12 animate-fadeInDown relative">
          {/* Main Title */}
          <div className="relative z-10">
             <h1 className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-2 scale-y-125">
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 filter drop-shadow-2xl">
                   MOTION
                </span>
             </h1>
             <h1 className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter -mt-2 xs:-mt-4 sm:-mt-6 md:-mt-8 scale-y-125">
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-400 via-purple-500 to-pink-500 filter drop-shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                   SHOT
                </span>
             </h1>
          </div>
          
          {/* Subtitle */}
          <div className="flex items-center justify-center gap-4 mt-6">
             <div className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent to-blue-500/50" />
             <p className="text-sm sm:text-base text-blue-200 font-mono tracking-[0.4em] uppercase">
                Neural Interface Active
             </p>
             <div className="h-px w-8 sm:w-16 bg-gradient-to-l from-transparent to-purple-500/50" />
          </div>
          
          {/* Powered by badge */}
          <div className="absolute -right-4 -top-8 rotate-12 bg-black/40 border border-purple-500/30 backdrop-blur-md px-3 py-1 rounded-sm shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-pulse">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] font-bold text-gray-300 tracking-wider">GEMINI AI</span>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 max-w-4xl w-full animate-fadeInUp">
          <FeatureCard 
            icon={<Hand className="w-5 h-5" />}
            title="Hand Tracking"
            description="Precision gesture control system enabled."
            color="blue"
            delay={0}
          />
          <FeatureCard 
            icon={<BrainCircuit className="w-5 h-5" />}
            title="AI Strategy"
            description="Real-time tactical analysis online."
            color="purple"
            delay={100}
          />
          <FeatureCard 
            icon={<Target className="w-5 h-5" />}
            title="Surgical Aim"
            description="Advanced trajectory prediction module."
            color="orange"
            delay={200}
          />
        </div>

        {/* Start Button */}
        <div className="relative mb-8 animate-fadeInUp flex flex-col items-center" style={{ animationDelay: '300ms' }}>
          <button
            onClick={handleStartGame}
            onMouseEnter={() => setHoverButton(true)}
            onMouseLeave={() => setHoverButton(false)}
            disabled={isStarting}
            className={`
              relative group w-full max-w-[280px] sm:max-w-none sm:w-auto px-8 sm:px-16 py-6 font-bold text-xl tracking-widest overflow-hidden
              transition-all duration-300 transform
              ${isStarting ? 'cursor-wait scale-95 opacity-80' : 'hover:scale-105 active:scale-95'}
            `}
          >
            {/* Button Backgrounds */}
            <div className="absolute inset-0 bg-black skew-x-[-12deg] border border-white/20 group-hover:border-white/50 transition-colors" />
            <div className={`absolute inset-0 bg-blue-600 skew-x-[-12deg] opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${isStarting ? 'animate-pulse opacity-40' : ''}`} />
            
            {/* Glitch Overlay */}
            {hoverButton && (
                <div className="absolute inset-0 skew-x-[-12deg] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1s_infinite]" />
            )}

            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-blue-400" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-purple-400" />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-4 text-white">
              {isStarting ? (
                <>
                  <Zap className="w-5 h-5 animate-spin" />
                  <span>INITIALIZING...</span>
                </>
              ) : (
                <>
                  <span className="text-blue-400 group-hover:text-white transition-colors">START</span>
                  <span className="h-4 w-px bg-white/30" />
                  <span className="group-hover:text-blue-400 transition-colors">MISSION</span>
                  <ChevronRight className={`w-5 h-5 text-purple-400 transition-transform duration-300 ${hoverButton ? 'translate-x-1' : ''}`} />
                </>
              )}
            </div>
          </button>
          
          {/* Decorative lines under button */}
          <div className="mt-4 flex gap-1 opacity-30">
             <div className="w-2 h-1 bg-white skew-x-[-12deg]" />
             <div className="w-2 h-1 bg-white skew-x-[-12deg]" />
             <div className="w-16 h-1 bg-gradient-to-r from-white to-transparent skew-x-[-12deg]" />
          </div>
        </div>

        {/* Audio prompt */}
        {!audioInitialized && (
          <p className="text-gray-500 text-sm mb-4 animate-pulse flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Click anywhere to enable audio
          </p>
        )}

        {/* How to Play Toggle */}
        <button
          onClick={toggleHowToPlay}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
        >
          <Info className="w-4 h-4" />
          <span>{showHowToPlay ? 'Hide Instructions' : 'How to Play'}</span>
        </button>

        {/* How to Play Panel */}
        {showHowToPlay && (
          <div className="mt-8 relative max-w-lg w-full animate-slideUp">
             {/* HUD Frame */}
             <div className="absolute -inset-1 border border-blue-500/20 clip-path-polygon" />
             <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-blue-400" />
             <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-blue-400" />
             
             <div className="relative p-6 bg-black/80 backdrop-blur-md border-l border-r border-blue-500/10">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                   <h3 className="text-white font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                     <Gamepad2 className="w-4 h-4 text-blue-400" />
                     Mission Directives
                   </h3>
                   <div className="text-[10px] text-gray-500 font-mono">CODE: 778-A</div>
                </div>

                <div className="space-y-3">
                  <InstructionItem 
                    icon="✋"
                    title="Hand Tracking"
                    description="Use pinch gesture (thumb + index) to engage mechanics."
                  />
                  <InstructionItem 
                    icon="🎯"
                    title="Targeting"
                    description="Pull back to adjust tension and trajectory."
                  />
                  <InstructionItem 
                    icon="🚀"
                    title="Launch"
                    description="Release pinch to fire projectile."
                  />
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Top Bar HUD */}
      <div className="fixed top-0 left-0 right-0 z-20 p-4 sm:p-6 flex justify-between items-start pointer-events-none">
        {/* Top Left - System Status */}
        <div className="flex flex-col gap-1">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[10px] sm:text-xs font-mono text-emerald-500/80">SYSTEM ONLINE</span>
           </div>
           <div className="text-[10px] text-gray-500 font-mono pl-4">
              V.2.4.0-RC1
           </div>
        </div>
        
        {/* Music Toggle - Restored pointer events */}
        <button
          onClick={toggleMusic}
          className={`
            pointer-events-auto
            p-3 rounded-sm backdrop-blur-md transition-all duration-300
            border border-white/10 hover:border-blue-500/50
            group relative overflow-hidden
          `}
        > 
          <div className={`absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300`} />
          {musicEnabled ? (
            <div className="flex gap-0.5 items-end h-4">
               {[1,2,3,4].map(i => (
                  <div key={i} className="w-1 bg-white" style={{ 
                     height: '100%', 
                     animation: `music-bar 0.5s ease-in-out infinite alternate -${i*0.1}s` 
                  }} />
               ))}
            </div>
          ) : (
            <VolumeX className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Bottom Bar HUD */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 sm:p-6 flex justify-between items-end text-xs text-gray-600 pointer-events-none">
        <div className="flex flex-col gap-1">
           <div className="h-px w-24 bg-white/20" />
           <div className="flex items-center gap-2 font-mono text-gray-500">
             <span>ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
           </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-gray-600">Secure Connection</span>
            <div className="flex gap-0.5">
               <div className="w-1 h-3 bg-emerald-900" />
               <div className="w-1 h-2 bg-emerald-800" />
               <div className="w-1 h-2 bg-emerald-800" />
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-12deg); }
          100% { transform: translateX(150%) skewX(-12deg); }
        }

        @keyframes music-bar {
          0% { height: 10%; opacity: 0.5; }
          100% { height: 100%; opacity: 1; }
        }
        
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .drop-shadow-glow {
           filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));
        }
        
        .cursor-wait {
           cursor: wait;
        }

        .animate-fadeInDown {
          animation: fadeInDown 0.8s ease-out both;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out both;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s ease-out both;
        }
      `}</style>
    </div>
  );
};

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'purple' | 'orange';
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color, delay }) => {
  const colorClasses = {
    blue: 'border-blue-500/30 bg-blue-900/10 text-blue-400',
    purple: 'border-purple-500/30 bg-purple-900/10 text-purple-400',
    orange: 'border-orange-500/30 bg-orange-900/10 text-orange-400',
  };

  return (
    <div 
      className={`
        relative p-4 sm:p-5 rounded-sm border-l-2 backdrop-blur-sm
        ${colorClasses[color]}
        hover:translate-x-2 transition-transform duration-300
        group cursor-default overflow-hidden
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>
      <div className="flex items-center gap-3 mb-2">
         <div className={`p-1.5 rounded-sm bg-white/5 ${colorClasses[color].split(' ').pop()}`}>
            {icon}
         </div>
         <h3 className="text-white font-bold tracking-wide text-sm uppercase">{title}</h3>
      </div>
      <p className="text-gray-400 text-xs font-mono leading-relaxed pl-1 border-l border-white/10">{description}</p>
      
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[200%] w-full -translate-y-full group-hover:translate-y-full transition-transform duration-1000 ease-in-out pointer-events-none" />
    </div>
  );
};

// Instruction Item Component
interface InstructionItemProps {
  icon: string;
  title: string;
  description: string;
}

const InstructionItem: React.FC<InstructionItemProps> = ({ icon, title, description }) => (
  <div className="flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded-sm hover:border-white/10 transition-colors">
    <div className="text-2xl filter drop-shadow-glow">{icon}</div>
    <div>
      <h4 className="text-blue-200 font-bold text-xs uppercase tracking-wider mb-0.5">{title}</h4>
      <p className="text-gray-400 text-xs font-mono">{description}</p>
    </div>
  </div>
);

export default GameLauncher;
