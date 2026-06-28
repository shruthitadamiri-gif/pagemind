import Dropdown from './Dropdown'

export default function CategorySelector({ value, onChange, categories }) {
  const selected = value ? categories.find((c) => c.id === value) : null
  const options = [
    { value: null, label: 'All Categories' },
    ...categories.map((category) => ({ value: category.id, label: category.label })),
  ]

  return (
    <div className="category-selector">
      <label className="category-selector-label" htmlFor="domain-select">
        Pick a domain, or let PageMind decide
      </label>
      <Dropdown id="domain-select" value={value} onChange={onChange} options={options} />
      <p className="category-selector-description">
        {selected
          ? selected.description
          : `Specialist across ${categories.length} domains — ${categories.map((c) => c.label).join(', ')}.`}
      </p>
    </div>
  )
}
