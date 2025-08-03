# 🔐 Keychain 기반 보안 시스템

macOS Keychain을 중심으로 한 완전한 API 키 및 암호 관리 시스템입니다.

## 🚀 빠른 시작

### 1. Keychain Manager 실행
```bash
./keychain-manager.sh
```

### 2. 빠른 설정 (메뉴에서 7번 선택)
- GitHub Personal Access Token
- Supabase URL
- Supabase Anonymous Key

### 3. Claude Desktop 설정 업데이트
```bash
./update-claude-config.sh
```

## 📋 주요 기능

### 🔑 API 키 관리
- **저장**: 안전한 암호화 저장
- **조회**: 필요할 때만 접근
- **삭제**: 사용하지 않는 키 제거
- **목록**: 저장된 키 확인

### 🤖 자동화
- **환경 변수**: Keychain에서 자동 로드
- **MCP 서버**: 키를 자동으로 가져와 사용
- **Claude Desktop**: 설정 파일 자동 업데이트

## 🔧 사용법

### 개별 키 저장
```bash
# GitHub Token 저장
security add-generic-password -a "github-mcp" -s "github-token" -w "ghp_xxxxxxxxxxxx"

# Supabase URL 저장
security add-generic-password -a "supabase" -s "supabase-url" -w "https://your-project.supabase.co"

# Supabase Key 저장
security add-generic-password -a "supabase" -s "supabase-anon-key" -w "eyJ..."
```

### 키 조회
```bash
# GitHub Token 조회
security find-generic-password -a "github-mcp" -s "github-token" -w

# 환경 변수로 로드
export GITHUB_TOKEN=$(security find-generic-password -a "github-mcp" -s "github-token" -w)
```

### 키 삭제
```bash
# GitHub Token 삭제
security delete-generic-password -a "github-mcp" -s "github-token"
```

## 🎯 지원하는 서비스

### 현재 설정된 서비스들:
- **GitHub**: Personal Access Token
- **Supabase**: URL, Anonymous Key
- **OpenAI**: API Key
- **Anthropic**: API Key
- **Brave Search**: API Key
- **Slack**: Bot Token, Team ID

### 새 서비스 추가:
```bash
# 사용자 정의 서비스
security add-generic-password -a "account-name" -s "service-name" -w "api-key"
```

## 🔄 자동 로드 시스템

### MCP 서버에서 자동 사용:
```javascript
// Keychain에서 자동으로 키를 가져옴
const apiKey = getFromKeychain('service-name', 'account-name');
```

### 환경 변수 파일 생성:
```bash
# ~/.env-keychain 파일 생성
./keychain-manager.sh
# 메뉴에서 5번 선택

# 사용법
source ~/.env-keychain
echo $GITHUB_PERSONAL_ACCESS_TOKEN
```

## 🛡️ 보안 장점

### 1. **암호화 저장**
- macOS가 제공하는 강력한 암호화
- 하드웨어 보안 모듈 활용 (T2/M1 칩)

### 2. **접근 제어**
- 사용자 인증 필요
- 앱별 접근 권한 관리

### 3. **동기화 안전**
- iCloud Keychain으로 안전한 동기화
- 기기 간 자동 동기화

### 4. **Git 안전성**
- 소스 코드에 하드코딩 없음
- .env 파일 실수로 커밋할 위험 없음

## 📱 Claude Desktop 통합

### 설정된 MCP 서버들:
1. **Obsidian**: 노트 관리
2. **Playwright**: 브라우저 자동화  
3. **GitHub**: 코드 저장소 관리 ✨
4. **Realty Dashboard**: 부동산 관리 ✨
5. **Filesystem**: 파일 시스템 접근 ✨

### 테스트 명령어들:
```
"GitHub에서 내 레포지토리 목록을 보여줘"
"Documents 폴더의 파일들을 확인해줘"
"매물 목록을 조회해줘"
"강남구 매물을 검색해줘"
```

## ⚙️ 고급 설정

### 환경별 키 관리:
```bash
# 개발 환경
security add-generic-password -a "dev" -s "supabase-url" -w "dev-url"

# 프로덕션 환경  
security add-generic-password -a "prod" -s "supabase-url" -w "prod-url"
```

### 스크립트에서 사용:
```bash
#!/bin/bash
# 스크립트에서 키 로드
API_KEY=$(security find-generic-password -a "service" -s "api-key" -w)
curl -H "Authorization: Bearer $API_KEY" https://api.example.com
```

## 🔍 문제 해결

### 키를 찾을 수 없는 경우:
```bash
# 저장된 키 확인
security dump-keychain | grep -i "service-name"

# 다시 저장
./keychain-manager.sh
```

### Claude Desktop에서 MCP 서버가 작동하지 않는 경우:
1. Keychain에 필요한 키가 있는지 확인
2. Claude Desktop 재시작
3. 설정 파일 백업 확인: `~/Library/Application Support/Claude/claude_desktop_config.json.backup.*`

### 권한 문제:
```bash
# Keychain 접근 권한 재설정
security unlock-keychain ~/Library/Keychains/login.keychain
```

## 📚 참고 자료

- [macOS Security Command Line](https://ss64.com/osx/security.html)
- [Keychain Services Programming Guide](https://developer.apple.com/documentation/security/keychain_services)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io)

---

이제 **모든 API 키와 암호가 안전하게 관리됩니다!** 🎉