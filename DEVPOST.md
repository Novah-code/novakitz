# Devpost 제출 — 붙여넣을 글

`SHIPATON.md` §4b의 서술형 칸들입니다. **비워두면 그 카테고리를 포기하는 것**이라
반드시 채워야 합니다. 영어 원문은 그대로 붙여넣으시고, 톤이 마음에 안 드는 부분만
고치세요.

전부 **실제로 있는 것**만 씁니다. 없는 기능을 적으면 심사위원이 앱을 열었을 때
바로 드러납니다.

---

## Peace Prize — 개인·사회에 어떤 도움이 되는가

```
Most apps in this space ask you to do more: journal for ten minutes, meditate
for fifteen, answer a questionnaire about your week. On the mornings that are
hard — the ones the app is supposedly for — those are the first things to go,
and then the app becomes another thing you are failing at.

Novakitz asks for five seconds. You tap a circle and choose one of eight
shapes for how you woke up. That is a complete morning. If a dream is still
with you, you can write it and get a reading back, but nothing requires it.

Every design decision follows from taking that seriously:

The streak forgives one missed day each calendar month, and tells you it did
rather than hiding it. A habit tool that punishes a single bad night is
training the wrong thing.

Alongside the streak is a total that never resets. A broken streak stops
being an erasure of everything you did.

The free tier is not a trial. It does not expire, and it includes the morning
check-in, the calendar, the streak, personalised affirmations, the full
history, and seven AI readings a month. Someone who never pays still gets the
thing that helps.

There is no feed. Nothing you write is shown to another person, there is no
audience to perform for, and no streak of yours is visible to anyone else.

The readings ask rather than tell. A dream about the sea is not looked up in a
dictionary; you are asked what the sea was doing there. Novakitz makes no
diagnostic or therapeutic claim and is not a substitute for care.

What it is for is quieter than that. A single morning tells you almost
nothing. A month of them shows which moods keep coming back and which images
repeat in your dreams — and that is only visible if the record was cheap
enough to keep on the days you did not feel like keeping it.
```

**왜 이렇게 썼나:** 셀링 포인트를 나열하는 대신 **하나의 주장**을 폅니다 — 정신
건강 앱이 실패하는 지점이 "힘든 날에 제일 먼저 포기되는 것"이고, 이 앱의 설계
결정들이 전부 거기서 나왔다는 것. 스트릭 용서, 리셋 안 되는 total, 만료 없는 무료
티어, 피드 없음이 전부 그 한 문장의 증거로 붙습니다. 전부 코드에 실제로 있습니다
(`src/lib/streak.ts`, `app/pricing/page.tsx`).

---

## Design Award — 심사위원이 어디를 봐야 하는가

```
Three things, in the order you would meet them.

THE HOME SCREEN

A hand-drawn landscape sits inside a circular portal against a flat sky. Two
details in that sky are worth looking at closely.

The bloom around the disc is a radial-gradient, not a box-shadow. A blur that
large is composited in tiles, and the seams between them were visible as faint
rectangles across the sky — the kind of artefact you only find by looking at
the screen instead of the code.

The grain over it was matched by measurement rather than by eye. The
illustration carries its own paper grain: its sky measures a high-frequency
variance of 10.9. A plain fractalNoise layer in soft-light gave 1.8, which
left the background looking like the one part of the picture that had not been
printed. Two noise layers at different frequencies, with the contrast pushed
through feComponentTransfer, land at 7.5 — clearly present, still quieter than
the artwork. The grain is layered beneath the disc, because the illustration
already has grain of its own and two coats made the circle muddy.

THE EIGHT MOODS ARE EIGHT SHAPES

Not eight colours. Each mood is a different silhouette — a border-radius
morph, so peaceful is a circle, joyful leans, anxious is lopsided, low is
nearly square. The shape is the thing your thumb presses.

THE MONTH IS MADE OF THE SHAPES YOU PRESSED

The calendar reuses those same silhouettes and the same colours, at cell size.
A month is not a grid of coloured squares; it is the actual sequence of shapes
you chose, and its texture changes with the month. The two tables are kept
deliberately in sync — the shape you tap in the morning has to be the shape
the day turns into.

All of it is CSS. There are no image assets in the interface chrome.
```

