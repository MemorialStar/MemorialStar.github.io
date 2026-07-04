# Deep Interview Spec: MemorialStar Web-Baseline Refactor (pre-mobile)

## Metadata
- Interview ID: deep-mstar-refactor-001
- Rounds: 9 (Round 0 topology + 9 Q&A)
- Final Ambiguity Score: 16.8%
- Type: brownfield
- Generated: 2026-06-08
- Threshold: 0.20
- Threshold Source: default
- Initial Context Summarized: yes
- Status: PASSED
- Status flag: **pending approval** — execution requires explicit user selection

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.87 | 0.35 | 0.305 |
| Constraint Clarity | 0.86 | 0.25 | 0.215 |
| Success Criteria | 0.74 | 0.25 | 0.185 |
| Context Clarity | 0.85 | 0.15 | 0.128 |
| **Total Clarity** | | | **0.832** |
| **Ambiguity** | | | **0.168 (16.8%)** |

## Topology

| Component | Status | Description | Coverage / Deferral Note |
|-----------|--------|-------------|--------------------------|
| `content-authoring` | active | YAML schemas, image asset pipeline, markdown conventions, escape patterns | Authoring cheatsheet doc + image hand-conversion rule; 4 sections fixed; new entries = YAML-only |
| `ui-ux-audit` | active | Fix visual quirks, semantic HTML, accessibility | 7 bugs locked (A,B,C,D,E,F,J); Lighthouse ≥90 a11y + best-practices gate |
| `cross-env-compat` | active | Chromium/Firefox/Safari desktop; web baseline only | Min viewport 1024px; <1024px renders "best on desktop" notice; <meta viewport> added |
| `code-arch` | active | CSS/JS reorganization, no behavior change | Sass partials in `_sass/`; main.js stays one file with role-grouped sections |
| `seo-metadata` | active | Full `<head>` metadata baseline | OG + Twitter + JSON-LD Person + sitemap + robots + canonical |
| `mobile-friendly` | **deferred** | Phone/narrow-viewport responsive layout | User-confirmed deferral to next session (`confirmed_at: 2026-06-08`) |

## Goal

Refactor MemorialStar.github.io to make web-baseline (≥1024px desktop) **objectively cleaner, more maintainable, and broadly compatible** across Chromium/Firefox/Safari, **without changing behavior or build pipeline**, in preparation for a separate mobile-friendly pass in the next session. The refactor covers content-authoring ergonomics, a fixed list of UI/UX bugs, a fixed viewport policy, light code organization, and a full SEO/metadata baseline.

## Constraints

- **No build pipeline change** beyond GitHub-Pages-whitelisted Jekyll plugins (`jekyll-sitemap` allowed; `jekyll-picture-tag` NOT allowed).
- **No behavior change** in the SPA-style section switching (Main/Vision/Projects/Publications).
- **No new top-level sections** in this session; 4 sections fixed, `sectionData[]` in `main.js` stays embedded.
- **No mobile-specific work** (deferred); below 1024px shows a static "best on desktop" notice.
- **No no-JS fallback** — JS-driven SPA stays; users without JS see blank content area.
- **No animation refactor** — existing `setTimeout`-chain slide orchestration in `switchSection()` stays as-is.
- **No `<html lang>` change** — `lang="ko"` kept per site identity.
- **No asterisk markdown syntax replacement** — `*x*` highlight regex stays; `&ast;` escape stays documented.
- **No `prefers-reduced-motion`** media query.
- **No `font-display: swap`** addition.
- **No schema validation tooling** for `_data/*.yml`.
- **No image auto-optimization pipeline** — manual hand-conversion + cheatsheet rule.

## Non-Goals

- Mobile/phone responsive layout (next session).
- Tablet (<1024px) layouts.
- Adding a JS bundler / ESLint / stylelint / npm toolchain.
- Replacing the asterisk highlight parser.
- Refactoring the section-switch animation chain.
- Adding accessibility features beyond the 7 listed bugs (reduced-motion, font-display, no-JS fallback all explicitly out).
- Adding new content sections beyond the 4 existing ones.

## Acceptance Criteria

