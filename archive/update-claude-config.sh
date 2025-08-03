#!/bin/bash

# Claude Desktop 설정을 Keychain 기반으로 업데이트

CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔐 Claude Desktop 설정을 Keychain 기반으로 업데이트합니다..."

# 백업 생성
if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$BACKUP_FILE"
    echo "✅ 백업 생성: $BACKUP_FILE"
fi

# GitHub 토큰 가져오기
GITHUB_TOKEN=$(security find-generic-password -a "github-mcp" -s "github-token" -w 2>/dev/null || echo "")

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GitHub 토큰이 Keychain에 없습니다."
    echo "먼저 다음 명령어로 저장하세요:"
    echo "security add-generic-password -a 'github-mcp' -s 'github-token' -w 'your-token'"
    exit 1
fi

# 새 설정 파일 생성
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
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "$GITHUB_TOKEN"
      }
    },
    "realty-dashboard": {
      "command": "node",
      "args": ["/Users/tere.remote/the-realty-itemlist-dashboard/src/mcp/mcp-server-final.mjs"],
      "env": {}
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/tere.remote/Documents"],
      "env": {}
    }
  }
}
EOF

echo "✅ Claude Desktop 설정이 업데이트되었습니다."
echo "🔄 Claude Desktop을 재시작하세요."
echo ""
echo "📋 설정된 MCP 서버들:"
echo "  - mcp-obsidian (Obsidian 통합)"
echo "  - obsidian-mcp-tools (Obsidian 도구)"
echo "  - playwright (브라우저 자동화)"
echo "  - github (GitHub 통합) ✨"
echo "  - realty-dashboard (부동산 관리) ✨"
echo "  - filesystem (파일 시스템 접근) ✨"