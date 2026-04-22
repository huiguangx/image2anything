import type { GenerateResult } from '../types'

interface GenerateModalProps {
  loading: boolean
  result: GenerateResult | null
  error: string | null
  onClose: () => void
}

export function GenerateModal({ loading, result, error, onClose }: GenerateModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="关闭">
          &times;
        </button>

        {loading && (
          <div className="modal-loading">
            <div className="spinner" />
            <p>AI 正在生成中，请稍候...</p>
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
