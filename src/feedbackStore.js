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

export function buildTasteProfile() {
  const entries = Object.values(getAllFeedback()).sort((a, b) => a.updatedAt - b.updatedAt)
  if (entries.length === 0) return null

  const fmt = (status) =>
    entries
      .filter((e) => e.status === status)
      .slice(-MAX_PER_BUCKET)
      .map((e) => `"${e.title}" by ${e.author}`)
      .join(', ') || null

  const profile = {
    loved: fmt('loved'),
    notForMe: fmt('not_for_me'),
    wantToRead: fmt('want_to_read'),
  }

  return profile.loved || profile.notForMe || profile.wantToRead ? profile : null
}
