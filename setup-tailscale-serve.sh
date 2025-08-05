#!/bin/bash

echo "🌐 테일스케일 Serve 설정 스크립트"
echo "===================================="
echo ""

# 현재 테일스케일 상태 확인
echo "📡 테일스케일 상태 확인 중..."
TAILSCALE_IP=$(/Applications/Tailscale.app/Contents/MacOS/Tailscale status --json | jq -r '.Self.TailscaleIPs[0]')
HOSTNAME=$(/Applications/Tailscale.app/Contents/MacOS/Tailscale status --json | jq -r '.Self.HostName')

echo "✅ 호스트명: $HOSTNAME"
echo "✅ 테일스케일 IP: $TAILSCALE_IP"
echo ""

# 개발 서버 확인
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "⚠️  개발 서버가 실행되지 않고 있습니다."
    echo "개발 서버를 시작하시겠습니까? (y/n)"
    read -r start_dev
    
    if [ "$start_dev" = "y" ]; then
        echo "🚀 개발 서버 시작 중..."
        cd /Users/tere.remote/the-realty-itemlist-dashboard
        npm run dev &
        DEV_PID=$!
        echo "개발 서버 PID: $DEV_PID"
        echo "서버가 시작될 때까지 대기 중..."
        sleep 5
        
        # 서버 시작 확인
        if curl -s http://localhost:5173 > /dev/null 2>&1; then
            echo "✅ 개발 서버가 성공적으로 시작되었습니다!"
        else
            echo "❌ 개발 서버 시작 실패. 수동으로 시작해주세요: npm run dev"
            exit 1
        fi
    else
        echo "개발 서버를 먼저 시작해주세요: npm run dev"
        exit 1
    fi
else
    echo "✅ 개발 서버가 이미 실행 중입니다!"
fi

echo ""
echo "🔧 테일스케일 Serve 설정 중..."

# 기존 serve 설정 제거
/Applications/Tailscale.app/Contents/MacOS/Tailscale serve reset 2>/dev/null

# HTTPS로 서비스 공유
/Applications/Tailscale.app/Contents/MacOS/Tailscale serve https / http://localhost:5173

echo ""
echo "✅ 테일스케일 Serve 설정 완료!"
echo ""
echo "📱 다른 기기에서 접속하려면:"
echo ""
echo "1. 테일스케일 IP로 접속:"
echo "   https://$TAILSCALE_IP"
echo ""
echo "2. 호스트명으로 접속:"
echo "   https://$HOSTNAME"
echo ""
echo "3. 또는 MagicDNS가 활성화되어 있다면:"
echo "   https://$HOSTNAME.tailnet-name.ts.net"
echo ""
echo "💡 팁:"
echo "- HTTPS로 자동 리다이렉트됩니다"
echo "- 테일스케일에 연결된 모든 기기에서 접속 가능"
echo "- 바이패스 로그인이 활성화되어 있어 테스트가 쉽습니다"
echo ""

# 현재 serve 상태 표시
echo "📊 현재 Serve 설정:"
/Applications/Tailscale.app/Contents/MacOS/Tailscale serve status

echo ""
echo "🛑 서비스를 중단하려면:"
echo "   /Applications/Tailscale.app/Contents/MacOS/Tailscale serve reset"
echo ""

# 개발 서버 관리
if [ ! -z "$DEV_PID" ]; then
    echo "⚠️  개발 서버가 백그라운드에서 실행 중입니다 (PID: $DEV_PID)"
    echo "종료하려면: kill $DEV_PID"
fi