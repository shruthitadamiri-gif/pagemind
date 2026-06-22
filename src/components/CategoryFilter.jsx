export default function CategoryFilter({ categories, active, onChange }) {
  return (
    <div className="filter-chips">
      <button
        className={`filter-chip ${active === null ? 'active' : ''}`}
        onClick={() => onChange(null)}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          className={`filter-chip ${active === cat ? 'active' : ''}`}
          onClick={() => onChange(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
