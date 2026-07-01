/**
 * Search Agent
 *
 * Responsibility: given a user query + search context, call Claude and return
 * a validated list of book recommendations.
 *
 * This is the only file in the codebase that calls the Anthropic API directly.
 * All prompt construction happens here or in buildSystemPrompt (categories.js).
 *
 * Input contract:  SearchInput
 * Output contract: Book[]
 *
 * Throws SearchAgentError on unrecoverable failure (bad API response, parse
 * failure after retries). The orchestrator catches this and decides whether
 * to surface the error or try a fallback.
 */

import { buildSystemPrompt } from '../../src/categories.js'

// ---------------------------------------------------------------------------
// Input type
// ---------------------------------------------------------------------------
//
// SearchInput {
//   userQuery:    string                    — the raw user search query
//   genreMode:    'fiction'|'non-fiction'|'either'
//   categoryId:   string | null             — domain filter
//   kidsFilters:  { ageBandId, subCategoryId } | null
//   tasteProfile: TasteProfile | null       — output of tasteAgent
//   intent:       ParsedIntent | null       — output of intentAgent (optional enrichment)
//   excludeTitles: string[]                 — titles already shown, must not repeat
//   count:        number | null             — 1 for replacements, null for default (5–8)
// }

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------
//
// Book {
//   title:        string
//   author:       string
//   year:         number | null
//   category:     string
//   why:          string   — one-sentence personalised reason
//   summary:      string   — 2–3 sentence description
//   // Kids-only fields (present when categoryId === 'kids')
//   illustrator?:         string
//   age_band?:            string
//   read_aloud_rating?:   number
//   library_availability?: string
//   includes_music?:      boolean
// }

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export class SearchAgentError extends Error {
  constructor(message, { cause, retryable = false } = {}) {
    super(message)
    this.name = 'SearchAgentError'
    this.cause = cause
    // retryable = true means the orchestrator can try again (e.g. network hiccup)
    // retryable = false means retrying won't help (e.g. malformed JSON from model)
    this.retryable = retryable
  }
}

// ---------------------------------------------------------------------------
// Response validation
// ---------------------------------------------------------------------------
// We check the shape of Claude's response before passing it upstream.
// This is called "validating at the boundary" — we don't trust external output
// (even from our own Claude calls) until we've checked it.

function isValidBook(book) {
  return (
    book &&
    typeof book.title === 'string' && book.title.trim() &&
    typeof book.author === 'string' && book.author.trim() &&
    typeof book.why === 'string' && book.why.trim() &&
    typeof book.summary === 'string' && book.summary.trim()
  )
}

function parseAndValidate(rawText) {
  // Strip markdown code fences if the model wrapped the JSON
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/```\s*$/, '')

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch (err) {
    throw new SearchAgentError('Model returned non-JSON output', {
      cause: err,
      retryable: true,   // model output is non-deterministic; worth retrying
    })
  }

  if (!parsed.books || !Array.isArray(parsed.books)) {
    throw new SearchAgentError('Model response missing "books" array', {
      retryable: true,
    })
  }

  const valid = parsed.books.filter(isValidBook)

  if (valid.length === 0) {
    throw new SearchAgentError('No valid books in model response', {
      retryable: true,
    })
  }

  return valid
}

// ---------------------------------------------------------------------------
// Main agent function
// ---------------------------------------------------------------------------

/**
 * @param {import('@anthropic-ai/sdk').Anthropic} client — Anthropic SDK instance, injected by orchestrator
 * @param {SearchInput} input
 * @returns {Promise<Book[]>}
 * @throws {SearchAgentError}
 */
/**
 * Builds an intent summary string to append to the system prompt when
 * intentAgent successfully parsed the query. This gives Sonnet additional
 * structured context without changing the base system prompt.
 */
function buildIntentContext(intent) {
  if (!intent) return ''
  const lines = []
  if (intent.similar_to?.length) lines.push(`Reference books/authors: ${intent.similar_to.join(', ')}`)
  if (intent.topics?.length) lines.push(`Key topics: ${intent.topics.join(', ')}`)
  if (intent.mood) lines.push(`Reading mood: ${intent.mood}`)
  if (intent.constraints?.length) lines.push(`Constraints: ${intent.constraints.join(', ')}`)
  if (intent.implicit_genre) lines.push(`Implied genre: ${intent.implicit_genre}`)
  if (!lines.length) return ''
  return `\n\n### Parsed query intent\n${lines.join('\n')}`
}

export async function runSearchAgent(client, input) {
  const {
    userQuery,
    genreMode = 'either',
    categoryId = null,
    kidsFilters = null,
    tasteProfile = null,
    intent = null,
    excludeTitles = [],
    count = null,
  } = input

  // Build the system prompt using the shared categories logic, then append
  // structured intent if intentAgent produced useful output.
  const systemPrompt =
    buildSystemPrompt(genreMode, categoryId, kidsFilters ?? {}, tasteProfile, excludeTitles, count)
    + buildIntentContext(intent)

  // Use the enriched query if intentAgent produced one; fall back to raw query.
  // The enriched query is more precise but preserves the user's original intent.
  const queryToSend = intent?.enriched_query || userQuery

  let rawText
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: queryToSend }],
    })

    rawText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim()
  } catch (err) {
    // Anthropic SDK errors (rate limits, network, auth) are retryable at the
    // orchestrator level — the agent itself just surfaces them cleanly.
    throw new SearchAgentError('Anthropic API call failed', {
      cause: err,
      retryable: true,
    })
  }

  // Parse and validate — throws SearchAgentError if the response is malformed
  return parseAndValidate(rawText)
}
