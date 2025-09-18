# 📧 이메일 알림 빠른 설정 (jeongnewna@gmail.com)

## 🚀 1분 설정 방법

### 1단계: 환경변수 파일 생성
```bash
# .env.local 파일 생성 (루트 디렉토리에)
ADMIN_EMAIL=jeongnewna@gmail.com
GMAIL_USER=jeongnewna@gmail.com
GMAIL_APP_PASSWORD=여기에_앱비밀번호_입력
```

### 2단계: Gmail 앱 비밀번호 받기
1. **https://myaccount.google.com/** 접속
2. **보안** 클릭
3. **Google에 로그인** → **2단계 인증** 켜기 (이미 켜져있다면 패스)
4. **앱 비밀번호** 클릭
5. **앱 선택**: 메일 → **기기**: 기타 → "Nova Dream" 입력
6. **16자리 비밀번호 복사**해서 `GMAIL_APP_PASSWORD`에 붙여넣기

### 3단계: 테스트
```javascript
// 브라우저 F12 → Console에서 실행
fetch('/api/monitoring/alerts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'test',
    message: 'jeongnewna@gmail.com 이메일 테스트!',
    severity: 'high'
  })
});
```

## 📨 어떤 알림이 jeongnewna@gmail.com으로 올까요?

### 자동 발송 상황
- 🔴 **API 에러율 15% 이상**
- 🚨 **연속 503 에러 3회 이상** (Gemini API 과부하)
- ⏰ **API 응답시간 10초 이상**

### 이메일 내용 예시
```
받는 사람: jeongnewna@gmail.com
제목: 🚨 [HIGH] API Alert: high_error_rate

━━━━━━━━━━━━━━━━━━━━━━━
🚨 Nova Dream API 알림

API 에러율이 20%입니다

심각도: HIGH
발생 시간: 2024년 9월 18일 오후 4:15
에러 수: 8/40 요청

Nova Dream 앱에 문제가 발생했습니다.
즉시 확인이 필요합니다!
━━━━━━━━━━━━━━━━━━━━━━━
```

## ✅ 설정 완료되면

- **런치 후 API 문제 발생 시** → jeongnewna@gmail.com으로 즉시 알림
- **Gemini API 과부하 시** → 실시간 이메일 알림  
- **사용자들이 에러 겪기 전에** → 미리 알림 받고 대응 가능

이제 API 모니터링이 완벽하게 설정되었습니다! 🎉