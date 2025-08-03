#!/bin/bash

echo "🚀 실용적인 MCP 서버 설정"
echo "========================="

# 키체인에서 API 키들 가져오기
SMITHERY_API_KEY=$(security find-generic-password -a 'smithery' -s 'smithery-api-key' -w 2>/dev/null)
GITHUB_TOKEN=$(security find-generic-password -a 'github-mcp' -s 'github-token' -w 2>/dev/null)

echo "현재 키체인 상태:"
echo "✅ Smithery API: ${SMITHERY_API_KEY:0:8}..."
if [ -n "$GITHUB_TOKEN" ]; then
    echo "✅ GitHub Token: ${GITHUB_TOKEN:0:8}..."
else
    echo "❌ GitHub Token: 없음"
fi

# Claude Desktop 설정 업데이트
CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

echo ""
echo "Claude Desktop 설정 업데이트 중..."

# 백업 생성
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "백업 생성: $BACKUP_FILE"

# 실용적인 MCP 서버들로 설정 파일 생성
cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "mcp-obsidian": {
      "command": "/Library/Frameworks/Python.framework/Versions/3.13/bin/uvx",
      "args": [
        "mcp-obsidian"
      ],
      "env": {
        "OBSIDIAN_API_KEY": "2091512c40d5a322038c65aa881a3a1a69efe0f230be54ba44acda192301bdc3"
      }
    },
    "obsidian-mcp-tools": {
      "command": "Users/tere.remote/Library/Mobile Documents/com~apple~CloudDocs/TERE Share Folder/shared-notes/.obsidian/plugins/mcp-tools/bin/mcp-server",
      "env": {
        "OBSIDIAN_API_KEY": "2091512c40d5a322038c65aa881a3a1a69efe0f230be54ba44acda192301bdc3"
      }
    },
    "playwright": {
      "command": "node",
      "args": [
        "/Users/tere.remote/mcp-servers/playwright/node_modules/@playwright/mcp/index.js"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/tere.remote/Documents"],
      "env": {}
    },
    "realty-dashboard": {
      "command": "node",
      "args": ["/Users/tere.remote/the-realty-itemlist-dashboard/src/mcp/mcp-server-final.mjs"],
      "env": {}
    }
EOF

# GitHub 토큰이 있으면 GitHub MCP 추가
if [ -n "$GITHUB_TOKEN" ]; then
    cat >> "$CONFIG_FILE" << EOF
    ,
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "$GITHUB_TOKEN"
      }
    }
EOF
fi

# 설정 파일 닫기
cat >> "$CONFIG_FILE" << EOF
  }
}
EOF

echo ""
echo "✅ Claude Desktop 설정 완료!"
echo ""
echo "📋 설정된 MCP 서버들:"
echo "  🗒️  mcp-obsidian (Obsidian 통합)"
echo "  🛠️  obsidian-mcp-tools (Obsidian 도구)"
echo "  🎭 playwright (브라우저 자동화)"
echo "  📁 filesystem (파일 시스템 접근)"
echo "  🏠 realty-dashboard (부동산 관리)"
if [ -n "$GITHUB_TOKEN" ]; then
    echo "  🐙 github (GitHub 통합)"
fi

echo ""
echo "🔄 Claude Desktop을 재시작하세요!"
echo ""
echo "🧪 테스트 명령어들:"
echo "  - '매물 목록을 보여줘'"
echo "  - 'Documents 폴더의 파일들을 확인해줘'"
echo "  - 'Playwright로 웹페이지를 자동화해줘'"
if [ -n "$GITHUB_TOKEN" ]; then
    echo "  - 'GitHub 레포지토리 목록을 보여줘'"
fi