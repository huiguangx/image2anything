import { useEffect, useState } from 'react'
import type { GenerateSlot } from '../types'

interface GenerateModalProps {
  loading: boolean
  slots: GenerateSlot[]
  error: string | null
  onClose: () => void
  onRetry: () => void
}

const SLOT_STATUS_PRIORITY = {
  success: 0,
  loading: 1,
  error: 2,
} as const

export function GenerateModal({ loading, slots, error, onClose, onRetry }: GenerateModalProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const isCapacityIssue = Boolean(error && /资源|再试|排队|紧张/.test(error))
  const orderedSlots = [...slots].sort((left, right) => {
    const statusOffset = SLOT_STATUS_PRIORITY[left.status] - SLOT_STATUS_PRIORITY[right.status]
    if (statusOffset !== 0) {
      return statusOffset
    }

    return (left.finishedAt || Number.MAX_SAFE_INTEGER) - (right.finishedAt || Number.MAX_SAFE_INTEGER)
  })

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

  const successCount = orderedSlots.filter((slot) => slot.status === 'success').length
  const loadingCount = orderedSlots.filter((slot) => slot.status === 'loading').length
  const loadingText =
    successCount > 0 && loadingCount > 0
      ? '已经出一张了，另一张可以稍等'
      : elapsedSeconds < 20
        ? '已经收到您的超绝想法，正在出图中！(๑•̀ㅂ•́)و✧'
        : elapsedSeconds < 60
          ? '请您耐心等待，正在为您出超绝美图 (≧▽≦)♡'
          : '太火爆啦，模型正在努力生成中，请您再耐心等一下喔！(｡•̀ᴗ-)✧'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content generate-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="关闭">
          &times;
        </button>

        {loading && (
          <div className="modal-loading">
            <p className="modal-loading-copy">{loadingText}</p>
          </div>
        )}

        {orderedSlots.length > 0 && (
          <div className="modal-slots">
            {orderedSlots.map((slot, index) => (
              <div key={slot.id} className={`modal-slot modal-slot-${slot.status}`}>
                <div className="modal-slot-header">
                  <span className="modal-slot-title">{slot.title}</span>
                </div>

                {slot.status === 'success' && slot.result ? (
                  <>
                    <img
                      className="modal-slot-image"
                      src={slot.result.imageUrl}
                      alt={`${slot.title} 生成结果`}
                    />
                    <div className="modal-slot-actions">
                      <a
                        href={slot.result.imageUrl}
                        download={`nano-banana-result-${index + 1}.png`}
                        className="btn btn-primary"
                      >
                        下载这张
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="modal-slot-placeholder">
                    {slot.status === 'loading' && (
                      <div className="spinner modal-slot-spinner" aria-label={`${slot.title} 正在出图中`} />
                    )}
                    <p className="modal-slot-copy">
                      {slot.status === 'error'
                        ? '这个模型暂时没能顺利出图，请稍后再试一次'
                        : '模型正在出图中，请稍等一下喔'}
                    </p>
                    {slot.error && <p className="modal-slot-error">{slot.error}</p>}
                  </div>
                )}
              </div>
            ))}
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
      </div>
    </div>
  )
}
