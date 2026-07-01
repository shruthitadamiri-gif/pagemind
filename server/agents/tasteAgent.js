/**
 * Taste Agent
 *
 * Responsibility: transform raw feedback records into a structured taste profile
 * that the Search Agent can embed in its system prompt.
 *
 * Input contract:  FeedbackRecord[]
 * Output contract: TasteProfile | null
 *
 * This agent does NOT call Claude — it's pure logic. That's fine.
 * Not every agent needs an LLM. Use one only when the task requires
 * understanding or generation that rules-based code can't do.
 */

// ---------------------------------------------------------------------------
// Input type (what this agent expects to receive)
// ---------------------------------------------------------------------------
//
// FeedbackRecord {
//   title:  string   — book title
//   author: string   — book author
//   status: 'loved' | 'want_to_read' | 'not_for_me'
// }

// ---------------------------------------------------------------------------
// Output type (what this agent guarantees to return)
// ---------------------------------------------------------------------------
//
// TasteProfile {
//   loved:      string | null  — comma-separated "Title by Author" for loved books
//   wantToRead: string | null  — comma-separated for want-to-read books
//   notForMe:   string | null  — comma-separated for rejected books
// } | null  (null when no feedback exists)

const MAX_BOOKS_PER_BUCKET = 10
const MAX_FIELD_LENGTH = 1500

/**
 * Formats a list of feedback records into a readable string for the system prompt.
 * e.g. ["Thinking Fast and Slow by Kahneman", "Sapiens by Harari"]
 */
function formatBucket(records) {
  if (!records.length) return null
  const text = records
    .slice(0, MAX_BOOKS_PER_BUCKET)
    .map((r) => `${r.title} by ${r.author}`)
    .join(', ')
  return text.slice(0, MAX_FIELD_LENGTH) || null
}

/**
 * Validates that a single feedback record has the shape we expect.
 * Returns true if valid, false if malformed. We drop malformed records
 * rather than throwing — partial data is better than no data.
 */
function isValidRecord(record) {
  return (
    record &&
    typeof record.title === 'string' &&
    record.title.trim() &&
    typeof record.author === 'string' &&
    record.author.trim() &&
    ['loved', 'want_to_read', 'not_for_me'].includes(record.status)
  )
}

/**
 * Main agent function.
 *
 * @param {FeedbackRecord[]} feedbackRecords - raw feedback from the client
 * @returns {TasteProfile | null}
 */
export function runTasteAgent(feedbackRecords) {
  // Guard: if nothing was passed or it's not an array, return null cleanly.
  // Agents should never throw on bad input — they return null/empty and let
  // the orchestrator decide whether to proceed without taste data.
  if (!Array.isArray(feedbackRecords) || feedbackRecords.length === 0) {
    return null
  }

  // Validate and group by status
  const valid = feedbackRecords.filter(isValidRecord)

  const loved = valid.filter((r) => r.status === 'loved')
  const wantToRead = valid.filter((r) => r.status === 'want_to_read')
  const notForMe = valid.filter((r) => r.status === 'not_for_me')

  // If nothing valid, return null (no taste data to offer)
  if (!loved.length && !wantToRead.length && !notForMe.length) {
    return null
  }

  return {
    loved: formatBucket(loved),
    wantToRead: formatBucket(wantToRead),
    notForMe: formatBucket(notForMe),
  }
}
