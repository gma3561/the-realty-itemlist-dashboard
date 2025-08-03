#!/bin/bash

# macOS Keychain API Key Manager
# 모든 API 키와 암호를 안전하게 관리

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수들
print_header() {
    echo -e "${BLUE}🔐 Keychain API Manager${NC}"
    echo "=========================="
}

# API 키 저장
store_key() {
    local service=$1
    local account=$2
    local description=$3
    
    echo -e "${YELLOW}💾 $description 저장${NC}"
    echo "서비스: $service"
    echo "계정: $account"
    echo -n "키/암호를 입력하세요 (입력이 숨겨집니다): "
    read -s password
    echo
    
    # 기존 키 삭제 (있다면)
    security delete-generic-password -a "$account" -s "$service" 2>/dev/null || true
    
    # 새 키 저장
    security add-generic-password -a "$account" -s "$service" -w "$password" -D "API Key"
    
    echo -e "${GREEN}✅ 저장 완료!${NC}"
    echo
}

# API 키 조회
get_key() {
    local service=$1
    local account=$2
    
    echo -e "${BLUE}🔍 키 조회: $service ($account)${NC}"
    
    if security find-generic-password -a "$account" -s "$service" -w 2>/dev/null; then
        echo -e "${GREEN}✅ 키 조회 성공${NC}"
    else
        echo -e "${RED}❌ 키를 찾을 수 없습니다${NC}"
        return 1
    fi
}

# API 키 삭제
delete_key() {
    local service=$1
    local account=$2
    
    echo -e "${RED}🗑️  키 삭제: $service ($account)${NC}"
    
    if security delete-generic-password -a "$account" -s "$service" 2>/dev/null; then
        echo -e "${GREEN}✅ 삭제 완료${NC}"
    else
        echo -e "${RED}❌ 키를 찾을 수 없습니다${NC}"
    fi
}

# 모든 키 목록
list_keys() {
    echo -e "${BLUE}📋 저장된 API 키 목록${NC}"
    echo "=========================="
    
    # Keychain에서 API Key 타입의 항목들 찾기
    security dump-keychain | grep -A 1 -B 1 "API Key\|github\|supabase\|openai\|anthropic" || echo "저장된 키가 없습니다."
}

# 환경 변수 생성
create_env_file() {
    local env_file="$1"
    
    echo -e "${YELLOW}📄 환경 변수 파일 생성: $env_file${NC}"
    
    cat > "$env_file" << 'EOF'
#!/bin/bash
# Auto-generated from Keychain
# Source this file to load API keys from Keychain

# GitHub
export GITHUB_PERSONAL_ACCESS_TOKEN=$(security find-generic-password -a "github-mcp" -s "github-token" -w 2>/dev/null || echo "")

# Supabase
export VITE_SUPABASE_URL=$(security find-generic-password -a "supabase" -s "supabase-url" -w 2>/dev/null || echo "")
export VITE_SUPABASE_ANON_KEY=$(security find-generic-password -a "supabase" -s "supabase-anon-key" -w 2>/dev/null || echo "")

# OpenAI
export OPENAI_API_KEY=$(security find-generic-password -a "openai" -s "openai-api-key" -w 2>/dev/null || echo "")

# Anthropic
export ANTHROPIC_API_KEY=$(security find-generic-password -a "anthropic" -s "anthropic-api-key" -w 2>/dev/null || echo "")

# Brave Search
export BRAVE_API_KEY=$(security find-generic-password -a "brave" -s "brave-api-key" -w 2>/dev/null || echo "")

# Slack
export SLACK_BOT_TOKEN=$(security find-generic-password -a "slack" -s "slack-bot-token" -w 2>/dev/null || echo "")
export SLACK_TEAM_ID=$(security find-generic-password -a "slack" -s "slack-team-id" -w 2>/dev/null || echo "")

# 로드 확인
echo "🔑 Keychain에서 API 키를 로드했습니다."
EOF

    chmod +x "$env_file"
    echo -e "${GREEN}✅ 환경 변수 파일 생성 완료${NC}"
    echo "사용법: source $env_file"
}

