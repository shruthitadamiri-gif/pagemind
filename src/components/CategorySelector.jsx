import { CATEGORIES } from '../categories'
import Dropdown from './Dropdown'

const OPTIONS = [
  { value: null, label: 'All Categories' },
  ...CATEGORIES.map((category) => ({ value: category.id, label: category.label })),
]

export default function CategorySelector({ value, onChange }) {
  const selected = value ? CATEGORIES.find((c) => c.id === value) : null

  return (
    <div className="category-selector">
      <label className="category-selector-label" htmlFor="domain-select">
        Pick a domain, or let PageMind decide
      </label>
      <Dropdown id="domain-select" value={value} onChange={onChange} options={OPTIONS} />
      <p className="category-selector-description">
        {selected
          ? selected.description
          : `Specialist across ${CATEGORIES.length} domains — ${CATEGORIES.map((c) => c.label).join(', ')}.`}
      </p>
    </div>
  )
}
