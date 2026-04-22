---
description: React 组件分层和目录结构审查。在完成功能实现后使用，检查是否违反分层原则。触发词：architecture-review、架构审查、分层检查。
---

# Architecture Review

审查当前变更是否符合项目的分层架构约定。

## 检查项

### 1. 组件层纯净性
- 组件文件（`src/components/`, `src/pages/`）中是否包含直接的 API 调用（fetch, axios 等）
- 组件中是否包含复杂的业务逻辑（应抽到 hooks 或 services）
- 组件是否职责单一

### 2. 目录结构合规
- 新文件是否放在了正确的目录下
- 是否有文件放在 `src/` 根目录下（应归入子目录）
- 命名是否符合约定（组件 PascalCase，工具函数 camelCase）

### 3. 依赖方向
- 组件层 → 逻辑层 → 工具层（单向依赖）
- `lib/` 和 `types/` 不应依赖 `components/` 或 `pages/`
- `services/` 不应依赖 `components/`

### 4. 重复检测
- 是否有功能相似的组件可以合并
- 是否有重复的工具函数
- 是否有可以提取的公共 hook

## 步骤

1. 运行 `git diff main...HEAD --name-only` 获取变更文件
2. 逐个读取变更文件，按上述检查项审查
3. 阅读 `docs/architecture/index.md` 确认当前架构约定
4. 输出审查报告

## 输出格式

按严重程度分类：
- **违规** — 必须修复
- **警告** — 建议修复
- **建议** — 可以改进

每条包含：文件路径、行号、问题描述、修复建议。
