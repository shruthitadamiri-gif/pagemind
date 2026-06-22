import { CATEGORIES, PRIMARY_CATEGORY } from '../categories'

export default function SpecialistBadge() {
  const secondary = CATEGORIES.filter((c) => c !== PRIMARY_CATEGORY)

  return (
    <div className="specialist-badge">
      <span className="specialist-primary">{PRIMARY_CATEGORY} specialist</span>
      <span className="specialist-divider">·</span>
      <span className="specialist-secondary">{secondary.join(' · ')}</span>
    </div>
  )
}
