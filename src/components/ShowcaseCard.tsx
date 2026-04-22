import type { ShowcaseItem } from '../types'

interface ShowcaseCardProps {
  item: ShowcaseItem
  onGenerate: (prompt: string) => void
}

export function ShowcaseCard({ item, onGenerate }: ShowcaseCardProps) {
  return (
    <div className="showcase-card showcase-card-featured">
      <div className="showcase-image-wrapper showcase-image-featured">
        <img
          src={item.imageUrl}
          alt={item.title}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="showcase-info showcase-info-featured">
        <span className="showcase-badge">热门模板</span>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <button
          className="btn btn-primary"
          onClick={() => onGenerate(item.prompt)}
        >
          一键生成同款
        </button>
      </div>
    </div>
  )
}
