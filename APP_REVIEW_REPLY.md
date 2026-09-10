# Guideline 2.1 — 정보 요청 답변

> ## 상태: 답변 발송 완료 (2026-09-11)
>
> 다시 확인하실 필요 없는 것들입니다.
>
> - **화면 녹화** — 실기기에서 촬영, 첨부 완료
> - **답변 본문** — App Review 메시지 답장 + App Review Information → Notes 양쪽에
>   입력 완료. Notes는 4,000자 제한이 있어 3,949자로 줄인 판을 넣었습니다
>   (내용 손실 없음, 문장만 압축)
> - **빌드 3** — Archive → Distribute → Upload 완료
>
> **남은 것 하나:** 빌드 처리가 끝나면 (Apple에서 메일이 옵니다) 버전 페이지에서
> **빌드 3을 선택하고 저장**해야 합니다. 업로드만으로는 심사자에게 가는 빌드가
> 바뀌지 않습니다. `Build` 칸에 `3`이 보이면 끝입니다.
>
> ### 빌드 3에 들어간 것 — 영상에 나오는 화면들
>
> 빌드 2에는 없는 것들이라, 빌드가 3으로 바뀌지 않으면 심사자가 보는 앱과 영상이
> 어긋납니다.
>
> | | |
> | --- | --- |
> | `c860234` | 결제 화면의 **Restore Purchases** |
> | `8d5af56` | 결제 화면의 **Terms · Privacy · Refund 링크가 열리는 것** |
> | `9634f95` | 프로필 셋업에서 `Set this up later` 삭제, 이름에 한글 허용 |
> | `511fd3d` | 토스트와 약관 페이지 스타일 (Tailwind 미적용 수정) |
> | `c8f99f6` / `106e3e4` | `READING` 라벨, FAQ의 출처 설명 |
> | `a2d5124` / `4d5a65d` | 캘린더 즉시 반영, 오후에 찍은 조약돌도 표시 |


Apple이 신규 개발자 계정에 보내는 표준 질문지입니다. **앱이 반려된 것이 아니라
정보가 부족하다는 뜻**이고, 코드 수정은 필요 없습니다. 확인해보니 Apple이 요구하는
두 가지는 이미 들어 있습니다:

- 계정 삭제 — `ProfileSettings.tsx:766`, 메뉴 → 프로필에서 도달
- 결제 화면의 Terms / Privacy / Refund 링크 — `app/pricing/page.tsx`

**하나는 없어서 추가했습니다: 결제 화면의 `Restore Purchases` 버튼.**
`restorePurchases()`는 몇 달 전에 작성돼 있었지만 호출하는 곳이 support 페이지뿐이었고,
그 페이지는 앱 어디에서도 링크되지 않습니다. 즉 재설치한 사람이 이미 결제한 것으로
돌아갈 길이 없었고, 가이드라인 3.1.1이 요구하는 컨트롤도 심사자 눈에 안 보였습니다.
이번엔 2.1 질문지에서 멈춰서 안 걸렸지만 다음 라운드에서 걸릴 항목이었습니다.

**그래서 빌드를 다시 올려야 합니다** (빌드 번호 3). 어차피 녹화를 새로 찍어야 하니
같이 처리하는 게 맞습니다.

---

## ① 화면 녹화 — 실기기에서

시뮬레이터는 안 됩니다. Apple이 "physical device"라고 못박았고, 시뮬레이터 녹화는
프레임과 상태바가 달라서 바로 알아봅니다. 윤아님 아이폰에 빌드해서 찍으세요.

**녹화 시작:** 설정 → 제어 센터에 `화면 기록` 추가 → 제어 센터에서 시작

**촬영 순서** (통째로 한 번에, 편집하지 마세요. 3~5분):

1. **홈 화면에서 앱 아이콘 탭** — 실행 장면이 반드시 들어가야 합니다
2. **회원가입** — 이 녹화용으로 새 계정을 하나 만드세요 (`test+review@…`).
   데모 계정으로 하지 마세요, 뒤에서 지울 거라서요
3. **원을 한 번 탭** → 조약돌 8개 → 하나 선택
4. 다음 카드에서 **`Remember a dream?`** → 꿈 입력 → 해석 결과가 나올 때까지
   기다렸다 스크롤

   길게 누르기는 **안 보여줘도 됩니다.** 그건 조약돌을 건너뛰는 단축키일 뿐이고,
   Apple이 요구한 건 "typical user flow"입니다. 탭으로 가는 길이 그 길이에요.
5. **메뉴(우상단)** → Calendar → 8월로 넘겨서 조약돌 보이기 → 닫기
6. **메뉴** → Reflection → 끝까지 스크롤 → 닫기
7. **메뉴** → Monthly Review → 스크롤 → 닫기
8. **메뉴 → Pricing** — 여기서 **천천히**:
   - 월간 카드에 제목 · 기간 · 가격이 다 보이게 3초 멈춤
   - 연간 카드도 3초 멈춤
   - 화면 아래 **Terms / Privacy / Refund 링크가 보이게** 스크롤해서 3초 멈춤
   - **`Restore Purchases` 버튼**이 보이게 (이번에 추가한 것)
9. **메뉴 → 프로필 → Delete Account** → 확인 → 계정이 삭제되고 로그아웃되는 것까지

**8번과 9번이 이번 반려의 핵심입니다.** Apple이 명시적으로 요구한 두 가지예요 —
구독 화면의 필수 표기, 그리고 계정 삭제. 나머지는 맥락입니다.

업로드는 App Store Connect 답변 창의 첨부 또는 Google Drive 링크.

---

## ② 답변 본문

App Store Connect → App Review → 메시지 답장에 붙여넣고, **같은 내용을 App Review
Information의 Notes에도** 넣으세요 (Apple이 그렇게 요구했습니다).

