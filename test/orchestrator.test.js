/**
 * Orchestrator integration tests — mocked client, real agents.
 * Verifies coordination logic: parallel pre-agents, retry behavior,
 * graceful degradation, and the agent trace.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { orchestrate } from '../server/orchestrator.js'

const validBook = {
  title: 'Book',
  author: 'Author',
  blurb: 'Blurb.',
  why_recommended: 'Reason.',
}

const validIntent = {
  similar_to: [],
  topics: ['test'],
  mood: null,
  constraints: [],
  implicit_genre: null,
  enriched_query: 'an enriched query',
}

/**
 * Mock client that returns different responses per call, in order.
 * Each entry is either a string (returned as text) or an Error (thrown).
 */
function sequenceClient(responses) {
  let i = 0
  return {
    calls: 0,
    messages: {
      create: async function () {
        const response = responses[Math.min(i, responses.length - 1)]
        i++
        if (response instanceof Error) throw response
        return { content: [{ type: 'text', text: response }] }
      },
    },
  }
}

test('happy path: returns books and a full trace', async () => {
  const client = sequenceClient([
    JSON.stringify(validIntent),               // intentAgent call
    JSON.stringify({ books: [validBook] }),    // searchAgent call
  ])
  const result = await orchestrate(client, {
    userQuery: 'a long enough test query',
    genreMode: 'either',
    categoryId: null,
    kidsFilters: null,
    feedbackRecords: [{ title: 'T', author: 'A', status: 'loved' }],
    excludeTitles: [],
    count: null,
  })
  assert.equal(result.books.length, 1)
  const agents = result.agentTrace.map((t) => t.agent)
  assert.deepEqual(agents, ['tasteAgent', 'intentAgent', 'searchAgent'])
  assert.ok(result.agentTrace.every((t) => t.status === 'success'))
})

test('search retries once on malformed output, then succeeds', async () => {
  const client = sequenceClient([
    JSON.stringify(validIntent),
    'garbage response',                        // first search attempt fails
    JSON.stringify({ books: [validBook] }),    // retry succeeds
  ])
  const result = await orchestrate(client, {
    userQuery: 'a long enough test query',
    feedbackRecords: [],
  })
  assert.equal(result.books.length, 1)
  const searchTraces = result.agentTrace.filter((t) => t.agent === 'searchAgent')
  assert.equal(searchTraces.length, 2, 'trace shows the failed attempt and the retry')
  assert.equal(searchTraces[0].status, 'failed')
  assert.equal(searchTraces[1].status, 'success')
})

test('search failing on all attempts throws with trace attached', async () => {
  const client = sequenceClient([
    JSON.stringify(validIntent),
    'garbage',
    'garbage again',
  ])
  await assert.rejects(
    orchestrate(client, { userQuery: 'a long enough test query', feedbackRecords: [] }),
    (err) => Array.isArray(err.trace)
  )
})

test('intent failure degrades gracefully — search still runs with raw query', async () => {
  const client = sequenceClient([
    'not valid intent json',                   // intentAgent parse fails → null
    JSON.stringify({ books: [validBook] }),
  ])
  const result = await orchestrate(client, {
    userQuery: 'a long enough test query',
    feedbackRecords: [],
  })
  assert.equal(result.books.length, 1)
  const intentTrace = result.agentTrace.find((t) => t.agent === 'intentAgent')
  assert.equal(intentTrace.status, 'skipped')
})

test('count=1 replacement skips the intent agent entirely', async () => {
  // Only ONE response: the search call. If intentAgent were called, the
  // search would receive intent JSON as its response and fail validation.
  const client = sequenceClient([JSON.stringify({ books: [validBook] })])
  const result = await orchestrate(client, {
    userQuery: 'a long enough test query',
    feedbackRecords: [],
    excludeTitles: ['Some Shown Book'],
    count: 1,
  })
  assert.equal(result.books.length, 1)
  const intentTrace = result.agentTrace.find((t) => t.agent === 'intentAgent')
  assert.equal(intentTrace.status, 'skipped')
  assert.equal(intentTrace.durationMs, 0)
})

test('no feedback records → tasteAgent skipped, search unaffected', async () => {
  const client = sequenceClient([
    JSON.stringify(validIntent),
    JSON.stringify({ books: [validBook] }),
  ])
  const result = await orchestrate(client, {
    userQuery: 'a long enough test query',
    feedbackRecords: [],
  })
  const tasteTrace = result.agentTrace.find((t) => t.agent === 'tasteAgent')
  assert.equal(tasteTrace.status, 'skipped')
  assert.equal(result.books.length, 1)
})
