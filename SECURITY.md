# 🔐 보안 가이드

이 문서는 꿈 일기(Nova Dream Journal) 프로젝트의 보안 정책을 설명합니다.

## ⚠️ 절대 공개하면 안 되는 정보

다음 항목들은 **절대로 공개 저장소에 커밋하면 안 됩니다**:

### 1. 환경 변수 파일
```
❌ .env.local          (로컬 개발 환경 변수)
❌ .env.production     (프로덕션 환경 변수)
❌ .env.development    (개발 환경 변수)
```

### 2. API 키 및 비밀번호
```
❌ GEMINI_API_KEY              (Google Gemini API 키)
❌ SUPABASE_SERVICE_ROLE_KEY   (Supabase 서버 역할 키)
❌ GUMROAD_WEBHOOK_SECRET      (Gumroad 웹훅 시크릿)
❌ GUMROAD_API_SECRET          (Gumroad API 시크릿)
❌ GMAIL_APP_PASSWORD          (Gmail 앱 비밀번호)
❌ SENDGRID_API_KEY            (SendGrid API 키)
```

### 3. 데이터베이스 정보
```
❌ 데이터베이스 비밀번호
❌ 데이터베이스 호스트명
❌ 서비스 로드 키
```

### 4. OAuth 인증 정보
```
❌ OAuth 클라이언트 시크릿
❌ 개인 액세스 토큰
```

### 5. 개인정보
```
❌ 사용자 이메일 (로그 파일에서)
❌ 개인 전화번호
❌ 신용카드 정보
```

## ✅ 올바른 보안 관행

### 1. 환경 변수 사용

**좋은 예시 ✅**
```typescript
// app/api/gumroad-webhook/route.ts
const webhookSecret = process.env.GUMROAD_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.warn('⚠️ GUMROAD_WEBHOOK_SECRET not configured');
  return true; // 개발 모드에서만 허용
}
```

**나쁜 예시 ❌**
```typescript
// 절대 이렇게 하지 마세요!
const webhookSecret = 'my_super_secret_key_12345';
```

### 2. 공개/비공개 변수 구분

**클라이언트에 공개되는 변수 (NEXT_PUBLIC_로 시작)**
```env
# ✅ 안전 - 클라이언트 번들에 포함됨
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJXX...
NEXT_PUBLIC_GUMROAD_PRODUCT_URL=https://gumroad.com/l/premium
```

**서버 전용 변수 (NEXT_PUBLIC 없음)**
```env
# ❌ 절대로 NEXT_PUBLIC으로 시작하면 안 됨!
GEMINI_API_KEY=ai_xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJX...
GUMROAD_WEBHOOK_SECRET=whsec_xxxxx
```

### 3. .gitignore 설정

```gitignore
# 🔐 환경 변수 파일 (절대로 커밋 금지)
.env
.env.local
.env.production
.env.development
.env.*.local
.env.*.production.local
.env.*.development.local

# 🔐 보안 파일
.secrets
secrets/
*.key
*.pem
```

현재 `.gitignore` 상태 확인:
```bash
git check-ignore .env.local
# 출력: .env.local ✅ 무시됨
```

## 🔍 보안 점검 체크리스트

배포 전에 반드시 확인하세요:

### 코드 검사
- [ ] 하드코딩된 API 키가 없는가?
- [ ] 비밀번호가 코드에 노출되어 있지 않은가?
- [ ] OAuth 토큰이 포함되어 있지 않은가?
- [ ] 개인 데이터(이메일, 전화번호)가 없는가?

### 환경 변수
- [ ] 모든 민감한 정보가 환경 변수로 관리되는가?
- [ ] NEXT_PUBLIC 변수는 정말로 공개 가능한가?
- [ ] 각 환경(dev, prod)에서 올바른 값으로 설정되었는가?

### Git 저장소
- [ ] `.env.local` 파일이 추적되지 않는가?
- [ ] 이전 커밋에 민감한 정보가 없는가?
- [ ] `.gitignore`가 제대로 설정되었는가?

### API 보안
```bash
# 서명 검증 확인
grep -r "verifyGumroadSignature" app/api/gumroad-webhook/
```

## 🚀 Vercel 배포 시

### 환경 변수 설정

Vercel 대시보드에서 다음을 설정하세요:

```
Settings → Environment Variables
```

**프로덕션 환경**
- GEMINI_API_KEY: `your_gemini_key`
- SUPABASE_SERVICE_ROLE_KEY: `your_service_key`
- GUMROAD_WEBHOOK_SECRET: `your_webhook_secret`
- GUMROAD_API_SECRET: `your_api_secret`
- GMAIL_APP_PASSWORD: `your_gmail_password`
- SENDGRID_API_KEY: `your_sendgrid_key`

**자동으로 설정되는 변수**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_GUMROAD_PRODUCT_URL

### 배포 전 확인
```bash
# 1. 모든 파일에서 API 키 검색
grep -r "sk-\|AKIA\|GUMROAD_" src app --include="*.ts" --include="*.tsx"
# 결과가 없어야 함 ✅

# 2. 환경 변수가 제대로 설정되었는지 확인
env | grep -E "GEMINI|SUPABASE_SERVICE|GUMROAD_WEBHOOK"
# 모두 설정되어야 함

# 3. git 상태 확인
git status
# .env 파일이 표시되지 않아야 함
```

## 📋 환경 변수 예시 (.env.example)

새로운 개발자가 쉽게 시작할 수 있도록 `.env.example`을 유지하세요:

```env
# ✅ .env.example (커밋해도 됨)
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GUMROAD_WEBHOOK_SECRET=your_webhook_secret
```

새로운 개발자는 다음 명령으로 시작:
```bash
cp .env.example .env.local
# 그 후 .env.local에 실제 값 입력
```

## 🔒 보안 관련 라이브러리

현재 사용 중인 보안 라이브러리:

- **Supabase**: JWT 토큰 기반 인증
  - RLS(Row Level Security) 정책으로 데이터 접근 제어
  - 서비스 역할 키는 서버에서만 사용

- **Gumroad**: HMAC 서명 검증
  - 웹훅 안전성 확인
  - 라이센스 검증

## 🚨 보안 위반 시 조치

만약 민감한 정보가 실수로 커밋되었다면:

### 1. 즉시 조치
```bash
# 커밋 히스토리에서 파일 제거 (주의: 강제 푸시 필요)
git filter-branch --tree-filter 'rm -f .env.local' HEAD

# 또는 git-filter-repo 사용
git filter-repo --invert-paths --path .env.local
```

### 2. 모든 키 교체
- API 키 재발급
- OAuth 토큰 재설정
- 데이터베이스 비밀번호 변경

### 3. 팀에 공지
- 모든 팀원에게 알림
- 새로운 환경 변수 배포

## 📖 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [12 Factor App - Config](https://12factor.net/config)
- [Supabase Security](https://supabase.com/docs/guides/self-hosting/security)

---

**마지막 업데이트**: 2025-11-07
**문의**: security@novakitz.com
