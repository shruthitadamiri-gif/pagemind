import { CATEGORIES } from '../categories'

export default function CategorySelector({ value, onChange }) {
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
    </div>
  )
}
