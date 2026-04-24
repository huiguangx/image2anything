import { useRef, useState, type ChangeEvent } from 'react'

interface CreatePanelProps {
  onGenerate: (prompt: string, image?: string) => void
  loading: boolean
  userLabel?: string
  creditText?: string
}

export function CreatePanel({ onGenerate, loading, userLabel, creditText }: CreatePanelProps) {
  const [prompt, setPrompt] = useState('')
  const [imageName, setImageName] = useState('')
  const [imageData, setImageData] = useState<string | undefined>(undefined)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setImageName('')
      setImageData(undefined)
      setImageError(null)
      return
    }

    if (!file.type.startsWith('image/')) {
      setImageError('请上传图片文件')
      setImageName('')
      setImageData(undefined)
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      setImageError('图片不能超过 8MB')
      setImageName('')
      setImageData(undefined)
      return
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('图片读取失败，请重新选择'))
      reader.readAsDataURL(file)
    }).catch((error) => {
      setImageError(error instanceof Error ? error.message : '图片读取失败，请重新选择')
      return ''
    })

    if (!dataUrl) {
      return
    }

    setImageError(null)
    setImageName(file.name)
    setImageData(dataUrl)
  }

  const clearImage = () => {
    setImageName('')
    setImageData(undefined)
    setImageError(null)
    if (fileRef.current) {
      fileRef.current.value = ''
    }
  }

  const handleSubmit = () => {
    const trimmed = prompt.trim()
    if (!trimmed) return
    onGenerate(trimmed, imageData)
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
        <div className="upload-row">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} />
          <div className="upload-copy">
            <span>{imageName ? `已选择：${imageName}` : '可选：上传一张参考图，开启图生图'}</span>
            {imageName && (
              <button type="button" className="upload-clear" onClick={clearImage}>
                移除图片
              </button>
            )}
          </div>
          {imageError && <p className="create-error">{imageError}</p>}
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || !prompt.trim()}
        >
          {loading ? '生成中...' : '开始生成'}
        </button>
        <p className="create-note">（前两次免费，之后按次收费~）</p>
        {(userLabel || creditText) && (
          <div className="create-status">
            {userLabel && <span>{userLabel}</span>}
            {creditText && <span>{creditText}</span>}
          </div>
        )}
      </div>
    </section>
  )
}
