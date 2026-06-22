import { useMemo, useState } from 'react'
import SearchBar from './components/SearchBar'
import EmptyState from './components/EmptyState'
import BookCard from './components/BookCard'
import CategoryFilter from './components/CategoryFilter'
import CategorySelector from './components/CategorySelector'
import GenreToggle from './components/GenreToggle'
import { getRecommendations } from './api'
import { CATEGORIES, GENRE_MODES } from './categories'

export default function App() {
  const [query, setQuery] = useState('')
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const [genreMode, setGenreMode] = useState('either')
  const [domainId, setDomainId] = useState(null)

  async function runSearch(prompt, mode = genreMode, domain = domainId) {
    setLoading(true)
    setError(null)
    setActiveCategory(null)
    try {
      const results = await getRecommendations(prompt, mode, domain)
      setBooks(results)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setBooks([])
    } finally {
      setLoading(false)
    }
  }

  function handleExamplePick(prompt, categoryId = null) {
    setQuery(prompt)
    setDomainId(categoryId)
    runSearch(prompt, genreMode, categoryId)
  }

  function handleGenreChange(mode) {
    setGenreMode(mode)
    if (query.trim() && books.length > 0) {
      runSearch(query, mode, domainId)
    }
  }

  function handleDomainChange(newDomainId) {
    setDomainId(newDomainId)
    if (query.trim() && books.length > 0) {
      runSearch(query, genreMode, newDomainId)
    }
  }

  const categories = useMemo(
    () => [...new Set(books.map((b) => b.category).filter(Boolean))],
    [books]
  )

  const visibleBooks = activeCategory
    ? books.filter((b) => b.category === activeCategory)
    : books

  const domainLabel = domainId
    ? CATEGORIES.find((c) => c.id === domainId)?.label
    : 'All Categories'
  const genreLabel = GENRE_MODES.find((g) => g.id === genreMode)?.label || 'Either'

  return (
    <div className="app">
      <div className="header">
        <h1>PageMind</h1>
        <p>Tell it what's on your mind. It'll find the book.</p>
      </div>

      <SearchBar
        value={query}
        onChange={setQuery}
        onSubmit={() => runSearch(query)}
        loading={loading}
      />

      <div className="refine-controls">
        <p className="refine-label">Refine your search</p>
        <CategorySelector value={domainId} onChange={handleDomainChange} />
        <GenreToggle value={genreMode} onChange={handleGenreChange} />
      </div>

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
          <p className="showing-indicator">
            Showing: {domainLabel} · {genreLabel}
          </p>
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
