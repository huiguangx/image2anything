#!/usr/bin/env bash
# guard_write.sh — 拦截对受保护路径的写入
# 被 PreToolUse hook 调用，参数为 $TOOL_INPUT (JSON)

set -euo pipefail

INPUT="$1"

# 从 tool input 中提取文件路径
FILE_PATH=$(echo "$INPUT" | grep -oP '"file_path"\s*:\s*"([^"]*)"' | head -1 | sed 's/.*"\([^"]*\)"/\1/' || true)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# 受保护路径列表
PROTECTED_PATTERNS=(
  "dist/"
  "node_modules/"
  ".env"
  "pnpm-lock.yaml"
)

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if echo "$FILE_PATH" | grep -q "$pattern"; then
    echo "BLOCKED: 禁止直接修改受保护路径: $FILE_PATH"
    echo "如需修改，请通过对应的工具命令（如 pnpm install）间接更新。"
    exit 2
  fi
done

exit 0
