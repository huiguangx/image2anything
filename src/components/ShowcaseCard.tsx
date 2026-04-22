import type { ShowcaseItem } from '../types'

interface ShowcaseCardProps {
  item: ShowcaseItem
  onGenerate: (prompt: string) => void
}

export function ShowcaseCard({ item, onGenerate }: ShowcaseCardProps) {
  const canGenerate = Boolean(item.prompt)

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
        {item.description && <p>{item.description}</p>}
        {canGenerate && (
          <button
            className="btn btn-primary"
            onClick={() => onGenerate(item.prompt!)}
          >
            生同款
          </button>
        )}
      </div>
    </div>
  )
}
