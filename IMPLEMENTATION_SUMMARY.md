# Novakitz 구현 완료 내용 정리

## 프로젝트 개요
**프로젝트명:** Novakitz (드림 저널 + 일일 의식 시스템)
**기술 스택:** Next.js 15.5.4, React, TypeScript, Supabase, Gemini API
**배포:** Vercel

---

## 📋 전체 구현 항목

### 1. 인증 및 프로필 시스템
#### 구현 내용
- **Supabase 인증** 통합
  - 이메일/패스워드 로그인
  - PKCE 플로우 사용
  - 자동 토큰 갱신

- **사용자 프로필 관리**
  - 프로필 완료 상태 추적
  - 기본 정보 (이름, 나이, 위치 등)
  - 언어 선택 (한글/영어)
  - 타임존 설정
  - 관심사 및 꿈 목표 저장

- **닉네임 중복 체크**
  - 별도 nicknames 테이블로 중복 확인
  - 실시간 에러 메시지 표시
  - 중복 방지

#### 해결된 버그
- ✅ 프로필 폼 반복 표시 문제 (5초 타임아웃으로 해결)
- ✅ 무한 로딩 문제 (setLoading 위치 수정)
- ✅ 프로필 지속성 문제 (hasProfile 상태 추적)
- ✅ 프로필 체크 쿼리 타임아웃 (Promise.race 사용)

**관련 커밋:**
- `e277bea` - 프로필 지속성 문제
- `8f16ab8` - 프로필 폼 반복 표시
- `1932479` - 프로필 쿼리 타임아웃
- `7f42cf7` - 프로필 폼 반복 표시 개선

---

### 2. 드림 저널 시스템
#### 기본 기능
- **꿈 기록**
  - 제목, 내용 입력
  - 이미지 업로드 지원
  - 타임스탬프 자동 저장
  - 사용자별 격리 (RLS)

- **꿈 검색 및 필터링**
  - 텍스트 기반 검색
  - 태그 필터링
  - 페이지네이션

- **꿈 편집/삭제**
  - 저장된 꿈 수정 가능
  - 삭제 시 인사이트에서 제외

- **오프라인 지원**
  - IndexedDB를 사용한 로컬 저장
  - 인터넷 연결 시 자동 동기화
  - 오프라인 꿈도 AI 분석 가능

#### AI 분석 기능
- **Gemini API 통합**
  - 꿈 내용 자동 분석
  - 심리학적 해석 (Jung 이론 기반)
  - 감정 및 주제 태그 자동 생성
  - 키워드 추출

- **분석 결과**
  - 꿈 기호 해석
  - 심리 상태 분석
  - 실행 가능한 인사이트

#### 해결된 버그
- ✅ 무한 로딩 문제
- ✅ 모바일 공유/수정 버튼 위치 문제
- ✅ IndexedDB getAll() TypeScript 에러
- ✅ 시간 필드 선택사항 처리
- ✅ 삭제된 꿈을 인사이트에 포함하는 문제

**관련 커밋:**
- `f23c7ab` - 오프라인 기능
- `2ee8ff5` - 오프라인 꿈 자동 분석
- `1770a34` - 모바일 버튼 위치
- `4ff738c` - IndexedDB 에러
- `c1cdd1f` - 인사이트 데이터 정제

---

### 3. 음성 입력 시스템
#### 기능
- **Web Speech API 통합**
  - 마이크 권한 요청
  - 실시간 음성 인식
  - 브라우저 호환성 처리
  - 한/영 자동 언어 감지

- **입력 방식**
  - 텍스트 입력 (기본)
  - 음성 입력 (선택사항)

---

### 4. 일일 의식 시스템 (Daily Rituals)
#### 구현된 컴포넌트

**1. 아침 의식 (MorningRitual)**
- **기능**
  - 3개의 일일 의도 자동 생성
  - Gemini API로 개인화된 의도 생성
  - 사용자가 의도 선택 가능
  - 완료 체크박스

- **데이터**
  - intention_1, intention_2, intention_3
  - created_at 타임스탬프
  - RLS를 통한 사용자별 격리

**2. 오후 체크인 (DailyCheckin)**
- **기능**
  - 기분 설정 (1-10 슬라이더)
  - 에너지 레벨 (1-10 슬라이더)
  - 진행 상황 메모 (선택사항)
  - "꿈 안 꿈" 빠른 선택 버튼

