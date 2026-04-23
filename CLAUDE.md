# Gpt AI 万物图

Vite + React + TypeScript web app.

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — type-check and build for production
- `pnpm preview` — preview production build
- `pnpm test` — run tests once
- `pnpm test:watch` — run tests in watch mode
- `pnpm lint` — lint with ESLint

## Stack

- React 19, TypeScript 5.8, Vite 6
- ESLint (flat config) with react-hooks and react-refresh plugins
- Vitest + React Testing Library for tests
- pnpm for package management

## Workflow — OpenSpec 变更驱动

所有功能开发和非 trivial 修改必须遵循 OpenSpec 变更生命周期：

1. **propose** — 将需求拆解为 change 工件（proposal.md / design.md / tasks.md）
2. **apply** — 仅在 tasks.md 范围内实施代码变更
3. **verify** — 校验实现与 change 工件是否一致
4. **archive** — 归档 change，保持 openspec/changes/ 干净

规则：
- 没有活跃 change 时，不允许直接修改 src/ 下的业务代码
- 第一版 proposal 是草案，不要急着执行，人工审核后再 apply
- 当某块逻辑始终无法稳定理解时，拆成多个 change

## 知识库入口

进入仓库后，按需阅读以下文档：

- `docs/architecture/index.md` — 项目架构总览
- `docs/architecture/implicit-contracts.md` — 隐性业务约定（必读）
- `docs/standards/coding.md` — 编码规范
- `docs/standards/testing.md` — 测试规范
- `openspec/specs/` — 系统当前状态 spec

## 受保护路径（禁止直接修改）

- `dist/` — 构建产物，由 build 命令生成
- `.env*` — 环境变量文件
- `node_modules/` — 依赖目录
- `pnpm-lock.yaml` — 锁文件，仅通过 pnpm install 更新

## 编码约束

- 组件放 `src/components/`，页面放 `src/pages/`，工具函数放 `src/lib/`
- 业务逻辑不写在组件里，抽到 hooks 或 services 层
- 新建组件前先 grep 现有组件，避免重复
- 所有导出的函数和组件必须有 TypeScript 类型
- 不要在组件里直接调 fetch，封装到 `src/services/` 或自定义 hook
- 测试文件与源文件同目录，命名 `*.test.tsx` / `*.test.ts`

## 审查流程

实现完成后，依次执行（不要混在一起）：

1. `/prepare-review` — 生成变更摘要
2. `/architecture-review` — 分层架构审查
3. `/update-spec` — 沉淀本次教训到 spec
4. `@reviewer` — 独立只读代码审查
