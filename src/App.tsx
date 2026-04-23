import { useState, useRef } from 'react'
import { Hero } from './components/Hero'
import { ShowcaseGrid } from './components/ShowcaseGrid'
import { CreatePanel } from './components/CreatePanel'
import { GenerateModal } from './components/GenerateModal'
import { PaymentModal } from './components/PaymentModal'
import { generateImage } from './services/api'
import { checkFree, consumeFree, validateKey, consumeKey } from './services/quota'
import { showcases } from './data/showcases'
import type { GenerateSlot } from './types'
import './App.css'

const GENERATION_PLANS = [
  { id: 'image-1', title: '图1', preferredProviders: ['1024token', 'custom'] },
  { id: 'image-2', title: '图2', preferredProviders: ['1024token', 'custom'] },
] as const

function createLoadingSlots(): GenerateSlot[] {
  return GENERATION_PLANS.map((plan) => ({
    id: plan.id,
    title: plan.title,
    status: 'loading',
  }))
}

function buildFinalError(messages: string[]) {
  const firstMessage = [...new Set(messages.filter(Boolean))][0]
  return firstMessage || '这次没有成功出图，请稍后再试一次'
}

function App() {
  const [showModal, setShowModal] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [loading, setLoading] = useState(false)
  const [slots, setSlots] = useState<GenerateSlot[]>([])
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
    setSlots(createLoadingSlots())
    setError(null)

    const controller = new AbortController()
    abortRef.current = controller
    let completedCount = 0
    let successCount = 0
    const failures: string[] = []
    let quotaPromise: Promise<boolean> | null = null

    const updateSlot = (slotId: string, nextSlot: Partial<GenerateSlot>) => {
      setSlots((currentSlots) =>
        currentSlots.map((slot) => (slot.id === slotId ? { ...slot, ...nextSlot } : slot))
      )
    }

    const consumeQuotaOnce = async () => {
      if (quotaPromise) {
        return quotaPromise
      }

      quotaPromise = (async () => {
        if (key) {
          const consumed = await consumeKey(key)
          if (!consumed) {
            throw new Error('密钥已被使用，请使用新密钥')
          }
          return true
        }

        const consumed = await consumeFree()
        if (!consumed) {
          throw new Error('免费次数扣减失败，请稍后再试')
        }
        return true
      })()

      return quotaPromise
    }

    const finalizeRequest = () => {
      completedCount += 1
      if (completedCount !== GENERATION_PLANS.length || controller.signal.aborted) {
        return
      }

      if (abortRef.current === controller) {
        abortRef.current = null
      }

      if (successCount === 0) {
        setError(buildFinalError(failures))
      }

      setLoading(false)
    }

    try {
      await Promise.allSettled(
        GENERATION_PLANS.map(async (plan) => {
          try {
            const res = await generateImage(
              {
                prompt,
                preferredProviders: [...plan.preferredProviders],
              },
              { signal: controller.signal }
            )

            await consumeQuotaOnce()
            if (controller.signal.aborted) {
              return
            }

            successCount += 1
            setError(null)
            updateSlot(plan.id, {
              status: 'success',
              result: res,
              error: undefined,
              finishedAt: Date.now(),
            })
          } catch (err) {
            if (controller.signal.aborted) {
              return
            }

            const message = err instanceof Error ? err.message : '未知错误'
            failures.push(message)
            updateSlot(plan.id, {
              status: 'error',
              error: message,
              finishedAt: Date.now(),
            })
          } finally {
            finalizeRequest()
          }
        })
      )
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }

  const showRequestError = (message: string) => {
    setShowPayment(false)
    setShowModal(true)
    setLoading(false)
    setSlots([])
    setError(message)
  }

  const handleGenerate = async (prompt: string) => {
    if (loading || abortRef.current) return

    pendingPrompt.current = prompt

    try {
      const isFree = await checkFree()
      if (isFree) {
        void doGenerate(prompt)
      } else {
        setKeyError(null)
        setShowPayment(true)
      }
    } catch (err) {
      showRequestError(err instanceof Error ? err.message : '额度服务暂时不可用，请稍后再试')
    }
  }

  const handleKeySubmit = async (key: string) => {
    if (loading || abortRef.current) return

    setKeyError(null)
    try {
      const valid = await validateKey(key)
      if (!valid) {
        setKeyError('密钥无效或已使用')
        return
      }
      void doGenerate(pendingPrompt.current, key)
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : '密钥校验失败，请稍后再试')
    }
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
    setSlots([])
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
          slots={slots}
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
