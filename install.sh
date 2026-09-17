#!/usr/bin/env bash
# breathing-light 스킬 설치 → ~/.claude/skills/breathing-light
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p ~/.claude/skills
rm -rf ~/.claude/skills/breathing-light
cp -R skill/breathing-light ~/.claude/skills/
echo "✓ 설치 끝: ~/.claude/skills/breathing-light"
