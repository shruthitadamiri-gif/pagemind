// Add a new domain here (with description/covers/tone/examples) to expand
// PageMind's range — no other code changes needed. The system prompt, the
// specialist badge, the category picker, and the empty-state examples all
// derive from this list automatically.
export const CATEGORIES = [
  {
    id: 'decision-science',
    label: 'Decision Science',
    description:
      'How people and organisations actually make decisions — the cognitive shortcuts, incentives, and social forces that shape choices under uncertainty.',
    covers: [
      'Behavioural economics — why people systematically deviate from "rational" choice',
      'Psychology of judgment, bias, and risk',
      'Game theory and strategic interaction',
      'Persuasion and influence — how minds get changed',
      'Ethics in decision-making and institutions',
      "AI and technology's growing role in how decisions get made",
    ],
    tone: 'Sharp, practical, evidence-driven. Books that change how you actually decide, not just what you think about deciding.',
    examples: ['Thinking, Fast and Slow', 'Influence', 'The Undoing Project', 'Antifragile', 'Superforecasting'],
  },
  {
    id: 'macro-history',
    label: 'Macro History',
    description:
      'The study of why civilizations, economies, and societies rise, fall, and transform — using history as data and social science as the analytical lens.',
    covers: [
      'Geopolitics and how geography, resources, and power shape nations over centuries',
      'Historical patterns and root causes behind major world events',
      'Behavioural trends with large-scale socioeconomic impact',
      'Collective decision-making at civilizational scale',
      'Comparative history — why did some societies develop differently than others?',
      'Political economy — where economics meets power and institutions',
    ],
    tone: 'Analytical, big-picture, pattern-seeking. Books that treat history as a system to understand, not just a sequence of events to memorise.',
    examples: ['Guns, Germs, and Steel', 'Sapiens', 'Debt: The First 5000 Years', 'The Dawn of Everything', 'The WEIRDest People in the World'],
  },
  {
    id: 'human-nature',
    label: 'Human Nature',
    description:
      "Why people are the way they are — individually and collectively. Sits at the intersection of social psychology and the nature vs nurture debate.",
    covers: [
      'Social psychology — how groups, culture, and environment shape behaviour',
      'Nature vs nurture — what makes us who we are',
      'How humans develop identity, values, and personality',
      'Why people conform, rebel, cooperate, or compete',
      'The evolutionary and biological roots of human behaviour',
      'Cross-cultural differences in how people think and act',
    ],
    tone: 'Curious, empathetic, evidence-based. Books that make you rethink assumptions about yourself and the people around you.',
    examples: ['The WEIRDest People in the World', 'Behave', 'The Blank Slate', 'Quiet'],
  },
  {
    id: 'women-society',
    label: 'Women & Society',
    description:
      "The full intellectual landscape of women's experience — historically, socially, politically, and culturally. Not limited to feminist theory — includes memoir, history, sociology, science, and cultural criticism through the lens of women's lives and contributions.",
    covers: [
      'Feminist theory and gender studies',
      "Women in history — untold stories and overlooked contributions",
      'The science of gender — biology, psychology, social construction',
      'Women and power — in politics, business, culture',
      'Intersectionality — how gender interacts with race, class, geography',
      "Personal narrative and memoir that illuminate the female experience",
    ],
    tone: 'Wide-ranging, intersectional, intellectually serious. Not prescriptive or ideological — the goal is illumination, not advocacy.',
    examples: ['Invisible Women', 'The Second Sex', 'Educated', 'Untamed', 'The Feminine Mystique'],
  },
]

export const PRIMARY_CATEGORY = 'Decision Science'

// Add a new mode here to expand PageMind's genre options — no other code changes needed.
export const GENRE_MODES = [
  { id: 'either', label: 'Either' },
  { id: 'fiction', label: 'Fiction' },
  { id: 'nonfiction', label: 'Non-fiction' },
]

const GENRE_INSTRUCTIONS = {
  either:
    "Recommend whichever mix of fiction and non-fiction genuinely best fits the request — don't default to one or the other.",
  fiction:
    "Recommend ONLY fiction: novels, novellas, or short story collections. Do not recommend non-fiction, memoir, or narrative non-fiction, even if a non-fiction book would otherwise fit well. If the user's prompt is thematic (a feeling, a question, a topic), find novels that explore that theme.",
  nonfiction:
    'Recommend ONLY non-fiction: argument-driven books, narrative non-fiction, memoir, or research-backed books. Do not recommend novels or other fiction.',
}

function describeCategory(category) {
  return `### ${category.label}
${category.description}
Covers: ${category.covers.join('; ')}
Tone: ${category.tone}
Example books in this domain: ${category.examples.join(', ')}`
}

export function buildSystemPrompt(genreMode = 'either', categoryId = null) {
  const genreInstruction = GENRE_INSTRUCTIONS[genreMode] || GENRE_INSTRUCTIONS.either
  const selected = categoryId ? CATEGORIES.find((c) => c.id === categoryId) : null

  const categoryConstraint = selected
    ? `The user has explicitly chosen the "${selected.label}" domain. Every recommendation must come from this domain — sub-topics within it are fine (see its "Covers" list), but do not recommend books from the other domains below.`
    : "The user has not pinned a domain — read their prompt and pick whichever domain(s) below genuinely fit best. You're not restricted to a single domain if a genuine blend fits, but don't force a connection that isn't there."

  const categoryBlock = CATEGORIES.map(describeCategory).join('\n\n')

  return `You are PageMind, a sharp, well-read book recommender specialising across these domains:

${categoryBlock}

${categoryConstraint}

A user will describe, in plain English, the kind of book or reading experience they're in the mood for. It might be a topic, a feeling, a question they're wrestling with, or a vague vibe. Your job is to recommend 4-6 real, published books that genuinely fit what they're after.

Genre constraint for this request: ${genreInstruction}

Guidelines:
- Recommend real books that exist. Do not invent titles or authors.
- Each "why_recommended" must be personalised: explicitly tie the book back to specific words, feelings, or framing in what the user typed. Avoid generic blurbs like "this is a great book about X."
- Each "blurb" should be a single punchy sentence describing the book itself, written like a smart friend describing it over coffee — not a back-cover summary.
- "category" should be the single best-fit tag for the book — use one of the domain names above, or a more specific sub-topic within a domain (e.g. "Game Theory" within Decision Science, "Political Economy" within Macro History) when that's more precise. Use fiction genres like "Literary Fiction" or "Science Fiction" when the genre constraint calls for fiction.
- Vary the books — avoid recommending only extremely famous titles when lesser-known gems fit better.

Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{
  "books": [
    {
      "title": "",
      "author": "",
      "year": "",
      "category": "",
      "blurb": "",
      "why_recommended": ""
    }
  ]
}`
}
