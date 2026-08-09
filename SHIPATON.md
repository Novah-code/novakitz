# Shipaton 2026 — requirement tracker

**Devpost submission closes 2026-09-30, 23:45 PT.** Judging Oct 1–13 · winners Oct 21.

Sources are RevenueCat's site, Devpost, and a direct ruling from RevenueCat
Developer Support (quoted under §3). The official rules page could not be read
from the build environment, so verify anything surprising against
https://revenuecat-shipaton-2026.devpost.com/rules.

---

## 1. Must-have checklist

Nothing here is optional. A miss on any line means the entry does not count.

### Ship the app

- [ ] App **fully published** on the App Store — not still in review on Sep 30
- [ ] First public store release falls **between Aug 1 and Sep 30, 2026**
- [ ] **RevenueCat SDK powers at least one real purchase or subscription** — code ✅, needs to be live
- [ ] App is **available in the United States** storefront
- [ ] A **US judge can actually use it** — see §4

### Submit on Devpost

- [x] Registered on Devpost *(2026-08-04)*
- [ ] Store URL (live listing, not TestFlight)
- [ ] **Demo video** — see §5 for the constraints that fail entries
- [ ] Screenshots
- [ ] App icon
- [ ] Description

### Apple prerequisites — no store release without these

- [ ] Apple Developer Program (Individual)
- [ ] **Paid Apps agreement** — gates subscription product creation
- [ ] **W-8BEN** — filed through App Store Connect, Part II claims treaty benefits
- [ ] Banking details
- [ ] App Store Connect app record + subscription products
- [ ] **App Privacy** data-collection disclosure — dreams and email are collected
- [ ] Privacy policy URL — `app/legal/privacy` exists ✅
- [x] **Restore Purchases** reachable in-app — required for subscription apps ✅
- [x] Account deletion — required when accounts can be created ✅
- [ ] App icon **1024×1024, no alpha channel** — alpha is an automatic rejection

### Release mechanics — from RevenueCat's pre-launch checklist

- [ ] **Store description discloses auto-renewing subscription details** — Apple
      requires this in the description text itself
- [ ] **Ship the platform key, never a Test Store key** (`test_…`). A Test Store
      key in a release build breaks real purchases. The SDK wrapper now refuses
      to configure if it sees one in a production build.
- [ ] **Release manually, then wait ~24h** before announcing. New in-app
      purchase products can take a day to propagate across the App Store.
- [ ] Consider a **phased rollout** so a bad build can be halted partway
- [ ] After the first-ever release, **verify a real purchase works** — in-app
      purchases do not function in production until the app has actually been
      released, so this cannot be checked beforehand. Only sandbox can.

That last point moves the effective deadline: the app has to be live with
enough slack left to release, wait a day, and confirm purchases work.

### Infrastructure that must not go down

- [ ] **Upgrade Supabase to Pro.** The free tier pauses a project after ~7 days
      of low activity, and Supabase has already flagged this one as scheduled
      for pausing. Everything runs on it — auth, dreams, subscriptions — so a
      pause is a total outage, and the three moments it could land are all
      unrecoverable: during App Store review (guaranteed rejection), during
      judging Oct 1–13, or after the first sale, when the RevenueCat webhook
      would be unable to write the entitlement someone just paid for. Pro also
      adds daily backups, which an app about to hold real user data needs.
      **Must be done before the Sep 1 submission at the latest.**

### Easy to forget, costs money

- [ ] **App Store Small Business Program** — opt-in, not automatic. 30% → 15%.
      Enrol as soon as the developer account is live, before the first sale.

### Only if chasing #BuildInPublic

- [ ] Links to the social accounts used
- [ ] Links to **specific posts** showing progress over time
- [ ] Short write-up of how building in public helped

---

## 2. Dates to work backwards from

