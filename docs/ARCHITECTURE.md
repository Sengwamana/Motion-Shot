# 🏗️ Architecture Documentation

## System Overview

Motion Shot is a single-page application (SPA) built with React and TypeScript, featuring real-time hand tracking via MediaPipe and AI-powered strategic analysis via Google's Gemini 3 Flash model.

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │   Webcam    │───▶│  MediaPipe  │───▶│  Game Loop  │                  │
│  │   Input     │    │   Hands     │    │  (onResults)│                  │
│  └─────────────┘    └─────────────┘    └─────────────┘                  │
│                                              │                           │
│                                              ▼                           │
│                     ┌──────────────────────────────────────┐            │
│                     │            Canvas Renderer            │            │
│                     │  • Video background                   │            │
│                     │  • Bubble grid                        │            │
│                     │  • Slingshot mechanics                │            │
│                     │  • Particle effects                   │            │
│                     │  • Hand visualization                 │            │
│                     │  • AI laser sight                     │            │
│                     └──────────────────────────────────────┘            │
│                                              │                           │
│                                              ▼                           │
│  ┌─────────────┐    ┌─────────────────────────────────────────────┐     │
│  │   React     │◀───│              React UI Layer                  │     │
│  │   State     │    │  • Score display         • AI hint panel    │     │
│  │             │    │  • Color picker          • Debug panel      │     │
│  └─────────────┘    │  • Loading overlay       • Mobile blocker   │     │
│                     └─────────────────────────────────────────────┘     │
│                                              │                           │
│                                              │ Screenshot + Context      │
│                                              ▼                           │
│                     ┌─────────────────────────────────────┐             │
│                     │          Gemini Service              │             │
│                     │  • Image processing                  │             │
│                     │  • Prompt construction               │             │
│                     │  • Response parsing                  │             │
│                     │  • Fallback heuristics               │             │
│                     └─────────────────────────────────────┘             │
│                                              │                           │
└──────────────────────────────────────────────│───────────────────────────┘
                                               │
                                               ▼
                     ┌─────────────────────────────────────┐
                     │       Gemini 3 Flash API            │
                     │   (Google AI Studio / Vertex AI)    │
                     └─────────────────────────────────────┘
```

---

## Component Architecture

### Main Component: `GeminiSlingshot.tsx`

This is a monolithic game component (~1000 lines) that handles all game logic. The decision to keep it unified was made for:
- Lower latency in the render loop
- Direct access to canvas context
- Simplified state management for real-time physics

```
GeminiSlingshot Component
├── State Management
│   ├── React State (UI updates)
│   │   ├── loading, score
│   │   ├── aiHint, aiRationale, aimTarget
│   │   ├── selectedColor, availableColors
│   │   └── debugInfo, isAiThinking
│   │
│   └── Refs (Game loop - no re-renders)
│       ├── ballPos, ballVel, anchorPos
│       ├── isPinching, isFlying
│       ├── bubbles, particles
│       └── captureRequestRef
│
├── Core Functions
│   ├── initGrid()           - Create initial bubble layout
│   ├── getBubblePos()       - Calculate grid position
│   ├── createExplosion()    - Spawn particles
│   ├── checkMatches()       - Find and pop matching clusters
│   ├── isNeighbor()         - Grid adjacency check
│   ├── isPathClear()        - Line-of-sight validation
│   ├── getAllReachableClusters() - AI context generation
│   └── performAiAnalysis()  - Trigger AI request
│
├── Render Functions
│   ├── drawBubble()         - 3D sphere rendering
│   └── onResults()          - Main game loop (60fps)
│
└── UI Render
    ├── Game Canvas (left)
    │   ├── Loading overlay
    │   ├── AI thinking overlay
    │   ├── Score HUD
    │   ├── Color picker
    │   └── Control hint
    │
    └── Debug Panel (right)
        ├── Flash Strategy section
        ├── Status indicator
        ├── Vision input preview
        ├── Prompt context view
        └── AI output stats
```

---

## Data Flow

### 1. Input Processing

```
Webcam Frame
    │
    ▼
