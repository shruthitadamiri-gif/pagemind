const EXAMPLE_PROMPTS = [
  'Something that challenges how I think about risk',
  'A book about how tech companies manipulate us',
  'Why smart people make irrational decisions under pressure',
]

export default function EmptyState({ onPick }) {
  return (
    <div className="examples">
      <p className="examples-label">Not sure where to start? Try one of these:</p>
      <div className="example-chips">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button key={prompt} className="example-chip" onClick={() => onPick(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
