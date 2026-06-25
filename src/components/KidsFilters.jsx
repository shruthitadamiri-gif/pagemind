import { KIDS_AGE_BANDS, KIDS_SUB_CATEGORIES } from '../categories'
import Dropdown from './Dropdown'

const AGE_BAND_OPTIONS = KIDS_AGE_BANDS.map((band) => ({ value: band.id, label: band.label }))

const SUB_CATEGORY_OPTIONS = [
  { value: null, label: 'Any' },
  ...KIDS_SUB_CATEGORIES.map((sub) => ({ value: sub, label: sub })),
]

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
      <Dropdown
        id="age-band-select"
        value={ageBandId}
        onChange={onAgeBandChange}
        options={AGE_BAND_OPTIONS}
      />

      <label
        className="category-selector-label kids-subcategory-label"
        htmlFor="sub-category-select"
      >
        Theme (optional)
      </label>
      <Dropdown
        id="sub-category-select"
        value={subCategoryId}
        onChange={onSubCategoryChange}
        options={SUB_CATEGORY_OPTIONS}
      />
    </div>
  )
}
