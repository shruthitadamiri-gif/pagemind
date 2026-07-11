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
  {
    id: 'kids',
    label: 'Kids',
    description:
      'Read-aloud picture books for toddlers and young children — books a parent can actually borrow from the library and enjoy reading out loud night after night.',
    covers: [
      'Character & Feelings',
      'Silly & Absurd',
      'Rhythm & Repetition',
      'Nature & Animals',
      'Bedtime & Calm',
      'Friendship & Kindness',
      'Diversity & Identity',
      'Concepts & Learning',
      'Music & Sound',
    ],
    tone: 'Warm, playful, and practical — books a tired parent can read aloud night after night and still enjoy.',
    examples: ['Dragons Love Tacos', 'Llama Llama Red Pajama', 'Little Blue Truck', 'Grumpy Monkey', 'The Storybook Orchestra'],
  },
]

export const PRIMARY_CATEGORY = 'Decision Science'

export const KIDS_CATEGORY_ID = 'kids'

// The adult-facing domain picker only ever shows these — Kids has its own
// dedicated flow (see ModeToggle), not a slot in this dropdown.
export const ADULT_CATEGORIES = CATEGORIES.filter((c) => c.id !== KIDS_CATEGORY_ID)

// Add a new band here to expand the Kids age-band picker — no other code
// changes needed for the picker UI, but update the system prompt's
// outgrown-staples guidance below if the youngest band changes.
export const KIDS_AGE_BANDS = [
  { id: '3-4', label: 'Ages 3–4', shortLabel: '3–4' },
  { id: '4-5', label: 'Ages 4–5', shortLabel: '4–5' },
  { id: '5-6', label: 'Ages 5–6', shortLabel: '5–6' },
  { id: '6-7', label: 'Ages 6–7', shortLabel: '6–7' },
]

export const KIDS_DEFAULT_AGE_BAND = '3-4'

// Add a new sub-category here to expand the Kids picker — no other code
// changes needed. Update KIDS_SUB_CATEGORY_GUIDANCE below if it needs its
// own dedicated system-prompt instructions (like Music & Sound does).
export const KIDS_SUB_CATEGORIES = [
  'Character & Feelings',
  'Silly & Absurd',
  'Rhythm & Repetition',
  'Nature & Animals',
  'Bedtime & Calm',
  'Friendship & Kindness',
  'Diversity & Identity',
  'Concepts & Learning',
  'Music & Sound',
]

const KIDS_SUB_CATEGORY_GUIDANCE = {
  'Music & Sound': `For Music & Sound specifically, prioritise: books that come with accompanying music (CD, QR code, streaming link); books where the text has strong musical rhythm meant to be performed; books about musical instruments, composers, or the experience of music; and books that use sound words, onomatopoeia, and rhythm as storytelling devices. Examples in this space: "The Storybook Orchestra" series, "Zin! Zin! Zin! A Violin" by Lloyd Moss, "Mozart's Magnificent Voyage", "Ben's Trumpet" by Rachel Isadora, "The Noisy Paint Box", "Giraffes Can't Dance".`,
}

const KIDS_OUTGROWN_STAPLES = [
  'The Very Hungry Caterpillar',
  'Goodnight Moon',
  'Brown Bear, Brown Bear, What Do You See?',
  'Chicka Chicka Boom Boom',
]

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

function buildKidsInstructions(kidsFilters = {}) {
  const ageBand =
    KIDS_AGE_BANDS.find((b) => b.id === kidsFilters.ageBandId) ||
    KIDS_AGE_BANDS.find((b) => b.id === KIDS_DEFAULT_AGE_BAND)
  const subCategory = kidsFilters.subCategoryId || null
  const subCategoryGuidance = subCategory ? KIDS_SUB_CATEGORY_GUIDANCE[subCategory] : null

  return `### Kids-specific instructions

The reader is a parent looking for read-aloud books to borrow from the library for their child.

Age band: ${ageBand.label}. Recommendations MUST be age-appropriate for this band. Do not recommend books the child has likely already outgrown — staples like ${KIDS_OUTGROWN_STAPLES.map((t) => `"${t}"`).join(', ')} should only be recommended if the age band is exactly 3–4; never recommend them for 4–5, 5–6, or 6–7.

${subCategory ? `The parent has filtered to the "${subCategory}" sub-category — every recommendation must fit this sub-category.` : 'No sub-category filter is set — recommend across whichever sub-categories fit the prompt best.'}

Prioritise:
- Read-aloud quality: strong rhythm, pacing, and language that sounds good spoken aloud by a parent.
- Library availability: prefer widely available titles a parent can realistically borrow from a public library.
- What tends to work read-aloud: humor and absurdist premises, loveable characters with big feelings, rhythm and repetition, animal characters, and satisfying repeatable story arcs — weight these only insofar as they fit what the parent actually asked for.
${subCategoryGuidance ? `\n${subCategoryGuidance}` : ''}`
}

