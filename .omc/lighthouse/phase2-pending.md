# Phase 2 Verification — Pending Manual Run

US-P2-009 acceptance criteria require runtime Lighthouse + cross-browser smoke that the Ralph driver cannot execute (no headless-browser tooling installed). The static-build verification is complete and passes; the runtime gates listed below must be captured by the developer on a local machine with a real browser.

## Status

- **Static checks**: PASS
  - `bundle exec jekyll build` exits 0 (verified 2026-06-08)
  - `_site/sitemap.xml`, `_site/robots.txt`, `_site/index.html` all produced
  - `_site/assets/css/style.css` compiles from SCSS partials
  - No new Sass deprecation warnings in build output
- **Runtime checks**: PENDING (manual)

## How to run

```bash
# Start local server
bundle exec jekyll serve

# Run Lighthouse Desktop on http://localhost:4000/
# Chromium DevTools -> Lighthouse -> Desktop -> Categories: Performance,
# Accessibility, Best Practices, SEO -> Generate report.
# Save the JSON via the kebab menu in Lighthouse, place at:
#   .omc/lighthouse/phase2.json
```

## 6-Item Smoke Checklist (R7 from consensus plan)

Walk through these in each of Chromium-latest, Firefox-latest, Safari-latest (desktop). Mark each item PASS/FAIL.

1. **Vision subgoals 0-3 open**: max-height transition from 0 to expanded completes within ~300ms with no jump, no content clipping, no horizontal scroll appearing.
2. **Vision subgoals 0-3 close**: collapse transitions smoothly from current scrollHeight down to 0 with no flash of full content. After Bug C AbortController fix, spam-click open-then-close mid-transition no longer leaves the element in an inconsistent state.
3. **Oversized subgoal-detail**: temporarily inject a `<p>` > 1500px tall into one subgoal-detail via DevTools and click Detail; the entire content shows without truncation (verifies Bug C scrollHeight path).
4. **Section switch 1→2→3→4→1**: vertical-divider transition lands at the correct end position (visually under each section's `.align-target`) within 300ms, no overshoot.
5. **Slow 3G reload**: under DevTools Network throttle "Slow 3G", `.horizontal-line` under `.align-target` settles at its final width with no visible re-flow > 1px after `document.fonts.load('1em target-haas')` resolves. Use a polled `getBoundingClientRect` snapshot or `ResizeObserver` for objective measurement; strip instrumentation before commit.
6. **Tab through nav buttons**: visible focus ring appears on each focused nav `<button>` with no layout shift. Tab order: section-1 → section-2 → section-3 → section-4. Enter or Space activates the focused button. `aria-current="page"` moves with the active section.

## Acceptance gate

US-P2-009 is satisfied when:
- Lighthouse Desktop reports Best Practices ≥ 90 AND Accessibility ≥ 90
- All 6 smoke items pass in all 3 browsers
- `.omc/lighthouse/phase2.json` archived in the repo

If Lighthouse a11y < 90, the most likely cause is contrast on `--sub-color: grey` (used for inactive nav text). Bump to a darker grey if flagged.
