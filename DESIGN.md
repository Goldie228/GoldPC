version: alpha
name: Gold PC
description: A confident computer-hardware store interface anchored on a deep near-black canvas, where Gold PC's iconic golden yellow (#FCD535) carries every primary CTA, brand accent, and value-claim moment. Type runs Nunito Sans (display + body) and Nunito (numerical / product-data) stack at modest weights — the system trusts size and yellow voltage over bold weight. All surfaces default to the dark theme, with a single light element: the footer. Price-drop green (discount) and price-rise red (price increase) accent price-direction signals throughout.

colors:
  primary: "#fcd535"
  primary-active: "#f0b90b"
  primary-disabled: "#3a3a1f"
  ink: "#181a20"
  body: "#eaecef"
  body-on-light: "#181a20"
  muted: "#707a8a"
  muted-strong: "#929aa5"
  hairline-on-light: "#eaecef"
  hairline-on-dark: "#2b3139"
  border-strong: "#cdd1d6"
  canvas-light: "#ffffff"
  canvas-dark: "#0b0e11"
  surface-card-dark: "#1e2329"
  surface-elevated-dark: "#2b3139"
  surface-soft-light: "#fafafa"
  surface-strong-light: "#f5f5f5"
  on-primary: "#181a20"
  on-dark: "#ffffff"
  price-drop: "#0ecb81"
  price-rise: "#f6465d"
  accent-turquoise: "#2dbdb6"
  info: "#3b82f6"
  info-ring: "#3b82f6"

typography:
  hero-display:
    fontFamily: "Nunito Sans, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 54px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -1px
  display-lg:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.5px
  display-md:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: 34px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.3px
  display-sm:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0
  title-lg:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0
  title-md:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: 0
  title-sm:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  number-display:
    fontFamily: "Nunito, Nunito Sans, sans-serif"
    fontSize: 34px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.3px
  number-md:
    fontFamily: "Nunito, Nunito Sans, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  number-sm:
    fontFamily: "Nunito, Nunito Sans, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  button:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0
  nav-link:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  xs: 2px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 80px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 24px
    height: 40px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-primary-disabled:
    backgroundColor: "{colors.primary-disabled}"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
  button-primary-pill:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 14px 32px
  button-secondary-on-dark:
    backgroundColor: "{colors.surface-card-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 24px
  button-secondary-on-light:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 24px
  button-tertiary-text:
    backgroundColor: transparent
    textColor: "{colors.body}"
    typography: "{typography.button}"
  button-add-to-cart:
    backgroundColor: "{colors.price-drop}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 8px 20px
  button-remove:
    backgroundColor: "{colors.price-rise}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 8px 20px
  button-notify:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: 6px 16px
    height: 28px
  text-link:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
  top-nav-dark:
    backgroundColor: "{colors.canvas-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.nav-link}"
    height: 64px
  top-nav-light:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 64px
  hero-band-dark:
    backgroundColor: "{colors.canvas-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.hero-display}"
    padding: 80px
  stat-callout-card:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.number-display}"
  trust-badge:
    backgroundColor: "{colors.surface-card-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.lg}"
    padding: 16px 20px
  product-table-card:
    backgroundColor: "{colors.surface-card-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 24px
  product-row:
    backgroundColor: transparent
    textColor: "{colors.on-dark}"
    typography: "{typography.number-md}"
    padding: 12px 0
  price-drop-cell:
    backgroundColor: transparent
    textColor: "{colors.price-drop}"
    typography: "{typography.number-md}"
  price-rise-cell:
    backgroundColor: transparent
    textColor: "{colors.price-rise}"
    typography: "{typography.number-md}"
  search-input-on-dark:
    backgroundColor: "{colors.surface-card-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 10px 16px
    height: 40px
  text-input-on-light:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 10px 16px
    height: 40px
  protection-band:
    backgroundColor: "{colors.canvas-dark}"
    textColor: "{colors.primary}"
    typography: "{typography.display-lg}"
    padding: 80px
  gaming-setup-card:
    backgroundColor: "{colors.surface-card-dark}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.xl}"
  qr-promo-card:
    backgroundColor: "{colors.surface-card-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.title-md}"
    rounded: "{rounded.xl}"
    padding: 32px
  faq-row:
    backgroundColor: transparent
    textColor: "{colors.on-dark}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.md}"
    padding: 20px 0
  cta-band-dark:
    backgroundColor: "{colors.surface-card-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.display-sm}"
    rounded: "{rounded.xl}"
    padding: 48px
  launch-hero-gradient:
    backgroundColor: "{colors.canvas-dark}"
    textColor: "{colors.primary}"
    typography: "{typography.display-lg}"
    padding: 80px
  cookie-consent-card:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: 16px
  product-quantity-card:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    typography: "{typography.number-display}"
    rounded: "{rounded.lg}"
    padding: 24px
  steps-card:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.lg}"
    padding: 24px
  price-chart-card:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 24px
  spec-row:
    backgroundColor: transparent
    textColor: "{colors.body-on-light}"
    typography: "{typography.body-md}"
  review-row:
    backgroundColor: transparent
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    padding: 12px 0
  footer-light:
    backgroundColor: "{colors.surface-soft-light}"
    textColor: "{colors.body-on-light}"
    typography: "{typography.body-md}"
    padding: 64px
