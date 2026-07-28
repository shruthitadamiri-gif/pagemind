/**
 * PageMind Orchestrator
 *
 * The orchestrator is the single entry point for all recommendation requests.
 * It coordinates the agents, handles failures gracefully, and returns a
 * consistent response shape regardless of which agents succeeded or failed.
 *
 * The Express route (server/index.js) should only handle HTTP concerns:
 * parsing the request, validating inputs, rate limiting, and sending the
 * response. Everything domain-specific happens here.
 *
 * Current agent pipeline:
 *
 *   [Taste Agent]  — builds taste profile from feedback records (no LLM)
 *        ↓ tasteProfile (or null)
 *   [Search Agent] — calls Claude with query + context → raw book list
 *        ↓ books[]
 *   [Orchestrator] — assembles and returns final response
 *
 * Future agents slot in here without touching index.js or the agents themselves.
 * For example, an Enrichment Agent (cover art, ratings) would run after Search
 * Agent and before the final assembly step.
 */

import { runTasteAgent } from './agents/tasteAgent.js'
import { runIntentAgent } from './agents/intentAgent.js'
import { runSearchAgent, SearchAgentError } from './agents/searchAgent.js'
import { runAdmiredThinkerAgent, AdmiredThinkerAgentError } from './agents/admiredThinkerAgent.js'

// How many times to retry the Search Agent on a retryable failure
const MAX_SEARCH_RETRIES = 1

// ---------------------------------------------------------------------------
// Input type (comes from server/index.js after HTTP validation)
// ---------------------------------------------------------------------------
//
// OrchestratorInput {
//   userQuery:      string
//   genreMode:      'fiction' | 'non-fiction' | 'either'
//   categoryId:     string | null
//   kidsFilters:    { ageBandId: string, subCategoryId: string | null } | null
//   feedbackRecords: FeedbackRecord[]   ← raw feedback, not yet processed
//   excludeTitles:  string[]
//   count:          number | null
// }

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------
//
// OrchestratorResult {
//   books:        Book[]
//   tasteProfile: TasteProfile | null  ← included for debugging/transparency
//   agentTrace:   AgentTrace[]         ← what happened at each step (useful for debugging)
// }
//
// AgentTrace {
//   agent:    string
//   status:   'success' | 'skipped' | 'failed'
//   durationMs: number
//   error?:   string
// }

/**
 * Times an async function and returns both the result and elapsed ms.
 * Used to build the agentTrace for every orchestrator call.
 */
async function timed(fn) {
  const start = Date.now()
  try {
    const result = await fn()
    return { result, durationMs: Date.now() - start, error: null }
  } catch (err) {
    return { result: null, durationMs: Date.now() - start, error: err }
  }
}

/**
 * Main orchestrator function.
 *
 * @param {import('@anthropic-ai/sdk').Anthropic} client
 * @param {OrchestratorInput} input
 * @returns {Promise<OrchestratorResult>}
 */
