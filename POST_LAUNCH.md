# 출시 후 할 일

출시 전에 손대면 위험하거나, 급하지 않아서 미뤄둔 것들입니다.
발견 시점과 근거를 같이 적어둡니다 — 나중에 "이걸 왜 미뤘더라"를 다시 추론하지 않기 위해서.

기준일: 2026-08-25 (첫 제출 9/1, 출시 완료 9/30)

---

## 1. 꿈 목록이 `image` 컬럼을 통째로 들고 옵니다

**위치** `src/components/SimpleDreamInterface.tsx` — `loadDreams`

앱을 열 때마다 `select('*')`로 모든 꿈을 받아옵니다. 지금은 `.limit(200)` 상한만
걸어둔 상태입니다.

문제는 `image` 컬럼입니다. 스토리지 업로드가 실패하면 fallback으로
`canvas.toDataURL('image/jpeg', 0.7)` 결과를 **base64 문자열 그대로** 저장합니다
(`SimpleDreamInterface.tsx`의 이미지 업로드 경로). 한 장에 100~300KB이고, 목록을
불러올 때마다 전부 따라옵니다.

**왜 미뤘나** 목록에서 `image`를 빼려면 세 곳을 같이 고쳐야 합니다:

- `DreamBackgroundGallery`에 넘기는 배열 (장식용 배경)
- 수정 플로우 — 기존 이미지를 유지하려면 `dream.image`가 필요합니다
- 삭제 플로우 — 스토리지 정리에 `dream.image`가 필요합니다

잘못 건드리면 **수정할 때 이미지가 사라지거나 삭제 후 스토리지에 쓰레기가 남습니다.**
제출 6일 전에 감수할 위험이 아니었습니다.

**할 일**
1. 목록 쿼리에서 `image` 제외
2. 배경 갤러리용으로 `id, image`만 따로 조회 (최근 N개)
3. 수정·삭제 시점에 해당 꿈의 `image`를 단건 조회
4. 이왕이면 base64 fallback 자체를 없애기 — 업로드 실패 시 이미지 없이 저장하고
   나중에 재시도하는 편이 낫습니다

---

## 2. `SimpleDreamInterface.tsx`가 5,948줄입니다

전체 코드의 약 18%가 파일 하나에 있습니다. 2026-08-25 하루에만 이 파일에서 버그를
세 개 고쳤고, 그중 상당 시간이 파일 안에서 위치를 찾는 데 들었습니다.

**왜 미뤘나** 분리 자체가 위험한 게 아니라, 분리하면서 상태 전달이 끊기는 걸 못 잡을
위험이 큽니다. 테스트가 없습니다.

**할 일** 자연스러운 경계부터:
- 꿈 입력 모달
- 히스토리 목록 + 상세
- 수정 모달
- 홈 씬 래퍼

---

## 3. 확언 생성에 한도가 없습니다

**위치** `app/api/generate-affirmations/route.ts`

인증은 붙였지만(2026-08-25) **횟수 제한은 없습니다.** 해석은
`app/api/analyze-dream/route.ts`에서 `checkQuota`로 막히는데, 확언은 별개 라우트라
무료·유료 모두 무제한입니다.

같은 파일에 이런 코드가 있습니다:

```ts
const plan = await getUserPlan(userId);
affirmationCount = 3;   // 플랜을 조회한 뒤 무조건 덮어씀
```

즉 플랜 분기가 **죽은 코드**입니다. 무료도 3개를 받습니다.

**왜 미뤘나** 회당 Gemini 비용이 0.2센트 수준이라 지금은 금액 문제가 아닙니다. 그리고
사용자가 매일 실제로 보는 결과물이 확언 쪽이라, **출시 직전에 무료 경험을 줄이는 건
잘못된 방향**입니다.

**할 일** 실사용량을 2~4주 본 뒤 판단. 막는다면 해석과 같은 `checkQuota`를 쓰되,
별도 한도로.

---

## 4. `console` 호출 465개

**최다** `SimpleDreamInterface.tsx` 167개, `app/api/analyze-dream/route.ts` 33개

`console.log('User ID:', userId)`처럼 식별자를 그대로 찍는 것도 있었습니다(해당
라인은 2026-08-25에 제거). 실제 오류가 여기 묻힙니다 — CORS 오류를 찾는 데 시간이 더
걸린 이유이기도 합니다.