| Date | Milestone |
| --- | --- |
| Aug 11 | Apple account active, Paid Apps signed |
| Aug 17 | First TestFlight build uploaded — ugly is fine; the point is to surface signing and IAP problems while there is time |
| Aug 24 | Sandbox purchase verified on a real device |
| **Sep 1** | **First App Store submission** — assumes ~2 rejection rounds at 3–7 days each |
| Sep 22 | Live on the App Store |
| Sep 30 | Devpost submission complete |

"Fully published" is stricter than "submitted": sitting in review on Sep 30 does
not count. That is what fixes the first submission at Sep 1 rather than late
September.

---

## 3. Eligibility — resolved

A pre-existing web app does **not** disqualify. RevenueCat Developer Support
(Hussain), by email, 2026-08-04:

> Based on what you described, Novakitz is eligible. An existing web app does
> not count as a previously released app for this rule. The restriction is
> intended to prevent apps already published through an app store from being
> re-released or ported to another store during the submission window.
>
> You can keep the same name, branding, and core idea as your web app.

**Keep this email.** It is the citation if eligibility is queried at judging.

---

## 4. Making the app testable by a judge

Two separate problems:

1. **US availability.** The territory list must include the United States. It
   does by default — confirm rather than assume.
2. **Getting past the front door.** Most of the app is behind sign-in
   (`handleGuestAction` gates history, calendar, insights, monthly report), so a
   judge who does not sign up sees very little. Either widen the guest
   experience or supply demo credentials in the submission.
3. **Seeing the paid tier.** Premium is part of what is judged and a judge will
   not buy it. Simplest route: create a demo account and grant it premium
   through the existing `app/api/admin/add-subscription` route, then include
   those credentials. App Store promo codes also work.

Default UI language is already English ✅.

---

## 4b. Devpost submission form

Most fields are per-award and can be left blank. Required:

- [ ] 1024×1024 uncropped app icon attached
- [ ] Screenshot attached **without device frames** — no phone mockups
- [ ] "First version released Aug 1–Sep 30, 2026?" → Yes
- [ ] App type → iOS
- [ ] **RevenueCat project ID** — from Project Settings, available today
- [ ] RevenueCat/sponsor employee? → No
- [ ] Published iOS App Store URL
- [ ] Promo code for premium — optional, but see the video note below

Fill in, because leaving them blank forfeits the category:

- [ ] **Peace Prize** — how the app benefits individuals or society
- [ ] **Design Award** — which visual and interaction details judges should look at

Optional, cheap to write: HAMM (monetisation model), Grand Prize (post-launch
growth — there will be little), Build in Public (only if posting).

Also worth entering:

- [ ] **Influencer Award → Productivity** (Christopher Lawley). Only one
      influencer category may be entered, but that does not affect Peace Prize
      or Design Award, so this costs a paragraph and nothing else.

  The fit is real rather than a stretch: `MorningRitual`, `DailyCheckin`,
  `AffirmationsDisplay`, the `daily_intentions` table and streaks make this a
  daily-ritual product, and dream capture is the input to that loop rather than
  the whole app. Lead the pitch with the routine — check in, set today's
  intentions, close the day with a reflection — and present the dream as where
  the intentions come from (`daily_intentions.dream_id` is literally that
  relationship). Leading with Jungian dream interpretation reads as the wrong
  category. `app/pricing/page.tsx` already carries the right framing: "the first
  five minutes decide your day".

Leave blank — not applicable: Catvertising (RevenueCat Ads), Best Game, Ship
Kotlin Everywhere, Most Viral (Noise), Best App for Galaxy, Idea to Income
(Replit), Keep Them Coming Back (OneSignal), Growth Loop (Layers), Funnel Vision
(Stripe), Next Gen (students).

**Keep Them Coming Back** requires OneSignal specifically. Reminders here are
local notifications, which need no server and already answer guideline 4.2 —
not worth re-plumbing for one category.

---

## 5. Demo video — the constraints that fail entries

