# Nova Kitz - Dream Interpretation App Implementation Documentation

## 프로젝트 개요
Nova Kitz는 AI 기반 꿈 해석 웹 애플리케이션으로, 사용자가 꿈을 기록하고 분석을 받을 수 있는 모던한 디자인의 서비스입니다.

- **배포 URL**: https://novakitz0620.vercel.app/
- **기술 스택**: Next.js 14.2.0, TypeScript, React, CSS-in-JS
- **AI 엔진**: Google Gemini API (gemini-1.5-flash)
- **호스팅**: Vercel (자동 배포)
- **저장소**: GitHub - 자동 배포 연동

## 주요 구현 기능

### 1. 드림 오브 (Dream Orb) 인터페이스
- **위치**: 메인 화면 중앙
- **기능**: 클릭 시 꿈 입력 모달 활성화
- **디자인**: 
  - 애니메이션이 적용된 반투명 원형 오브
  - 연기 효과와 액체 모션 필터
  - 호버 효과 및 펄스 애니메이션
  - 모바일 반응형 크기 조정

### 2. 꿈 입력 모달
- **활성화**: 드림 오브 클릭 시 표시
- **디자인 특징**:
  - 깔끔한 흰색 배경, 둥근 모서리 (24px)
  - 중앙 정렬된 스피너 로고 헤더
  - Georgia 폰트 사용으로 가독성 향상
  - "What's brewing in your dreams?" 플레이스홀더
- **기능**:
  - 실시간 텍스트 입력 검증
  - "Brew" 버튼으로 분석 시작
  - 로딩 상태 표시 ("Brewing...")

### 3. 꿈 저널 시스템
#### 3.1 데이터 저장
- **저장 방식**: localStorage를 통한 클라이언트 사이드 저장
- **데이터 구조**:
  ```typescript
  interface DreamEntry {
    id: string;
    text: string;
    response: string;
    date: string; // 영어 형식 (예: "September 9, 2024")
    timestamp: number;
    title?: string; // 사용자 지정 제목
    image?: string; // base64 인코딩된 이미지
    isPrivate?: boolean; // 공개/비공개 설정 (기본값: false/public)
  }
  ```

#### 3.2 저널 레이아웃
- **전체 화면 표시**: 모서리가 둥근 사각형 (24px border-radius)
- **여백**: 모든 방향 20px 동일 여백
- **그리드 시스템**:
  - 대형 화면 (1400px+): 4열 그리드
  - 중형 화면 (1025-1400px): 3열 그리드
  - 소형 화면 (769-1024px): 2열 그리드
  - 모바일 (768px 이하): 1열 그리드

#### 3.3 드림 카드 디자인
- **카드 구조**:
  - 상단: 그라데이션 이미지 헤더 (200px 높이)
  - 액션 버튼: 공유 🔗, 삭제 🗑️ (우상단)
  - 콘텐츠 영역: 제목, 날짜, 꿈 내용 미리보기
- **9가지 그라데이션 색상**:
  ```css
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  // ... 총 9가지 색상 순환
  ```

#### 3.4 카드 클릭 기능
- **세부 모달**: 카드 클릭 시 상세 내용 표시
- **모달 구성**:
  - 헤더: 그라데이션 배경, 제목, 날짜, 닫기 버튼
  - 바디: 전체 꿈 내용 + 분석 결과
  - 분석 섹션: 녹색 테마의 하이라이트 박스

### 4. UI/UX 개선사항
#### 4.1 제거된 요소들
- ❌ 기존 텍스트 입력 박스 (DreamInterpreter.tsx)
- ❌ 이메일 입력 폼
- ❌ Nova Dreams 중복 헤더 텍스트
- ❌ React Native 충돌 파일들

#### 4.2 디자인 시스템
- **컬러 팔레트**:
  - 주요 색상: #7FB069 (Matcha Green)
  - 보조 색상: #5A8449 (Dark Green)
  - 배경: #f8fafc (Light Gray)
  - 텍스트: #1f2937 (Dark Gray)
- **타이포그래피**:
  - 메인 폰트: Inter (sans-serif)
  - 콘텐츠 폰트: Georgia (serif)
- **버튼 스타일**:
  - Primary: 녹색 테마, 호버 효과
  - Secondary: 밝은 회색, 둥근 모서리

### 5. 기술적 구현사항
#### 5.1 상태 관리
```typescript
const [isLoading, setIsLoading] = useState(false);
const [novaResponse, setNovaResponse] = useState('');
const [showResponse, setShowResponse] = useState(false);
const [showInput, setShowInput] = useState(false);
const [dreamText, setDreamText] = useState('');
const [savedDreams, setSavedDreams] = useState<DreamEntry[]>([]);
const [showHistory, setShowHistory] = useState(false);
const [selectedDream, setSelectedDream] = useState<DreamEntry | null>(null);
```

#### 5.2 애니메이션 시스템
- **SVG 필터**: 액체 모션, 연기 효과
- **CSS 키프레임**: 연기 상승, 회전, 펄스 효과
- **트랜지션**: 호버, 모달 슬라이드인 효과

#### 5.3 반응형 디자인
- **브레이크포인트**: 640px, 768px, 1024px, 1400px
- **유연한 그리드**: CSS Grid로 구현
- **모바일 최적화**: 터치 친화적 버튼 크기

### 6. 파일 구조
```
/src/components/
├── SimpleDreamInterface.tsx    # 메인 컴포넌트
├── DreamInterpreter.tsx       # 레거시 컴포넌트 (일부 기능 제거)
└── UpdateNotification.tsx     # 업데이트 알림

/app/
├── page.tsx                   # 홈 페이지
├── layout.tsx                 # 레이아웃 (PWA 설정 포함)
├── globals.css               # 글로벌 스타일
└── pwa-install.tsx           # PWA 설치 기능

/public/
├── manifest.json             # PWA 매니페스트
└── icons/                    # 앱 아이콘들
```

### 7. 이미지 및 미디어 시스템
- **이미지 업로드**:
  - 편집 모드에서만 이미지 첨부 가능
  - FileReader API로 base64 인코딩
  - 드래그 앤 드롭 UI 지원
  - 카드 배경으로 표시 (200px 높이)

### 8. 프라이버시 관리
- **공개/비공개 토글**:
  - 각 꿈 항목별 개별 설정
  - 점 메뉴의 자물쇠 아이콘
  - 기본값: Public (isPrivate: false)
  - localStorage에 설정 저장

### 9. AI 분석 시스템
- **Google Gemini Integration**:
  - 모델: gemini-1.5-flash
  - 인증: x-goog-api-key 헤더
  - 프롬프트: 칼 융 분석심리학 기반
  - 구조화된 분석 결과 (5개 섹션)

### 10. PWA (Progressive Web App) 기능
- **매니페스트**: 완전한 PWA 설정
- **아이콘**: 다양한 크기의 SVG 아이콘
- **오프라인 지원**: 서비스 워커 구성
- **설치 가능**: 모바일/데스크탑 앱으로 설치 가능

### 11. 배포 및 CI/CD
- **자동 배포**: GitHub → Vercel 연동
- **빌드 최적화**: Next.js 14 프로덕션 빌드
- **타입 체크**: TypeScript 컴파일 검증

## 최신 업데이트 (2024-09-10)

### 주요 기능 개선
1. **Google Gemini AI 통합**
   - 실제 AI 기반 꿈 분석 기능 구현
   - 칼 융의 분석심리학 기반 프롬프트 설계
   - API 인증 및 에러 핸들링 개선

2. **UI/UX 개선**
   - 텍스트 입력 모달에서 이미지 업로드 제거 (편집 시에만 가능)
   - 카드 클릭 시 바로 편집 모드로 진입
   - View Detail 버튼 제거로 사용자 흐름 단순화