MediaPipe Hands SDK
    │
    ├── Hand Landmarks (21 points)
    │   ├── Point 4: Thumb tip
    │   └── Point 8: Index finger tip
    │
    ▼
Pinch Detection
    │
    ├── Calculate distance between points
    ├── If distance < PINCH_THRESHOLD:
    │   └── User is "grabbing"
    │
    ▼
Slingshot Control
    ├── On grab near ball: Start dragging
    ├── On drag: Update ball position
    └── On release: Apply velocity, launch ball
```

### 2. Physics Simulation

```
Ball State Update (each frame)
    │
    ├── If Flying:
    │   ├── Apply velocity (with substeps for fast movement)
    │   ├── Wall collision → Reflect X velocity
    │   ├── Top collision → Find snap position
    │   ├── Bubble collision → Find snap position
    │   ├── Timeout (5s) → Cancel shot
    │   └── Bottom exit → Reset shot
    │
    └── If Not Flying:
        └── Lerp back to anchor position
```

### 3. Match Detection

```
New Bubble Placed
    │
    ▼
Flood Fill Algorithm
    │
    ├── Start from new bubble
    ├── Find all connected same-color
    └── Using isNeighbor() for hex grid
    │
    ▼
If matches ≥ 3:
    ├── Deactivate matched bubbles
    ├── Create particle explosions
    ├── Calculate score (with combo multiplier)
    └── Update available colors
```

### 4. AI Analysis Pipeline

```
Shot Completed (or game init)
    │
    ▼
Set captureRequestRef = true
    │
    ▼
End of Render Frame
    │
    ├── Capture canvas to offscreen
    ├── Resize to 480px width
    ├── Compress to JPEG 60%
    │
    ▼
performAiAnalysis()
    │
    ├── Set isAiThinking = true (locks input)
    ├── Build cluster list (getAllReachableClusters)
    │
    ▼
getStrategicHint()
    │
    ├── Construct prompt with context
    ├── Send screenshot + prompt to Gemini
    ├── Parse JSON response
    │
    ├── On Success:
    │   ├── Extract target coordinates
    │   ├── Update aimTarget (laser sight)
    │   ├── Auto-equip recommended color
    │   └── Display hint message
    │
    └── On Failure:
        ├── Fall back to local heuristic
        ├── Log error to debug panel
        └── Continue gameplay
    │
    ▼
Set isAiThinking = false (unlocks input)
```

---

## State Management Strategy

### Why Hybrid State?

React's state updates trigger re-renders, which would cause performance issues in a 60fps game loop. The solution:

| State Type | Update Method | Use Case |
|------------|---------------|----------|
| `useState` | `setState()` | UI elements that need re-render |
| `useRef` | `.current = value` | Physics values updated every frame |

### Syncing State and Refs

When a React state value is needed in the game loop:

```typescript
// State for UI
const [selectedColor, setSelectedColor] = useState<BubbleColor>('red');

// Ref for game loop
const selectedColorRef = useRef<BubbleColor>('red');

// Sync state → ref
useEffect(() => {
  selectedColorRef.current = selectedColor;
}, [selectedColor]);
```

---

## Rendering Architecture

### Canvas Layering

All rendering happens on a single canvas in this order:

1. **Background**: Video feed + dark overlay
2. **Bubbles**: Grid of 3D-styled spheres
3. **Aiming**: Laser sight line + target circle
4. **Slingshot**: Back band → Ball → Front band → Handle
5. **Particles**: Explosion effects (with alpha fade)
6. **Hand Overlay**: MediaPipe skeleton + cursor

### 3D Bubble Effect

Each bubble is rendered with:
- Radial gradient (light source top-left)
- White specular highlight
- Darkened edges
- Subtle stroke outline
- Elliptical "glossy" reflection

```typescript
drawBubble(ctx, x, y, radius, color) {
  // Main gradient
  const grad = ctx.createRadialGradient(
    x - radius * 0.3, y - radius * 0.3, radius * 0.1,  // Light source
    x, y, radius                                        // Center
  );
  grad.addColorStop(0, '#ffffff');      // Bright center
  grad.addColorStop(0.2, baseColor);    // Main color
  grad.addColorStop(1, darkerColor);    // Shadow edge
  
  // Draw sphere
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  
  // Glossy highlight
  ctx.ellipse(x - radius * 0.3, y - radius * 0.35, ...);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fill();
}
```

---

## AI Integration Details

### Prompt Engineering

The prompt sent to Gemini includes:
1. **Game context**: Danger level, scoring rules
2. **Valid moves list**: Pre-computed by client
3. **Prioritization guidelines**: Score, avalanche, survival
4. **Output format**: Strict JSON specification

This reduces hallucination by giving the AI concrete options.

### Response Validation

```typescript
// 1. Extract JSON from response
const firstBrace = text.indexOf('{');
const lastBrace = text.lastIndexOf('}');
text = text.substring(firstBrace, lastBrace + 1);

