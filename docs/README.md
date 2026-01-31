<div align="center">
  <img width="1200" height="475" alt="Motion Shot Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  
  # 🎯 Motion Shot
  
  ### AI-Powered Bubble Shooter with Real-Time Strategic Assistance
  
  [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
  [![React](https://img.shields.io/badge/React-19.2.1-61DAFB?logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev/)
  [![Gemini AI](https://img.shields.io/badge/Gemini%20AI-3%20Flash-4285F4?logo=google)](https://ai.google.dev/)
  
  [🎮 Play Now](#quick-start) • [📖 Documentation](#documentation) • [🤖 AI Architecture](#ai-architecture) • [🛠️ Development](#development)
</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [How to Play](#how-to-play)
- [AI Architecture](#ai-architecture)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🎮 Overview

**Motion Shot** is an innovative bubble shooter game that combines traditional gameplay with cutting-edge AI technology. Using Google's **Gemini 3 Flash** model, the game provides real-time strategic analysis and recommendations, transforming a classic game into an intelligent gaming experience.

### What Makes It Unique?

- **🖐️ Hand Gesture Control**: Use natural pinch-and-pull gestures via webcam to aim and shoot
- **🧠 AI Strategic Co-pilot**: Gemini 3 Flash analyzes the game board and suggests optimal moves
- **📊 Visual Debug Panel**: See exactly what the AI "sees" and how it makes decisions
- **🎯 Multi-Color Strategy**: Choose from 6 bubble colors with varying point values

---

## ✨ Features

### Core Gameplay
| Feature | Description |
|---------|-------------|
| **Slingshot Mechanics** | Intuitive pull-back-and-release shooting system |
| **Cluster Matching** | Match 3+ bubbles of the same color to pop them |
| **Combo Scoring** | Bonus multipliers for large cluster clears |
| **Particle Effects** | Satisfying explosion animations on bubble pops |

### AI Integration
| Feature | Description |
|---------|-------------|
| **Real-time Analysis** | AI analyzes board state after each shot |
| **Strategic Hints** | Natural language recommendations for next moves |
| **Color Recommendations** | AI suggests optimal projectile color selection |
| **Target Visualization** | Laser sight shows recommended target position |

### Hand Tracking
| Feature | Description |
|---------|-------------|
| **MediaPipe Hands** | Google's ML-based hand tracking solution |
| **Pinch Detection** | Natural gesture recognition for grabbing/releasing |
| **Visual Cursor** | Real-time hand position visualization |
| **Landmark Rendering** | See tracked hand skeleton overlay |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **Webcam** (required for hand tracking)
- **Desktop Browser** (Chrome, Firefox, or Edge recommended)
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/gemini-slingshot.git
cd gemini-slingshot

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# Start development server
npm run dev
```

### Access the Game

Open your browser and navigate to:
```
http://localhost:3000
```

> ⚠️ **Important**: Allow camera access when prompted for hand tracking to work

---

## 🕹️ How to Play

### Controls

1. **Show your hand** to the webcam until tracking activates
2. **Pinch your thumb and index finger** near the slingshot ball
3. **Pull back** to aim (the further you pull, the more power)
4. **Release the pinch** to shoot!

### Scoring System

| Bubble Color | Points per Bubble | Strategic Value |
|--------------|-------------------|-----------------|
| 🔴 Red       | 100 pts          | Common, easy targets |
| 🔵 Blue      | 150 pts          | Moderate value |
| 🟢 Green     | 200 pts          | Mid-tier scoring |
| 🟡 Yellow    | 250 pts          | Upper-tier value |
| 🟣 Purple    | 300 pts          | High value target |
| 🟠 Orange    | 500 pts          | **Premium target!** |

### Combo Multiplier

- Clear 3 bubbles: Standard points
- Clear 4+ bubbles: **1.5x multiplier** bonus!

### AI Assistance

Watch the **Flash Strategy** panel on the right for:
- **Message**: Quick actionable directive
- **Rationale**: Strategic reasoning explained
- **Recommended Color**: AI's suggested bubble selection
- **Laser Sight**: Animated guide to target location

---

## 🤖 AI Architecture

### Vision Model Integration

Motion Shot uses the **Gemini 3 Flash** multimodal model for real-time game analysis.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Game Canvas    │───▶│  Screenshot      │───▶│  Gemini 3 Flash │
│  (State)        │    │  + Context Data  │    │  (Analysis)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                       │
                       ┌──────────────────┐            │
                       │  Strategic Hint  │◀───────────┘
                       │  + Target Coords │
                       └──────────────────┘
```

### AI Request Flow

1. **Capture**: Game canvas is captured as JPEG (480px width, 60% quality)
2. **Context Building**: Client-side heuristics identify all reachable clusters
3. **API Call**: Screenshot + cluster data sent to Gemini 3 Flash
4. **Response Parsing**: JSON response extracted and validated
5. **UI Update**: Hint displayed, laser sight positioned, color auto-equipped

### Prompt Engineering

The AI receives structured context:
- Current danger level (how close bubbles are to bottom)
- All valid target options with cluster sizes and point values
- Scoring rules for strategic prioritization
- Clear output format specification (JSON)

### Fallback Handling

If the AI fails or returns invalid data:
1. **Local Heuristic**: Best cluster selected by score × size
2. **Error Display**: Debug panel shows parse errors
3. **Game Continues**: Never blocks on AI failure

---

## 📁 Project Structure

```
gemini-slingshot/
├── 📁 components/
│   └── GeminiSlingshot.tsx    # Main game component (1000+ lines)
├── 📁 services/
│   └── geminiService.ts       # Gemini API integration
├── 📁 docs/
│   ├── README.md              # This documentation
│   ├── ARCHITECTURE.md        # Technical architecture
│   ├── API_REFERENCE.md       # API documentation
│   └── DEPLOYMENT.md          # Deployment guide
├── App.tsx                    # React app entry
├── index.tsx                  # DOM render entry
├── index.html                 # HTML template with CDN imports
├── index.css                  # Global styles (empty - uses Tailwind)
├── types.ts                   # TypeScript type definitions
├── vite.config.ts             # Vite build configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies & scripts
├── metadata.json              # AI Studio app metadata
├── .env.local                 # Environment variables (git ignored)
└── .gitignore                 # Git ignore rules
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Required: Your Gemini API Key
GEMINI_API_KEY=your_api_key_here
```

### Game Constants

Located in `components/GeminiSlingshot.tsx`:

```typescript
// Physics
const GRAVITY = 0.0;           // Disabled for bubble shooter feel
const FRICTION = 0.998;        // Slight air resistance

// Grid Configuration
const BUBBLE_RADIUS = 22;      // Bubble size in pixels
const GRID_COLS = 12;          // Bubbles per row
const GRID_ROWS = 8;           // Maximum grid rows

// Slingshot Settings
const MAX_DRAG_DIST = 180;     // Maximum pull distance
const MIN_FORCE_MULT = 0.15;   // Minimum launch velocity
const MAX_FORCE_MULT = 0.45;   // Maximum launch velocity
```

---

## 📚 API Reference

### Gemini Service

#### `getStrategicHint()`

Analyzes the game state and returns strategic recommendations.

```typescript
async function getStrategicHint(
  imageBase64: string,         // Screenshot of game canvas
  validTargets: TargetCandidate[], // Precomputed target options
  dangerRow: number            // How far down bubbles extend
): Promise<AiResponse>
```

#### Response Types

```typescript
interface StrategicHint {
  message: string;             // Short directive
  rationale?: string;          // Strategic explanation
  targetRow?: number;          // Recommended row
  targetCol?: number;          // Recommended column
  recommendedColor?: BubbleColor;
}

interface DebugInfo {
  latency: number;             // API response time (ms)
  screenshotBase64?: string;   // Input image
  promptContext: string;       // Target list sent to AI
  rawResponse: string;         // Raw API response
  parsedResponse?: any;        // Parsed JSON
  error?: string;              // Any errors
  timestamp: string;           // Request time
}
```

---

## 🛠️ Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **TypeScript 5.8** | Type safety |
| **Vite 6** | Build tool & dev server |
| **Tailwind CSS** | Utility styling |
| **MediaPipe Hands** | Hand tracking ML |
| **Gemini AI SDK** | AI integration |
| **Lucide React** | Icon library |

### Code Architecture

The game uses a hybrid architecture:
- **React State**: UI updates (score, hints, colors)
- **Refs**: Game loop values (ball position, velocity, bubbles)
- **Canvas Rendering**: 60fps game graphics via MediaPipe camera loop

This approach ensures smooth gameplay while React handles the UI layer.

---

## 🔧 Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| **Camera not detected** | Check browser permissions, try different browser |
| **Hand not tracked** | Ensure good lighting, keep hand in frame |
| **AI hints not appearing** | Verify `GEMINI_API_KEY` in `.env.local` |
| **Blank screen** | Check browser console for errors |
| **Mobile/Tablet blocked** | This game requires desktop for webcam |

### Debug Mode

The right panel includes a full debugger showing:
- AI processing status
- Screenshot sent to AI
- Raw prompt context
- API response with latency
- Parse errors if any

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Contribution Guidelines

- Follow existing code style
- Add TypeScript types for new code
- Test on desktop Chrome before submitting
- Update documentation as needed

---

## 📄 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

```
Copyright 2024 Motion Shot Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

<div align="center">
  <p>Built with ❤️ using Google Gemini AI</p>
  <p>
    <a href="https://ai.studio/apps/drive/1HXapk9vamK1-JcoMP-3nMTJVWuSsSQM4">View in AI Studio</a>
  </p>
</div>
