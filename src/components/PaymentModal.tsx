interface PaymentModalProps {
  onClose: () => void
}

const STORE_URL = import.meta.env.VITE_STORE_URL || ''

export function PaymentModal({ onClose }: PaymentModalProps) {
  const handleGoStore = () => {
    if (STORE_URL) {
      window.open(STORE_URL, '_blank')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="关闭">
          &times;
        </button>
        <div className="payment-modal">
          <h3>免费次数已用完</h3>
          <p>您的 1 次免费体验已使用，前往小店购买更多次数</p>
          {STORE_URL ? (
            <button className="btn btn-primary" onClick={handleGoStore}>
              前往购买
            </button>
          ) : (
            <p className="payment-coming-soon">购买通道即将开放，敬请期待</p>
          )}
        </div>
      </div>
    </div>
  )
}
