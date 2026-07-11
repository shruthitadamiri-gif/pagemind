# PageMind — Claude Code Context

## What this project is

PageMind is a book recommendation web app. The user types a natural-language query ("something like Thinking Fast and Slow but more fun") and gets back 5–8 curated book recommendations with covers, explanations, and a feedback system that builds a taste profile over time.

There are two modes:
- **For Me** — adult recommendations across 4 domains (Decision Science, Macro History, Human Nature, Women & Society) with a fiction/non-fiction toggle
- **For My Kid** — children's books filtered by age band (3–4, 4–5, 5–6, 6–7) and optional theme

The app is a single-page React + Vite frontend backed by an Express.js server. The server holds the Anthropic API key and makes all Claude API calls — the key is never exposed to the browser.

Live at: https://pagemind.onrender.com
Repo: https://github.com/shruthitadamiri-gif/pagemind

---

## How to run locally

```bash
cd /Users/shruthit/pagemind
npm run dev          # starts both Vite (port 5173) and Express (port 8787) via concurrently
```

The Vite dev server proxies `/api/*` requests to `localhost:8787` (see `vite.config.js`).

The `.env` file at project root must contain:
```
ANTHROPIC_API_KEY=sk-ant-...
```

This file is gitignored and never committed.

### Port note
The Express server must bind to port 8787 in dev. The `dev:server` script sets `PORT=8787` explicitly because the preview tool injects `PORT=5173` into all child processes, which would otherwise cause Express to steal Vite's port.

---

## Architecture

```
src/                    # React + Vite frontend (runs in browser)
  App.jsx               # Top-level state, search orchestration, feedback handling
  api.js                # Single fetch function: POST /api/recommend
  categories.js         # Domain data + buildSystemPrompt() — shared by client and server
  feedbackStore.js      # localStorage persistence for user feedback (liked/want/not-for-me)
  coverCache.js         # Open Library cover fetching with localStorage cache
  components/
    ModeToggle.jsx      # "For Me / For My Kid" top-level toggle
    SearchBar.jsx       # Query input + submit
    CategorySelector.jsx # Adult domain dropdown (Decision Science, etc.)
    GenreToggle.jsx     # Fiction / Non-fiction / Either
    KidsFilters.jsx     # Age band + theme dropdowns for kids mode
    BookCard.jsx        # Renders a single book: cover, metadata, feedback buttons
    CategoryFilter.jsx  # Post-results filter chips by category
    EmptyState.jsx      # Example prompts shown before first search
    Dropdown.jsx        # Custom themed dropdown (replaces native <select>)

server/
  index.js              # Express server: validates inputs, calls Claude, returns books
```

### Data flow

```
User types query
  → App.jsx calls api.js (POST /api/recommend with prompt + filters + taste profile)
  → server/index.js validates all inputs
  → buildSystemPrompt() assembles a system prompt from domain, filters, taste profile, exclusions
  → Claude API (claude-sonnet-4-6) returns JSON
  → server parses and validates the JSON shape
  → client receives { books: [...] }
  → BookCard components render each book
  → coverCache.js fetches cover images from Open Library in parallel
```

### Key design decisions

- **API key stays on server**: `server/index.js` is the only file that touches `ANTHROPIC_API_KEY`. `src/api.js` only knows about `/api/recommend`.
- **buildSystemPrompt lives in `src/categories.js`** (not in server/) so the domain data and prompt logic are co-located and importable from both client (for UI labels) and server (for API calls).
- **Feedback is localStorage-only** for now. The taste profile is built from feedback at request time in `feedbackStore.buildTasteProfile()` and sent as a string in the system prompt.
- **Live card replacement**: "Not for me" triggers a single `count=1` replacement fetch, not a full re-search. The book's key is added to `replacingKeys` state to show a loading card in place.

---

## Conventions

### Code style
- Functional React components, hooks only (no class components)
- No TypeScript yet — plain JS with JSDoc where types matter
- ES modules throughout (`import/export`), no CommonJS
- Tests: `npm test` (Node's built-in test runner, zero deps). Tests live in
  `test/` and use a mocked Anthropic client — no API key or network needed.
  Run them before committing any change to `server/` or `src/categories.js`.
  UI changes are still verified in the preview tool.
- The prompt/validator field contract (blurb, why_recommended) is pinned by
  `test/promptSchema.test.js` — if you rename response fields, update the
  prompt shape, the validator, BookCard.jsx, and these tests together.

### What NOT to do
- Do not add TypeScript without being asked — it's a deliberate choice to keep iteration fast
- Do not add a component library (MUI, Shadcn, etc.) — the design system is hand-rolled in `index.css`
- Do not move `buildSystemPrompt` out of `src/categories.js` — it needs to be importable from both client and server
- Do not commit `.env` or any file containing `ANTHROPIC_API_KEY`
- Do not add comments that describe what the code does — only add comments for non-obvious WHY

### CSS
All styling is in `src/index.css`. The design uses CSS custom properties:
```css
--bg: #f3ecdd        /* warm cream background */
--ink: #2b2420       /* near-black text */
--accent: #b3622e    /* burnt orange — primary actions */
--accent-2: #7a3232  /* burgundy — secondary */
--font-display: 'Fraunces', serif
--font-body: 'Source Serif 4', Georgia, serif
--font-ui: system-ui, sans-serif
```

The Dropdown component (`src/components/Dropdown.jsx`) is custom — not a native `<select>` — because native selects can't be themed consistently across browsers.

### Deployment
- Platform: Render.com, configured via `render.yaml`
- Build: `npm install --include=dev && npm run build` (devDependencies needed for Vite build)
- Start: `NODE_ENV=production node server/index.js` (Express serves the built `dist/` folder)
- `ANTHROPIC_API_KEY` is set as a secret env var in the Render dashboard (never in render.yaml)

---

## Planned next steps (agentic architecture)

The current architecture is a single-step pipeline: one Claude call per search. The roadmap toward a proper agentic workflow:

1. **Phase 1** — Extract agents: move search logic into `server/agents/searchAgent.js` and taste logic into `server/agents/tasteAgent.js`, each with typed input/output contracts
2. **Phase 2** — Orchestrator: add `server/orchestrator.js` to coordinate agents and assemble the final response
3. **Phase 3** — Persistence: move feedback from localStorage to a lightweight database (SQLite via better-sqlite3) so taste profile persists across devices
4. **Phase 4** — Streaming: stream book results one at a time instead of waiting for all 8

---

## Rate limiting

`express-rate-limit` is configured at 20 requests per IP per 15 minutes on `/api/recommend`. This is intentionally conservative because the app is publicly accessible and each request costs Anthropic API credits.
