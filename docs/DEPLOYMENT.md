# 🚀 Deployment Guide

## Build for Production

```bash
npm install
npm run build
```

This creates a `dist/` folder with optimized files.

## Deployment Options

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

Or connect GitHub repo at [vercel.com](https://vercel.com).

**Settings:**
- Framework: Vite
- Build: `npm run build`
- Output: `dist`

**Environment Variables:**
Project Settings → Environment Variables → Add `GEMINI_API_KEY`

---

### Netlify

```bash
npm i -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### GitHub Pages

Update `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/repo-name/',
});
```

Create `.github/workflows/deploy.yml` for GitHub Actions deployment.

---

### Firebase Hosting

```bash
npm i -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy --only hosting
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google AI API key | Yes |

---

## Security Considerations

⚠️ **API Key Exposure**: Client-side apps expose API keys.

**Mitigations:**
1. Restrict API key to your domain in Google Cloud Console
2. Set up usage quotas
3. Consider backend proxy for production

---

## Pre-Launch Checklist

- [ ] Production build works (`npm run preview`)
- [ ] API key set in hosting environment  
- [ ] HTTPS enabled
- [ ] Tested with webcam on target browsers
