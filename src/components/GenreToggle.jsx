import { GENRE_MODES } from '../categories'

export default function GenreToggle({ value, onChange }) {
  return (
    <div className="genre-toggle">
      {GENRE_MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          className={`genre-toggle-option ${value === mode.id ? 'active' : ''}`}
          onClick={() => onChange(mode.id)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}
