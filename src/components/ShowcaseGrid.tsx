import { useState } from 'react'
import type { ShowcaseItem } from '../types'
import { ShowcaseCard } from './ShowcaseCard'

interface ShowcaseGridProps {
  items: ShowcaseItem[]
  onGenerate: (prompt: string) => void
}

export function ShowcaseGrid({ items, onGenerate }: ShowcaseGridProps) {
  const [index, setIndex] = useState(0)

  const prev = () => setIndex((current) => (current - 1 + items.length) % items.length)
  const next = () => setIndex((current) => (current + 1) % items.length)

  return (
    <section className="showcase-section">
      <div className="showcase-header">
        <div>
          <h2>热门效果展示</h2>
          <p className="section-subtitle">看效果，挑风格，点一下就能生成同款</p>
        </div>
        <div className="carousel-actions">
          <button className="carousel-btn" onClick={prev} aria-label="上一张">
            ←
          </button>
          <button className="carousel-btn" onClick={next} aria-label="下一张">
            →
          </button>
        </div>
      </div>

      <div className="showcase-carousel">
        <div
          className="showcase-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {items.map((item) => (
            <div className="showcase-slide" key={item.id}>
              <ShowcaseCard item={item} onGenerate={onGenerate} />
            </div>
          ))}
        </div>
      </div>

      <div className="carousel-dots">
        {items.map((item, dotIndex) => (
          <button
            key={item.id}
            className={`carousel-dot${dotIndex === index ? ' active' : ''}`}
            onClick={() => setIndex(dotIndex)}
            aria-label={`切换到第 ${dotIndex + 1} 张`}
          />
        ))}
      </div>
    </section>
  )
}
