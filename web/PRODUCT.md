# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, weighted equally (confirmed):

- Donors: people arriving from Google or a shared link, usually on a phone, who want to know whether their blood type is short near them, whether they are allowed to donate, and where to go.
- Press, researchers and the course panel: people who want the national picture and numbers comparable between states.

The home page serves the national overview; the state pages serve the donor.

## Product Purpose

Few blood centres publish their stock in an organised way, and each one uses a different scale. Mapa do Sangue collects what is public twice a day, normalises it to one scale (crítico, alerta, estável, adequado) and keeps the history, which almost no blood centre offers. Success means a visitor understands at a glance where blood is short and what they can do about it.

## Positioning

It is the only place that puts the public stock of several Brazilian blood centres side by side on one scale, with history, next to the national donation statistics (Anvisa Hemoprod + IBGE) for all 27 states.

## Operating Context

- Live stock from 6 blood centres covering 6 states: Hemoba (BA), HEMOES (ES), Hemominas (MG), Hemopi (PI), Hemosc (SC), Hemocentro Unicamp (SP). The other 21 states publish nothing that can be collected; this must be stated, never hidden or faked.
- Annual statistics for all 27 states: blood collections per thousand inhabitants (Anvisa Hemoprod 2024, IBGE population). Some states (RJ, MA) have incomplete submissions and are flagged "incompleto".
- The map opens on the Anvisa layer for all 27 states (confirmed); choosing a blood type switches it to current stock in the states that publish.
- Pages: home (map, overview by blood type, blood centre cards, "Eu doei hoje!"), /estado/[uf], /posso-doar (eligibility check + who donates to whom), /sobre (data sources).

## Capabilities and Constraints

- Next.js 16 (SSR/ISR, SEO per state), Go API, PostgreSQL. Data comes from the API; no client-side scraping.
- Eligibility follows Portaria GM/MS nº 11.685/2026; nothing typed in "Posso doar?" leaves the browser.
- "Eu doei hoje!" stores only state and blood type, no personal data.
- Some sources do not report when they were last updated; show that honestly.
- Interface language: Brazilian Portuguese.

## Brand Commitments

Name "Mapa do Sangue". Nothing from the current visual identity must be kept (confirmed): name, content and functions stay; the old look is only an anti-reference.

## Evidence on Hand

Real data only: live stock from the API, Anvisa/IBGE statistics, research in ../docs/pesquisa. There are no testimonials, partner logos or donation counts beyond what the API returns; never fabricate them.

## Product Principles

1. Honest coverage: always show which states have data and which do not, and how fresh each reading is.
2. Overview first, detail on demand: national picture, then a state, then a blood centre.
3. Turn shortage into action: every shortage view points to eligibility and where to donate.
4. Privacy by default: no personal data collected.

## Accessibility & Inclusion

Stock levels must never rely on colour alone (text label or pattern alongside). WCAG AA contrast in both themes. Usable on small phones.
