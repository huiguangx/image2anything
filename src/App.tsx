import { useState } from 'react'
import { Hero } from './components/Hero'
import { ShowcaseGrid } from './components/ShowcaseGrid'
import { CreatePanel } from './components/CreatePanel'
import { GenerateModal } from './components/GenerateModal'
import { PaymentModal } from './components/PaymentModal'
import { generateImage } from './services/api'
import { checkQuota, consumeQuota } from './services/quota'
import { showcases } from './data/showcases'
import type { GenerateResult } from './types'
import './App.css'

function App() {
  const [showModal, setShowModal] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async (prompt: string) => {
    const hasFree = await checkQuota()
    if (!hasFree) {
      setShowPayment(true)
      return
    }

    setShowModal(true)
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await generateImage({ prompt })
      await consumeQuota()
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    if (loading) return
    setShowModal(false)
    setResult(null)
    setError(null)
  }

  return (
    <div className="app">
      <Hero />
      <CreatePanel onGenerate={handleGenerate} />
      <ShowcaseGrid items={showcases} onGenerate={handleGenerate} />
      <footer className="footer">
        <p>Powered by GPT-Image-2 &middot; Nano Banana AI</p>
      </footer>
      {showModal && (
        <GenerateModal
          loading={loading}
          result={result}
          error={error}
          onClose={handleCloseModal}
        />
      )}
      {showPayment && (
        <PaymentModal onClose={() => setShowPayment(false)} />
      )}
    </div>
  )
}

export default App
