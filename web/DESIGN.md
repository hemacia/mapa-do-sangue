---
name: Mapa do Sangue
description: Brazil's public blood stock read like the TV weather forecast.
colors:
  critico: "#d42b3f"
  critico-hover: "#b81f33"
  critico-texto: "#a3192c"
  critico-texto-escuro: "#ff8a98"
  acento-casco: "#ff6b7d"
  alerta: "#f0a23a"
  sobre-alerta: "#2a1700"
  estavel: "#1f7f74"
  adequado: "#2f5fc4"
  casco: "#0a2a40"
  palco: "#0d3550"
  trilho: "#1b4562"
  casco-linha: "#2b5878"
  casco-tinta: "#ffffff"
  casco-tinta-2: "#d2e2ec"
  casco-tinta-3: "#a9c4d6"
  faixa-0: "#e3edf3"
  faixa-1: "#bcd4e3"
  faixa-2: "#8fb8d2"
  faixa-3: "#5e97bd"
  faixa-4: "#35729c"
  hachura-a: "#7f93a3"
  hachura-b: "#a9b8c4"
  sem-estoque-a: "#20506f"
  sem-estoque-b: "#2b6185"
  fundo: "#eef2f5"
  superficie: "#ffffff"
  tinta: "#0b2235"
  tinta-2: "#3d566b"
  tinta-3: "#4a6276"
  linha: "#cfdae2"
  campo: "#8fa6b7"
  fundo-escuro: "#0b1720"
  superficie-escuro: "#0e1f2b"
  tinta-escuro: "#e6eef3"
  tinta-2-escuro: "#a9c4d6"
  tinta-3-escuro: "#9fb7c8"
  linha-escuro: "#22394a"
  campo-escuro: "#4f6b80"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 800
    lineHeight: 1
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.1
  numeral:
    fontFamily: "Barlow Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 800
    lineHeight: 1.1
  title-ui:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
  body-lg:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
  caption:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
rounded:
  placa: "4px"
  base: "6px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
components:
  button-primary:
    backgroundColor: "{colors.critico}"
    textColor: "{colors.casco-tinta}"
    rounded: "{rounded.base}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.critico-hover}"
  button-dark:
    backgroundColor: "{colors.casco}"
    textColor: "{colors.casco-tinta}"
    rounded: "{rounded.base}"
    padding: "0 24px"
    height: "48px"
  button-dark-hover:
    backgroundColor: "{colors.palco}"
  button-outline:
    textColor: "{colors.casco-tinta}"
    rounded: "{rounded.base}"
    padding: "0 24px"
    height: "48px"
  chip-camada:
    textColor: "{colors.casco-tinta-2}"
    typography: "{typography.title-ui}"
    rounded: "{rounded.base}"
    padding: "0 12px"
    height: "44px"
  chip-camada-selected:
    backgroundColor: "{colors.casco-tinta}"
    textColor: "{colors.casco}"
  input-campo:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.base}"
    padding: "0 14px"
    height: "48px"
  placa:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.placa}"
    padding: "6px 10px"
  celula-tipo:
    typography: "{typography.label}"
    height: "34px"
  caixa:
    backgroundColor: "{colors.superficie}"
    padding: "24px"
---

# Design System: Mapa do Sangue

## Overview

**Creative North Star: "Mapa do Tempo"**