**왜 이렇게 썼나:** 디자인 심사에서 "예쁘다"는 아무 정보가 없습니다. **어떤 문제를
발견했고 어떻게 해결했는지**가 실력의 증거예요. 특히 그레인을 눈이 아니라
**측정값(10.9 / 1.8 / 7.5)** 으로 맞춘 이야기는 심사위원이 다른 출품작에서 보기
어려운 종류의 디테일입니다. 근거는 `POST_LAUNCH.md`의 「기록해둘 결정들」과
`src/components/DreamCalendar.tsx`의 `MOOD_SHAPES` 주석에 있습니다.

---

## Influencer Award → Productivity (Christopher Lawley)

```
The project story says Novakitz was built instead of another productivity app,
and entering this category anyway is deliberate rather than careless. What it
was built instead of is a task manager. What it is, is a morning routine — and
the first five minutes of a day decide more about that day than any list does.

The loop is one tap. You wake, tap the circle, choose the shape that matches
how you woke up, and the morning is recorded — about five seconds, before you
have opened anything that wants something from you. From there it is optional:
write the dream if you still have it, or answer three short cards about sleep,
stress and what is on your mind.

What makes it a routine rather than a log is what comes back. Each recorded
morning produces an affirmation written from what you actually recorded that
day, not from a generic list. A streak counts the mornings and forgives one
missed day a month, so the habit survives a bad night. A calendar turns the
month into a row of the shapes you chose, which is the fastest read on how the
weeks have gone. A monthly review reads the whole month back to you.

The dream is the input to that loop, not the product. Most days there is no
dream and the routine still completes — which is the difference between a habit
that holds and one that depends on remembering something you cannot control.

The productivity claim is a modest one, and I would rather state it exactly. The
app does not help you get more done. It occupies the two minutes before the
day's demands arrive, and it asks a question you answer for yourself rather than
one somebody else set. For anyone who has noticed that their morning is decided
by whatever was on the screen first, that is the tool this is.
```

**왜 이렇게 썼나:** `SHIPATON.md` §4b는 "의도(intentions)를 앞세우라"고 적어뒀지만,
`daily_intentions`는 **앱에서 아무도 읽지 않는 테이블**입니다 —
`SimpleDreamInterface.tsx:952`에 그렇게 쓰여 있습니다. 없는 기능으로 피치하면
심사위원이 앱을 열자마자 어긋납니다. 그래서 실제로 도는 루프
(체크인 → 어퍼메이션 → 스트릭 → 달력 → 월간 리뷰)로 다시 썼습니다. 꿈을 **입력**으로
두는 각도는 §4b가 말한 그대로입니다.

---

## 이 셋 말고 남은 칸

`SHIPATON.md` §4b 참고. 지금 채울 수 있는 것:

- [ ] 1024×1024 아이콘 (크롭 안 된 것)
- [ ] 스크린샷 — **기기 목업 프레임 없이**. 시뮬레이터 원본이라 그대로 통과
- [ ] "첫 버전이 2026/8/1~9/30에 출시되었는가" → Yes
- [ ] 앱 유형 → iOS
- [ ] RevenueCat 프로젝트 ID (Project Settings)
- [ ] RevenueCat/스폰서 직원인가 → No

승인을 기다려야 하는 것:

- [ ] **게시된 App Store URL**

싸게 쓸 수 있는 선택 항목: HAMM(수익 모델), Grand Prize(출시 후 성장),
Build in Public(포스팅을 하는 경우에만).

---

## 데모 영상 — Apple에 보낸 것과 다릅니다

| | Apple 심사용 | Devpost |
| --- | --- | --- |
| 길이 | 제한 없음 | **최대 3분** |
| 필수 | 가입 · 계정 삭제 | **Pro 기능이 3분 안에** |
| 공개 | 비공개 첨부 | **YouTube/Vimeo 공개 링크** |
| 음악 | — | **저작권 있는 음악 금지** |

Pro가 반드시 들어가야 하는 이유는 제출 폼에 **심사위원이 프로모 코드를 쓸 의무가
없다**고 적혀 있어서입니다. 무료 기능에 2분을 쓰면 정작 심사 대상이 화면에 안
나옵니다.

---

# 데모 영상 스크립트 — 3분

**Apple에 보낸 영상과 반대로 만듭니다.** 그건 한 번에 쭉 찍은 무편집 영상이었고,
이건 **편집한 피치 영상**입니다. 컷을 나누고, 자막을 얹고, 지루한 대기 시간은
잘라냅니다.

