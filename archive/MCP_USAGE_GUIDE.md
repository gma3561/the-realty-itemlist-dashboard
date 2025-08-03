# MCP (Model Context Protocol) 사용 가이드

## 개요
이 프로젝트는 MCP를 통해 AI 모델과 통합되어 매물 관리 기능을 제공합니다.

## MCP 서버 실행

### 1. 독립 실행
```bash
npm run mcp:server
```

### 2. 개발 서버와 함께 실행
```bash
npm run mcp:dev
```

## Claude Desktop 연동

### 1. Claude Desktop 설정
Claude Desktop의 설정 파일에 다음 내용을 추가하세요:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "realty-dashboard": {
      "command": "node",
      "args": ["/path/to/your/project/src/mcp/mcp-server-final.mjs"],
      "env": {}
    }
  }
}
```

### 2. Claude Desktop 재시작
설정 파일을 수정한 후 Claude Desktop을 재시작하세요.

## 사용 가능한 도구

### 1. get_properties
매물 목록을 조회합니다.

**파라미터:**
- `status` (선택): 'available', 'pending', 'sold' 중 하나
- `limit` (선택): 조회할 매물 수 (기본값: 10)

**사용 예시:**
```
"매물 목록을 보여줘"
"판매 가능한 매물 5개를 조회해줘"
"계약 진행 중인 매물들을 확인해줘"
```

### 2. search_properties
매물을 검색합니다.

**파라미터:**
- `query` (선택): 검색어 (주소, 설명에서 검색)
- `minPrice` (선택): 최소 가격
- `maxPrice` (선택): 최대 가격

**사용 예시:**
```
"강남구에 있는 매물을 검색해줘"
"1억에서 2억 사이의 매물을 찾아줘"
"아파트를 검색해줘"
```

## 사용 가능한 리소스

### property_statistics
매물 통계 정보를 제공합니다.

**사용 예시:**
```
"매물 통계를 보여줘"
"현재 등록된 매물들의 상태별 통계를 확인해줘"
```

## 웹 클라이언트 사용

### 1. MCP 상태 확인
개발 환경에서는 화면 우측 하단에 MCP 연결 상태가 표시됩니다.
- 🟢 연결됨: MCP 서버와 정상 연결
- 🔴 연결 끊김: MCP 서버 연결 실패
- 🟡 연결 중: 연결 시도 중

### 2. 컴포넌트에서 MCP 사용
```javascript
import { useMCP } from '../context/MCPContext';

function MyComponent() {
  const { callTool, connected } = useMCP();
  
  const loadProperties = async () => {
    if (!connected) return;
    
    const result = await callTool('get_properties', {
      status: 'available',
      limit: 20
    });
    
    console.log(result);
  };
}
```

## 문제 해결

### MCP 서버가 시작되지 않을 때
1. Node.js 버전 확인 (18.0 이상 필요)
2. 의존성 재설치: `npm install`
3. 서버 로그 확인

### Claude Desktop에서 연결되지 않을 때
1. 설정 파일 경로 확인
2. 프로젝트 경로가 정확한지 확인
3. Claude Desktop 재시작

### 웹 클라이언트에서 연결되지 않을 때
1. MCP 서버가 실행 중인지 확인
2. 브라우저 콘솔에서 에러 확인
3. 개발 서버 재시작: `npm run dev`

## 보안 고려사항
- MCP 서버는 로컬에서만 실행됩니다
- 프로덕션 환경에서는 MCP 클라이언트가 비활성화됩니다
- Supabase 인증을 통해 데이터 접근이 제어됩니다