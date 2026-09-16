# Guideline 4.3(a) — Spam 반려 대응

**2026-09-16 수신.** 지금까지 받은 반려 중 제일 무거운 종류입니다. 다만 **자동
패턴 매칭으로 잘못 걸리는 일이 흔하고, 뒤집히는 경우도 흔합니다.**

## 먼저 알아두실 것

**4.3(a)는 "당신 앱이 형편없다"가 아닙니다.** *다른 앱과 바이너리·메타데이터·컨셉이
비슷하다*는 뜻이고, 어느 앱과 비슷한지는 **알려주지 않습니다.** 그게 이 반려의 제일
힘든 부분입니다.

**Extended Review 문단은 4.3 반려에 붙는 정형 문구입니다.** 계정이 지금 위험하다는
통보가 아니라, 같은 문제로 반복 제출하면 그렇게 된다는 경고예요. 한 번 받은 것으로
계정이 어떻게 되지 않습니다.

## 왜 걸렸을 가능성이 높은가

확인할 방법은 없지만, 가장 그럴듯한 원인은 **Capacitor 셸**입니다.

Capacitor 앱의 바이너리는 형태가 매우 일정합니다 — `AppDelegate.swift`,
`SceneDelegate.swift`, `CapacitorBridge`, 똑같은 프로젝트 구조. 그리고 **"웹사이트를
감싸서 올리는" 저품질 스팸 앱이 정확히 이 방식을 씁니다.** 네이티브 코드가 거의 없는
Capacitor 앱은 그 그물에 함께 걸리기 쉽습니다.

그 다음 후보는 **컨셉 유사성**입니다. "AI 꿈 해석" 카테고리에 템플릿으로 찍어낸
앱이 아주 많습니다.

## 반박 근거 — 이 앱에는 드문 것이 하나 있습니다

**앱이 되기 전에 웹에서 먼저 돌았고, 실제 사용자가 있었습니다.**

- `novakitz.com`이 공개되어 살아 있습니다 — Apple이 직접 확인할 수 있습니다
- 가입 51명, 그중 14명이 3일 이상, 한 명은 42일 (§9-1)
- RevenueCat 측 이메일(2026-08-04)에도 기존 웹 앱의 존재가 남아 있습니다

**템플릿을 사서 재포장한 사람에게는 이런 것이 없습니다.** 몇 달치 웹 운영 기록과
살아 있는 도메인, 실사용자 데이터는 지어낼 수 없고, 이게 제일 검증 가능한 증거입니다.

---

## 윤아님이 먼저 확인해주셔야 할 것

아래 답변은 **"이 계정으로 제출한 앱이 Novakitz 하나뿐"** 이라는 전제로 썼습니다.
사실이 아니라면 그 문장을 빼야 합니다 — Apple은 계정 이력을 보고 있고, 틀린 진술이
제일 위험합니다.

- [ ] 이 개발자 계정으로 **다른 앱을 제출한 적이 있는가** (승인·반려·삭제 전부 포함)
- [ ] 다른 Apple 개발자 계정을 갖고 있거나 가진 적이 있는가
- [ ] 이 코드베이스나 디자인을 다른 사람과 공유하거나 판매한 적이 있는가

---

## Resolution Center 답변 — 붙여넣을 글

```
Thank you for the review. Novakitz is not a template app, a repackaged app, or
a variation of any other app, and I would like to give you the specifics.

THIS IS THE ONLY APP ON THIS ACCOUNT

Novakitz is the first and only app I have submitted, from this or any other
developer account. There is no second app of mine for it to resemble.

IT EXISTED AS A PUBLIC WEB APP BEFORE IT WAS SUBMITTED

Novakitz has been running publicly at https://novakitz.com for months, built
and operated by me. It has real users: fifty-one people signed up, fourteen of
them used it for more than three days, and one used it daily for forty-two
days — before there was any app, any icon or any notification, typing the
address into a browser each morning.

The website is live and you can open it now. The design, the artwork, the
wording and the interaction are the same ones in the submitted build, because
the app is my own web app brought to iOS, not a template filled in.

ABOUT THE BINARY

The app is built with Capacitor, a widely used open-source framework, so the
iOS project contains that framework's standard scaffolding — AppDelegate,
SceneDelegate, the Capacitor bridge. If the similarity detected is in that
layer, it is the framework, and it is shared by many unrelated apps. Everything
above it is mine: the application code, the interface, the artwork and the
content are all original work, and no third-party app template was purchased or
used at any point.

WHAT IS SPECIFIC TO THIS APP

  - The eight morning moods are eight different shapes, not eight colours, and
    the calendar redraws those same shapes at cell size, so a month reads as
    the sequence of shapes the person pressed.
  - The home screen artwork is a landscape I drew myself.
  - The streak forgives one missed day each calendar month and tells the person
    it did.
  - The reading of a dream is written as a question about the dream rather than
    a dictionary definition of its symbols.

None of these come out of a template, and I am happy to provide source history,
design files, or anything else that would help.

A REQUEST

If the submission was matched against a particular app, I would be grateful to
know which one. I cannot address a similarity I cannot see, and I would rather
fix a real problem than guess.
```

---

## 순서

**1. 위 답변을 Resolution Center에 보냅니다.** 오늘 보내세요. 빌드는 바꾸지
않습니다 — 고칠 결함이 지목된 게 아니라 정체성이 의심받은 것이고, 새 빌드는 답이
아닙니다.

**2. 같은 답이 또 오면 App Review Board에 이의제기합니다.** Resolution Center 답변과
별개의 절차이고, 사람이 다시 봅니다. 4.3은 여기서 뒤집히는 경우가 많습니다.

**3. 그래도 막히면 앱을 더 "네이티브"하게 만드는 쪽입니다** — 위젯, Live Activity
같은 네이티브 익스텐션 (§7-0-2). 바이너리가 Capacitor 셸로만 보이지 않게 하는
것인데, 시간이 걸리므로 1·2가 실패한 뒤의 이야기입니다.

## Devpost 마감

**9/30까지 14일 남았고, 제출에는 게시된 App Store URL이 필요합니다.**

4.3 이의제기는 며칠이 걸릴 수 있어서 **이번 건은 마감에 실질적인 위험입니다.**
그래도 오늘 답변을 보내면 시간은 남아 있습니다. 데모 영상과 나머지 제출 항목은
심사와 무관하게 지금 끝내두는 게 맞습니다 — 승인이 늦게 나도 URL 하나만 넣으면
되도록.