## 찍기 전에

- **데모 계정(`info.muonkr@gmail.com`)으로 로그인한 상태에서 찍으세요.** 한 달치
  기록이 들어 있어서 달력·리플렉션·월간 리뷰에 실제 데이터가 나옵니다. 새 계정으로
  찍으면 심사위원이 보는 건 빈 화면입니다
- **Pro가 켜져 있어야 합니다** — 데모 계정은 이미 켜져 있습니다
- 실기기(빌드 3)에서, 방해금지 켜고, 배터리 100% 근처
- **음악은 넣지 마세요.** 저작권 있는 트랙 한 곡이 실격 사유입니다. 무음 + 자막이
  제일 안전하고, 내레이션을 넣으실 거면 직접 녹음한 목소리만

목표 길이 **2분 50초**. 3분은 상한이지 목표가 아닙니다.

---

## 컷 시트

| 시간 | 화면 | 자막 / 내레이션 |
| --- | --- | --- |
| **0:00–0:10** | 홈 화면. 원을 탭 → 조약돌 8개 → 하나 선택 → 저장됨 | `This is a whole morning.` |
| 0:10–0:18 | 같은 화면 정지 | `Five seconds. Before you open anything that wants something from you.` |
| **0:18–0:30** | 홈 화면 천천히 (아트워크 보이게) | `Novakitz is a one-minute morning ritual. You record how you woke up — and the dream, if you still have it.` |
| **0:30–0:45** | `Remember a dream?` → 장소 · 등장 → 장면 입력 | `Most people don't forget their dreams because their memory is poor. They forget because nothing was waiting to receive them.` |
| **0:45–1:05** | 해석 결과. 아르카나 카드 → `READING` 아래로 스크롤 | `The reading asks rather than tells. It doesn't look the sea up in a dictionary — it asks what the sea was doing there.` |
| **1:05–1:25** | 메뉴 → Calendar. 8월로 넘겨서 한 달 전체 | `Eight moods, eight shapes. A month is the actual sequence of shapes you pressed.` |
| 1:25–1:35 | 스트릭 뱃지 클로즈업 | `The streak forgives one missed day a month. A habit tool that punishes one bad night is training the wrong thing.` |
| **1:35–2:15** | **메뉴 → Monthly Review.** 천천히 스크롤 — AI 종합, 아키타입, Dual Logs | `This is Pro. A written reading of the month, the archetypes that surfaced in it, and what recurred.` |
| 2:15–2:25 | 계속 스크롤 | `One morning tells you almost nothing. A month of them shows the pattern.` |
| **2:25–2:45** | 메뉴 → Pricing. 월간·연간 카드 | `Pro is $5.99 a month or $49.99 a year, with a week free. Subscriptions run on RevenueCat over Apple In-App Purchase.` |
| 2:45–2:50 | 홈 화면으로 복귀, 정지 | `Novakitz. On the App Store.` |

---

## 시간 배분의 근거

**Pro에 40초를 줍니다 (1:35–2:15).** 제출 폼에 **심사위원이 프로모 코드를 쓸 의무가
없다**고 적혀 있습니다. 무료 기능에 2분을 쓰면 정작 심사 대상이 화면에 안 나옵니다.
월간 리뷰가 Pro의 얼굴이니 거기에 제일 긴 시간을 줬습니다.

**0:00에 바로 조약돌을 찍습니다.** 로고나 타이틀 카드로 시작하지 마세요 — 3분짜리
영상에서 처음 10초를 브랜딩에 쓰면 제품을 보여줄 시간이 사라집니다. 이름은 마지막에
말해도 늦지 않습니다.

**꿈 입력은 짧게 찍고 잘라냅니다.** 타이핑하는 15초와 해석을 기다리는 몇 초는
컷으로 넘기세요. Apple 영상에서는 그걸 남겨야 했지만(실제로 동작한다는 증거),
여기서는 지루함일 뿐입니다.

**달력이 Design Award의 핵심 장면입니다.** 한 달이 "색깔 격자"가 아니라 "내가 누른
모양들의 배열"로 보이는 순간이 저 카테고리에서 제일 강한 한 컷입니다. 여기서
서두르지 마세요.

