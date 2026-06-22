# PageMind

**Live demo: [pagemind.onrender.com](https://pagemind.onrender.com)**

PageMind is a book recommender that takes plain-English descriptions of what
you're in the mood for — a feeling, a question, a vague vibe — and returns
4-6 real book recommendations, each with a personalised reason tied to what
you typed.

It's tuned to be a specialist in **Decision Science**, with strong range
across behavioural economics, psychology, game theory, persuasion, ethics,
and AI/tech — so it's a good fit for prompts like:

- "Something that challenges how I think about risk"
- "A book about how tech companies manipulate us"
- "Why smart people make irrational decisions under pressure"

A Fiction / Non-fiction / Either toggle lets you steer the genre of results
even when your prompt doesn't mention it explicitly.

> The free hosting tier sleeps after inactivity, so the first request after
> idle time can take 30-50 seconds to wake up.

## How it works

The React frontend sends your prompt to a small Express server
(`server/index.js`), which holds the Anthropic API key and calls
`claude-sonnet-4-6` with a system prompt that positions the model as a
specialist recommender and asks for a structured JSON response. The frontend
never talks to Anthropic directly and never sees the API key, and the server
rate-limits requests (20 per IP per 15 minutes) to prevent abuse.

## Running it locally

```bash
npm install
cp .env.example .env   # then add your ANTHROPIC_API_KEY (console.anthropic.com)
npm run dev
```

Opens at `http://localhost:5173`. This runs the Vite dev server and the
Express API server together; Vite proxies `/api` requests to Express.

## Deploying

Needs a Node host that can run the Express server (not static-only hosting).
A `render.yaml` is included for one-click deploy on [Render](https://render.com):
connect the repo via Render's "New Blueprint" flow and set `ANTHROPIC_API_KEY`
when prompted. To deploy manually anywhere else:

```bash
npm run build
npm start
```

## Project structure

```
server/
  index.js              Express server: /api/recommend, rate limiting, serves built frontend in production
src/
  App.jsx                top-level state: query, results, loading, filters, genre mode
  api.js                 calls the local /api/recommend endpoint
  categories.js          category list, genre modes, and system prompt builder (shared by server)
  coverCache.js           Open Library cover lookup + cache
  index.css               all styling
  components/
    SearchBar.jsx
    EmptyState.jsx
    BookCard.jsx
    CategoryFilter.jsx
    GenreToggle.jsx
    SpecialistBadge.jsx
```

## Adding new categories

The category system is centralised in [`src/categories.js`](src/categories.js).
To add a new category (e.g. "History", "Memoir", "Science"), just add it to
the `CATEGORIES` array — the system prompt and the UI's filter chips both
derive from this list automatically.

To add a new genre mode beyond Fiction/Non-fiction/Either, add an entry to
`GENRE_MODES` and a matching instruction in `GENRE_INSTRUCTIONS`.

## License

MIT — see [LICENSE](LICENSE).
