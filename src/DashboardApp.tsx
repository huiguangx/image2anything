import { useEffect, useState } from 'react'
import './App.css'

interface DashboardTotals {
  users?: number
  accounts?: number
  guests?: number
  jobs?: number
  recent24h?: number
  succeeded?: number
  failed?: number
  running?: number
  queued?: number
  canceled?: number
}

interface DashboardJob {
  id: string
  prompt: string
  status: string
  mode: string
  providerName?: string | null
  error?: string | null
  createdAt: number
  completedAt?: number | null
  userId?: string | null
}

interface DashboardResponse {
  ok: boolean
  totals: DashboardTotals
  quota?: {
    freeQuota?: number
    freeUsageUsers?: number
  }
  recentJobs: DashboardJob[]
}

function formatTime(ts?: number | null) {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

async function fetchStats(): Promise<DashboardResponse> {
  const res = await fetch('/internal/dashboard/stats?key=admin147852')
  const data = await res.json().catch(() => null)
  if (!res.ok || !data) {
    throw new Error((data && data.error) || '数据读取失败')
  }
  return data as DashboardResponse
}

async function postDashboardAction(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch('/internal/dashboard/stats?key=admin147852', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.ok) {
    throw new Error((data && data.error) || '操作失败')
  }
  return data
}

export function DashboardApp() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [quotaInput, setQuotaInput] = useState('')
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)

  const loadStats = async () => {
    const next = await fetchStats()
    setData(next)
    setQuotaInput(String(next.quota?.freeQuota ?? ''))
    setError(null)
    return next
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const next = await fetchStats()
        if (!active) return
        setData(next)
        setQuotaInput(String(next.quota?.freeQuota ?? ''))
        setError(null)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : '数据读取失败')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    const timer = window.setInterval(load, 15000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  const totals = data?.totals || {}
  const quota = data?.quota || {}
  const jobs = data?.recentJobs || []

  const handleSaveQuota = async () => {
    const freeQuota = Number.parseInt(quotaInput, 10)
    if (!Number.isFinite(freeQuota) || freeQuota < 0) {
      setActionMessage('请输入大于等于 0 的整数')
      return
    }

    setActionBusy(true)
    setActionMessage(null)
    try {
      const result = await postDashboardAction('set_free_quota', { freeQuota })
      await loadStats()
      setActionMessage(`已更新免费次数为 ${result.freeQuota} 次`)
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : '操作失败')
    } finally {
      setActionBusy(false)
    }
  }

  const handleResetFreeUsage = async () => {
    if (!window.confirm('确定要重置所有游客/用户的免费使用次数吗？')) {
      return
    }

    setActionBusy(true)
    setActionMessage(null)
    try {
      const result = await postDashboardAction('reset_free_usage')
      await loadStats()
      setActionMessage(`已重置 ${result.deleted ?? 0} 条免费次数记录`)
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : '操作失败')
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <div className="app dashboard-page">
      <section className="hero">
        <div className="hero-badge">运营后台</div>
        <h1>数据总览</h1>
        <p className="hero-subtitle">每 15 秒自动刷新一次，先看核心业务数据。</p>
      </section>

      {error && <div className="dashboard-error">{error}</div>}
      {loading && <div className="dashboard-loading">正在加载数据...</div>}

      <section className="dashboard-control-panel">
        <div>
          <h2>免费次数控制</h2>
          <p>当前免费次数：{quota.freeQuota ?? '-'} 次，已有 {quota.freeUsageUsers ?? 0} 个免费用量记录。</p>
        </div>
        <div className="dashboard-control-actions">
          <input
            className="dashboard-quota-input"
            type="number"
            min="0"
            value={quotaInput}
            onChange={(event) => setQuotaInput(event.target.value)}
            aria-label="免费次数"
          />
          <button className="btn btn-primary" onClick={handleSaveQuota} disabled={actionBusy}>
            保存免费次数
          </button>
          <button className="btn btn-secondary" onClick={handleResetFreeUsage} disabled={actionBusy}>
            重置所有免费次数
          </button>
        </div>
        {actionMessage && <p className="dashboard-action-message">{actionMessage}</p>}
      </section>

      <section className="dashboard-metrics">
        {[
          ['总用户', totals.users],
          ['注册账号', totals.accounts],
          ['游客用户', totals.guests],
          ['总任务', totals.jobs],
          ['近24小时任务', totals.recent24h],
          ['成功任务', totals.succeeded],
          ['失败任务', totals.failed],
          ['进行中', totals.running],
          ['排队中', totals.queued],
          ['已取消', totals.canceled],
        ].map(([label, value]) => (
          <div key={String(label)} className="dashboard-metric-card">
            <span className="dashboard-metric-label">{label}</span>
            <strong className="dashboard-metric-value">{value ?? '-'}</strong>
          </div>
        ))}
      </section>

      <section className="dashboard-table-wrap">
        <div className="dashboard-table-header">
          <h2>最近任务</h2>
          <span>{jobs.length} 条</span>
        </div>
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>状态</th>
                <th>类型</th>
                <th>供应商</th>
                <th>用户</th>
                <th>提示词</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{formatTime(job.createdAt)}</td>
                  <td>{job.status}</td>
                  <td>{job.mode}</td>
                  <td>{job.providerName || '-'}</td>
                  <td>{job.userId || '-'}</td>
                  <td title={job.error || job.prompt}>{job.error || job.prompt || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
