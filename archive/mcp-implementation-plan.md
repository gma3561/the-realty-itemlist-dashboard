# MCP 구현 계획 - 단계별 실행 가이드

## 프로젝트 개요
The Realty Itemlist Dashboard에 MCP (Model Context Protocol)를 통합하여 AI 기반 기능을 추가하고 자동화된 매물 관리 시스템을 구축합니다.

## 구현 일정
- 예상 소요 시간: 2-3일
- 우선순위: High
- 담당자: 개발팀

## 단계별 실행 계획

### Phase 1: 환경 설정 (Day 1 - 오전)

#### Step 1: 의존성 설치
```bash
# MCP 핵심 패키지 설치
npm install @modelcontextprotocol/sdk@latest
npm install @modelcontextprotocol/server-nodejs@latest

# 개발 의존성
npm install --save-dev @modelcontextprotocol/types@latest
npm install --save-dev concurrently

# WebSocket 지원 (선택사항)
npm install ws
```

#### Step 2: 프로젝트 구조 생성
```bash
# MCP 관련 디렉토리 생성
mkdir -p src/mcp/{server,client,middleware,types}
mkdir -p src/hooks/mcp
mkdir -p src/services/mcp
```

#### Step 3: 환경 변수 설정
`.env` 파일 업데이트:
```bash
# 기존 환경 변수 유지
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# MCP 설정 추가
VITE_MCP_SERVER_URL=ws://localhost:3001
MCP_SERVER_PORT=3001
MCP_SERVER_HOST=localhost
MCP_AUTH_REQUIRED=true
```

#### Step 4: TypeScript 타입 정의 (선택사항)
`src/mcp/types/index.d.ts`:
```typescript
export interface MCPToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PropertyTool {
  id: string;
  address: string;
  price: number;
  type: 'apartment' | 'house' | 'villa' | 'officetel';
  status: 'available' | 'pending' | 'sold';
}
```

### Phase 2: 서버 구현 (Day 1 - 오후)

#### Step 1: Supabase 통합 헬퍼
`src/mcp/server/supabase-helper.js`:
```javascript
import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}
```

#### Step 2: MCP 서버 생성
파일들을 순차적으로 생성:

1. `src/mcp/server/tools.js` - 도구 정의
2. `src/mcp/server/resources.js` - 리소스 정의
3. `src/mcp/server/server.js` - 메인 서버
4. `src/mcp/index.js` - 엔트리 포인트

#### Step 3: 서버 실행 스크립트
`package.json` 업데이트:
```json
{
  "scripts": {
    "mcp:server": "node src/mcp/index.js",
    "mcp:dev": "concurrently \"npm run dev\" \"npm run mcp:server\"",
    "dev:all": "concurrently \"npm run dev\" \"npm run mcp:server\" \"npm run supabase:local\""
  }
}
```

### Phase 3: 클라이언트 통합 (Day 2 - 오전)

#### Step 1: MCP 클라이언트 훅
다음 파일들을 생성:
1. `src/hooks/useMCPClient.js`
2. `src/hooks/useMCPTools.js`
3. `src/hooks/useMCPResources.js`

#### Step 2: 서비스 레이어
1. `src/services/mcp/propertyService.js`
2. `src/services/mcp/analyticsService.js`
3. `src/services/mcp/fileService.js`

#### Step 3: React Context 설정
`src/context/MCPContext.jsx`:
```javascript
import React, { createContext, useContext } from 'react';
import { useMCPClient } from '../hooks/useMCPClient';

const MCPContext = createContext(null);

export function MCPProvider({ children }) {
  const mcpClient = useMCPClient();
  
  return (
    <MCPContext.Provider value={mcpClient}>
      {children}
    </MCPContext.Provider>
  );
}

export const useMCP = () => {
  const context = useContext(MCPContext);
  if (!context) {
    throw new Error('useMCP must be used within MCPProvider');
  }
  return context;
};
```

### Phase 4: UI 컴포넌트 업데이트 (Day 2 - 오후)

#### Step 1: MCP 상태 표시기
`src/components/common/MCPStatus.jsx`:
```javascript
import React from 'react';
import { useMCP } from '../../context/MCPContext';

export function MCPStatus() {
  const { connected, error } = useMCP();
  
  return (
    <div className={`mcp-status ${connected ? 'connected' : 'disconnected'}`}>
      {connected ? '🟢 MCP 연결됨' : '🔴 MCP 연결 끊김'}
      {error && <span className="error-msg">{error.message}</span>}
    </div>
  );
}
```

#### Step 2: 기존 컴포넌트 업데이트
업데이트할 컴포넌트:
1. `PropertyList.jsx` - MCP 도구 사용
2. `PropertyDetail.jsx` - 실시간 업데이트
3. `Dashboard.jsx` - 통계 리소스 사용

