import type { ShowcaseItem } from '../types'
import { ShowcaseCard } from './ShowcaseCard'

interface ShowcaseGridProps {
  items: ShowcaseItem[]
  onGenerate: (prompt: string) => void
  disabled?: boolean
}

export function ShowcaseGrid({ items, onGenerate, disabled }: ShowcaseGridProps) {
  return (
    <section className="showcase-section">
      <h2>效果展示</h2>
      <p className="section-subtitle">点击「生同款」即可生成类似效果</p>
      <div className="showcase-grid">
        {items.map((item) => (
          <ShowcaseCard key={item.id} item={item} onGenerate={onGenerate} disabled={disabled} />
        ))}
      </div>
    </section>
  )
}