export async function orchestrate(client, input) {
  const {
    userQuery,
    genreMode,
    categoryId,
    kidsFilters,
    feedbackRecords = [],
    excludeTitles = [],
    count,
  } = input

  const trace = []

  // -------------------------------------------------------------------------
  // Step 1 — Taste Agent + Intent Agent (run in parallel)
  //
  // These two agents are independent — neither needs the other's output —
  // so we run them concurrently with Promise.all. Total wait time is
  // max(tasteAgent, intentAgent) instead of the sum of both.
  //
  // If either fails, we log it and continue without that signal. The search
  // agent degrades gracefully: missing taste → no personalisation;
  // missing intent → raw query sent directly to Sonnet.
  // -------------------------------------------------------------------------

  // Replacement fetches (count === 1) reuse a query that was already parsed
  // when the original search ran — re-parsing it costs a Haiku call and ~1s
  // of latency for zero new information, so skip intent entirely there.
  const shouldParseIntent = count !== 1

  const [tasteResult, intentResult] = await Promise.all([
    timed(() => runTasteAgent(feedbackRecords)),
    shouldParseIntent
      ? timed(() => runIntentAgent(client, { userQuery, categoryId, genreMode }))
      : Promise.resolve({ result: null, durationMs: 0, error: null }),
  ])

  const tasteProfile = tasteResult.result
  const intent = intentResult.result

  trace.push({
    agent: 'tasteAgent',
    status: tasteResult.error ? 'failed' : tasteProfile ? 'success' : 'skipped',
    durationMs: tasteResult.durationMs,
    ...(tasteResult.error && { error: tasteResult.error.message }),
  })

  trace.push({
    agent: 'intentAgent',
    status: intentResult.error ? 'failed' : intent ? 'success' : 'skipped',
    durationMs: intentResult.durationMs,
    ...(intentResult.error && { error: intentResult.error.message }),
    ...(intent && { enriched_query: intent.enriched_query }),
  })

  // -------------------------------------------------------------------------
  // Step 1.5 — Admired Thinker Agent (branch)
  // When intentAgent detects a named public figure, this replaces the normal
  // search pipeline entirely — the request routes to live web-search-based
  // research instead of Sonnet generating recommendations directly.
  // -------------------------------------------------------------------------

  if (intent?.admired_thinker?.person_name) {
    let admiredResult = null
    let admiredError = null
    let admiredAttempts = 0

    while (admiredAttempts <= MAX_SEARCH_RETRIES && admiredResult === null) {
      const attempt = await timed(() =>
        runAdmiredThinkerAgent(client, {
          personName: intent.admired_thinker.person_name,
          personContext: intent.admired_thinker.person_context,
          excludeTitles,
        })
      )

      if (attempt.error) {
        const err = attempt.error
        if (err instanceof AdmiredThinkerAgentError && err.retryable && admiredAttempts < MAX_SEARCH_RETRIES) {
          trace.push({
            agent: 'admiredThinkerAgent',
            status: 'failed',
            durationMs: attempt.durationMs,
            error: `${err.message} (attempt ${admiredAttempts + 1}, retrying)`,
          })
          admiredAttempts++
          continue
        }
        admiredError = err
        trace.push({
          agent: 'admiredThinkerAgent',
          status: 'failed',
          durationMs: attempt.durationMs,
          error: err.message,
        })
        break
      }

      admiredResult = attempt.result
      trace.push({ agent: 'admiredThinkerAgent', status: 'success', durationMs: attempt.durationMs })
      admiredAttempts++
    }

    if (!admiredResult) {
      const err = new Error(admiredError?.message || 'Failed to research this person. Please try again.')
      err.trace = trace
      throw err
    }

    return {
      books: admiredResult.books,
      tasteProfile,
      agentTrace: trace,
      admiredThinker: {
        personName: intent.admired_thinker.person_name,
        found: admiredResult.found,
        reason: admiredResult.reason,
        narrative: admiredResult.narrative,
      },
    }
  }

  // -------------------------------------------------------------------------
  // Step 2 — Search Agent (with retry)
  // The search agent makes the actual Claude API call. We retry once on
  // retryable failures (network hiccups, occasional malformed model output).
  // Non-retryable failures propagate immediately.
  // -------------------------------------------------------------------------

  let books = null
  let searchError = null
  let attempts = 0

  while (attempts <= MAX_SEARCH_RETRIES && books === null) {
    const searchResult = await timed(() =>
      runSearchAgent(client, {
        userQuery,
        genreMode,
        categoryId,
        kidsFilters,
        tasteProfile,
        intent,
        excludeTitles,
        count,
      })
    )

    if (searchResult.error) {
      const err = searchResult.error
      if (err instanceof SearchAgentError && err.retryable && attempts < MAX_SEARCH_RETRIES) {
        // Log and retry
        trace.push({
          agent: 'searchAgent',
          status: 'failed',
          durationMs: searchResult.durationMs,
          error: `${err.message} (attempt ${attempts + 1}, retrying)`,
        })
        attempts++
        continue
      }
      // Not retryable, or out of retries — record and throw
      searchError = err
      trace.push({
        agent: 'searchAgent',
        status: 'failed',
        durationMs: searchResult.durationMs,
        error: err.message,
      })
      break
    }

    books = searchResult.result
    trace.push({
      agent: 'searchAgent',
      status: 'success',
      durationMs: searchResult.durationMs,
    })
    attempts++
  }

  // If search failed after all retries, throw — the Express route will catch
  // this and return a 502 to the client.
  if (!books) {
    const err = new Error(
      searchError?.message || 'Failed to fetch recommendations. Please try again.'
    )
    err.trace = trace   // attach trace so the route can log it
    throw err
  }

  // -------------------------------------------------------------------------
  // Step 3 — Assembly
  // Right now this is trivial — just return the books. As more agents are
  // added (enrichment, ranking), this step grows. The agents themselves
  // stay small and focused; the orchestrator grows to coordinate them.
  // -------------------------------------------------------------------------

  return {
    books,
    tasteProfile,
    agentTrace: trace,
  }
}
