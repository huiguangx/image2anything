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
        {canGenerate && (
          <div className="showcase-overlay">
            <button
              className="btn btn-primary generate-same-btn"
              onClick={() => onGenerate(item.prompt!)}
            >
              做同款
            </button>
          </div>
        )}
      </div>
      <div className="showcase-info">
        <h3>{item.title}</h3>
        {item.description && <p>{item.description}</p>}
      </div>
    </div>
  )
}
