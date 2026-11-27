'use client';

import { useCallback, useRef } from 'react';
import '../styles/scroll-motion.css';

/*
 * How the long panels (Reflection, Monthly Review) move as you scroll.
 *
 *   Fade up    each block rises a few pixels and fades in as it enters view.
 *   Stagger    blocks that arrive together come in one after another, not at once.
 *   Progress   a thin bar in the sticky header fills as you read down the panel.
 *
 * Put the returned ref on the panel's scrolling element. Its direct children are
 * the blocks. The panel's header must be that element's previous sibling (or any
 * ancestor's descendant) holding an element with `data-sm-bar`; if there is none,
 * the progress part is simply skipped.
 *
 * It is a callback ref, not an effect, because both panels draw a loading screen
 * first and only later the scroller; the observers attach when the scroller
 * actually appears and detach when it goes.
 *
 * IntersectionObserver rather than CSS scroll-driven animations: those are not in
 * the iOS WebView this app runs in on older phones. Everything is skipped for
 * people who asked for reduced motion, and blocks are only hidden by this script,
 * so if it never runs the panel is simply there, as before.
 */

const STAGGER_MS = 70;
const MAX_DELAY_MS = 420;

export function useScrollMotion() {
  const cleanup = useRef<(() => void) | null>(null);

  return useCallback((node: HTMLElement | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (!node) return;

    const calm = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const disposers: Array<() => void> = [];

    // ── progress bar ──
    const bar = node.parentElement?.querySelector<HTMLElement>('[data-sm-bar]') ?? null;
    if (bar) {
      const update = () => {
        const max = node.scrollHeight - node.clientHeight;
        const pct = max > 0 ? Math.min(1, Math.max(0, node.scrollTop / max)) : 0;
        bar.style.transform = `scaleX(${pct})`;
      };
      update();
      node.addEventListener('scroll', update, { passive: true });
      disposers.push(() => node.removeEventListener('scroll', update));
    }

    // ── fade up + stagger ──
    if (!calm && typeof IntersectionObserver !== 'undefined') {
      const seen = new WeakSet<Element>();
      let batch = 0;
      let batchTimer: ReturnType<typeof setTimeout> | null = null;

      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const el = e.target as HTMLElement;
            // Blocks that show up in the same moment get consecutive delays.
            el.style.transitionDelay = `${Math.min(batch * STAGGER_MS, MAX_DELAY_MS)}ms`;
            batch += 1;
            el.classList.remove('sm-hidden');
            io.unobserve(el);
            // Drop the delay once it has played, so it never lags a later hover or resize.
            window.setTimeout(() => { el.style.transitionDelay = ''; }, 900);
          }
          if (batchTimer) clearTimeout(batchTimer);
          batchTimer = setTimeout(() => { batch = 0; }, 120);
        },
        { root: node, threshold: 0.06, rootMargin: '0px 0px -4% 0px' },
      );

      const adopt = () => {
        for (const child of Array.from(node.children)) {
          if (seen.has(child)) continue;
          seen.add(child);
          child.classList.add('sm-hidden');
          io.observe(child);
        }
      };
      adopt();
      // The blocks arrive after the data does, so watch for children being added.
      const mo = new MutationObserver(adopt);
      mo.observe(node, { childList: true });
      disposers.push(() => { io.disconnect(); mo.disconnect(); if (batchTimer) clearTimeout(batchTimer); });
    }

    cleanup.current = () => disposers.forEach((d) => d());
  }, []);
}
