#!/bin/bash

echo "🏢 부동산 실거래가 자동 수집 시스템 설정 가이드"
echo "================================================"
echo ""

# 현재 상태 확인
echo "📋 현재 상태 확인:"
echo "=================="

# Node.js 프로젝트 확인
if [ -f "package.json" ]; then
    echo "✅ Node.js 프로젝트 확인됨"
else
    echo "❌ package.json을 찾을 수 없습니다."
    exit 1
fi

# Supabase 클라이언트 확인
if npm list @supabase/supabase-js >/dev/null 2>&1; then
    echo "✅ Supabase 클라이언트 설치 확인됨"
else
    echo "⚠️  Supabase 클라이언트가 설치되지 않았습니다."
    echo "    npm install @supabase/supabase-js"
fi

# 생성된 파일들 확인
FILES=(
    "src/services/realEstateDataCollector.js"
    "src/hooks/useRealEstateCollector.js" 
    "src/components/RealEstateCollector.jsx"
    "supabase_realestatedata_setup.sql"
)

echo ""
echo "📁 생성된 파일들:"
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (누락)"
    fi
done

echo ""
echo "🔧 설정 단계:"
echo "============="
echo ""

echo "1️⃣ Supabase 데이터베이스 설정:"
echo "   - Supabase Dashboard > SQL Editor 접속"
echo "   - supabase_realestatedata_setup.sql 파일 내용을 복사하여 실행"
echo "   - 테이블과 인덱스가 생성됩니다."
echo ""

echo "2️⃣ 공공데이터포털 API 키 발급:"
echo "   - https://www.data.go.kr/data/15057511/openapi.do 접속"
echo "   - 회원가입 및 로그인"
echo "   - '국토교통부_아파트매매 실거래 상세 자료' API 신청"
echo "   - 승인 후 API 키 확인"
echo ""

echo "3️⃣ 애플리케이션에 컴포넌트 추가:"
echo "   - src/App.jsx 또는 원하는 페이지에 RealEstateCollector 컴포넌트 추가"
echo "   - import RealEstateCollector from './components/RealEstateCollector';"
echo ""

echo "4️⃣ 사용 방법:"
echo "   - 웹 애플리케이션에서 부동산 데이터 수집 페이지 접속"
echo "   - API 키 입력 후 설정"
echo "   - '자동 수집 시작' 버튼 클릭"
echo "   - 3시간마다 자동으로 서울시 주요 지역 데이터 수집"
echo ""

echo "📊 수집 대상 지역:"
echo "=================="
echo "   • 강남구 역삼동, 삼성동"
echo "   • 서초구 서초동"
echo "   • 송파구 잠실동"
echo "   • 영등포구 여의도동"
echo "   • 마포구 상암동"
echo "   • 용산구 한남동"
echo "   • 종로구 청운동"
echo ""

echo "⚠️  주의사항:"
echo "============"
echo "   • 공공데이터포털 API는 무료이지만 호출 제한이 있습니다."
echo "   • 서버 부하를 방지하기 위해 적절한 간격을 두고 호출합니다."
echo "   • API 키는 안전하게 보관하고 공개하지 마세요."
echo "   • 수집된 데이터는 Supabase에 안전하게 저장됩니다."
echo ""

echo "🚀 실행 준비 완료!"
echo "=================="
echo "   위 단계를 완료한 후 npm run dev로 개발 서버를 시작하세요."
echo ""

# 빠른 설정을 위한 패키지 설치 확인
echo "💡 빠른 설정:"
echo "============"
if ! npm list @supabase/supabase-js >/dev/null 2>&1; then
    echo "   Supabase 클라이언트 설치가 필요합니다."
    read -p "   지금 설치하시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   패키지 설치 중..."
        npm install @supabase/supabase-js
        echo "✅ 설치 완료!"
    fi
fi

echo ""
echo "🎯 다음 단계: Supabase 대시보드에서 SQL 파일을 실행하세요!"
echo "   파일: supabase_realestatedata_setup.sql"