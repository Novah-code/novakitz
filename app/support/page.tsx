'use client';

/*
 * The page the App Store's Support URL points at.
 *
 * Apple requires that field, and a reviewer follows it. So this has to be a
 * real support page rather than a placeholder: a contact address that works,
 * the cancellation path stated the way Apple requires (through Settings, not
 * through us), a reachable way to restore a purchase, and the account-deletion
 * path guideline 5.1.1(v) asks for.
 *
 * It is also the first thing a stranger sees if something has gone wrong at
 * six in the morning, which is why it is not a wall of policy. The answers say
 * what to tap.
 *
 * English only, deliberately. The app ships to English-speaking markets, the
 * legal documents this links to carry their own Korean sections, and a support
 * page that half-translates is worse than one that does not.
 */

import { goTo } from '../../src/lib/platform';
import { useState } from 'react';
import FAQItem from '../../src/components/FAQItem';
import { G, panel } from '../../src/lib/uiTokens';
import { restorePurchases } from '../../src/lib/checkout';
import Toast, { ToastType } from '../../src/components/Toast';

const SUPPORT_EMAIL = 'hello@novakitz.com';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{
        margin: '0 0 16px', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: G.textLight,
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function SupportPage() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  /*
   * Restore was written months ago and exported, and then never called from
   * anywhere — the one comment in checkout.ts even says review requires it to
   * be reachable. Someone who reinstalls, or signs in on a second device, has
   * no other way to get their subscription back, and a support page cannot
   * describe a button that does not exist.
   */
  const handleRestore = async () => {
    const { message } = await restorePurchases('en');
    if (message) setToast({ message, type: 'info' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(160deg, ${G.bgMain} 0%, #F2F7F0 55%, #F7F3E9 100%)`,
      padding: 'clamp(24px, 5vw, 56px) 20px 64px',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        <button
          onClick={() => goTo('/')}
          style={{
            background: 'none', border: 'none', padding: 0, marginBottom: 28,
            color: G.textBase, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          ← Novakitz
        </button>

        <h1 style={{
          margin: '0 0 10px', fontSize: 'clamp(30px, 7vw, 40px)', fontWeight: 600,
          letterSpacing: '-0.02em', color: G.textDark,
        }}>
          Support
        </h1>
        <p style={{ margin: '0 0 36px', fontSize: 15, lineHeight: 1.7, color: G.textBase }}>
          Novakitz is made by one person. Write to me and I will answer — usually
          within two working days.
        </p>

        {/* Contact first. Everything below it is an attempt to save you the email. */}
        <div style={{ ...panel, padding: 'clamp(22px, 4vw, 30px)', marginBottom: 40 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: G.textLight, marginBottom: 8 }}>
            Email
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            style={{ fontSize: 'clamp(18px, 4.5vw, 22px)', fontWeight: 600, color: G.green, textDecoration: 'none', wordBreak: 'break-all' }}
          >
            {SUPPORT_EMAIL}
          </a>
          <p style={{ margin: '14px 0 0', fontSize: 13, lineHeight: 1.7, color: G.textBase }}>
            If it is about a purchase, please include the Apple Account email you
            bought with. It is the only way to find the receipt.
          </p>
        </div>

        <Section title="Using the app">
          <FAQItem
            q="How do I check in with a mood?"
            a="Tap the circle on the home screen once and pick the shape that fits how you woke up. That is the whole thing — it takes a few seconds, and it is the part most people keep up."
          />
          <FAQItem
            q="How do I write down a dream?"
            a="Press and hold that same circle for about a second, and the dream form opens instead. One circle, two gestures: a tap for the mood, a hold for the dream."
          />
          <FAQItem
            q="Where do I find what I have written?"
            a="The menu opens the calendar and the journal. Days you logged something carry the colour of that day's mood, and tapping one opens what you wrote."
          />
          <FAQItem
            q="Can I get a reminder in the morning?"
            a={
              <>
                Yes. Open the menu, tap your profile, then <strong>Account</strong> —
                reminders are set there. iOS asks for notification permission the
                first time you switch one on; if you said no and changed your mind,
                iOS Settings › Novakitz › Notifications turns it back on.
              </>
            }
          />
        </Section>

        <Section title="Free and Pro">
          <FAQItem
            q="What do I get without paying?"
            a="Seven AI interpretations a month, personalized affirmations, the daily mood check-in, and your full history. Nothing you write is ever locked away behind the subscription."
          />
          <FAQItem
            q="What does Pro add?"
            a="An interpretation every day rather than seven a month — for dreams and for moods — plus the monthly dream review with its pattern analysis, and every feature added later at no extra cost."
          />
          <FAQItem
            q="Is there a free trial?"
            a={
              <>
                The yearly plan starts with a free week. The pricing screen shows
                it on the Yearly card when your Apple Account can claim it — and
                only then, because Apple grants the trial once per person: if you
                have used it before, on either plan, the card shows the normal
                price instead. Cancel any time during the week and you are not
                charged.
              </>
            }
          />
          <FAQItem
            q="How do I cancel?"
            a={
              <>
                Subscriptions are billed by Apple, so they are cancelled through
                Apple: open iOS <strong>Settings</strong>, tap your name at the top,
                then <strong>Subscriptions</strong>, and choose Novakitz. Cancelling
                stops the next renewal — Pro stays on until the period you already
                paid for ends. I cannot cancel it for you from here, and neither can
                anyone else outside your Apple Account.
              </>
            }
          />
          <FAQItem
            q="I paid, but Pro is not showing"
            a={
              <>
                Restore usually fixes it — the button is just below. Two things to
                check first: that you are signed in to Novakitz with the same
                account you had when you paid, and that your iPhone is signed in to
                the Apple Account that made the purchase. If it still does not
                appear, email me with that Apple Account address.
              </>
            }
          />
          <FAQItem
            q="Can I get a refund?"
            a={
              <>
                Purchases go through Apple, so refunds do too:{' '}
                <a href="https://reportaproblem.apple.com" target="_blank" rel="noreferrer" style={{ color: G.green }}>
                  reportaproblem.apple.com
                </a>
                . Apple decides these, not me. Our own refund policy is linked at the
                bottom of this page, and if Apple turns you down and you think it was
                unfair, write to me anyway.
              </>
            }
          />
        </Section>

        <Section title="Restore a purchase">
          <div style={{ ...panel, padding: 'clamp(22px, 4vw, 30px)' }}>
            <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.7, color: G.textBase }}>
              Reinstalled the app, or signed in on another iPhone? This asks the App
              Store for purchases already made with your Apple Account and turns Pro
              back on. It costs nothing and charges nothing.
            </p>
            <button
              onClick={handleRestore}
              style={{
                padding: '13px 26px', borderRadius: 999, border: `1px solid ${G.green}`,
                background: 'transparent', color: G.green, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Restore purchases
            </button>
            <p style={{ margin: '14px 0 0', fontSize: 12, lineHeight: 1.6, color: G.textLight }}>
              Works inside the Novakitz app. In a web browser there is no App Store to
              ask, so open the app and try it there.
            </p>
          </div>
        </Section>

        <Section title="Your account and your data">
          <FAQItem
            q="Who can read what I write?"
            a="You. Entries are private by default and are never shown to anyone else unless you post one to the community yourself. Interpretation sends the text of that one entry to an AI model to be read and answered; it is not used to train anything."
          />
          <FAQItem
            q="How do I delete my account?"
            a={
              <>
                In the app: open the menu, tap your profile, then{' '}
                <strong>Account</strong> › <strong>Delete Account</strong>. It removes
                your dreams, your profile, your community posts and your subscription
                record, and it cannot be undone — so export or screenshot anything you
                want to keep first. Deleting the account does not cancel an active
                subscription; do that through Apple as described above.
              </>
            }
          />
          <FAQItem
            q="Can I get a copy of my data?"
            a="Email me and I will send you everything stored against your account. Please write from the address the account uses, or tell me which one it is."
          />
        </Section>

        <div style={{
          marginTop: 8, paddingTop: 24, borderTop: '1px solid rgba(122,179,130,0.2)',
          textAlign: 'center',
        }}>
          {[['Terms', '/legal/terms/'], ['Privacy', '/legal/privacy/'], ['Refund', '/legal/refund/'], ['Pricing', '/pricing/']].map(([label, href], i) => (
            <span key={href}>
              {i > 0 && <span style={{ fontSize: 11, color: G.textLight, margin: '0 4px' }}>·</span>}
              <a href={href} style={{ fontSize: 12, color: G.textLight, textDecoration: 'none', margin: '0 6px' }}>{label}</a>
            </span>
          ))}
          <p style={{ margin: '18px 0 0', fontSize: 12, color: G.textLight }}>
            Novakitz · {SUPPORT_EMAIL}
          </p>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
