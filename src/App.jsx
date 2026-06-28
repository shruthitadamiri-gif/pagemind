import { useMemo, useState } from 'react'
import SearchBar from './components/SearchBar'
import EmptyState from './components/EmptyState'
import BookCard from './components/BookCard'
import CategoryFilter from './components/CategoryFilter'
import CategorySelector from './components/CategorySelector'
import GenreToggle from './components/GenreToggle'
import KidsFilters from './components/KidsFilters'
import ModeToggle from './components/ModeToggle'
import { getRecommendations } from './api'
import {
  CATEGORIES,
  ADULT_CATEGORIES,
  GENRE_MODES,
  KIDS_CATEGORY_ID,
  KIDS_AGE_BANDS,
  KIDS_DEFAULT_AGE_BAND,
} from './categories'
import { getAllFeedback, setFeedback, bookKey, buildTasteProfile } from './feedbackStore'

function loadFeedbackMap() {
  const all = getAllFeedback()
  const map = {}
  Object.entries(all).forEach(([key, entry]) => {
    map[key] = entry.status
  })
  return map
}

export default function App() {
  const [query, setQuery] = useState('')
  const [lastSearchQuery, setLastSearchQuery] = useState('')
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const [mode, setMode] = useState('me')
  const [genreMode, setGenreMode] = useState('either')
  const [domainId, setDomainId] = useState(null)
  const [ageBandId, setAgeBandId] = useState(KIDS_DEFAULT_AGE_BAND)
  const [subCategoryId, setSubCategoryId] = useState(null)
  const [feedbackMap, setFeedbackMap] = useState(loadFeedbackMap)
  const [replacingKeys, setReplacingKeys] = useState([])

  async function runSearch(prompt, overrides = {}) {
    const genre = overrides.mode ?? genreMode
    const domain = overrides.domain ?? domainId
    const ageBand = overrides.ageBand ?? ageBandId
    const subCategory = overrides.subCategory !== undefined ? overrides.subCategory : subCategoryId

    setLastSearchQuery(prompt)
    setLoading(true)
    setError(null)
    setActiveCategory(null)
    try {
      const kidsFilters =
        domain === KIDS_CATEGORY_ID ? { ageBandId: ageBand, subCategoryId: subCategory } : null
      const tasteProfile = buildTasteProfile()
      const results = await getRecommendations(prompt, genre, domain, kidsFilters, tasteProfile)
      setBooks(results)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setBooks([])
    } finally {
      setLoading(false)
    }
  }

  function isExcludedTitle(title, excludeTitles) {
    const normalize = (s) => s.trim().toLowerCase()
    return excludeTitles.some((t) => normalize(t) === normalize(title))
  }

  async function fetchSingleReplacement(kidsFilters, tasteProfile, excludeTitles) {
    const replacements = await getRecommendations(
      lastSearchQuery,
      genreMode,
      domainId,
      kidsFilters,
      tasteProfile,
      excludeTitles,
      1
    )
    return replacements?.[0] || null
  }

  async function replaceBook(book) {
    const key = bookKey(book)
    setReplacingKeys((prev) => [...prev, key])
    try {
      const kidsFilters =
        domainId === KIDS_CATEGORY_ID ? { ageBandId, subCategoryId } : null
      const tasteProfile = buildTasteProfile()
      let excludeTitles = books.map((b) => b.title)
      let replacement = await fetchSingleReplacement(kidsFilters, tasteProfile, excludeTitles)

      // The model occasionally ignores the exclusion list — retry once
      // before giving up, since silently redisplaying a book the reader
      // just rejected would be worse than a thinner result set.
      if (replacement && isExcludedTitle(replacement.title, excludeTitles)) {
        excludeTitles = [...excludeTitles, replacement.title]
        replacement = await fetchSingleReplacement(kidsFilters, tasteProfile, excludeTitles)
      }

      if (replacement && isExcludedTitle(replacement.title, excludeTitles)) {
        setBooks((prev) => prev.filter((b) => bookKey(b) !== key))
      } else if (replacement) {
        setBooks((prev) => prev.map((b) => (bookKey(b) === key ? replacement : b)))
      }
    } catch {
      // Leave the original card in place if the replacement fetch fails —
      // the feedback was already recorded regardless.
    } finally {
      setReplacingKeys((prev) => prev.filter((k) => k !== key))
    }
  }

  function handleFeedback(book, status) {
    const key = bookKey(book)
    const next = feedbackMap[key] === status ? null : status
    setFeedback(book, next)
    setFeedbackMap((prev) => {
      const copy = { ...prev }
      if (next) {
        copy[key] = next
      } else {
        delete copy[key]
      }
      return copy
    })
    if (next === 'not_for_me') {
      replaceBook(book)
    }
  }

  function handleModeChange(newMode) {
    setMode(newMode)
    const domain = newMode === 'kid' ? KIDS_CATEGORY_ID : null
    const ageBand = newMode === 'kid' ? KIDS_DEFAULT_AGE_BAND : ageBandId
    setDomainId(domain)
    if (newMode === 'kid') {
      setAgeBandId(ageBand)
      setSubCategoryId(null)
    }
    if (query.trim() && books.length > 0) {
      runSearch(query, { domain, ageBand, subCategory: newMode === 'kid' ? null : subCategoryId })
    }
  }

  function handleExamplePick(prompt, categoryId = null) {
    setQuery(prompt)
    const domain = mode === 'kid' ? KIDS_CATEGORY_ID : categoryId
    setDomainId(domain)
    runSearch(prompt, { domain, ageBand: ageBandId, subCategory: subCategoryId })
  }

  function handleGenreChange(newGenreMode) {
    setGenreMode(newGenreMode)
    if (query.trim() && books.length > 0) {
      runSearch(query, { mode: newGenreMode })
    }
  }

  function handleDomainChange(newDomainId) {
    setDomainId(newDomainId)
    if (query.trim() && books.length > 0) {
      runSearch(query, { domain: newDomainId })
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

  const isKidsMode = mode === 'kid'
  const domainLabel = domainId
    ? CATEGORIES.find((c) => c.id === domainId)?.label
    : 'All Categories'
  const genreLabel = GENRE_MODES.find((g) => g.id === genreMode)?.label || 'Either'
  const ageBandShortLabel = KIDS_AGE_BANDS.find((b) => b.id === ageBandId)?.shortLabel

  const showingParts = isKidsMode ? ['Kids', ageBandShortLabel] : [domainLabel, genreLabel]
  if (isKidsMode && subCategoryId) showingParts.push(subCategoryId)

  return (
    <div className="app">
      <div className="header">
        <h1>PageMind</h1>
        <p>Tell it what's on your mind. It'll find the book.</p>
      </div>

      <ModeToggle value={mode} onChange={handleModeChange} />

      <SearchBar
        value={query}
        onChange={setQuery}
        onSubmit={() => runSearch(query)}
        loading={loading}
        placeholder={
          isKidsMode
            ? "What's your child into right now?"
            : 'What kind of book are you in the mood for?'
        }
      />

      <div className="refine-controls">
        <p className="refine-label">Refine your search</p>
        {isKidsMode ? (
          <KidsFilters
            ageBandId={ageBandId}
            onAgeBandChange={handleAgeBandChange}
            subCategoryId={subCategoryId}
            onSubCategoryChange={handleSubCategoryChange}
          />
        ) : (
          <>
            <CategorySelector
              value={domainId}
              onChange={handleDomainChange}
              categories={ADULT_CATEGORIES}
            />
            <GenreToggle value={genreMode} onChange={handleGenreChange} />
          </>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!loading && books.length === 0 && !error && (
        <EmptyState onPick={handleExamplePick} mode={mode} />
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
              <BookCard
                key={`${book.title}-${i}`}
                book={book}
                feedback={feedbackMap[bookKey(book)] || null}
                onFeedback={(status) => handleFeedback(book, status)}
                replacing={replacingKeys.includes(bookKey(book))}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
