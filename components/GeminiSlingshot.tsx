/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getStrategicHint, TargetCandidate } from '../services/geminiService';
import { Point, Bubble, Particle, BubbleColor, DebugInfo } from '../types';
import { Loader2, Trophy, BrainCircuit, Play, MousePointerClick, Eye, Terminal, Clock, AlertTriangle, Target, Lightbulb, Monitor, Volume2, VolumeX } from 'lucide-react';
import * as Sound from '../services/soundService';

const PINCH_THRESHOLD = 0.05;
const GRAVITY = 0.0; 
const FRICTION = 0.998; 

const BUBBLE_RADIUS = 22;
const ROW_HEIGHT = BUBBLE_RADIUS * Math.sqrt(3);
const GRID_COLS = 12;
const GRID_ROWS = 8;
const SLINGSHOT_BOTTOM_OFFSET = 220;

const MAX_DRAG_DIST = 180;
const MIN_FORCE_MULT = 0.15;
const MAX_FORCE_MULT = 0.45;

// Material Design Colors & Scoring Strategy
const COLOR_CONFIG: Record<BubbleColor, { hex: string, points: number, label: string }> = {
  red:    { hex: '#ef5350', points: 100, label: 'Red' },     // Material Red 400
  blue:   { hex: '#42a5f5', points: 150, label: 'Blue' },    // Material Blue 400
  green:  { hex: '#66bb6a', points: 200, label: 'Green' },   // Material Green 400
  yellow: { hex: '#ffee58', points: 250, label: 'Yellow' },  // Material Yellow 400
  purple: { hex: '#ab47bc', points: 300, label: 'Purple' },  // Material Purple 400
  orange: { hex: '#ffa726', points: 500, label: 'Orange' }   // Material Orange 400
};

const COLOR_KEYS: BubbleColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

// Color Helper for Gradients
const adjustColor = (color: string, amount: number) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
    
    const componentToHex = (c: number) => {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };
    
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};

