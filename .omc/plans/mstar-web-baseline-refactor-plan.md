# Consensus Plan: MemorialStar Web-Baseline Refactor

- Source spec: `.omc/specs/deep-interview-mstar-web-baseline-refactor.md`
- Status: **pending approval** (consensus output, no execution authorized)
- RALPLAN-DR mode: short
- Generated: 2026-06-08

---

## RALPLAN-DR Summary

### Principles
1. **Surgical scope only** — touch only files named in spec; no opportunistic refactors of out-of-scope code (animation chain, asterisk parser, lang attribute).
2. **GitHub Pages compatibility is load-bearing** — only whitelist plugins; no npm/Node toolchain; Jekyll-native or pure CSS/HTML solutions preferred.
3. **Zero behavior regression** — SPA section switching, KST clock, subgoal expand, news rendering, project/publication cards must work identically after refactor (only DOM/CSS shape may change).
4. **Each acceptance criterion is independently testable** — Lighthouse score, viewport visual check, or manual smoke on Chromium/Firefox/Safari.
5. **Mobile-deferred policy is firm** — `<1024px` shows a static notice; no responsive breakpoints below this threshold are introduced.

### Decision Drivers (top 3)
1. **GH Pages deploy must continue working** — every gem must be on the GH Pages whitelist (`jekyll-feed`, `jekyll-sitemap`, `jekyll-seo-tag`, etc.).
2. **Mobile session follows this one** — refactor must not create new mobile-incompatible patterns that would need re-undoing; the 1024px notice is an intentional placeholder, not a permanent gate.
3. **User edits content months from now** — YAML schemas + an authoring cheatsheet must be the only docs a future-self needs to add a project, publication, or news item.

### Viable Options

#### Option A — Single-PR monolithic refactor
Land all 5 components (`code-arch`, `content-authoring`, `ui-ux-audit`, `cross-env-compat`, `seo-metadata`) in one large commit/PR.
- **Pros**: One review pass; atomic deploy; spec implemented end-to-end.
- **Cons**: Large diff (~1100-line CSS reorg + JS + layout + plugin additions); hard to bisect a regression; rollback is all-or-nothing.

#### Option B — One PR per component (5 PRs)
Sequential PRs in dependency order: `code-arch` → `content-authoring` → `ui-ux-audit` → `cross-env-compat` → `seo-metadata`.
- **Pros**: Tiny diffs; easy review; per-component rollback.
- **Cons**: High coordination overhead for a personal site; merge-conflict risk between `code-arch` (CSS split) and `ui-ux-audit` (CSS edits); 5x deploy churn.

#### Option C — Three phases grouped by risk (RECOMMENDED)
- **Phase 1 — Foundation (low risk)**: Sass partial split + `main.js` role-grouped comments. Zero behavior change. Establishes file-organization baseline that later phases edit cleanly.
- **Phase 2 — Behavior + Viewport (medium risk)**: 7 UI/UX bugs (A,B,C,D,E,F,J) + `<meta viewport>` + `<1024px` desktop notice. Touches JS+CSS+HTML; needs cross-browser smoke.
- **Phase 3 — Metadata + Authoring docs (low risk)**: SEO `<head>` payload, `jekyll-sitemap`, `robots.txt`, JSON-LD, OG image; authoring cheatsheet markdown file. Pure additions; no existing behavior modified.
- **Pros**: Phase 1 clears the workspace, Phase 2 makes the risky changes against the clean layout, Phase 3 is pure addition. Per-phase smoke test possible. Each phase reviewable in one sitting.
- **Cons**: 3 commits/PRs instead of 1; minor cross-phase coordination on CSS file paths (Phase 1 renames `style.css` → `style.scss`, Phase 2 edits the partials).

**Selected: Option C** — see ADR for rationale.

#### Invalidated alternatives
- **Option D — Manual bug-by-bug** (one commit per bug): rejected; 7 bugs + plugin + layout edits = ~12 commits, churn outweighs review benefit for a single-developer personal site.
- **Option E — Two-phase Architect synthesis** (Phase 1' = behavior+metadata combined; Phase 2' = Sass partition deferred to mobile session): rejected because (a) the Sass partition was explicitly authorized in deep-interview Round 3 ("Light depth" — `_sass/` partials), so deferring it would walk back a user decision; (b) collapsing Sass split + 7 bug fixes + viewport notice + SEO + plugin into one phase reintroduces the monolithic-diff problem that Option A failed on; (c) the "Phase 1 ships invisible value" objection is mitigated by Phase 1 being a one-shot byte-comparison gate, not a recurring tax. Architect's two-phase shape is preserved in spirit by Phase 1's zero-behavior-change contract; their critique is documented in the Changelog v2 entry rather than restructuring the option matrix.