3. **프라이버시 기능 추가**
   - 꿈 항목별 공개/비공개 설정
   - 점 메뉴에 자물쇠 아이콘 추가
   - 기본값: Public, 토글 가능

4. **이미지 업로드 기능**
   - 편집 모드에서 이미지 첨부 가능
   - base64 인코딩으로 localStorage 저장
   - 카드 배경으로 이미지 표시 (그라데이션 대체)

5. **입력 검증 및 에러 처리**
   - 최소 10자 이상 입력 검증
   - 실시간 글자 수 카운터
   - 한국어 → 영어 인터페이스 통일
   - API 에러 시에도 저널 표시 보장

### 기술적 개선
1. **API 통합**
   - Google Gemini API 1.5 Flash 모델 사용
   - x-goog-api-key 헤더 인증 방식
   - 상세한 에러 로깅 및 디버깅

2. **성능 최적화**
   - Inter 폰트 프리로드 경고 해결
   - SVG 필터 오류 수정
   - 모달 애니메이션 최적화

3. **코드 품질**
   - TypeScript 인터페이스 확장
   - 에러 핸들링 강화
   - 사용자 상호작용 흐름 개선

## 현재 이슈 및 해결 필요사항
- [ ] **Gemini API 404 에러**: API 엔드포인트 또는 인증 문제 해결 필요
- [ ] **분석 결과 미표시**: API 응답 처리 로직 점검 필요
- [ ] **디버깅 로그**: 브라우저 콘솔 확인 후 정확한 에러 진단

## 완료된 기능들
- [x] Google Gemini AI 통합 (API 설정 완료, 디버깅 중)
- [x] 이미지 업로드 기능
- [x] 프라이버시 토글 기능
- [x] 카드 클릭으로 편집 모드
- [x] 입력 검증 및 에러 처리
- [x] 영어 인터페이스 통일
- [x] UI/UX 개선 (View Detail 제거 등)

## 향후 개선 계획
- [ ] 꿈 카테고리 분류 기능
- [ ] 소셜 공유 기능 개선
- [ ] 다크 모드 지원
- [ ] 다국어 지원
- [ ] 꿈 통계 및 패턴 분석
- [ ] 백업/동기화 기능

## 코드 품질
- ✅ TypeScript 완전 적용
- ✅ 반응형 디자인
- ✅ 접근성 고려
- ✅ 성능 최적화
- ✅ 모던 React 패턴 사용

---

## 개발 세션 요약 (2024-09-10)

### 해결한 주요 문제들
1. **텍스트 입력 플로우 버그**: 에러 시 드림 오브로 돌아가는 문제 수정
2. **이미지 업로드 위치**: 초기 입력에서 제거, 편집에서만 가능하도록 변경
3. **View Detail 제거**: 사용자 흐름 단순화
4. **프라이버시 기능**: 완전한 공개/비공개 토글 시스템 구현
5. **API 인증 방식**: URL 쿼리에서 헤더 방식으로 보안 개선
6. **폰트 최적화**: 프리로드 경고 해결

### 현재 디버깅 중인 이슈
- **Gemini API 통신**: 다양한 엔드포인트 테스트 중
- **분석 결과 표시**: API 응답 구조 검증 필요

### 커밋 히스토리 (주요)
```
77af84c - Fix Gemini API authentication and endpoint
9a692db - Add privacy toggle feature and fix Gemini API endpoint  
d296acc - Remove View Detail button and make card click open edit mode
ca0af85 - Fix SVG filter error and Gemini API endpoint
6ea8cf6 - Add better error handling and debugging for Gemini API
1b1f050 - Fix text input flow and remove image upload from input modal
```

---
*문서 작성일: 2024년 9월 9일*  
*마지막 업데이트: 2024년 9월 10일*  
*개발 세션: Claude Code를 통한 지속적 개발 및 디버깅*