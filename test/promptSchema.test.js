/**
 * Schema consistency tests.
 *
 * These exist because of a real bug: the search agent's validator once
 * checked for fields (`why`, `summary`) that the system prompt never asked
 * Claude to produce (`why_recommended`, `blurb`) — so every search failed.
 *
 * These tests pin the contract: the field names the prompt requests must be
 * the field names the validator accepts and the UI renders.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSystemPrompt, KIDS_CATEGORY_ID } from '../src/categories.js'
import { runSearchAgent } from '../server/agents/searchAgent.js'

// A minimal mock Anthropic client that returns whatever text we give it
function mockClient(responseText) {
  return {
    messages: {
      create: async () => ({
        content: [{ type: 'text', text: responseText }],
      }),
    },
  }
}

test('standard prompt asks for the fields the validator checks', () => {
  const prompt = buildSystemPrompt('either', null, {}, null, [], null)
  assert.match(prompt, /"blurb"/, 'prompt must request a blurb field')
  assert.match(prompt, /"why_recommended"/, 'prompt must request a why_recommended field')
  assert.match(prompt, /"title"/, 'prompt must request a title field')
  assert.match(prompt, /"author"/, 'prompt must request an author field')
})

test('kids prompt asks for the fields the validator checks', () => {
  const prompt = buildSystemPrompt('either', KIDS_CATEGORY_ID, { ageBandId: '4-5' }, null, [], null)
  assert.match(prompt, /"blurb"/)
  assert.match(prompt, /"why_recommended"/)
  assert.match(prompt, /"read_aloud_rating"/)
  assert.match(prompt, /"includes_music"/)
})

test('a book shaped exactly as the prompt requests passes the validator end-to-end', async () => {
  const bookFromPrompt = {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    year: '2011',
    category: 'Decision Science',
    blurb: 'The founding text of how your brain fools you.',
    why_recommended: 'Directly answers your question about irrational choices.',
  }
  const client = mockClient(JSON.stringify({ books: [bookFromPrompt] }))
  const books = await runSearchAgent(client, { userQuery: 'why do people make bad choices' })
  assert.equal(books.length, 1, 'a prompt-shaped book must survive validation')
  assert.equal(books[0].title, 'Thinking, Fast and Slow')
})

test('books missing required fields are filtered out', async () => {
  const client = mockClient(
    JSON.stringify({
      books: [
        { title: 'Valid', author: 'A', blurb: 'b', why_recommended: 'w' },
        { title: 'No blurb', author: 'A', why_recommended: 'w' },
        { title: '', author: 'A', blurb: 'b', why_recommended: 'w' },
      ],
    })
  )
  const books = await runSearchAgent(client, { userQuery: 'anything' })
  assert.equal(books.length, 1)
  assert.equal(books[0].title, 'Valid')
})