const STANDARD_RESPONSE_SHAPE = `Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
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

const KIDS_RESPONSE_SHAPE = `Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{
  "books": [
    {
      "title": "",
      "author": "",
      "illustrator": "",
      "age_band": "",
      "sub_category": "",
      "category": "Kids",
      "blurb": "",
      "why_recommended": "",
      "read_aloud_rating": "1 to 5 stars, e.g. \\"★★★★☆\\"",
      "library_availability": "Likely at library" or "Check availability",
      "includes_music": true or false
    }
  ]
}`

function buildTasteProfileInstructions(tasteProfile) {
  if (!tasteProfile) return ''
  const { loved, notForMe, wantToRead } = tasteProfile
  if (!loved && !notForMe && !wantToRead) return ''

  return `### Reader feedback history

This reader has given feedback on past recommendations from this app. Use it to personalise this round, but don't force a connection that isn't genuine:
${loved ? `- Loved: ${loved}. Lean toward whatever makes these work for them — tone, structure, subject, voice.` : ''}
${notForMe ? `- Didn't work for them: ${notForMe}. Do not recommend these again, and be cautious about very similar books unless the fit is otherwise strong.` : ''}
${wantToRead ? `- Already queued to read: ${wantToRead}. Do not recommend these again since they already know about them.` : ''}
`
}

function buildExcludeInstructions(excludeTitles) {
  if (!excludeTitles || excludeTitles.length === 0) return ''
  return `### Already shown — hard exclusion

CRITICAL: the reader has already seen these exact titles in this session. Recommending any of them again is a failure condition, even if one was just marked "didn't work for them" above and seems thematically perfect — pick a genuinely different book instead: ${excludeTitles.map((t) => `"${t}"`).join(', ')}.
`
}

export function buildSystemPrompt(
  genreMode = 'either',
  categoryId = null,
  kidsFilters = {},
  tasteProfile = null,
  excludeTitles = [],
  count = null
) {
  const isKids = categoryId === KIDS_CATEGORY_ID
  const genreInstruction = GENRE_INSTRUCTIONS[genreMode] || GENRE_INSTRUCTIONS.either
  const selected = categoryId ? CATEGORIES.find((c) => c.id === categoryId) : null

  const categoryConstraint = selected
    ? `The user has explicitly chosen the "${selected.label}" domain. Every recommendation must come from this domain — sub-topics within it are fine (see its "Covers" list), but do not recommend books from the other domains below.`
    : "The user has not pinned a domain — read their prompt and pick whichever domain(s) below genuinely fit best. You're not restricted to a single domain if a genuine blend fits, but don't force a connection that isn't there."

  const categoryBlock = CATEGORIES.map(describeCategory).join('\n\n')

  return `You are PageMind, a sharp, well-read book recommender specialising across these domains:

${categoryBlock}

${categoryConstraint}

${isKids ? buildKidsInstructions(kidsFilters) : ''}

${buildTasteProfileInstructions(tasteProfile)}

${buildExcludeInstructions(excludeTitles)}

A user will describe, in plain English, the kind of book or reading experience they're in the mood for. It might be a topic, a feeling, a question they're wrestling with, or a vague vibe. Your job is to recommend ${count ? `exactly ${count}` : '4-6'} real, published book${count === 1 ? '' : 's'} that genuinely fit${count === 1 ? 's' : ''} what they're after.

${isKids ? '' : `Genre constraint for this request: ${genreInstruction}\n\n`}Guidelines:
- Recommend real books that exist. Do not invent titles or authors.
- Each "why_recommended" must be personalised: explicitly tie the book back to specific words, feelings, or framing in what the user typed. Avoid generic blurbs like "this is a great book about X."
- Each "blurb" should be a single punchy sentence describing the book itself, written like a smart friend describing it over coffee — not a back-cover summary.
${isKids ? '- "sub_category" should be the single best-fit tag from the Kids domain\'s "Covers" list above.' : '- "category" should be the single best-fit tag for the book — use one of the domain names above, or a more specific sub-topic within a domain (e.g. "Game Theory" within Decision Science, "Political Economy" within Macro History) when that\'s more precise. Use fiction genres like "Literary Fiction" or "Science Fiction" when the genre constraint calls for fiction.'}
- Vary the books — avoid recommending only extremely famous titles when lesser-known gems fit better.

${isKids ? KIDS_RESPONSE_SHAPE : STANDARD_RESPONSE_SHAPE}`
}
