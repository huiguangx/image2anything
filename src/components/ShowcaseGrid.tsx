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
      <p className="section-subtitle">向右滑动查看更多，点击「做同款」即可生成</p>
      <div className="showcase-carousel">
        {items.map((item) => (
          <ShowcaseCard key={item.id} item={item} onGenerate={onGenerate} disabled={disabled} />
        ))}
      </div>
    </section>
  )
}
