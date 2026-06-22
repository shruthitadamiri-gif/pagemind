import { useMemo, useState } from 'react'
import SearchBar from './components/SearchBar'
import EmptyState from './components/EmptyState'
import BookCard from './components/BookCard'
import CategoryFilter from './components/CategoryFilter'
import GenreToggle from './components/GenreToggle'
import SpecialistBadge from './components/SpecialistBadge'
import { getRecommendations } from './api'

export default function App() {
  const [query, setQuery] = useState('')
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const [genreMode, setGenreMode] = useState('either')

  async function runSearch(prompt, mode = genreMode) {
    setLoading(true)
    setError(null)
    setActiveCategory(null)
    try {
      const results = await getRecommendations(prompt, mode)
      setBooks(results)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setBooks([])
    } finally {
      setLoading(false)
    }
  }

  function handleExamplePick(prompt) {
    setQuery(prompt)
    runSearch(prompt)
  }

  function handleGenreChange(mode) {
    setGenreMode(mode)
    if (query.trim() && books.length > 0) {
      runSearch(query, mode)
    }
  }

  const categories = useMemo(
    () => [...new Set(books.map((b) => b.category).filter(Boolean))],
    [books]
  )

  const visibleBooks = activeCategory
    ? books.filter((b) => b.category === activeCategory)
    : books

  return (
    <div className="app">
      <div className="header">
        <h1>PageMind</h1>
        <p>Tell it what's on your mind. It'll find the book.</p>
        <SpecialistBadge />
      </div>

      <SearchBar
        value={query}
        onChange={setQuery}
        onSubmit={() => runSearch(query)}
        loading={loading}
      />

      <GenreToggle value={genreMode} onChange={handleGenreChange} />

      {error && <div className="error-banner">{error}</div>}

      {!loading && books.length === 0 && !error && (
        <EmptyState onPick={handleExamplePick} />
      )}

      {loading && (
        <div className="loading">
          <div className="spinner" />
          <p>Reading the shelves…</p>
        </div>
      )}

      {!loading && books.length > 0 && (
        <>
          <CategoryFilter
            categories={categories}
            active={activeCategory}
            onChange={setActiveCategory}
          />
          <div className="results-grid">
            {visibleBooks.map((book, i) => (
              <BookCard key={`${book.title}-${i}`} book={book} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
