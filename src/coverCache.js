const cache = new Map()

export async function getCoverUrl(title, author) {
  const key = `${title}::${author}`
  if (cache.has(key)) return cache.get(key)

  try {
    const params = new URLSearchParams({
      title,
      author,
      limit: '1',
      fields: 'cover_i',
    })
    const res = await fetch(`https://openlibrary.org/search.json?${params}`)
    if (!res.ok) throw new Error('lookup failed')
    const data = await res.json()
    const coverId = data.docs?.[0]?.cover_i
    const url = coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
      : null
    cache.set(key, url)
    return url
  } catch {
    cache.set(key, null)
    return null
  }
}
