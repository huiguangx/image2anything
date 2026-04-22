# 编码规范

## TypeScript

- 严格模式开启（`strict: true`）
- 禁止 `any`，必要时用 `unknown` + 类型守卫
- 导出的函数和组件必须有显式类型
- 优先用 `interface` 定义对象类型，`type` 用于联合类型和工具类型

## React

- 函数组件 + hooks，不用 class 组件
- Props 用 interface 定义，命名 `XxxProps`
- 事件处理函数命名 `handleXxx`
- 自定义 hook 命名 `useXxx`，放 `src/hooks/`
- 组件文件一个组件一个文件，文件名与组件名一致

## 样式

- 优先使用 CSS Modules 或 CSS-in-JS
- 全局样式仅限 `index.css`
- 避免内联样式，除非是动态计算值

## 导入顺序

1. React / 第三方库
2. 内部模块（components, hooks, services, lib）
3. 类型导入
4. 样式文件
