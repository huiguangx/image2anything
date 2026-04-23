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
  const pendingKey = useRef<string | undefined>(undefined)
  const abortRef = useRef<AbortController | null>(null)

  const doGenerate = async (prompt: string, key?: string) => {
    if (loading || abortRef.current) return

    pendingPrompt.current = prompt
    pendingKey.current = key
    setShowPayment(false)
    setShowModal(true)
    setLoading(true)
    setResult(null)
    setError(null)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await generateImage({ prompt }, { signal: controller.signal })
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
      if (controller.signal.aborted) {
        return
      }
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }

  const handleGenerate = async (prompt: string) => {
    if (loading || abortRef.current) return

    pendingPrompt.current = prompt

    const isFree = await checkFree()
    if (isFree) {
      void doGenerate(prompt)
    } else {
      setKeyError(null)
      setShowPayment(true)
    }
  }

  const handleKeySubmit = async (key: string) => {
    if (loading || abortRef.current) return

    setKeyError(null)
    const valid = await validateKey(key)
    if (!valid) {
      setKeyError('密钥无效或已使用')
      return
    }
    void doGenerate(pendingPrompt.current, key)
  }

  const handleRetry = () => {
    if (loading || abortRef.current || !pendingPrompt.current) return
    void doGenerate(pendingPrompt.current, pendingKey.current)
  }

  const handleCloseModal = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setLoading(false)
    setShowModal(false)
    setResult(null)
    setError(null)
  }

  return (
    <div className="app">
      <Hero />
      <ShowcaseGrid items={showcases} onGenerate={handleGenerate} loading={loading} />
      <CreatePanel onGenerate={handleGenerate} loading={loading} />
      <footer className="footer">
        <p>Powered by GPT-Image-2 &middot; Gpt Image 2.0</p>
      </footer>
      <div className="qq-float" aria-label="QQ群号">
        <span className="qq-title">交流群</span>
        <span className="qq-number">792496465</span>
      </div>
      {showModal && (
        <GenerateModal
          loading={loading}
          result={result}
          error={error}
          onClose={handleCloseModal}
          onRetry={handleRetry}
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
