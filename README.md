# PageMind

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

## How it works

The React frontend sends your prompt to a small Express server
(`server/index.js`), which holds the Anthropic API key and calls
`claude-sonnet-4-6` with a system prompt that positions the model as a
specialist recommender and asks for a structured JSON response. The frontend
never talks to Anthropic directly and never sees the API key — this matters
if you're going to share the running app with other people, since a
client-only setup would ship your key to every visitor's browser.

The server also rate-limits requests (20 requests per IP per 15 minutes by
default) so a single user — or a leaked link — can't run up unlimited usage
on your API key. Adjust the limit in `server/index.js` if you need more or
less headroom for a group.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example env file and add your API key:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and set:

   ```
   ANTHROPIC_API_KEY=your_key_here
   ```

### Getting an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com) and sign up or log in.
2. Navigate to **API Keys** in the console.
3. Create a new key and copy it into your `.env` file as shown above.
4. Make sure your account has billing set up — API usage is metered.

## Running locally

```bash
npm run dev
```

This runs two processes together: the Vite dev server (`http://localhost:5173`)
and the Express API server (`http://localhost:8787`). Vite proxies `/api`
requests to the Express server, so you only need to open `localhost:5173` in
your browser. Type a prompt into the search box and hit enter.

## Deploying / sharing with others

This app needs a Node host that can run the Express server — not a
static-only host. To deploy:

```bash
npm run build   # builds the React app into dist/
npm start       # serves dist/ + the /api routes from one process
```

`npm start` runs the production server on `process.env.PORT` (most hosts —
Render, Railway, Fly.io, etc. — set this automatically). Set
`ANTHROPIC_API_KEY` as an environment variable on whatever host you deploy
to; never commit it or put it in client-visible config.

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
To add a new category (e.g. "History", "Memoir", "Science"):

1. Add the category name to the `CATEGORIES` array.
2. That's it — the system prompt is built from this list automatically, and
   the UI's category filter chips are derived from whatever categories come
   back in the API response, so no other code changes are needed.

If you want a different primary specialty, change `PRIMARY_CATEGORY` in the
same file. To add a new genre mode beyond Fiction/Non-fiction/Either, add an
entry to `GENRE_MODES` and a matching instruction in `GENRE_INSTRUCTIONS`.
