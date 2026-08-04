# Shipaton 2026 — requirement tracker

Deadline: **2026-09-30, 23:45 PT** (Devpost submission closes)
Judging: 2026-10-01 → 10-13 · Winners: 2026-10-21

> Compiled from RevenueCat and Devpost sources. The official rules page could
> not be read directly from this environment, so **verify anything marked ❓
> against https://revenuecat-shipaton-2026.devpost.com/rules before relying on
> it.**

---

## A. Eligibility — miss one and the entry is void

| # | Requirement | Status |
| --- | --- | --- |
| A1 | First public version live on App Store / Google Play / Samsung Galaxy Store **between Aug 1 and Sep 30, 2026** | ⬜ Not shipped |
| A2 | Pre-existing web app does not disqualify | ✅ **CONFIRMED** — see below |
| A3 | RevenueCat SDK powers at least one purchase or subscription | 🟡 Code done, not yet live |
| A4 | **Fully published by the deadline — not still in store review** | ⬜ Drives the Sep 1 submission date |
| A5 | **Judges in the United States can download and test it** | ⬜ See A5 notes |
| A6 | Built for iOS / iPadOS / macOS / Android | 🟡 Capacitor iOS shell ready |
| A7 | Registered on Devpost | ✅ 2026-08-04 |

### A2 — resolved

Answered by RevenueCat Developer Support (Hussain), 2026-08-04, by email:

> Based on what you described, Novakitz is eligible. An existing web app does
> not count as a previously released app for this rule. The restriction is
> intended to prevent apps already published through an app store from being
> re-released or ported to another store during the submission window.
>
> You can keep the same name, branding, and core idea as your web app.

**Keep this email.** It is the citation if eligibility is ever queried at
judging.

### A4 — "fully published" is stricter than "submitted"

Sitting in App Store review on Sep 30 does not count. Apple review is measured
in days per round and rejections are normal, so the first submission needs to go
in around **Sep 1** to absorb two rounds and still leave a buffer.

### A5 — the app has to be testable by a US judge

Two separate things:

1. **US availability.** The App Store territory list must include the United
   States. It does by default, but confirm it in App Store Connect rather than
   assuming.
2. **Judges must get past the front door.** Anything gated behind sign-up needs
   a way in — the existing guest mode may be enough, otherwise supply demo
   credentials in the Devpost submission. Note the paid tier is also part of
   what is being judged: consider App Store promo codes so a judge can see the
   premium experience without paying. The default UI language should be English.

---

## B. Submission artifacts — all due Sep 30

| # | Item | Notes | Status |
| --- | --- | --- | --- |
| B1 | Store URL | Live listing, not TestFlight | ⬜ |
| B2 | Demo video | **Max 3 minutes**, hosted public (YouTube/Vimeo), link in submission | ⬜ |
| B3 | Screenshots | ⬜ |
| B4 | App icon | ⬜ |
| B5 | Description | ⬜ |

### Video constraints that bite late

- **Must show the app running on the target device.** A browser recording of
  the web app does not satisfy this — record from a real iPhone.
- **No copyrighted music, trademarks, or protected material.** A calm wellness
  app is exactly the kind that reaches for a pretty licensed track. Use
  genuinely royalty-free audio or none.
- Three minutes is short. Script it rather than improvising.

---

## C. Award categories

Nine categories, $700k+. Relevant fits for Novakitz:

| Award | Fit | What it needs |
| --- | --- | --- |
| **Peace Prize** (mental health) | 🟢 Strong — dream journalling, inner reflection | The product as-is |
| **Design Award** | 🟢 Strong — the landscape redesign targets this | Finished day/night home screen |
| **#BuildInPublic** | 🟡 Possible — **but only if started now** | See below |
| AI | 🟡 Gemini-backed dream analysis | Nothing extra |
| HAMM (revenue) | 🔴 Weak — needs real revenue in ~6 weeks | — |
| Grand Prize | 🟡 | — |

### C1. #BuildInPublic cannot be back-filled

This is the item that is easy to miss and **impossible to fix in September.**
It is judged on a development journey shared publicly over time, and submission
requires:

- links to the social accounts used
- links to **specific posts** where progress was shared
- a short write-up of how building in public helped the app

A single post in late September does not read as a journey. If this category is
wanted, posting starts **this week** — the Capacitor migration, dropping Gumroad
for RevenueCat, and the home redesign are all natural material.

---

## D. Current state

Shipped on `claude/revenue-hackathon-pwa-app-r6w9jo`:

- ✅ Capacitor shell — static export, API stays on Vercel
- ✅ Gumroad and Toss removed
- ✅ RevenueCat: purchase, restore, webhook → `user_subscriptions`
- ✅ Home screen landscape scene (day; night gated behind `NIGHT_SCENE_READY`)

Blocking everything downstream:

1. **Apple Developer enrolment** → then **Paid Apps agreement + banking/tax
   (W-8BEN)**. Until that agreement is signed, subscription products cannot be
   created, so none of the RevenueCat work can be verified.
2. Night artwork + app icon (1024×1024, **no alpha channel**)
3. A2 above

### Apple account setup — order matters

| Step | Note |
| --- | --- |
| Apple Developer Program, **Individual** | Organization needs a D-U-N-S number, which alone can run past the deadline. Trade-off: the seller name shown on the App Store is the person's legal name. |
| Paid Apps agreement | Gates subscription product creation |
| Tax forms — **W-8BEN** | Filed per withholding agent, so a copy given to another platform does not carry over. Filled in through App Store Connect's interactive flow rather than by uploading a PDF. **Part II is what claims treaty benefits** — skipping it leaves 30% withheld on US royalties. Needs a TIN; a foreign TIN is accepted. |
| Banking details | |
| **App Store Small Business Program** | **Opt-in, not automatic.** Drops commission from 30% to 15%. A developer with no prior App Store revenue qualifies immediately. Free, ~5 minutes, and can run in parallel with the agreement steps. Enrol as soon as the account is active — it should be in effect before the first sale. Requires disclosing any associated developer accounts; the $1M proceeds threshold is assessed across all of them. |

## E. Dates to work backwards from

| Date | Milestone |
| --- | --- |
| Aug 11 | Apple account active, Paid Apps signed |
| Aug 17 | First TestFlight build uploaded — ugly is fine, the point is to surface signing and IAP problems early |
| Aug 24 | Sandbox purchase verified on a real device |
| **Sep 1** | **First App Store submission** — assumes ~2 rejection rounds at 3–7 days each |
| Sep 22 | Live on the App Store |
| Sep 30 | Devpost submission complete |

Submitting to Apple in late September is not a plan.
