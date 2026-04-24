import { useState } from 'react'

interface AccountModalProps {
  onClose: () => void
  onSubmit: (profileName: string) => void
  error?: string | null
  title?: string
  subtitle?: string
}

export function AccountModal({ onClose, onSubmit, error, title = '创建账号', subtitle = '注册后可使用图生图、密钥充值和任务记录' }: AccountModalProps) {
  const [profileName, setProfileName] = useState('')

  const handleSubmit = () => {
    const trimmed = profileName.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="关闭">
          &times;
        </button>
        <div className="payment-modal">
          <h3>{title}</h3>
          <p>{subtitle}</p>
          <div className="key-input-group">
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="输入账号名称"
              maxLength={20}
              className="key-input"
            />
            <button className="btn btn-primary" onClick={handleSubmit} disabled={!profileName.trim()}>
              继续
            </button>
          </div>
          {error && <p className="key-error">{error}</p>}
        </div>
      </div>
    </div>
  )
}
