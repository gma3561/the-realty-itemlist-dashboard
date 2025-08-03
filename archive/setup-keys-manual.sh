#!/bin/bash

echo "🔐 수동 키 설정 가이드"
echo "===================="
echo ""

echo "1. GitHub Personal Access Token 설정:"
echo "   https://github.com/settings/tokens 에서 토큰 생성 후 아래 명령 실행"
echo "   security add-generic-password -a 'github-mcp' -s 'github-token' -w 'YOUR_GITHUB_TOKEN'"
echo ""

echo "2. Supabase URL 설정:"
echo "   security add-generic-password -a 'supabase' -s 'supabase-url' -w 'https://qwxghpwasmvottahchky.supabase.co'"
echo ""

echo "3. Supabase Anon Key 설정:"
echo "   security add-generic-password -a 'supabase' -s 'supabase-anon-key' -w 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8'"
echo ""

echo "4. 설정 확인:"
echo "   security find-generic-password -a 'github-mcp' -s 'github-token' -w"
echo "   security find-generic-password -a 'supabase' -s 'supabase-url' -w"
echo ""

echo "5. Claude Desktop 설정 업데이트:"
echo "   ./update-claude-config.sh"
echo ""

echo "📋 현재 저장된 키 확인하기:"
echo "security dump-keychain | grep -A 1 -B 1 'github\\|supabase'"