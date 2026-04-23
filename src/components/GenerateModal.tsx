import { useEffect, useState } from 'react'
import type { GenerateResult } from '../types'

interface GenerateModalProps {
  loading: boolean
  result: GenerateResult | null
  error: string | null
  onClose: () => void
}

export function GenerateModal({ loading, result, error, onClose }: GenerateModalProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!loading) {
      setElapsedSeconds(0)
      return
    }

    const startedAt = Date.now()
    const updateElapsed = () => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }

    updateElapsed()
    const timer = window.setInterval(updateElapsed, 1000)

    return () => window.clearInterval(timer)
  }, [loading])

  const loadingText =
    elapsedSeconds < 20
      ? '已经收到您的超绝想法，正在出图中！(๑•̀ㅂ•́)و✧'
      : elapsedSeconds < 60
        ? '请您耐心等待，正在为您出超绝美图 (≧▽≦)♡'
        : '太火爆啦，真的在生成中，请您耐心等候，最多不会超过2分钟！(｡•̀ᴗ-)✧'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="关闭">
          &times;
        </button>

        {loading && (
          <div className="modal-loading">
            <div className="spinner" />
            <p className="modal-loading-copy">{loadingText}</p>
          </div>
        )}

        {error && (
          <div className="modal-error">
            <p>生成失败：{error}</p>
            <button className="btn btn-secondary" onClick={onClose}>
              关闭
            </button>
          </div>
        )}

        {result && (
          <div className="modal-result">
            <img src={result.imageUrl} alt="AI 生成结果" />
            <div className="modal-result-actions">
              <a
                href={result.imageUrl}
                download="nano-banana-result.png"
                className="btn btn-primary"
              >
                下载图片
              </a>
              <button className="btn btn-secondary" onClick={onClose}>
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
