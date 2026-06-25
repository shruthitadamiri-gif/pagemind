import { useEffect, useRef, useState } from 'react'

export default function Dropdown({ value, onChange, options, id }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function handleOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const selected = options.find((o) => o.value === value) || options[0]

  return (
    <div className="dropdown" ref={rootRef}>
      <button
        type="button"
        id={id}
        className="dropdown-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selected?.label}</span>
        <span className="dropdown-chevron" aria-hidden="true" />
      </button>
      {open && (
        <ul className="dropdown-panel" role="listbox">
          {options.map((option) => (
            <li key={option.value ?? 'null'} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                className={`dropdown-option ${option.value === value ? 'active' : ''}`}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
