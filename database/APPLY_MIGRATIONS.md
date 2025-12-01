# Database Migrations

이 파일들은 Supabase에 수동으로 적용해야 합니다.

## 최근 추가된 마이그레이션 (적용 필수)

### 1. create_nicknames_table.sql (CRITICAL)

`nicknames` 테이블을 생성합니다. 사용자 프로필 설정 중 닉네임 중복 검사에 필요한 테이블입니다.

**적용 방법:**

1. Supabase 콘솔 접속 (https://app.supabase.com)
2. 프로젝트 선택
3. SQL Editor 클릭
4. `database/create_nicknames_table.sql`의 전체 내용 복사
5. SQL 에디터에 붙여넣기
6. "Run" 실행

**테이블 구조:**
- `id`: UUID, Primary Key
- `user_id`: UUID, 사용자 참조 (UNIQUE)
- `nickname`: TEXT, 사용자 닉네임 (UNIQUE)
- `created_at`, `updated_at`: TIMESTAMP 타임스탬프

**RLS (Row Level Security):**
- 사용자는 자신의 닉네임만 조회/생성/수정/삭제 가능
- 모든 사용자는 닉네임 중복 확인 가능 (프로필 폼에서 필요)

---

### 2. create_affirmations_table.sql

`affirmations` 테이블을 생성합니다. 프로필 설정 완료 후 아침/오후/저녁 확언(affirmations)을 저장하기 위한 테이블입니다.

**적용 방법:**

1. Supabase 콘솔 접속 (https://app.supabase.com)
2. 프로젝트 선택
3. SQL Editor 클릭
4. `database/create_affirmations_table.sql`의 전체 내용 복사
5. SQL 에디터에 붙여넣기
6. "Run" 실행

**테이블 구조:**
- `id`: UUID, Primary Key
- `user_id`: UUID, 사용자 참조
- `dream_id`: UUID, 꿈 참조 (선택사항)
- `affirmation_text`: TEXT, 확언 내용
- `daily_count`: INTEGER, 동일 시간대 여러 확언 중 순서 (1, 2, 3)
- `check_in_time`: TEXT, 시간대 ('morning' | 'afternoon' | 'evening')
- `language`: TEXT, 언어 ('en' | 'ko')
- `date`: DATE, 확언이 생성된 날짜
- `created_at`, `updated_at`: TIMESTAMP 타임스탬프

**RLS (Row Level Security):**
- 사용자는 자신의 확언만 조회/생성/수정/삭제 가능

---

### 3. create_monthly_reports_table.sql

`monthly_reports` 테이블을 생성합니다. 월말에 자동으로 생성되는 월간 꿈 리포트를 저장하기 위한 테이블입니다.

**적용 방법:**

1. Supabase 콘솔 접속 (https://app.supabase.com)
2. 프로젝트 선택
3. SQL Editor 클릭
4. `database/create_monthly_reports_table.sql`의 전체 내용 복사
5. SQL 에디터에 붙여넣기
6. "Run" 실행

**테이블 구조:**
- `id`: UUID, Primary Key
- `user_id`: UUID, 사용자 참조
- `month`: TEXT, 월 정보 (예: "December 2025")
- `year_month`: DATE, 월의 첫날 (정렬/필터링용)
- `total_dreams`: INTEGER, 그 달에 기록한 꿈의 개수
- `average_mood`: TEXT, 평균 감정
- `top_keywords`: JSONB, 자주 나온 키워드 배열
- `mood_distribution`: JSONB, 감정별 분포
- `patterns`: JSONB, 반복되는 패턴 배열
- `status`: TEXT, 리포트 상태 ('draft' | 'published' | 'archived')
- `created_at`, `published_at`, `updated_at`: TIMESTAMP 타임스탬프

**RLS (Row Level Security):**
- 사용자는 자신의 리포트만 조회/생성/수정/삭제 가능

## 기존 마이그레이션

다른 모든 마이그레이션 파일은 이미 자동으로 적용되었습니다:
- `schema.sql` - 기본 테이블 (dreams, user_profiles)
- `create_checkins_table.sql` - 일일 체크인
- `create_evening_reflections_table.sql` - 저녁 회고
- `create_subscription_tables.sql` - 구독 정보
- 등등...
