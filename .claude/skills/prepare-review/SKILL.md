---
description: 生成 PR 前的变更摘要。在完成代码实现后、提交 PR 前使用。触发词：prepare-review、变更摘要、PR 摘要。
---

# Prepare Review

生成当前分支相对于 main 的变更摘要，方便人工 review。

## 步骤

1. 运行 `git diff main...HEAD --stat` 获取变更文件列表
2. 运行 `git diff main...HEAD` 获取完整 diff
3. 运行 `git log main..HEAD --oneline` 获取 commit 列表
4. 阅读 `openspec/changes/` 下当前活跃 change 的 proposal.md 和 design.md

## 输出格式

```markdown
## 变更摘要

### 本次改了什么
[一句话总结]

### 变更文件
[按模块分组列出变更文件及改动类型：新增/修改/删除]

### 关键决策
[列出实现中的重要设计决策及原因]

### 测试情况
- 新增测试：[列出]
- 未覆盖的场景：[列出]
- 原因：[说明]

### 风险点
[列出需要 reviewer 重点关注的地方]

### 与 OpenSpec 工件的对齐情况
[proposal/design 中的要求是否都已实现]
```

## 注意

- 不修改任何文件
- 如果没有活跃 change，仍然生成摘要，但标注"无 OpenSpec 工件"
- 摘要应该让一个不了解上下文的 reviewer 能快速理解这次变更
