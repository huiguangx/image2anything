import { useState } from 'react'

interface CreatePanelProps {
  onGenerate: (prompt: string) => void
  loading: boolean
}

export function CreatePanel({ onGenerate, loading }: CreatePanelProps) {
  const [prompt, setPrompt] = useState('')

  const handleSubmit = () => {
    const trimmed = prompt.trim()
    if (!trimmed) return
    onGenerate(trimmed)
  }

  return (
    <section className="create-section">
      <h2>实现梦想</h2>
      <p className="section-subtitle">输入你的创意描述，AI 帮你生成</p>
      <div className="create-form">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="描述你想生成的图片，比如：一只穿着宇航服的柴犬在月球上散步..."
          rows={4}
        />
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || !prompt.trim()}
        >
          {loading ? '生成中...' : '开始生成'}
        </button>
        <p className="create-note">（前两次免费，之后按次收费~）</p>
      </div>
    </section>
  )
}