#### Step 3: App.jsx 업데이트
```javascript
import { MCPProvider } from './context/MCPContext';

function App() {
  return (
    <MCPProvider>
      {/* 기존 앱 구조 */}
    </MCPProvider>
  );
}
```

### Phase 5: 테스트 및 디버깅 (Day 3)

#### Step 1: 단위 테스트
`tests/mcp/server.test.js`:
```javascript
import { describe, it, expect } from 'vitest';
import { createMCPServer } from '../../src/mcp/server/server';

describe('MCP Server', () => {
  it('should create server instance', () => {
    const server = createMCPServer();
    expect(server).toBeDefined();
  });
  
  it('should have required tools', () => {
    const server = createMCPServer();
    expect(server.tools).toHaveProperty('get_properties');
    expect(server.tools).toHaveProperty('create_property');
  });
});
```

#### Step 2: 통합 테스트
`tests/e2e/mcp-integration.spec.js`:
```javascript
import { test, expect } from '@playwright/test';

test('MCP integration', async ({ page }) => {
  await page.goto('/');
  
  // MCP 연결 상태 확인
  await expect(page.locator('.mcp-status')).toContainText('MCP 연결됨');
  
  // 도구 호출 테스트
  await page.click('[data-testid="load-properties"]');
  await expect(page.locator('.property-list')).toBeVisible();
});
```

#### Step 3: 디버깅 도구
`src/utils/mcpDebugger.js`:
```javascript
export class MCPDebugger {
  static logToolCall(toolName, params, result) {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔧 MCP Tool: ${toolName}`);
      console.log('Parameters:', params);
      console.log('Result:', result);
      console.groupEnd();
    }
  }
  
  static logConnection(status) {
    console.log(`🌐 MCP Connection: ${status}`);
  }
}
```

### Phase 6: 배포 준비

#### Step 1: 프로덕션 설정
`mcp.config.production.js`:
```javascript
export default {
  server: {
    transport: 'websocket',
    host: process.env.MCP_PROD_HOST,
    port: process.env.MCP_PROD_PORT,
    ssl: true
  },
  security: {
    allowedOrigins: ['https://gma3561.github.io'],
    requireAuth: true,
    rateLimit: {
      windowMs: 60000,
      max: 100
    }
  }
};
```

#### Step 2: 도커 설정 (선택사항)
`Dockerfile.mcp`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/mcp ./src/mcp
EXPOSE 3001
CMD ["node", "src/mcp/index.js"]
```

#### Step 3: GitHub Actions 업데이트
`.github/workflows/deploy.yml`:
```yaml
- name: Build MCP Server
  run: |
    npm run build
    npm run mcp:build
    
- name: Deploy MCP
  run: |
    # MCP 서버 배포 스크립트
```

## 실행 체크리스트

### 개발 환경
- [ ] MCP 패키지 설치 완료
- [ ] 환경 변수 설정 완료
- [ ] 서버 파일 생성 완료
- [ ] 클라이언트 훅 생성 완료
- [ ] 서비스 레이어 구현 완료

### 기능 구현
- [ ] 매물 조회 도구 작동
- [ ] 매물 생성 도구 작동
- [ ] 상태 업데이트 도구 작동
- [ ] 검색 기능 작동
- [ ] 통계 리소스 작동

### 통합 테스트
- [ ] MCP 서버 연결 테스트
- [ ] 도구 호출 테스트
- [ ] 에러 처리 테스트
- [ ] 성능 테스트
- [ ] 보안 테스트

### 배포 준비
- [ ] 프로덕션 설정 완료
- [ ] 문서 업데이트 완료
- [ ] 배포 스크립트 준비
- [ ] 모니터링 설정

## 예상 문제점 및 해결 방안

### 1. CORS 문제
- 해결: 서버에서 적절한 CORS 헤더 설정
- 대안: 프록시 서버 사용

### 2. WebSocket 연결 실패
- 해결: 폴백으로 HTTP 폴링 구현
- 대안: Server-Sent Events 사용

### 3. 인증 토큰 관리
- 해결: 토큰 자동 갱신 로직 구현
- 대안: 세션 기반 인증 사용

### 4. 성능 저하
- 해결: 결과 캐싱 구현
- 대안: 배치 요청 처리

## 성공 지표
- MCP 서버 가동률 99.9% 이상
- 평균 응답 시간 100ms 이하
- 동시 연결 100개 이상 지원
- 에러율 0.1% 이하

## 다음 단계
1. AI 기반 매물 추천 시스템 구현
2. 자연어 검색 기능 추가
3. 실시간 알림 시스템 구축
4. 분석 대시보드 고도화