### Content Authoring
- [ ] Adding a new project entry takes <2min and touches only `_data/projects.yml` + (optional) `assets/img/projects/<file>.webp`.
- [ ] Adding a new publication entry touches only `_data/publications.yml`.
- [ ] Adding a new news entry touches only `_data/news.yml`.
- [ ] Image authoring cheatsheet exists at `.omc/docs/authoring.md` (or equivalent) and documents: export ≤1600px width, prefer `.webp`, drop file into folder.
- [ ] Cheatsheet documents `&ast;` escape rule for asterisks in author names.

### UI/UX Bugs (locked list — 7 fixes)
- [ ] **A** Profile image (`me-image` in `main.js`) gets a meaningful `alt` attribute.
- [ ] **B** Nav items become `<button>` elements with `aria-current="page"` (or `aria-selected`) and visible focus styles; keyboard tab order works.
- [ ] **C** Subgoal-detail `max-height: 1500px` magic replaced with a non-truncating approach (e.g., `max-height: none` after expansion, or `scrollHeight`-measured value).
- [ ] **D** News YAML `content` line breaks render visibly (use `white-space: pre-line` or convert `\n` → `<br>` in render).
- [ ] **E** `renderProjectCards()` and `renderPublicationCards()` no longer called twice — drop the redundant `DOMContentLoaded` listener at `main.js:606-609`.
- [ ] **F** Horizontal-line width computation waits for `document.fonts.ready` (or uses `requestAnimationFrame` after font load) to prevent jitter.
- [ ] **J** Visible `:focus-visible` styles defined in CSS for nav items, links, and interactive elements.

### Cross-Environment Compatibility
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1">` added to `_layouts/default.html`.
- [ ] At viewport width <1024px, page shows a static "best viewed on desktop (≥1024px)" notice instead of the broken layout.
- [ ] Lighthouse Desktop score ≥90 Best Practices.
- [ ] Lighthouse Desktop score ≥90 Accessibility.
- [ ] Manual smoke test passes on Chromium (latest), Firefox (latest), Safari (latest desktop) — no layout/animation regressions vs current behavior.

### Code Architecture (Light depth)
- [ ] `_sass/` directory created with partials (e.g., `_base.scss`, `_layout.scss`, `_nav.scss`, `_content.scss`, `_projects.scss`, `_publications.scss`, `_vision.scss`, `_utilities.scss`).
- [ ] `assets/css/style.css` becomes `assets/css/style.scss` and imports the partials; compiled output served.
- [ ] `assets/js/main.js` stays one file but functions grouped under section comment headers (e.g., `// === Data Loading ===`, `// === Rendering ===`, `// === Section Switching ===`, `// === Layout/Divider ===`, `// === Utilities ===`).
- [ ] No JS behavior changes — every existing feature still works identically.

### SEO/Metadata
- [ ] `<meta name="description">` populated from `_config.yml` `description` field.
- [ ] Open Graph tags: `og:title`, `og:description`, `og:image=assets/img/me.jpg`, `og:url`, `og:type=profile`, `og:locale=en_US`, `og:locale:alternate=ko_KR`.
- [ ] Twitter card: `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image=assets/img/me.jpg`.
- [ ] JSON-LD Person schema embedded in `<head>` — **minimal field set**: `name`, `url`, `affiliation` (KAIST), `sameAs` = [LinkedIn URL, X URL]. (ORCID/Scholar/publications OUT of scope this session.)
- [ ] `jekyll-sitemap` plugin added to `Gemfile` (`group :jekyll_plugins`) and `_config.yml` plugins list; `sitemap.xml` generates at build.
- [ ] `robots.txt` added at site root with `Sitemap:` pointing to `https://www.youngminjung.com/sitemap.xml`.
- [ ] `<link rel="canonical" href="{{ page.url | absolute_url }}">` added to layout.
- [ ] Default OG share image = `assets/img/me.jpg` (no dedicated og.jpg this session).

## Assumptions Exposed & Resolved

| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| "Image management should be automated" | Contrarian R4: GH Pages whitelist blocks `jekyll-picture-tag`; only ~10 images total | Drop auto-optimize; hand-convert + cheatsheet rule |
| "Cross-env means support all viewports" | Simplifier R6: tablet+phone are mobile session's job | Min viewport 1024px; <1024px shows desktop notice |
| "Refactor implies full modernization" | R3 depth question | Light depth: Sass partials only, JS stays one file with comments |
| "Asterisk parser is the bug" | R2 multi-select didn't include syntax replacement | Parser regex stays; `&ast;` escape stays as documented authoring rule |
| "Adding sections is part of content-authoring goal" | R8 boundary question | No — 4 sections fixed; new section = deliberate code change |
| "`lang="ko"` is wrong since content is English" | User clarified in R7 | Not a bug; site identity stays Korean |
| "Animation chain needs cleanup" | R7 multi-select didn't include G | Animation orchestration stays as-is |

