import { KIDS_AGE_BANDS, KIDS_SUB_CATEGORIES } from '../categories'

export default function KidsFilters({
  ageBandId,
  onAgeBandChange,
  subCategoryId,
  onSubCategoryChange,
}) {
  return (
    <div className="kids-filters">
      <label className="category-selector-label" htmlFor="age-band-select">
        Age band
      </label>
      <select
        id="age-band-select"
        className="dropdown-select"
        value={ageBandId}
        onChange={(e) => onAgeBandChange(e.target.value)}
      >
        {KIDS_AGE_BANDS.map((band) => (
          <option key={band.id} value={band.id}>
            {band.label}
          </option>
        ))}
      </select>

      <label
        className="category-selector-label kids-subcategory-label"
        htmlFor="sub-category-select"
      >
        Theme (optional)
      </label>
      <select
        id="sub-category-select"
        className="dropdown-select"
        value={subCategoryId || ''}
        onChange={(e) => onSubCategoryChange(e.target.value || null)}
      >
        <option value="">Any</option>
        {KIDS_SUB_CATEGORIES.map((sub) => (
          <option key={sub} value={sub}>
            {sub}
          </option>
        ))}
      </select>
    </div>
  )
}
