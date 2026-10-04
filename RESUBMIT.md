# 새 빌드 만들어서 다시 제출하기

반려를 고친 뒤 할 일입니다. **한 번에 하나씩** 하세요.

---

## 0. 먼저 — 두 번 겪은 실수 두 개

**명령어를 여러 줄 한꺼번에 붙여넣지 마세요.** 2026-09-14에 `git pull`이 vim을
열었고, 뒤에 붙여넣은 두 줄을 터미널이 아니라 **vim이 받아먹었습니다.** 빌드가
돌지 않았는데 돈 줄 알고 몇 시간을 날렸습니다. 한 줄 실행 → 끝난 것 확인 → 다음 줄.

**업로드와 선택은 다른 일입니다.** 2026-09-10에 빌드 3을 올려두고 버전에
연결하지 않아, 제출이 `Rejected` 상태로 **나흘을 그대로 있었습니다.** Xcode가
"Upload Successful"이라고 해도 아직 제출된 것이 아닙니다. 아래 5번이 그 단계입니다.

---

## 1. 코드 받기

```
git pull --no-rebase --no-edit origin claude/revenue-hackathon-pwa-app-r6w9jo
```

`--no-edit` 가 중요합니다. 빠지면 vim이 열리고, 다음 줄에 붙여넣은 명령을 vim이
받아먹습니다. 이미 한 번 당했습니다.

**`git reset --hard` 를 쓰지 마세요.** 2026-10-04에 그것 때문에
`ios/App/App.xcodeproj/project.pbxproj` 가 사라졌습니다.

이 저장소에는 `ios/` 폴더가 없습니다 (§5-1). 그런데 로컬에는 커밋돼 있어서,
`reset --hard` 가 "원격에 없는 추적 파일"로 보고 지웁니다. Xcode 프로젝트가
통째로 날아가고 서명·기능 설정을 다시 만들어야 합니다.

충돌이 나면 멈추고 물어보세요. `reset --hard` 로 넘기지 마세요 — 그게 이 사고의
전부입니다.

## 2. 웹 번들 만들기

```
npm run build:app
```

마지막 줄에 `Static app bundle ready:` 가 나와야 합니다. 안 나오면 멈추고,
에러를 그대로 보여주세요. 여기서 실패한 채로 다음으로 가면 **지난 빌드가 그대로
포장됩니다** — "분명 고쳤는데 앱에 반영이 안 됐다"가 대부분 이 경우입니다.

## 3. iOS 프로젝트에 복사

```
npx cap sync ios
```

`✔ copy ios` 와 `✔ update ios` 가 보여야 합니다.

## 4. Xcode에서 올리기

```
npx cap open ios
```

1. 왼쪽 맨 위 **App** 프로젝트 클릭 → **General** 탭
2. **Build** 번호를 하나 올립니다 — 3이면 **4**로
   - Version(`1.0`)은 그대로 둡니다. 같은 1.0의 새 빌드예요
   - **같은 번호로는 업로드가 거부됩니다**
3. 위쪽 기기 선택에서 **Any iOS Device (arm64)** 선택
   - 시뮬레이터가 선택돼 있으면 Archive 메뉴가 비활성입니다
4. 메뉴 **Product → Archive**
5. 끝나면 창이 뜹니다 → **Distribute App** → **App Store Connect** → **Upload**

여기까지 하면 **업로드만 된 것입니다. 아직 제출 아닙니다.**

## 5. App Store Connect에서 빌드 선택 ← 제일 많이 빠뜨리는 단계

1. 업로드 후 **10~30분** 기다립니다 (Apple이 처리하는 시간)
   - 그동안 "Processing" 메일이 오고, 끝나면 또 옵니다
2. App Store Connect → 앱 → 왼쪽에서 **1.0** 버전
3. **Build** 항목에서 **＋** 를 눌러 **방금 올린 빌드(4)** 를 고릅니다
4. 화면 위 상태가 **Prepare for Submission** 인지 확인

## 6. 심사 메모 쓰고 제출

**App Review Information → Notes** 에 이번에 무엇을 고쳤는지 적습니다. 반려
가이드라인 번호를 그대로 언급하면 심사자가 바로 찾습니다.

그리고 **Add for Review** → **Submit to App Review**.

## 7. 제출됐는지 확인

버전 페이지 맨 위가 **`Waiting for Review`** 여야 합니다.

- `Prepare for Submission` 이면 → 아직 제출 안 됐습니다. 6번 다시
- `Rejected` 그대로면 → 빌드가 선택 안 된 것입니다. 5번 다시

---

## 자동 게시 확인 (한 번만)

같은 버전 페이지 아래 **Version Release**:

- ✅ **Automatically release this version**

여기가 Manual이면 **승인이 나도 게시되지 않습니다.** 승인과 게시는 다른 일입니다.

---

## 기다리는 동안 하지 말 것

- **새 빌드 업로드·선택** — 줄 맨 뒤로 갑니다
- **Cancel Submission** — 줄에서 빠집니다
- 버전 페이지의 다른 항목 수정

Resolution Center에 답장하는 것은 줄 순서를 **바꾸지 못합니다.** 순서를 앞당길 수
있는 곳은 `developer.apple.com` → Contact Us → App Review → **빠른 앱 심사 요청**
하나뿐입니다.
