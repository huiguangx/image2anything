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

export function DashboardApp() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const next = await fetchStats()
        if (!active) return
        setData(next)
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
  const jobs = data?.recentJobs || []

  return (
    <div className="app dashboard-page">
      <section className="hero">
        <div className="hero-badge">运营后台</div>
        <h1>数据总览</h1>
        <p className="hero-subtitle">每 15 秒自动刷新一次，先看核心业务数据。</p>
      </section>

      {error && <div className="dashboard-error">{error}</div>}
      {loading && <div className="dashboard-loading">正在加载数据...</div>}

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
