import { useState, useEffect, useCallback, useRef } from 'react'
import type { ShowcaseItem } from '../types'

interface ShowcaseGridProps {
  items: ShowcaseItem[]
  onGenerate: (prompt: string) => void
  loading: boolean
}

export function ShowcaseGrid({ items, onGenerate, loading }: ShowcaseGridProps) {
  const [current, setCurrent] = useState(0)
  const [perView, setPerView] = useState(window.innerWidth > 768 ? 3 : 1)
  const paused = useRef(false)
  const total = items.length
  const maxIndex = Math.max(total - perView, 0)

  useEffect(() => {
    const onResize = () => setPerView(window.innerWidth > 768 ? 3 : 1)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (current > maxIndex) setCurrent(maxIndex)
  }, [perView, maxIndex, current])

  const goto = useCallback((i: number) => {
    setCurrent(Math.max(0, Math.min(i, maxIndex)))
  }, [maxIndex])

  useEffect(() => {
    const id = setInterval(() => {
      if (!paused.current) {
        setCurrent(prev => prev >= maxIndex ? 0 : prev + 1)
      }
    }, 4000)
    return () => clearInterval(id)
  }, [maxIndex])

  const slideWidth = 100 / perView

  return (
    <section className="showcase-section">
      <h2>效果展示</h2>
      <p className="section-subtitle">AI 生成的精彩作品，点击「做同款」立即体验</p>

      <div
        className="carousel"
        onMouseEnter={() => { paused.current = true }}
        onMouseLeave={() => { paused.current = false }}
      >
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${current * slideWidth}%)` }}
        >
          {items.map((it, index) => {
            const canGenerate = Boolean(it.prompt)
            const priority = index < 2
            return (
              <div
                key={it.id}
                className="carousel-slide"
                style={{ flex: `0 0 ${slideWidth}%` }}
              >
                <div className="carousel-slide-inner">
                  <img
                    src={it.imageUrl}
                    alt={it.title}
                    loading={priority ? 'eager' : 'lazy'}
                    fetchPriority={priority ? 'high' : 'auto'}
                    decoding="async"
                  />
                  <div className="carousel-caption">
                    <h3>{it.title}</h3>
                    {it.description && <p>{it.description}</p>}
                  </div>
                  {canGenerate && (
                    <button
                      className="btn btn-primary carousel-slide-btn"
                      disabled={loading}
                      onClick={() => onGenerate(it.prompt!)}
                    >
                      {loading ? '生成中...' : '做同款'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <button
          className="carousel-arrow carousel-arrow-left"
          onClick={() => goto(current - 1)}
          aria-label="上一张"
        >
          ‹
        </button>
        <button
          className="carousel-arrow carousel-arrow-right"
          onClick={() => goto(current + 1)}
          aria-label="下一张"
        >
          ›
        </button>

        <div className="carousel-dots">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              className={`carousel-dot${i === current ? ' active' : ''}`}
              onClick={() => goto(i)}
              aria-label={`第 ${i + 1} 位`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
