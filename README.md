# PageMind

**Live demo: [pagemind.onrender.com](https://pagemind.onrender.com)**

PageMind is a book recommender that takes plain-English descriptions of what
you're in the mood for — a feeling, a question, a vague vibe — and returns
4-6 real book recommendations, each with a personalised reason tied to what
you typed.

It's tuned to be a specialist across five domains:

- **Decision Science** — behavioural economics, psychology, game theory, persuasion, ethics, and AI/tech
- **Macro History** — why civilizations and economies rise, fall, and transform
- **Human Nature** — social psychology and the nature-vs-nurture debate
- **Women & Society** — women's experience across history, science, politics, and culture
- **Kids** — read-aloud picture books for toddlers and young children, filterable by age band and theme

A category picker lets you pin a search to one domain, or leave it on "All
Categories" and let PageMind infer the best fit — good for prompts like:

- "Something that challenges how I think about risk" (Decision Science)
- "How did geography determine which civilizations won?" (Macro History)
- "What actually shapes who we become — genes or environment?" (Human Nature)
- "Stories of women who changed history but were written out of it" (Women & Society)
- "Something funny about animals for a 4 year old" (Kids)

A Fiction / Non-fiction / Either toggle lets you steer the genre of results
on top of the domain, even when your prompt doesn't mention it explicitly
(this toggle is ignored when Kids is selected, since picture books aren't
meaningfully fiction/non-fiction).

When Kids is selected, two extra filters appear: an age band (3–4, 4–5, 5–6,
6–7) and an optional theme like "Music & Sound" or "Bedtime & Calm". Kids
results also show an illustrator credit, a read-aloud star rating, a library
availability badge, and a 🎵 badge for books that integrate music into the
reading experience.

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
  App.jsx                top-level state: query, results, loading, filters, genre mode, domain, kids filters
  api.js                 calls the local /api/recommend endpoint
  categories.js          domain definitions, genre modes, Kids age bands/sub-categories, and system prompt builder (shared by server)
  coverCache.js           Open Library cover lookup + cache
  index.css               all styling
  components/
    SearchBar.jsx
    EmptyState.jsx                domain-aware example prompts (different set for Kids)
    BookCard.jsx                   renders Kids-specific fields (illustrator, age band, ratings, badges) when present
    CategoryFilter.jsx       post-search filter chips (derived from returned results)
    CategorySelector.jsx     pre-search domain picker, shows the selected domain's description
    KidsFilters.jsx               age band + sub-category pickers, shown only when Kids is selected
    GenreToggle.jsx
```

## Adding new domains/categories

The domain system is centralised in [`src/categories.js`](src/categories.js).
Each entry in the `CATEGORIES` array is an object with `id`, `label`,
`description`, `covers` (a list of sub-topics), `tone`, and `examples`
(real books that anchor the domain for the model). To add a new domain —
say "Science" or "Memoir" — add a new object with those fields. Everything
else derives from this automatically: the system prompt, the category
picker, and the post-search filter chips. No other code changes are needed.

The Kids domain works the same way but with extra structure: `KIDS_AGE_BANDS`
and `KIDS_SUB_CATEGORIES` in the same file drive the age band and theme
pickers, and `buildSystemPrompt` adds dedicated Kids instructions (outgrown
staples to avoid, read-aloud quality, library availability, taste profile)
plus an extended JSON response shape with `illustrator`, `age_band`,
`read_aloud_rating`, `library_availability`, and `includes_music`. To add a
new sub-category with its own dedicated guidance (like Music & Sound has),
add an entry to `KIDS_SUB_CATEGORY_GUIDANCE`.

To add a new genre mode beyond Fiction/Non-fiction/Either, add an entry to
`GENRE_MODES` and a matching instruction in `GENRE_INSTRUCTIONS`.

## License

MIT — see [LICENSE](LICENSE).
