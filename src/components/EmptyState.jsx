import { KIDS_CATEGORY_ID } from '../categories'

const DEFAULT_EXAMPLE_PROMPTS = [
  { prompt: 'Why do smart people make terrible decisions?', categoryId: 'decision-science' },
  { prompt: 'How did geography determine which civilizations won?', categoryId: 'macro-history' },
  { prompt: 'What actually shapes who we become — genes or environment?', categoryId: 'human-nature' },
  { prompt: 'Stories of women who changed history but were written out of it', categoryId: 'women-society' },
]

const KIDS_EXAMPLE_PROMPTS = [
  { prompt: 'Something funny about animals for a 4 year old', categoryId: KIDS_CATEGORY_ID },
  { prompt: 'A bedtime book that actually works', categoryId: KIDS_CATEGORY_ID },
  { prompt: 'A book about big feelings like anger or jealousy', categoryId: KIDS_CATEGORY_ID },
  { prompt: 'Books that come with music like Storybook Orchestra', categoryId: KIDS_CATEGORY_ID },
]

export default function EmptyState({ onPick, domainId }) {
  const examples = domainId === KIDS_CATEGORY_ID ? KIDS_EXAMPLE_PROMPTS : DEFAULT_EXAMPLE_PROMPTS

  return (
    <div className="examples">
      <p className="examples-label">Not sure where to start? Try one of these:</p>
      <div className="example-chips">
        {examples.map(({ prompt, categoryId }) => (
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
