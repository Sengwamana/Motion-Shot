# 🤝 Contributing to Motion Shot

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/gemini-slingshot.git`
3. **Install** dependencies: `npm install`
4. **Create** a branch: `git checkout -b feature/your-feature-name`

## Development Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
# Add your GEMINI_API_KEY

# Start development server
npm run dev
```

## Code Standards

### TypeScript
- Use strict TypeScript types
- Avoid `any` when possible
- Document complex function parameters

### React
- Functional components only
- Use hooks appropriately
- Follow existing patterns in codebase

### Styling
- Use Tailwind CSS utilities
- Follow Material Design color palette
- Maintain dark theme consistency

## Pull Request Process

1. **Test** your changes thoroughly
2. **Update** documentation if needed
3. **Describe** your changes clearly in PR
4. **Reference** any related issues

### PR Title Format
```
type: brief description

Examples:
feat: add sound effects for bubble pops
fix: resolve hand tracking calibration issue
docs: update deployment guide
```

## Types of Contributions

### 🐛 Bug Reports
- Describe the bug clearly
- Include steps to reproduce
- Specify browser and OS

### ✨ Feature Requests
- Explain the use case
- Describe expected behavior
- Consider implementation impact

### 📝 Documentation
- Fix typos or unclear sections
- Add examples
- Improve guides

### 🎮 Game Improvements
- New bubble colors/mechanics
- Visual enhancements
- Performance optimizations

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback

## Questions?

Open an issue with the "question" label.
