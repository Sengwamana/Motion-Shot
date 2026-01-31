# 🎯 Motion Shot - Complete Game Documentation

<div align="center">

## AI-Powered Bubble Shooter with Hand Gesture Control

**For Global Game Jam 2026 - Theme: "MASK"**

---

</div>

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [How It's Built](#2-how-its-built)
3. [How It Works](#3-how-it-works)
4. [How to Play](#4-how-to-play)
5. [Technical Architecture](#5-technical-architecture)
6. [New Feature Suggestions for "MASK" Theme](#6-new-feature-suggestions-for-mask-theme)

---

## 1. Project Overview

### What is Motion Shot?

Motion Shot is an innovative **AI-powered bubble shooter game** that combines classic bubble matching mechanics with cutting-edge technology:

- **Hand Gesture Control**: Players use their webcam and natural hand movements (pinch-and-pull) instead of mouse/keyboard
- **AI Strategic Co-pilot**: Google's Gemini 3 Flash AI analyzes the game board in real-time and suggests optimal moves
- **Modern Web Tech**: Built with React 19, TypeScript, and Vite for a smooth 60fps experience

### Key Features

| Feature | Description |
|---------|-------------|
| 🖐️ **Hand Tracking** | MediaPipe Hands SDK tracks 21 hand landmarks for precise gesture recognition |
| 🧠 **AI Analysis** | Gemini 3 Flash Vision API processes screenshots and recommends strategic moves |
| 🎨 **6-Color System** | Strategic scoring with different point values per color (100-500 pts) |
| 📊 **Debug Panel** | Real-time visibility into AI decision-making process |
| ⚡ **Real-time Physics** | Smooth ball trajectories with wall bouncing and collision detection |

---

## 2. How It's Built

### Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND STACK                       │
├─────────────────────────────────────────────────────────┤
│  React 19.2        │ UI Components & State Management   │
│  TypeScript 5.8    │ Type Safety & Code Quality         │
│  Vite 6            │ Fast Build Tool & Dev Server       │
│  Tailwind CSS      │ Utility-First Styling              │
│  Lucide React      │ Icon Library                       │
├─────────────────────────────────────────────────────────┤
│                    AI & VISION                          │
├─────────────────────────────────────────────────────────┤
│  MediaPipe Hands   │ Real-time Hand Tracking (21 pts)   │
│  Google Gemini 3   │ Vision AI for Strategy Analysis    │
│  @google/genai     │ Official Gemini SDK                │
└─────────────────────────────────────────────────────────┘
```

### Project Structure

```
Gemini-Slingshot/
├── App.tsx                 # Root component wrapper
├── index.tsx               # Application entry point
├── index.html              # HTML template with MediaPipe CDN scripts
├── types.ts                # TypeScript type definitions
├── vite.config.ts          # Vite configuration
├── package.json            # Dependencies & scripts
│
├── components/
│   └── GeminiSlingshot.tsx # Main game component (~1000 lines)
│                           # - Game loop & rendering
│                           # - Physics simulation
│                           # - Hand tracking integration
│                           # - UI overlays
│
├── services/
│   └── geminiService.ts    # AI service layer (~200 lines)
│                           # - Gemini API integration
│                           # - Prompt construction
│                           # - Response parsing
│                           # - Fallback heuristics
│
└── docs/
    ├── ARCHITECTURE.md     # Technical architecture details
    ├── API_REFERENCE.md    # Type definitions & functions
    ├── DEPLOYMENT.md       # Hosting guide
    └── CONTRIBUTING.md     # Contribution guidelines
```

### Core Type Definitions

```typescript
// Game entities
interface Bubble {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  color: BubbleColor;  // 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange'
  active: boolean;
}

interface Point { x: number; y: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; }

// AI response structure
interface StrategicHint {
  message: string;
  rationale?: string;
  targetRow?: number;
  targetCol?: number;
  recommendedColor?: BubbleColor;
}
```

---

## 3. How It Works

### System Data Flow

```
┌──────────────┐    ┌───────────────┐    ┌────────────────┐
│   WEBCAM     │───▶│   MediaPipe   │───▶│   Game Loop    │
│   INPUT      │    │   Hands SDK   │    │   (60 FPS)     │
└──────────────┘    └───────────────┘    └────────────────┘
                                                  │
                    ┌─────────────────────────────┴─────────────────────────────┐
                    │                                                           │
                    ▼                                                           ▼
         ┌──────────────────┐                                      ┌──────────────────┐
         │   Hand Position  │                                      │   Canvas Render  │
         │   Detection      │                                      │   - Video BG     │
         │   - 21 Landmarks │                                      │   - Bubble Grid  │
         │   - Pinch Detect │                                      │   - Slingshot    │
         └──────────────────┘                                      │   - Particles    │
                    │                                              │   - Hand Overlay │
                    ▼                                              └──────────────────┘
         ┌──────────────────┐                                               │
         │   Slingshot      │                                               │
         │   Mechanics      │◀──────────────────────────────────────────────┤
         │   - Drag Ball    │                                               │
         │   - Release/Fire │                         ┌─────────────────────┤
         └──────────────────┘                         │                     │
                    │                                 │                     │
                    ▼                                 │                     │
         ┌──────────────────┐                         ▼                     │
         │   Physics        │              ┌──────────────────┐             │
         │   Simulation     │              │   Screenshot     │             │
         │   - Trajectory   │              │   Capture        │             │
         │   - Collision    │              │   (480px JPEG)   │             │
         └──────────────────┘              └──────────────────┘             │
                    │                                 │                     │
                    ▼                                 ▼                     │
         ┌──────────────────┐              ┌──────────────────┐             │
         │   Match Check    │              │   Gemini 3 Flash │             │
         │   - Flood Fill   │              │   Vision API     │             │
         │   - Score Update │              │   - Analyze Grid │             │
         │   - Particles    │              │   - JSON Response│             │
         └──────────────────┘              └──────────────────┘             │
                    │                                 │                     │
                    └─────────────────────────────────┴─────────────────────┘
```

### Key Mechanics Explained

#### 1. Hand Tracking & Pinch Detection
```
MediaPipe detects 21 hand landmarks. The game uses:
- Point 4: Thumb tip
- Point 8: Index finger tip

Pinch Distance = √[(thumb.x - index.x)² + (thumb.y - index.y)²]
If Pinch Distance < 0.05 → User is "grabbing"
```

#### 2. Slingshot Physics
```
When ball is released:
  1. Calculate stretch distance from anchor
  2. Apply velocity based on stretch (quadratic power curve)
  3. Ball flies with:
     - Wall reflection (X-axis bounce)
     - Friction (0.998 per frame)
     - No gravity (space-like feel)
  4. Collision detection uses substeps for fast-moving balls
```

#### 3. Bubble Matching (Flood Fill Algorithm)
```
When ball snaps to grid:
  1. Find all connected same-color bubbles
  2. Use hex-grid neighbor detection (6 neighbors)
  3. If cluster >= 3 bubbles:
     - Deactivate bubbles
     - Create explosion particles
     - Calculate score (base × combo multiplier)
```

#### 4. AI Strategic Analysis
```
After each shot:
  1. Capture canvas as 480px JPEG (60% quality)
  2. Pre-calculate all reachable clusters for ALL colors
  3. Send to Gemini with structured prompt:
     - Screenshot image
     - Valid target options
     - Scoring rules
     - Board danger level
  4. Parse JSON response for:
     - Target coordinates
     - Recommended color
     - Strategic rationale
  5. Display laser sight and update UI
```

### Scoring System

| Color | Points per Bubble | Strategic Value |
|-------|------------------|-----------------|
| 🔴 Red | 100 | Low - Common, easy targets |
| 🔵 Blue | 150 | Low-Medium |
| 🟢 Green | 200 | Medium |
| 🟡 Yellow | 250 | Medium-High |
| 🟣 Purple | 300 | High - Valuable targets |
| 🟠 Orange | 500 | Highest - Rare, priority target |

**Combo Multiplier**: 1.5x when matching more than 3 bubbles at once

---

## 4. How to Play

### Setup Requirements

- **Desktop computer** with webcam
- **Modern browser** (Chrome, Firefox, Edge)
- **Well-lit environment** for hand tracking
- **Node.js 18+** for development

### Installation

```bash
# 1. Clone and install
cd Gemini-Slingshot
npm install

# 2. Configure API Key
# Create .env.local file with:
API_KEY=your_gemini_api_key_here

# 3. Start the game
npm run dev

# 4. Open http://localhost:3000
```

### Game Controls

```
┌────────────────────────────────────────────────────────────────┐
│                      GAME CONTROLS                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. SHOW YOUR HAND 🖐️                                         │
│     Position your hand in view of the webcam                  │
│                                                                │
│  2. PINCH TO GRAB 🤏                                          │
│     Touch thumb to index finger near the slingshot ball       │
│                                                                │
│  3. PULL BACK TO AIM 🎯                                       │
│     While pinching, move hand backward to stretch slingshot   │
│     - Further back = more power                               │
│     - Band color changes to yellow when grabbed               │
│                                                                │
│  4. RELEASE TO FIRE 🚀                                        │
│     Open your fingers to launch the ball                      │
│                                                                │
│  5. SELECT COLOR 🎨                                           │
│     Click color buttons at bottom to change ammo color        │
│     - AI will auto-equip recommended color                    │
│                                                                │
│  6. FOLLOW AI HINTS 🧠                                        │
│     Watch the laser sight line pointing to suggested target   │
│     Read strategic advice in the right panel                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Game Objectives

1. **Match 3+** bubbles of the same color to pop them
2. **Maximize score** by targeting high-value colors (Orange/Purple)
3. **Create chain reactions** by hitting high clusters to drop bubbles below
4. **Keep bubbles away** from the bottom of the screen
5. **Follow AI recommendations** for optimal strategic play

### UI Elements

```
┌──────────────────────────────────────┬─────────────────────────┐
│           GAME CANVAS                │     DEBUG PANEL         │
│                                      │                         │
│  ┌─────────────┐  [BUBBLE GRID]      │  ┌─────────────────────┐│
│  │ 🏆 SCORE   │  ○ ○ ○ ○ ○ ○ ○ ○    │  │ FLASH STRATEGY      ││
│  │    1,250   │   ○ ○ ○ ○ ○ ○ ○     │  │ "Target the Orange  ││
│  └─────────────┘  ○ ○ ○ ○ ○ ○ ○ ○    │  │  cluster on right!" ││
│                   ○ ○ ○ ○ ○ ○ ○      │  └─────────────────────┘│
│                                      │                         │
│         [LASER SIGHT LINE]           │  ┌─────────────────────┐│
│              │                       │  │ VISION INPUT        ││
│              │                       │  │ [Screenshot image]  ││
│              │                       │  └─────────────────────┘│
│              │                       │                         │
│              ▼                       │  ┌─────────────────────┐│
│           ●══════●                   │  │ AI OUTPUT           ││
│          / [BALL] \   ← Slingshot    │  │ Latency: 450ms      ││
│         /          \                 │  │ Color: Orange       ││
│        |            |                │  │ [JSON Response]     ││
│                                      │  └─────────────────────┘│
│  [🔴 🔵 🟢 🟡 🟣 🟠] ← Color Picker  │                         │
│                                      │  Powered by Gemini 3   │
└──────────────────────────────────────┴─────────────────────────┘
```

---

## 5. Technical Architecture

### State Management (Hybrid Approach)

The game uses a **hybrid state management** strategy to balance React's reactive UI with high-performance game loop requirements:

| State Type | Usage | Purpose |
|------------|-------|---------|
| `useState` | UI elements | Triggers re-renders for score, hints, colors |
| `useRef` | Game physics | Ball position, velocity, bubbles (60fps updates without re-render) |

```typescript
// UI State (re-renders)
const [score, setScore] = useState(0);
const [aiHint, setAiHint] = useState<string | null>(null);

// Physics State (no re-renders)
const ballPos = useRef<Point>({ x: 0, y: 0 });
const ballVel = useRef<Point>({ x: 0, y: 0 });
const bubbles = useRef<Bubble[]>([]);
```

### Canvas Rendering Pipeline

Every frame (60fps), the canvas renders layers in order:

1. **Video Background** - Webcam feed with dark overlay
2. **Bubble Grid** - 3D-styled spheres with gradients
3. **Laser Sight** - Animated dashed line to AI target
4. **Slingshot** - Back band → Ball → Front band → Handle
5. **Particles** - Explosion effects with alpha fade
6. **Hand Overlay** - MediaPipe skeleton visualization

### AI Integration Flow

```
Shot Complete → Capture Canvas → Compress to JPEG → Build Prompt Context
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │  GEMINI PROMPT  │
                                                  ├─────────────────┤
                                                  │ • Board image   │
                                                  │ • Valid targets │
                                                  │ • Scoring rules │
                                                  │ • Danger level  │
                                                  └─────────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │  GEMINI FLASH   │
                                                  │  (Vision API)   │
                                                  └─────────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │  JSON RESPONSE  │
                                                  │ • message       │
                                                  │ • rationale     │
                                                  │ • targetRow/Col │
                                                  │ • recColor      │
                                                  └─────────────────┘
```

---

## 6. New Feature Suggestions for "MASK" Theme

### 🎭 Global Game Jam 2026 Theme: "MASK"

The theme "MASK" can be interpreted in multiple ways: disguise, identity, protection, concealment, transformation. Here are innovative feature ideas to make Motion Shot stand out:

---

### 🔥 TIER 1: HIGH-IMPACT FEATURES (Recommended for 48-hour jam)

#### 1. **Masked Bubbles** 🎭
**Concept**: Some bubbles wear "masks" that hide their true color

```
Implementation:
- 20% of bubbles spawn as "masked" (gray/question mark appearance)
- True color revealed only when:
  a) Hit directly by a ball
  b) Adjacent to a match
  c) AI special "unmask" ability used
- Strategic depth: Players must decide to probe unknowns or play safe
- Visual: Venetian mask overlay on bubbles with reveal animation
```

**Why it's special**: Adds mystery and strategic uncertainty - do you risk hitting an unknown?

---

#### 2. **Dual Identity Mode** 👤👥
**Concept**: Bubbles have TWO colors - one visible, one hidden beneath

```
Implementation:
- Each bubble has primary color (visible) and secondary color (masked)
- First match removes "surface mask" → reveals true color
- Second match of true color pops the bubble
- AI must predict hidden colors based on patterns
- Visual: Bubble appears to "crack" revealing inner color
```

**Why it's special**: Revolutionary twist on match-3 mechanics - every bubble is a two-layer puzzle

---

#### 3. **Player Mask Power-ups** 😷
**Concept**: Collectible masks that grant special abilities

```
Mask Types:
🎭 Chameleon Mask  - Your ball takes the color of first bubble it touches
🔮 Oracle Mask     - Reveals all masked bubbles for 10 seconds  
💨 Phantom Mask    - Ball passes through first row of bubbles
🛡️ Shield Mask    - Prevents one bubble row from dropping
🎯 Precision Mask  - Shows exact trajectory prediction

Implementation:
- Masks appear randomly in bubble grid
- Hitting a mask bubble activates it
- Single use, strategic timing matters
- Visual: Mask icon floats over player's hand
```

**Why it's special**: Power-up system that ties directly to theme

---

#### 4. **Emotion Masks AI Personality** 🎭😊😈
**Concept**: The AI co-pilot wears different "masks" that change its personality

```
AI Personalities:
😊 Helpful Mask   - Standard helpful hints (default)
😈 Trickster Mask - Occasionally gives misleading advice
🤔 Cryptic Mask   - Gives hints as riddles
😤 Aggressive Mask - Focuses only on high-risk/high-reward plays
😌 Calm Mask      - Focuses on safe, consistent plays

Implementation:
- Player can choose AI personality before game
- Each personality changes prompt behavior
- Visual: AI panel changes theme colors/icons
```

**Why it's special**: Meta-commentary on trusting AI - is the AI wearing a "mask"?

---

### 🎯 TIER 2: MEDIUM-EFFORT FEATURES

#### 5. **Face Mask Filter Reality** 👤📷
**Concept**: Apply visual filters to player's face in webcam feed

```
Implementation:
- Use MediaPipe Face Detection alongside Hands
- Overlay themed masks on player's face:
  - Venetian masks
  - Superhero masks
  - Animal masks
- Mask changes based on score milestones
- Screenshot feature to share masked selfies
```

---

#### 6. **Unmasking Chain Reactions** 💥
**Concept**: Special combo mechanic where matches "unmask" adjacent bubbles

```
Implementation:
- When 3+ bubbles match and pop:
  - All adjacent masked bubbles are revealed
  - If revealed colors also match → cascade!
- Creates unpredictable, exciting chain reactions
- Bonus points for "unmasking combos"
```

---

#### 7. **Hide & Seek Mode** 🙈
**Concept**: Alternating phases of "masked" and "revealed" gameplay

```
Implementation:
- 30 second cycles:
  - REVEAL PHASE: All bubbles visible, plan your strategy
  - MASK PHASE: Random bubbles get masked, must rely on memory
- Tests player memory and adaptation
- AI provides different hints in each phase
```

---

### 🌟 TIER 3: POLISH & DIFFERENTIATION

#### 8. **Theatrical Visual Theme** 🎪
**Concept**: Complete visual overhaul with masquerade/theater aesthetic

```
Visual Elements:
- Background: Venice carnival scene / theater stage
- Bubbles: Styled as decorative masks
- Slingshot: Ornate golden theater prop
- Particles: Confetti and feathers
- UI: Art deco frames, theatrical typography
- Music: Mysterious carnival-style soundtrack
```

---

#### 9. **"Behind the Mask" Narrative** 📖
**Concept**: Light story element that unfolds as you play

```
Implementation:
- Each level reveals part of a story about identity
- AI co-pilot is a mysterious masked figure
- Win condition: "Unmask the truth"
- Creates emotional connection to theme
```

---

#### 10. **Multiplayer: Mask vs Unmask** ⚔️
**Concept**: Asymmetric 2-player mode

```
Implementation:
- Player 1 (Masker): Tries to mask bubbles on opponent's board
- Player 2 (Revealer): Tries to unmask and pop bubbles
- Competitive twist on cooperative bubble shooter
```

---

### 📋 RECOMMENDED IMPLEMENTATION PRIORITY (48 Hours)

| Priority | Feature | Time Est. | Impact |
|----------|---------|-----------|--------|
| 1️⃣ | Masked Bubbles (random hidden colors) | 4-6 hrs | ⭐⭐⭐⭐⭐ |
| 2️⃣ | Player Mask Power-ups (3 types) | 4-6 hrs | ⭐⭐⭐⭐ |
| 3️⃣ | Theatrical Visual Theme | 8-10 hrs | ⭐⭐⭐⭐ |
| 4️⃣ | Unmasking Chain Reactions | 3-4 hrs | ⭐⭐⭐⭐ |
| 5️⃣ | AI Personality Masks | 4-5 hrs | ⭐⭐⭐ |

### 🏆 What Makes This Stand Out at Global Game Jam

1. **Unique Tech Stack**: Hand gesture + AI is rare in jam games
2. **Theme Integration**: Masks aren't cosmetic - they're core mechanics
3. **AI Storytelling**: The "masked AI advisor" concept is meta and intriguing
4. **Accessible Yet Deep**: Easy to understand, hard to master
5. **Visual Polish**: Theater/masquerade aesthetic is striking
6. **Demo-Friendly**: Easy to show judges the hand tracking "wow factor"

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                       MOTION SHOT                               │
│                  QUICK REFERENCE CARD                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CONTROLS           SCORING              TIPS                   │
│  ─────────          ───────              ────                   │
│  🤏 Pinch = Grab    🔴 Red    = 100     • Follow AI hints!     │
│  ↙️ Pull  = Aim     🔵 Blue   = 150     • Target Orange first  │
│  👐 Open  = Fire    🟢 Green  = 200     • Create avalanches    │
│                     🟡 Yellow = 250     • Match 4+ for 1.5x    │
│                     🟣 Purple = 300     • Watch the laser line │
│                     🟠 Orange = 500                            │
│                                                                 │
│  START: npm run dev → http://localhost:3000                    │
│                                                                 │
│              Built for Global Game Jam 2026                    │
│                      Theme: "MASK"                              │
└─────────────────────────────────────────────────────────────────┘
```

---

*Document Generated: January 31, 2026*
*For Global Game Jam 2026 - Theme: "MASK"*
*Project: Motion Shot - AI-Powered Bubble Shooter*
