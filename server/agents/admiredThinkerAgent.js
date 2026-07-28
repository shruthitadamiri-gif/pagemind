/**
 * Admired Thinker Agent
 *
 * Responsibility: given a named public figure, use live web search to find
 * books that person has read, recommended, or referenced, group them by
 * theme, and produce a narrative about the pattern behind their reading —
 * not just a flat list.
 *
 * Uses claude-sonnet-4-6 with the server-side web_search tool. Web search is
 * server-executed — Claude calls it, Anthropic runs it, and the results
 * arrive as content blocks in the same response. No client-side tool loop.
 *
 * v1 scope (per product decision): live web search only, no seed index / no
 * caching. Single named person only — no "Mind Map" multi-person intersection.
 *
 * Input contract:  AdmiredThinkerInput
 * Output contract: AdmiredThinkerResult
 * Throws AdmiredThinkerAgentError on unrecoverable failure.
 */

// ---------------------------------------------------------------------------
// Input type
// ---------------------------------------------------------------------------
//
// AdmiredThinkerInput {
//   personName:    string        — the named individual, e.g. "Trevor Noah"
//   personContext: string | null — free text like "unique thinking" (optional)
//   excludeTitles: string[]      — titles already shown, must not repeat
// }

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------
//
// AdmiredThinkerResult {
//   found:      boolean          — false if no public reading trail exists
//   reason:     string | null    — explanation when found is false
//   narrative:  string | null    — the throughline: why this person gravitates
//                                  to these ideas, grounded in sources
//   books: [{
//     title, author,
//     confidence_tier: 1 | 2 | 3,  // 1=direct quote, 2=attributed, 3=aggregator
//     source_note: string,         // how/when this pick surfaced
//     theme: string,               // which narrative grouping this book belongs to
//     blurb: string,
//     why_recommended: string,     // ties back to the admired person's framing
//   }]
// }

export class AdmiredThinkerAgentError extends Error {
  constructor(message, { cause, retryable = false } = {}) {
    super(message)
    this.name = 'AdmiredThinkerAgentError'
    this.cause = cause
    this.retryable = retryable
  }
}

const SYSTEM_PROMPT = `You are researching the reading life of a named public figure for a book recommendation app called PageMind.

Your job: use web search to find real, verifiable books this person has read, recommended, or referenced, then explain the pattern behind their reading — not just list titles.

## Source confidence tiers
Score every book you find on how reliable the source is:
- Tier 1 (high confidence): a direct quote from the person themselves — their own blog/site, a verified social post, a direct interview quote, or a book they authored referencing another work.
- Tier 2 (medium confidence): an attributed statement in a podcast/interview transcript, or a reputable outlet's article that clearly attributes the claim to the person (not just "fans say").
- Tier 3 (low confidence): aggregator/curated-list sites (Goodreads shelves, "most recommended books" roundups, Blinkist-style compilations).

## Filter logic
Keep every Tier 1/2 item you find. Only backfill with Tier 3 items if fewer than 3 Tier 1/2 items exist. If you end up with only Tier 3 sources, say so plainly in the narrative rather than presenting the list with false confidence. Deduplicate: if the same book appears from multiple sources, keep only the highest-confidence source note for it.

## Graceful fallback
If the named person is a fictional character, a private individual with no public reading trail, or someone you cannot find credible sourcing for, set "found": false and explain why in "reason" — do not fabricate or guess at what they might read.

## Narrative, not just a list
Group the books by theme/pattern you can detect (e.g. "identity & power" vs "execution & mental models") — do not just list them flat. Write a short, plausible characterization of why this person gravitates toward these ideas, grounded only in what your sources actually say — never invented psychoanalysis.

## Response format
Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{
  "found": true,
  "reason": null,
  "narrative": "2-4 sentences describing the pattern across this person's reading, grounded in sources.",
  "books": [
    {
      "title": "",
      "author": "",
      "confidence_tier": 1,
      "source_note": "e.g. 'Described in a 2024 year-end favorites interview'",
      "theme": "e.g. 'identity & power'",
      "blurb": "one punchy sentence describing the book itself",
      "why_recommended": "ties the book back to this person's stated reasoning or pattern"
    }
  ]
}

If found is false, still return valid JSON: {"found": false, "reason": "...", "narrative": null, "books": []}

Recommend 4-8 books when found is true. Real books only — never invent titles.

CRITICAL: Do your research and reasoning using the search tool as needed, but your FINAL message must contain ONLY the JSON object — no "here's what I found" preamble, no markdown fences, no closing commentary after it. The first character of your final message must be "{".`

function isValidBook(book) {
  return (
    book &&
    typeof book.title === 'string' && book.title.trim() &&
    typeof book.author === 'string' && book.author.trim() &&
    [1, 2, 3].includes(book.confidence_tier) &&
    typeof book.blurb === 'string' && book.blurb.trim() &&
    typeof book.why_recommended === 'string' && book.why_recommended.trim()
  )
}

function extractFinalText(message) {
  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim()
}

function parseAndValidate(rawText) {
  let cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '')

  // Web search runs tend to add a sentence of commentary before or after the
  // JSON ("Based on my research, here's what I found:\n{...}") even when the
  // prompt says JSON-only. Extract the outermost {...} span rather than
  // requiring the whole string to be valid JSON.
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1)
  }

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch (err) {
    throw new AdmiredThinkerAgentError('Model returned non-JSON output', {
      cause: err,
      retryable: true,
    })
  }

  if (parsed.found === false) {
    return {
      found: false,
      reason: typeof parsed.reason === 'string' ? parsed.reason : 'No public reading trail found for this person.',
      narrative: null,
      books: [],
    }
  }

  if (!Array.isArray(parsed.books)) {
    throw new AdmiredThinkerAgentError('Model response missing "books" array', { retryable: true })
  }

  const validBooks = parsed.books.filter(isValidBook)

  if (validBooks.length === 0) {
    throw new AdmiredThinkerAgentError('No valid books in model response', { retryable: true })
  }

  return {
    found: true,
    reason: null,
    narrative: typeof parsed.narrative === 'string' ? parsed.narrative : null,
    books: validBooks,
  }
}

/**
 * @param {import('@anthropic-ai/sdk').Anthropic} client
 * @param {AdmiredThinkerInput} input
 * @returns {Promise<AdmiredThinkerResult>}
 * @throws {AdmiredThinkerAgentError}
 */
export async function runAdmiredThinkerAgent(client, input) {
  const { personName, personContext = null, excludeTitles = [] } = input

  const contextLine = personContext ? `\n\nThe user specifically admires their "${personContext}".` : ''
  const excludeLine = excludeTitles.length
    ? `\n\nDo not recommend any of these already-shown titles: ${excludeTitles.map((t) => `"${t}"`).join(', ')}.`
    : ''

  const userMessage = `Research ${personName}'s reading life — books they've read, recommended, or referenced.${contextLine}${excludeLine}`

  let message
  try {
    message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 8 }],
      messages: [{ role: 'user', content: userMessage }],
    })

    // Server-side web search can hit its internal iteration cap and pause;
    // resume once by resending the conversation as the docs describe.
    if (message.stop_reason === 'pause_turn') {
      message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 8 }],
        messages: [
          { role: 'user', content: userMessage },
          { role: 'assistant', content: message.content },
        ],
      })
    }
  } catch (err) {
    throw new AdmiredThinkerAgentError('Anthropic API call failed', { cause: err, retryable: true })
  }

  const rawText = extractFinalText(message)
  return parseAndValidate(rawText)
}
