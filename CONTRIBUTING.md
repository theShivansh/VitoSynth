# Contributing to VitoSynth AI

Thank you for your interest in contributing to VitoSynth AI! 🧬

## Development Setup

```bash
git clone https://github.com/theShivansh/VitoSynth.git
cd VitoSynth
npm install
cp .env.example .env.local
# Add VITE_GROQ_API_KEY=gsk_...
npm run dev
```

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add CGM glucose overlay on simulation charts
fix: resolve fasting tracker zone calculation for high-carb meals
perf: code-split vendor chunks to reduce initial bundle
docs: update README with chrono-nutrition use case examples
refactor: extract simulation prompt builder into separate utility
test: add unit tests for pancreatic load metric calculation
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/cgm-integration`
3. Make your changes with meaningful commits
4. Ensure `npm run build` passes with zero errors
5. Submit a PR with a clear description of the biological/technical value added

## Priority Features

See the Contributing section in README.md for the full roadmap.

## Code Style

- TypeScript strict mode (no `any` in service layer)
- All AI prompts must specify exact JSON schema in the system prompt
- New simulation features must update `types.ts` with proper interfaces
- Components must remain pure (no direct AI calls — use service layer)