```
Thank you for the review. A screen recording captured on a physical iPhone is
attached, beginning with the app launch and covering the sign-up flow, the daily
ritual, the subscription screen and account deletion.

2. PURPOSE AND TARGET AUDIENCE

Novakitz is a one-minute morning ritual. The person opens it just after waking,
taps a circle, and chooses one of eight shapes for how they woke up. The app
then asks whether they remember a dream; if they do, they write it down and
receive a reflective reading of it.

The problem it addresses is that mornings are usually spent reacting to a screen
full of other people's demands, and that the feelings and dreams people wake with
go unrecorded and therefore unnoticed. A single morning tells you very little; a
month of them shows patterns — which moods recur, which images repeat in dreams,
how the weeks have leaned. The app exists to make that record cheap enough to
keep every day.

The audience is adults who want a short, low-effort reflective habit. It is not a
clinical or medical product, is not marketed as one, and makes no diagnostic or
therapeutic claims.

3. SETTING UP AND ACCESSING THE MAIN FEATURES

Demo account (Pro already active, with about a month of recorded mornings so
every screen has real data):

  User name: info.muonkr@gmail.com
  Password:  Novakitz2026!

The home screen is a single circle. Everything below is reachable by tapping.

  1. TAP the circle once. Eight shapes appear — choose the one that matches how
     you woke up.
  2. The next card asks whether you remember a dream. "Remember a dream?" opens
     the dream entry form; "Check your mood" ends the morning there. Either
     answer completes the morning, and the whole thing takes under a minute.
  3. A dream you write is sent for a reflective reading, which appears on the
     same screen after a few seconds.

  There is also a shortcut: pressing and holding the circle for about a second
  skips the shapes and opens the dream form directly. It is optional — nothing
  requires it.

The menu button at the top right opens Inner Journal, Calendar, Reflection,
Monthly Review, Pricing, and profile settings.

To see accumulated data on the demo account: menu -> Calendar, then step back to
August. Reflection and Monthly Review are populated from the same records.

Account deletion: menu -> profile -> Delete Account. It removes the account and
its records permanently.

4. EXTERNAL SERVICES USED

  - Supabase — authentication and database. Stores the user's account, mood
    check-ins and dream entries.
  - Google Gemini — generates the reflective reading of a dream and the monthly
    summary. Dream text is sent to Gemini to produce that reading.
  - Apple In-App Purchase — the only payment method in the iOS app.
  - RevenueCat — subscription state management on top of Apple In-App Purchase.
    It does not process payments; Apple does.
  - Apple Sign In and Google Sign In — optional sign-in methods, alongside
    email and password.

No other third-party service is involved in delivering the core functionality.

5. REGIONAL DIFFERENCES

There are none. The app behaves identically in every region and every feature is
available everywhere it is sold. The interface is offered in English and Korean;
the language is chosen by the user in the app and is not tied to region. Prices
are set through App Store Connect's standard territory pricing.

6. REGULATED INDUSTRY OR THIRD-PARTY MATERIAL

Novakitz does not operate in a regulated industry. It is a journaling app. It is
not a medical device, does not provide medical, psychological or diagnostic
services, and does not present itself as a substitute for professional care. The
Terms of Service state this explicitly, and the app's interpretations are written
as reflective prompts rather than advice.

The app contains no third-party protected material. All artwork, text and design
are original works by the developer. Dream readings are generated by an AI model
in response to what the user writes; they are not drawn from any licensed or
copyrighted corpus.

7. WHAT USERS CAN BUY WITH IN-APP PURCHASE

Two auto-renewable subscriptions unlock the same Pro tier:

  - Novakitz Pro Monthly (novakitz.pro.monthly) — 1 month, USD 5.99
  - Novakitz Pro Yearly  (novakitz.premium.yearly) — 1 year, USD 49.99,
    with a one-week free trial for new subscribers

Pro adds a daily AI dream reading, the full Monthly Review with its written
analysis and discovered archetypes, and the complete history.

The free tier is not a trial and does not expire. It includes the morning mood
check-in, the calendar, the streak, personalised affirmations, the full history,
and seven AI readings each month.

How to reach the purchase flow: open the menu at the top right and tap Pricing.
It is also reachable from the Monthly Review screen for free accounts. That
screen shows the title, duration and price of each subscription, and links to the
Terms of Use and the Privacy Policy. A Restore Purchases control is on the same
screen, directly above those links.

USER-GENERATED CONTENT

The app has no social or shared content. Everything a person writes is private to
their own account and is never shown to another user, so there is no feed to
report or block within.
```

---

## 제출 순서

1. `git pull && npm run build:app && npx cap sync ios`
2. Xcode → App 타겟 → General → **Build를 `3`으로**
3. `Any iOS Device (arm64)` → Product → Archive → Distribute → Upload
4. 처리 완료되면 버전 페이지에서 **빌드 3 선택**
5. 실기기에 그 빌드를 깔고 **화면 녹화**
6. App Review에 답장 + Notes에 같은 내용 붙여넣기
7. 다시 제출

빌드를 바꾸지 않고 답장만 보낼 수도 있습니다. 그러면 이번 라운드는 통과할 가능성이
높지만, 심사자가 결제를 실제로 테스트하는 단계에서 복원 버튼을 못 찾으면 3.1.1로
다시 반려됩니다. 마감이 9월 30일이라 여유는 있지만, 한 라운드를 아끼는 쪽을
권합니다.

이 답변을 Notes에 넣어두면 다음 버전 심사부터는 같은 질문을 받지 않습니다.
Apple이 "for reference on future submissions"라고 쓴 게 그 뜻입니다.