**RevenueCat을 한 번 명시합니다.** RevenueCat 해커톤이고, 결제가 그 위에서 돈다는
걸 말해두는 게 맞습니다. 한 문장이면 충분하고 그 이상은 광고처럼 들립니다.

---

# 실제로 찍는 법

위는 무엇을 찍을지고, 아래는 어떻게 찍을지입니다. **녹화 40분 + 편집 1시간** 정도면
끝납니다.

## 제일 중요한 것 하나

**3분을 한 번에 찍으려고 하지 마세요.** 2분 40초쯤에서 손이 미끄러지면 처음부터
다시 찍게 되고, 그 좌절이 하루를 먹습니다.

**컷 시트의 줄마다 따로 찍습니다.** 아래 클립 9개, 각각 30초 이하예요. 망치면 그
클립 하나만 다시 찍으면 됩니다. 편집에서 이어붙이면 한 번에 찍은 것과 구분되지
않습니다 — 오히려 더 깔끔합니다.

## 1단계 — 기기 준비 (5분)

- 데모 계정 `info.muonkr@gmail.com` 로그인 확인, Pro 켜져 있는지 확인
- **집중 모드(방해금지) 켜기.** 녹화 중 알림 배너 하나가 클립 하나를 버립니다
- 배터리 80% 이상
- 앱을 한 번 열었다 닫아서 로딩 캐시를 데워두기 (첫 진입 로딩이 클립에 안 잡히게)

## 2단계 — 녹화 방법

**Mac + 케이블을 쓰세요.** 이미 빌드할 때 쓰시는 그 케이블입니다.

```
QuickTime Player 실행
  → 파일 → 새로운 동영상 녹화
  → 빨간 녹화 버튼 옆 ⌄ 화살표 클릭
  → 카메라: iPhone 선택
```

아이폰 화면이 Mac 창에 그대로 뜹니다. 이 방식의 장점:

- **화질이 원본 그대로**입니다 (아이폰 자체 화면녹화 → AirDrop보다 낫습니다)
- 파일이 바로 Mac에 저장돼서 옮기는 단계가 없습니다
- 상태바가 보통 정리된 상태로 나옵니다. 안 그러면 편집에서 위쪽을 살짝 잘라내세요
- **마이크는 "없음"으로 두세요.** 음악 없이 자막으로 갈 거라 소리가 필요 없고,
  키보드 소리나 생활 소음이 들어가면 지저분합니다

녹화 버튼을 누르고 → 폰에서 동작하고 → 정지. 클립 하나 끝.

## 3단계 — 클립 9개

컷 시트 순서 그대로입니다. 클립 이름을 그대로 파일명에 쓰시면 편집이 훨씬
수월해집니다.

| 클립 | 찍을 것 | 길이 | 주의 |
| --- | --- | --- | --- |
| `01-pebble` | 홈 → 원 탭 → 조약돌 8개 → 하나 선택 → 저장됨 | ~18초 | 조약돌 8개가 다 보이게 잠깐 멈추기 |
| `02-home` | 홈 화면 가만히 (아트워크) | ~12초 | 아무것도 누르지 말 것 |
| `03-dream` | `Remember a dream?` → 장소·등장 → 장면 몇 줄 입력 | ~40초 | 길게 찍어두고 편집에서 자릅니다 |
| `04-reading` | 아르카나 카드 → `READING` 아래로 스크롤 | ~25초 | 스크롤 천천히 |
| `05-calendar` | 메뉴 → Calendar → 8월로 넘기기 | ~20초 | **제일 중요한 컷.** 한 달 전체가 보이는 상태로 3초 정지 |
| `06-streak` | 스트릭 뱃지 | ~10초 | |
| `07-review` | 메뉴 → Monthly Review → 끝까지 스크롤 | ~50초 | **제일 긴 컷.** AI 종합 → 아키타입 → Dual Logs 순서로 |
| `08-pricing` | 메뉴 → Pricing, 월간·연간 카드 | ~20초 | |
| `09-home-end` | 홈으로 복귀, 정지 | ~8초 | |

`03-dream`과 `07-review`는 **여유 있게 길게 찍으세요.** 편집에서 자르는 건 쉽고,
모자란 걸 다시 찍는 건 번거롭습니다.

로딩 대기(해석 생성 몇 초)는 그대로 찍고 편집에서 잘라냅니다.

## 4단계 — 편집

