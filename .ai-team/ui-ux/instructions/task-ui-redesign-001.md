# 📋 UI/UX Designer 업무 지시서

**Task ID**: UI-REDESIGN-001  
**담당자**: UI/UX Designer  
**작업일**: 2025-08-06  
**우선순위**: 높음  
**예상 소요시간**: 3-4시간  

---

## 🎯 작업 목표

기존 "팀 매물장" 시스템의 매물 리스트 UI 디자인 시안을 작성하고, Frontend Developer가 구현할 수 있도록 상세한 디자인 가이드를 제공

## 📋 작업 상세 내용

### 1. 디자인 시스템 변경
**Primary Color**: `#FF66B2` (핑크)로 통일
- 기존 파란색 계열 → 핑크 계열로 전환
- Hover 상태: `hover:bg-pink-600`
- Focus 상태: `focus:ring-primary focus:border-primary`

### 2. 컴포넌트별 개편 요구사항

#### 🔹 PropertyList.jsx 페이지 개편
**현재 파일 위치**: `/src/pages/PropertyList.jsx`

**변경 사항**:
1. **헤더 섹션**
   - 제목: "매물장" 
   - 부제목: "*매물장의 정보를 간편하게 관리하세요."
   - "매물 등록" 버튼: 핑크 테마 적용

2. **검색 섹션 UI 개선**
   - 배경: `bg-gray-50` 카드 형태
   - 설명 텍스트: "매물 종류를 선택하시면 상세 검색이 가능합니다."
   - **지역조회** 섹션 (4개 필드 그리드):
     - 매물종류 선택박스
     - 시/도, 구/군, 읍/면/동 입력필드
   - **조건조회** 섹션 (6개 필드 그리드):
     - 거래유형, 상태 선택박스
     - 매물가격 범위 입력 (두 개 필드)
     - 매물번호 검색 필드

3. **테이블 디자인 개선**
   - 컬럼 구성:
     - 체크박스 | 즐겨찾기 | 매물번호 | 매물종류 | 지역명/상세주소 | 면적 | 가격유형/가격 | 담당자 | 상태 | 등록일 | 작업
   - **매물번호**: 핑크 배경 라벨로 표시
   - **지역/주소**: 제목과 주소를 분리하여 표시
   - **면적**: "㎡ (평)" 형태로 표시
   - **가격유형**: 컬러 라벨 (매매:노랑, 전세:파랑, 월세:보라)
   - **상태**: 라운드 배지 형태 (거래가능:초록, 거래완료:파랑)

#### 🔹 PropertyCard.jsx 컴포넌트 개선
**현재 파일 위치**: `/src/components/property/PropertyCard.jsx`

**변경 사항**:
- 핑크 테마 적용
- 버튼 스타일 통일
- 아이콘 및 시각적 요소 개선

#### 🔹 PropertyFilter.jsx 컴포넌트 개선
**현재 파일 위치**: `/src/components/property/PropertyFilter.jsx`

**변경 사항**:
- 새로운 검색 섹션 레이아웃으로 변경
- 필드 배치 및 스타일링 개선

## ⚠️ 중요 제약사항

### 🚨 절대 금지사항
1. **데이터베이스 필드 추가 금지**: Supabase에 존재하지 않는 필드는 절대 추가하지 말 것
2. **상태값 임의 추가 금지**: 기존에 없는 status 값 생성 금지
3. **API 호출 변경 금지**: 기존 데이터 구조를 변경하는 API 호출 수정 금지

### ✅ 허용되는 작업 (디자인 시안 작성)
- 디자인 컨셉 및 색상 팔레트 정의
- 컴포넌트별 스타일 가이드 작성  
- TailwindCSS 클래스 명세서 작성
- 아이콘 및 시각적 요소 선정
- Frontend Developer를 위한 구현 가이드 작성

## 📁 작업 대상 파일

### 필수 작성 파일 (디자인 문서)
```
.ai-team/ui-ux/designs/property-list-design-guide.md     # 디자인 가이드
.ai-team/ui-ux/designs/component-style-specs.md          # 컴포넌트 스타일 명세
.ai-team/ui-ux/designs/color-palette.md                  # 색상 팔레트
.ai-team/shared/design-handoff-to-frontend.md            # 프론트엔드 전달 문서
```

### 참고 파일
```
src/pages/PropertyListNew.jsx       # 새 버전 참고 (있는 경우)
src/styles/design-system.css        # 디자인 시스템
tailwind.config.js                  # TailwindCSS 설정
```

## 🎨 디자인 참고사항

### 색상 팔레트
```css
primary: '#FF66B2'        /* 메인 핑크 */
primary-hover: '#E055A0'  /* 호버 핑크 */
primary-light: '#FFE8F5' /* 연한 핑크 */

/* 상태별 색상 */
yellow-100: '#FEF3C7'    /* 매매 배경 */
blue-100: '#DBEAFE'      /* 전세 배경 */
purple-100: '#EDE9FE'    /* 월세 배경 */
green-100: '#D1FAE5'     /* 거래가능 배경 */
```

### 아이콘 시스템
- Heroicons 사용 (기존과 동일)
- 크기: w-4 h-4 (기본), w-5 h-5 (버튼 내)
- 위치 아이콘, 사용자 아이콘, 날짜 아이콘 등 활용

## 📋 체크리스트

### Phase 1: 분석 및 준비
- [ ] 기존 PropertyList.jsx 코드 분석
- [ ] 현재 데이터 구조 파악 (필드명, 상태값 확인)
- [ ] 디자인 시스템 색상 정의

### Phase 2: 컴포넌트 개편
- [ ] PropertyList.jsx 헤더 섹션 개편
- [ ] 검색 섹션 UI 구현
- [ ] 테이블 디자인 개선
- [ ] PropertyCard.jsx 스타일 개선
- [ ] PropertyFilter.jsx 레이아웃 변경

### Phase 3: 테스트 및 검증
- [ ] 로컬 개발 서버 테스트
- [ ] 반응형 디자인 확인
- [ ] 기존 기능 정상 작동 확인
- [ ] 핑크 테마 일관성 검증

## 🔧 기술 스택 참고

### 현재 사용 중인 기술
- **React 18** + Vite
- **TailwindCSS** (스타일링)
- **Heroicons** (아이콘)
- **React Router** (라우팅)

### 스타일링 가이드라인
```jsx
// 메인 버튼
className="bg-primary hover:bg-pink-600 text-white px-6 py-2 rounded-lg transition-colors"

// 입력 필드
className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"

// 카드 컨테이너
className="bg-white rounded-lg shadow-sm p-6"
```

## 📊 완료 기준

1. **시각적 완성도**: 제공된 HTML 프리뷰와 90% 이상 일치
2. **기능 유지**: 기존 모든 기능이 정상 작동
3. **반응형 지원**: 모바일/태블릿/데스크톱 모든 환경에서 정상 표시
4. **성능**: 렌더링 성능 저하 없음
5. **일관성**: 핑크 테마가 전체적으로 일관되게 적용

## 📅 마일스톤

- **Day 1**: 분석 및 기본 구조 변경 (2시간)
- **Day 2**: 상세 스타일링 및 컴포넌트 개선 (2시간) 
- **Day 3**: 테스트 및 최종 검토 (30분)

---

**승인자**: Product Owner  
**검토자**: Frontend Developer  
**최종 확인**: QA Manager

**문의사항이 있을 경우 PO에게 즉시 보고하세요.**