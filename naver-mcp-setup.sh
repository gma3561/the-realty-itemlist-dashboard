#!/bin/bash

echo "🔍 네이버 MCP 설정 가이드"
echo "========================"
echo ""

echo "1️⃣ 네이버 API 키 발급:"
echo "   https://developers.naver.com/apps/#/register"
echo "   - 애플리케이션 이름: 아무거나 (예: Claude MCP 검색)"
echo "   - 사용 API: 검색"
echo "   - 환경: PC 웹"
echo ""

echo "2️⃣ 발급받은 키를 키체인에 저장:"
echo "   security add-generic-password -a 'naver' -s 'naver-client-id' -w 'YOUR_CLIENT_ID'"
echo "   security add-generic-password -a 'naver' -s 'naver-client-secret' -w 'YOUR_CLIENT_SECRET'"
echo ""

echo "3️⃣ Claude Desktop 설정 업데이트:"
echo "   ./update-claude-config-with-naver.sh"
echo ""

# 현재 키 상태 확인
echo "🔑 현재 키체인 상태:"
NAVER_CLIENT_ID=$(security find-generic-password -a 'naver' -s 'naver-client-id' -w 2>/dev/null)
NAVER_CLIENT_SECRET=$(security find-generic-password -a 'naver' -s 'naver-client-secret' -w 2>/dev/null)

if [ -n "$NAVER_CLIENT_ID" ]; then
    echo "✅ 네이버 Client ID: ${NAVER_CLIENT_ID:0:8}..."
else
    echo "❌ 네이버 Client ID: 없음"
fi

if [ -n "$NAVER_CLIENT_SECRET" ]; then
    echo "✅ 네이버 Client Secret: ${NAVER_CLIENT_SECRET:0:8}..."
else
    echo "❌ 네이버 Client Secret: 없음"
fi

echo ""
echo "📋 네이버 MCP 설치 완료!"
echo "   패키지: mcp-naver v0.1.5"
echo "   위치: $(which python3) 환경에 설치됨"