# Claude Desktop 설정 업데이트
update_claude_config() {
    local config_file="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    local backup_file="${config_file}.backup.$(date +%Y%m%d_%H%M%S)"
    
    echo -e "${YELLOW}⚙️  Claude Desktop 설정 업데이트${NC}"
    
    # 백업 생성
    if [ -f "$config_file" ]; then
        cp "$config_file" "$backup_file"
        echo "백업 생성: $backup_file"
    fi
    
    # GitHub 토큰 가져오기
    local github_token=$(security find-generic-password -a "github-mcp" -s "github-token" -w 2>/dev/null || echo "")
    
    if [ -z "$github_token" ]; then
        echo -e "${RED}❌ GitHub 토큰이 Keychain에 없습니다. 먼저 저장하세요.${NC}"
        return 1
    fi
    
    # 설정 파일에서 토큰 교체
    if [ -f "$config_file" ]; then
        sed -i.bak "s/your-github-token-here/$github_token/g" "$config_file"
        rm "${config_file}.bak"
        echo -e "${GREEN}✅ Claude Desktop 설정 업데이트 완료${NC}"
        echo "Claude Desktop을 재시작하세요."
    else
        echo -e "${RED}❌ Claude Desktop 설정 파일을 찾을 수 없습니다${NC}"
    fi
}

# 메인 메뉴
show_menu() {
    print_header
    echo "1. API 키 저장"
    echo "2. API 키 조회"
    echo "3. API 키 삭제"
    echo "4. 저장된 키 목록"
    echo "5. 환경 변수 파일 생성"
    echo "6. Claude Desktop 설정 업데이트"
    echo "7. 빠른 설정 (주요 API 키들)"
    echo "0. 종료"
    echo
    echo -n "선택하세요 (0-7): "
}

# 빠른 설정
quick_setup() {
    echo -e "${BLUE}🚀 빠른 설정 시작${NC}"
    echo "주요 API 키들을 순서대로 설정합니다."
    echo
    
    # GitHub
    store_key "github-token" "github-mcp" "GitHub Personal Access Token"
    
    # Supabase
    store_key "supabase-url" "supabase" "Supabase URL"
    store_key "supabase-anon-key" "supabase" "Supabase Anonymous Key"
    
    echo -e "${GREEN}🎉 빠른 설정 완료!${NC}"
    echo "다른 API 키들은 메뉴에서 개별적으로 추가하세요."
}

# 메인 실행
main() {
    while true; do
        show_menu
        read -r choice
        
        case $choice in
            1)
                echo
                echo "=== API 키 저장 ==="
                echo "1. GitHub Token"
                echo "2. Supabase URL"
                echo "3. Supabase Anon Key"
                echo "4. OpenAI API Key"
                echo "5. Anthropic API Key"
                echo "6. Brave Search API Key"
                echo "7. 사용자 정의"
                echo -n "선택하세요: "
                read -r api_choice
                
                case $api_choice in
                    1) store_key "github-token" "github-mcp" "GitHub Personal Access Token" ;;
                    2) store_key "supabase-url" "supabase" "Supabase URL" ;;
                    3) store_key "supabase-anon-key" "supabase" "Supabase Anonymous Key" ;;
                    4) store_key "openai-api-key" "openai" "OpenAI API Key" ;;
                    5) store_key "anthropic-api-key" "anthropic" "Anthropic API Key" ;;
                    6) store_key "brave-api-key" "brave" "Brave Search API Key" ;;
                    7) 
                        echo -n "서비스 이름: "; read -r service
                        echo -n "계정 이름: "; read -r account
                        echo -n "설명: "; read -r desc
                        store_key "$service" "$account" "$desc"
                        ;;
                esac
                ;;
            2)
                echo -n "서비스 이름: "; read -r service
                echo -n "계정 이름: "; read -r account
                get_key "$service" "$account"
                ;;
            3)
                echo -n "서비스 이름: "; read -r service
                echo -n "계정 이름: "; read -r account
                delete_key "$service" "$account"
                ;;
            4)
                list_keys
                ;;
            5)
                echo -n "환경 변수 파일 경로 (기본: ~/.env-keychain): "
                read -r env_path
                env_path=${env_path:-"$HOME/.env-keychain"}
                create_env_file "$env_path"
                ;;
            6)
                update_claude_config
                ;;
            7)
                quick_setup
                ;;
            0)
                echo -e "${GREEN}👋 안녕히 가세요!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ 잘못된 선택입니다${NC}"
                ;;
        esac
        
        echo
        echo "계속하려면 Enter를 누르세요..."
        read -r
        clear
    done
}

# 스크립트 시작
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi