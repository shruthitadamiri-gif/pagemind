export default function ModeToggle({ value, onChange }) {
  return (
    <div className="mode-toggle">
      <button
        type="button"
        className={`mode-toggle-option ${value === 'me' ? 'active' : ''}`}
        onClick={() => onChange('me')}
      >
        For Me
      </button>
      <button
        type="button"
        className={`mode-toggle-option ${value === 'kid' ? 'active' : ''}`}
        onClick={() => onChange('kid')}
      >
        For My Kid
      </button>
    </div>
  )
}