## Technical Context (Brownfield Findings)

- **Stack**: Jekyll 4.4.1 + kramdown + Sass + `jekyll-feed` plugin; Ruby/bundler; deploys to GitHub Pages at `www.youngminjung.com`.
- **Layout**: Single `_layouts/default.html`. SPA-style section switching driven by `assets/js/main.js` (616 lines).
- **Data**: 5 YAML files under `_data/` — `site_info.yml`, `news.yml`, `projects.yml` (5 entries), `publications.yml` (6 entries), `sections.yml` (long-form prose w/ 4 subgoals).
- **CSS**: `assets/css/style.css` is 1133 lines, single flat file. `_config.yml` references `sass_dir: _sass` but the directory doesn't exist yet.
- **JS**: Globals-only. Inline HTML templates as backtick strings (`sectionData[]`, `generateProjectCard`, `generatePublicationCard`). Section switch via stacked `setTimeout` (50/100/300/500ms).
- **Markdown helpers**: `parseHighlightText` (`*x*` → `<span class="highlight">`), `parseSubText` (`_x_` → `<span class="sub-text">`). Regex `\*([^*]+)\*` collides with author names; mitigated by `&ast;` HTML entity in YAML.
- **Animations**: Slide-out → load → slide-in chain; `max-height: 1500px` magic on subgoal-detail expand.
- **Head**: Only `<title>`, favicon, CSS link. No description, OG, Twitter, canonical, JSON-LD, sitemap, or robots.
- **Recent commits**: 5 of last 7 are `[fix] asterisk` — chasing parser collisions. 1 is `music link added`. 1 is `Projects highlights added`.
- **GH Pages plugin whitelist**: `jekyll-feed`, `jekyll-sitemap`, `jekyll-seo-tag`, `jekyll-redirect-from`, `jemoji`, `jekyll-paginate`, `jekyll-gist`, `jekyll-mentions`, `jekyll-relative-links`, `jekyll-default-layout`, `jekyll-titles-from-headings`, `jekyll-readme-index`, `jekyll-include-cache`, `jekyll-octicons`. NOT whitelisted: `jekyll-picture-tag`, `jekyll-imagemagick`.

## Ontology (Key Entities)

| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| `ContentEntry` | core domain | title, year, image, tags/authors/content | belongs to `Section` |
| `Section` | core domain | id (1-4), name, data_source | renders `ContentEntry[]` |
| `ImageAsset` | core domain | filename, format (webp/jpg/png/svg), max_width | referenced by `ContentEntry` |
| `AuthoringFlow` | supporting | steps, time_budget (<2min) | governs `ContentEntry` creation |
| `ImageAuthoringRule` | supporting | export_max_width=1600px, prefer_webp, drop_in_folder | governs `ImageAsset` |
| `LighthouseScore` | criterion | category (a11y/best-practices), threshold (≥90) | gates `ui-ux-audit` |
| `Browser` | external | name (Chromium/Firefox/Safari), platform (desktop) | tested in `cross-env-compat` |
| `ViewportGate` | constraint | min_width=1024px, below_action="desktop notice" | governs `cross-env-compat` |
| `AccessibilityCriterion` | criterion | wcag-derived | composes `LighthouseScore` |
| `BestPracticeCriterion` | criterion | viewport, https, etc. | composes `LighthouseScore` |
| `SassPartial` | code-arch | filename, scope | belongs to `_sass/` |
| `RoleGroup` | code-arch | section header in `main.js` (Data/Render/Switch/Layout/Util) | groups functions |
| `OGTag` | seo | property, content | embedded in `<head>` |
| `JSONLDPerson` | seo | name, affiliation, url, sameAs[] | embedded in `<head>` |
| `Sitemap` | seo | generated by jekyll-sitemap | references `Section[]` |
| `AltText` | a11y fix | target=me-image | fixes bug A |
| `NavButton` | a11y fix | element=<button>, aria-current | fixes bug B |
| `FocusStyle` | a11y fix | :focus-visible CSS | fixes bug J |
| `MaxHeightCap` | robustness fix | target=subgoal-detail, replace 1500px magic | fixes bug C |
| `NewsLineBreak` | robustness fix | white-space: pre-line | fixes bug D |
| `RenderDupe` | robustness fix | remove DOMContentLoaded duplicate | fixes bug E |
| `FontLoadGuard` | robustness fix | document.fonts.ready before width compute | fixes bug F |
| `SectionBoundary` | constraint | 4 sections fixed, new section requires code change | bounds `content-authoring` |