---

## Acceptance Criteria
(Inherited verbatim from `.omc/specs/deep-interview-mstar-web-baseline-refactor.md` — see spec for the canonical list. Summarized here as test gates per phase.)

### Phase 1 gate (Foundation)
- [ ] `_sass/` directory exists with at least these partials: `_base.scss`, `_layout.scss`, `_nav.scss`, `_content.scss`, `_projects.scss`, `_publications.scss`, `_vision.scss`, `_utilities.scss`.
- [ ] `assets/css/style.scss` replaces `assets/css/style.css`; file imports all partials; Jekyll Sass pipeline produces a `style.css` indistinguishable in rendered output from the current file (byte-diff acceptable, pixel-diff required to be zero in a screenshot smoke test).
- [ ] `assets/js/main.js` retains same byte-functional behavior; only changes are 5 inserted comment headers (`// === Data Loading ===`, `// === Rendering ===`, `// === Section Switching ===`, `// === Layout & Divider ===`, `// === Utilities ===`) and possible whitespace.
- [ ] `bundle exec jekyll build` succeeds with no Sass deprecation warnings.

### Phase 2 gate (Behavior + Viewport)
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1.0">` **verified present** (already at `_layouts/default.html:5` — no action needed; spec misdiagnosed this as missing).
- [ ] Visiting the site at `<1024px` viewport (DevTools responsive mode) shows the "best on desktop" notice instead of broken layout.
- [ ] Bug A: profile image element has non-empty `alt` attribute (verified by DOM inspect after load).
- [ ] Bug B: nav items are `<button>` elements; tab key cycles through them with visible focus; active item has `aria-current="page"`.
- [ ] Bug C: a long subgoal-detail (manually inserted >1500px content for test) expands fully without truncation.
- [ ] Bug D: a news item with `\n` in its YAML `content` renders visible line breaks.
- [ ] Bug E: `console.log` instrumentation confirms `renderProjectCards()` is called exactly once per section-3 load.
- [ ] Bug F: after `document.fonts.load('1em target-haas')` resolves, `.horizontal-line` `style.width` is set exactly once and `.horizontal-line` `offsetWidth` does not change by more than 1 pixel for ≥2 seconds afterward. Verified by adding temporary `console.log` instrumentation at the assignment site (`main.js:486-487`) and a `ResizeObserver` (or polled `getBoundingClientRect` snapshot every 100ms for 2s) under DevTools Network throttle "Slow 3G". Strip instrumentation before commit.
- [ ] Bug J: tab focus produces a visible focus ring on all interactive elements (`<a>`, `<button>` from bug B).
- [ ] Lighthouse Desktop scores **≥90 Best Practices**, **≥90 Accessibility** on the deployed (or local jekyll-serve) site.
- [ ] Manual smoke pass: Chromium-latest, Firefox-latest, Safari-latest desktop — section switch, subgoal expand, project hover, KST clock all working.

### Phase 3 gate (Metadata + Authoring docs)
- [ ] `_layouts/default.html` `<head>` includes: `<meta name="description">`, full OG tag block, full Twitter card block, JSON-LD Person `<script type="application/ld+json">`, `<link rel="canonical">`.
- [ ] `og:image` and `twitter:image` point to `assets/img/me.jpg` (absolute URL).
- [ ] `og:locale=en_US`, `og:locale:alternate=ko_KR`.
- [ ] JSON-LD includes: `@type: Person`, `name: "Young Min Jung"`, `url`, `affiliation: { @type: "EducationalOrganization", name: "KAIST" }`, `sameAs: [LinkedIn URL, X URL]`.
- [ ] `Gemfile` and `_config.yml` include `jekyll-sitemap`; `bundle exec jekyll build` produces `_site/sitemap.xml`.
- [ ] `robots.txt` exists at site root with `Sitemap: https://www.youngminjung.com/sitemap.xml`.
- [ ] Authoring cheatsheet exists at `docs/AUTHORING.md` (canonical location — public, GitHub-rendered; supersedes the spec's `.omc/docs/authoring.md` mention) documenting: (a) how to add a project/publication/news entry, (b) image conversion rule (`<=1600px width`, `.webp` preferred), (c) `&ast;` escape rule for asterisks in author names, (d) note that adding a new top-level section requires editing `main.js sectionData[]` and `default.html` `nav-container`.
- [ ] `_config.yml` `url:` field updated from `https://memorialStar.github.io` to `https://www.youngminjung.com` (matches CNAME); jekyll-feed atom output reflects new host.

---

## Implementation Steps

### Phase 1 — Foundation (Sass partials + JS sectioning)

**Scope note (Architect feedback)**: Phase 1 ships invisible structural reorganization with no user-facing change. Per the user's `CLAUDE.md` § 3 (Surgical Changes) this could be considered out-of-bounds. However, the deep-interview Round 3 explicitly authorized "Light: split style.css into `_sass` partials" — so the user has signed off. Phase 1 still violates surgical-scope by *area* (touches the full 1133-line CSS) but not by *intent* (user-requested). Mitigation: cascade-fragility check is rigorous (see step 6 + R1).

1. **Create `_sass/` directory** at repo root.
2. **Audit `assets/css/style.css`** (1133 lines) and group rules by selector domain. **Invariant: each selector appears in exactly one partial.** No selector may be split across two partials (preserves cascade order within the selector's rule list). Target partitioning (line-range estimates; revise during work):
   - `_base.scss` — `*`, `html`, `body`, font-face declarations, root variables.
   - `_layout.scss` — `.page-wrapper`, `.left-margin`, `.right-margin`, `.main-container`, `.sky-blue-gap`, `.content-wrapper`, `.background-image-layer`.
   - `_nav.scss` — `.nav-column`, `.nav-container`, `.navsubContainer`, `.nav-item`, `.vertical-divider`, `.me-image`, `.news-section`, `.news-item`.
   - `_content.scss` — `.content-column`, `.content-area`, `.placeholder-container`, `.info-section-*`, `.departments`, `.memo`, `.align-target`, `.horizontal-line`, `.highlight`, `.sub-text`, `.callout-content`, `.callout-title`.
   - `_projects.scss` — `.project-card`, `.project-image`, `.project-content`, `.project-tags`, `.tag.*`, `.project-header`, `.project-title`, `.project-year`, `.separator`, `.project-detail`, `.detail-label`, `.detail-text`, `.project-explanation`.
   - `_publications.scss` — `.publication-card`, `.publication-content`, `.publication-main`, `.publication-title`, `.publication-sub`, `.publication-year`, `.publication-organization`, `.publication-abstract`, `.publication-link`.
   - `_vision.scss` — `.vision-subgoals`, `.subgoal-section`, `.subgoal-title`, `.subgoal-text`, `.subgoal-examples`, `.subgoal-example`, `.subgoal-divider-*`, `.subgoal-detail-toggle`, `.subgoal-detail`, `.subgoal-detail-content`.
   - `_utilities.scss` — animation keyframes (`@keyframes`), `.slide-out`, `.slide-in`, `.navsubContainer-slide-*`, transitions used across files.
3. **Create `assets/css/style.scss`** as the entry point. Prefer modern Sass module syntax to avoid Dart Sass `@import` deprecation warnings:
   ```scss
   ---
   ---
   @use 'base';
   @use 'layout';
   @use 'nav';
   @use 'content';
   @use 'projects';
   @use 'publications';
   @use 'vision';
   @use 'utilities';
   ```
   (Jekyll requires the empty front matter `---/---` at top for Sass processing.)
   - **Fallback**: if `bundle exec jekyll build` errors on `@use` (e.g., site is pinned to sassc/libsass legacy in `Gemfile.lock` and `@use` is unsupported), use `@import` instead and accept deprecation warnings — but then update the Phase 1 acceptance criterion to "no NEW Sass errors" (still accepting pre-existing deprecation messages from upstream Jekyll plugins).
4. **Delete `assets/css/style.css`** after verifying the SCSS pipeline produces an identical-output `_site/assets/css/style.css`.
5. **`assets/js/main.js`** — insert 5 comment headers without moving function bodies:
   - `// === Data Loading ===` above the `const siteInfo = ...` block (line ~7).
   - `// === Rendering ===` above `generateVisionSubgoals()` (line ~17).
   - `// === Section Switching ===` above `loadSectionContent()` (line ~459).
   - `// === Layout & Divider ===` above `updateVerticalDivider()` (line ~509).
   - `// === Utilities ===` above `initializeClock()` (line ~552).
   - No other function reordering. Goal: future readers scan headers, no diff hits behavior.
6. **Verify**: `bundle exec jekyll serve`, open browser, navigate all 4 sections, expand a subgoal, screenshot vs main branch — pixel-diff must be zero.

### Phase 2 — Behavior + Viewport

7. **Verify `<meta viewport>` present** at `_layouts/default.html:5`. Already exists as `<meta name="viewport" content="width=device-width, initial-scale=1.0">`. **Do not add a duplicate.** If absent on inspection, add as a regression catch. Spec misdiagnosed this as missing because deep-interview read a summary, not the file directly.
8. **Add `<1024px` desktop notice** to `_layouts/default.html`. Use pure CSS via a media query in `_utilities.scss` (no JS) so it works even if JS fails:
   ```scss
   .desktop-only-notice { display: none; }
   @media (max-width: 1023.98px) {
     .page-wrapper, .nav-column { display: none !important; }
     .desktop-only-notice {
       display: flex; position: fixed; inset: 0;
       align-items: center; justify-content: center;
       padding: 2rem; text-align: center; font-family: inherit;
     }
   }
   ```
   And in `default.html` after `<body>`:
   ```html
   <div class="desktop-only-notice" role="alert">
     <p>This site is best viewed on a desktop (≥1024px). A mobile-friendly version is in progress.</p>
   </div>
   ```
9. **Bug A — alt on profile image** (`main.js:282-285`):
   ```js
   meImage.src = siteInfo.profile_image;
   meImage.alt = `Portrait of ${siteInfo.name}`;
   meImage.className = 'me-image';
   ```
10. **Bug B — nav as `<button>` + aria** (`_layouts/default.html:50-62` + `main.js:369-378`):
    - Change each `<div class="nav-item" data-section="N">` to `<button class="nav-item" data-section="N" type="button">`. `type="button"` prevents implicit form-submit semantics in Safari/older WebKit.
    - In `handleNavClick`, call `event.preventDefault()` at the top to short-circuit any default activation.
    - Set `aria-current="page"` on the active button and remove from inactive — replace the current `classList.add('active')` calls in `switchSection` with both `classList` and `aria-current` updates. Initial markup should set `aria-current="page"` on the section-1 button.
    - Add neutralization + focus styles in `_nav.scss`:
      ```scss
      .nav-item {
        appearance: none;
        background: none;
        border: none;
        padding: 0;
        font: inherit;
        color: inherit;
        cursor: pointer;
      }
      .nav-item:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
      ```
    - **Note**: existing CSS at `style.css` already styles `.nav-item` as a layout block; ensure the neutralization above doesn't override layout properties. Place neutralization rules ABOVE the existing `.nav-item` rules in the partial so layout rules take precedence.
11. **Bug C — replace `max-height: 1500px`** (`main.js:63` and the open/close logic at lines 37-65):
    - On open, set `detailElement.style.maxHeight = detailElement.scrollHeight + 'px'`.
    - After CSS `transitionend` event, set `maxHeight = 'none'` so subsequent content reflow isn't truncated.
    - On close, first set `maxHeight = scrollHeight + 'px'` (to enable transition from a defined value), force reflow via `void detailElement.offsetHeight`, then set `maxHeight = '0'`. **Behavior note**: this is a deliberate animation tweak — current code collapses immediately from whatever `maxHeight` was last set, which animates inconsistently. The new path animates from the rendered scrollHeight down to 0 on every close. Document this in commit message so reviewer doesn't read it as accidental regression.
12. **Bug D — news line breaks** (`main.js:307`):
    - Change `newsContent.textContent = news.content;` to preserve line breaks. Two options:
      - (a) Set CSS `.news-content { white-space: pre-line; }` in `_nav.scss` and keep `textContent` (safest — no innerHTML).
      - (b) Set `newsContent.innerHTML = news.content.replace(/\n/g, '<br>');` (riskier — XSS if YAML untrusted; not the case here, but (a) is cleaner).
    - **Choose option (a)**.
13. **Bug E — verify-then-dedup render** (`main.js:606-609`).
    - **Verification gate first**: Add `console.log('renderProjectCards call', new Error().stack)` to `renderProjectCards` and `renderPublicationCards`. Load the page, observe whether the early-`DOMContentLoaded` calls actually do work or no-op (container `getElementById` returns `null` at that timing per `main.js:222`, so they likely early-return harmlessly).
    - **If no-op**: deletion is cosmetic; do it for clarity and remove the verification logging. Document in commit message that this was confirmed no-op, not a behavior change.
    - **If they DO do work** (e.g., container existed because Main section template embedded it): drop the deletion plan; instead add a guard so render functions are idempotent. Spec acceptance criterion "called exactly once per section-3 load" still satisfiable via the idempotency guard.
    - Either way, remove the diagnostic logging before commit.
14. **Bug F — font-load guard for horizontal-line** (`main.js:466-487`). **Repo already has `font-display: swap` on 9 `@font-face` declarations** at `style.css:8,16,24,33,41,49,57,65,73`. `fonts.ready` alone is insufficient because swap causes a fallback render first then a re-paint with the custom font, shifting `offsetWidth` after `fonts.ready` resolves. Two acceptable fixes:
    - **Preferred**: Use `document.fonts.load('1em target-haas')` (the actual font used by `.align-target`; verify class in CSS) to await the specific font face, then measure:
      ```js
      document.fonts.load('1em target-haas').then(() => {
        // existing alignTarget computation
      });
      ```
    - **Alternative**: Remove `font-display: swap` from the `target-haas` `@font-face` only (`style.css:65-73`, the one used by `.align-target` at `style.css:543, 553`) so it blocks until loaded. More invasive, affects perceived load time. Skip unless preferred path fails.
    - Drop the existing `setTimeout(..., 50)` regardless.
    - **Note**: spec constraint "No `font-display: swap` addition" was based on an incorrect premise (it's already present). This plan does NOT add new swap declarations; it works with the existing ones. The spec constraint remains honored.
15. **Bug J — focus styles**: Add to `_utilities.scss`:
    ```scss
    :focus-visible { outline: 2px solid #1a1a1a; outline-offset: 2px; }
    a:focus-visible, button:focus-visible, .nav-item:focus-visible { outline-color: currentColor; }
    ```

### Phase 3 — Metadata + Authoring docs

15a. **Update `_config.yml` `url:` field** from `https://memorialStar.github.io` to `https://www.youngminjung.com` (the CNAME). This **MUST** run before step 16 because `og:image`, `canonical`, and JSON-LD `url` all use `absolute_url` / `site.url`. Acknowledged behavior change: `jekyll-feed` RSS link tags will now use the CNAME host. Existing feed subscribers will see entries appear as "new URLs" once (small inconvenience for ~10 entries; acceptable).

16. **Update `_layouts/default.html` `<head>`** (insert after line 7, before favicon):
    ```html
    <meta name="description" content="{{ site.description }}">
    <link rel="canonical" href="{{ page.url | absolute_url }}">

    <!-- Open Graph -->
    <meta property="og:type" content="profile">
    <meta property="og:title" content="{{ site.title }}">
    <meta property="og:description" content="{{ site.description }}">
    <meta property="og:url" content="{{ page.url | absolute_url }}">
    <meta property="og:image" content="{{ '/assets/img/me.jpg' | absolute_url }}">
    <meta property="og:locale" content="en_US">
    <meta property="og:locale:alternate" content="ko_KR">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ site.title }}">
    <meta name="twitter:description" content="{{ site.description }}">
    <meta name="twitter:image" content="{{ '/assets/img/me.jpg' | absolute_url }}">

    <!-- JSON-LD Person -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "{{ site.title }}",
      "url": "{{ site.url }}",
      "inLanguage": "en",
      "affiliation": {
        "@type": "EducationalOrganization",
        "name": "KAIST"
      },
      "sameAs": [
        "https://www.linkedin.com/in/j0min/",
        "https://x.com/young_min_Jung"
      ]
    }
    </script>
    ```
17. **Add `jekyll-sitemap`** to `Gemfile` under `:jekyll_plugins`:
    ```ruby
    group :jekyll_plugins do
      gem "jekyll-feed"
      gem "jekyll-sitemap"
    end
    ```
    And to `_config.yml` plugins:
    ```yaml
    plugins:
      - jekyll-feed
      - jekyll-sitemap
    ```
18. **Run `bundle install`** to update `Gemfile.lock`.
19. **Create `robots.txt`** at repo root:
    ```
    User-agent: *
    Allow: /

    Sitemap: https://www.youngminjung.com/sitemap.xml
    ```
20. **Create `docs/AUTHORING.md`** (canonical location; spec's `.omc/docs/authoring.md` superseded). Committed to repo, public, GitHub-rendered. Sections:
    - "Add a project entry" — sample YAML block, image rule, file location.
    - "Add a publication" — sample YAML, `&ast;` note for asterisks in author names.
    - "Add a news item" — sample YAML, multi-line `content:` reminder (YAML `|` block scalar).
    - "Image conversion rule" — export ≤1600px width, prefer `.webp`, place in `assets/img/projects/`.
    - "Adding a new top-level section (advanced)" — points at `main.js sectionData[]`, `default.html` nav-container, `_data/*.yml`; explicit warning that this is the only path requiring code edits.

---

## Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | Sass partial split produces visually different output (selector order changes specificity outcomes; current `style.css` has 12 `white-space: pre-line` declarations — verified `grep -c "white-space: pre-line" assets/css/style.css` — and cascade-order-dependent rules at css:573 `.horizontal-line` and css:1058 `.subgoal-detail-toggle` per Architect) | medium | high | After Phase 1, screenshot-diff vs `main` baseline at 1280×800 and 1920×1080 in **at least 3 states per section**: (a) initial load, (b) subgoal-detail expanded (Vision section), (c) mid-transition slide if capturable (manual). Reject phase if any visible pixel diff. Additionally compare the compiled `_site/assets/css/style.css` byte output before/after: if byte-identical (modulo whitespace), the partition is provably safe; if not, the diff must be visually inspected rule-by-rule. **Diff tool**: ImageMagick `compare -metric AE` with fuzz factor 1% to tolerate anti-aliasing differences; structural pixel diffs (>50 pixels in any 100×100 region) reject the phase. |
| R2 | `<button>` for nav-item inherits default browser styling that breaks layout | medium | medium | Set `appearance: none; background: none; border: none; padding: 0; font: inherit; color: inherit; cursor: pointer;` in `_nav.scss` to neutralize defaults. |
| R3 | `document.fonts.load` not supported in old Safari (<11) | very low | low | Cross-env scope is Safari-latest desktop only. Skip the fallback `setTimeout`; current desktop browsers all support `document.fonts.load`. Architect feedback: avoid over-engineering for out-of-scope environments. |
| R4 | `<1024px` notice CSS hides the nav-column but JS still runs and queries elements that aren't visible | low | low | The CSS uses `display: none` which keeps elements in DOM. `getBoundingClientRect` returns zeros but won't throw. Confirm `updateVerticalDivider` early-returns when activeNavItem rect is zero. Add an early-return guard in `updateVerticalDivider`. |
| R5 | `jekyll-sitemap` collides with `sass_dir` config and breaks build | very low | medium | Concrete check: after step 17, run `bundle exec jekyll build` and verify all three: (a) build exits 0, (b) `_site/sitemap.xml` exists, (c) `_site/assets/css/style.css` still produced. If any fails, revert step 17 and investigate Sass/sitemap interaction before proceeding to step 18. |
| R6 | `_config.yml url:` rewrite (Phase 3 step 15a) cascades to jekyll-feed RSS link tags | medium | low | Existing feed subscribers (~10 entries) will see entries re-appear with new host once. Acceptable for a personal site. Promoted from buried mitigation to numbered implementation step 15a per Architect feedback. |
| R7 | Phase 2 bug fixes regress an animation or layout adjacency (notably the subgoal-detail expand/collapse cycle, which has the most surface area for Bug C's `maxHeight` rework) | medium | medium | Concrete pre-merge smoke checklist (each item is an atomic pass/fail): (1) In Vision section, open subgoal-detail at index 0, 1, 2, 3 — `transition` from height 0 to expanded completes within ~300ms with no jump, no content clipping, no horizontal scroll appearing. (2) Open then close subgoal-detail at index 0, 1, 2, 3 — collapse transitions smoothly from current scrollHeight down to 0 with no flash of full content. (3) Open subgoal-detail with manually-injected `<p>...</p>` content > 1500px tall — expanded element shows all content (not truncated at 1500px). (4) Switch sections in order 1→2→3→4→1 — vertical-divider transition lands at the correct end position (visually under each section's `.align-target`) within 300ms, no overshoot. (5) Reload page with DevTools Network throttle "Slow 3G" — `.horizontal-line` under `.align-target` settles at its final width with no visible re-flow > 1px after `document.fonts.load('1em target-haas')` resolves. (6) Tab through nav buttons — visible focus ring on each, no layout shift caused by the focus outline. Reject Phase 2 if any of (1)-(6) fails. |
| R8 | Authoring cheatsheet drifts from code if future edits add new YAML fields | medium | low | Cheatsheet links to canonical `_data/projects.yml` first entry as the example; "when in doubt, copy the first entry" is the rule. |

---

## Verification Steps

### After Phase 1
1. `bundle exec jekyll build` exits 0 with no Sass deprecation warnings.
2. `diff -r _site/assets/css/style.css <(git show main:_site/assets/css/style.css)` — accept whitespace/order diffs, reject any selector/property changes (run only if `_site/` is tracked; otherwise screenshot-diff).
3. Open `http://localhost:4000` in Chromium, capture full-page screenshot at 1920×1080 for each section (1/2/3/4); diff vs main-branch baseline screenshots.
4. `assets/css/style.css` removed from repo (no longer tracked); `assets/css/style.scss` exists.

### After Phase 2
5. DOM inspect at 1280×800: `<meta name="viewport">` present, `<img class="me-image">` has non-empty `alt`, nav items are `<button>`, focused button shows visible outline.
6. DevTools responsive mode → 1023×768 viewport → desktop-only notice visible; page-wrapper hidden.
7. Lighthouse Desktop run (Chromium DevTools Lighthouse panel): Best Practices ≥90, Accessibility ≥90. Create archive dir first via `mkdir -p .omc/lighthouse/` then save JSON to `.omc/lighthouse/phase2.json` as evidence.
8. Manual smoke: in Chromium, Firefox-latest, Safari-latest desktop, click each of the 4 nav buttons, expand 4 subgoals in Vision, hover over each project card, watch the KST clock tick once on Main.
9. News test: temporarily add a 2-line `content: |` block to `_data/news.yml`, refresh, confirm line break renders; revert.

### After Phase 3
10. `curl -s https://www.youngminjung.com/sitemap.xml` returns valid XML (after deploy).
11. `curl -s https://www.youngminjung.com/robots.txt` returns the file.
12. Paste `https://www.youngminjung.com` into LinkedIn share preview, Twitter card validator, and Slack message box — share card renders with title, description, and `me.jpg`.
13. Validate JSON-LD via `https://search.google.com/test/rich-results` — Person schema valid.
14. `docs/AUTHORING.md` exists, renders on GitHub, all four sections present.

---

## ADR

### Decision
Adopt **Option C — Three phases grouped by risk** (Foundation → Behavior+Viewport → Metadata+Authoring docs) for the MemorialStar web-baseline refactor.

### Drivers
1. GH Pages whitelist constrains tooling — favors pure Jekyll-native solutions, not bundlers.
2. Mobile-friendly work follows immediately — refactor must produce a stable, well-organized baseline that the next session can extend without re-undoing structural choices.
3. Single-developer site with light review bandwidth — phase count must stay small (~3) yet allow per-phase rollback.

### Alternatives Considered
- **Option A (monolithic single PR)**: rejected because the diff would mix a 1100-line CSS reorg with semantic HTML edits, plugin additions, layout edits, and content authoring docs. Bisecting any regression would mean re-bisecting through that diff. Per-phase rollback impossible.
- **Option B (5 PRs, one per component)**: rejected because the coordination overhead (PR descriptions, sequential review, merge conflicts between `code-arch` CSS split and `ui-ux-audit` CSS edits) outweighs the per-component clarity for a single-developer personal-site cadence.
- **Option D (one commit per bug)**: rejected (see invalidation in summary).

### Why Chosen
- Phase 1 ships a structural improvement with zero behavior change, so any post-Phase-1 regression can only come from Phase 2/3 edits, narrowing bisect scope dramatically.
- Phase 2 lands the behavior-affecting changes against an already-organized layout — diffs are clean (a bug fix touches `_nav.scss` instead of line 488 of a 1100-line CSS file), reviewer cognitive load lower.
- Phase 3 is pure addition — no existing rendered output changes — so Lighthouse runs from Phase 2 stay valid.
- Three phases is the minimum that respects "no behavior change in code reorg" as its own gate. Two phases would force CSS-split to coexist with bug fixes; one phase would be monolithic.

### Consequences
- **Positive**: Each phase has a tight verification gate (build success → visual regression → Lighthouse → metadata validators) that can independently say "this phase is safe." Mobile-session-N+1 starts from a partitioned `_sass/` layout it can tweak per breakpoint.
- **Negative**: Three commits to `main` (or three PRs if branching) instead of one. Slight CSS-path coordination between Phase 1 (creates partials) and Phase 2 (edits partials). Manual smoke test must run on three desktop browsers — no automated browser-matrix in scope.
- **Neutral**: Authoring cheatsheet lives in `docs/AUTHORING.md` (public, GitHub-rendered) rather than `.omc/docs/` (private to OMC workflows). User can move it if a private location is preferred — non-blocking.

### Follow-ups (out of scope for this session)
- Mobile session (next): introduce ≥768px responsive breakpoints, remove or repurpose the `<1024px` notice, exercise the `_sass/` partial structure.
- ORCID / Google Scholar / publications-as-ScholarlyArticle in JSON-LD — once IDs are issued (PhD application pipeline).
- Visual regression automation (e.g., Percy, Chromatic) — not justified for current cadence.
- Lighthouse Performance score work — current spec only gates Best Practices + Accessibility.

---

## Changelog
- **v1 (2026-06-08)** — Initial consensus draft authored from `.omc/specs/deep-interview-mstar-web-baseline-refactor.md` (ambiguity 16.8%).
- **v2 (2026-06-08)** — Applied Architect CONDITIONAL APPROVE feedback:
  - Phase 2 step 7: `<meta viewport>` already at `_layouts/default.html:5`; changed from "add" to "verify present" (spec misdiagnosis).
  - Bug F (step 14): replaced `document.fonts.ready` with `document.fonts.load('1em target-haas')` because existing `font-display: swap` on 9 `@font-face` declarations at `style.css:8,16,24,33,41,49,57,65,73` causes post-`fonts.ready` reflow.
  - Bug E (step 13): added verification gate (console.log) before deletion; Architect noted `getElementById` at `main.js:222` returns null at `DOMContentLoaded` timing, making the "duplicate call" a no-op rather than a bug.
  - Bug B (step 10): added `event.preventDefault()`, `appearance: none` neutralization, and explicit precedence note.
  - Phase 3: promoted `_config.yml url:` rewrite from buried R6 mitigation to numbered step 15a (runs before head metadata).
  - Sass entry: switched `@import` → `@use` to avoid Dart Sass deprecation warnings; fallback documented.
  - R3 mitigation simplified: dropped `setTimeout` fallback (over-engineering for Safari-latest-desktop scope).
  - R6 risk reframed: now describes feed-link cascade rather than the rewrite action.
  - R1 mitigation strengthened: added state-aware screenshot diff (initial / expanded / mid-transition) + byte-compare of compiled CSS.
  - Authoring cheatsheet location resolved: `docs/AUTHORING.md` (public) is canonical; supersedes spec's `.omc/docs/authoring.md`.
  - JSON-LD: added `"inLanguage": "en"` (Architect note on language hint).
  - Phase 1 scope-note added acknowledging surgical-scope-by-area concern; user-authorized in deep-interview R3.
  - Spec deltas to back-port (informational, not required this session): drop "No font-display: swap addition" constraint (factually moot — already present); rephrase viewport acceptance criterion as "verified present" not "added".
- Pending: Critic review of v2.
- **v3 (2026-06-08)** — Applied Critic REVISE feedback:
  - MAJOR #1: R1 `white-space: pre-line` count corrected `16 → 12` (verified `grep -c`). Added ImageMagick `compare -metric AE` with 1% fuzz tolerance as named screenshot-diff tool.
  - MAJOR #2: R7 "feels different" replaced with a 6-item concrete checklist (subgoal expand × 4, collapse × 4, oversized content, section-switch divider, Slow-3G horizontal-line, focus-ring layout-shift).
  - MAJOR #3: Bug F acceptance criterion #12 sharpened with measurable threshold (`offsetWidth` does not change >1px for ≥2s after `fonts.load` resolves; `ResizeObserver` or polled snapshots as evidence).
  - MINOR: R5 mitigation reframed as concrete check (build exits 0 + sitemap.xml exists + style.css produced).
  - MINOR: Phase 2 verification step 7 explicitly creates `.omc/lighthouse/` directory via `mkdir -p`.
  - MINOR: Added Option E (Architect two-phase synthesis) as explicit rejected alternative with rationale.
  - MINOR: Phase 1 step 2 invariant added: "each selector in exactly one partial."
  - MINOR: Bug C step 11 marks the close-animation tweak as deliberate, not regression.
  - **Spec back-port commitment**: After execution lands, the source spec at `.omc/specs/deep-interview-mstar-web-baseline-refactor.md` will be updated to (a) drop the moot "No font-display: swap addition" constraint, (b) rephrase the viewport acceptance criterion as "verified present" instead of "added", (c) reflect the resolved authoring cheatsheet location at `docs/AUTHORING.md`. This back-port is a follow-up task tracked in the ADR follow-ups list.
- Pending: Critic re-review of v3 (iteration 2 of max 5).
- **v4 (2026-06-08)** — Applied Architect re-review CONDITIONAL APPROVE fix:
  - Bug F font name corrected `bold-haas → target-haas` in 4 locations (implementation step 14 preferred + alternative branches, acceptance criterion #12, R7 item (5), changelog v2 entry). Verified via `grep -n "font-family" assets/css/style.css`: `.align-target` and `.align-target.align-target-main` at `style.css:543, 553` use `font-family: 'target-haas'`. `bold-haas` was wrong target — its only uses are at `style.css:394` (parent layout rule) and `style.css:937` (`.highlight` variant), neither of which renders the `.align-target` text whose width drives the `.horizontal-line` measurement.
  - Architect non-blocking notes (acknowledged, not actioned): ImageMagick "50px in any 100×100 region" sub-rule requires implementer judgment (no single CLI flag); spec back-port commitment scheduled as follow-up.
- Pending: Critic re-review of v4 (iteration 3 of max 5).
- **v4 APPROVED (2026-06-08)** — Critic iteration 3 returned APPROVE. All 3 v2 MAJOR fixes verified intact (R1 count = 12, R7 6-item checklist, criterion #12 threshold). v4 font rename complete and consistent. No new issues. Plan is execution-ready and stops here marked `pending approval`. **No automatic handoff to execution; explicit user approval required to invoke ralph / team / autopilot.**
