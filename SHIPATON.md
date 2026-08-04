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

## 5. Demo video — the constraints that fail entries

- **Maximum three minutes.** Short enough to need a script.
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

### Values the code expects

| Thing | Value | Defined in |
| --- | --- | --- |
| Bundle ID | `com.novakitz.app` | `capacitor.config.ts` |
| Entitlement | `premium` | `src/lib/revenuecat.ts` |
| Packages | `$rc_monthly`, `$rc_annual`, `$rc_lifetime` | `src/lib/revenuecat.ts` |
| Webhook URL | `https://www.novakitz.shop/api/revenuecat-webhook` | — |
| `REVENUECAT_WEBHOOK_SECRET` | Vercel env — server-side | webhook route |
| `NEXT_PUBLIC_REVENUECAT_IOS_KEY` | **Mac `.env.local`** — baked into the app bundle at build, so Vercel alone is not enough | `src/lib/revenuecat.ts` |
