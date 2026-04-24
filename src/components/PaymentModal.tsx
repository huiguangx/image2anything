import { useState } from 'react'

interface PaymentModalProps {
  onClose: () => void
  onKeySubmit: (key: string) => void
  error?: string | null
  credits?: number
}

const STORE_URL = 'https://pay.ldxp.cn/shop/W6P0CQSH'

export function PaymentModal({ onClose, onKeySubmit, error, credits = 0 }: PaymentModalProps) {
  const [key, setKey] = useState('')

  const handleSubmit = () => {
    const trimmed = key.trim()
    if (!trimmed) return
    onKeySubmit(trimmed)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="关闭">
          &times;
        </button>
        <div className="payment-modal">
          <h3>充值账号额度</h3>
          <p>当前账号剩余 {credits} 次。输入密钥后会充值到账号里，之后可直接生成和使用图生图。</p>

          <div className="key-input-group">
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="输入 6 位密钥"
              maxLength={6}
              className="key-input"
            />
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={key.trim().length < 6}
            >
              确认使用
            </button>
          </div>

          {error && <p className="key-error">{error}</p>}

          <div className="payment-divider">
            <span>还没有密钥？</span>
          </div>

          <a
            href={STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            前往购买密钥
          </a>
        </div>
      </div>
    </div>
  )
}
