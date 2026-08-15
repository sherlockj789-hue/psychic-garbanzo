# Wise World School

A real digital school. Pick any of 60 careers and work through 12 grades of honest, expert-grounded lessons — with real videos, fun arcade-style games, a job simulator, and an always-on AI teacher. Free, forever.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (New York) + **lucide-react** icons
- **framer-motion** for game animations
- **zustand** for client state (progress/XP)
- **z-ai-web-dev-sdk** for the AI teacher, lesson generation, and game content (built-in, always on — no API key needed)

## Getting started

```bash
# 1. Install dependencies
bun install

# 2. Start the dev server
bun run dev
```

Then open `http://localhost:3000`.

> Don't have `bun`? Install it: `curl -fsSL https://bun.sh/install | bash`
> Or use npm/yarn: `npm install` then `npm run dev`

## How it works

- **Careers**: 60 careers across 12 categories. Each has 12 grades × 10 lessons.
- **Lessons**: Generated fresh (the first time) via Web Search + LLM — real education paths, tools, pay, ethics, and case studies, with cited sources. Cached in memory after first load.
- **Videos**: Found live via Web Search from YouTube — real, currently-available videos per career.
- **Games**: 5 arcade-style games built to be fun, not quizzes:
  - **Tap Rush** (whack-a-mole quiz) — chips pop up, tap the right answers
  - **Catch Fall** (basket catch) — catch the right items, dodge the wrong ones
  - **Memory Match** — flip cards to match real career terms to their meanings
  - **Scenario Storm** — branching career decisions with resource meters
  - **Sequence Builder** — order real career processes correctly
- **Job Simulator**: Run a "career shift" of real decisions with animated Money/Skill/Rep/Energy meters.
- **Skills lab**: 38 grown-up skills (money, mind, people, work). Learn-first flow: read a real mini-lesson, then unlock the game.
- **AI Teacher**: A floating button on every page opens a chat with the built-in AI teacher — always on, retries on failure, never shuts down.

## Project structure

```
src/
├── app/
│   ├── api/           # lesson, videos, teacher, game, skill, sim routes
│   ├── globals.css    # editorial palette + utilities (card-pop, btn-pop, hud)
│   ├── layout.tsx     # fonts + metadata
│   └── page.tsx       # hash-router shell (the only route)
├── components/
│   ├── games/         # 5 arcade games + shared FX (particles, shake, confetti)
│   ├── site/          # header, footer, floating-teacher, video-embed, ai-teacher
│   └── views/         # home, careers, career-detail, grade, lesson, sim, skills, manifesto
├── data/
│   ├── careers.ts     # 60 careers
│   ├── curriculum.ts  # 12 grades × 10 lesson archetypes
│   └── skills.ts      # 38 skills
└── lib/
    ├── ai.ts          # LLM + web-search: lessons, videos, games, teacher, simulator
    ├── nav.tsx        # hash router
    ├── progress.ts    # zustand XP store (localStorage)
    └── types.ts       # shared types
```

## Notes

- The AI uses the `z-ai-web-dev-sdk` (model `glm-4-plus`). It runs server-side only and needs no API key — it's built into the platform.
- First lesson/video/game load takes ~10–25s (live web search + LLM generation). Results are cached in memory for the session.
- Progress (XP, completed lessons) is stored in `localStorage` — no database required.

## License

Free to use. Built with curiosity.