## Ontology Convergence

| Round | Entity Count | New | Changed | Stable | Stability Ratio |
|-------|--------------|-----|---------|--------|----------------|
| 1 | 4 | 4 | - | - | N/A |
| 2 | 7 | 3 | 0 | 4 | 57% |
| 3 | 9 | 2 | 0 | 7 | 78% |
| 4 | 10 | 1 | 0 | 9 | 90% |
| 5 | 13 | 3 | 0 | 10 | 77% |
| 6 | 14 | 1 | 0 | 13 | 93% |
| 7 | 21 | 7 | 0 | 14 | 67% |
| 8 | 22 | 1 | 0 | 21 | 95% |

Final ontology stable at 95% — domain model converged.

## Interview Transcript

<details>
<summary>Full Q&A (Round 0 + 8 rounds)</summary>

### Round 0 — Topology Confirmation
**Q:** Is this topology right? Should any component be added, removed, merged, split, or explicitly deferred?
**A:** Add SEO/metadata component → 5 active + 1 deferred (mobile).
**Ambiguity:** not scored

### Round 1 — UI/UX Success Criteria
**Q:** How will we know the UI/UX refactor is 'done'?
**A:** Lighthouse ≥90 Best Practices + ≥90 Accessibility, AND manual checklist pass on Chromium/Firefox/Safari.
**Ambiguity:** 60.5% (Goal: 0.45, Constraints: 0.22, Criteria: 0.38, Context: 0.58)

### Round 2 — Content Authoring Gate
**Q:** What does "docs/images/info easier to manage" concretely mean?
**A:** Add new entry <2min, no JS/CSS edit + image pipeline (drop in folder + optimized webp/avif).
**Ambiguity:** 55.9%

### Round 3 — Code Architecture Depth
**Q:** How will we know code architecture is 'cleaned up enough'?
**A:** Light — Sass partials + main.js role-grouped, no behavior change, no build pipeline change.
**Ambiguity:** 47.3%

### Round 4 — CONTRARIAN: Image Pipeline Tension
**Q:** Auto-optimize (R2) conflicts with no build pipeline change (R3). GH Pages blocks jekyll-picture-tag. ~10 images total. Resolve?
**A:** Drop auto-optimize; hand-convert once + document the rule.
**Ambiguity:** 42.6%

### Round 5 — SEO Scope
**Q:** What's the SEO/metadata ambition?
**A:** Full — share-card + JSON-LD + sitemap.xml + robots.txt + canonical URLs.
**Ambiguity:** 34.5%

### Round 6 — SIMPLIFIER: Cross-Env Minimum
**Q:** Which cross-env coverage is load-bearing? Pick minimum-viable.
**A:** Min viewport 1024px; <1024px shows desktop notice. (No reduced-motion, no font-display swap, no no-JS fallback.)
**Ambiguity:** 29.5%

### Round 7 — UI/UX Bug Scope
**Q:** Which of these 10 enumerated bugs are in scope?
**A:** Accessibility group (A, B, J — H dropped because lang=ko is not a bug) + Robustness group (C, D, E, F). Animation group (G) and asterisk (I) out.
**Ambiguity:** 23.9%

### Round 8 — Content Authoring Boundary
**Q:** Does "no JS/CSS edit" cover only new entries in existing 4 sections, or also new sections?
**A:** Entries only. 4 sections are fixed. Adding a new section is a deliberate code change.
**Ambiguity:** 19.4% — threshold met

### Round 9 — SEO Defaults (user requested further refinement)
**Q1:** OG image + JSON-LD field set?
**A1:** OG image=me.jpg, JSON-LD minimal (name, url, affiliation=KAIST, sameAs=LinkedIn+X).
**Q2:** og:locale value?
**A2:** og:locale=en_US primary + og:locale:alternate=ko_KR.
**Ambiguity:** 16.8% — **final**

</details>
