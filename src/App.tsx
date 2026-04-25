import { useEffect, useRef, useState } from 'react'
import { Hero } from './components/Hero'
import { ShowcaseGrid } from './components/ShowcaseGrid'
import { CreatePanel } from './components/CreatePanel'
import { GenerateModal } from './components/GenerateModal'
import { PaymentModal } from './components/PaymentModal'
import { AccountModal } from './components/AccountModal'
import { generateImage } from './services/api'
import { checkFree, consumeCredit, consumeFree, consumeKey, getQuotaStatus, validateKey } from './services/quota'
import { ensureSession, fetchUserJobs, registerAccount } from './services/session'
import { showcases } from './data/showcases'
import type { BackgroundGenerationState, GenerateSlot, SessionUser } from './types'
import './App.css'

const GENERATION_PLANS = [
  { id: 'image-1', title: '图1', preferredProviders: ['1024token', 'custom'] },
  { id: 'image-2', title: '图2', preferredProviders: ['1024token', 'custom'] },
] as const

type AccessMode = 'free' | 'credit'
type PendingAction = 'generate' | 'image'

const BACKGROUND_CLOSE_THRESHOLD_MS = 90_000

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

function buildUserLabel(user: SessionUser | null) {
  if (!user) return ''
  if (user.role === 'account') {
    return `当前账号：${user.profileName || user.id}`
  }
  return '当前为游客模式'
}

function buildCreditText(user: SessionUser | null) {
  if (!user) return ''
  if (user.role === 'account') {
    return `账号剩余 ${user.credits} 次，可直接生成和图生图`
  }
  return '游客可免费文生图 2 次，图生图和付费阶段需要注册'
}

function buildBackgroundToast(slots: GenerateSlot[]) {
  const successCount = slots.filter((slot) => slot.status === 'success').length
  const loadingCount = slots.filter((slot) => slot.status === 'loading').length
  const errorCount = slots.filter((slot) => slot.status === 'error').length

  if (loadingCount > 0) {
    return {
      title: successCount > 0 ? `已出 ${successCount}/2 张，另一张还在生成` : '图片仍在生成中',
      copy: '点这里继续查看结果',
    }
  }

  if (successCount > 0) {
    return {
      title: `已完成 ${successCount}/2 张`,
      copy: errorCount > 0 ? '有部分结果失败，点这里查看详情' : '点这里查看和下载结果',
    }
  }

  return {
    title: '这次生成没有成功',
    copy: '点这里查看失败原因',
  }
}