---

## Overview

Gold PC reads like a computer‑hardware retail platform that wants to feel both authoritative and energetic. The base atmosphere is **deep near‑black canvas** (`{colors.canvas-dark}` — #0b0e11) holding white type and a single, ubiquitous accent: **Gold PC Yellow** (`{colors.primary}` — #FCD535). That yellow does almost all of the brand’s heavy lifting — it carries every primary CTA, every value‑claim headline (“YOUR GEAR, PROTECTED”), every “Shop Now” pill, every featured tier indicator, and the wordmark itself. There is no secondary brand color. The system trusts the yellow voltage to do the brand work, and it carries it.

Type runs Gold PC’s custom **Nunito Sans** (display + body) and **Nunito** (numerical / product‑data) stack. Nunito Sans carries display headlines, section titles, and body copy. Nunito appears on price tickers, large stat numbers (products sold, customer ratings, in‑stock counts) — anywhere a number wants to feel “tabular and reliable.” Both run at modest weights — display sizes use weight 600‑700 (bolder than typical marketing because a hardware store needs stats to read at a glance), body stays at 400.

The product uses a **dark theme** across all surfaces — marketing, product showcase, and transactional (checkout, custom builder, order form) all default to `{colors.canvas-dark}` (#0b0e11). The same yellow CTAs and gray‑blue hairlines (`{colors.hairline-on-dark}` — #2b3139) thread through all pages. Price‑decrease **green** (`{colors.price-drop}` — #0ecb81) and price‑increase **red** (`{colors.price-rise}` — #f6465d) signal price‑direction in tables, charts, and product listings.

**Key Characteristics:**
- Single accent color: `{colors.primary}` (#FCD535) does all brand voltage — primary CTAs, hero headlines, brand mark, badges. Used scarcely for maximum emphasis.
- Custom type stack: `Nunito Sans` (display + body) and `Nunito` (numbers, prices, product data). Large stat numbers always render in Nunito for tabular consistency.
- Unified dark theme: all surfaces (marketing, product, transactional, custom builder) use `{colors.canvas-dark}` as the page floor. No light theme variants.
- Light footer on dark body: the homepage uses `{colors.surface-soft-light}` (#fafafa) for the footer even when the body above it is dark — a deliberate inversion that visually closes the page.
- Price‑direction semantics: green down / red up (`{colors.price-drop}` / `{colors.price-rise}`) for price changes, applied as text color rather than badge background.
- Card surfaces: `{colors.surface-card-dark}` (#1e2329) for elevated cards; no gradient surfaces, no atmospheric backdrops — flat color blocks throughout.
- Border radius is small to medium: `{rounded.md}` (6px) for primary buttons, `{rounded.lg}` (8px) for inputs and content cards, `{rounded.xl}` (12px) for elevated card containers, `{rounded.pill}` for prominent feature CTAs.
- Spacing follows a 4‑multiple scale; major editorial bands sit at `{spacing.section}` (80px) — slightly tighter than typical marketing‑only sites because product pages need denser layouts.

## Colors

### Brand & Accent
- **Gold PC Yellow** (`{colors.primary}` — #FCD535): The single brand color. Used for primary CTA backgrounds, the wordmark, brand‑claim headlines (“YOUR GEAR, PROTECTED”), trust badges (“No.1 PC Retailer”), large stat numbers in `{component.stat-callout-card}`, and inline links.
- **Gold PC Yellow Active** (`{colors.primary-active}` — #f0b90b): The press / hover‑darker variant. Slightly more saturated yellow.
- **Gold PC Yellow Disabled** (`{colors.primary-disabled}` — #3a3a1f): A desaturated dark‑yellow used on disabled CTAs over dark canvas.
- **Accent Turquoise** (`{colors.accent-turquoise}` — #2dbdb6): A small secondary accent used sparingly on a “Build Your Own” CTA over dark surfaces. Treat as a single‑product accent, not a system color.

### Surface

The system uses a unified dark canvas:

- **Canvas Dark** (`{colors.canvas-dark}` — #0b0e11): The primary page floor across all surfaces — marketing, product, and transactional. Near‑black with a slight warm tint — never pure black.
- **Surface Card Dark** (`{colors.surface-card-dark}` — #1e2329): Cards, navigation dropdowns, secondary buttons, product tables, custom builder slots.
- **Surface Elevated Dark** (`{colors.surface-elevated-dark}` — #2b3139): One step lighter, used for nested cards, hovered nav items, and chart background panels.
- **Surface Soft Light** (`{colors.surface-soft-light}` — #fafafa): Footer surface only — the one light element on every page.

### Hairlines & Borders
- **Hairline on Light** (`{colors.hairline-on-light}` — #eaecef): The 1px border tone on light surfaces. Hairlines appear liberally across all transactional pages.
- **Hairline on Dark** (`{colors.hairline-on-dark}` — #2b3139): The 1px border tone on dark surfaces. Same hex as `{colors.surface-elevated-dark}` — borders feel like surface steps, not ink lines.
- **Border Strong** (`{colors.border-strong}` — #cdd1d6): A heavier border tone used on disabled secondary buttons.

### Text
- **Ink** (`{colors.ink}` — #181a20): The strongest text on light surfaces. Display headlines on transactional pages.
- **Body on Dark** (`{colors.body}` — #eaecef): Default running‑text on dark canvas — deliberately not pure white, slightly cooler.
- **Body on Light** (`{colors.body-on-light}` — #181a20): Same as ink — light‑mode body text reuses the ink token.
- **Muted** (`{colors.muted}` — #707a8a): Footer links, breadcrumbs, captions, table column headers. Works on both light and dark canvas.
- **Muted Strong** (`{colors.muted-strong}` — #929aa5): A second‑tier muted for emphasized labels.
- **On Primary** (`{colors.on-primary}` — #181a20): Black text on yellow primary CTAs.
- **On Dark** (`{colors.on-dark}` — #ffffff): Pure white for high‑contrast headlines on dark canvas.

### Price‑Direction Semantics
- **Price Drop** (`{colors.price-drop}` — #0ecb81): Green for price decreases / discounts — positive for customers, used as text color in product tables, charts, and inline price‑change indicators. Never as a button background.
- **Price Rise** (`{colors.price-rise}` — #f6465d): Red for price increases / markups. Same usage rules as price‑drop.

### Info / Focus
- **Info** (`{colors.info}` — #3b82f6): Inline info badges and the focus‑ring base. Used on input focus.

## Typography

### Font Family
The system runs **Nunito Sans** for display and body, and **Nunito** for numerical / product data. Both are licensed Gold PC custom typefaces. The fallback stack walks `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.

The split is functional, not decorative:
- Nunito Sans → editorial type (headlines, paragraphs, button labels, nav)
- Nunito → tabular numerical type (prices, stock counts, discount percentages, stat counters, product ratings)

Mixing them is not optional — Nunito Sans on a price ticker would lose the hardware‑store character; Nunito on a paragraph would feel monospace‑cold.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.hero-display}` | 54px | 700 | 1.1 | -1px | Homepage h1 ("2,500,000+ CUSTOMERS TRUST US") |
| `{typography.display-lg}` | 40px | 700 | 1.1 | -0.5px | Brand‑claim headlines ("YOUR GEAR, PROTECTED"), product‑launch hero ("Introducing the Titan X") |
| `{typography.display-md}` | 34px | 600 | 1.15 | -0.3px | Section heads on long‑scroll pages |
| `{typography.display-sm}` | 28px | 600 | 1.2 | 0 | CTA band headlines ("Build Your Dream PC with Gold PC") |
| `{typography.title-lg}` | 20px | 600 | 1.3 | 0 | Sub‑section titles |
| `{typography.title-md}` | 18px | 600 | 1.35 | 0 | QR‑promo cards, feature card titles |
| `{typography.title-sm}` | 15px | 600 | 1.4 | 0 | Trust badges, FAQ rows, step labels |
| `{typography.number-display}` | 34px | 700 | 1.1 | -0.3px | Large stat numbers (1,000,000+ Products, 98% Satisfaction) — Nunito |
| `{typography.number-md}` | 16px | 500 | 1.4 | 0 | Product table prices, spec table cells — Nunito |
| `{typography.number-sm}` | 14px | 500 | 1.4 | 0 | Inline prices, discount % changes — Nunito |
| `{typography.body-md}` | 14px | 400 | 1.5 | 0 | Default running‑text — Nunito Sans |
| `{typography.body-sm}` | 13px | 400 | 1.5 | 0 | Cookie consent text, footer body |
| `{typography.caption}` | 11px | 500 | 1.4 | 0 | Small meta labels |
| `{typography.button}` | 14px | 600 | 1 | 0 | Standard CTA button labels |
| `{typography.nav-link}` | 14px | 500 | 1.4 | 0 | Top nav menu items |

### Principles
Display sizes use weight 700 — heavier than most marketing systems. This makes sense for a hardware store: stats and specs need to read at a glance, headlines need to compete with dense product grids and comparison tables. The system will not soften display weight to 400 the way Airtable or Stripe does.

`{typography.number-display}` and the smaller number variants always use **Nunito**, even when surrounding body type uses Nunito Sans. Prices, stock counts, and stat counters render in Nunito regardless of context — it is the system’s “trustworthy number” voice.

### Note on Font Substitutes
Nunito Sans (Google Fonts, OFL license) replaces the original GoldNova. Nunito (Google Fonts, OFL license) replaces GoldPlex for numerical data. Both are free, open-source fonts with full Cyrillic support. Nunito Sans has a larger x-height — display sizes are scaled down ~15% from the original spec to maintain visual proportions.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 80px.
- **Section padding (vertical):** `{spacing.section}` (80px) — slightly tighter than airy marketing sites (96px) because Gold PC pages mix marketing bands with dense product surfaces (product tables, FAQ accordions).
- **Card internal padding:** `{spacing.lg}` (24px) for content cards and product tables; `{spacing.xl}` (32px) for QR‑promo cards and CTA bands; `{spacing.md}` (16px) for trust badges and table rows.
- **Gutters:** `{spacing.lg}` (24px) between cards in 3‑up grids; `{spacing.md}` (16px) inside footer column gutters and dense FAQ lists.

### Grid & Container
- **Max content width:** ~1280px centered on marketing pages; ~1440px on product surfaces (gaming‑arena, top‑deals tables) where horizontal density matters.
- **Editorial body:** Single 12‑column grid; product pages often use 8/4 split (main panel + side rail).
- **Product table:** 5‑column header (Product / Price / 24‑Hour Price Change / Stock / Action), with the first column carrying product image + name.
- **Footer:** 6‑column link list at desktop, wrapping to 2‑up at tablet and 1‑up on mobile.

### Whitespace Philosophy
Gold PC is denser than typical marketing sites — long‑scroll pages mix hero bands with product tables, FAQ accordions, and feature grids without much breathing room between them. The system trusts contrast (yellow vs. dark canvas, green vs. red price cells) to do the visual separation work, not whitespace. Where whitespace appears, it’s always uniform — `{spacing.section}` between every major band.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Body sections, top nav, hero bands, footer |
| Soft hairline | 1px `{colors.hairline-on-dark}` or `{colors.hairline-on-light}` | Inputs, table dividers, FAQ row separators, secondary buttons |
| Card surface | `{colors.surface-card-dark}` background on dark canvas, `{colors.canvas-light}` on light context — no shadow | All elevated cards (product‑table‑card, QR‑promo‑card, gaming‑setup‑card, trust‑badges) |
| Subtle drop shadow | Faint shadow visible only when a card sits over imagery | Used sparingly on the product‑quantity‑card on transactional pages |
| Focus ring | `0 0 0 2px {colors.info-ring}` at 50% alpha | Input + button keyboard focus state |

The elevation philosophy is **flat surfaces with color‑block separation**. Gold PC does not use heavy drop shadows or glassmorphism — depth comes from the contrast between `{colors.canvas-dark}` and `{colors.surface-card-dark}` (a 12‑step lightness jump that reads as a clear elevation boundary).

### Decorative Depth
- **Yellow → dark vertical gradient backdrop** on the product‑launch hero: `{colors.primary}` fading down to `{colors.canvas-dark}`. This is a single‑page treatment used for new product‑line announcements, not a system‑wide signature.
- **Product‑stack illustrations** flanking large stat blocks (3D rendered PC components, trophy icons). These are illustrations, not tokens — treat as content rather than design system surface.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 2px | Almost no use — reserved for very small badges |
| `{rounded.sm}` | 4px | Small inline buttons (notify, add‑to‑cart / remove inline) |
| `{rounded.md}` | 6px | Standard CTA buttons, primary buttons, primary input fields |
| `{rounded.lg}` | 8px | Search input, content cards, trust badges, sub‑cards |
| `{rounded.xl}` | 12px | Elevated card containers (product‑table‑card, QR‑promo‑card, CTA bands) |
| `{rounded.pill}` | 9999px | Prominent feature CTAs (“Shop Now” pill on dark, product‑launch “Pre‑order”) |
| `{rounded.full}` | 9999px / 50% | Product icons, avatars |

Gold PC’s radius hierarchy is tighter than typical marketing systems — most surfaces sit at 6‑12px. The pill radius is a deliberate exception used to signal “this is a top‑of‑page action.”

### Photography & Iconography
- Product icons render as 24×24 or 32×32 rounded glyphs (often 50% radius on circular outline + the product’s brand color inside).
- 3D rendered PC stacks and trophy illustrations are full‑color illustrations with a slight floor shadow — not flat icons.
- Photographic content (lifestyle shots of gaming setups) crops to `{rounded.xl}` (12px) corners, full‑bleed on mobile.

## Components

### Top Navigation

**`top-nav-dark`** — The marketing top nav on dark canvas. 64px tall, `{colors.canvas-dark}` background. Carries the yellow Gold PC wordmark at left, primary horizontal menu (Shop, Desktops, Laptops, Components, Gaming, Deals, Support), right‑side cluster with language selector, light/dark toggle, “Sign In” text link, “Sign Up” `{component.button-primary}`. The wordmark uses `{colors.primary}` for “GOLD PC” type.

**`top-nav-light`** — Deprecated. Gold PC now uses the dark top nav (`top-nav-dark`) on all surfaces.

### Buttons

**`button-primary`** — The signature primary CTA. Background `{colors.primary}`, text `{colors.on-primary}` (black on yellow — the system’s iconic combination), type `{typography.button}`, padding 12px × 24px, height 40px, rounded `{rounded.md}` (6px). Press state: `button-primary-active` darkens to `{colors.primary-active}` (#f0b90b). Disabled state: `button-primary-disabled` desaturates to `{colors.primary-disabled}`.

**`button-primary-pill`** — A larger pill variant of the primary CTA used for top‑of‑page shop‑now moments and product‑launch heroes (“Pre‑order Now”). Same yellow + black combination, padding 14px × 32px, rounded `{rounded.pill}` (9999px). Use sparingly — the pill is a “this is THE action” signal.

**`button-secondary-on-dark`** — Used over `{colors.canvas-dark}` for less‑emphasized actions. Background `{colors.surface-card-dark}`, text `{colors.on-dark}`, rounded `{rounded.md}`.

**`button-secondary-on-light`** — Light‑canvas equivalent. Background `{colors.canvas-light}` with `{colors.hairline-on-light}` 1px border, text `{colors.ink}`.

**`button-tertiary-text`** — Inline text button with no background. Used for “Sign In” in the top nav and inline “Learn More” links.

**`button-add-to-cart`** — A solid green button used for adding items to the cart (positive purchase action). Background `{colors.price-drop}`, text `{colors.on-dark}`, rounded `{rounded.sm}` (4px), padding 8px × 20px. Smaller and tighter than `{component.button-primary}` because it appears in dense product interfaces.

**`button-remove`** — Symmetric red variant for removing items from cart or “Sold Out” alerts. Same shape, background `{colors.price-rise}`.

**`button-notify`** — Compact yellow CTA used in the top‑reviews table to request a restock notification. Smaller height (28px) and tighter padding than the primary CTA — fits inside dense table rows. Same yellow + black combination.

**`text-link`** — Inline body links in `{colors.primary}` (yellow on dark, also yellow on light). No underline by default. Type inherits `{typography.body-md}`.

### Cards & Containers

**`hero-band-dark`** — Full‑width dark band carrying the homepage h1 + sub‑headline + dual CTA pair. Background `{colors.canvas-dark}`, padding `{spacing.section}` (80px). The h1 (“2,500,000+ CUSTOMERS TRUST US”) uses `{typography.hero-display}` at 64px / 700 — the system’s largest type role.

**`stat-callout-card`** — Inline yellow stat numbers (1,000,000+ Products, 24/7 Support, 98% Satisfaction). Transparent background, text `{colors.primary}`, type `{typography.number-display}` in Nunito. Used as a flat layout block, not a card with surface — the yellow text alone carries the visual weight.

**`trust-badge`** — Small dark cards holding “No.1 PC Retailer” / “Award‑Winning Support” claims. Background `{colors.surface-card-dark}`, rounded `{rounded.lg}` (8px), padding 16px × 20px. Yellow numeric or word badge (“No.1”) sits next to a short label.

**`product-table-card`** — The right‑side top‑deals table on the homepage. Background `{colors.surface-card-dark}`, rounded `{rounded.xl}` (12px), padding `{spacing.lg}` (24px). Carries a tab row (Best Sellers / New Arrivals / Biggest Discounts), then a 5‑column row of products with price, 24‑hour price change %, stock status, action button. Each row uses `{component.product-row}`.

**`product-row`** — A single row inside the product table. Transparent background, 12px vertical padding, hairline divider between rows. Product image (32×32) + name on left; price in `{typography.number-md}` (Nunito); 24‑hour change cell colored by direction (`{component.price-drop-cell}` or `{component.price-rise-cell}`); right‑aligned chevron icon for “view detail.”

**`price-drop-cell`** / **`price-rise-cell`** — Colored text cells for price changes. Transparent background, text `{colors.price-drop}` or `{colors.price-rise}`, type `{typography.number-md}` in Nunito. Always paired with a small triangle arrow indicating direction.

**`gaming-setup-card`** — The “Inspiration” section’s photo strip — 3 lifestyle photos showing people using Gold PC gaming rigs. Background `{colors.surface-card-dark}`, rounded `{rounded.xl}`. Photos crop edge‑to‑edge, no internal padding around the image.

**`qr-promo-card`** — The “Shop on the go. Anywhere, anytime.” card with QR code. Background `{colors.surface-card-dark}`, rounded `{rounded.xl}`, padding `{spacing.xl}` (32px). Contains an h2 in `{typography.title-md}`, a body paragraph, app store badges (iOS / Android), and a centered QR code.

**`protection-band`** — The yellow‑headlined “YOUR GEAR, PROTECTED” band. Background stays `{colors.canvas-dark}`, but the headline uses `{colors.primary}` at `{typography.display-lg}`. Below the headline, three large `{component.stat-callout-card}` numbers anchor the band: 5‑Year Warranty, 100,000+ Repairs, 98% Satisfaction.

**`faq-row`** — A single FAQ accordion row. Transparent background, padding 20px vertical, hairline divider between rows. Closed state: question in `{typography.title-sm}` + chevron icon at right. Open state: question + answer body in `{typography.body-md}`.

**`cta-band-dark`** — The “Build Your Dream PC with Gold PC” pre‑footer CTA band. Background `{colors.surface-card-dark}` (one step elevated from canvas), rounded `{rounded.xl}`, padding `{spacing.xxl}` (48px). Carries an h2 in `{typography.display-sm}` and a `{component.button-primary}` aligned right.

### Light‑Mode Transactional Components

**`product-quantity-card`** — The right‑rail card on the product detail / checkout page. Background `{colors.canvas-light}`, rounded `{rounded.lg}` (8px), padding `{spacing.lg}` (24px). Carries an editable quantity input in `{typography.number-display}` (Nunito), a variant selector (e.g., color/storage), and a yellow `{component.button-primary}` for “Add to Cart” / “Buy Now.”

**`steps-card`** — The “How to Get Your PC” 3‑up cards (Choose Your Parts → Confirm Order → Receive & Play). Background `{colors.canvas-light}`, rounded `{rounded.lg}`, padding `{spacing.lg}`. Each card has a small numbered icon, a `{typography.title-sm}` step name, and a body description.

**`price-chart-card`** — The “Product Price History” card carrying a pricing trend chart. Background `{colors.canvas-light}`, rounded `{rounded.lg}`. Top row carries product selector (Gaming PC Pro — $1,299.99, ‑5% today); main area is a line chart with price‑drop green and price‑rise red segments; bottom row carries timeframe selector (1W / 1M / 3M / 6M / 1Y / ALL).

**`spec-row`** — A single row in the product specification table. Transparent background, text `{colors.body-on-light}`, type `{typography.body-md}`. Spec label on left (CPU, GPU, RAM, etc.); value on right.

### Inputs & Forms

**`search-input-on-dark`** — The “Search 10,000+ products” input on the homepage hero. Background `{colors.surface-card-dark}`, text `{colors.on-dark}`, rounded `{rounded.lg}` (8px), padding 10px × 16px, height 40px. Carries a yellow `{component.button-primary-pill}` on the right side (“Shop Now”).

**`text-input-on-light`** — Standard input on transactional pages. Background `{colors.canvas-light}`, 1px `{colors.hairline-on-light}` border, rounded `{rounded.md}` (6px), padding 10px × 16px, height 40px. Focus state inherits the focus‑ring shadow.

**`cookie-consent-card`** — The cookie banner card visible on the homepage. Background `{colors.canvas-light}`, rounded `{rounded.lg}`, padding `{spacing.md}` (16px). Body text in `{typography.body-sm}` (13px / 400) with three stacked button options (Accept Cookies & Continue / Reject Additional Cookies / Manage Cookies).

### Top Reviews Sub‑System

**`review-row`** — A single row in the top‑reviews table on the /reviews section. Transparent background, padding 12px vertical, hairline divider between rows. Avatar + reviewer name + product name on left; rating, review date columns; yellow `{component.button-notify}` on right (“Notify Me” for restocks).

### Signature Components

**`launch-hero-gradient`** — The product‑launch hero for a new gaming PC line. A vertical gradient from `{colors.primary}` at top to `{colors.canvas-dark}` at bottom, with the headline (“Introducing the Titan X”) in `{typography.display-lg}` centered. A `{component.button-primary-pill}` (“Pre‑order Now”) sits below the headline. Used only on product‑launch event surfaces — do not generalize to other heroes.

### Footer

**`footer-light`** — The light‑gray footer that closes every page (including dark‑canvas pages). Background `{colors.surface-soft-light}` (#fafafa), text `{colors.body-on-light}`. 6‑column link list at desktop covering Support / About Us / Products / Business / Service / Learn columns. Vertical padding 64px. The deliberate light footer on a dark page is one of Gold PC’s most distinctive layout choices — it visually closes the page with a “marketing reset” surface.

**`footer-dark`** — Premium dark footer for marketing pages. Background `#11151d` (one step elevated from `{colors.canvas-dark}` for subtle separation). Gold accent muted to warm brass (`#c9a84c`) for restrained brand presence. Section titles in `{colors.muted-strong}` (#929aa5) with wide letter‑spacing. Link text in `#5a6270` (deep muted) with hover transition to muted gold. Copyright area in `#3d4450` (near‑invisible). Dividers at `#1a1f27`. Social icons in `#5a6270`, hover to `#c9a84c`. Vertical padding 64px, desktop 4‑column grid, tablet 2‑column, mobile 1‑column. Deliberately quiet — does not compete with page content.

## Do's and Don'ts

### Do
- Reserve `{colors.primary}` (Gold PC Yellow) for primary actions, brand‑claim headlines, and the wordmark. Never use it for secondary or decorative purposes — yellow’s scarcity is what makes it powerful.
- Keep `{component.button-primary}` (yellow with black text) as the universal primary CTA. The button uses `{colors.primary}` (#FCD535) background and `{colors.on-primary}` (#181a20) text across all surfaces.
- Use `{component.button-add-to-cart}` (green) and `{component.button-remove}` (red) only for explicit add‑to‑cart / positive purchase and remove / out‑of‑stock actions. Never use them for generic “confirm” or “cancel” because they carry semantic price‑direction meaning.
- Use Nunito for every number. Prices, stock counts, discount percentages, stat counters — all Nunito. Mixing Nunito Sans into a number ticker breaks the hardware‑store character.
- Use the unified dark canvas (`{colors.canvas-dark}`) across all surfaces — marketing, product, transactional. The dark theme is Gold PC's signature look.
- Anchor every editorial band with `{spacing.section}` (80px). Gold PC is denser than airy marketing sites — 80px is the right rhythm.

### Don't
- Don’t introduce a second brand color. The system has exactly one accent (`{colors.primary}`) and any expansion dilutes the brand identity.
- Don’t use yellow for body text or large surface fills. It is for focal‑point CTAs and headlines only.
- Don’t use `{colors.price-drop}` / `{colors.price-rise}` as background fills on cards. They are price‑direction signals, expressed as text color or small badge fill — never as a card surface.
- Don’t soften display weight. `{typography.hero-display}` and `{typography.display-lg}` are intentionally weight 700 — going to 400 reads as design‑portfolio, not hardware platform.
- Don’t add atmospheric gradients to the canvas (mesh, aurora, glow effects). Gold PC trusts color‑block contrast — adding atmospheric depth muddies the retail feel.
- Don’t invert `{component.button-primary}`’s text color. Black on yellow is the system’s signature — white text on yellow loses contrast and brand recognition.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Top nav collapses to hamburger; hero h1 drops from 64px to ~36px; product table converts to a horizontally‑scrollable card list; demo grids drop to 1‑up; footer 6 columns wrap to 2 |
| Tablet | 768–1024px | Top nav stays horizontal but tightens, secondary menu items hide behind a “More” dropdown; product table 2‑up; pricing/feature grids 2‑up |
| Desktop | 1024–1440px | Full top‑nav with all primary menu items; 5‑column product table; product detail pages in 8/4 split (main + side rail) |
| Wide | > 1440px | Same as desktop with more outer breathing room; max content width caps at 1280‑1440px depending on surface |

### Touch Targets
- Primary CTAs render at minimum 40 × 40px (`{component.button-primary}` height + padding) — meets WCAG AAA’s 44 × 44 with surrounding spacing.
- Notify / inline action buttons are 28 × 28 — denser than ideal but matches industry retail‑platform norms.
- Product icons in tables are 32 × 32px, with the entire row tappable for 44px+ effective target.

### Collapsing Strategy
- Top nav collapses to hamburger at < 768px; the menu opens as a full‑screen sheet with the same yellow accent CTAs anchored to the bottom of the sheet.
- Product table reflows to a horizontally‑scrollable single card per product on mobile.
- The hero stat numbers (“2.5M CUSTOMERS”) shrink proportionally rather than wrapping — Gold PC’s biggest claim must always read as a single block.
- Product detail pages switch from main content + side rail to stacked layout on mobile.
- The light footer stays full‑bleed at every breakpoint — it does not collapse to a separate dark variant.

### Image Behavior
- Product icons stay at fixed 24/32px sizes regardless of breakpoint.
- Lifestyle photos in the “Inspiration” section crop responsively — wider at desktop, taller (vertical) at mobile.
- 3D PC‑stack illustrations are fixed‑aspect‑ratio assets that scale uniformly without cropping.

## Iteration Guide

1. Focus on ONE component at a time. Reference its YAML key directly (`{component.button-primary}`, `{component.product-row}`).
2. All components use the dark theme (`{colors.canvas-dark}` background, `{colors.on-dark}` text). The same dark‑mode component patterns apply across marketing, product, and transactional surfaces.
3. Variants of an existing component (`-active`, `-disabled`) live as separate entries in `components:` — never as nested state objects.
4. Use `{token.refs}` everywhere prose mentions a color, a radius, a typography role, or a spacing value.
5. Never document hover. The system documents Default and Active/Pressed states only.
6. Numbers always use Nunito; copy always uses Nunito Sans. Mixing them is a system violation.
7. Price‑drop green / price‑rise red are semantic price signals — never repurpose them for “success” or “error” generic states.

## Known Gaps

- The frequency analysis of hairlines and the yellow accent was derived from design intent; hairlines are used extensively throughout.
- Nunito Sans and Nunito are variable fonts (weight 200–1000). The CSS @font-face declarations use the full variable range for optimal file size.
- Animation and transition timings (chart updates, price‑change flashes) are not in scope.
- Form validation states beyond `{component.text-input-on-light}` defaults are not extracted — error / success input variants would need a checkout or order‑confirmation flow to confirm.
- The full PC builder surfaces (component pickers, compatibility checker) use the standard dark‑theme card pattern (`surface-card-dark`, gold accent).
- The light/dark theme toggle behavior (whether transactional pages can be forced dark by user preference) is product behavior, not extracted from the marketing surfaces.
