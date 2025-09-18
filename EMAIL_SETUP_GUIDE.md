# 📧 이메일 알림 설정 가이드

## 🎯 이메일 알림이 가는 곳

**환경변수 `ADMIN_EMAIL`에 설정한 이메일 주소로 알림이 발송됩니다.**

```bash
# 예시: 당신의 이메일로 알림 받기
ADMIN_EMAIL=your.email@gmail.com  # ← 여기에 당신의 이메일 입력
```

---

## 📨 어떤 상황에 이메일이 오나요?

### 자동 발송 조건
- 🔴 **에러율 15% 이상** (high/critical 에러)
- 🚨 **연속 503 에러 3회 이상**
- ⚠️ **API 응답시간 10초 이상**

### 이메일 내용 예시
```
제목: 🚨 [HIGH] API Alert: high_error_rate

내용:
━━━━━━━━━━━━━━━━━━━━━━━
🚨 API 모니터링 알림

API 에러율이 25%입니다

심각도: HIGH
유형: high_error_rate  
발생 시간: 2024년 9월 18일 오후 3:30:00

상세 정보:
{
  "totalRequests": 20,
  "errorCount": 5,
  "errorRate": 25
}

이 알림은 Nova Dream API 모니터링 시스템에서
자동으로 발송되었습니다.
━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ⚙️ 설정 방법

### 옵션 1: Gmail 사용 (추천)

#### 1단계: 환경변수 설정
```bash
# .env.local 파일에 추가
ADMIN_EMAIL=your.email@gmail.com          # ← 알림 받을 당신의 이메일
GMAIL_USER=your.service@gmail.com         # ← 발송용 Gmail 계정  
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop    # ← Gmail 앱 비밀번호
```

#### 2단계: Gmail 앱 비밀번호 생성
1. **Google 계정 설정** 접속: https://myaccount.google.com/
2. **보안** → **Google에 로그인** → **2단계 인증** 켜기
3. **보안** → **앱 비밀번호** 클릭
4. **앱 선택**: 메일, **기기**: 기타 → "Nova Dream API" 입력
5. **16자리 비밀번호**를 복사해서 `GMAIL_APP_PASSWORD`에 입력

### 옵션 2: SendGrid 사용

#### 1단계: SendGrid 가입
1. https://sendgrid.com/ 가입 (무료 플랜: 월 100개)
2. **Settings** → **API Keys** → **Create API Key**
3. **Full Access** 권한으로 생성

#### 2단계: 환경변수 설정
```bash
# .env.local 파일에 추가
ADMIN_EMAIL=your.email@gmail.com          # ← 알림 받을 당신의 이메일
SENDGRID_API_KEY=SG.your_api_key_here     # ← SendGrid API 키
FROM_EMAIL=noreply@yoursite.com           # ← 발신자 이메일
```

---

## 🧪 테스트 방법

### 1. 브라우저에서 테스트
```javascript
// F12 → Console에서 실행
fetch('/api/monitoring/alerts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'test',
    message: '이메일 테스트입니다!',
    severity: 'high'  // high나 critical이어야 이메일 발송
  })
});
```

### 2. 실제 에러로 테스트
1. **꿈 분석을 여러 번 빠르게 시도** (503 에러 유발)
2. **5분 정도 기다리기**
3. **이메일 확인** (스팸함도 확인!)

---

## 📋 확인 체크리스트

### 설정 완료 확인
- [ ] `ADMIN_EMAIL`에 **당신의 실제 이메일** 입력됨
- [ ] Gmail 또는 SendGrid **인증 정보** 설정됨
- [ ] **2단계 인증** 및 **앱 비밀번호** 생성됨 (Gmail 사용 시)
- [ ] **테스트 이메일** 정상 발송 확인

### 이메일이 안 올 때
- [ ] **스팸함** 확인
- [ ] **환경변수** 오타 확인
- [ ] **Gmail 앱 비밀번호** 올바른지 확인
- [ ] **심각도가 high/critical**인지 확인 (low/medium은 이메일 안 옴)

---

## 📧 이메일 예시

실제로 받게 될 이메일:

**발신자**: your.service@gmail.com (Gmail 사용 시) 또는 noreply@yoursite.com  
**수신자**: your.email@gmail.com (ADMIN_EMAIL)  
**제목**: 🚨 [CRITICAL] API Alert: api_overload  

**내용**:
```html
🚨 API 모니터링 알림

Gemini API appears to be overloaded

심각도: CRITICAL
유형: api_overload
발생 시간: 2024년 9월 18일 오후 3:45:23

상세 정보:
{
  "consecutive503s": 3
}

이 알림은 Nova Dream API 모니터링 시스템에서 
자동으로 발송되었습니다.
문제가 지속되면 즉시 개발팀에 연락하세요.
```

---

## 🎯 요약

1. **`ADMIN_EMAIL=당신의이메일@gmail.com`** 설정
2. **Gmail 앱 비밀번호** 또는 **SendGrid API 키** 설정  
3. **high/critical 에러 시에만** 이메일 발송
4. **API 장애 상황을 즉시 알림**으로 받을 수 있음

이제 API에 문제가 생기면 당신의 이메일로 즉시 알림이 갑니다! 📧✅