function App() {
  const [showModal, setShowModal] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [loading, setLoading] = useState(false)
  const [slots, setSlots] = useState<GenerateSlot[]>([])
  const [error, setError] = useState<string | null>(null)
  const [keyError, setKeyError] = useState<string | null>(null)
  const [accountError, setAccountError] = useState<string | null>(null)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [backgroundGeneration, setBackgroundGeneration] = useState<BackgroundGenerationState | null>(null)
  const [requestStartedAt, setRequestStartedAt] = useState<number | null>(null)
  const [backgroundCloseReady, setBackgroundCloseReady] = useState(false)
  const pendingPrompt = useRef<string>('')
  const pendingImage = useRef<string | undefined>(undefined)
  const pendingMode = useRef<AccessMode>('free')
  const pendingAction = useRef<PendingAction>('generate')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      try {
        const nextUser = await ensureSession()
        if (!active) return
        setUser(nextUser)
        if (nextUser?.id) {
          void getQuotaStatus(nextUser.id).catch(() => undefined)
          if (nextUser.role === 'account') {
            void fetchUserJobs(nextUser.id).catch(() => [])
          }
        }
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : '初始化会话失败，请刷新重试')
      } finally {
        if (active) {
          setInitializing(false)
        }
      }
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!backgroundGeneration) {
      return
    }

    setBackgroundGeneration((current) => (current ? { ...current, slots } : current))
  }, [slots])

  const doGenerate = async (prompt: string, mode: AccessMode, image?: string) => {
    if (loading || abortRef.current || !user) return

    pendingPrompt.current = prompt
    pendingImage.current = image
    pendingMode.current = mode
    setShowPayment(false)
    setShowAccount(false)
    setShowModal(true)
    setLoading(true)
    setSlots(createLoadingSlots())
    setError(null)
    setBackgroundGeneration(null)
    setRequestStartedAt(Date.now())
    setBackgroundCloseReady(false)

    const controller = new AbortController()
    abortRef.current = controller
    let completedCount = 0
    let successCount = 0
    const failures: string[] = []
    let quotaPromise: Promise<void> | null = null

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
        if (mode === 'credit') {
          const nextCredits = await consumeCredit(user.id)
          setUser((current) => (current ? { ...current, credits: nextCredits } : current))
          return
        }

        const consumed = await consumeFree(user.id)
        if (!consumed) {
          throw new Error('免费次数扣减失败，请稍后再试')
        }
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
            await consumeQuotaOnce()
            if (controller.signal.aborted) {
              return
            }

            const res = await generateImage(
              {
                prompt,
                image,
                userId: user.id,
                preferredProviders: [...plan.preferredProviders],
              },
              { signal: controller.signal }
            )
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
        setRequestStartedAt(null)
        setBackgroundCloseReady(false)
      }
    }
  }

  const showRequestError = (message: string) => {
    setShowPayment(false)
    setShowAccount(false)
    setShowModal(true)
    setLoading(false)
    setSlots([])
    setError(message)
  }

  const handleGenerate = async (prompt: string, image?: string) => {
    if (loading || abortRef.current || initializing || !user) return

    pendingPrompt.current = prompt
    pendingImage.current = image
    pendingAction.current = image ? 'image' : 'generate'

    try {
      if (image) {
        if (user.role !== 'account') {
          setAccountError(null)
          setShowAccount(true)
          return
        }

        if (user.credits <= 0) {
          setKeyError(null)
          setShowPayment(true)
          return
        }

        void doGenerate(prompt, 'credit', image)
        return
      }

      const isFree = await checkFree(user.id)
      if (isFree) {
        void doGenerate(prompt, 'free')
        return
      }

      if (user.role !== 'account') {
        setAccountError(null)
        setShowAccount(true)
        return
      }

      if (user.credits <= 0) {
        setKeyError(null)
        setShowPayment(true)
        return
      }

      void doGenerate(prompt, 'credit')
    } catch (err) {
      showRequestError(err instanceof Error ? err.message : '额度服务暂时不可用，请稍后再试')
    }
  }

  const handleRegisterSubmit = async (profileName: string) => {
    if (!user) return

    setAccountError(null)
    try {
      const nextUser = await registerAccount(profileName, user.id)
      setUser(nextUser)
      setShowAccount(false)

      if (pendingAction.current === 'image') {
        if (nextUser.credits > 0) {
          void doGenerate(pendingPrompt.current, 'credit', pendingImage.current)
        } else {
          setShowPayment(true)
        }
        return
      }

      if (nextUser.credits > 0) {
        void doGenerate(pendingPrompt.current, 'credit', pendingImage.current)
      } else {
        setShowPayment(true)
      }
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : '创建账号失败，请稍后再试')
    }
  }

  const handleKeySubmit = async (key: string) => {
    if (loading || abortRef.current || !user) return

    setKeyError(null)
    try {
      const valid = await validateKey(key, user.id)
      if (!valid) {
        setKeyError('密钥无效或已使用')
        return
      }

      const consumed = await consumeKey(key, user.id)
      if (!consumed) {
        setKeyError('密钥充值失败，请稍后再试')
        return
      }

      const status = await getQuotaStatus(user.id)
      const nextUser = status.user as SessionUser | undefined
      if (nextUser) {
        setUser(nextUser)
      }
      setShowPayment(false)

      if ((nextUser?.credits || 0) > 0) {
        void doGenerate(pendingPrompt.current, 'credit', pendingImage.current)
      }
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : '密钥校验失败，请稍后再试')
    }
  }

  const handleRetry = () => {
    if (loading || abortRef.current || !pendingPrompt.current) return
    void doGenerate(pendingPrompt.current, pendingMode.current, pendingImage.current)
  }

  const handleCloseModal = () => {
    if (loading && backgroundCloseReady) {
      setBackgroundGeneration({
        prompt: pendingPrompt.current,
        image: pendingImage.current,
        slots,
        startedAt: requestStartedAt || Date.now(),
      })
      setShowModal(false)
      setError(null)
      return
    }

    abortRef.current?.abort()
    abortRef.current = null
    setLoading(false)
    setShowModal(false)
    setSlots([])
    setError(null)
    setRequestStartedAt(null)
    setBackgroundCloseReady(false)
  }

  return (
    <div className="app">
      <Hero />
      <ShowcaseGrid items={showcases} onGenerate={(prompt) => void handleGenerate(prompt)} loading={loading || initializing} />
      <CreatePanel
        onGenerate={handleGenerate}
        loading={loading || initializing}
        userLabel={buildUserLabel(user)}
        creditText={buildCreditText(user)}
      />
      <footer className="footer">
        <p>Powered by GPT-Image-2 &middot; Gpt Image 2.0</p>
      </footer>
      <a
        className="about-float"
        href="https://space.bilibili.com/3105089?spm_id_from=333.1007.0.0"
        target="_blank"
        rel="noreferrer"
        aria-label="关于我：以太与弦"
      >
        <span className="about-title">关于我：以太与弦</span>
        <span className="about-copy">在职大厂研发</span>
        <span className="about-copy">在AI时代希望用AI实现一些梦想</span>
      </a>
      <div className="qq-float" aria-label="售后QQ群号">
        <span className="qq-title">售后QQ群</span>
        <span className="qq-number">792496465</span>
      </div>
      {showModal && (
        <GenerateModal
          loading={loading}
          slots={slots}
          error={error}
          onClose={handleCloseModal}
          onRetry={handleRetry}
          allowBackgroundClose={backgroundCloseReady}
          backgroundCloseThresholdSeconds={BACKGROUND_CLOSE_THRESHOLD_MS / 1000}
          onBackgroundCloseReady={() => setBackgroundCloseReady(true)}
        />
      )}
      {!showModal && backgroundGeneration && (
        <button
          type="button"
          className="background-task-toast"
          onClick={() => {
            setShowModal(true)
            setSlots(backgroundGeneration.slots)
          }}
        >
          <span className="background-task-title">{buildBackgroundToast(backgroundGeneration.slots).title}</span>
          <span className="background-task-copy">{buildBackgroundToast(backgroundGeneration.slots).copy}</span>
        </button>
      )}
      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onKeySubmit={handleKeySubmit}
          error={keyError}
          credits={user?.credits || 0}
        />
      )}
      {showAccount && (
        <AccountModal
          onClose={() => setShowAccount(false)}
          onSubmit={handleRegisterSubmit}
          error={accountError}
          title="先创建一个轻账号"
          subtitle="游客可免费文生图 2 次；图生图和付费阶段需要账号，注册后可记录额度和任务。"
        />
      )}
    </div>
  )
}

export default App
