import { useEffect, useState } from 'react'
import { getCoverUrl } from '../coverCache'

export default function BookCard({ book }) {
  const [coverUrl, setCoverUrl] = useState(null)
  const [coverFailed, setCoverFailed] = useState(false)

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
            {book.category && <span className="category-tag">{book.category}</span>}
          </div>
          <p className="book-author">
            {book.author}
            {book.year ? ` · ${book.year}` : ''}
          </p>
        </div>
      </div>
      <p className="book-blurb">{book.blurb}</p>
      <div className="why-box">
        <p className="why-label">Why this for you</p>
        <p className="why-text">{book.why_recommended}</p>
      </div>
    </div>
  )
}