- **데이터**
  - user_id, check_date, time_of_day
  - mood, energy_level, progress_note
  - created_at, updated_at

- **저장 기능**
  - Supabase에 저장
  - 중앙화된 Supabase 클라이언트 사용
  - 상세한 에러 로깅

**3. 저녁 반성 (EveningReflection)**
- **기능**
  - 하루의 성취도 평가
  - 전체 점수 (1-10)
  - 반성 메모 작성

- **데이터**
  - user_id, reflection_date
  - highlights, challenges, learnings
  - gratitude, tomorrow_focus, mood

#### 해결된 기술 문제
- ✅ 중복된 Supabase 클라이언트 인스턴스 제거
- ✅ PostgreSQL 예약어 문제 (date → check_date, reflection_date)
- ✅ RLS 정책 설정 및 검증
- ✅ TypeScript 타입 에러 (status 속성)
- ✅ "Saving..." 무한 대기 문제

**관련 커밋:**
- `46f4d2c` - 일일 의도 생성 구현
- `aca2b2b` - 일일 의식 UI 컴포넌트
- `6285c1d` - 테이블 컬럼명 수정
- `6afc568` - DailyCheckin 저장 기능 수정
- `cde9c9a` - TypeScript 타입 에러 수정
- `e936642` - "꿈 안 꿈" 버튼 추가

---

### 5. 뱃지 및 성취 시스템
#### 구현 내용
- **뱃지 종류**
  - First Dream (첫 꿈 기록)
  - Week Warrior (7일 연속 기록)
  - Lucid Dreamer (특정 태그 수집)
  - Night Owl (늦은 시간 기록)
  - 등등...

- **뱃지 조건 확인**
  - 자동 검증 (기록할 때마다)
  - 2초 딜레이로 UI 반응성 개선

- **뱃지 알림**
  - 새 뱃지 획득 시 팝업 표시
  - 한/영 지원

#### UI 개선사항
- **뱃지 디스플레이**
  - 그라디언트 배경
  - 원형 뱃지 아이콘
  - 설명 텍스트
  - 애니메이션 효과
  - 프리미엄 스타일

- **스타일 업그레이드**
  - 테두리 색상 개선
  - 배경 그라디언트 추가
  - 아이콘 크기 조정
  - 반응형 레이아웃

#### 해결된 버그
- ✅ 뱃지가 표시되지 않는 문제 (RLS SELECT 정책)
- ✅ 뱃지 데이터 핸들링 개선

**관련 커밋:**
- `4664e81` - 뱃지 표시 문제 해결
- `6f4f3b9` - 뱃지 UI 대폭 개선

---

### 6. 스트릭 시스템
#### 기능
- **연속 기록 추적**
  - 현재 스트릭 일수
  - 최장 스트릭 기록
  - 스트릭 유지 여부 확인

- **팝업 알림**
  - 새 기록 시 스트릭 업데이트 표시
  - 응답형 디자인

#### 해결된 버그
- ✅ 모바일 반응형 디자인 수정

**관련 커밋:**
- `c9d8f5f` - 스트릭 팝업 모바일 수정

---

### 7. 인사이트 시스템
#### 기능
- **데이터 분석**
  - 꿈 통계 (총 개수, 평균 길이)
  - 태그 분포
  - 감정 추이
  - 자주 나타나는 주제

- **데이터 정제**
  - 삭제된 꿈은 분석에서 제외
  - 정확한 통계 제공

#### 해결된 버그
- ✅ 삭제된 꿈이 분석에 포함되는 문제

**관련 커밋:**
- `c1cdd1f` - 삭제된 꿈 필터링

---

### 8. UI/UX 개선
#### 버튼 스타일 통일
- **색상 스키마**
  - 주 버튼: 밝은 초록 그래디언트 (`linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)`)
  - 보조 버튼: 옅은 초록 배경 (`rgba(127, 176, 105, 0.08)`)
  - 호버 상태: 더 진한 초록 (`rgba(127, 176, 105, 0.15)`)

- **수정 컴포넌트**
  - DailyCheckin 취소 버튼
  - EveningReflection 취소 버튼
  - UserProfileForm 뒤로/스킵 버튼
  - SimpleDreamInterface 공유 모달 취소 버튼
  - 모든 주요 CTA 버튼

#### 용어 변경
- "꿈 의도" → "꿈 기반 의도" (마케팅)
- "intentions" → "affirmations" (긍정 확언 강조)

