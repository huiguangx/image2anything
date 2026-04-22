# 测试规范

## 工具

- Vitest 作为测试运行器
- React Testing Library 做组件测试
- `@testing-library/user-event` 模拟用户交互

## 规则

- 测试文件与源文件同目录，命名 `*.test.tsx` / `*.test.ts`
- 优先测试用户行为，不测试实现细节
- 每个组件至少覆盖：正常渲染、主要交互、边界情况
- 不要只测 happy path，必须覆盖错误状态和空数据
- mock 外部依赖（API 调用），不 mock 内部模块
- 运行命令：`pnpm test`（单次）、`pnpm test:watch`（监听）

## 测试结构

```typescript
describe('ComponentName', () => {
  it('renders correctly with default props', () => {})
  it('handles user interaction', () => {})
  it('shows error state when API fails', () => {})
  it('handles empty data gracefully', () => {})
})
```
