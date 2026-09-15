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
Novakitz is a morning routine that happens to be about dreams, not a dream
dictionary that happens to open in the morning.

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
dream and the routine still completes — which is the difference between a
habit that holds and one that depends on remembering something you cannot
control.
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

# About the project — 본문

Devpost의 `About the project` 칸에 그대로 붙여넣습니다. 마크다운이 지원되니 헤더가
그대로 렌더됩니다.

**전부 실제로 있었던 일입니다.** 과장한 부분이 없어야 심사위원이 앱을 열었을 때
어긋나지 않습니다.

```markdown
## Inspiration

Before Novakitz was an app, it was a website, and the only way anyone found it
was the morning routine content I have been posting for a while. Not one viral
post — a steady habit of sharing my own mornings.

Fifty-one people signed up that way. Strangers, not friends, some in Korea and
some not. Fourteen of them kept going past the third day, averaging thirteen
days each. One lasted forty-two.

There was no app. No icon on a home screen, no notifications, nothing that
could bring anyone back. To use it they opened a browser and typed an address,
every morning, for six weeks.

Then they all stopped, within the same few days.

I had assumed what I needed was a better reason for people to return. Those
forty-two days say otherwise — the reason was already there. What was missing
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

Wrapping the existing web app rather than rewriting in Swift was a deliberate
choice, and the fourteen users are the reason: they already had accounts and
months of records, and a rewrite would have meant starting the product from
zero to gain rendering I do not need. What this app draws is text, colour and a
circle. The eight mood shapes are border-radius morphs; the grain over the sky
is an SVG filter; the calendar is CSS grid. There is no image asset in the
interface at all.

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
a drawer. A weekly recap that arrives instead of waiting to be found. And the
morning reminder — the signal those fourteen people never got.
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