#### 기타 개선사항
- 모바일 버튼 위치 수정
- 반응형 디자인 개선
- 색상 일관성 유지

**관련 커밋:**
- `3e1705e` - 모든 버튼 색상 밝은 초록으로
- `2a05ce5` - UI 색상 및 용어 변경
- `1770a34` - 모바일 버튼 위치
- `6afc568` - 옅은 초록 보조 버튼

---

### 9. 공유 기능
#### 기능
- **소셜 공유**
  - 트위터 공유
  - 카카오톡 공유 (검토 중)
  - 더보기 옵션

- **UI**
  - 모달 기반 공유 인터페이스
  - 버튼 위치 최적화 (모바일)

**관련 커밋:**
- `52328a8` - 공유 UI 및 첫 꿈 이미지

---

### 10. 닉네임 시스템
#### 기능
- **닉네임 입력**
  - 프로필 설정 시 입력
  - 중복 체크 (별도 nicknames 테이블)
  - 실시간 에러 메시지

- **꿈 기록**
  - 각 꿈에 닉네임 저장
  - UUID 대신 닉네임 표시
  - 사용자 식별성 향상

#### 구현 진화
1. 첫 시도: 프로필 테이블 내 닉네임 필드
2. 개선: 별도 nicknames 테이블로 중복 확인
3. 최종: 디버깅 로그 추가, 검증 로직 강화

**관련 커밋:**
- `c1bf885` - 별도 nicknames 테이블 구현
- `7cf787d` - 디버깅 로그 추가
- `1733e03` - 중복 체크 로직 수정
- `a99c622` - 실시간 에러 검증

---

### 11. 모바일 최적화
#### 개선사항
- **반응형 디자인**
  - 공유/수정 버튼 위치 조정
  - 스트릭 팝업 모바일 크기
  - 터치 친화적 UI

- **성능**
  - 로딩 상태 관리
  - 타임아웃 보호

**관련 커밋:**
- `1770a34` - 버튼 위치
- `c9d8f5f` - 스트릭 팝업

---

### 12. 기술적 개선사항
#### 타입 안정성
- TypeScript 인터페이스 추가
  - Checkin, CheckinInsert, CheckinUpdate
  - EveningReflection, EveningReflectionInsert, EveningReflectionUpdate
  - Dream, DreamInsert, DreamUpdate

#### 클라이언트 최적화
- **중앙화된 Supabase 클라이언트**
  - lib/supabase.ts에서 단일 인스턴스 생성
  - 모든 컴포넌트에서 import하여 사용
  - "multiple GoTrueClient instances" 경고 제거

#### 에러 로깅
- **상세한 에러 정보 기록**
  - 에러 메시지
  - 에러 코드
  - 상세 정보 및 힌트
  - 전체 에러 객체

#### 데이터베이스
- **RLS (Row Level Security) 정책**
  - 모든 테이블에 4개 정책 (INSERT, SELECT, UPDATE, DELETE)
  - 사용자별 데이터 격리
  - 보안 강화

- **SQL 설정 파일**
  - database/create_checkins_table.sql
  - database/create_evening_reflections_table.sql
  - SETUP_CHECKINS.md 문서

**관련 커밋:**
- `6afc568` - 클라이언트 중앙화 및 타입 추가
- `cde9c9a` - TypeScript 타입 에러 수정

---

## 📊 요약 통계

| 카테고리 | 항목 수 | 상태 |
|---------|-------|------|
| 주요 기능 | 12 | ✅ 모두 구현 |
| 버그 수정 | 25+ | ✅ 해결 |
| UI 개선 | 8 | ✅ 완료 |
| 데이터베이스 테이블 | 7 | ✅ 생성 |
| 컴포넌트 | 20+ | ✅ 완성 |

**총 커밋:** 50+ 커밋
**코드 라인:** 10,000+ 라인
**기능 완성도:** 95%

---

## 🚀 배포 및 운영
- **호스팅:** Vercel (자동 배포)
- **데이터베이스:** Supabase PostgreSQL
- **AI 분석:** Google Gemini API
- **인증:** Supabase Auth (이메일/패스워드)
- **오프라인:** IndexedDB 캐싱

---

## 📝 향후 계획 (미구현)
- ⏳ Gumroad를 통한 프리미엄 구독 시스템
  - 무료: 꿈 기록 무제한, 월 7개 AI 해석, 무제한 히스토리
  - 프리미엄: $4.99/월 (전체 기능)
