# Authoring Cheatsheet

This document describes how to add content to the site without editing JavaScript or CSS.

The four top-level sections (Main, Vision, Projects, Publications) are fixed. New entries within these sections are YAML-only changes under `_data/`. Adding a brand-new section is a deliberate code change documented at the end of this file.

---

## Add a project entry

Edit `_data/projects.yml` and append a block following the same shape as existing entries. Copy the first entry as a template:

```yaml
- title: "Taxel-based Color Representation, TaCo"
  year: "2024"
  tags: ["Augmentation", "Affective"]
  detail: "Unique way of representing colors using tactical symbols called *Taxels* for blinds"
  explanation: "Designed and developed 'Taxel,' a novel system that translates HSV color components..."
  image: "/assets/img/projects/taco.png"
```

Field notes:
- `tags`: any subset of `Augmentation`, `Intention`, `Context`, `Affective`. Each tag gets a color via `_sass/_projects.scss`.
- `detail`: short one-liner. Use `*text*` for highlighted spans; use `_text_` for sub-text styling.
- `explanation`: longer narrative shown under the detail row.
- `image`: path to a project thumbnail in `assets/img/projects/`.

---

## Add a publication

Edit `_data/publications.yml` and append a block:

```yaml
- title: "..."
  year: "2025"
  organization: "Nature Comm."
  authors: "First Author&ast;, Second Author&ast;, ..."
  link: "https://..."
  abstract: ""
```

**Asterisk escape rule** — author names that include `*` (e.g., co-first-author marks) **must use the HTML entity `&ast;` instead of a literal asterisk**. The site's highlight parser converts `*text*` to a `<span class="highlight">`, which collides with co-author marks. Use `&ast;` to bypass the parser. Example: `Sungha Jeon&ast;, Hyeonyeob Seo&ast;, ...`.

If `link` is empty, no `[link]` button is rendered.

---

## Add a news item

Edit `_data/news.yml` and prepend a block (newest first):

```yaml
- year: "Jul. 2025"
  content: |
    New paper has accepted
    in Nature Comm. !
```

The `|` literal block scalar in YAML preserves newlines. The CSS rule `.news-content { white-space: pre-line; }` (defined in `_sass/_nav.scss`) renders them as visible line breaks. Use this when you want multi-line news entries.

---

## Image conversion rule

When you add a new image to `assets/img/projects/` (or anywhere else under `assets/img/`):

1. **Maximum width: 1600px.** Re-export larger images at 1600px wide.
2. **Prefer `.webp`** for photographs and screenshots. Fall back to `.jpg` for compatibility-sensitive cases and `.png` for graphics with transparency.
3. **Drop the file in the target folder**, then reference its path in the YAML entry.
4. The site does **not** automatically optimize images (GitHub Pages does not whitelist `jekyll-picture-tag`). You handle compression once at export time.

A reasonable export pipeline: open the source in Photoshop / Affinity / Squoosh, resize to 1600px wide, export `.webp` at quality 80-85, drop into `assets/img/projects/`.

---

## Updating the `<head>` description, share card, or social links

- Site title and description: edit `_config.yml` (`title`, `description`) and `_data/site_info.yml` (`name`, `degree`, `departments`, `social_links`).
- Open Graph share card image: replace `assets/img/me.jpg` (used as the default `og:image` and `twitter:image`).
- LinkedIn / X / new sameAs entries: edit the JSON-LD block at the bottom of `_layouts/default.html` and the `social_links` list in `_data/site_info.yml`.

---

## Adding a new top-level section (advanced)

This is the only authoring task that requires editing code. Adding a new section like "Awards" or "Talks":

1. **Create a new YAML data file** under `_data/`, e.g. `_data/awards.yml`.
2. **Edit `assets/js/main.js`**:
   - Add a new entry to the `sectionData` array (sections 1-4 are taken; use `id: 5`).
   - Define a `generateAwardCard` (or equivalent) and `renderAwardCards` function under `// === Rendering ===`.
   - Wire `loadSectionContent` to call `renderAwardCards()` when `sectionId === 5`.
3. **Edit `_layouts/default.html`**:
   - Add a `<button class="nav-item" data-section="5" type="button"><span>Awards</span></button>` to `#navContainer`.
4. **(Optional) Add a CSS partial** in `_sass/_awards.scss` and `@use 'awards';` in `assets/css/style.scss`.
5. **Update `_data/sections.yml`** if the new section needs a long-form intro (like Main/Vision).

Confirm `bundle exec jekyll build` succeeds and the new section navigates correctly in all four browsers (Chromium, Firefox, Safari, plus any new browser context).