**CapCut 데스크톱**을 권합니다. 무료고, 한국어고, 자막 넣기가 제일 쉽습니다.
iMovie도 되지만 자막 스타일이 제한적입니다.

순서:

1. 클립 9개를 순서대로 타임라인에 올립니다
2. 각 클립 앞뒤의 버벅이는 부분을 잘라냅니다 (녹화 시작/정지 직후)
3. **컷 시트의 자막을 텍스트로 얹습니다.** 자동 자막은 소리가 없어서 안 됩니다 — 직접 타이핑
4. 클립 사이 전환은 **넣지 마세요.** 그냥 컷으로 붙이는 게 깔끔합니다
5. 전체 길이 확인 — **2분 50초 목표, 3분 절대 초과 금지**

**자막 스타일** — 읽히는 게 전부입니다:
- 흰 글자 + 반투명 검정 배경 바
- 화면 **아래쪽**에 배치 (위쪽은 상태바, 가운데는 앱 화면)
- 한 화면에 두 줄까지. 세 줄 넘으면 문장을 쪼개서 두 자막으로

**음악은 넣지 마세요.** 저작권 있는 트랙 한 곡이 실격 사유입니다. 무음 + 자막이
제일 안전합니다. 굳이 원하시면 CapCut의 저작권 프리 라이브러리에서 고르되,
없어도 전혀 문제되지 않습니다.

## 5단계 — 내보내기 · 업로드

- 내보내기: **1080p, 30fps.** 그 이상은 파일만 커집니다
- YouTube 업로드 → 공개 범위 **"공개(Public)"**
  - **"일부 공개(Unlisted)"도 Devpost는 받지만, "비공개(Private)"는 심사위원이 못 봅니다.** 여기서 틀리면 영상이 없는 것과 같습니다
- 제목: `Novakitz — a one-minute morning ritual`
- 업로드 후 **시크릿 창에서 링크를 열어 재생되는지 확인하세요.** 로그인 상태에서는
  비공개 영상도 보입니다
- 그 링크를 Devpost의 Video demo 칸에

---

# About the project — 본문

Devpost의 `About the project` 칸에 그대로 붙여넣습니다. 마크다운이 지원되니 헤더가
그대로 렌더됩니다.

**전부 실제로 있었던 일입니다.** 과장한 부분이 없어야 심사위원이 앱을 열었을 때
어긋나지 않습니다.

