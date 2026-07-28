/**
 * Intent Agent
 *
 * Responsibility: parse a raw user query into structured intent that the
 * Search Agent can use to build a more precise system prompt.
 *
 * Uses claude-haiku-4-5 (fast, cheap) — intent parsing is a small structured
 * task. Sonnet is reserved for the Search Agent where recommendation quality
 * matters.
 *
 * Input contract:  IntentInput
 * Output contract: ParsedIntent
 *
 * Never throws — returns null on failure so the orchestrator can fall back
 * to passing the raw query directly to the Search Agent.
 */

// ---------------------------------------------------------------------------
// Input type
// ---------------------------------------------------------------------------
//
// IntentInput {
//   userQuery:  string   — the raw query exactly as the user typed it
//   categoryId: string | null  — domain already selected (Decision Science, etc.)
//   genreMode:  'fiction' | 'non-fiction' | 'either'
// }

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------
//
// ParsedIntent {
//   similar_to:       string[]   — books/authors explicitly mentioned as references
//   topics:           string[]   — subject areas inferred from the query
//   mood:             string | null  — e.g. "light and funny", "challenging", "escapist"
//   constraints:      string[]   — explicit constraints: "shorter", "not too long", "recent"
//   implicit_genre:   'fiction' | 'non-fiction' | null  — only set if strongly implied
//   enriched_query:   string     — a rewritten, more precise version of the original query
//                                  for the Search Agent to use in its system prompt
//   admired_thinker:  { person_name: string, person_context: string | null } | null
//                                — set when the query names a public figure and asks
//                                  what they read/recommend/think, routes to the
//                                  Admired Thinker agent instead of the normal search
// }

const INTENT_SYSTEM_PROMPT = `You are a query parser for a book recommendation engine.

Your job: read the user's book search query and extract structured intent.

Return ONLY a valid JSON object with these fields:
{
  "similar_to": [],        // books or authors the user explicitly mentioned as references. Empty array if none.
  "topics": [],            // 2-4 subject areas or themes inferred from the query. Be specific.
  "mood": null,            // the reading mood implied: e.g. "light and funny", "intellectually challenging", "emotionally moving", "fast-paced". Null if not clear.
  "constraints": [],       // explicit constraints the user mentioned: "shorter", "recent", "classic", "under 300 pages", "not too dense". Empty if none.
  "implicit_genre": null,  // "fiction" or "non-fiction" ONLY if strongly implied by the query. Null if ambiguous or either could work.
  "enriched_query": "",    // rewrite the query as a clear, specific brief for a librarian. Preserve the user's intent exactly — do not change what they're asking for, just make it more precise. 1-2 sentences.
  "admired_thinker": null  // see below
}

"admired_thinker" detection:
Set this to {"person_name": "...", "person_context": "..."} ONLY when the user names a specific real, public individual and asks about what that person reads, recommends, or how they think — e.g. "what does Trevor Noah read", "books Andrew Ng recommends", "someone who thinks like Anthony Bourdain", "I admire how Malcolm Gladwell thinks".
- "person_name": the named individual, exactly as a search engine would recognize them (full name if inferable).
- "person_context": short free text capturing what trait the user cares about (e.g. "unique thinking", "contrarian", "systems thinker"), or null if not stated.
- If the user describes a TYPE of thinker with NO specific name ("someone who thinks outside the box"), leave admired_thinker as null — this is a different, unsupported flow.
- If the named "person" is a fictional character (not a real public figure), leave admired_thinker as null — treat it as a normal book-similarity query instead.

Rules:
- Return ONLY the JSON object. No explanation, no markdown fences.
- Do not invent intent that isn't there. If a field has nothing, use null or [].
- enriched_query should expand abbreviations and implicit meaning, but never contradict or narrow the user's actual request.
- Keep topics concrete: "behavioral economics" not "science"; "World War II history" not "history".`

/**
 * @param {import('@anthropic-ai/sdk').Anthropic} client
 * @param {IntentInput} input
 * @returns {Promise<ParsedIntent | null>}
 */
export async function runIntentAgent(client, input) {
  const { userQuery, categoryId = null, genreMode = 'either' } = input

  // Short queries with no real signal aren't worth parsing — just pass through
  if (!userQuery || userQuery.trim().length < 8) {
    return null
  }

  // Add context about the selected domain so Haiku can resolve ambiguity
  const contextHint =
    categoryId
      ? `\n\nContext: the user has selected the "${categoryId}" domain filter.`
      : genreMode !== 'either'
      ? `\n\nContext: the user has filtered to ${genreMode} books only.`
      : ''

  let rawText
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: INTENT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userQuery + contextHint }],
    })

    rawText = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()
  } catch {
    // API failure — caller falls back to raw query
    return null
  }

  let parsed
  try {
    parsed = JSON.parse(rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, ''))
  } catch {
    // Parse failure — caller falls back to raw query
    return null
  }

  // Light validation — if enriched_query is missing or empty, the whole
  // intent is useless, so return null
  if (!parsed || typeof parsed.enriched_query !== 'string' || !parsed.enriched_query.trim()) {
    return null
  }

  const rawAdmiredThinker = parsed.admired_thinker
  const admiredThinker =
    rawAdmiredThinker &&
    typeof rawAdmiredThinker.person_name === 'string' &&
    rawAdmiredThinker.person_name.trim()
      ? {
          person_name: rawAdmiredThinker.person_name.trim().slice(0, 200),
          person_context:
            typeof rawAdmiredThinker.person_context === 'string' && rawAdmiredThinker.person_context.trim()
              ? rawAdmiredThinker.person_context.trim().slice(0, 300)
              : null,
        }
      : null

  return {
    similar_to: Array.isArray(parsed.similar_to) ? parsed.similar_to : [],
    topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    mood: typeof parsed.mood === 'string' ? parsed.mood : null,
    constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
    implicit_genre: ['fiction', 'non-fiction'].includes(parsed.implicit_genre)
      ? parsed.implicit_genre
      : null,
    enriched_query: parsed.enriched_query.trim(),
    admired_thinker: admiredThinker,
  }
}
