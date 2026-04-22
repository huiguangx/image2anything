#!/usr/bin/env bash
# run_checks.sh — 代码变更后自动跑检查
# 被 PostToolUse hook 调用

set -euo pipefail

INPUT="$1"

FILE_PATH=$(echo "$INPUT" | grep -oP '"file_path"\s*:\s*"([^"]*)"' | head -1 | sed 's/.*"\([^"]*\)"/\1/' || true)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# 只对 src/ 和配置文件的变更跑检查
if ! echo "$FILE_PATH" | grep -qE "^(src/|vite\.config|tsconfig|eslint)"; then
  exit 0
fi

echo "--- 自动检查开始 ---"

# TypeScript 类型检查
echo "[1/3] TypeScript 类型检查..."
if ! pnpm build --mode development 2>&1 | tail -5; then
  echo "WARN: 类型检查可能有问题，请关注上方输出"
fi

# ESLint
echo "[2/3] ESLint 检查..."
if ! pnpm lint 2>&1 | tail -5; then
  echo "WARN: Lint 检查可能有问题，请关注上方输出"
fi

# 测试
echo "[3/3] 运行测试..."
if ! pnpm test 2>&1 | tail -10; then
  echo "WARN: 测试可能有失败，请关注上方输出"
fi

echo "--- 自动检查完成 ---"
exit 0
