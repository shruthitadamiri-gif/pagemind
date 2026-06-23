import { useMemo, useState } from 'react'
import SearchBar from './components/SearchBar'
import EmptyState from './components/EmptyState'
import BookCard from './components/BookCard'
import CategoryFilter from './components/CategoryFilter'
import CategorySelector from './components/CategorySelector'
import GenreToggle from './components/GenreToggle'
import KidsFilters from './components/KidsFilters'
import { getRecommendations } from './api'
import {
  CATEGORIES,
  GENRE_MODES,
  KIDS_CATEGORY_ID,
  KIDS_AGE_BANDS,
  KIDS_DEFAULT_AGE_BAND,
} from './categories'

export default function App() {
  const [query, setQuery] = useState('')
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const [genreMode, setGenreMode] = useState('either')
  const [domainId, setDomainId] = useState(null)
  const [ageBandId, setAgeBandId] = useState(KIDS_DEFAULT_AGE_BAND)
  const [subCategoryId, setSubCategoryId] = useState(null)

  async function runSearch(prompt, overrides = {}) {
    const mode = overrides.mode ?? genreMode
    const domain = overrides.domain ?? domainId
    const ageBand = overrides.ageBand ?? ageBandId
    const subCategory = overrides.subCategory !== undefined ? overrides.subCategory : subCategoryId

    setLoading(true)
    setError(null)
    setActiveCategory(null)
    try {
      const kidsFilters =
        domain === KIDS_CATEGORY_ID ? { ageBandId: ageBand, subCategoryId: subCategory } : null
      const results = await getRecommendations(prompt, mode, domain, kidsFilters)
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
    const enteringKids = categoryId === KIDS_CATEGORY_ID
    const ageBand = enteringKids ? KIDS_DEFAULT_AGE_BAND : ageBandId
    const subCategory = enteringKids ? null : subCategoryId
    if (enteringKids) {
      setAgeBandId(ageBand)
      setSubCategoryId(subCategory)
    }
    runSearch(prompt, { domain: categoryId, ageBand, subCategory })
  }

  function handleGenreChange(mode) {
    setGenreMode(mode)
    if (query.trim() && books.length > 0) {
      runSearch(query, { mode })
    }
  }

  function handleDomainChange(newDomainId) {
    const enteringKids = newDomainId === KIDS_CATEGORY_ID && domainId !== KIDS_CATEGORY_ID
    const ageBand = enteringKids ? KIDS_DEFAULT_AGE_BAND : ageBandId
    const subCategory = enteringKids ? null : subCategoryId

    setDomainId(newDomainId)
    if (enteringKids) {
      setAgeBandId(ageBand)
      setSubCategoryId(subCategory)
    }
    if (query.trim() && books.length > 0) {
      runSearch(query, { domain: newDomainId, ageBand, subCategory })
    }
  }

  function handleAgeBandChange(newAgeBandId) {
    setAgeBandId(newAgeBandId)
    if (query.trim() && books.length > 0) {
      runSearch(query, { ageBand: newAgeBandId })
    }
  }

  function handleSubCategoryChange(newSubCategoryId) {
    setSubCategoryId(newSubCategoryId)
    if (query.trim() && books.length > 0) {
      runSearch(query, { subCategory: newSubCategoryId })
    }
  }

  const categories = useMemo(
    () => [...new Set(books.map((b) => b.category).filter(Boolean))],
    [books]
  )

  const visibleBooks = activeCategory
    ? books.filter((b) => b.category === activeCategory)
    : books

  const isKidsDomain = domainId === KIDS_CATEGORY_ID
  const domainLabel = domainId
    ? CATEGORIES.find((c) => c.id === domainId)?.label
    : 'All Categories'
  const genreLabel = GENRE_MODES.find((g) => g.id === genreMode)?.label || 'Either'
  const ageBandShortLabel = KIDS_AGE_BANDS.find((b) => b.id === ageBandId)?.shortLabel

  const showingParts = [domainLabel]
  if (isKidsDomain) {
    showingParts.push(ageBandShortLabel)
    if (subCategoryId) showingParts.push(subCategoryId)
  } else {
    showingParts.push(genreLabel)
  }

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
        {isKidsDomain && (
          <KidsFilters
            ageBandId={ageBandId}
            onAgeBandChange={handleAgeBandChange}
            subCategoryId={subCategoryId}
            onSubCategoryChange={handleSubCategoryChange}
          />
        )}
        <GenreToggle value={genreMode} onChange={handleGenreChange} />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!loading && books.length === 0 && !error && (
        <EmptyState onPick={handleExamplePick} domainId={domainId} />
      )}

      {loading && (
        <div className="loading">
          <div className="spinner" />
          <p>Reading the shelves…</p>
        </div>
      )}

      {!loading && books.length > 0 && (
        <>
          <p className="showing-indicator">Showing: {showingParts.join(' · ')}</p>
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
