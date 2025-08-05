#!/bin/bash

# 개발 서버 자동 재시작 스크립트
# 서버가 중단되면 자동으로 재시작합니다

echo "🚀 개발 서버 자동 재시작 스크립트 시작..."

while true; do
    echo "📦 개발 서버 시작 중..."
    
    # 기존 프로세스 종료
    lsof -ti:5175 | xargs kill -9 2>/dev/null
    
    # 개발 서버 실행
    npm run dev
    
    # 서버가 종료되면 5초 대기 후 재시작
    echo "⚠️  서버가 종료되었습니다. 5초 후 재시작합니다..."
    sleep 5
done