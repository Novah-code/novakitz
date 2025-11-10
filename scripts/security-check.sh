#!/bin/bash

# 🔐 보안 점검 스크립트
# 배포 전에 이 스크립트를 실행하여 민감한 정보가 노출되지 않았는지 확인하세요

set -e

echo "================================"
echo "🔐 보안 점검 스크립트 시작"
echo "================================"
echo ""

ISSUES_FOUND=0

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 환경 파일 확인
echo "✓ 1단계: 환경 파일 추적 상태 확인"
echo "-----------------------------------"

if git ls-files | grep -E "\.env(\.local|\.production|\.development)$" > /dev/null; then
  echo -e "${RED}❌ 환경 파일이 git에 추적되고 있습니다!${NC}"
  git ls-files | grep -E "\.env"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo -e "${GREEN}✅ 환경 파일이 제대로 무시되고 있습니다${NC}"
fi
echo ""

# 2. 하드코딩된 API 키 검색
echo "✓ 2단계: 하드코딩된 API 키 검색"
echo "-----------------------------------"

API_KEYS_FOUND=0

# 다양한 API 키 패턴 검색
if grep -r "sk-" src app --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "process.env\|node_modules" | grep -E "sk-[A-Za-z0-9]{20,}"; then
  echo -e "${RED}❌ OpenAI API 키 같은 패턴 발견:${NC}"
  API_KEYS_FOUND=$((API_KEYS_FOUND + 1))
fi

if grep -r "AKIA" src app --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "process.env\|node_modules"; then
  echo -e "${RED}❌ AWS 접근 키 패턴 발견:${NC}"
  API_KEYS_FOUND=$((API_KEYS_FOUND + 1))
fi

if grep -r "ghp_" src app --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "process.env\|node_modules"; then
  echo -e "${RED}❌ GitHub 토큰 패턴 발견:${NC}"
  API_KEYS_FOUND=$((API_KEYS_FOUND + 1))
fi

if [ $API_KEYS_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ 하드코딩된 API 키가 없습니다${NC}"
else
  ISSUES_FOUND=$((ISSUES_FOUND + API_KEYS_FOUND))
fi
echo ""

# 3. 데이터베이스 비밀번호 검색
echo "✓ 3단계: 하드코딩된 데이터베이스 비밀번호 검색"
echo "-------------------------------------------"

PASSWORD_FOUND=0

if grep -rE "password\s*[:=]\s*['\"].*['\"]" src app --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "process.env\|node_modules\|\/\/\|\/\*"; then
  echo -e "${RED}❌ 하드코딩된 비밀번호 발견:${NC}"
  grep -rE "password\s*[:=]\s*['\"].*['\"]" src app --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "process.env\|node_modules\|\/\/\|\/\*"
  PASSWORD_FOUND=$((PASSWORD_FOUND + 1))
fi

if [ $PASSWORD_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ 하드코딩된 비밀번호가 없습니다${NC}"
else
  ISSUES_FOUND=$((ISSUES_FOUND + PASSWORD_FOUND))
fi
echo ""

# 4. 환경 변수 사용 현황 확인
echo "✓ 4단계: 환경 변수 사용 현황"
echo "----------------------------"

echo -e "${GREEN}서버 측 민감한 변수 (클라이언트에 노출 금지):${NC}"
echo "  • GEMINI_API_KEY"
echo "  • SUPABASE_SERVICE_ROLE_KEY"
echo "  • GUMROAD_WEBHOOK_SECRET"
echo "  • GUMROAD_API_SECRET"
echo "  • GMAIL_APP_PASSWORD"
echo "  • SENDGRID_API_KEY"
echo ""

echo -e "${GREEN}클라이언트에 안전한 변수 (NEXT_PUBLIC_):${NC}"
echo "  • NEXT_PUBLIC_SUPABASE_URL"
echo "  • NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  • NEXT_PUBLIC_GUMROAD_PRODUCT_URL"
echo ""

# 클라이언트 코드에서 민감한 변수 사용 확인
if grep -r "GEMINI_API_KEY\|SUPABASE_SERVICE_ROLE\|GUMROAD_WEBHOOK\|GUMROAD_API_SECRET" src/components --include="*.tsx" --include="*.ts" 2>/dev/null; then
  echo -e "${RED}❌ 클라이언트 코드에서 민감한 변수를 참조합니다:${NC}"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo -e "${GREEN}✅ 민감한 변수가 클라이언트 코드에 노출되지 않습니다${NC}"
fi
echo ""

# 5. 이전 커밋 검사
echo "✓ 5단계: Git 히스토리 검사"
echo "------------------------"

HISTORY_ISSUES=0

if git log --all --oneline -S "SUPABASE_SERVICE_ROLE_KEY" 2>/dev/null | head -5 | grep -q "^"; then
  echo -e "${YELLOW}⚠️  경고: SUPABASE_SERVICE_ROLE_KEY가 커밋 히스토리에 있을 수 있습니다${NC}"
  echo "   (단순히 환경 변수 검색일 수 있습니다)"
  HISTORY_ISSUES=$((HISTORY_ISSUES + 1))
fi

if [ $HISTORY_ISSUES -eq 0 ]; then
  echo -e "${GREEN}✅ 커밋 히스토리에 명백한 문제가 없습니다${NC}"
fi
echo ""

# 6. .gitignore 확인
echo "✓ 6단계: .gitignore 확인"
echo "------------------------"

GITIGNORE_ISSUES=0

if git check-ignore .env.local .env.production .env.development > /dev/null 2>&1; then
  echo -e "${GREEN}✅ .env 파일들이 .gitignore에 포함되어 있습니다${NC}"
else
  echo -e "${RED}❌ .env 파일이 .gitignore에 없습니다!${NC}"
  GITIGNORE_ISSUES=$((GITIGNORE_ISSUES + 1))
fi

if git check-ignore ".secrets" "secrets/" "*.key" "*.pem" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ 보안 파일들이 .gitignore에 포함되어 있습니다${NC}"
else
  echo -e "${YELLOW}⚠️  경고: 일부 보안 파일 패턴이 .gitignore에 없을 수 있습니다${NC}"
fi

ISSUES_FOUND=$((ISSUES_FOUND + GITIGNORE_ISSUES))
echo ""

# 최종 결과
echo "================================"
if [ $ISSUES_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ 보안 점검 완료: 문제 없음${NC}"
  echo "================================"
  exit 0
else
  echo -e "${RED}❌ 보안 점검 완료: $ISSUES_FOUND개의 문제 발견${NC}"
  echo "================================"
  echo ""
  echo -e "${RED}경고: 위의 문제들을 해결한 후 배포하세요!${NC}"
  exit 1
fi