**할 일** 프로덕션 빌드에서 `console.log`만 제거 (`console.error`는 유지).
`next.config.ts`의 `compiler.removeConsole`로 한 줄입니다. 출시 전에 넣지 않은 건
디버깅 중이라서입니다.

---

## 5. 저장소 정리

| | |
| --- | --- |
| `src/components/MonthlyDreamReport.tsx.backup` | 커밋된 백업 파일 |
| `temp-force-deploy` | 배포 강제용으로 만든 빈 파일 |
| `next-pwa` | `package.json`에만 있고 코드·설정 어디서도 참조 안 함 |
| 루트 `.md` 20개 | `SECURITY*.md` 4종, `IMPLEMENTATION*.md` 4종 — 어느 게 최신인지 알 수 없음 |
| lint 경고 60여 개 | 대부분 안 쓰는 변수. `useEffect` 의존성 누락은 실제 버그가 될 수 있음 |

---

## 6. 조약돌 카드 이미지 오류 — 재현 필요

2026-08-25에 보고됐지만 **원인을 못 찾았습니다.**

`MoodCardFlow.tsx`의 카드는 전부 인라인 SVG입니다(`arcanaArtChildren`). 래스터
이미지가 없어서 "깨진 이미지 아이콘"이 나올 구조가 아닙니다. 20개 아르카나 모두
`case`가 있고 각자 `<defs>`를 갖고 있어 `url(#...)` 참조가 끊길 여지도 없습니다.

**할 일** 재현 스크린샷 또는 콘솔 오류를 받고 나서 착수. 추측으로 고치지 말 것.

---

## 7. 프로필 화면 디자인

`src/components/ProfileSettings.tsx`. 기능은 고쳤지만(스트릭 중복 계산 제거,
로그아웃 버튼 추가) 생김새는 그대로입니다.

---

## 8. Sign in with Apple — 웹

네이티브는 2026-08-25에 실기기에서 동작 확인했습니다. **웹은 설정이 안 되어 있습니다.**

필요한 것:
- Apple 개발자 사이트에서 Service ID 생성
- `.p8` 키 발급
- Supabase → Authentication → Providers → Apple

코드는 이미 있습니다 (`src/lib/appleAuth.ts`).

---

## 9. shadow work

`SHIPATON.md` §9에 설계가 있습니다. 심사 기간이 10/1~10/13이라 그 사이 업데이트가
나가면 "살아 움직이는 앱"으로 보입니다.

---

## 10. 월 달력 (포토 캘린더 방식)

`database/add_emotion_to_checkins.sql`이 조약돌 색을 기억하기 위한 마이그레이션입니다.
**이 파일을 Supabase에서 실행해야 합니다** — 안 하면 달력이 감정 색을 복원할 수
없습니다 (`checkins.mood`는 1~5 척도라 anxious/lonely/anger가 전부 2로 겹칩니다).

---

## 기록해둘 결정들

**무료 티어는 월 7회 해석입니다.** `database/update_free_plan_to_7.sql`.
`checkQuota`의 기본값도 7입니다.

**"unlimited"라는 단어는 어디에도 쓰지 않습니다.** Pro는 월 200회 상한이 있어서
사실이 아니고, 가이드라인 2.3.1에 걸립니다. "daily"로 표현합니다.

**`novakitz.premium.monthly`는 영구히 못 씁니다.** Family Sharing을 켰다가 되돌리려
삭제했는데, App Store Connect는 삭제한 상품의 ID와 Reference Name을 계속 예약해
둡니다. 그래서 월간만 `pro`, 연간은 `premium`입니다. 사용자에게 안 보이는 값이라
맞추지 않았습니다.

**인증은 fail closed, 한도는 fail open입니다.** `src/lib/apiAuth.ts`는 Supabase
자격증명이 없으면 거부하고, `src/lib/subscriptionServer.ts`는 통과시킵니다. 배포
문제로 아침 리딩을 못 받게 하는 것보다는 낫지만, 아무도 검증 못 하는 배포가 "그럼 다
통과"로 결론내면 안 되기 때문입니다.

**홈 아트워크는 rosasawyers Instagram을 참고했다가 다시 그렸습니다.** 이전 버전은
주황 지붕 집 + 타원형 연못 + 같은 그레인 + 같은 채도로 참고작과 지나치게
가까웠습니다. 새 버전은 새벽 팔레트에 지평선에 걸친 디스크 구도입니다 — 표절 회피와
모닝 리추얼 포지셔닝이 같은 방향이라 둘 다 해결됩니다.