// 2. Parse and validate
const json = JSON.parse(text);
const r = Number(json.targetRow);
const c = Number(json.targetCol);

if (!isNaN(r) && !isNaN(c) && json.recommendedColor) {
  // Valid response - use it
} else {
  // Invalid - fall back to local heuristic
}
```

### Optimization Techniques

1. **Image compression**: 480px width, JPEG 60%
2. **Async processing**: Non-blocking for render loop
3. **Locking mechanism**: Prevents input during analysis
4. **Caching decisions**: AI is called once per shot, not continuously

---

## Grid System

### Hexagonal Layout

The bubble grid uses offset coordinates:

```
Row 0:  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●     (12 bubbles)
Row 1:   ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●       (11 bubbles, offset)
Row 2:  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●     (12 bubbles)
```

### Position Calculation

```typescript
getBubblePos(row, col, width) {
  const xOffset = (width - (GRID_COLS * BUBBLE_RADIUS * 2)) / 2 + BUBBLE_RADIUS;
  const isOdd = row % 2 !== 0;
  const x = xOffset + col * (BUBBLE_RADIUS * 2) + (isOdd ? BUBBLE_RADIUS : 0);
  const y = BUBBLE_RADIUS + row * ROW_HEIGHT;  // ROW_HEIGHT = radius * sqrt(3)
  return { x, y };
}
```

### Neighbor Detection

For hex grids, neighbors depend on row parity:

```typescript
isNeighbor(a, b) {
  const dr = b.row - a.row;
  const dc = b.col - a.col;
  
  if (Math.abs(dr) > 1) return false;
  if (dr === 0) return Math.abs(dc) === 1;
  
  // Odd rows shifted right
  if (a.row % 2 !== 0) {
    return dc === 0 || dc === 1;
  } else {
    return dc === -1 || dc === 0;
  }
}
```

---

## Performance Considerations

### Frame Budget

At 60fps, each frame has ~16.67ms:

| Task | Budget | Actual |
|------|--------|--------|
| MediaPipe hand tracking | ~8ms | ~5-7ms |
| Physics simulation | ~2ms | ~0.5ms |
| Canvas rendering | ~4ms | ~2-3ms |
| React UI updates | ~2ms | ~0.1ms |

### Optimization Strategies

1. **Substep physics**: Fast-moving balls use multiple small steps
2. **Ref-based state**: Avoids React re-renders in game loop
3. **Lazy AI**: Only analyzes after shot completion
4. **Image downscaling**: Reduces upload/processing time
5. **Draw batching**: All rendering in single canvas context

---

## Security Considerations

1. **API Key**: Stored in `.env.local` (git ignored)
2. **Client-side**: All processing in browser, no server
3. **Camera Access**: Requires explicit user permission
4. **No Data Storage**: No cookies, localStorage, or analytics

---

## Future Architecture Considerations

### Potential Improvements

1. **Component splitting**: Break down monolithic component
2. **Web Workers**: Move physics to background thread
3. **WebGL rendering**: GPU-accelerated graphics
4. **Server component**: Move AI calls to edge function
5. **Multiplayer**: WebSocket game synchronization

### Scalability Notes

Current architecture is client-only. For scaling:
- Use Vertex AI with rate limiting for production
- Consider serverless functions for API key protection
- Add caching layer for repeated board states
