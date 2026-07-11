/**
 * Per-agent unit tests with a mocked Anthropic client.
 * No network calls, no API key needed — safe to run anywhere.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runTasteAgent } from '../server/agents/tasteAgent.js'
import { runIntentAgent } from '../server/agents/intentAgent.js'
import { runSearchAgent, SearchAgentError } from '../server/agents/searchAgent.js'

function mockClient(responseText) {
  return {
    messages: {
      create: async () => ({
        content: [{ type: 'text', text: responseText }],
      }),
    },
  }
}

function failingClient(error = new Error('network down')) {
  return {
    messages: {
      create: async () => {
        throw error
      },
    },
  }
}

// ---------------------------------------------------------------------------
// tasteAgent
// ---------------------------------------------------------------------------

test('tasteAgent: groups records by status', () => {
  const profile = runTasteAgent([
    { title: 'Sapiens', author: 'Harari', status: 'loved' },
    { title: 'Quiet', author: 'Cain', status: 'want_to_read' },
    { title: 'Untamed', author: 'Doyle', status: 'not_for_me' },
  ])
  assert.match(profile.loved, /Sapiens by Harari/)
  assert.match(profile.wantToRead, /Quiet by Cain/)
  assert.match(profile.notForMe, /Untamed by Doyle/)
})

test('tasteAgent: returns null for empty or non-array input', () => {
  assert.equal(runTasteAgent([]), null)
  assert.equal(runTasteAgent(null), null)
  assert.equal(runTasteAgent('not an array'), null)
})

test('tasteAgent: drops malformed records instead of throwing', () => {
  const profile = runTasteAgent([
    { title: 'Good', author: 'Author', status: 'loved' },
    { title: '', author: 'A', status: 'loved' },        // empty title
    { title: 'X', author: 'Y', status: 'invalid' },     // bad status
    null,                                                // not an object
  ])
  assert.match(profile.loved, /Good by Author/)
  assert.doesNotMatch(profile.loved, /X by Y/)
})

// ---------------------------------------------------------------------------
// intentAgent
// ---------------------------------------------------------------------------

test('intentAgent: parses a valid model response', async () => {
  const client = mockClient(
    JSON.stringify({
      similar_to: ['Sapiens'],
      topics: ['big history'],
      mood: 'light and funny',
      constraints: ['shorter'],
      implicit_genre: 'non-fiction',
      enriched_query: 'A shorter, funnier big-history book similar to Sapiens.',
    })
  )
  const intent = await runIntentAgent(client, { userQuery: 'like Sapiens but shorter and funnier' })
  assert.equal(intent.similar_to[0], 'Sapiens')
  assert.equal(intent.implicit_genre, 'non-fiction')
  assert.match(intent.enriched_query, /Sapiens/)
})

test('intentAgent: returns null on API failure (graceful degradation)', async () => {
  const intent = await runIntentAgent(failingClient(), { userQuery: 'a long enough query here' })
  assert.equal(intent, null)
})

test('intentAgent: returns null on unparseable model output', async () => {
  const intent = await runIntentAgent(mockClient('sorry, I cannot help'), {
    userQuery: 'a long enough query here',
  })
  assert.equal(intent, null)
})

test('intentAgent: skips queries too short to be worth parsing', async () => {
  // Client would throw if called — proving short queries never hit the API
  const intent = await runIntentAgent(failingClient(), { userQuery: 'books' })
  assert.equal(intent, null)
})

test('intentAgent: returns null when enriched_query is missing', async () => {
  const intent = await runIntentAgent(
    mockClient(JSON.stringify({ topics: ['history'] })),
    { userQuery: 'a long enough query here' }
  )
  assert.equal(intent, null)
})

// ---------------------------------------------------------------------------
// searchAgent
// ---------------------------------------------------------------------------

const validBook = {
  title: 'The Now Habit',
  author: 'Neil Fiore',
  blurb: 'A blurb.',
  why_recommended: 'A reason.',
}

test('searchAgent: strips markdown fences from model output', async () => {
  const client = mockClient('```json\n' + JSON.stringify({ books: [validBook] }) + '\n```')
  const books = await runSearchAgent(client, { userQuery: 'procrastination' })
  assert.equal(books.length, 1)
})

test('searchAgent: throws retryable error on non-JSON output', async () => {
  await assert.rejects(
    runSearchAgent(mockClient('not json at all'), { userQuery: 'anything' }),
    (err) => err instanceof SearchAgentError && err.retryable === true
  )
})

test('searchAgent: throws retryable error when books array is missing', async () => {
  await assert.rejects(
    runSearchAgent(mockClient(JSON.stringify({ wrong: 'shape' })), { userQuery: 'anything' }),
    (err) => err instanceof SearchAgentError && err.retryable === true
  )
})

test('searchAgent: wraps API failures in a retryable SearchAgentError', async () => {
  await assert.rejects(
    runSearchAgent(failingClient(), { userQuery: 'anything' }),
    (err) => err instanceof SearchAgentError && err.retryable === true
  )
})

test('searchAgent: uses enriched query from intent when provided', async () => {
  let sentContent = null
  const client = {
    messages: {
      create: async ({ messages }) => {
        sentContent = messages[0].content
        return { content: [{ type: 'text', text: JSON.stringify({ books: [validBook] }) }] }
      },
    },
  }
  await runSearchAgent(client, {
    userQuery: 'raw query',
    intent: { enriched_query: 'the enriched version', topics: [], similar_to: [], constraints: [], mood: null, implicit_genre: null },
  })
  assert.equal(sentContent, 'the enriched version')
})
