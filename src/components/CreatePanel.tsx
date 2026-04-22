import { useState } from 'react'

interface CreatePanelProps {
  onGenerate: (prompt: string) => void
  disabled?: boolean
}

export function CreatePanel({ onGenerate, disabled }: CreatePanelProps) {
  const [prompt, setPrompt] = useState('')

  const handleSubmit = () => {
    const trimmed = prompt.trim()
    if (!trimmed) return
    onGenerate(trimmed)
  }

  return (
    <section className="create-section">
      <h2>自己创作</h2>
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
          disabled={!prompt.trim() || disabled}
        >
          {disabled ? '处理中...' : '开始生成'}
        </button>
      </div>
    </section>
  )
}