```markdown
## Inspiration

Before Novakitz was an app, it was a website, and the only way anyone found it
was the morning-routine content I had been posting for a while. Not one viral
post — a steady habit of sharing my own mornings.

Forty-nine people signed up that way. Strangers, not friends, some in Korea and
some not. Twelve of them kept going past the third day.

There was no app. No icon on a home screen, no notification, nothing that could
bring anyone back. To use it they opened a browser and typed an address, every
morning.

Most of them stopped within the same few weeks. One didn't — and I'll come back
to that.

Most mornings start on a screen, with someone else's day. We wake up and check
messages, news and notifications, and before we notice how we feel we are
already carrying someone else's thoughts. I wanted a small space between waking
up and entering the rest of the world.

I had assumed what I needed was a better reason for people to return. The one
who kept going says otherwise — the reason was already there. What was missing
was the signal: nothing in anyone's day ever mentioned that it existed. That is
what turned this into an app. Not new features. An icon and a notification.

## What it does

Novakitz is a one-minute morning ritual.

You wake up, tap a circle, and choose one of eight shapes for how you woke.
That is a complete morning. It takes about five seconds, and on a rushed day
that is the whole thing.

Then it asks whether you remember a dream. If you do, you write it down and get
a reflective reading back — not a dictionary definition of what the sea means,
but a question about what the sea was doing there. If you don't, you're done.

A single morning tells you almost nothing. The point is the month:

- a **calendar** where each day is the pebble you actually pressed
- **Reflection** — the moods that keep returning, the images that repeat
- a **monthly review**, written from your own month
- a **streak that forgives one missed day each month**, and tells you it did

That last one is the whole philosophy in one rule. A habit tool that punishes
a single bad night is training the wrong thing.

## How I built it

Next.js as a static export, wrapped in Capacitor and shipped to the App Store.
Supabase for auth and data, Google Gemini for the readings, RevenueCat over
Apple In-App Purchase for the two subscriptions.

Novakitz was not built for this hackathon. It has been running since October
2025, and the iOS app is that same product brought to the phone — the app and
the website share one Supabase project, so everyone who used the website keeps
their accounts and every record.

Wrapping the existing web app rather than rewriting in Swift was a deliberate
choice, and those users are the reason: they already had months of records, and
a rewrite would have meant starting the product from zero to gain rendering I
do not need. What this app draws is text, colour and a circle. The eight mood
shapes are border-radius morphs; the grain over the sky is an SVG filter; the
calendar is CSS grid. There is no image asset in the interface at all.

## Challenges I ran into

**An app about mornings, built with `toISOString()`, in Seoul.** In KST every
morning before 09:00 is the previous day in UTC. So the calendar filed each
morning under yesterday and the streak broke — precisely for the people using
the app earliest, which is to say the people using it as intended. Every date
in the codebase is now built from local components.

**WKWebView composites `filter` and `backdrop-filter` onto their own layers,**
and those layers do not respect sibling `z-index`. I found this four separate
times, on four different screens, before I recognised the shape of it: a card
that looked correct in the browser and sat behind its own background on the
phone.

**Records that saved perfectly and then appeared nowhere.** The main way people
record a dream is through the mood-card flow, and that path never wrote to the
keywords table. Everything saved. The calendar showed the day. But Reflection's
recurring symbols stayed empty, the archetypes sat on a placeholder that
promised results which were never coming, and the monthly review printed
"0 DREAMS" beside a summary describing the dream you had just written. An app
whose entire premise is accumulation was quietly accumulating nothing.

**And the review.** The first submission came back under Guideline 2.1. Working
through it turned up two things I would have shipped otherwise: the Restore
Purchases control existed in code but was only reachable from a page nothing
linked to, and the terms of service still said subscriptions were billed
through a payment processor the iOS app does not use.

## Accomplishments that I'm proud of

**People came back without being asked to.**
Novakitz ran for eleven months as a website — no icon, no push notification,
no App Store listing, no paid acquisition, no existing audience. Of the
forty-four people who had been signed up long enough to count, seven were still
recording a month later. One has come back on forty-three separate mornings
across five months, the most recent one five days ago. They missed far more
days than they kept, and they came back anyway.

That is the exact behaviour the product is designed around, and I did not have
to engineer it. It is also why the streak forgives a missed day: the person who
kept using it is precisely the person a strict streak would have thrown away.

**I took it from a web prototype to something Apple would ship.**
Alone — design, code, artwork, copy and the submission itself. That meant
finishing the parts nobody demos:

- eight morning moods drawn as eight shapes, redrawn at cell size so a month
  reads as the sequence you actually pressed
- AI readings that ask about the dream instead of defining it
- affirmations written from that morning's entry
- a monthly review built from the person's own month
- subscriptions on RevenueCat over Apple In-App Purchase, with the free trial
  and entitlements handled properly
- accounts, records that survive a reinstall, and account deletion from inside
  the app

The landscape on the home screen is a drawing of mine.

**I left things out.**
A morning that takes five seconds is the thing I am proudest of, and it is the
one nobody will notice.

The question underneath all of it was never a feature checklist: can a digital
product help someone spend the first minute of the day with themselves instead
of with everyone else? That is still the only thing I am building toward.

## What I learned

Almost none of the real bugs were crashes. They were things that worked,
saved correctly, and then showed up nowhere — and an app built on accumulation
fails silently when that happens. Nothing errors. The screen is just empty, and
the person quietly concludes there is nothing there.

The other lesson is about kindness as a feature. The forgiving streak, the free
tier that never expires, the absence of any feed to perform for — those started
as design taste and turned out to be the product.

## What's next

A bottom tab bar, so the screens that show what is accumulating are not behind
a drawer. A weekly recap that arrives instead of waiting to be found — a month
is the right unit for a pattern, but a week is the one a person can still
remember. And the morning reminder, arriving at the hour someone actually wakes
rather than an hour I guessed: the signal those forty-nine people never got.

None of it turns noticing into a scoreboard. There is no feed here and there
will not be one. A place to meet yourself before meeting the rest of the world
only works if nobody else is watching.
```

---

## Built with — 태그

```
next.js, react, typescript, capacitor, ios, supabase, postgresql,
revenuecat, google-gemini, css, vercel
```

## Try it out 링크

