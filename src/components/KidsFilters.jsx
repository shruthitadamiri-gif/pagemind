import { KIDS_AGE_BANDS, KIDS_SUB_CATEGORIES } from '../categories'

export default function KidsFilters({
  ageBandId,
  onAgeBandChange,
  subCategoryId,
  onSubCategoryChange,
}) {
  return (
    <div className="kids-filters">
      <p className="category-selector-label">Age band</p>
      <div className="filter-chips">
        {KIDS_AGE_BANDS.map((band) => (
          <button
            key={band.id}
            type="button"
            className={`filter-chip ${ageBandId === band.id ? 'active' : ''}`}
            onClick={() => onAgeBandChange(band.id)}
          >
            {band.label}
          </button>
        ))}
      </div>

      <p className="category-selector-label kids-subcategory-label">
        Sub-category (optional)
      </p>
      <div className="filter-chips">
        <button
          type="button"
          className={`filter-chip ${!subCategoryId ? 'active' : ''}`}
          onClick={() => onSubCategoryChange(null)}
        >
          Any
        </button>
        {KIDS_SUB_CATEGORIES.map((sub) => (
          <button
            key={sub}
            type="button"
            className={`filter-chip ${subCategoryId === sub ? 'active' : ''}`}
            onClick={() => onSubCategoryChange(subCategoryId === sub ? null : sub)}
          >
            {sub}
          </button>
        ))}
      </div>
    </div>
  )
}
