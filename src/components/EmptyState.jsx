const EXAMPLE_PROMPTS = [
  { prompt: 'Why do smart people make terrible decisions?', categoryId: 'decision-science' },
  { prompt: 'How did geography determine which civilizations won?', categoryId: 'macro-history' },
  { prompt: 'What actually shapes who we become — genes or environment?', categoryId: 'human-nature' },
  { prompt: 'Stories of women who changed history but were written out of it', categoryId: 'women-society' },
]

export default function EmptyState({ onPick }) {
  return (
    <div className="examples">
      <p className="examples-label">Not sure where to start? Try one of these:</p>
      <div className="example-chips">
        {EXAMPLE_PROMPTS.map(({ prompt, categoryId }) => (
          <button
            key={prompt}
            className="example-chip"
            onClick={() => onPick(prompt, categoryId)}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
