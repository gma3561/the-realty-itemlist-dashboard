#!/bin/bash

CONFIG_FILE="/Users/tere.remote/Library/Application Support/Claude/claude_desktop_config.json"
BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔄 Claude Desktop 설정을 네이버 MCP로 업데이트합니다..."

# 백업 생성
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "📁 백업 생성: $BACKUP_FILE"

# 키체인에서 네이버 API 키 가져오기
NAVER_CLIENT_ID=$(security find-generic-password -a 'naver' -s 'naver-client-id' -w 2>/dev/null)
NAVER_CLIENT_SECRET=$(security find-generic-password -a 'naver' -s 'naver-client-secret' -w 2>/dev/null)

if [ -z "$NAVER_CLIENT_ID" ] || [ -z "$NAVER_CLIENT_SECRET" ]; then
    echo "❌ 네이버 API 키가 키체인에 없습니다!"
    echo "   먼저 다음 명령어로 키를 저장하세요:"
    echo "   security add-generic-password -a 'naver' -s 'naver-client-id' -w 'YOUR_CLIENT_ID'"
    echo "   security add-generic-password -a 'naver' -s 'naver-client-secret' -w 'YOUR_CLIENT_SECRET'"
    exit 1
fi

# 새로운 설정 생성
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
    },
    "naver-search": {
      "command": "/Library/Frameworks/Python.framework/Versions/3.13/bin/python3",
      "args": ["-m", "mcp_naver"],
      "env": {
        "NAVER_CLIENT_ID": "$NAVER_CLIENT_ID",
        "NAVER_CLIENT_SECRET": "$NAVER_CLIENT_SECRET"
      }
    }
  }
}
EOF

echo "✅ Claude Desktop 설정이 업데이트되었습니다!"
echo "📋 추가된 MCP 서버:"
echo "   - naver-search: 네이버 검색 API"
echo ""
echo "🔄 Claude Desktop을 재시작하여 변경사항을 적용하세요."
echo ""
echo "🧪 테스트 방법:"
echo "   Claude Desktop에서 '네이버에서 부동산 검색해줘' 같은 명령어를 사용해보세요."