- `https://apps.apple.com/...` ← **승인 후 App Store URL** (필수)
- `https://novakitz.com`

저장소는 비공개이니 링크하지 마세요.

## 이미지 갤러리

3:2 비율 권장이라 세로 스크린샷은 잘립니다. **6.9" 스크린샷을 그대로 올리되 순서만
신경 쓰세요** — 첫 장이 카드 썸네일이 됩니다.

1. 홈 화면 (아트워크)
2. 조약돌 8개
3. 달력 한 달
4. 해석 결과
5. 월간 리뷰

---

# Additional info — 칸별 정리

대부분 비워둡니다. 실제로 채울 건 아래 8개뿐입니다.

## 지금 채울 것

| 칸 | 답 |
| --- | --- |
| 1024×1024 아이콘 첨부했나 | **Yes** (알파 채널 없는 그 파일) |
| 기기 프레임 없는 스크린샷 첨부했나 | **Yes** (시뮬레이터 원본) |
| 2026/8/1~9/30 사이 첫 출시인가 | **Yes** |
| RevenueCat/스폰서 직원인가 | **No** |
| 앱 종류 | **iOS** 만 체크 |
| RevenueCat 프로젝트 ID | Project Settings에서 복사 |
| Influencer 카테고리 | **Productivity — Christopher Lawley** |
| Growth Fund 관심 있나 | **Yes** — 공짜고 잃을 게 없습니다 |

## 승인 후 채울 것

| 칸 | |
| --- | --- |
| Published iOS App Store URL | 승인되면 바로 |

## 서술형 — 위에 써둔 것 붙여넣기

| 칸 | 어디에 있나 |
| --- | --- |
| Peace Prize | 이 문서 위쪽 |
| Design Award | 이 문서 위쪽 |
| Influencer Award 설명 | 이 문서의 Productivity 글 |
| HAMM | 아래 |
| Additional notes for judges | 아래 |

## 비워둘 것 — 전부

Google Play URL · Galaxy Store URL · Next Gen 3칸(학생 전용) · Grand Prize(출시 후
성장 데이터가 필요한데 아직 출시 전) · Catvertising(RevenueCat Ads 미사용) ·
Best Game · Kotlin Multiplatform · Most Viral(Noise 미사용) · Best App for
Galaxy · Idea to Income(Replit 미사용) · Keep Them Coming Back(OneSignal 필요 —
우리 알림은 로컬이라 서버가 필요 없고, 한 카테고리 때문에 다시 깔 이유가 없습니다) ·
Growth Loop(Layers 미사용) · Funnel Vision 3칸(Stripe 웹 퍼널 미사용)

**Build in Public**은 윤아님만 답할 수 있습니다 — Shipaton 기간 동안 **만드는
과정**을 공개적으로 올리셨다면 채우고, 모닝루틴 콘텐츠만 올리셨다면 비웁니다.
없는 걸 있다고 쓰면 링크를 요구하는 칸이 바로 옆에 있습니다.

**프로모 코드**는 선택입니다. 데모 계정에 Pro가 켜져 있고 영상 3분 안에 Pro가
나오므로 없어도 됩니다.

---

## HAMM Award — 수익 모델

```
Two auto-renewable subscriptions through RevenueCat over Apple In-App Purchase:
USD 5.99 a month, or USD 49.99 a year with a one-week free trial. They unlock
the same Pro tier.

The part worth explaining is the free tier, because it is not a trial and does
not expire. It includes the morning check-in, the calendar, the streak,
personalised affirmations, the full history, and seven AI readings a month.
Someone who never pays keeps the thing that helps, permanently.

That is a deliberate trade, and the product is the reason for it. Novakitz is
worth something only in accumulation — one morning tells you almost nothing, and
a month of them shows which moods recur and which images repeat. A trial that
expires on day seven deletes the habit exactly where it starts to pay off, and
with it the reason to ever subscribe. So the free tier has to survive long
enough for the person to have something worth reading.

Which means the paywall cannot sit on the daily action. Tapping a pebble is free
forever; it is five seconds and it is the whole ritual. What Pro adds is the
reading of what those mornings amount to: a daily AI dream reading, and the full
monthly review with its written analysis and the archetypes it found. The
monthly review is where the paywall actually bites — once a month, on a screen
showing your own month, with the analysis of it just out of reach.

Novakitz is in the App Store Small Business Program, so Apple's commission is
15% rather than 30%. On the yearly plan that is the difference between keeping
USD 34.99 and USD 42.49 — about 21% more per subscriber, at no cost to the
person paying, which is the rare kind of margin that does not trade against
conversion.

There are no conversion numbers yet: the app is launching now, and the honest
answer is that the first ones will arrive after this hackathon closes. What the
model is built to avoid is the pattern where a free tier is a countdown, the
person feels the clock, and the app becomes another thing that wants something
from them before breakfast.
```

