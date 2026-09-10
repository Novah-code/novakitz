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
