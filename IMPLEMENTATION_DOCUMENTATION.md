# Nova Kitz - Dream Interpretation App Implementation Documentation

## 프로젝트 개요
Nova Kitz는 AI 기반 꿈 해석 웹 애플리케이션으로, 사용자가 꿈을 기록하고 분석을 받을 수 있는 모던한 디자인의 서비스입니다.

- **배포 URL**: https://novakitz0620.vercel.app/
- **기술 스택**: Next.js 14.2.0, TypeScript, React, CSS-in-JS
- **호스팅**: Vercel (자동 배포)

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

### 7. PWA (Progressive Web App) 기능
- **매니페스트**: 완전한 PWA 설정
- **아이콘**: 다양한 크기의 SVG 아이콘
- **오프라인 지원**: 서비스 워커 구성
- **설치 가능**: 모바일/데스크탑 앱으로 설치 가능

### 8. 배포 및 CI/CD
- **자동 배포**: GitHub → Vercel 연동
- **빌드 최적화**: Next.js 14 프로덕션 빌드
- **타입 체크**: TypeScript 컴파일 검증

## 최근 업데이트 (2024-09-09)
1. **저널 레이아웃 개선**: 둥근 사각형, 균등한 여백
2. **Close 버튼 재배치**: 저널 내부 우상단으로 이동
3. **카드 클릭 기능**: 세부 내용 모달 추가
4. **이벤트 처리**: 액션 버튼 클릭 시 카드 클릭 방지

## 향후 개선 계획
- [ ] 실제 AI API 연동 (현재는 시뮬레이션)
- [ ] 꿈 카테고리 분류 기능
- [ ] 소셜 공유 기능 구현
- [ ] 다크 모드 지원
- [ ] 다국어 지원

## 코드 품질
- ✅ TypeScript 완전 적용
- ✅ 반응형 디자인
- ✅ 접근성 고려
- ✅ 성능 최적화
- ✅ 모던 React 패턴 사용

---
*문서 작성일: 2024년 9월 9일*  
*마지막 업데이트: 2024년 9월 9일*