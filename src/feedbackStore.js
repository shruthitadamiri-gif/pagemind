const STORAGE_KEY = 'pagemind_feedback_v1'
const MAX_PER_BUCKET = 8

export function bookKey(book) {
  return `${book.title}::${book.author}`
}

export function getAllFeedback() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function save(all) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // localStorage unavailable (private browsing, quota) — feedback just won't persist.
  }
}

export function getFeedbackFor(book) {
  const all = getAllFeedback()
  return all[bookKey(book)]?.status || null
}

export function setFeedback(book, status) {
  const all = getAllFeedback()
  const key = bookKey(book)

  if (!status) {
    delete all[key]
  } else {
    all[key] = {
      status,
      title: book.title,
      author: book.author,
      updatedAt: Date.now(),
    }
  }

  save(all)
  return all
}

/**
 * Returns raw feedback records for sending to the server.
 * The Taste Agent (server-side) now builds the profile — the client just
 * sends the raw data. This keeps taste profile logic centralized on the server
 * where it can be improved without a client deploy.
 */
export function getFeedbackRecords() {
  const entries = Object.values(getAllFeedback())
  if (entries.length === 0) return []
  return entries.map((e) => ({
    title: e.title,
    author: e.author,
    status: e.status,
  }))
}
