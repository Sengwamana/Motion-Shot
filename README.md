<div align="center">
  <img width="1200" height="475" alt="Motion Shot Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  
  # 🎯 Motion Shot
  
  ### AI-Powered Bubble Shooter with Hand Gesture Control
  
  [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
  [![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
  
  [🎮 Play Now](#quick-start) • [📖 Documentation](docs/README.md) • [🤝 Contributing](docs/CONTRIBUTING.md)
</div>

---

## ✨ Features

- **🖐️ Hand Gesture Control** - Use pinch-and-pull gestures via webcam
- **🧠 AI Strategic Co-pilot** - Analyzes and suggests optimal moves
- **🎯 Multi-Color Strategy** - 6 bubble colors with varying point values
- **🎵 Immersive Audio** - Background music and motion sound effects
- **📊 Real-time Debug Panel** - See AI decision-making process

## 🚀 Quick Start

**Prerequisites:** Node.js 18+, Webcam, Desktop Browser

```bash
# Install dependencies
npm install

# Configure API key
cp .env.local.example .env.local
# Edit .env.local and add your API key

# Start the game
npm run dev
```

Open `http://localhost:3000` in your browser and allow camera access.

## 🎮 How to Play

1. Show your hand to the webcam
2. **Pinch** near the slingshot ball
3. **Pull back** to aim and build power
4. **Release** to shoot!

Match 3+ bubbles of the same color to pop them. Watch the AI panel for strategic recommendations!

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Full README](docs/README.md) | Complete project documentation |
| [Architecture](docs/ARCHITECTURE.md) | Technical design & data flow |
| [API Reference](docs/API_REFERENCE.md) | Type definitions & functions |
| [Deployment](docs/DEPLOYMENT.md) | Hosting & production guide |
| [Contributing](docs/CONTRIBUTING.md) | Contribution guidelines |

## 🛠️ Tech Stack

- **React 19** + TypeScript
- **Vite 6** for blazing-fast dev
- **MediaPipe Hands** for gesture tracking
- **AI Co-pilot** for strategic analysis
- **Tailwind CSS** for styling

## 📄 License

Apache License 2.0 - See [LICENSE](LICENSE)

---

<div align="center">
  <p>Motion Shot ❤️</p>
</div>
