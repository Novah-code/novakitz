# 🔐 배포 전 보안 체크리스트

코드를 공개 저장소에 푸시하거나 프로덕션에 배포하기 전에 이 체크리스트를 반드시 확인하세요!

## ✅ 사전 점검 (배포 전 필수)

### 1. 로컬 테스트
```bash
# 보안 점검 스크립트 실행
npm run security-check

# 또는 직접 실행
bash scripts/security-check.sh
```

- [ ] 모든 보안 점검이 통과됨
- [ ] 환경 변수가 올바르게 설정됨
- [ ] API 키가 노출되지 않음

### 2. 환경 파일 확인
```bash
# .env.local이 추적되지 않는지 확인
git check-ignore .env.local
# 출력: .env.local ✅ (무시됨)

# .env 파일이 커밋 상태에 표시되지 않는지 확인
git status | grep -i ".env"
# 출력이 없어야 함 ✅
```

- [ ] `.env.local` 파일이 `.gitignore`에 있음
- [ ] `.env.production` 파일이 `.gitignore`에 있음
- [ ] `.env.development` 파일이 `.gitignore`에 있음
- [ ] 환경 파일이 git에 추적되지 않음

### 3. 코드 검사
```bash
# 하드코딩된 API 키 검색
grep -r "sk-\|AKIA\|ghp_" src app --include="*.ts" --include="*.tsx"
# 결과가 없어야 함

# 하드코딩된 비밀번호 검색
grep -r "password.*=" src app --include="*.ts" --include="*.tsx" | grep -v process.env
# 결과가 없어야 함
```

- [ ] 하드코딩된 API 키가 없음
- [ ] 하드코딩된 비밀번호가 없음
- [ ] 하드코딩된 토큰이 없음
- [ ] 개인정보(이메일, 전화번호)가 없음

### 4. 환경 변수 사용 확인
```bash
# 클라이언트 코드에서 민감한 변수 검색
grep -r "GEMINI_API_KEY\|SUPABASE_SERVICE_ROLE\|GUMROAD_WEBHOOK" src/components
# 결과가 없어야 함
```

- [ ] 민감한 API 키가 클라이언트 코드에 없음
- [ ] 모든 민감한 정보가 `process.env`로 접근함
- [ ] NEXT_PUBLIC 변수만 공개 정보가 있음

### 5. Git 히스토리 확인
```bash
# 이전 커밋에 민감한 정보가 없는지 확인
git log --all -S "API_KEY" --oneline
git log --all -S "SECRET" --oneline
# 의도하지 않은 결과가 없어야 함
```

- [ ] 커밋 히스토리에 API 키가 없음
- [ ] 커밋 히스토리에 비밀번호가 없음
- [ ] 커밋 히스토리에 토큰이 없음

## 🚀 배포 (Vercel 기준)

### 1. Vercel 환경 변수 설정
```
Vercel 대시보드 → Project Settings → Environment Variables
```

**Production 환경에 추가**:
- [ ] GEMINI_API_KEY: `your_gemini_key`
- [ ] SUPABASE_SERVICE_ROLE_KEY: `your_service_key`
- [ ] GUMROAD_WEBHOOK_SECRET: `your_webhook_secret`
- [ ] GUMROAD_API_SECRET: `your_gumroad_secret`
- [ ] GMAIL_APP_PASSWORD: `your_gmail_password` (선택)
- [ ] SENDGRID_API_KEY: `your_sendgrid_key` (선택)
- [ ] GMAIL_USER: `your_gmail@gmail.com` (선택)
- [ ] ADMIN_EMAIL: `admin@yoursite.com` (선택)

**Preview 환경에 추가** (개발용):
- [ ] 모든 Production 환경 변수 추가

**Development 환경에 추가** (선택):
- [ ] 필요한 개발 환경 변수

### 2. 공개 변수 확인
```
Vercel 대시보드 → Project Settings → Environment Variables
```

**이 변수들은 공개되어도 안전함**:
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] NEXT_PUBLIC_GUMROAD_PRODUCT_URL
- [ ] NEXT_PUBLIC_SITE_URL (선택)

### 3. 배포 전 최종 확인
```bash
# 보안 점검 최종 실행
npm run security-check

# 빌드 테스트
npm run build

# 빌드 후 .env.local이 여전히 무시되는지 확인
git status
# .env.local이 표시되지 않아야 함
```

- [ ] 보안 점검 통과
- [ ] 빌드 성공
- [ ] 환경 변수 모두 설정
- [ ] 로컬 환경 파일이 git에 없음

### 4. 배포 확인
배포 후 확인할 사항:

- [ ] 프로덕션 사이트가 정상 작동
- [ ] API 키 오류가 없음
- [ ] 데이터베이스 연결이 정상
- [ ] 결제 시스템이 정상
- [ ] 로그에 민감한 정보가 없음

```bash
# Vercel 로그 확인
vercel logs
# 민감한 정보가 없어야 함
```

## 🔒 정기 보안 점검

### 주간
- [ ] 새로운 코드에 민감한 정보가 없는지 확인
- [ ] 환경 변수가 올바르게 설정되어 있는지 확인

### 월간
- [ ] API 키 로테이션 (가능한 경우)
- [ ] 보안 취약점 스캔 (npm audit)
- [ ] 의존성 업데이트 확인

### 분기별
- [ ] OWASP Top 10 검토
- [ ] 접근 제어 정책 검토
- [ ] 데이터 보호 정책 검토

## 🚨 응급 상황 대응

### API 키가 실수로 노출된 경우

**1단계: 즉시 조치 (5분 이내)**
```bash
# 모든 키 교체
# 1. API 제공자 대시보드에서 키 재발급
# 2. Vercel 환경 변수 업데이트
# 3. 로컬 .env.local 업데이트
```

**2단계: 히스토리 정제 (15분 이내)**
```bash
# git-filter-repo 설치
pip install git-filter-repo

# 민감한 파일 제거
git filter-repo --invert-paths --path .env.local
git filter-repo --invert-paths --path .env.production

# 또는 수동으로 처리
git filter-branch --tree-filter 'rm -f .env.local' HEAD
```

**3단계: 팀 공지 (30분 이내)**
- [ ] 모든 팀원에게 알림
- [ ] 새로운 키 배포
- [ ] 현재 상태 확인

## 📋 정책 및 가이드라인

### 환경 변수 관리
- 모든 민감한 정보는 환경 변수로 관리
- NEXT_PUBLIC으로 시작하는 변수만 클라이언트에 노출
- 각 환경(dev, staging, prod)마다 다른 값 사용
- 정기적인 키 로테이션

### 코드 리뷰
- [ ] PR에서 환경 변수 사용 확인
- [ ] 하드코딩된 비밀번호 체크
- [ ] API 키 노출 확인

### 배포 절차
- [ ] 모든 보안 점검 통과
- [ ] 코드 리뷰 완료
- [ ] 환경 변수 설정 확인
- [ ] 테스트 통과
- [ ] 배포

## 📞 연락처

보안 문제 발견 시: security@novakitz.com

---

**마지막 업데이트**: 2025-11-07
**상태**: ✅ 준비 완료
