# 📚 API Reference

## Overview

This document provides detailed API documentation for the Motion Shot application, including type definitions, service functions, and integration points.

---

## Table of Contents

- [Type Definitions](#type-definitions)
- [Gemini Service](#gemini-service)
- [Game Configuration](#game-configuration)
- [MediaPipe Integration](#mediapipe-integration)

---

## Type Definitions

Located in `types.ts`

### Point

Represents a 2D coordinate.

```typescript
interface Point {
  x: number;
  y: number;
}
```

**Usage**: Ball position, hand position, target coordinates.

---

### Vector

Represents a 2D velocity vector.

```typescript
interface Vector {
  vx: number;
  vy: number;
}
```

**Usage**: Ball velocity, particle movement.

---

### BubbleColor

Union type for valid bubble colors.

```typescript
type BubbleColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
```

**Color Values (Material Design)**:
| Color | Hex Code | Points |
|-------|----------|--------|
| red | `#ef5350` | 100 |
| blue | `#42a5f5` | 150 |
| green | `#66bb6a` | 200 |
| yellow | `#ffee58` | 250 |
| purple | `#ab47bc` | 300 |
| orange | `#ffa726` | 500 |

---

### Bubble

Represents a bubble in the game grid.

```typescript
interface Bubble {
  id: string;          // Unique identifier (format: "row-col" or "row-col-timestamp")
  row: number;         // Grid row (0-indexed from top)
  col: number;         // Grid column (0-indexed from left)
  x: number;           // Canvas X position (pixels)
  y: number;           // Canvas Y position (pixels)
  color: BubbleColor;  // Bubble color
  active: boolean;     // false if popped
  isFloating?: boolean; // Optional: for drop animations
}
```

**Example**:
```typescript
const bubble: Bubble = {
  id: "2-5",
  row: 2,
  col: 5,
  x: 280,
  y: 112,
  color: "orange",
  active: true
};
```

---

### Particle

Represents an explosion particle effect.

```typescript
interface Particle {
  x: number;      // Current X position
  y: number;      // Current Y position
  vx: number;     // X velocity
  vy: number;     // Y velocity
  life: number;   // Remaining life (1.0 to 0.0)
  color: string;  // Hex color code
}
```

**Lifecycle**: Spawns at `life: 1.0`, decremented by `0.05` each frame, removed at `<= 0`.

---

### StrategicHint

AI-generated gameplay recommendation.

```typescript
interface StrategicHint {
  message: string;               // Short directive (e.g., "Target the Orange cluster")
  rationale?: string;            // Explanation of strategy
  targetRow?: number;            // Recommended row to hit
  targetCol?: number;            // Recommended column to hit
  recommendedColor?: BubbleColor; // Suggested projectile color
}
```

**Example**:
```typescript
const hint: StrategicHint = {
  message: "Target the Orange Cluster",
  rationale: "This clears 4 high-value bubbles and exposes more targets above.",
  targetRow: 1,
  targetCol: 7,
  recommendedColor: "orange"
};
```

---

### DebugInfo

Diagnostic information for AI requests.

```typescript
interface DebugInfo {
  latency: number;               // API response time in milliseconds
  screenshotBase64?: string;     // Base64-encoded screenshot sent to AI
  promptContext: string;         // Target list text sent in prompt
  rawResponse: string;           // Raw text from Gemini API
  parsedResponse?: any;          // Parsed JSON object (if successful)
  error?: string;                // Error message (if failed)
  timestamp: string;             // Request time (format: "HH:MM:SS")
}
```

---

### AiResponse

Complete response from the Gemini service.

```typescript
interface AiResponse {
  hint: StrategicHint;  // The strategic recommendation
  debug: DebugInfo;     // Debugging information
}
```

---

## Gemini Service

Located in `services/geminiService.ts`

### Initialization

```typescript
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}
```

**Model Used**: `gemini-3-flash-preview`

---

### TargetCandidate

Input structure for valid targets.

```typescript
interface TargetCandidate {
  id: string;              // Bubble ID to hit
  color: string;           // Bubble color
  size: number;            // Cluster size (connected same-color)
  row: number;             // Target row
  col: number;             // Target column
  pointsPerBubble: number; // Score value per bubble
  description: string;     // Position descriptor ("Left", "Center", "Right")
}
```

---

### getStrategicHint()

Main API function for AI analysis.

```typescript
async function getStrategicHint(
  imageBase64: string,
  validTargets: TargetCandidate[],
  dangerRow: number
): Promise<AiResponse>
```

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `imageBase64` | `string` | Base64-encoded JPEG of game canvas (with `data:image/jpeg;base64,` prefix) |
| `validTargets` | `TargetCandidate[]` | Pre-computed list of hittable cluster targets |
| `dangerRow` | `number` | Highest row number with active bubbles (higher = more danger) |

**Returns**: `Promise<AiResponse>`

**Error Handling**:
- API key missing → Returns fallback hint with error
- Network failure → Returns fallback hint with error
- JSON parse failure → Returns fallback hint with error
- Invalid coordinates → Returns fallback hint with error

**Fallback Logic**:
```typescript
// When AI fails, select best local option
const best = validTargets.sort((a, b) => {
    const scoreA = a.size * a.pointsPerBubble;
    const scoreB = b.size * b.pointsPerBubble;
    return (scoreB - scoreA) || (a.row - b.row);
})[0];
```

---

### API Configuration

```typescript
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: {
    parts: [
      { text: prompt },
      { 
        inlineData: {
          mimeType: "image/png",
          data: cleanBase64  // Without prefix
        } 
      }
    ]
  },
  config: {
    maxOutputTokens: 2048,
    temperature: 0.4,
    responseMimeType: "application/json"
  }
});
```

**Configuration Options**:
| Option | Value | Rationale |
|--------|-------|-----------|
| `maxOutputTokens` | 2048 | Ensures complete JSON response |
| `temperature` | 0.4 | Balanced creativity/consistency |
| `responseMimeType` | `application/json` | Encourages structured output |

---

### Prompt Structure

The prompt includes:

1. **Role Definition**: "You are a strategic gaming AI..."
2. **Game State**: Danger level indicator
3. **Scoring Rules**: Point values for each color
4. **Available Moves**: Pre-computed target list
5. **Task Description**: Decision criteria and priorities
6. **Output Format**: JSON schema specification

**Priority Order**:
1. High Score (Orange/Purple matches)
2. Avalanche (Clear from top to drop bubbles)
3. Survival (Clear low bubbles when critical)

---

## Game Configuration

Located in `components/GeminiSlingshot.tsx`

### Physics Constants

```typescript
const PINCH_THRESHOLD = 0.05;   // Normalized distance for pinch detection
const GRAVITY = 0.0;             // Vertical acceleration (disabled)
const FRICTION = 0.998;          // Velocity decay per frame
```

### Grid Constants

```typescript
const BUBBLE_RADIUS = 22;        // Bubble radius in pixels
const ROW_HEIGHT = BUBBLE_RADIUS * Math.sqrt(3);  // ≈ 38.1 pixels
const GRID_COLS = 12;            // Bubbles per row
const GRID_ROWS = 8;             // Maximum rows (display limit)
```

### Slingshot Constants

```typescript
const SLINGSHOT_BOTTOM_OFFSET = 220; // Pixels from canvas bottom
const MAX_DRAG_DIST = 180;           // Maximum pull distance
const MIN_FORCE_MULT = 0.15;         // Minimum velocity multiplier
const MAX_FORCE_MULT = 0.45;         // Maximum velocity multiplier
```

### Color Configuration

```typescript
const COLOR_CONFIG: Record<BubbleColor, {
  hex: string,
  points: number,
  label: string
}> = {
  red:    { hex: '#ef5350', points: 100, label: 'Red' },
  blue:   { hex: '#42a5f5', points: 150, label: 'Blue' },
  green:  { hex: '#66bb6a', points: 200, label: 'Green' },
  yellow: { hex: '#ffee58', points: 250, label: 'Yellow' },
  purple: { hex: '#ab47bc', points: 300, label: 'Purple' },
  orange: { hex: '#ffa726', points: 500, label: 'Orange' }
};
```

---

## MediaPipe Integration

### Window Global Types

Declared in `types.ts`:

```typescript
declare global {
  interface Window {
    Hands: any;           // MediaPipe Hands constructor
    Camera: any;          // MediaPipe Camera utility
    drawConnectors: any;  // Draw hand skeleton
    drawLandmarks: any;   // Draw hand points
    HAND_CONNECTIONS: any; // Connection indices
  }
}
```

### Hands Initialization

```typescript
const hands = new window.Hands({
  locateFile: (file: string) => 
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1,              // Track only one hand
  modelComplexity: 1,          // Full model (0=lite, 1=full)
  minDetectionConfidence: 0.5, // Detection threshold
  minTrackingConfidence: 0.5,  // Tracking threshold
});
```

### Camera Setup

```typescript
const camera = new window.Camera(video, {
  onFrame: async () => {
    await hands.send({ image: videoRef.current });
  },
  width: 1280,
  height: 720,
});

camera.start();
```

### Hand Landmark Indices

Key landmarks used:
| Index | Name | Usage |
|-------|------|-------|
| 4 | Thumb tip | Pinch detection |
| 8 | Index finger tip | Pinch detection |

**Pinch Detection**:
```typescript
const dx = landmarks[8].x - landmarks[4].x;
const dy = landmarks[8].y - landmarks[4].y;
const pinchDist = Math.sqrt(dx * dx + dy * dy);

if (pinchDist < PINCH_THRESHOLD) {
  // User is pinching
}
```

---

## Utility Functions

### adjustColor()

Adjusts a hex color by a brightness amount.

```typescript
function adjustColor(color: string, amount: number): string
```

**Parameters**:
- `color`: Hex color string (e.g., `"#42a5f5"`)
- `amount`: Brightness adjustment (-255 to 255)

**Returns**: Adjusted hex color string

**Example**:
```typescript
adjustColor('#42a5f5', -60);  // Returns darker shade
adjustColor('#42a5f5', 40);   // Returns lighter shade
```

---

### getBubblePos()

Calculates canvas position for a grid cell.

```typescript
function getBubblePos(row: number, col: number, width: number): Point
```

**Parameters**:
- `row`: Grid row (0-indexed)
- `col`: Grid column (0-indexed)
- `width`: Canvas width in pixels

**Returns**: `{ x: number, y: number }` - Canvas coordinates

---

### isNeighbor()

Determines if two bubbles are adjacent in the hex grid.

```typescript
function isNeighbor(a: Bubble, b: Bubble): boolean
```

**Returns**: `true` if bubbles share an edge in the hex grid.

---

### isPathClear()

Checks if there's a clear line-of-sight to a target bubble.

```typescript
function isPathClear(target: Bubble): boolean
```

**Algorithm**: Ray-march from slingshot anchor to target, checking for collisions with active bubbles.

---

## Error Codes

| Error | Location | Cause | Resolution |
|-------|----------|-------|------------|
| "API Key missing" | geminiService | `GEMINI_API_KEY` not in env | Add to `.env.local` |
| "Invalid Coordinates in JSON" | geminiService | AI returned non-numeric row/col | Uses fallback heuristic |
| "JSON Parse Error" | geminiService | AI response not valid JSON | Uses fallback heuristic |
| "AI Service Unreachable" | geminiService | Network/API failure | Uses fallback heuristic |