## Additional notes for judges

```
Two things that may help while reviewing.

Novakitz is launching now rather than already launched, so there is no growth or
revenue data to show. The subscription integration is live and verified
end-to-end through RevenueCat, including renewals.

If you have time for only one screen, make it the calendar with a month of data
on the demo account: menu -> Calendar, then step back to August. Each day is the
shape the person actually pressed that morning, at cell size, and a month of
them has a texture. It is the clearest single answer to what this app is for.
```

---

# 이미지 갤러리 구성

## 규격

**1800×1200 (3:2)**, 크림 배경(`#F7F3E9`) 위에 스크린샷을 얹습니다. 스크린샷이
1320×2868이라 그대로 올리면 카드에서 가운데만 남고 위아래가 잘립니다.

세로 스크린샷 하나를 캔버스 높이의 80~85%로 놓으면 양옆에 여백이 크게 남습니다.
그 여백에 **짧은 문장 한 줄**을 넣으세요. 두 장을 나란히 놓아도 됩니다.

**기기 목업 프레임은 쓰지 마세요.** 제출 폼이 프레임 없는 스크린샷을 따로 요구하고
있어서, 갤러리까지 프레임 없이 통일하는 게 헷갈릴 일이 없습니다. 스크린샷 사각형에
옅은 그림자 정도면 충분합니다.

## 순서 — 6~8장이면 충분합니다

15장까지 되지만 **짧은 갤러리가 더 잘 읽힙니다.** 열 장을 넘기면 뒤쪽은 아무도 안
봅니다.

| # | 내용 | 얹을 문장 |
| --- | --- | --- |
| **1** | **표지.** 홈 아트워크를 크게 + 앱 이름 + 한 줄 | `A one-minute morning ritual for a better day.` |
| 2 | 조약돌 8개 | `Eight shapes for how you woke up. Five seconds.` |
| 3 | 갈림길 카드 (꿈 / 무드) | `Then: a dream, if you have one.` |
| 4 | 해석 결과 | `It asks what the sea was doing there.` |
| **5** | **달력 한 달** | `A month is the shapes you actually pressed.` |
| 6 | Reflection | `What keeps coming back.` |
| 7 | 월간 리뷰 (Pro) | `Your month, read back to you.` |
| 8 | Pricing | `Free doesn't expire. It isn't a trial.` |

## 1번이 제일 중요합니다

**갤러리 목록에서 카드 썸네일이 되는 이미지입니다.** 수백 개 출품작 사이에 작게
뜨고, 그걸 보고 들어올지 말지가 결정됩니다.

그래서 1번만은 **스크린샷을 그대로 쓰지 마세요.** 작게 줄이면 원 하나가 점이 되고
아무것도 안 읽힙니다. **아트워크를 프레임 대부분에 크게 놓고, 이름과 한 줄만**
얹으세요. 작게 봐도 읽히는 유일한 구성입니다.

## GIF 한 장을 섞으세요

**갤러리가 GIF를 받습니다.** 정지 이미지만 있는 갤러리 사이에서 움직이는 카드 하나는
눈에 띕니다.

제일 좋은 소재는 **조약돌 선택**입니다 — 원을 탭하면 여덟 개가 펼쳐지고 하나를
고르는 2초. 이 앱에서 제일 예쁘고 제일 짧은 동작이에요.

**5MB 제한이 빡빡하니** 2초 이내, 초당 12프레임, 가로 1200px 정도로 줄이세요.
3번 자리에 넣는 게 좋습니다 — 표지에 넣으면 썸네일이 멈춘 첫 프레임으로 잡힐 수
있습니다.

## 만들 때

전부 같은 크림 배경, 같은 여백, 같은 위치에 문장. **여덟 장이 한 세트로 보여야
합니다** — Design Award에 내는 앱의 갤러리가 제각각이면 그 자체가 반증입니다.
