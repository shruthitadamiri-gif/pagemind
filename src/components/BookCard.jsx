import { useEffect, useState } from 'react'
import { getCoverUrl } from '../coverCache'

export default function BookCard({ book }) {
  const [coverUrl, setCoverUrl] = useState(null)
  const [coverFailed, setCoverFailed] = useState(false)
  const isKids = Boolean(book.age_band)

  useEffect(() => {
    let cancelled = false
    setCoverUrl(null)
    setCoverFailed(false)
    getCoverUrl(book.title, book.author).then((url) => {
      if (!cancelled) {
        if (url) setCoverUrl(url)
        else setCoverFailed(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [book.title, book.author])

  return (
    <div className="book-card">
      <div className="book-card-top">
        <div className="book-cover">
          {coverUrl && !coverFailed ? (
            <img
              src={coverUrl}
              alt={`Cover of ${book.title}`}
              onError={() => setCoverFailed(true)}
            />
          ) : (
            <div className="book-cover-placeholder">
              {book.title?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div className="book-card-info">
          <div className="book-card-top-row">
            <h3 className="book-title">{book.title}</h3>
            <div className="book-tags">
              {book.category && <span className="category-tag">{book.category}</span>}
              {isKids && book.age_band && (
                <span className="category-tag age-band-tag">{book.age_band}</span>
              )}
            </div>
          </div>
          <p className="book-author">
            {book.author}
            {book.year ? ` · ${book.year}` : ''}
          </p>
          {isKids && book.illustrator && (
            <p className="book-illustrator">Illustrated by {book.illustrator}</p>
          )}
        </div>
      </div>
      <p className="book-blurb">{book.blurb}</p>
      {isKids && (
        <div className="kids-meta">
          {book.read_aloud_rating && (
            <span className="read-aloud-rating" title="Read-aloud rating">
              {book.read_aloud_rating}
            </span>
          )}
          {book.library_availability && (
            <span
              className={`library-badge ${
                book.library_availability === 'Likely at library' ? 'available' : 'check'
              }`}
            >
              {book.library_availability}
            </span>
          )}
          {book.includes_music && (
            <span className="music-badge" title="Includes music">
              🎵 Music
            </span>
          )}
        </div>
      )}
      <div className="why-box">
        <p className="why-label">Why this for you</p>
        <p className="why-text">{book.why_recommended}</p>
      </div>
    </div>
  )
}
