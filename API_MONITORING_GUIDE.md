# 🔍 API 모니터링 시스템 완전 가이드

## 📋 목차
- [시스템 개요](#시스템-개요)
- [모니터링 확인 방법](#모니터링-확인-방법)
- [에러 추적 및 분석](#에러-추적-및-분석)
- [알림 시스템 설정](#알림-시스템-설정)
- [API 엔드포인트](#api-엔드포인트)
- [트러블슈팅](#트러블슈팅)

---

## 🎯 시스템 개요

### 구현된 기능
- ✅ **실시간 모니터링 대시보드** (개발 환경)
- ✅ **Gemini API 503 오류 자동 재시도** (지수 백오프)
- ✅ **에러율 및 응답시간 추적**
- ✅ **상태코드별 통계**
- ✅ **슬랙/디스코드 알림 연동**
- ✅ **로컬스토리지 에러 로깅**
- ✅ **API 통계 엔드포인트**

### 주요 해결 문제
- **Gemini API 503 오버로드 에러** → 자동 재시도 + 친화적 에러 메시지
- **사용자 경험 개선** → 로딩 상태 및 재시도 안내
- **운영 모니터링** → 실시간 통계 및 알림

---

## 📊 모니터링 확인 방법

### 1. 실시간 대시보드 (개발 환경)

#### 접근 방법
```bash
# 1. 개발 서버 실행
npm run dev

# 2. 브라우저에서 접속
http://localhost:3000

# 3. 우하단 📊 버튼 클릭
```

#### 대시보드 정보
- **총 요청수**: API 호출 총 횟수
- **에러 수**: 실패한 요청 수
- **에러율**: 실패율 (5% 이하 정상, 5-15% 주의, 15% 이상 위험)
- **평균 응답시간**: API 응답 속도 (ms)
- **상태코드별 통계**: HTTP 200, 503, 429 등
- **최근 에러 로그**: 타임스탬프와 에러 메시지

#### 상태 표시
- 🟢 **정상** (에러율 < 5%)
- 🟡 **주의** (에러율 5-15%)  
- 🔴 **위험** (에러율 > 15%)

### 2. 브라우저 콘솔 로그

#### 확인 방법
```javascript
// F12 → Console 탭에서 확인

// 성공 로그
[API Metrics] /api/analyze-dream {
  status: 200,
  responseTime: "1234ms",
  timestamp: "2024-09-18T15:30:00.000Z"
}

// 에러 로그  
[API Error] /api/analyze-dream failed: {
  status: 503,
  error: "The AI service is experiencing high demand",
  responseTime: 5000
}

// 재시도 로그
Attempt 1 failed with status 503, retrying in 1247ms...
Attempt 2 failed with status 503, retrying in 2108ms...
🚨 Multiple 503 errors detected - Gemini API may be overloaded
```

### 3. 로컬스토리지 에러 히스토리

#### 확인 방법
```javascript
// F12 → Application → Local Storage → api-errors

// 또는 콘솔에서 직접 조회
const errors = JSON.parse(localStorage.getItem('api-errors') || '[]');
console.log('API 에러 히스토리:', errors);
```

#### 저장되는 데이터
```json
[
  {
    "timestamp": "2024-09-18T15:30:00.000Z",
    "endpoint": "/api/analyze-dream",
    "status": 503,
    "error": "The AI service is experiencing high demand. Please try again in a few moments. ⏳",
    "responseTime": 5234
  }
]
```

---

## 🔍 에러 추적 및 분석

### 주요 에러 상황별 대응

#### 1. Gemini API 503 오버로드
```
에러 메시지: "The AI service is experiencing high demand"
상황: API 서버 과부하
대응: 자동 재시도 (최대 3회, 지수 백오프)
사용자 메시지: "AI 서비스가 많은 요청을 받고 있습니다. 잠시 후 다시 시도해주세요 ⏳"
```

#### 2. Rate Limiting (429)
```
에러 메시지: "Too many requests"
상황: 요청 제한 초과
대응: 자동 재시도 (60초 대기 권장)
사용자 메시지: "너무 많은 요청입니다. 잠시 기다린 후 다시 시도해주세요 ⏰"
```

#### 3. 일반 서버 오류 (502)
```
에러 메시지: "The AI service is temporarily unavailable"
상황: API 게이트웨이 오류
대응: 자동 재시도 (15초 대기 권장)
사용자 메시지: "AI 서비스가 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해주세요 🔄"
```

### 재시도 로직
```typescript
// 지수 백오프 구현
const delay = baseDelay * Math.pow(2, attempt);
const jitter = Math.random() * 0.1 * delay;
const totalDelay = Math.min(delay + jitter, maxDelay);

// 서버: 최대 3회, 1초-10초 지연
// 클라이언트: 최대 3회, 1초-10초 지연
```

---

## 🚨 알림 시스템 설정

### 환경변수 설정

#### .env.local 파일에 추가
```bash
# 슬랙 웹훅 (에러율 5% 이상 시 알림)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX

# 디스코드 웹훅 (크리티컬 에러 시)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/000000000000000000/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# 이메일 알림 설정 - 옵션 1: Gmail 사용
ADMIN_EMAIL=your-admin@gmail.com        # 알림 받을 이메일
GMAIL_USER=your-gmail@gmail.com         # Gmail 계정
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop  # Gmail 앱 비밀번호 (2단계 인증 필요)

# 이메일 알림 설정 - 옵션 2: SendGrid 사용  
SENDGRID_API_KEY=SG.your_sendgrid_api_key
FROM_EMAIL=noreply@yoursite.com         # 발신자 이메일
ADMIN_EMAIL=your-admin@gmail.com        # 알림 받을 이메일
```

### 자동 알림 조건

#### 1. 높은 에러율 감지
```javascript
if (stats.errorRate > 50 && stats.totalRequests > 5) {
  // 슬랙 알림: 에러율 50% 초과 시
  sendAlert({
    type: 'high_error_rate',
    message: `API error rate is ${stats.errorRate}%`,
    severity: 'high'
  });
}
```

#### 2. 연속 503 오류 감지
```javascript
const recent503s = logs.slice(-5).filter(log => log.status === 503).length;
if (recent503s >= 3) {
  // 디스코드 알림: 5개 요청 중 3개 이상 503 에러
  sendAlert({
    type: 'api_overload',
    message: 'Gemini API appears to be overloaded',
    severity: 'critical'
  });
}
```

### Gmail 앱 비밀번호 설정 방법

#### 1. Gmail 2단계 인증 설정
1. [Google 계정 설정](https://myaccount.google.com/) 접속
2. **보안** → **Google에 로그인** → **2단계 인증** 켜기

#### 2. 앱 비밀번호 생성
1. **보안** → **앱 비밀번호** 클릭
2. **앱 선택**: 메일
3. **기기 선택**: 기타 (사용자 지정 이름) → "Nova Dream API"
4. **생성된 16자리 비밀번호**를 `GMAIL_APP_PASSWORD`에 입력

#### 3. SendGrid 설정 방법
1. [SendGrid](https://sendgrid.com/) 가입
2. **Settings** → **API Keys** → **Create API Key**
3. **Full Access** 권한으로 생성
4. 생성된 키를 `SENDGRID_API_KEY`에 입력

### 수동 알림 테스트
```javascript
// 브라우저 콘솔에서 테스트
fetch('/api/monitoring/alerts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'test',
    message: '모니터링 테스트 알림입니다',
    severity: 'medium',
    data: { testParam: 'value' }
  })
});
```

---

## 🔗 API 엔드포인트

### 1. 통계 조회 API

#### GET /api/monitoring/stats
```javascript
// 요청
fetch('/api/monitoring/stats')
  .then(res => res.json())
  .then(data => console.log(data));

// 응답
{
  "summary": {
    "totalRequests": 125,
    "totalErrors": 8,
    "errorRate": 6.4,
    "status": "warning"  // healthy, warning, critical
  },
  "hourlyData": [
    {
      "timestamp": 1695039600000,
      "count": 15,
      "errors": 2
    }
  ],
  "recentErrors": [
    {
      "timestamp": 1695039000000,
      "status": 503,
      "error": "Gemini API overloaded",
      "responseTime": 3000
    }
  ],
  "errorsByStatus": {
    "503": 5,
    "429": 2,
    "502": 1
  }
}
```

### 2. 통계 기록 API

#### POST /api/monitoring/stats
```javascript
// 자동으로 서버에서 호출 (수동 호출 불필요)
{
  "status": 503,
  "error": "API overloaded",
  "responseTime": 2500,
  "endpoint": "/api/analyze-dream"
}
```

### 3. 알림 발송 API

#### POST /api/monitoring/alerts
```javascript
// 요청
fetch('/api/monitoring/alerts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'custom',           // high_error_rate, api_overload, custom
    message: '사용자 정의 알림',
    severity: 'high',         // low, medium, high, critical
    data: { additional: 'info' }
  })
});

// 응답
{
  "success": true,
  "message": "Alert processed successfully"
}
```

---

## 🔧 트러블슈팅

### 문제 1: 모니터링 대시보드가 보이지 않음

#### 해결방법
```bash
# 1. NODE_ENV 확인
echo $NODE_ENV  # development여야 함

# 2. 개발 서버로 실행 확인
npm run dev  # npm run build && npm start (X)

# 3. 브라우저 콘솔 에러 확인
F12 → Console 탭에서 JavaScript 에러 체크
```

### 문제 2: 로컬스토리지에 에러가 저장되지 않음

#### 해결방법
```javascript
// 1. 로컬스토리지 용량 확인
console.log('LocalStorage 사용량:', 
  JSON.stringify(localStorage).length / 1024 + 'KB');

// 2. 수동으로 에러 저장 테스트
localStorage.setItem('api-errors', JSON.stringify([{
  timestamp: new Date().toISOString(),
  status: 503,
  error: 'Test error'
}]));

// 3. 개인정보 보호 모드 확인 (Safari)
// 시크릿 모드에서는 localStorage가 제한될 수 있음
```

### 문제 3: 슬랙 알림이 오지 않음

#### 해결방법
```bash
# 1. 웹훅 URL 확인
curl -X POST -H 'Content-Type: application/json' \
  -d '{"text":"테스트 메시지"}' \
  YOUR_SLACK_WEBHOOK_URL

# 2. 환경변수 확인
console.log('Slack URL:', process.env.SLACK_WEBHOOK_URL);

# 3. 수동 테스트
fetch('/api/monitoring/alerts', {
  method: 'POST',
  body: JSON.stringify({
    type: 'test',
    message: '슬랙 테스트',
    severity: 'medium'
  })
});
```

### 문제 4: API 재시도가 작동하지 않음

#### 확인사항
```javascript
// 1. 콘솔에서 재시도 로그 확인
// "Attempt X failed, retrying in Xms..." 메시지 확인

// 2. 네트워크 탭에서 실제 요청 확인
F12 → Network → fetch 요청들의 타이밍 확인

// 3. 에러 상태코드 확인
// 400번대 에러는 재시도하지 않음 (429 제외)
// 500번대 에러와 429만 재시도
```

---

## 📈 운영 모니터링 체크리스트

### 일일 점검사항
- [ ] **에러율 5% 이하 유지**
- [ ] **평균 응답시간 3초 이하**
- [ ] **연속 503 에러 발생하지 않음**
- [ ] **로그에 비정상 패턴 없음**

### 주간 점검사항
- [ ] **API 사용량 트렌드 분석**
- [ ] **에러 패턴 분석 및 개선**
- [ ] **알림 설정 점검**
- [ ] **모니터링 대시보드 정상 작동**

### 월간 점검사항
- [ ] **API 쿼터 사용량 검토**
- [ ] **모니터링 시스템 성능 최적화**
- [ ] **새로운 에러 패턴 감지 로직 추가**
- [ ] **알림 수신자 및 채널 점검**

---

## 🚀 런치 전 최종 확인

### 필수 설정
```bash
# 1. 환경변수 설정
✅ GEMINI_API_KEY
✅ SUPABASE 설정
✅ SLACK_WEBHOOK_URL (선택)

# 2. 모니터링 테스트
✅ 개발 환경에서 대시보드 확인
✅ 에러 상황 시뮬레이션
✅ 알림 시스템 테스트

# 3. 운영 준비
✅ 에러 메시지 사용자 친화적으로 확인
✅ 재시도 로직 정상 작동 확인
✅ 로그 수집 정상 작동 확인
```

### 런치 후 모니터링
```bash
# 1. 실시간 확인 (첫 24시간)
- Vercel Dashboard에서 함수 실행 로그 모니터링
- 슬랙 알림 채널 지속 확인
- 사용자 피드백 수집

# 2. 주기적 확인
- 매일 오전: API 통계 확인
- 주간: 에러 트렌드 분석
- 월간: 시스템 개선 계획 수립
```

---

## 📞 문의 및 지원

### 개발 관련 문의
- 코드 수정 필요 시: 개발팀 연락
- 새로운 모니터링 기능 요청: 기획팀 연락

### 운영 관련 문의  
- API 장애 발생: 즉시 개발팀 연락
- 모니터링 이상: 시스템팀 연락

---

*최종 업데이트: 2024년 9월 18일*  
*버전: 1.0.0*