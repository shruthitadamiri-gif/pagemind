export async function getRecommendations(userPrompt, genreMode = 'either', categoryId = null) {
  const res = await fetch('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: userPrompt, genreMode, categoryId }),
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(data?.error || 'Something went wrong. Please try again.')
  }

  if (!data?.books || !Array.isArray(data.books)) {
    throw new Error('Unexpected response shape from server.')
  }

  return data.books
}
