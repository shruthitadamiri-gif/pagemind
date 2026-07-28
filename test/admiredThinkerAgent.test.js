import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runAdmiredThinkerAgent, AdmiredThinkerAgentError } from '../server/agents/admiredThinkerAgent.js'

function mockClient(finalText, { stopReason = 'end_turn' } = {}) {
  return {
    messages: {
      create: async () => ({
        stop_reason: stopReason,
        content: [{ type: 'text', text: finalText }],
      }),
    },
  }
}

const validResponse = JSON.stringify({
  found: true,
  reason: null,
  narrative: 'They gravitate toward books on identity and power.',
  books: [
    {
      title: 'Homegoing',
      author: 'Yaa Gyasi',
      confidence_tier: 1,
      source_note: 'Year-end favorites list',
      theme: 'identity & power',
      blurb: 'A sweeping multi-generational story.',
      why_recommended: 'Matches their stated interest in legacy and history.',
    },
  ],
})

test('admiredThinkerAgent: parses a found=true response', async () => {
  const result = await runAdmiredThinkerAgent(mockClient(validResponse), {
    personName: 'Trevor Noah',
    personContext: null,
    excludeTitles: [],
  })
  assert.equal(result.found, true)
  assert.equal(result.books.length, 1)
  assert.match(result.narrative, /identity and power/)
})

test('admiredThinkerAgent: handles found=false gracefully', async () => {
  const client = mockClient(JSON.stringify({ found: false, reason: 'No public reading trail.', narrative: null, books: [] }))
  const result = await runAdmiredThinkerAgent(client, { personName: 'A Private Person', excludeTitles: [] })
  assert.equal(result.found, false)
  assert.equal(result.books.length, 0)
  assert.match(result.reason, /No public reading trail/)
})

test('admiredThinkerAgent: strips preamble commentary around the JSON', async () => {
  const withPreamble = `Based on my research, here's what I found:\n${validResponse}\nHope that helps!`
  const result = await runAdmiredThinkerAgent(mockClient(withPreamble), {
    personName: 'Trevor Noah',
    excludeTitles: [],
  })
  assert.equal(result.found, true)
  assert.equal(result.books.length, 1)
})

test('admiredThinkerAgent: throws retryable error on non-JSON output', async () => {
  await assert.rejects(
    runAdmiredThinkerAgent(mockClient('not json'), { personName: 'X', excludeTitles: [] }),
    (err) => err instanceof AdmiredThinkerAgentError && err.retryable === true
  )
})

test('admiredThinkerAgent: resumes once on pause_turn', async () => {
  let calls = 0
  const client = {
    messages: {
      create: async () => {
        calls++
        if (calls === 1) {
          return { stop_reason: 'pause_turn', content: [{ type: 'text', text: '' }] }
        }
        return { stop_reason: 'end_turn', content: [{ type: 'text', text: validResponse }] }
      },
    },
  }
  const result = await runAdmiredThinkerAgent(client, { personName: 'Trevor Noah', excludeTitles: [] })
  assert.equal(result.found, true)
  assert.equal(calls, 2)
})
