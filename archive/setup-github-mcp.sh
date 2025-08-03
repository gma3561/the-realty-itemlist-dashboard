#!/bin/bash

# GitHub MCP 설정 스크립트

echo "🔐 GitHub MCP 설정을 시작합니다..."

# 1. GitHub Token 입력
echo "GitHub Personal Access Token을 입력하세요:"
read -s GITHUB_TOKEN

# 2. Keychain에 저장
echo "🔑 Keychain에 토큰을 저장합니다..."
security add-generic-password -a "github-mcp" -s "github-token" -w "$GITHUB_TOKEN"

# 3. Claude Desktop 설정 업데이트
CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

echo "⚙️  Claude Desktop 설정을 업데이트합니다..."

# Backup 생성
cp "$CONFIG_FILE" "$CONFIG_FILE.backup"

# Token 교체
sed -i '' "s/your-github-token-here/$GITHUB_TOKEN/g" "$CONFIG_FILE"

echo "✅ 설정 완료!"
echo "📝 Claude Desktop을 재시작하세요."
echo ""
echo "🔍 토큰 확인: security find-generic-password -a 'github-mcp' -s 'github-token' -w"
echo "🗑️  토큰 삭제: security delete-generic-password -a 'github-mcp' -s 'github-token'"