const GeminiSlingshot: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  // Game State Refs
  const ballPos = useRef<Point>({ x: 0, y: 0 });
  const ballVel = useRef<Point>({ x: 0, y: 0 });
  const anchorPos = useRef<Point>({ x: 0, y: 0 });
  const isPinching = useRef<boolean>(false);
  const isFlying = useRef<boolean>(false);
  const flightStartTime = useRef<number>(0);
  const bubbles = useRef<Bubble[]>([]);
  const particles = useRef<Particle[]>([]);
  const scoreRef = useRef<number>(0);
  
  const aimTargetRef = useRef<Point | null>(null);
  const isAiThinkingRef = useRef<boolean>(false);
  
  // AI Request Trigger
  const captureRequestRef = useRef<boolean>(false);
  
  // Touch/Mouse Input State
  const pointerState = useRef<{ x: number, y: number, active: boolean }>({ x: 0, y: 0, active: false });

  // Current active color (Ref for loop, State for UI)
  const selectedColorRef = useRef<BubbleColor>('red');
  
  // React State
  const [loading, setLoading] = useState(true);
  const [aiHint, setAiHint] = useState<string | null>("Initializing strategy engine...");
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [aimTarget, setAimTarget] = useState<Point | null>(null);
  const [score, setScore] = useState(0);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [selectedColor, setSelectedColor] = useState<BubbleColor>('red');
  const [availableColors, setAvailableColors] = useState<BubbleColor[]>([]);
  const [aiRecommendedColor, setAiRecommendedColor] = useState<BubbleColor | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  
  // Enhanced UX States
  const [comboCount, setComboCount] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastScoreGain, setLastScoreGain] = useState<{ points: number; x: number; y: number; combo: number } | null>(null);
  const [screenShake, setScreenShake] = useState(0);
  const [powerLevel, setPowerLevel] = useState(0);
  const [shotsRemaining, setShotsRemaining] = useState(50);
  const [level, setLevel] = useState(1);
  const [levelMessage, setLevelMessage] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [perfectShot, setPerfectShot] = useState(false);
  const [floatingScores, setFloatingScores] = useState<Array<{ id: number; points: number; x: number; y: number; combo: number; color: string }>>([]);
  
  // Pull & Release UX States
  const [isPulling, setIsPulling] = useState(false);
  const [releaseFlash, setReleaseFlash] = useState(false);
  const [pullAngle, setPullAngle] = useState(0);
  const [showPullHint, setShowPullHint] = useState(true);
  const [pullVibration, setPullVibration] = useState(0);
  const [ballTrail, setBallTrail] = useState<Array<{x: number, y: number, age: number}>>([]);
  
  // Sound tracking refs
  const lastBounceTime = useRef<number>(0);
  const wasGrabbing = useRef<boolean>(false);
  const wasHandVisible = useRef<boolean>(false);
  const lastStretchSoundTime = useRef<number>(0);
  const gameStarted = useRef<boolean>(false);
  
  // Combo/UX refs
  const comboRef = useRef<number>(0);
  const comboResetTimer = useRef<NodeJS.Timeout | null>(null);
  const floatingScoreId = useRef<number>(0);
  const lastMatchTime = useRef<number>(0);
  const ballTrailRef = useRef<Array<{x: number, y: number, age: number}>>([]);
  const lastTrailUpdate = useRef<number>(0);

  // Sync state to ref
  useEffect(() => {
    selectedColorRef.current = selectedColor;
  }, [selectedColor]);

  useEffect(() => {
    aimTargetRef.current = aimTarget;
  }, [aimTarget]);

  useEffect(() => {
    isAiThinkingRef.current = isAiThinking;
  }, [isAiThinking]);

  // Sync sound enabled state
  useEffect(() => {
    Sound.setSoundEnabled(soundEnabled);
    if (!soundEnabled) {
      Sound.stopBackgroundMusic();
    }
  }, [soundEnabled]);

  // Sync music enabled state
  useEffect(() => {
    Sound.setMusicEnabled(musicEnabled);
    // Ensure background music is playing when game starts
    if (musicEnabled && soundEnabled) {
      Sound.resumeAudio().then(() => {
        Sound.startBackgroundMusic();
      });
    }
  }, [musicEnabled, soundEnabled]);
  
  const getBubblePos = (row: number, col: number, width: number) => {
    const xOffset = (width - (GRID_COLS * BUBBLE_RADIUS * 2)) / 2 + BUBBLE_RADIUS;
    const isOdd = row % 2 !== 0;
    const x = xOffset + col * (BUBBLE_RADIUS * 2) + (isOdd ? BUBBLE_RADIUS : 0);
    const y = BUBBLE_RADIUS + row * ROW_HEIGHT;
    return { x, y };
  };

  const updateAvailableColors = () => {
    const activeColors = new Set<BubbleColor>();
    bubbles.current.forEach(b => {
        if (b.active) activeColors.add(b.color);
    });
    setAvailableColors(Array.from(activeColors));
    
    // If current selected color is gone, switch to first available
    if (!activeColors.has(selectedColorRef.current) && activeColors.size > 0) {
        const next = Array.from(activeColors)[0];
        setSelectedColor(next);
    }
  };

  const initGrid = useCallback((width: number) => {
    const newBubbles: Bubble[] = [];
    for (let r = 0; r < 5; r++) { 
      for (let c = 0; c < (r % 2 !== 0 ? GRID_COLS - 1 : GRID_COLS); c++) {
        if (Math.random() > 0.1) {
            const { x, y } = getBubblePos(r, c, width);
            newBubbles.push({
              id: `${r}-${c}`,
              row: r,
              col: c,
              x,
              y,
              color: COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)],
              active: true
            });
        }
      }
    }
    bubbles.current = newBubbles;
    updateAvailableColors();
    
    // Trigger initial AI analysis after a short delay to allow render
    setTimeout(() => {
        captureRequestRef.current = true;
    }, 2000);
  }, []);

  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      particles.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 1.0,
        color
      });
    }
  };

  const isPathClear = (target: Bubble) => {
    if (!anchorPos.current) return false;
    
    const startX = anchorPos.current.x;
    const startY = anchorPos.current.y;
    const endX = target.x;
    const endY = target.y;

    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(distance / (BUBBLE_RADIUS / 2)); 

    for (let i = 1; i < steps - 2; i++) { 
        const t = i / steps;
        const cx = startX + dx * t;
        const cy = startY + dy * t;

        for (const b of bubbles.current) {
            if (!b.active || b.id === target.id) continue;
            const distSq = Math.pow(cx - b.x, 2) + Math.pow(cy - b.y, 2);
            if (distSq < Math.pow(BUBBLE_RADIUS * 1.8, 2)) {
                return false; 
            }
        }
    }
    return true;
  };

  const getAllReachableClusters = (): TargetCandidate[] => {
    const activeBubbles = bubbles.current.filter(b => b.active);
    const uniqueColors = Array.from(new Set(activeBubbles.map(b => b.color))) as BubbleColor[];
    const allClusters: TargetCandidate[] = [];

    // Analyze opportunities for ALL colors
    for (const color of uniqueColors) {
        const visited = new Set<string>();
        
        for (const b of activeBubbles) {
            if (b.color !== color || visited.has(b.id)) continue;

            const clusterMembers: Bubble[] = [];
            const queue = [b];
            visited.add(b.id);

            while (queue.length > 0) {
                const curr = queue.shift()!;
                clusterMembers.push(curr);
                
                const neighbors = activeBubbles.filter(n => 
                    !visited.has(n.id) && n.color === color && isNeighbor(curr, n)
                );
                neighbors.forEach(n => {
                    visited.add(n.id);
                    queue.push(n);
                });
            }

            // Check if this cluster is hittable
            clusterMembers.sort((a,b) => b.y - a.y); 
            const hittableMember = clusterMembers.find(m => isPathClear(m));

            if (hittableMember) {
                const xPct = hittableMember.x / (gameContainerRef.current?.clientWidth || window.innerWidth);
                let desc = "Center";
                if (xPct < 0.33) desc = "Left";
                else if (xPct > 0.66) desc = "Right";

                allClusters.push({
                    id: hittableMember.id,
                    color: color,
                    size: clusterMembers.length,
                    row: hittableMember.row,
                    col: hittableMember.col,
                    pointsPerBubble: COLOR_CONFIG[color].points,
                    description: `${desc}`
                });
            }
        }
    }
    return allClusters;
  };

  const checkMatches = (startBubble: Bubble) => {
    const toCheck = [startBubble];
    const visited = new Set<string>();
    const matches: Bubble[] = [];
    const targetColor = startBubble.color;

    while (toCheck.length > 0) {
      const current = toCheck.pop()!;
      if (visited.has(current.id)) continue;
      visited.add(current.id);

      if (current.color === targetColor) {
        matches.push(current);
        const neighbors = bubbles.current.filter(b => b.active && !visited.has(b.id) && isNeighbor(current, b));
        toCheck.push(...neighbors);
      }
    }

    if (matches.length >= 3) {
      const now = performance.now();
      const timeSinceLastMatch = now - lastMatchTime.current;
      
      // Update combo - if match within 3 seconds, increase combo
      if (timeSinceLastMatch < 3000 && comboRef.current > 0) {
        comboRef.current++;
      } else {
        comboRef.current = 1;
      }
      lastMatchTime.current = now;
      
      // Update max combo
      if (comboRef.current > maxCombo) {
        setMaxCombo(comboRef.current);
      }
      setComboCount(comboRef.current);
      
      // Clear previous combo reset timer
      if (comboResetTimer.current) {
        clearTimeout(comboResetTimer.current);
      }
      // Set new combo reset timer
      comboResetTimer.current = setTimeout(() => {
        comboRef.current = 0;
        setComboCount(0);
      }, 3000);
      
      let points = 0;
      const basePoints = COLOR_CONFIG[targetColor].points;
      
      // Calculate center position for floating score
      let centerX = 0, centerY = 0;
      matches.forEach(b => {
        b.active = false;
        createExplosion(b.x, b.y, COLOR_CONFIG[b.color].hex);
        points += basePoints;
        centerX += b.x;
        centerY += b.y;
      });
      centerX /= matches.length;
      centerY /= matches.length;
      
      // Size multiplier (3 bubbles = 1x, 4+ = 1.5x, 6+ = 2x, 10+ = 3x)
      const sizeMultiplier = matches.length >= 10 ? 3.0 : matches.length >= 6 ? 2.0 : matches.length > 3 ? 1.5 : 1.0;
      // Combo multiplier (1x base, +0.5x per combo level)
      const comboMultiplier = 1 + (comboRef.current - 1) * 0.5;
      const totalMultiplier = sizeMultiplier * comboMultiplier;
      const finalPoints = Math.floor(points * totalMultiplier);
      
      scoreRef.current += finalPoints;
      setScore(scoreRef.current);
      
      // Add floating score animation
      const scoreId = floatingScoreId.current++;
      setFloatingScores(prev => [...prev, {
        id: scoreId,
        points: finalPoints,
        x: centerX,
        y: centerY,
        combo: comboRef.current,
        color: COLOR_CONFIG[targetColor].hex
      }]);
      
      // Remove floating score after animation
      setTimeout(() => {
        setFloatingScores(prev => prev.filter(s => s.id !== scoreId));
      }, 1500);
      
      // Screen shake for big combos
      if (matches.length >= 5 || comboRef.current >= 3) {
        const shakeIntensity = Math.min(matches.length + comboRef.current * 2, 15);
        setScreenShake(shakeIntensity);
        setTimeout(() => setScreenShake(0), 300);
      }
      
      // Perfect shot detection (hitting AI recommended target)
      if (aimTargetRef.current) {
        const distToTarget = Math.sqrt(
          Math.pow(centerX - aimTargetRef.current.x, 2) + 
          Math.pow(centerY - aimTargetRef.current.y, 2)
        );
        if (distToTarget < BUBBLE_RADIUS * 3) {
          setPerfectShot(true);
          setTimeout(() => setPerfectShot(false), 1000);
        }
      }
      
      // Play pop sound with combo info
      Sound.playPopSound(matches.length);
      
      // Check level progression (every 2000 points = new level)
      const newLevel = Math.floor(scoreRef.current / 2000) + 1;
      if (newLevel > level) {
        setLevel(newLevel);
        setLevelMessage(`Level ${newLevel}!`);
        setTimeout(() => setLevelMessage(null), 2000);
      }
      
      // Check win condition - all bubbles cleared
      setTimeout(() => {
        const remainingBubbles = bubbles.current.filter(b => b.active).length;
        if (remainingBubbles === 0 && gameStatus === 'playing') {
          setGameStatus('won');
          setLevelMessage('🎉 YOU WIN! 🎉');
        }
      }, 100);
      
      return true;
    }
    return false;
  };

  const isNeighbor = (a: Bubble, b: Bubble) => {
    const dr = b.row - a.row;
    const dc = b.col - a.col;
    if (Math.abs(dr) > 1) return false;
    if (dr === 0) return Math.abs(dc) === 1;
    if (a.row % 2 !== 0) {
        return dc === 0 || dc === 1;
    } else {
        return dc === -1 || dc === 0;
    }
  };

  const performAiAnalysis = async (screenshot: string) => {
    // Lock interaction immediately via ref (fast) and state (render)
    isAiThinkingRef.current = true;
    setIsAiThinking(true);
    setAiHint("Analyzing tactical options...");
    setAiRationale(null);
    setAiRecommendedColor(null);
    setAimTarget(null);
    
    // Play AI thinking sound
    Sound.playAiThinkingSound();

    // Client-Side Pre-Calc for ALL colors
    const allClusters = getAllReachableClusters();
    const maxRow = bubbles.current.reduce((max, b) => b.active ? Math.max(max, b.row) : max, 0);

    const canvasWidth = canvasRef.current?.width || 1000;

    getStrategicHint(
        screenshot,
        allClusters,
        maxRow
    ).then(aiResponse => {
        const { hint, debug } = aiResponse;
        setDebugInfo(debug);
        setAiHint(hint.message);
        setAiRationale(hint.rationale || null);
        
        if (typeof hint.targetRow === 'number' && typeof hint.targetCol === 'number') {
            if (hint.recommendedColor) {
                setAiRecommendedColor(hint.recommendedColor);
                setSelectedColor(hint.recommendedColor); // Auto-equip recommendation
            }
            const pos = getBubblePos(hint.targetRow, hint.targetCol, canvasWidth);
            setAimTarget(pos);
            
            // Play AI hint sound on successful analysis
            Sound.playAiHintSound();
        }
        
        // Unlock
        isAiThinkingRef.current = false;
        setIsAiThinking(false);
    });
  };

  // --- Rendering Helper ---
  const drawBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, colorKey: BubbleColor) => {
    const config = COLOR_CONFIG[colorKey];
    const baseColor = config.hex;
    
    // Main Sphere Gradient (gives 3D depth)
    // Shifted focus to top-left for light source
    const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
    grad.addColorStop(0, '#ffffff');             // Specular highlight center (brightest)
    grad.addColorStop(0.2, baseColor);           // Main color body
    grad.addColorStop(1, adjustColor(baseColor, -60)); // Shadowed edge (darkest)

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle Outline for definition
    ctx.strokeStyle = adjustColor(baseColor, -80);
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Secondary "Glossy" Highlight (Hard reflection)
    ctx.beginPath();
    ctx.ellipse(x - radius * 0.3, y - radius * 0.35, radius * 0.25, radius * 0.15, Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
  };

  // --- Main Game Loop ---

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !gameContainerRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const container = gameContainerRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    // Set initial size based on container
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    anchorPos.current = { x: canvas.width / 2, y: canvas.height - SLINGSHOT_BOTTOM_OFFSET };
    ballPos.current = { ...anchorPos.current };
    
    initGrid(canvas.width);

    let camera: any = null;
    let hands: any = null;

    const onResults = (results: any) => {
      setLoading(false);
      
      // Start game sound and music on first frame
      if (!gameStarted.current) {
        gameStarted.current = true;
        Sound.playGameStartSound();
      }
      
      // Responsive Resize
      if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        anchorPos.current = { x: canvas.width / 2, y: canvas.height - SLINGSHOT_BOTTOM_OFFSET };
        if (!isFlying.current && !isPinching.current) {
          ballPos.current = { ...anchorPos.current };
        }
      }

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Video Feed
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      // Material Dark Overlay
      ctx.fillStyle = 'rgba(18, 18, 18, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // --- INPUT HANDLING (Hand + Touch/Mouse) ---
      let inputPos: Point | null = null;
      let pinchDist = 1.0;
      const isInputActive = isPinching.current; // Track if we are currently holding

      // 1. Hand Tracking Input
      const handVisible = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
      
      // Hand detected sound logic
      if (handVisible && !wasHandVisible.current) {
        Sound.playHandDetectedSound();
      } else if (!handVisible && wasHandVisible.current) {
        Sound.playHandLostSound();
      }
      wasHandVisible.current = handVisible;

      if (handVisible) {
        const landmarks = results.multiHandLandmarks[0];
        const idxTip = landmarks[8];
        const thumbTip = landmarks[4];

        inputPos = {
          x: (idxTip.x * canvas.width + thumbTip.x * canvas.width) / 2,
          y: (idxTip.y * canvas.height + thumbTip.y * canvas.height) / 2
        };

        const dx = idxTip.x - thumbTip.x;
        const dy = idxTip.y - thumbTip.y;
        pinchDist = Math.sqrt(dx * dx + dy * dy);

        if (window.drawConnectors && window.drawLandmarks) {
           window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {color: '#669df6', lineWidth: 1});
           window.drawLandmarks(ctx, landmarks, {color: '#aecbfa', lineWidth: 1, radius: 2});
        }
        
        ctx.beginPath();
        ctx.arc(inputPos.x, inputPos.y, 20, 0, Math.PI * 2);
        ctx.strokeStyle = pinchDist < PINCH_THRESHOLD ? '#66bb6a' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 2. Touch/Mouse Override
      // If no hand is visible (or even if it is, but user touches screen), allow touch
      // We check the global 'pointerPosRef' which we'll add to the component scope
      if (pointerState.current.active) {
          inputPos = { ...pointerState.current };
          pinchDist = 0; // Touch is always a "pinch"
          
          // Visual indicator for touch
          ctx.beginPath();
          ctx.arc(inputPos.x, inputPos.y, 30, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
      }
      
      // --- SLINGSHOT LOGIC ---
      
      // Check if we are currently "Locked" waiting for AI
      const isLocked = isAiThinkingRef.current;

      if (!isLocked && inputPos && pinchDist < PINCH_THRESHOLD && !isFlying.current) {
        const distToBall = Math.sqrt(Math.pow(inputPos.x - ballPos.current.x, 2) + Math.pow(inputPos.y - ballPos.current.y, 2));
        if (!isPinching.current && distToBall < 100) {
           isPinching.current = true;
           setIsPulling(true);
           setShowPullHint(false);
           // Play grab sound
           Sound.playGrabSound();
        }
        
        if (isPinching.current) {
            ballPos.current = { x: inputPos.x, y: inputPos.y };
            const dragDx = ballPos.current.x - anchorPos.current.x;
            const dragDy = ballPos.current.y - anchorPos.current.y;
            const dragDist = Math.sqrt(dragDx*dragDx + dragDy*dragDy);
            
            // Update power level for UI
            const powerRatio = Math.min(dragDist / MAX_DRAG_DIST, 1.0);
            setPowerLevel(powerRatio);
            
            // Calculate and store pull angle for UI
            const angle = Math.atan2(-dragDy, -dragDx) * (180 / Math.PI);
            setPullAngle(angle);
            
            // Vibration effect at high tension
            if (powerRatio > 0.8) {
              setPullVibration((Math.random() - 0.5) * (powerRatio - 0.8) * 10);
            } else {
              setPullVibration(0);
            }
            
            // Play stretch sound feedback (throttled)
            const now = performance.now();
            if (now - lastStretchSoundTime.current > 100 && dragDist > 20) {
                Sound.playStretchSound(powerRatio);
                lastStretchSoundTime.current = now;
                
                // Play max tension sound at full stretch
                if (powerRatio > 0.95) {
                    Sound.playMaxTensionSound();
                }
            }
            
            if (dragDist > MAX_DRAG_DIST) {
                const angle = Math.atan2(dragDy, dragDx);
                ballPos.current.x = anchorPos.current.x + Math.cos(angle) * MAX_DRAG_DIST;
                ballPos.current.y = anchorPos.current.y + Math.sin(angle) * MAX_DRAG_DIST;
            }
        }
      } 
      else if (isPinching.current && (!inputPos || pinchDist >= PINCH_THRESHOLD || isLocked)) {
        // Release or Forced Release if Locked
        isPinching.current = false;
        setIsPulling(false);
        setPowerLevel(0); // Reset power gauge
        setPullVibration(0); // Reset vibration
        
        if (isLocked) {
             // If we lock while pinching, reset to anchor
             ballPos.current = { ...anchorPos.current };
        } else {
            const dx = anchorPos.current.x - ballPos.current.x;
            const dy = anchorPos.current.y - ballPos.current.y;
            const stretchDist = Math.sqrt(dx*dx + dy*dy);
            
            if (stretchDist > 30 && shotsRemaining > 0 && gameStatus === 'playing') {
                isFlying.current = true;
                flightStartTime.current = performance.now();
                const powerRatio = Math.min(stretchDist / MAX_DRAG_DIST, 1.0);
                const velocityMultiplier = MIN_FORCE_MULT + (MAX_FORCE_MULT - MIN_FORCE_MULT) * (powerRatio * powerRatio);

                ballVel.current = {
                    x: dx * velocityMultiplier,
                    y: dy * velocityMultiplier
                };
                
                // Release flash effect
                setReleaseFlash(true);
                setTimeout(() => setReleaseFlash(false), 150);
                
                // Create release burst particles at anchor point
                for (let i = 0; i < 12; i++) {
                  const angle = (Math.PI * 2 * i) / 12;
                  const speed = 3 + Math.random() * 4;
                  particles.current.push({
                    x: anchorPos.current.x,
                    y: anchorPos.current.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.8,
                    color: powerRatio > 0.8 ? '#ffa726' : powerRatio > 0.5 ? '#ffee58' : '#66bb6a'
                  });
                }
                
                // Decrement shots
                setShotsRemaining(prev => {
                  const newShots = prev - 1;
                  if (newShots <= 0) {
                    // Check game over condition
                    setTimeout(() => {
                      const activeBubbles = bubbles.current.filter(b => b.active).length;
                      if (activeBubbles === 0) {
                        setGameStatus('won');
                        setLevelMessage('🎉 YOU WIN! 🎉');
                      } else {
                        setGameStatus('lost');
                        setLevelMessage('Game Over!');
                      }
                    }, 1000);
                  }
                  return newShots;
                });
                
                // Play launch sound
                Sound.playLaunchSound();
                Sound.startFlyingSound();
            } else {
                ballPos.current = { ...anchorPos.current };
            }
        }
      }
      else if (!isFlying.current && !isPinching.current) {
          const dx = anchorPos.current.x - ballPos.current.x;
          const dy = anchorPos.current.y - ballPos.current.y;
          ballPos.current.x += dx * 0.15;
          ballPos.current.y += dy * 0.15;
      }

      // --- Physics ---
      if (isFlying.current) {
        // Update ball trail
        const now = performance.now();
        if (now - lastTrailUpdate.current > 16) { // ~60fps
          ballTrailRef.current.push({
            x: ballPos.current.x,
            y: ballPos.current.y,
            age: 0
          });
          // Age existing trail points and remove old ones
          ballTrailRef.current = ballTrailRef.current
            .map(p => ({ ...p, age: p.age + 1 }))
            .filter(p => p.age < 15);
          lastTrailUpdate.current = now;
        }
        
        // Infinite bounce safeguard: if flying for more than 5 seconds (5000ms), cancel shot
        if (performance.now() - flightStartTime.current > 5000) {
            isFlying.current = false;
            Sound.stopFlyingSound();
            ballTrailRef.current = []; // Clear trail
            ballPos.current = { ...anchorPos.current };
            ballVel.current = { x: 0, y: 0 };
        } else {
            const currentSpeed = Math.sqrt(ballVel.current.x ** 2 + ballVel.current.y ** 2);
            const steps = Math.ceil(currentSpeed / (BUBBLE_RADIUS * 0.8)); 
            let collisionOccurred = false;

            for (let i = 0; i < steps; i++) {
                ballPos.current.x += ballVel.current.x / steps;
                ballPos.current.y += ballVel.current.y / steps;
                
                if (ballPos.current.x < BUBBLE_RADIUS || ballPos.current.x > canvas.width - BUBBLE_RADIUS) {
                    ballVel.current.x *= -1;
                    ballPos.current.x = Math.max(BUBBLE_RADIUS, Math.min(canvas.width - BUBBLE_RADIUS, ballPos.current.x));
                    
                    // Play bounce sound (throttled to avoid spam)
                    const now = performance.now();
                    if (now - lastBounceTime.current > 100) {
                        Sound.playBounceSound();
                        lastBounceTime.current = now;
                    }
                }

                if (ballPos.current.y < BUBBLE_RADIUS) {
                    collisionOccurred = true;
                    break;
                }

                for (const b of bubbles.current) {
                    if (!b.active) continue;
                    const dist = Math.sqrt(
                        Math.pow(ballPos.current.x - b.x, 2) + 
                        Math.pow(ballPos.current.y - b.y, 2)
                    );
                    if (dist < BUBBLE_RADIUS * 1.8) { 
                        collisionOccurred = true;
                        break;
                    }
                }
                if (collisionOccurred) break;
            }

            ballVel.current.y += GRAVITY; 
            ballVel.current.x *= FRICTION;
            ballVel.current.y *= FRICTION;

            if (collisionOccurred) {
                isFlying.current = false;
                Sound.stopFlyingSound();
                ballTrailRef.current = []; // Clear trail on collision
                
                let bestDist = Infinity;
                let bestRow = 0;
                let bestCol = 0;
                let bestX = 0;
                let bestY = 0;

                for (let r = 0; r < GRID_ROWS + 5; r++) {
                    const colsInRow = r % 2 !== 0 ? GRID_COLS - 1 : GRID_COLS;
                    for (let c = 0; c < colsInRow; c++) {
                        const { x, y } = getBubblePos(r, c, canvas.width);
                        const occupied = bubbles.current.some(b => b.active && b.row === r && b.col === c);
                        if (occupied) continue;

                        const dist = Math.sqrt(
                            Math.pow(ballPos.current.x - x, 2) + 
                            Math.pow(ballPos.current.y - y, 2)
                        );
                        
                        if (dist < bestDist) {
                            bestDist = dist;
                            bestRow = r;
                            bestCol = c;
                            bestX = x;
                            bestY = y;
                        }
                    }
                }

                const newBubble: Bubble = {
                    id: `${bestRow}-${bestCol}-${Date.now()}`,
                    row: bestRow,
                    col: bestCol,
                    x: bestX,
                    y: bestY,
                    color: selectedColorRef.current,
                    active: true
                };
                bubbles.current.push(newBubble);
                const matched = checkMatches(newBubble);
                updateAvailableColors();
                
                // Play snap sound if no match occurred
                if (!matched) {
                    Sound.playSnapSound();
                }
                
                // Reset shot
                ballPos.current = { ...anchorPos.current };
                ballVel.current = { x: 0, y: 0 };

                // Request AI Analysis for next frame
                captureRequestRef.current = true;
            }
            
            if (ballPos.current.y > canvas.height) {
                isFlying.current = false;
                Sound.stopFlyingSound();
                ballTrailRef.current = []; // Clear trail
                ballPos.current = { ...anchorPos.current };
                ballVel.current = { x: 0, y: 0 };
            }
        }
      }

      // --- Drawing ---
      
      // Draw Grid Bubbles
      bubbles.current.forEach(b => {
          if (!b.active) return;
          drawBubble(ctx, b.x, b.y, BUBBLE_RADIUS - 1, b.color);
      });

      // --- Trajectory Line (Advanced Prediction) ---
      if (isPinching.current && !isFlying.current && !isLocked) {
          const dx = anchorPos.current.x - ballPos.current.x;
          const dy = anchorPos.current.y - ballPos.current.y;
          const userStretch = Math.sqrt(dx*dx + dy*dy);
          
          if (userStretch > 30) {
             ctx.save();
             ctx.beginPath();
             ctx.moveTo(anchorPos.current.x, anchorPos.current.y);
             
             // Simulate path
             const powerRatio = Math.min(userStretch / MAX_DRAG_DIST, 1.0);
             const vMult = MIN_FORCE_MULT + (MAX_FORCE_MULT - MIN_FORCE_MULT) * (powerRatio * powerRatio);
             let simX = anchorPos.current.x;
             let simY = anchorPos.current.y;
             let simVx = dx * vMult;
             let simVy = dy * vMult;
             
             // Draw dashed prediction
             ctx.beginPath();
             ctx.moveTo(simX, simY);
             
             for (let i = 0; i < 60; i++) { // Predict next ~60 frames
                 simX += simVx;
                 simY += simVy;
                 
                 // Wall Bounce
                 if (simX < BUBBLE_RADIUS || simX > canvas.width - BUBBLE_RADIUS) {
                     simVx *= -1;
                     simX = Math.max(BUBBLE_RADIUS, Math.min(canvas.width - BUBBLE_RADIUS, simX));
                 }
                 
                 // Stop if hitting top or bubbles (simple check)
                 if (simY < BUBBLE_RADIUS) break;
                 
                 ctx.lineTo(simX, simY);
             }
             
             ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
             ctx.lineWidth = 2;
             ctx.setLineDash([5, 5]);
             ctx.stroke();
             
             // Draw endpoint puck
             ctx.beginPath();
             ctx.arc(simX, simY, 4, 0, Math.PI * 2);
             ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
             ctx.fill();
             
             ctx.restore();
          }
      }

      // Laser Sight (AI Hint)
      const currentAimTarget = aimTargetRef.current;
      const thinking = isAiThinkingRef.current;
      const currentSelected = selectedColorRef.current;
      const shouldShowLine = currentAimTarget && !isFlying.current && 
                             (!aiRecommendedColor || aiRecommendedColor === currentSelected) && !isPinching.current;

      if (shouldShowLine || thinking) {
          ctx.save();
          const highlightColor = thinking ? '#a8c7fa' : COLOR_CONFIG[currentSelected].hex; 
          
          ctx.shadowBlur = 15;
          ctx.shadowColor = highlightColor;
          
          ctx.beginPath();
          ctx.moveTo(anchorPos.current.x, anchorPos.current.y);
          if (currentAimTarget) {
            ctx.lineTo(currentAimTarget.x, currentAimTarget.y);
          } else {
            ctx.lineTo(anchorPos.current.x, anchorPos.current.y - 200);
          }
          
          const time = performance.now();
          const dashOffset = (time / 15) % 30;
          ctx.setLineDash([20, 15]);
          ctx.lineDashOffset = -dashOffset;
          
          ctx.strokeStyle = thinking ? 'rgba(168, 199, 250, 0.5)' : highlightColor;
          ctx.lineWidth = 4;
          ctx.stroke();
          
          if (currentAimTarget && !thinking) {
              ctx.beginPath();
              ctx.arc(currentAimTarget.x, currentAimTarget.y, BUBBLE_RADIUS, 0, Math.PI * 2);
              ctx.setLineDash([5, 5]);
              ctx.strokeStyle = highlightColor;
              ctx.fillStyle = 'rgba(255,255,255,0.1)';
              ctx.fill();
              ctx.stroke();
          }
          
          ctx.restore();
      }
      
      // Removed Canvas "ANALYZING..." drawing code from here

      // Calculate pull strength for visual effects
      const pullDx = ballPos.current.x - anchorPos.current.x;
      const pullDy = ballPos.current.y - anchorPos.current.y;
      const pullDist = Math.sqrt(pullDx * pullDx + pullDy * pullDy);
      const pullStrength = Math.min(pullDist / MAX_DRAG_DIST, 1.0);
      
      // Dynamic band color based on pull strength
      const getBandColor = () => {
        if (!isPinching.current) return 'rgba(255,255,255,0.4)';
        if (pullStrength > 0.9) return '#ef5350'; // Red - max power
        if (pullStrength > 0.7) return '#ffa726'; // Orange - high power  
        if (pullStrength > 0.4) return '#ffee58'; // Yellow - medium power
        return '#66bb6a'; // Green - low power
      };
      
      const bandColor = getBandColor();
      const bandWidth = isPinching.current ? 5 + pullStrength * 6 : 5; // Thicker when pulled
      
      // Slingshot Band (Back) with glow
      if (!isFlying.current) {
        ctx.save();
        
        // Glow effect when pulling
        if (isPinching.current && pullStrength > 0.3) {
          ctx.shadowBlur = 10 + pullStrength * 15;
          ctx.shadowColor = bandColor;
        }
        
        ctx.beginPath();
        ctx.moveTo(anchorPos.current.x - 35, anchorPos.current.y - 10);
        ctx.lineTo(ballPos.current.x, ballPos.current.y);
        ctx.lineWidth = bandWidth;
        ctx.strokeStyle = bandColor;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }
      
      // Tension rings around ball when pulling
      if (isPinching.current && pullStrength > 0.2) {
        ctx.save();
        const ringCount = Math.floor(pullStrength * 3) + 1;
        for (let r = 0; r < ringCount; r++) {
          const ringRadius = BUBBLE_RADIUS + 10 + r * 12;
          const ringAlpha = (1 - r / ringCount) * 0.3 * pullStrength;
          ctx.beginPath();
          ctx.arc(ballPos.current.x + pullVibration, ballPos.current.y + pullVibration * 0.5, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw ball trail when flying
      if (isFlying.current && ballTrailRef.current.length > 0) {
        ctx.save();
        const trailColor = COLOR_CONFIG[selectedColorRef.current].hex;
        ballTrailRef.current.forEach((point, index) => {
          const alpha = Math.max(0, 1 - point.age / 15) * 0.6;
          const radius = BUBBLE_RADIUS * (1 - point.age / 20);
          if (radius > 0) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = trailColor.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
            // Convert hex to rgba
            const r = parseInt(trailColor.slice(1, 3), 16);
            const g = parseInt(trailColor.slice(3, 5), 16);
            const b = parseInt(trailColor.slice(5, 7), 16);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.fill();
          }
        });
        ctx.restore();
      }

      // Draw Slingshot Ball (Projectile)
      // If locked, we draw it slightly faded to indicate inactivity
      ctx.save();
      if (isLocked && !isFlying.current) {
          ctx.globalAlpha = 0.5;
      }
      // Apply vibration offset when at high tension
      const vibX = isPinching.current ? pullVibration : 0;
      const vibY = isPinching.current ? pullVibration * 0.5 : 0;
      drawBubble(ctx, ballPos.current.x + vibX, ballPos.current.y + vibY, BUBBLE_RADIUS, selectedColorRef.current);
      
      // Add glow effect when flying
      if (isFlying.current) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = COLOR_CONFIG[selectedColorRef.current].hex;
        ctx.beginPath();
        ctx.arc(ballPos.current.x, ballPos.current.y, BUBBLE_RADIUS + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();

      // Slingshot Band (Front) with glow
      if (!isFlying.current) {
        ctx.save();
        
        if (isPinching.current && pullStrength > 0.3) {
          ctx.shadowBlur = 10 + pullStrength * 15;
          ctx.shadowColor = bandColor;
        }
        
        ctx.beginPath();
        ctx.moveTo(ballPos.current.x, ballPos.current.y);
        ctx.lineTo(anchorPos.current.x + 35, anchorPos.current.y - 10);
        ctx.lineWidth = bandWidth;
        ctx.strokeStyle = bandColor;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }
      
      // Direction arrow when pulling
      if (isPinching.current && pullStrength > 0.15) {
        ctx.save();
        const arrowLen = 40 + pullStrength * 60;
        const arrowAngle = Math.atan2(-pullDy, -pullDx); // Direction of shot
        const arrowX = anchorPos.current.x + Math.cos(arrowAngle) * (arrowLen + 30);
        const arrowY = anchorPos.current.y + Math.sin(arrowAngle) * (arrowLen + 30);
        
        // Arrow line
        ctx.beginPath();
        ctx.moveTo(anchorPos.current.x, anchorPos.current.y);
        ctx.lineTo(arrowX, arrowY);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + pullStrength * 0.4})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.stroke();
        
        // Arrow head
        const headLen = 15;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - headLen * Math.cos(arrowAngle - Math.PI / 6),
          arrowY - headLen * Math.sin(arrowAngle - Math.PI / 6)
        );
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - headLen * Math.cos(arrowAngle + Math.PI / 6),
          arrowY - headLen * Math.sin(arrowAngle + Math.PI / 6)
        );
        ctx.setLineDash([]);
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }

      // Slingshot Handle with enhanced visuals
      ctx.save();
      // Handle glow on pull
      if (isPinching.current) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
      }
      ctx.beginPath();
      ctx.moveTo(anchorPos.current.x, canvas.height); 
      ctx.lineTo(anchorPos.current.x, anchorPos.current.y + 40); 
      ctx.lineTo(anchorPos.current.x - 40, anchorPos.current.y); 
      ctx.moveTo(anchorPos.current.x, anchorPos.current.y + 40);
      ctx.lineTo(anchorPos.current.x + 40, anchorPos.current.y); 
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.strokeStyle = isPinching.current ? '#757575' : '#616161';
      ctx.stroke();
      
      // Fork tips highlight
      ctx.beginPath();
      ctx.arc(anchorPos.current.x - 40, anchorPos.current.y, 6, 0, Math.PI * 2);
      ctx.arc(anchorPos.current.x + 40, anchorPos.current.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = isPinching.current ? '#9e9e9e' : '#757575';
      ctx.fill();
      ctx.restore();

      // Particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
          const p = particles.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.05;
          if (p.life <= 0) particles.current.splice(i, 1);
          else {
              ctx.globalAlpha = p.life;
              ctx.beginPath();
              ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
              ctx.fillStyle = p.color;
              ctx.fill();
              ctx.globalAlpha = 1.0;
          }
      }
      
      ctx.restore();

      // --- CAPTURE SCREENSHOT IF REQUESTED ---
      // We do this at the end of the render loop to ensure everything is drawn
      if (captureRequestRef.current) {
        captureRequestRef.current = false;
        
        // --- OPTIMIZATION: Resize & Compress Image before sending ---
        const offscreen = document.createElement('canvas');
        const targetWidth = 480; // Small width is sufficient for color/layout analysis
        const scale = Math.min(1, targetWidth / canvas.width);
        
        offscreen.width = canvas.width * scale;
        offscreen.height = canvas.height * scale;
        
        const oCtx = offscreen.getContext('2d');
        if (oCtx) {
            oCtx.drawImage(canvas, 0, 0, offscreen.width, offscreen.height);
            // Use JPEG at 0.6 quality for faster upload/processing
            const screenshot = offscreen.toDataURL("image/jpeg", 0.6);
            
            // Send to AI (non-blocking for render loop, but locks game logic)
            setTimeout(() => performAiAnalysis(screenshot), 0);
        }
      }
    };

    if (window.Hands) {
      hands = new window.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      hands.onResults(onResults);
      if (window.Camera) {
        camera = new window.Camera(video, {
          onFrame: async () => {
            if (videoRef.current && hands) await hands.send({ image: videoRef.current });
          },
          width: 1280,
          height: 720,
        });
        camera.start();
      }
    }

    return () => {
        if (camera) camera.stop();
        if (hands) hands.close();
    };
  }, [initGrid]);

  const recColorConfig = aiRecommendedColor ? COLOR_CONFIG[aiRecommendedColor] : null;
  const borderColor = recColorConfig ? recColorConfig.hex : '#444746';

  // Screen shake style
  const shakeStyle = screenShake > 0 ? {
    transform: `translate(${(Math.random() - 0.5) * screenShake}px, ${(Math.random() - 0.5) * screenShake}px)`,
    transition: 'transform 0.05s'
  } : {};

  return (
    <div className="flex w-full h-screen bg-[#121212] overflow-hidden font-roboto text-[#e3e3e3]">
      
      {/* LEFT: Game Area */}
      <div 
        ref={gameContainerRef} 
        className="flex-1 relative h-full overflow-hidden touch-none"
        style={shakeStyle}
      >
        <video ref={videoRef} className="absolute hidden" playsInline />
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 touch-none cursor-crosshair"
            onPointerDown={(e) => {
                e.preventDefault();
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                    pointerState.current = { 
                        x: e.clientX - rect.left, 
                        y: e.clientY - rect.top, 
                        active: true 
                    };
                }
            }}
            onPointerMove={(e) => {
                e.preventDefault();
                if (pointerState.current.active) {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (rect) {
                        pointerState.current.x = e.clientX - rect.left;
                        pointerState.current.y = e.clientY - rect.top;
                    }
                }
            }}
            onPointerUp={(e) => {
                e.preventDefault();
                pointerState.current.active = false;
            }}
            onPointerLeave={(e) => {
                e.preventDefault();
                pointerState.current.active = false;
            }}
        />

        {/* Floating Score Animations */}
        {floatingScores.map(fs => (
          <div
            key={fs.id}
            className="absolute pointer-events-none z-50 animate-float-up"
            style={{
              left: fs.x,
              top: fs.y,
              transform: 'translate(-50%, -50%)',
              animation: 'floatUp 1.5s ease-out forwards'
            }}
          >
            <div className="text-center">
              <div 
                className="text-3xl font-black drop-shadow-lg"
                style={{ 
                  color: fs.color,
                  textShadow: `0 0 20px ${fs.color}, 0 0 40px ${fs.color}`,
                  fontSize: fs.combo > 1 ? `${Math.min(2 + fs.combo * 0.3, 4)}rem` : '1.5rem'
                }}
              >
                +{fs.points.toLocaleString()}
              </div>
              {fs.combo > 1 && (
                <div className="text-yellow-400 font-bold text-sm animate-pulse">
                  🔥 {fs.combo}x COMBO!
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Perfect Shot Indicator */}
        {perfectShot && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="text-5xl font-black text-yellow-400 animate-bounce drop-shadow-lg" 
                 style={{ textShadow: '0 0 30px gold, 0 0 60px gold' }}>
              ✨ PERFECT! ✨
            </div>
          </div>
        )}

        {/* Level Up / Game Status Message */}
        {levelMessage && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className={`text-6xl font-black animate-pulse drop-shadow-lg ${gameStatus === 'won' ? 'text-green-400' : gameStatus === 'lost' ? 'text-red-400' : 'text-purple-400'}`}
                 style={{ textShadow: '0 0 40px currentColor' }}>
              {levelMessage}
            </div>
          </div>
        )}

        {/* Game Over Overlay with Restart */}
        {(gameStatus === 'won' || gameStatus === 'lost') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
            <div className="text-center space-y-6">
              <div className={`text-6xl font-black ${gameStatus === 'won' ? 'text-green-400' : 'text-red-400'}`}
                   style={{ textShadow: '0 0 40px currentColor' }}>
                {gameStatus === 'won' ? '🎉 VICTORY! 🎉' : '💥 GAME OVER 💥'}
              </div>
              
              <div className="space-y-2">
                <p className="text-3xl font-bold text-white">Final Score: {score.toLocaleString()}</p>
                <p className="text-xl text-gray-400">Level {level} • Max Combo: {maxCombo}x</p>
              </div>
              
              <button
                onClick={() => {
                  // Reset game state
                  setScore(0);
                  scoreRef.current = 0;
                  setLevel(1);
                  setShotsRemaining(50);
                  setComboCount(0);
                  comboRef.current = 0;
                  setMaxCombo(0);
                  setGameStatus('playing');
                  setLevelMessage(null);
                  setAiHint("Analyzing new game...");
                  setAiRecommendedColor(null);
                  setAimTarget(null);
                  
                  // Reinitialize grid
                  const width = canvasRef.current?.width || 800;
                  initGrid(width);
                  
                  Sound.playGameStartSound();
                }}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xl font-bold rounded-full shadow-2xl transform hover:scale-105 transition-all"
                style={{ boxShadow: '0 0 30px rgba(99, 102, 241, 0.5)' }}
              >
                🔄 PLAY AGAIN
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#121212] z-50">
            <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-[#42a5f5] animate-spin mb-4" />
                <p className="text-[#e3e3e3] text-lg font-medium">Starting Engine...</p>
            </div>
            </div>
        )}

        {/* Analyzing Overlay - positioned at Slingshot Anchor */}
        {isAiThinking && (
          <div 
            className="absolute left-1/2 -translate-x-1/2 z-50 flex flex-col items-center justify-center pointer-events-none"
            style={{ bottom: '220px', transform: 'translate(-50%, 50%)' }}
          >
             <div className="w-[72px] h-[72px] rounded-full border-4 border-t-[#a8c7fa] border-r-[#a8c7fa] border-b-transparent border-l-transparent animate-spin" />
             <p className="mt-4 text-[#a8c7fa] font-bold text-xs tracking-widest animate-pulse">ANALYZING...</p>
          </div>
        )}

        {/* Release Flash Effect */}
        {releaseFlash && (
          <div 
            className="absolute inset-0 z-30 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 75%, rgba(255, 255, 255, 0.4) 0%, transparent 50%)',
              animation: 'releaseFlash 0.15s ease-out forwards'
            }}
          />
        )}

        {/* Enhanced Power Gauge - Shows when pulling slingshot */}
        {powerLevel > 0 && (
          <div className="absolute left-6 bottom-32 z-40 flex flex-col items-center gap-2">
            {/* Power percentage */}
            <div className={`text-xs font-bold ${powerLevel > 0.9 ? 'text-red-400 animate-pulse' : powerLevel > 0.7 ? 'text-orange-400' : powerLevel > 0.4 ? 'text-yellow-400' : 'text-green-400'}`}>
              {Math.round(powerLevel * 100)}%
            </div>
            
            {/* Main gauge */}
            <div className="w-5 h-44 bg-[#1e1e1e] rounded-full border-2 border-[#444746] overflow-hidden relative"
                 style={{ boxShadow: powerLevel > 0.9 ? '0 0 20px rgba(239, 83, 80, 0.5)' : 'none' }}>
              <div 
                className="absolute bottom-0 w-full transition-all duration-75 rounded-full"
                style={{ 
                  height: `${powerLevel * 100}%`,
                  background: powerLevel < 0.4 
                    ? 'linear-gradient(to top, #4caf50, #8bc34a)' 
                    : powerLevel < 0.7 
                      ? 'linear-gradient(to top, #ffeb3b, #ffc107)' 
                      : powerLevel < 0.9
                        ? 'linear-gradient(to top, #ff9800, #ff5722)'
                        : 'linear-gradient(to top, #f44336, #e91e63)',
                  boxShadow: powerLevel > 0.9 ? '0 0 15px #ef5350, inset 0 0 10px rgba(255,255,255,0.3)' : 'inset 0 0 10px rgba(255,255,255,0.2)'
                }}
              />
              {/* Power level markers */}
              <div className="absolute left-0 right-0 top-[10%] h-0.5 bg-red-500/60" />
              <div className="absolute left-0 right-0 top-[30%] h-0.5 bg-orange-500/40" />
              <div className="absolute left-0 right-0 top-[60%] h-0.5 bg-yellow-500/30" />
            </div>
            
            {/* Power label */}
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Power</div>
          </div>
        )}
        
        {/* Pull angle indicator when aiming */}
        {isPulling && powerLevel > 0.1 && (
          <div 
            className="absolute z-40 pointer-events-none flex flex-col items-center"
            style={{ 
              bottom: '280px',
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
              <span className="text-white text-sm font-mono">
                {pullAngle > 0 ? `↗ ${Math.abs(pullAngle).toFixed(0)}°` : pullAngle < 0 ? `↘ ${Math.abs(pullAngle).toFixed(0)}°` : '↑ 90°'}
              </span>
            </div>
          </div>
        )}

        {/* First-time pull hint */}
        {showPullHint && !loading && !isAiThinking && gameStatus === 'playing' && (
          <div 
            className="absolute z-40 pointer-events-none animate-bounce"
            style={{ 
              bottom: '260px',
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 shadow-lg">
              <div className="flex items-center gap-2 text-white">
                <span className="text-xl">👇</span>
                <span className="text-sm font-medium">Grab & Pull to Aim</span>
              </div>
            </div>
          </div>
        )}

        {/* HUD: Score Card & Stats */}
        <div className="absolute top-6 left-6 z-40 flex flex-col gap-3">
          <div className="flex gap-3">
            {/* Score */}
            <div className="bg-[#1e1e1e] p-4 rounded-[28px] border border-[#444746] shadow-2xl flex items-center gap-3 min-w-[160px]">
                <div className="bg-[#42a5f5]/20 p-2.5 rounded-full">
                    <Trophy className="w-5 h-5 text-[#42a5f5]" />
                </div>
                <div>
                    <p className="text-[10px] text-[#c4c7c5] uppercase tracking-wider font-medium">Score</p>
                    <p className="text-2xl font-bold text-white">{score.toLocaleString()}</p>
                </div>
            </div>
            
            {/* Level Badge */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-900 p-4 rounded-[28px] border border-purple-500/50 shadow-2xl flex items-center gap-3">
                <div className="text-center">
                    <p className="text-[10px] text-purple-200 uppercase tracking-wider font-medium">Level</p>
                    <p className="text-2xl font-bold text-white">{level}</p>
                </div>
            </div>
          </div>
          
          {/* Combo & Shots Row */}
          <div className="flex gap-3">
            {/* Combo Counter */}
            {comboCount > 0 && (
              <div className={`bg-gradient-to-br ${comboCount >= 5 ? 'from-orange-500 to-red-600 animate-pulse' : comboCount >= 3 ? 'from-yellow-500 to-orange-600' : 'from-blue-500 to-purple-600'} p-3 rounded-2xl shadow-2xl flex items-center gap-2 transition-all`}
                   style={{ boxShadow: comboCount >= 3 ? '0 0 20px rgba(255, 165, 0, 0.5)' : 'none' }}>
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-[10px] text-white/80 uppercase font-medium">Combo</p>
                  <p className="text-xl font-black text-white">{comboCount}x</p>
                </div>
              </div>
            )}
            
            {/* Shots Remaining */}
            <div className={`bg-[#1e1e1e] p-3 rounded-2xl border ${shotsRemaining <= 5 ? 'border-red-500/50 bg-red-900/20' : 'border-[#444746]'} shadow-2xl flex items-center gap-2`}>
                <div className={`text-xl ${shotsRemaining <= 5 ? 'animate-pulse' : ''}`}>🎯</div>
                <div>
                    <p className="text-[10px] text-[#c4c7c5] uppercase font-medium">Shots</p>
                    <p className={`text-xl font-bold ${shotsRemaining <= 5 ? 'text-red-400' : 'text-white'}`}>{shotsRemaining}</p>
                </div>
            </div>
            
            {/* Max Combo Badge */}
            {maxCombo >= 3 && (
              <div className="bg-[#1e1e1e] p-3 rounded-2xl border border-yellow-500/30 shadow-2xl flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <div>
                  <p className="text-[10px] text-yellow-500/80 uppercase font-medium">Best</p>
                  <p className="text-lg font-bold text-yellow-400">{maxCombo}x</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Sound Controls - Top Right */}
        <div className="absolute top-6 right-6 z-40 flex gap-2">
            
            {/* Sound Toggle Button */}
            <button
                onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    Sound.resumeAudio();
                }}
                className="bg-[#1e1e1e] p-4 rounded-full border border-[#444746] shadow-2xl hover:bg-[#2a2a2a] transition-colors"
                title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
                {soundEnabled ? (
                    <Volume2 className="w-6 h-6 text-[#66bb6a]" />
                ) : (
                    <VolumeX className="w-6 h-6 text-[#ef5350]" />
                )}
            </button>
            
            {/* Music Toggle Button */}
            <button
                onClick={() => {
                    setMusicEnabled(!musicEnabled);
                    Sound.resumeAudio();
                }}
                className={`bg-[#1e1e1e] p-4 rounded-full border border-[#444746] shadow-2xl hover:bg-[#2a2a2a] transition-colors ${!soundEnabled ? 'opacity-50' : ''}`}
                title={musicEnabled ? 'Mute music' : 'Enable music'}
                disabled={!soundEnabled}
            >
                <span className={`text-lg ${musicEnabled && soundEnabled ? 'text-[#ab47bc]' : 'text-[#757575]'}`}>🎵</span>
            </button>
        </div>

        {/* HUD: Color Picker */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
            <div className="bg-[#1e1e1e] px-6 py-4 rounded-[32px] border border-[#444746] shadow-2xl flex items-center gap-4">
                <p className="text-xs text-[#c4c7c5] uppercase font-bold tracking-wider mr-2 hidden md:block">Select Color</p>
                {availableColors.length === 0 ? (
                    <p className="text-sm text-gray-500">No ammo</p>
                ) : (
                    COLOR_KEYS.filter(c => availableColors.includes(c)).map(color => {
                        const isSelected = selectedColor === color;
                        const isRecommended = aiRecommendedColor === color;
                        const config = COLOR_CONFIG[color];
                        
                        return (
                            <button
                                key={color}
                                onClick={() => {
                                    setSelectedColor(color);
                                    Sound.playSelectSound();
                                    Sound.resumeAudio(); // Resume audio context on user interaction
                                }}
                                className={`relative w-14 h-14 rounded-full transition-all duration-300 transform flex items-center justify-center
                                    ${isSelected ? 'scale-110 ring-4 ring-white/50 z-10' : 'opacity-80 hover:opacity-100 hover:scale-105'}
                                `}
                                style={{ 
                                    background: `radial-gradient(circle at 35% 35%, ${config.hex}, ${adjustColor(config.hex, -60)})`,
                                    boxShadow: isSelected 
                                        ? `0 0 20px ${config.hex}, inset 0 -4px 4px rgba(0,0,0,0.3)`
                                        : '0 4px 6px rgba(0,0,0,0.3), inset 0 -4px 4px rgba(0,0,0,0.3)'
                                }}
                            >
                                {/* Glossy highlight for button */}
                                <div className="absolute top-2 left-3 w-4 h-2 bg-white/40 rounded-full transform -rotate-45 filter blur-[1px]" />
                                
                                {isRecommended && !isSelected && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-[10px] font-bold flex items-center justify-center rounded-full animate-bounce shadow-md">!</span>
                                )}
                                {isSelected && (
                                    <MousePointerClick className="w-6 h-6 text-white/90 drop-shadow-md" />
                                )}
                            </button>
                        )
                    })
                )}
            </div>
        </div>

        {/* Bottom Tip */}
        {!isPinching.current && !isFlying.current && !isAiThinking && (
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none opacity-50">
                <div className="flex items-center gap-2 bg-[#1e1e1e]/90 px-4 py-2 rounded-full border border-[#444746] backdrop-blur-sm">
                    <Play className="w-3 h-3 text-[#42a5f5] fill-current" />
                    <p className="text-[#e3e3e3] text-xs font-medium">Pinch & Pull to Shoot</p>
                </div>
            </div>
        )}
      </div>

      {/* RIGHT: Debug Panel */}
      <div className="w-[380px] bg-[#1e1e1e] border-l border-[#444746] flex flex-col h-full overflow-hidden shadow-2xl">
        
        {/* FLASH STRATEGY SECTION - PROMINENT */}
        <div 
            className="p-5 border-b-4 transition-colors duration-500 flex flex-col gap-2"
            style={{ 
                backgroundColor: '#252525',
                borderColor: borderColor
            }}
        >
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5" style={{ color: borderColor }} />
                    <h2 className="font-bold text-sm tracking-widest uppercase" style={{ color: borderColor }}>
                        Flash Strategy
                    </h2>
                </div>
                {isAiThinking && <Loader2 className="w-4 h-4 animate-spin text-white/50" />}
             </div>
             
             <p className="text-[#e3e3e3] text-sm leading-relaxed font-bold">
                {aiHint}
             </p>
             
             {aiRationale && (
                 <div className="flex gap-2 mt-1">
                     <Lightbulb className="w-4 h-4 text-[#a8c7fa] shrink-0 mt-0.5" />
                     <p className="text-[#a8c7fa] text-xs italic opacity-90 leading-tight">
                        {aiRationale}
                     </p>
                 </div>
             )}
             
             {aiRecommendedColor && (
                <div className="flex items-center gap-2 mt-3 bg-black/20 p-2 rounded">
                    <Target className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Rec. Color:</span>
                    <span className="text-xs font-bold uppercase" style={{ color: COLOR_CONFIG[aiRecommendedColor].hex }}>
                        {COLOR_CONFIG[aiRecommendedColor].label}
                    </span>
                </div>
             )}
        </div>

        {/* DEBUG HEADER */}
        <div className="p-3 border-b border-[#444746] bg-[#1e1e1e] flex items-center gap-2 text-[#757575]">
            <Terminal className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Debugger</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Status Section */}
            <div>
                <div className="flex items-center gap-2 mb-2 text-[#c4c7c5] text-xs font-bold uppercase tracking-wider">
                    <BrainCircuit className="w-3 h-3" /> Status
                </div>
                <div className={`p-3 rounded-lg border ${isAiThinking ? 'bg-[#a8c7fa]/10 border-[#a8c7fa]/30 text-[#a8c7fa]' : 'bg-[#444746]/20 border-[#444746]/50 text-[#c4c7c5]'}`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isAiThinking ? 'bg-[#a8c7fa] animate-pulse' : 'bg-[#66bb6a]'}`} />
                        <span className="text-sm font-mono">{isAiThinking ? 'Processing Vision...' : 'Waiting for Input'}</span>
                    </div>
                </div>
            </div>

            {/* Vision Input */}
            {debugInfo?.screenshotBase64 && (
                <div>
                    <div className="flex items-center gap-2 mb-2 text-[#c4c7c5] text-xs font-bold uppercase tracking-wider">
                        <Eye className="w-3 h-3" /> Vision Input
                    </div>
                    <div className="rounded-lg overflow-hidden border border-[#444746] bg-black/50 relative group">
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={debugInfo.screenshotBase64} alt="AI Vision" className="w-full h-auto opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1 text-[10px] text-center text-gray-400 font-mono">
                            Sent to gemini-3-flash
                        </div>
                    </div>
                </div>
            )}

            {/* Prompt Context */}
            {debugInfo?.promptContext && (
                <div>
                    <div className="flex items-center gap-2 mb-2 text-[#c4c7c5] text-xs font-bold uppercase tracking-wider">
                        <Terminal className="w-3 h-3" /> Prompt Context
                    </div>
                    <div className="bg-[#121212] p-3 rounded-lg border border-[#444746] font-mono text-[10px] text-gray-400 h-32 overflow-y-auto whitespace-pre-wrap leading-tight">
                        {debugInfo.promptContext}
                    </div>
                </div>
            )}

            {/* AI Output Stats */}
            {debugInfo && (
                <div>
                    <div className="flex items-center gap-2 mb-2 text-[#c4c7c5] text-xs font-bold uppercase tracking-wider">
                        <BrainCircuit className="w-3 h-3" /> AI Output
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                         <div className="bg-[#2a2a2a] p-2 rounded border border-[#444746]">
                            <p className="text-[10px] text-gray-500 mb-1">Latency</p>
                            <div className="flex items-center gap-1 text-[#a8c7fa] font-mono font-bold">
                                {debugInfo.latency}ms
                            </div>
                         </div>
                         <div className="bg-[#2a2a2a] p-2 rounded border border-[#444746]">
                            <p className="text-[10px] text-gray-500 mb-1">Rec. Color</p>
                            <div className="flex items-center gap-1 text-[#e3e3e3] font-mono font-bold capitalize">
                                {debugInfo.parsedResponse?.recommendedColor || '--'}
                            </div>
                         </div>
                    </div>

                    {debugInfo.error && (
                         <div className="bg-[#ef5350]/10 border border-[#ef5350]/30 p-3 rounded-lg mb-3">
                            <div className="flex items-start gap-2 text-[#ef5350]">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold">PARSE ERROR DETAILS</p>
                                    <p className="text-[10px] font-mono mt-1 break-all">{debugInfo.error}</p>
                                </div>
                            </div>
                         </div>
                    )}

                    <p className="text-[10px] text-gray-500 mb-1">Raw Response Text</p>
                    <div className="bg-[#121212] p-3 rounded-lg border border-[#444746] font-mono text-[11px] text-[#66bb6a] max-h-40 overflow-y-auto whitespace-pre-wrap mb-3 border-l-2 border-l-[#66bb6a]">
                        {debugInfo.rawResponse}
                    </div>

                    <p className="text-[10px] text-gray-500 mb-1">Parsed JSON</p>
                    <div className="bg-[#121212] p-3 rounded-lg border border-[#444746] font-mono text-[10px] text-[#a8c7fa] overflow-x-auto">
                        <pre>{JSON.stringify(debugInfo.parsedResponse || { error: "Failed to parse" }, null, 2)}</pre>
                    </div>
                </div>
            )}
        </div>
        
        <div className="p-3 bg-[#252525] border-t border-[#444746] text-center">
            <p className="text-[10px] text-gray-500 font-medium">Powered by Google Gemini 3 Flash</p>
        </div>
      </div>
    </div>
  );
};

export default GeminiSlingshot;