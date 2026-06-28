export default function SearchBar({
  value,
  onChange,
  onSubmit,
  loading,
  placeholder = 'What kind of book are you in the mood for?',
}) {
  return (
    <form
      className="search-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (value.trim() && !loading) onSubmit()
      }}
    >
      <div className="search-input-row">
        <input
          className="search-input"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
        />
        <button className="search-button" type="submit" disabled={loading || !value.trim()}>
          {loading ? 'Thinking…' : 'Find books'}
        </button>
      </div>
    </form>
  )
}