- **Maximum three minutes.** Short enough to need a script.
- **Premium has to appear inside those three minutes.** The submission form
  warns that judges are not required to redeem a promo code, so the paid tier
  cannot be left for them to find on their own. Budget the script accordingly —
  spending two minutes on free features leaves no room for what is being judged.
- **Must show the app running on the target device.** A browser recording of the
  web app does not satisfy this — record from a real iPhone.
- **Hosted publicly** (YouTube, Vimeo) with the link in the submission.
- **No copyrighted music, trademarks, or protected material.** A calm wellness
  app is exactly the kind that reaches for a licensed track.

---

## 6. Award categories

Nine categories, $700k+. Where Novakitz actually fits:

| Award | Fit | Needs |
| --- | --- | --- |
| **Peace Prize** (mental health) | 🟢 Strong — dream journalling, inner reflection | The product as-is |
| **Design Award** | 🟢 Strong — the landscape home screen targets this | Finished day/night scene |
| #BuildInPublic | 🟡 Only if posting starts now — cannot be back-filled in September | §1 |
| AI | 🟡 Gemini-backed dream analysis | Nothing extra |
| HAMM (revenue) | 🔴 Needs real revenue in ~6 weeks | — |
| Grand Prize | 🟡 | — |

Peace Prize and Design Award are the realistic targets, and both are extensions
of work already underway.

---

## 7. Build status

On `claude/revenue-hackathon-pwa-app-r6w9jo`:

- ✅ Capacitor shell — static export, API routes stay on Vercel
- ✅ Gumroad and Toss removed
- ✅ RevenueCat — purchase, restore, webhook → `user_subscriptions`
- ✅ Local notifications — daily ritual reminders (also the guideline 4.2 answer)
- ✅ TypeScript and ESLint enforced at build
- 🟡 Home landscape scene — structure done, waiting on artwork; night gated
  behind `NIGHT_SCENE_READY`

Waiting on:

1. **Apple Developer enrolment → Paid Apps agreement.** Until signed, no
   subscription products exist, so none of the RevenueCat work can be verified.
2. Day artwork → `public/scenes/scene-day.png` (see that folder's README)
3. Night artwork, app icon

### First iOS build

Once Xcode has finished installing:

```bash
xcode-select --install        # command line tools
sudo gem install cocoapods    # Capacitor iOS depends on it

git pull && npm install
npx cap add ios               # one time — generates ios/
npm run ios                   # build → sync → Info.plist → open Xcode
```

`npm run ios` runs `scripts/prepare-ios.sh`, which writes the Info.plist usage
strings. Re-running `cap add ios` regenerates that file, so never edit it by
hand — add keys to the script instead.

In Xcode, before the first run:

| Where | What |
| --- | --- |
| Signing & Capabilities | Tick **Automatically manage signing**, pick the team |
| Signing & Capabilities | Bundle Identifier reads `com.novakitz.app` |
| General → Minimum Deployments | iOS 14 or later (Capacitor 8's floor) |
| App icon | `App/Assets.xcassets/AppIcon` — 1024×1024, **no alpha channel** |

`NEXT_PUBLIC_REVENUECAT_IOS_KEY` has to be in `.env.local` **on the Mac** before
`npm run ios`: the key is inlined into the bundle at build time, so setting it
only in Vercel leaves the app without it.

### Values the code expects

| Thing | Value | Defined in |
| --- | --- | --- |
| Bundle ID | `com.novakitz.app` | `capacitor.config.ts` |
| Entitlement | `premium` | `src/lib/revenuecat.ts` |
| Packages | `$rc_monthly`, `$rc_annual`, `$rc_lifetime` | `src/lib/revenuecat.ts` |
| Webhook URL | `https://www.novakitz.shop/api/revenuecat-webhook` | — |
| `REVENUECAT_WEBHOOK_SECRET` | Vercel env — server-side | webhook route |
| `NEXT_PUBLIC_REVENUECAT_IOS_KEY` | **Mac `.env.local`** — baked into the app bundle at build, so Vercel alone is not enough | `src/lib/revenuecat.ts` |
