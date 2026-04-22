import { useState, useRef } from 'react'
import { Hero } from './components/Hero'
import { ShowcaseGrid } from './components/ShowcaseGrid'
import { CreatePanel } from './components/CreatePanel'
import { GenerateModal } from './components/GenerateModal'
import { PaymentModal } from './components/PaymentModal'
import { generateImage } from './services/api'
import { checkFree, consumeFree, validateKey, consumeKey } from './services/quota'
import { showcases } from './data/showcases'
import type { GenerateResult } from './types'
import './App.css'

function App() {
  const [showModal, setShowModal] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [keyError, setKeyError] = useState<string | null>(null)
  const pendingPrompt = useRef<string>('')

  const doGenerate = async (prompt: string, key?: string) => {
    setShowPayment(false)
    setShowModal(true)
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await generateImage({ prompt })
      if (key) {
        const consumed = await consumeKey(key)
        if (!consumed) {
          setError('密钥已被使用，请使用新密钥')
          return
        }
      } else {
        await consumeFree()
      }
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (prompt: string) => {
    pendingPrompt.current = prompt

    const isFree = await checkFree()
    if (isFree) {
      doGenerate(prompt)
    } else {
      setKeyError(null)
      setShowPayment(true)
    }
  }

  const handleKeySubmit = async (key: string) => {
    setKeyError(null)
    const valid = await validateKey(key)
    if (!valid) {
      setKeyError('密钥无效或已使用')
      return
    }
    doGenerate(pendingPrompt.current, key)
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
      <a
        href="https://qm.qq.com/q/792496465"
        target="_blank"
        rel="noopener noreferrer"
        className="qq-float"
        aria-label="加入QQ群"
      >
        <span className="qq-icon">QQ</span>
        <span className="qq-text">交流群</span>
      </a>
      {showModal && (
        <GenerateModal
          loading={loading}
          result={result}
          error={error}
          onClose={handleCloseModal}
        />
      )}
      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onKeySubmit={handleKeySubmit}
          error={keyError}
        />
      )}
    </div>
  )
}

export default App
