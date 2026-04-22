import type { ShowcaseItem } from '../types'

interface ShowcaseCardProps {
  item: ShowcaseItem
  onGenerate: (prompt: string) => void
  disabled?: boolean
}

export function ShowcaseCard({ item, onGenerate, disabled }: ShowcaseCardProps) {
  return (
    <div className="showcase-card">
      <div className="showcase-image-wrapper">
        <img
          src={item.imageUrl}
          alt={item.title}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="showcase-info">
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <button
          className="btn btn-primary"
          onClick={() => onGenerate(item.prompt)}
          disabled={disabled}
        >
          {disabled ? '处理中...' : '生同款'}
        </button>
      </div>
    </div>
  )
}
