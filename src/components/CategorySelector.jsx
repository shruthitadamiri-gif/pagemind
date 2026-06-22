import { CATEGORIES } from '../categories'

export default function CategorySelector({ value, onChange }) {
  const selected = value ? CATEGORIES.find((c) => c.id === value) : null

  return (
    <div className="category-selector">
      <p className="category-selector-label">Pick a domain, or let PageMind decide</p>
      <div className="filter-chips">
        <button
          type="button"
          className={`filter-chip ${value === null ? 'active' : ''}`}
          onClick={() => onChange(null)}
        >
          All Categories
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`filter-chip ${value === category.id ? 'active' : ''}`}
            onClick={() => onChange(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>
      <p className="category-selector-description">
        {selected
          ? selected.description
          : `Specialist across ${CATEGORIES.length} domains — ${CATEGORIES.map((c) => c.label).join(', ')}.`}
      </p>
    </div>
  )
}