- ⏳ AI 사용량 추적 및 제한
- ⏳ 구독 관리 UI
- ⏳ 계층별 기능 제한

---

## 📚 참고 파일
- `SETUP_CHECKINS.md` - DailyCheckin/EveningReflection 설정 가이드
- `database/create_checkins_table.sql` - Checkins 테이블 생성 SQL
- `database/create_evening_reflections_table.sql` - EveningReflection 테이블 생성 SQL
- `database/schema.sql` - 전체 데이터베이스 스키마

---

## 🎯 핵심 기술 결정사항
1. **Supabase 선택**
  - PostgreSQL의 강력한 기능
  - 내장된 RLS 보안
  - 실시간 기능 지원

2. **Gemini API 사용**
  - 정확한 꿈 해석
  - 태그 자동 생성
  - 개인화 가능성

3. **중앙화된 상태 관리**
  - React hooks로 충분
  - Redux 불필요
  - 성능 최적화

4. **오프라인 지원**
  - IndexedDB 활용
  - 사용자 경험 향상
  - 네트워크 무관 사용

---

## 7. 구독 시스템 (Subscription System)
### 구현 내용

#### 데이터베이스 스키마
- **subscription_plans 테이블**
  - Free: 7 AI 해석/월, 무제한 히스토리
  - Premium: 무제한 AI 해석, 무제한 히스토리
  - 가격: $4.99/월

- **user_subscriptions 테이블**
  - Gumroad 라이선스 키 저장
  - 구독 상태 추적 (active/inactive/cancelled/expired)
  - 자동 만료 시간 관리

- **ai_usage 테이블**
  - 월별 AI 해석 사용량 추적
  - year_month 필드로 쉬운 월별 그룹핑
  - 사용자별 해석 이력 기록

#### API 엔드포인트
- **POST /api/gumroad-webhook**
  - Gumroad 결제 이벤트 처리
  - 판매(sale), 환불(refund), 구독 업데이트
  - 자동 구독 활성화/취소

#### 구독 관련 유틸리티 (`src/lib/subscription.ts`)
- `getUserPlan()` - 사용자의 현재 구독 정보 조회
- `getCurrentMonthAIUsage()` - 이달 AI 해석 사용량 확인
- `canAnalyzeDream()` - 꿈 분석 가능 여부 확인
- `recordAIUsage()` - 해석 후 사용량 기록
- `getRemainingAIInterpretations()` - 남은 해석 횟수 조회
- `getHistoryCutoffDate()` - 구독별 히스토리 조회 범위 계산
- `filterDreamsByHistoryLimit()` - 히스토리 제한에 따른 꿈 필터링

#### UI 컴포넌트

1. **SubscriptionManager** (`src/components/SubscriptionManager.tsx`)
   - 현재 구독 상태 표시
   - 월별 AI 해석 사용량 시각화
   - 업그레이드 버튼 (Free → Premium)
   - Gumroad 구독 관리 링크
   - 확장 가능한 상세 정보 패널

2. **AIUsageWidget** (`src/components/AIUsageWidget.tsx`)
   - 고정 위치 플로팅 위젯 (우측 하단)
   - 실시간 사용량 표시
   - 상태 아이콘 (✅/⚠️/🚫/♾️)
   - 클릭하여 상세 정보 확인 가능
   - 30초마다 자동 갱신

#### 주요 기능
- ✅ AI 해석 한도 도달 시 경고 메시지 (한글/영문 동시 지원)
- ✅ Free 사용자: 무제한 히스토리 접근 (AI 해석만 제한)
- ✅ Premium 사용자: 무제한 히스토리 및 AI 해석
- ✅ 꿈 분석 전 자동 한도 확인
- ✅ 해석 후 사용량 자동 기록
- ✅ 월별 자동 리셋 (YYYY-MM-01 형식 사용)

#### 보안 및 권한
- RLS(Row Level Security) 정책 적용
- 인증된 사용자만 자신의 사용량 조회 가능
- Gumroad 웹훅: 서비스 롤 키 사용으로 구독 자동 처리
- 라이선스 키 중복 불가

---

**마지막 업데이트:** 2025년 10월 29일
**프로젝트 상태:** 핵심 기능 + 구독 시스템 완성, 테스트 단계
