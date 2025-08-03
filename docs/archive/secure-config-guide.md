# 안전한 API 키 및 암호 관리 가이드

## 1. 위험한 방법 (절대 하지 마세요)
- ❌ Git에 커밋
- ❌ 코드에 하드코딩
- ❌ 공개 폴더에 저장
- ❌ 클라우드 동기화 폴더에 저장

## 2. 권장 방법

### A. macOS Keychain (가장 안전)
```bash
# GitHub 토큰 저장
security add-generic-password -a "github-mcp" -s "github-token" -w "ghp_xxxxxxxxxxxx"

# 토큰 조회
security find-generic-password -a "github-mcp" -s "github-token" -w

# 토큰 삭제
security delete-generic-password -a "github-mcp" -s "github-token"
```

### B. 환경 변수 파일
1. `.env` 파일 생성 (프로젝트 루트)
2. `.gitignore`에 `.env` 추가
3. `.env.example`로 템플릿 제공

```bash
# .env 파일 생성
cp .env.example .env
# 실제 값으로 수정
```

### C. 1Password/Bitwarden 연동
```bash
# 1Password에서 직접 가져오기
export GITHUB_TOKEN=$(op item get "GitHub Token" --fields password)
```

## 3. Claude Desktop MCP 설정

### 환경 변수 사용:
```json
{
  "github": {
    "command": "bash",
    "args": ["-c", "source ~/.env && npx -y @modelcontextprotocol/server-github"],
    "env": {}
  }
}
```

### 또는 스크립트 사용:
```bash
#!/bin/bash
# ~/.local/bin/github-mcp.sh
source ~/.env
npx -y @modelcontextprotocol/server-github
```

## 4. 보안 체크리스트
- [ ] `.env` 파일이 `.gitignore`에 포함됨
- [ ] API 키를 정기적으로 회전
- [ ] 최소 권한 원칙 적용
- [ ] 사용하지 않는 토큰 즉시 삭제
- [ ] 토큰 만료일 설정

## 5. 추천 도구
1. **1Password** - 가장 사용하기 쉬움
2. **Bitwarden** - 오픈소스
3. **macOS Keychain** - 기본 내장
4. **HashiCorp Vault** - 기업용