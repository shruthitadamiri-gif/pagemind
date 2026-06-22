import { CATEGORIES, PRIMARY_CATEGORY } from '../categories'

export default function SpecialistBadge() {
  const secondary = CATEGORIES.filter((c) => c.label !== PRIMARY_CATEGORY)

  return (
    <div className="specialist-badge">
      <span className="specialist-primary">{PRIMARY_CATEGORY} specialist</span>
      <span className="specialist-divider">·</span>
      <span className="specialist-secondary">{secondary.map((c) => c.label).join(' · ')}</span>
    </div>
  )
}
