---
description: 将本次 session 的教训沉淀为 spec。在完成一次 change 或发现 Agent 犯错后使用。触发词：update-spec、沉淀、记录教训。
---

# Update Spec

分析当前 session 中的错误或教训，将其沉淀为 openspec/specs/ 下的 spec 文件。

## 什么值得沉淀

- Agent 犯了一个之前没见过的错误
- 发现了一个隐性约定没有被文档化
- 某个工作流被验证有效，值得固化
- 某条 CLAUDE.md 规则被反复违反，需要升级

## 什么不值得沉淀

- 代码模式和约定（这些从代码本身可以推断）
- 一次性的 debug 过程
- 已经在 docs/ 中记录的内容

## 步骤

1. 回顾当前 session 的对话历史
2. 识别值得沉淀的教训（按上述标准）
3. 检查 `openspec/specs/` 下是否已有相关 spec
4. 如果有，更新现有 spec；如果没有，创建新 spec

## Spec 文件格式

```markdown
# [Spec 标题]

**创建时间**: YYYY-MM-DD
**最后更新**: YYYY-MM-DD
**来源**: [简述发现这条 spec 的场景]

## 规则

[具体的规则描述]

## 原因

[为什么需要这条规则]

## 违反后果

[如果不遵守会导致什么问题]

## 相关文件

- [列出相关的代码文件或文档]
```

## 沉淀后

- 如果 spec 涉及隐性约定，同步更新 `docs/architecture/implicit-contracts.md`
- 如果 spec 可以被形式化为 linter 规则，在 spec 中标注"候选升级到 linter"
- 如果多条 spec 描述同一类工作流，考虑合并为一个 skill
