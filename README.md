# Image2Anything

AI 图片生成工具，基于 GPT-Image-2，支持一键生同款和自定义创作。

## 功能

- 15 种预设风格（3D 手办、黑白肖像、Funko Pop、宝丽来合照等）
- 点击「生同款」一键生成类似效果
- 自定义 prompt 创作任意图片
- 深色主题 UI

## 技术栈

React 19 + TypeScript + Vite 6

## 本地开发

```bash
pnpm install
pnpm dev
```

## 环境变量

在 `.env` 或 Vercel 环境变量中配置：

```
VITE_API_BASE=https://你的代理API地址
VITE_API_KEY=你的API_KEY
```

未配置时使用 mock 模式。

## 部署

### Vercel（推荐）

推送到 GitHub 后在 Vercel 导入仓库，自动识别 Vite 项目并部署。

### Docker

```bash
docker build -t image2anything .
docker run -d -p 8080:80 image2anything
```

## License

MIT
