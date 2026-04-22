#!/usr/bin/env bash
# ensure_change_context.sh — 检查是否存在活跃的 OpenSpec change
# 在修改 src/ 下的文件前调用

set -euo pipefail

INPUT="$1"

FILE_PATH=$(echo "$INPUT" | grep -oP '"file_path"\s*:\s*"([^"]*)"' | head -1 | sed 's/.*"\([^"]*\)"/\1/' || true)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# 只检查 src/ 下的文件
if ! echo "$FILE_PATH" | grep -q "src/"; then
  exit 0
fi

# 检查 openspec/changes/ 下是否有活跃 change（排除 archive 和 .gitkeep）
ACTIVE_CHANGES=$(find openspec/changes -mindepth 1 -maxdepth 1 -type d ! -name "archive" 2>/dev/null | head -1 || true)

if [ -z "$ACTIVE_CHANGES" ]; then
  echo "WARNING: 当前没有活跃的 OpenSpec change。"
  echo "建议先执行 propose 创建 change 工件，再开始修改业务代码。"
  echo "如果是 trivial 修复（typo、格式），可以忽略此警告。"
  exit 0
fi

exit 0
