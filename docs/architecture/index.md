# 项目架构总览

## 技术栈

- **框架**: React 19 + TypeScript 5.8
- **构建**: Vite 6
- **测试**: Vitest + React Testing Library
- **代码质量**: ESLint (flat config)
- **包管理**: pnpm

## 目录结构约定

```
src/
├── components/    # 可复用 UI 组件
├── pages/         # 页面级组件
├── hooks/         # 自定义 React hooks
├── services/      # API 调用和外部服务封装
├── lib/           # 工具函数和通用逻辑
├── types/         # 共享 TypeScript 类型定义
├── App.tsx        # 根组件
├── main.tsx       # 入口文件
└── index.css      # 全局样式
```

## 分层原则

1. **组件层** (`components/`, `pages/`) — 只负责渲染和用户交互
2. **逻辑层** (`hooks/`, `services/`) — 业务逻辑、状态管理、API 调用
3. **工具层** (`lib/`, `types/`) — 纯函数、类型定义、常量

组件不直接调用 API，通过 hooks 或 services 间接访问。
