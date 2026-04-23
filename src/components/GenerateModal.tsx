import { useEffect, useState } from 'react'
import type { GenerateResult } from '../types'

interface GenerateModalProps {
  loading: boolean
  result: GenerateResult | null
  error: string | null
  onClose: () => void
  onRetry: () => void
}

export function GenerateModal({ loading, result, error, onClose, onRetry }: GenerateModalProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const isCapacityIssue = Boolean(error && /资源|再试|排队|紧张/.test(error))

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
        : '太火爆啦，模型正在排队出图中。如果超过3分钟还没完成，建议您重新试一次喔！(｡•̀ᴗ-)✧'

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
            <p>{isCapacityIssue ? '这会儿模型有点忙，暂时没能顺利出图' : '这次没有成功出图'}</p>
            <p className="modal-error-copy">{error}</p>
            {isCapacityIssue && (
              <p className="modal-error-hint">点一下“再试一次”，系统会重新帮您排队生成～( ´▽` )ﾉ</p>
            )}
            <div className="modal-result-actions">
              <button className="btn btn-primary" onClick={onRetry}>
                再试一次
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                关闭
              </button>
            </div>
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