The stock of blood in Brazil is presented the way the evening TV news presents the weather: one national map on a deep ocean-blue stage, white placas standing over the states like the max/min boards of a forecast, and a legend that floats as a panel in the sea. The world was chosen by the user on 2026-11-15 and pinned by the approved Design canvas (https://claude.ai/artifact/XtaBQh7ar8LVo9ubQM2MoM); this file records how it landed in the shipped build.

The shell (header, home lead, state-page band, eligibility result, footer) stays ocean blue in both light and dark themes; only the reading surfaces around it switch theme. Land is a cool pale-to-deep blue ramp. Stock levels are the only warm colours in the system, so the eye finds shortage without being told. Missing or incomplete data is never blank and never faked: it is striped. Type is a condensed broadcast face for every heading, number and blood type, with a plain humanist sans for UI and prose.

Density is high but legible: an operating screen for donors on phones and press at desks, not a dashboard of pastel cards. The confirmed anti-reference is the generic three-column admin dashboard with pastel cards, and the site's previous identity.

**Key Characteristics:**
- Ocean-blue shell and map stage in both themes; reading surfaces switch light/dark.
- Stock levels (Crítico, Alerta, Estável, Adequado) are the only warm or saturated hues.
- Diagonal hatch means "incomplete" or "does not publish", on the map and in legends.
- Barlow Condensed for headings, numerals and blood types; Barlow for everything else.
- White placas with a soft drop shadow are the only lifted objects.
- Flat, square level cells; 6px radius only on interactive controls.

## Colors

A cold ocean palette carrying four signal colours; warmth is reserved for data.

### Primary
- **Sinal Crítico** (critico): the Crítico level fill, the primary button, text selection, and the shortage bars in "Dias em nível crítico". On light surfaces critical *text* uses the deeper **Crítico Texto** (critico-texto), on dark surfaces the lighter **Crítico Texto Escuro** (critico-texto-escuro), so labels pass AA. Primary hover darkens to critico-hover.
- **Coral do Casco** (acento-casco): the accent that lives on the blue shell: the brand drop, the active nav underline, the blood type in the home headline, and the global focus ring.

### Secondary
- **Sinal Alerta** (alerta): Alerta level fill; always carries the dark **Tinta sobre Alerta** (sobre-alerta) text, never white.
- **Sinal Estável** (estavel): Estável level fill, and the "pode" cells of the compatibility matrix.
- **Sinal Adequado** (adequado): Adequado level fill. A saturated royal blue, deliberately distinct from the muted land ramp.

### Tertiary
- **Faixas de Coleta** (faixa-0 to faixa-4): five steps, pale to deep blue, for Anvisa collections per thousand inhabitants. Map labels flip to white from faixa-3 up.
- **Hachura Incompleto** (hachura-a / hachura-b): grey 45° stripe for states with incomplete Anvisa submissions.
- **Hachura Sem Estoque** (sem-estoque-a / sem-estoque-b): blue-on-blue 45° stripe for states that do not publish stock, so they sink into the sea when a blood type is chosen.

### Neutral
- **Casco** (casco): header, home lead panel, footer, dark button. Also the browser theme colour.
- **Palco** (palco): the map stage, state-page band, eligibility result panel; also the stroke between states.
- **Trilho** (trilho) and **Linha do Casco** (casco-linha): bar tracks and dividers/borders on the shell.
- **Tinta do Casco 1-3** (casco-tinta, casco-tinta-2, casco-tinta-3): text on the shell, from headline to metadata.
- **Fundo / Superfície** (fundo, superficie; dark: fundo-escuro, superficie-escuro): page and panel backgrounds of reading areas.
- **Tinta 1-3** (tinta, tinta-2, tinta-3; dark variants): body text, secondary text, metadata.
- **Linha** (linha; dark linha-escuro): 1px dividers, table rules, "sem dado" level cells.
- **Campo** (campo; dark campo-escuro): input and select borders.

### Named Rules
**The Warm Means Stock Rule.** Red, amber, teal and royal blue appear only as stock levels (plus the critical CTA and its coral shell echo). Never use them for decoration, category colour or illustration.

**The Hatch Means Honest Rule.** Absent or incomplete data is a diagonal stripe, never an empty fill, a grey that could be read as a level, or an invented value.

**The Sea Never Changes Rule.** Casco and palco are identical in light and dark themes; only fundo, superficie, tinta, linha and campo switch.

**The Never Colour Alone Rule.** Every level cell carries its text label or the blood type plus a legend; placas name the level ("Crítico") next to the highlighted square.

## Typography

**Display Font:** Barlow Condensed 600/700/800 (with Arial Narrow, system-ui)
**Body Font:** Barlow 400/500/600/700 (with system-ui, -apple-system, Segoe UI)

**Character:** The condensed face is the broadcast graphic: tall, heavy, packing a headline or a blood type into a narrow board. Barlow is its quiet sibling for sentences, nav and forms, so the pair reads as one family.

### Hierarchy
- **Display** (800, clamp(2.5rem, 5vw, 3.75rem), 1): inner-page h1, on the state band and page headers.
- **Headline** (800, 3.25rem, 1; 2.5rem under 900px): the data-built home headline in the navy lead.
- **Title** (700, 2rem, 1.1): section h2. Panel titles run 1.375 to 1.75rem in the same face.
- **Numeral** (800, 1.625rem, 1.1): values in placas and fact grids (fact grid at 1.875rem/700); large type cells at 2.375rem. Blood types always use the condensed face.
- **Title UI** (Barlow 600, 1.125rem): blood-centre names and other list titles.
- **Body Large** (1.1875rem): lead paragraphs under page titles, max 56 to 64ch.
- **Body** (400, 1rem, 1.5): prose.
- **Label** (0.9375rem): notes, fact labels, secondary lines.
- **Caption** (0.8125rem): source freshness, legend items, field hints.

### Named Rules
**The Condensed Numbers Rule.** Every number a visitor compares (blood types, counts, rates, dates in fact boards) is set in Barlow Condensed at 700 or 800; sentences never are.

**The No Letterspacing Rule.** No uppercase labels and no tracking; the only tracked text is the wordmark (0.01em).

## Layout

The home is a three-column broadcast desk at 1280px and up: navy lead (400px) | map stage (fluid) | blood-centre panel (380px). Between 900 and 1279px the lead spans the top and the stage sits beside the panel; under 900px everything stacks. On the wide layout the map is sticky under the 64px header.

The map is sized by container queries on the stage, never by viewport breakpoints alone: it grows toward the window height (capped at 900px) and leaves room on the right for placas in the sea. At 1000px of stage the legend becomes a floating panel in the sea; under 700px placas shrink; under 560px placas leave the map and become a list beneath it, and the layer chips scroll in one row.

Inner pages use a 1200px centred column with 48px vertical padding and 48px gaps between sections (24/16px and 32px gap under 720px). State pages open with a full-width palco band holding title, placa of facts, actions and a small locator map.

Spacing is a 4px-based scale (4, 8, 12, 16, 24, 32, 48). Tap targets are 44 to 48px. Breakpoints: 720px (header, page padding, full-width buttons), 900px (stacking, 8 to 4 type cells), 1280px (three columns).

**The Hairline Grid Rule.** Grouped facts and placa fields are divided by a 1px gap showing the background through, not by borders on each cell, so the divider holds whether the row wraps or stacks.

## Elevation & Depth

The system is flat. Depth comes from the shell/stage contrast (navy against reading surfaces) and 1px rules. The single exception is the forecast board: placas and the floating sea legend lift off the map with a soft shadow, because they are boards held over the map.

### Shadow Vocabulary
- **Placa** (`box-shadow: 0 2px 8px rgb(3 20 32 / 0.35)`): placas over the map and the state placa of facts.
- **Placa hover** (`box-shadow: 0 0 0 2px #ffffff, 0 2px 10px rgb(3 20 32 / 0.5)`): placa link hover.
- **Legenda no mar** (`box-shadow: 0 2px 10px rgb(3 20 32 / 0.35)`): legend panel on wide stages.

### Named Rules
**The Only Boards Float Rule.** Only objects that sit over the map (placas, sea legend) cast a shadow. Cards, panels, buttons and inputs stay flat.

## Shapes

Two radii. Interactive controls (buttons, layer chips, inputs, state links, theme toggle) use a gentle 6px. Placas use a tighter 4px. Data cells (type cells, level tiles, bars, matrix cells, the boxed section) are square: they are fills on a chart, not cards. Bars are 12px tall square strips on a track. The only round form is the 10px leader dot where a placa's line meets its state; leader lines are 2px white.

## Components

### Buttons
Broadcast-solid, one height everywhere.
- **Shape:** 6px radius, 48px min height, 24px side padding, 2px border slot, Barlow 600 at 1.0625rem.
- **Primary:** critico fill, white text. Used for "Posso doar?", the one action per view. Hover darkens to critico-hover.
- **Outline:** transparent with a mid-blue border, white text; used on the shell next to primary. Hover brightens the border to white.
- **Dark:** casco fill with casco-linha border; used on reading surfaces ("Registrar minha doação"). Hover shifts to palco.
- **Focus:** 3px coral (acento-casco) outline, 2px offset, site-wide. Disabled: 0.6 opacity.
- **Motion:** background and border colour, 180ms, cubic-bezier(0.22, 1, 0.36, 1); removed under reduced motion.

### Chips (map layers)
- **Style:** on the palco, transparent with a casco-linha border, 6px radius, 44px tall, min 48px wide. Blood types in Barlow Condensed 700 at 1.125rem; the general layer ("Doações por estado") in Barlow 600.
- **State:** selected chip turns solid white with casco text. Native radios underneath; focus ring drawn on the label.

### Cards / Containers
- **Caixa:** superficie with a 1px linha border, 24px padding, square corners, no shadow.
- **Blood-centre entry:** not a card; a list row separated by a 1px top rule, name in Title UI, city/UF right, eight-cell type row, critical line in critico-texto, source freshness in caption.
- **Result panel:** palco block, 28px padding, condensed 2.75rem verdict, level-coloured selo.

### Inputs / Fields
- **Style:** 48px tall, 14px padding, 1px campo border, 6px radius, superficie fill, 1.0625rem. Label above in 0.9375rem/600, hint below in caption.
- **Focus:** the global coral outline. **Error:** critico-texto, 600.

### Navigation
On the casco bar (64px, sticky): wordmark in Barlow Condensed 800 at 1.625rem beside a coral drop SVG; links in Barlow 500 in casco-tinta-2, white on hover; the current page gets white text and a 3px coral bottom bar. Under 720px the links drop to a second, horizontally scrolling row. Theme toggle is a 44px bordered square at the far right.

### Placa (signature)
The forecast board. White, 4px radius, soft shadow, 6px 10px padding, linked to its state by a 2px white leader line and dot. Holds the UF in condensed 800, eight 11x20px level squares, and a critical summary in critico-texto at caption size. Choosing a blood type dims all squares to 0.25 opacity, outlines the chosen one in tinta, and swaps the summary for that type's level. Placas stay white in both themes. Under 560px of stage they become a bordered list under the map.

### Level cells
Square fills using the level colour with its paired text colour (white, or sobre-alerta on Alerta). Compact row: 8 columns, 3px gap, 34px tall. State page: 8 (4 on mobile) tiles, 6px gap, min 112px, condensed type at 2.375rem with the level name below.

## Do's and Don'ts

### Do:
- **Do** keep casco (#0a2a40) and palco (#0d3550) identical in both themes.
- **Do** colour stock only with the four level tokens, and always pair the fill with a text label or legend.
- **Do** stripe missing or incomplete data with the hachura patterns.
- **Do** set blood types, counts and headline numbers in Barlow Condensed 700/800.
- **Do** use 48px min height and the 6px radius for every button, field and tappable link.
- **Do** put the legend in the sea on wide stages and placas into a list on narrow ones.

### Don't:
- **Don't** use red, amber, teal or royal blue for anything that is not a stock level or the critical call to action.
- **Don't** build pastel cards in a three-column dashboard grid; containers are flat, ruled and square.
- **Don't** add shadows to anything that does not sit over the map.
- **Don't** add uppercase tracked labels or kickers above headings.
- **Don't** leave a non-publishing state blank or tint it in a level colour.
