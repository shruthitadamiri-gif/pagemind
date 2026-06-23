import { CATEGORIES } from '../categories'

export default function CategorySelector({ value, onChange }) {
  const selected = value ? CATEGORIES.find((c) => c.id === value) : null

  return (
    <div className="category-selector">
      <label className="category-selector-label" htmlFor="domain-select">
        Pick a domain, or let PageMind decide
      </label>
      <select
        id="domain-select"
        className="dropdown-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((category) => (
          <option key={category.id} value={category.id}>
            {category.label}
          </option>
        ))}
      </select>
      <p className="category-selector-description">
        {selected
          ? selected.description
          : `Specialist across ${CATEGORIES.length} domains — ${CATEGORIES.map((c) => c.label).join(', ')}.`}
      </p>
    </div>
  )
}
