# R3 — Art Direction & References

Track: R3 (art direction, reference sourcing, translation). Researcher: subagent R3. Date of all access: **2026-10-10**.
Evidence labels: **[DOC]** official documentation / terms · **[RES]** peer-reviewed or preprint research · **[PRAC]** practitioner writing · **[ANEC]** anecdote / third-party listing · **[TEST]** my own fetch test in this session · **[INF]** my inference (not a sourced fact).

Test environment note [TEST]: the container's `curl` is blocked by the egress proxy for every design site tried (403 on CONNECT), so all live tests below used **WebFetch only**. A headless browser was not exercised against these sites in this session; "headless" cells are inference unless marked.

---

## 1. Most consequential findings (prioritized)

1. **Three reference providers now ship official MCP servers, and all three need a paid plan.** Mobbin (hosted at `api.mobbin.com/mcp`, OAuth, "available on Pro & Team plans", in beta with usage "currently unlimited", limits to come) [DOC]. Refero (paid Pro/Team/Lifetime, up to 8,000 tool calls per user per month, web + iOS, tools for sites/apps/styles/screens/flows) [DOC]. Appllama (MCP at `mcp.appllama.io`; Pro $10/mo or Team $16/seat/mo, 1,500 MCP credits/month; not on Free) [DOC]. None of them is free, so under owner constraint C14 none can be a hard dependency. They are **optional upgrades**.
2. **Free, no-login reference retrieval through WebFetch works for web-marketing galleries but fails for app-flow libraries.** It worked on Awwwards, SiteInspire, Land-book, Lapa Ninja, One Page Love, Httpster, Recent (formerly at godly.website, which now 302-redirects there), Codrops, GOV.UK, USWDS, Fluent 2, Interface In Game, Cosmos (landing page only) and the Game UI Database index page. It failed or returned only metadata on Mobbin listing pages, Page Flows, Behance, Dribbble (empty), Refero (metadata only), Material 3 and Apple HIG (JS shells). Game UI Database's inner pages are blocked by robots.txt for WebFetch. [TEST] Result: the free path is strong for **visual language on the web** and weak for **mobile/app flows**. That is exactly the gap the paid MCPs fill.
3. **Apple HIG has a fetchable JSON back door.** `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json` returned structured content when the normal HTML page returned a "requires JavaScript" shell [TEST]. This is undocumented, so treat it as fragile [INF]. Material 3 has no equivalent found. Use a headless browser for it, or use Google's Design MCP (`design.googleapis.com/mcp`: color-scheme generation, icon and font search; requires Google Cloud auth) [DOC].
4. **Generic "AI-looking" UI has a sourced mechanism, not just a vibe.** Anthropic calls it *distributional convergence*: with no guidance, a model samples the most common, safe patterns. Named tells are Inter or system fonts, purple gradients on white, flat backgrounds, minimal motion, and predictable layouts (Anthropic, 2025-11-12) [DOC/PRAC]. The current Anthropic frontend-design skill adds a second generation of tells: cream background with serif and terracotta accent, near-black with an acid accent, broadsheet hairlines, the SaaS card kit, ALL-CAPS eyebrows, middle-dot meta strings, and gratuitous 01/02/03 numbering [DOC]. Independent research agrees. Shin et al. (arXiv 2603.13036, 2026-03) describe vibe-coded sites converging on minimalist whitespace, standard sans-serif and predictable heroes regardless of culture [RES, illustrative rather than measured]. Imteyaz et al. (arXiv 2607.22928, 2026-07) found layouts converging across five generative UI tools, and found that over a quarter of stated design rationales never reached the implementation ("Design Theater") [RES].
5. **Tell-lists go stale and create new defaults.** The first Anthropic list (Inter, purple) was followed by a later list naming the looks that models produced *after* steering (cream/terracotta, acid-on-black) [DOC; the inference is mine]. An always-on blacklist moves the mode rather than removing it. WhipUI should diagnose **"chosen vs. defaulted"** relative to the brief, not ship a frozen list of banned looks. This fits handoff §12.
6. **Homogenization predates AI. Defaults in shared tooling drive it.** Goree, Doosti, Crandall and Su (CHI 2021; ~10k sites, ~2005–2016) found that layout differences fell more than 30% between 2010 and 2016, and that sites built with Bootstrap, Font Awesome or jQuery UI were more similar [RES]. Implication [INF]: component-library defaults (radius, shadow, spacing scale) are a homogenizing force in their own right. Reference translation must reach the *token* level, not stop at the image level.
7. **Examples help, and they also cause fixation.** Lee et al. (CHI 2010) found that raters preferred designs made with examples, that adaptively selected examples beat random ones, and that designers combined several examples [RES]. The design-fixation literature (Jansson & Smith 1991; Viswanathan et al. 2016) shows designers copying example features, more so when the features are familiar [RES]. Implication: use **several diverse references and abstract them into mechanisms**. Do not feed one exemplar.
8. **Professional practice separates direction from layout.** Lucero (DIS 2012) found that mood boards serve framing, aligning, paradoxing, abstracting and directing [RES]. Style tiles (Warren, A List Apart 2012) sit between too-vague mood boards and too-literal comps: type, color and UI swatches with no layout [PRAC]. This maps directly onto handoff warning H5 (specs treated as fixtures): carry **style vocabulary, not layouts**.
9. **Rights: layouts and ideas are generally free. Expression, assets and brand dress are not.** US Copyright Office Circular 33 (rev. 2021) says ideas, methods, general layouts/formats and typeface designs are not copyrightable, while specific creative selection and arrangement can be [DOC]. Website "look and feel" can be protected as trade dress if it is distinctive, non-functional and confusingly similar, with specific elements articulated (AIPLA overview; *Conference Archives v. Sound Images*, 2010; *Blue Nile v. Ice.com*, 2007) [PRAC/legal commentary, not legal advice]. Gallery terms add their own limits. Mobbin says its content is "solely for reference", bans unauthorized scraping and mirroring, and bars using AI/ML to create derivative works or competing services without permission (ToS eff. 2023-06-24) [DOC]. The Game UI Database creator says the content may not be used for ML [PRAC, via Creative Bloq 2024-08-07].
10. **Reusable code and asset sources exist with clear licenses.** CodePen public Pens are MIT [DOC]. Codrops demos are MIT unless stated, and Codrops freebies may be used in projects but not redistributed [DOC]. Free Figma Community files are CC BY 4.0, which requires attribution [DOC]. USWDS is CC0 except fonts and icons (OFL/Apache) [DOC]. GOV.UK content is under OGL v3 [DOC]. These are the only categories in the catalog where *copying implementation* is legitimate.

---

## 2. Primary sources (accessed 2026-10-10)

| # | Source | URL | Pub. date | Label |
|---|---|---|---|---|
| S1 | Mobbin MCP repo ("official") | https://github.com/mobbin/mobbin-mcp-server | n/a | DOC |
| S2 | Mobbin MCP features | https://docs.mobbin.com/mcp/features | n/a | DOC |
| S3 | Mobbin MCP landing | https://mobbin.com/mcp | n/a | DOC |
| S4 | Mobbin Terms | https://mobbin.com/terms | eff. 2023-06-24 | DOC |
| S5 | Mobbin MCP launch (Business Wire via Rutland Herald) | https://www.rutlandherald.com/news/business/mobbin-launches-mcp-server-giving-ai-tools-621-500-real-app-screens-to-reference/article_27c6b6bb-5bac-57cb-9e47-c620b2307a49.html | 2026-05-12 | DOC (press) |
| S6 | Refero MCP getting started | https://doc.refero.design/mcp/getting-started | n/a | DOC |
| S7 | Appllama home / pricing | https://appllama.io , https://appllama.io/pricing | n/a | DOC |
| S8 | Appllama usage skill | https://skills.sh/appllama/appllama-skills/appllama-usage | n/a | DOC |
| S9 | Google Design MCP reference | https://developers.google.com/design-mcp/reference/mcp | updated 2026-05-20 | DOC |
| S10 | Are.na developers / API explorer | https://www.are.na/developers , https://www.are.na/developers/explore | n/a | DOC |
| S11 | Dribbble API v2 | https://developer.dribbble.com/v2/ | n/a | DOC |
| S12 | Dribbble Terms | https://dribbble.com/terms | upd. 2025-03-17 | DOC |
| S13 | Pinterest Terms | https://policy.pinterest.com/en/terms-of-service | eff. 2025-04-30 (new version 2026-11-12) | DOC |
| S14 | Pinterest API intro | https://developers.pinterest.com/docs/getting-started/introduction/ | n/a | DOC |
| S15 | CodePen licensing | https://blog.codepen.io/docs/licensing/ | n/a | DOC |
| S16 | Codrops licensing | https://tympanus.net/codrops/licensing/ | n/a | DOC |
| S17 | Figma Community licensing | https://help.figma.com/hc/en-us/articles/360042296374-Figma-Community-copyright-and-licensing | n/a | DOC |
| S18 | USWDS license | https://github.com/uswds/uswds/blob/develop/LICENSE.md | n/a | DOC |
| S19 | GOV.UK type scale (OGL v3) | https://design-system.service.gov.uk/styles/type-scale/ | n/a | DOC |
| S20 | Anthropic: Improving frontend design through Skills | https://claude.com/resources/articles/improving-frontend-design-through-skills | 2025-11-12 | DOC/PRAC |
| S21 | Anthropic frontend-design SKILL.md | https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md | undated (current main) | DOC |
| S22 | Shin et al., Interrogating Design Homogenization in Web Vibe Coding | https://arxiv.org/abs/2603.13036 (details via https://www.alphaxiv.org/abs/2603.13036.md) | 2026-03-13 | RES (preprint) |
| S23 | Imteyaz et al., Design Theater | https://arxiv.org/abs/2607.22928 | 2026-07-24 (v2 07-31) | RES (preprint) |
| S24 | Goree/Doosti/Crandall/Su, homogenization of web design (summary by co-author) | https://theconversation.com/yes-websites-really-are-starting-to-look-more-similar-136484 ; paper: https://vision.soic.indiana.edu/papers/websimilarity2021chi.pdf (now redirects) | 2020 (article); CHI 2021 | RES |
| S25 | Reinecke & Gajos, Quantifying Visual Preferences Around the World | https://kgajos.seas.harvard.edu/papers/reinecke14visual.pdf | CHI 2014 | RES |
| S26 | Lee et al., Designing with Interactive Example Galleries | https://hci.stanford.edu/publications/paper.php?id=143 | CHI 2010 | RES |
| S27 | Viswanathan, Tomko, Linsey, example familiarity & fixation (cites Jansson & Smith 1991) | https://www.cambridge.org/core/product/AD93E342571AB85057D36CFD4C53EE77 | 2016 | RES |
| S28 | Lucero, How Design Mood Boards Work | https://users.aalto.fi/~luceroa1/publications/2012/lucero12_moodboards.pdf | DIS 2012 | RES |
| S29 | Warren, Style Tiles and How They Work | https://alistapart.com/article/style-tiles-and-how-they-work/ | 2012-03-27 | PRAC |
| S30 | Andy Clarke on art direction (Smashing Podcast ep. 1) | https://www.smashingmagazine.com/2019/11/smashing-podcast-episode-1 | 2019-11 | PRAC |
| S31 | NN/g, Visual Hierarchy | https://www.nngroup.com/articles/visual-hierarchy-ux-definition/ | 2021-01-17 | PRAC |
| S32 | NN/g, Aesthetic-Usability Effect | https://www.nngroup.com/articles/aesthetic-usability-effect/ | 2024-02-03 (reviewed 2026-09-01) | PRAC |
| S33 | Butterick, Typography in Ten Minutes | https://practicaltypography.com/typography-in-ten-minutes.html | n/a | PRAC |
| S34 | US Copyright Office Circular 33 | https://www.copyright.gov/circs/circ33.pdf | rev. 2021-03 | DOC |
| S35 | AIPLA, "Does this web dress make my site look distinctive?" | https://www.aipla.org/innovate/does-this-web-dress-make-my-site-look-distinctive | undated (≥2025) | PRAC (legal) |
| S36 | Game UI Database 2.0 (Creative Bloq) | https://www.creativebloq.com/3d/video-game-design/game-ui-database-20-is-the-ultimate-free-reference-tool-for-game-designers | 2024-08-07 | ANEC/PRAC |
| S37 | Design Inspiration MCP (third-party) | https://glama.ai/mcp/servers/YonasValentin/design-inspiration-mcp-server | v1.0.0 seen 2026-03-21 | ANEC |
| S38 | Austin Kleon, Steal Like an Artist | https://austinkleon.com/steal/ | 2012-02 | PRAC (the good/bad theft poster's text could not be extracted, so it is not paraphrased here) |
| S39 | Material color utilities (HCT) | https://github.com/material-foundation/material-color-utilities | n/a | DOC |

---

## 3. Source catalog

Legend: **WF** = WebFetch result in this session. "unverified" = not confirmed on an official page today.

| Source | Strongest domain | Search capability | API / MCP | Auth & price (official only) | Automation / ToS | Asset rights | Metadata / freshness | Agent integration (free tools) |
|---|---|---|---|---|---|---|---|---|
| **Mobbin** | Mobile + web app screens & flows; also sections, animations, UI elements | Screens, flows, sections (MCP tools `search_screens`, `search_flows`, `search_sections`) | **Official MCP** (remote, OAuth, beta) | MCP on Pro & Team only; plan prices unverified (pricing page fetch failed) | ToS bans unauthorized scrapers/bots and mirroring; restricts AI/ML derivative or competing use | Screens belong to third parties; "reference only"; MCP image URLs expire after 30 days | 621,500 screens claimed on home page (meta text says 400k+; inconsistent); weekly additions | WF failed on listing pages. Practical only via paid MCP |
| **Appllama** (verified: exists) | Top-grossing **iOS** apps; onboarding, paywalls, flows, plus revenue/download context | Keyword, category, sort by revenue/downloads/rating; flows and UI-element views | **Official MCP** (`mcp.appllama.io`) + agent skills (`appllama/appllama-skills`) | Free: welcome screen of each app + 2 newest apps. Pro $10/mo (shown as 38% off $16); Team $16/seat/mo yearly, $20 monthly; MCP 1,500 credits/mo on Pro/Team | Terms page exists; content unverified | "All rights reserved"; reuse terms unverified | 66k+ screens / 1,470+ apps, weekly | WF on home works (marketing). Locked screens need Pro |
| **Refero** | Web + iOS screens, flows, curated "styles" | Sites/apps by company, industry, category, visual direction; screens, similar screens, flows | **Official MCP** + Refero Skill | Paid Pro/Team/Lifetime required; prices unverified (pricing fetch returned metadata only) | 8,000 MCP calls/user/month; ToS fetch blocked by robots | unverified | "tens of thousands" of screenshots | WF returns metadata only. Practical only via paid MCP |
| **Page Flows** | Recorded user flows (video) | unverified | unverified | unverified | unverified | unverified | unverified | WF failed (client error) |
| **Awwwards** | Expressive/award web marketing, portfolios, motion | Rich filters: award, category (~30), tag (~70), technology, country, **font**, color | No public API found (unverified) | Browsing free; Pro membership exists, price unverified | ToS fetch failed: unverified | Sites belong to owners | Daily SOTD; strong tags | **WF works**, listings readable without login |
| **Recent (ex-Godly)** | Curated expressive web; also branding, motion, app screenshots | Tags: web, interface, branding, typography, motion, 3D, editorial… | none mentioned | none shown | unverified | owners' | Active (2026) | godly.website → 302 → recent.design (rename inferred, not confirmed by the site). **WF works** |
| **SiteInspire** | Editorial, typographic, minimal web | Styles / types / subjects / platforms | none mentioned | none shown | unverified | owners' | Counts e.g. "Typographic (2,105)" | **WF works** |
| **Land-book** | Landing pages, portfolios; sections; motion | Category, industry, style, color, font class (serif/sans/display); separate Sections page | none mentioned | Free Basic (limited); Pro "from $6/mo" | ToS fetch failed: unverified | owners' | Active | **WF works** |
| **Lapa Ninja** | Landing pages (7,300+), sections, fonts | ~80 categories, color, platform (Webflow/Framer…), year 2015–2026 | none | Pro exists, price unverified | unverified | owners' | Active, year filter | **WF works** |
| **One Page Love / Httpster** | Single-page sites; style/genre/tech tags (OPL); curated (Httpster) | OPL: genre, style, platform, tech, **sections** | none | OPL templates free/premium | unverified | owners' | OPL rich; Httpster sparse metadata, © to 2026 | **WF works** for both |
| **Dribbble** | Concept shots, illustration, visual exploration (often not shipped UI) | Site search (not tested) | Official API v2: OAuth, 60 req/min and 1,440/day; documented examples are the authenticated user's own shots; public search unverified | unverified | ToS §7 bars scraping and automated requests faster than a human | Users' content; ToS bars derivative works from site content | High volume, low realism | WF returned empty |
| **Behance** | Branding, case studies, illustration | unverified | Public API status unverified | unverified | unverified | owners' | — | WF failed |
| **Pinterest** | Broad mood/visual inspiration | Visual search (not tested) | API v5 needs business account + app review; search capability unverified | — | ToS bans unauthorized scraping/collection | Pins are user content, often unattributed (provenance risk) [INF] | — | Not tested; ToS makes automation inappropriate |
| **Are.na** | Curated research boards, art/editorial | API has a search endpoint (details unverified) | **Official public API**; tokens or OAuth; "MCP server" listed under resources (details unverified); third-party MCPs exist | Guest rate limit 30/min, Free 120, Premium 300 | Rate-limited API is the sanctioned path | Mixed, block-level provenance | Human-curated, good context | **Best free programmatic mood source** [INF] |
| **Cosmos** | Visual mood collections | Color search, similar-image search | none mentioned | none shown | unverified | user-collected | — | WF landing only. Login to save |
| **Apple HIG** | iOS/macOS/visionOS platform conventions | Site navigation | none | free | — | Docs; Apple design resources have separate terms (unverified) | Current (26 kits on Figma) | HTML is a JS shell; **JSON endpoint works** (undocumented) |
| **Material Design 3** | Android/web component and token system | — | **Google Design MCP** (color schemes, icons, fonts), Google Cloud auth | price unverified | — | MCU library Apache-2.0 | updated 2026-05 | WF on m3.material.io fails (JS). Use browser or MCP |
| **Fluent 2** | Microsoft product UI, type ramps | — | none checked | free | — | unverified | — | **WF works** |
| **GOV.UK DS / USWDS** | Utilitarian, accessible services, forms | — | code on GitHub | free | — | OGL v3 / CC0 (fonts OFL/Apache) | maintained | **WF works**. Code reusable |
| **Codrops** | Motion, WebGL, page transitions, creative dev | articles + demos | none | free | Don't republish articles | **Demos MIT** unless noted; freebies usable but not redistributable | Very fresh (articles 2026-10-05/08) | **WF works** |
| **CodePen** | Micro-interactions, CSS/JS techniques | site search (not tested) | unverified | — | unverified | **Public Pens MIT** | — | not tested |
| **GitHub / OSS UI** | Implementation patterns, component systems | code search via `gh`/GitHub MCP | official API/MCP | free tier | API ToS | per-repo license | live | Available in this env (GitHub MCP, `gh`) |
| **Figma Community** | UI kits, platform kits (Apple 26, Material 3) | category browse | Figma REST/MCP exist (not verified here) | files free/paid | — | **Free files CC BY 4.0**; paid files under Community Paid Resource License | current | **WF works** on listing |
| **Game UI Database** | Game menus, HUDs, video of UI flow | Screen type, colour, controls, patterns, HUD elements, textures, genre (per 2.0 article) | none | free (donations) | robots.txt disallows WebFetch on inner pages; creator says no ML use | game publishers' | 55k+ screenshots / 1,341 games (2024) | Index page WF works; deep pages blocked. Human-in-loop browsing |
| **Interface In Game** | Game UI screens | Genres, themes, elements | none | none shown | ToS fetch failed: unverified | publishers' | entries into 2026 | **WF works** |
| **Third-party "design inspiration" MCP** (YonasValentin) | Meta-search via Google `site:` | Serper search + token extraction from live sites | third-party, MIT | Serper key (2,500 free searches) | Inherits Google ToS; marked "Inactive" | — | v1.0.0, 2026-03 | Duplicates what WebSearch with `site:` already does [INF] |

---

## 4. Retrieval & translation procedure (free tools only)

**Step 0: Decide if references are needed at all.** Skip retrieval for POLISH_OR_REPAIR, IMPLEMENT_EXISTING_DESIGN and EXTEND_EXISTING_SYSTEM unless the user asks. There the repo and the approved design are the reference. Use refs for CREATE_TO_SHIP, DESIGN_ONLY, REFERENCE_ADAPT, and DIAGNOSE when "it looks generic" is the complaint.

**Step 1: Classify the reference need** (handoff §6): visual language / flow-usability / motion / implementation. Each maps to different sources:
- *Visual language (web):* Awwwards (font/color/category filters), Recent, SiteInspire, Land-book, Lapa Ninja, One Page Love. WebFetch works on all of them.
- *Flow/usability (app):* free path is weak. Use platform docs (HIG via JSON, Fluent, GOV.UK patterns for forms) and WebSearch for case studies. Flag the gap and offer the paid MCP upgrade.
- *Motion:* Codrops (MIT demos), CodePen (MIT), Awwwards "Animation" tag. Watch in a headless browser recording, never from stills.
- *Implementation:* GitHub code search, GOV.UK/USWDS source, Codrops demos.
- *Game UI:* Interface In Game (WF works); Game UI Database (human browsing; robots-blocked for WebFetch).
- *Mood / non-UI material:* Are.na API (guest 30 req/min), or WebSearch. Draw from the **subject's own world** too (product packaging, signage, print in that industry). This follows S21's "ground in subject matter" guidance and Clarke's print/advertising references (S30).

**Step 2: Search wide, then shortlist small and diverse.** Run 2–4 source/filter combinations, collect about 8–12 candidates by URL, then shortlist **3–4** that differ on at least one major axis (density, type voice, color temperature). This diversity is a guard against fixation (S26, S27). Include at most one "collision" reference from outside the domain when the brief is expressive.

**Step 3: Capture evidence lawfully.** Screenshot the live site (headless) for the agent's own analysis. Record URL, access date and source gallery. Do not bulk-download gallery images, and do not hit gallery listing pages faster than a human would (Dribbble ToS §7, Mobbin ToS 3.2–3.3). Never automate Pinterest, Mobbin web pages, or Game UI Database inner pages.

**Step 4: Deconstruct each reference** with the template in §5. Extract *mechanisms*, and measure where possible: computed font sizes and ratio, line-height, measure, spacing rhythm, palette with roles, radius/shadow vocabulary, motion durations/easing.

**Step 5: Present to the user only if taste is uncertain** (C4). Show 2–3 references or style-tile-like syntheses (S29), labelled by mechanism. Ask which mechanisms they like or dislike, not which "site". Record preferences as **observed signals** in Design State. Selecting a ref ≠ approving every detail (handoff §7).

**Step 6: Translate.** Produce tokens and principles (type scale, palette roles, spacing/density rule, one signature move) that are **not** traceable to any single reference's distinctive expression. Run the no-copy checks.

**Step 7: Verify rendered output** against the stated mechanisms (R5/R4 tooling), and against the "defaulted vs chosen" check in §6.

**Optional upgrades: when to pay.** Adopt Mobbin, Refero or Appllama MCP only if **all** of these hold: (a) the task family is app/mobile flow-heavy (onboarding, paywall, checkout, settings) where the free path demonstrably lacks coverage; (b) the owner approves the subscription (C14); (c) a pilot ablation (B-arm refs from free path vs. MCP refs, everything else equal) shows a human-preferred or usability difference. Otherwise "it has more screens" is not evidence. Choosing among them [INF from S2/S6/S7]: Appllama is cheapest and iOS-monetization-specific. Refero adds curated "styles" and has an explicit call cap. Mobbin has the broadest library and includes web sections. Google Design MCP is worth testing only for Material-targeted products. The third-party Serper-based MCP adds little over built-in WebSearch.

---

## 5. Reference deconstruction template + no-copy safeguards

```
REF: <name> | URL | source gallery | accessed <date> | role: visual|flow|motion|impl
WHY RELEVANT: <tie to goal/audience/constraint, 1 line>
MECHANISMS (transferable):
  type: families' *classes* & roles, scale ratio, weight/width contrast, case use, measure
  rhythm/density: spacing scale, section cadence, info density per viewport
  composition: grid logic (columns, asymmetry, overlap, alignment axis), focal strategy
  color: role structure (ground/ink/accent counts, temperature, value contrast), not hexes
  imagery: subject, crop, treatment (photo/illustration/3D/none), how it carries meaning
  motion grammar: what triggers, durations/easing family, choreography (one moment vs many)
  states/flow: step count, feedback, recovery (for flow refs)
SURFACE (do NOT carry over): logo, illustrations, photos, copy, exact palette, signature
  layout composition, custom typeface, distinctive brand device
BORROW: <1–3 mechanisms>
AVOID: <what fails for our audience/content/a11y, or is the ref's signature>
TRANSFORM: <how each borrowed mechanism changes for our subject (e.g., "editorial
  asymmetric grid → asymmetric only in hero; data tables stay regular")>
RIGHTS: code license? asset license? "reference only"? attribution needed?
STATUS: proposed | shown-to-user | liked(mechanism X) | rejected  (never "approved" w/o user)
```

**No-copy safeguards** (these are soft rules unless scripted; per handoff §8 they must not be labelled "enforced"):
1. **≥2 references per adopted mechanism, or a stated transform.** No single reference may supply both layout *and* palette *and* type voice.
2. **No asset transfer:** no images, illustrations, icons, logos or copy from refs. Placeholder or original assets only. Licensed code (MIT/CC0/OGL/CC BY) may be reused, with the license and attribution recorded.
3. **Trade-dress check for competitor-adjacent briefs:** if the ref is from the same market as the user's product, list its articulable distinctive elements (S35) and make sure the output differs on most of them [INF: a heuristic, not a legal test].
4. **Silhouette test:** compare blurred or low-res screenshots of the output against each ref. If the overall arrangement is recognisably the same, transform it. (Scriptable with perceptual hashing via R5 tooling. Untested.)
5. **Match/Reproduce mode is the exception:** fidelity is the goal only when the user owns or is authorized for the target. Record that authorization in Design State.
6. **Hex/typeface audit:** do not lift exact brand hex sets or proprietary custom typefaces. Typefaces themselves aren't copyrightable in the US (S34), but font *files* are licensed software [INF, common practice].

---

## 6. Aesthetic failure diagnoses

| # | Symptom | Likely cause | Intervention | Counterexample (when the "symptom" is right) |
|---|---|---|---|---|
| 1 | Inter/system sans, white ground, purple/indigo gradient accent | Distributional convergence on safe defaults (S20) | Derive type and palette from subject vernacular. Write the choice + reason in Design State | A dev tool or SaaS where brand guidelines specify Inter and violet: follow the brand |
| 2 | Cream ground + high-contrast serif + terracotta accent, or near-black + acid green | Second-generation default after anti-slop steering (S21) | Check: "would a similar prompt land here?" If yes, re-derive | A heritage bakery or a terminal-culture dev brand where these are native vernacular |
| 3 | Everything in identical rounded cards, same radius and shadow | Component-library defaults acting as layout (S21; Goree et al. library effect, S24) | Assign radius/shadow **by hierarchy role**. Use spacing and grouping before boxes (S31 grouping) | Dashboards with many independent, rearrangeable widgets: cards are the right container |
| 4 | Tracked ALL-CAPS eyebrow over every heading; "01 / 02 / 03" markers | Template chrome copied as decoration (S21) | Keep structure only where it encodes info (true sequence, real category) | A real step-by-step onboarding: numbers carry meaning |
| 5 | Hero = big number + small label + stats + gradient | Default hero pattern (S21) | Open with the subject's most characteristic artifact (demo, product, image, sentence) | Fundraising or metrics-led brand where the number *is* the thesis |
| 6 | Fade-up on every section, hover lift on every card | Scattered default motion (S21) | One orchestrated moment + responsive motion for user actions. Review the playback | Motion-led portfolio where continuous motion is the concept (still needs reduced-motion) |
| 7 | Many sizes and weights, nothing dominates | No hierarchy plan. Every element "emphasised" | ≤3 size tiers, ≤2 elements at largest size, ≤3 contrast treatments (S31 heuristics) | Dense editorial/data UIs may need more tiers: measure readability, don't count tiers |
| 8 | Output looks like the reference with the logo swapped | Single-exemplar fixation (S27) | ≥3 diverse refs. Mechanism extraction. Silhouette test | REPRODUCE_TARGET with authorization: closeness is success |
| 9 | Different projects from the pack all share one look | House style or fixture contamination (handoff H5, §11) | Cross-task similarity audit. Remove style recipes from always-loaded context | Same company's product family *should* share a system |
| 10 | Stated rationale ("bold editorial grid") not visible in render | "Design theater": rationale not implemented (S23) | Verify each stated mechanism in the rendered screenshot. Drop unverified claims | — (always a defect) |
| 11 | Minimal, airy layout for an audience used to dense pages (e.g., Japanese retail) | Western-minimalism default overriding cultural norms (S22; S25 shows preferences vary by country/age/education) | Look up local refs in the target market. Ask about audience density expectations | When the brand intentionally differentiates with minimalism in a dense market |
| 12 | Beautiful screenshots, but users struggle | Aesthetic-usability effect masks problems (S32) | Separate taste review from task testing (R2/R6) | — |
| 13 | Long lines, cramped leading in body text | Container width set by layout, not measure | Body measure ~45–90 chars, line-height ~1.2–1.45 (S33) | Display text, captions, code blocks |
| 14 | Palette OK in light mode, muddy in dark or low contrast | Hex-picked palette with no tonal structure | Build tonal ramps (e.g., HCT tonal palettes, S39) and check contrast | Single-theme print-like pages |

---

## 7. Counterevidence, keep / reject / test, evaluation, uncertainty

**Counterevidence and competing explanations**
- *References might not matter for strong models.* HY1 says a frontier model plus 3 refs ≈ full WhipUI. Lee et al. (S26) is pre-LLM, on human designers, and shows larger benefit for **novices**. The analogue for frontier models is unknown. Falsifier: arms A ≈ B on blinded preference.
- *Tell-lists can backfire* (Finding 5). Banning a look shifts the mode. Falsifier: if a "defaulted vs chosen" check yields no more cross-task diversity than a static blacklist, use the cheaper one.
- *Homogenization isn't always bad.* Convention aids usability (Jakob's-law-type arguments; GOV.UK praised as good art direction by Clarke, S30). For utilitarian tasks, a "generic" layout may be the correct output. Distinctiveness must be weighted by brief.
- *The aesthetic tells are practitioner claims*, mostly from Anthropic's own guidance and preprints with illustrative rather than measured visual patterns (S22). Only Imteyaz et al. (S23) measure cross-tool convergence, on 120 interfaces. Moderate evidence.
- *Legal content is US-centric* and high-level. Mobbin's terms point to Singapore law. Thai or EU law was not researched.

**Keep**
- Free-path catalog (web galleries + platform docs + licensed code sources) as the default retrieval layer. Cost ≈ a few WebFetch calls.
- Deconstruction template (compact, loaded on demand), plus Design State reference records with rights and status.
- "Chosen vs defaulted" diagnostic (asking "would a similar prompt land here?") over a frozen blacklist.
- HIG JSON endpoint trick, flagged as fragile.

**Reject**
- Embedding reference screenshots or style recipes in the pack (fixture risk; ToS of galleries).
- Pinterest, Dribbble, Behance or Mobbin-web automation (ToS / failed fetches).
- Paid MCP as a default or a dependency (C14).
- Third-party Serper-based inspiration MCP (redundant, inactive).

**Test later**
- Paid MCP (Mobbin / Refero / Appllama) vs free path on 3–4 app-flow briefs. Same model, same loop, blinded owner preference + usability spot-check. Expected cost: one month of one subscription.
- Ref count (1 vs 3 vs 6) on output diversity and preference.
- Silhouette/perceptual-hash no-copy check: false positive rate on legitimately conventional layouts.
- Cross-task similarity audit (embedding or hash distance across 6+ unrelated briefs) as a house-style detector.

**Suggested evaluation**
- Separate *reference effect* from *skill effect*: arms B and C must use the **identical** reference set (handoff §11). Add an arm that gets refs *without* the deconstruction template.
- Diversity metric: pairwise visual distance across outputs for unrelated briefs. Lower similarity is good only if preference and usability hold.
- Plagiarism metric: max similarity of output to any supplied ref. Should be lower with the template than raw "use these refs".
- Rationale fidelity: % of stated mechanisms verifiable in the render (S23 method).
- Human preference remains the judge of taste (C7). AI may compute the metrics above but must not score beauty.

**Uncertainty / unverified**
- Mobbin, Refero and Page Flows plan prices: unverified (fetch failures). Mobbin MCP limits "to be added later".
- Whether Recent is officially Godly renamed: inferred only from the 302 redirect.
- Are.na MCP details, Dribbble public search, Behance API status, Awwwards/Land-book/Refero ToS text: unverified.
- Headless-browser behaviour on gallery sites was not tested here (container egress blocked). Cloudflare or bot walls are possible.
- Kleon's good-vs-bad-theft pairs could not be extracted from an official text, so they are not used as a source.
- Counts (screens, apps) are self-reported marketing figures and change weekly.

---

## §8 Free-first addendum (2026-10-10)

Scope: free (no paid plan) sources for app/mobile screens and flows, the free boundary of the paid libraries, and a free-first retrieval ladder. All tests used WebFetch on 2026-10-10. Labels are the same as above: [TEST], [DOC], [ANEC], [INF].

### 8.1 Key findings

1. **There is no free equivalent of a curated flow library that an agent can fetch.** Every curated app-screen library tested either failed WebFetch or puts full content behind login or a paywall: Mobbin, Page Flows, Screenlane, Pttrns (patterns page), Nicelydone, ScreensDesign, Refero, SaaS Interface and Saasframe [TEST]. For app flows, the free path has to be put together from other things: store screenshots, platform pattern docs, open-source apps the agent can run itself, and a human-in-the-loop path.
2. **App-store screenshots are free and machine-readable.** The iTunes Lookup API (`itunes.apple.com/lookup?id=<id>`) returned JSON with `screenshotUrls` and `ipadScreenshotUrls` [TEST]. The Apple product page HTML has the description but no screenshot URLs [TEST]. Google Play detail pages returned the description plus many `play-lh.googleusercontent.com` screenshot URLs [TEST]. Limits: the Search API allows about 20 calls/min, and returned artwork is licensed for promoting the store content only [DOC]. So use it for **analysis only**, never as page assets. Store screenshots are also marketing composites, not real flows [INF]. They show the 4–10 "hero" screens, often framed with captions.
3. **You can get real, complete flows for free by running open-source apps.** F-Droid package pages returned screenshots, the license and a source link (e.g., Wikipedia: Apache-2.0, GitHub source) [TEST]. Curated lists exist: `pcqpcq/open-source-android-apps` (493 apps, MIT, no screenshots) [TEST], and `dkhamsing/open-source-ios-apps` (CC0 list; README body did not render in WebFetch) [TEST]. For web apps, the agent can open real public sign-up, onboarding or settings flows in a headless browser and record them itself. This is the only free path that captures *states and transitions*, not just stills [INF].
4. **The free platform pattern docs have the most usability guidance per token.** The HIG JSON endpoint also works for pattern pages, e.g. `.../human-interface-guidelines/onboarding.json` returned best practices [TEST]. Material 3 pages are JS-only [TEST]. The `material-components/material-web` GitHub docs are fetchable and carry usage guidance per component [TEST]. ui-patterns.com index loads with a taxonomy (problem → pattern) [TEST]. GoodUX by Appcues loads free onboarding/product-tour teardowns [TEST].
5. **The free tiers of paid libraries are useful only to a human browsing by hand, not to an agent.** Details in 8.3.
6. **Several "sources" in the brief have been absorbed or redirected.** uisources.com and scrnshts.club both 302-redirect to **screensdesign.com** [TEST]. So UI Sources is effectively ScreensDesign now [INF from redirects]. ScreensDesign covers 2,700+ iOS apps with onboarding/paywall teardowns and has an MCP link; its paid pricing appears only in a third-party article [ANEC] and is unverified officially. Pttrns now says it is "completely free" with an account [TEST]. Collect UI's listings did not render [TEST].

### 8.2 Free / free-tier source table

| Source | Free vs paid boundary | Agent retrieval via WebFetch (today) | Automation / ToS | Best use |
|---|---|---|---|---|
| **iTunes Lookup API** | Free, no key | **Works**: JSON incl. screenshot URLs | ~20 calls/min. Artwork for store promotion only [DOC] | Visual + key-screen survey of a named iOS app/competitor |
| **apps.apple.com page** | Free | Description yes, screenshots no | unverified | Copy, positioning |
| **Google Play page** | Free | **Works**: description + screenshot URLs | Play ToS not checked: unverified | Visual survey of Android apps |
| **F-Droid** | Free, FOSS apps | **Works**: screenshots, license, source | unverified | Real flows by running the app. Licensed code |
| **open-source app lists (GitHub)** | Free | Android list works. iOS list README didn't render (use raw file or GitHub MCP) | GitHub API ToS | Find runnable apps per category |
| **HIG pattern JSON** | Free | **Works** (undocumented endpoint) | Apple site terms: unverified | iOS pattern rules (onboarding, modality, settings…) |
| **material-web GitHub docs** | Free, Apache-2.0 | **Works** | GitHub | Component usage + tokens |
| **Material 3 site** | Free | Fails (JS). Needs headless browser | — | Android patterns (via browser) |
| **ui-patterns.com** | Patterns free to browse. Card decks / Persuasive Patterns are paid | Index **works** | unverified | Pattern vocabulary (problem → solution) |
| **GoodUX (Appcues)** | Appears free | **Works** | unverified | Onboarding/product-tour teardowns (SaaS) |
| **Pttrns** | "Completely free" with free account | Home works (marketing only). Patterns page failed | unverified | Human browsing of mobile patterns |
| **Nicelydone** | Free: 12 screen previews; Solo/Team paid (prices not shown); MCP on Team | Home works (marketing) | unverified | SaaS flows: human only on free |
| **ScreensDesign** (absorbed UI Sources, scrnshts.club) | Free preview; Pro paid (third-party: $24.92–$39/mo, unverified) | Home works (marketing) | unverified | iOS onboarding/paywall: human or paid |
| **Screenlane** | unverified | Fetch failed | unverified | — |
| **uxarchive** | unverified | Fetch failed | unverified | — |
| **SaaS Interface** | Paid gallery ("Access the gallery" → pricing) | Home works (categories only) | unverified | Category taxonomy only |
| **Saasframe** | unverified | Robots-disallowed for WebFetch | — | — |
| **Collect UI** | unverified | Listings did not render | unverified | — |
| **Lazyweb** | Account needed. Some items "Limited" | App page needs login | Page includes an agent sign-in instruction (not followed) | not recommended for agent use [INF] |
| **Figma Community** | Free files CC BY 4.0 | Listing works. **Search is robots-disallowed** | Figma ToS | Platform UI kits (Apple 26, M3). App redesign files via human browsing |
| **Behance / Dribbble** | Free to view (human) | Fail / empty | Dribbble ToS §7 bans scraping | Human-only. Concept work, not shipped flows |
| **Land-book / Lapa / One Page Love** | Free browse | Works | unverified | App *marketing sites*, not in-app flows |

### 8.3 Free boundary of the paid libraries (human browsing)

- **Mobbin:** a Free account exists (home page says "Join for free") [TEST]. Exact free limits are not on any official page I could fetch: docs don't describe them, and the pricing page fails. One third-party review (2026-09-29) says free shows only the four most recent apps, and gives paid prices from $10/mo yearly to $15/mo quarterly [ANEC, unverified]. MCP and API are not on Free [DOC].
- **Refero:** Free plan = "search with limited results", no MCP, no Figma plugin. Flows and downloads are Pro [DOC: doc.refero.design/help/plans]. Exact counts and prices: unverified.
- **Page Flows:** every fetch failed. Free boundary unverified.
- **Appllama** (from §3): Free = welcome screen of every app + 2 newest apps in full [DOC].
- **Nicelydone:** Free = 12 screen previews, search across all apps [DOC].

**Human-in-the-loop path (free, ToS-safe) [INF, proposed]:**
1. The agent writes a **search brief**: which flow (e.g., "subscription paywall with trial"), 3–5 candidate apps from store and category research, and what to look for (step count, the moment a decision is asked for, recovery from errors, density).
2. The owner browses Mobbin/Refero/Pttrns free tiers or their own phone and pastes 3–8 screenshots, or records the flow on a device.
3. The agent deconstructs them with the §5 template and records provenance as "owner-supplied, reference only".
4. No screenshots are stored in the pack. They live only in the project's Design State references, with their URL/source.

Cost: a few minutes of owner time; fits Co-design mode.

### 8.4 Free-first retrieval ladder (ranked; stop at the first rung that meets the need)

**Visual language (web)**
1. Subject's own world via WebSearch (industry print, signage, packaging) for distinctive vocabulary.
2. Awwwards (font/color/category filters), Recent, SiteInspire, Land-book, Lapa Ninja, One Page Love: all WebFetch-OK.
3. Are.na API for mood collections (guest 30 req/min).
4. Headless screenshot of 3–4 shortlisted live sites for measurement.
5. Human-in-loop: owner pastes Pinterest/Cosmos/Dribbble picks.

**App / mobile flow**
1. Platform pattern docs: HIG JSON pattern pages, material-web docs, M3 via headless browser.
2. Run real flows: public web-app sign-ups, onboarding and settings in a headless browser (recorded). FOSS apps via F-Droid/GitHub lists when an emulator is available (rarely; test later).
3. Store screenshots (iTunes Lookup / Google Play) for competitor key screens. Analysis only.
4. Free teardowns: GoodUX (SaaS onboarding), ScreensDesign/Appllama free previews (human).
5. Human-in-the-loop with Mobbin/Refero/Pttrns/Nicelydone free tiers.
6. *Optional paid rung:* Mobbin / Refero / Appllama / Nicelydone / ScreensDesign MCP, only under the §4 criteria (owner approval + pilot shows a benefit).

**Patterns / usability**
1. Platform docs (HIG JSON, GOV.UK patterns, USWDS, Fluent): free, licensed, fetchable.
2. ui-patterns.com (problem → pattern), GoodUX teardowns.
3. Research and usability writing (NN/g, Baymard if needed; Baymard not verified here).
4. Run competitor flows (rung 2 above).

**Motion**
1. Codrops (MIT demos, fresh), CodePen (MIT public Pens): load and record them in a headless browser.
2. Awwwards "Animation" tag, Land-book Motion, Recent "Motion" tag.
3. Game UI Database videos (human-only; robots blocks WebFetch, no ML use).
4. Paid: Mobbin "Animations" (unverified scope).

**Implementation code**
1. Project repo + its design system (always first).
2. GitHub search (GitHub MCP / `gh`), GOV.UK/USWDS (OGL/CC0), material-web (Apache-2.0).
3. Codrops demos (MIT), CodePen (MIT), with attribution recorded.
4. Figma Community free kits (CC BY 4.0, attribution).

**Game UI**
1. Interface In Game (WebFetch-OK).
2. Store screenshots of the game (Steam/App Store/Play; Steam not tested).
3. Game UI Database: human-in-loop only (robots + no-ML statement).
4. Gameplay capture by the owner (video).

### 8.5 Implications, falsifiers, uncertainty

- **Implication:** WhipUI's default flow-research tool should be "**run the real flow and record it**" plus platform docs, not a gallery. This needs R5's headless-browser tooling, so the free path depends on R5 rather than on a subscription [INF].
- **Falsifier:** if, in the pilot, refs from paid flow libraries yield clearly preferred or more usable flow designs than ladder rungs 1–4 at similar token cost, promote the paid rung for app-flow tasks (with owner approval).
- **Risk:** store screenshots over-represent polished marketing composites. Running live flows on third-party services can hit bot walls, needs accounts, and must respect each site's ToS (no automated sign-ups on services that forbid them) [INF].
- **Unverified:** Mobbin/Page Flows/Screenlane/uxarchive/Saasframe/Collect UI free limits; ScreensDesign official prices; whether uisources → ScreensDesign is a formal acquisition (only redirects seen); Google Play ToS on automated access; Steam store pages; UXcel (not tested); emulator availability in target hosts.

**New sources (accessed 2026-10-10):** iTunes Search API terms https://performance-partners.apple.com/search-api [DOC] · iTunes Lookup test https://itunes.apple.com/lookup?id=570060128&country=us [TEST] · Google Play https://play.google.com/store/apps/details?id=com.duolingo&hl=en_US [TEST] · F-Droid https://f-droid.org/en/packages/org.wikipedia/ [TEST] · https://github.com/pcqpcq/open-source-android-apps · https://github.com/dkhamsing/open-source-ios-apps · HIG onboarding JSON https://developer.apple.com/tutorials/data/design/human-interface-guidelines/onboarding.json [TEST] · https://github.com/material-components/material-web/blob/main/docs/components/button.md [DOC] · https://ui-patterns.com/patterns · https://goodux.appcues.com/ · https://www.pttrns.com/ · https://nicelydone.club/ and /pricing [DOC] · https://screensdesign.com/ · https://www.saasinterface.com/ · Refero plans https://doc.refero.design/help/plans [DOC] · Mobbin docs https://docs.mobbin.com/ [DOC] · Mobbin vs ScreensDesign review https://theapplaunchpad.com/blog/mobbin-vs-screensdesign/ (2026-09-29) [ANEC].

---

## §9 Owner source list verification (2026-10-10)

All rows were checked with WebFetch/WebSearch on 2026-10-10. WF = WebFetch result for the agent. "unv." = unverified. "Yields" codes: img = screenshots, vid = video, live = link to the live site, code, prompt, md = markdown, tok = design tokens.

| Source (canonical) | (b) Free boundary | (c) Yields | (d) License | (e) WF | (f) ToS / automation | (g) Role · risk |
|---|---|---|---|---|---|---|
| minimal.gallery | Free browse; sells templates | img, live | screenshots: owners' | works (131 pages) | unv. | direction (minimal web) |
| kage.design/style | Free browse; no pricing shown | img by style/colour/industry/stack | footer: screenshots belong to products, shown "for inspiration and commentary" | works | unv. | direction; style taxonomy |
| godly.website → **recent.design** (302) | free | img, live | owners' | works | unv. | direction (rename inferred, not confirmed) |
| awwwards.com | free browse; Pro exists | img, live; font/colour/tech filters | owners' | works | ToS unv. | direction, motion tags |
| landing.love | Not stated; sign-in exists | **vid** (full-page recordings), live; GSAP/WebGL/ThreeJS filters | owners' | works | unv. | direction + motion |
| land-book.com | Free Basic limited; Pro from $6/mo | img, live, sections, motion | owners' | works | unv. | direction, sections |
| hoverstat.es | free | live + short notes ("alternative web design"), dated | owners' | works (entries to 2026-07) | unv. | direction, experimental interaction; low volume |
| mobbin.com | Free account; limits unv. (third party: 4 newest apps); MCP/API paid | img, flows | ToS: reference only, no scraping | listing pages fail | strict (§3) | app flows: human-in-loop or paid MCP |
| component.gallery | free | md-like descriptions + links to 95 design systems (60 components, 2,671 examples) | site license unv.; links to OSS systems | works | unv. | **patterns/components research** (naming, anatomy, a11y notes across systems) |
| navbar.gallery | free; Mobbin-sponsored | img, live, tagged by navbar type | owners' | works | unv. | section-specific |
| footer.design | not stated | img, live | owners' | works | unv. | section-specific |
| cta.gallery | gallery appears free; sponsored | img, live by CTA category | owners' | works (images not rendered) | unv. | section-specific (CTA) |
| supahero.io | not stated; "now part of screensdesign.com" | hero entries (format unv.) | owners' | works (names/links only) | unv. | section-specific (hero) |
| pricingpages.design | not stated | live links tagged by component/pattern | owners' | works | unv. | section/pattern (pricing); good tags |
| styles.refero.design | boundary unv. | **md (DESIGN.md per brand)**, colours, type, spacing, components | unv. | works | Refero ToS robots-blocked | design-context. **High fixture/clone risk**: brand styles (Wise, Notion, Linear) ready to paste |
| scrolltide.co | Paid lifetime $299; "Free Templates" page (contents unv.) | prompt, vid, code (Next.js, Framer Motion, GSAP, Three.js) | "personal & client use"; full terms unv. | works (marketing) | unv. | motion/scroll ideas. **Prompt-recipe = house-style risk** |
| 21st.dev | Browse free; free account 2 copies/day; Builder $6/mo, Builder+AI $15/mo, Team $7.50/seat (yearly) | code, prompt, shadcn CLI; MCP retrieval on paid plans | per-author; site license unv. | works | Terms unv. | components (code search). Quality varies by author |
| ui.shadcn.com | free | code via CLI/registry; MCP server listed | **MIT** (repo LICENSE) | works | — | components baseline. Its defaults are themselves a convergence source (§1.6) |
| ui.aceternity.com | 116+ free components; Pro/All-Access (price unv.) | code (React, Tailwind, **Motion**), MCP server | Pro: custom license, no redistribution/marketplace resale; free-component license unv. | works | — | motion/effects. **Dependency weight (motion) + recognisable "Aceternity look"** |
| magicui.design | Free OSS; Pro $199 one-time | code (React, Tailwind, Motion per metadata); MCP page | **MIT** (repo LICENSE) | works | — | effects/landing. Same house-style + motion dep risk |
| uiverse.io | Free | code (HTML/CSS, Tailwind, React, Figma); 7,449 elements | **MIT** (stated on site) | works | unv. | micro-components; quality varies |
| shadcnblocks.com | Free blocks (some need login); Pro $149 / Premium $299 / Elite $399 one-time | code via shadcn registry + MCP | paid single-user license; terms unv. | works | — | section blocks. Template/fixture risk |
| motion-primitives.com | Free; "open source", beta | code (Framer Motion + Tailwind) | license unv. on site | works | — | motion components; motion dep |
| smoothui.dev | Free (198 components) | code; shadcn registry; public no-auth API + JSON catalog | "open source & free"; license unv. | works | public API (OpenAPI) | motion components. **Most agent-friendly** (API); Motion + GSAP deps |
| github.com/ckissi/kinetics | Free | live demos + CSS/React code; 153 spring micro-interactions | **no LICENSE file seen**: treat as all-rights-reserved | works | — | motion *learning* only until licensed |
| microkit.co | Free (49) | code (TS/JS, CSS/Tailwind), shadcn registry; 26 have no deps | **MIT** | works | — | micro-interactions; lightweight |
| animejs.com | Free (v4.0.0) | library + docs; CodePen examples | **MIT** (repo) | works (not a JS shell) | — | motion engine (lighter alternative to Motion/GSAP) |
| threejs.org | Free | library, examples, docs | **MIT** | examples page: sidebar not rendered | — | 3D implementation |
| shadertoy.com | Free; API free (must credit "Shadertoy.com API") | GLSL code, live | **per-shader license**; default not confirmed on site (widely cited as CC BY-NC-SA, unv.) | home works; terms failed | — | shader learning/ideas. **Do not paste into commercial work without that shader's license** |
| kitbitz.art | Free (2,000+ illustrations) | SVG/PNG, Figma kits, MCP mentioned | **CC0** (stated) | works | — | assets (2D illustration). Recognisable-style risk if overused |
| 3dicons.co | Free download; Pro editing (price unv.) | 3D icon renders (Figma, Blender, WebP) | **CC0** per FAQ (license link broken) | works | — | assets; very widely used, so a "template" look risk |
| thebookofshaders.com | Free (donations) | text + live GLSL | "All rights reserved" (2015) | landing/TOC only | — | learning |
| threejs-journey.com | First lessons + start of each lesson free; $95 one-time | video course | proprietary | works | — | learning (human); not agent retrieval |

**Ambiguous names (candidates, none chosen):**
- **"DESIGN.md"**: (1) the **Google Stitch DESIGN.md format**, open-sourced under Apache-2.0 at `github.com/google-labs-code/design.md`. It is YAML tokens (colors, typography, rounded, spacing, components) plus markdown rationale sections, with an `@google/design.md` CLI that can lint (including WCAG contrast), diff and export to Tailwind/DTCG [PRAC blog 2026-06-27; repo not fetched directly]. (2) **getdesign.md / VoltAgent "awesome-design-md"**: 550+ unofficial DESIGN.md analyses of public brand sites, plus paid private analyses [DOC: about page]. (3) **styles.refero.design**: DESIGN.md per brand style (row above).
- **"VibePrompt"**: no product with that exact name was found. vibeprompts.com redirects to a domain-sale page. Closest matches: **VibUI** (1,700+ website-builder prompts, browsing free, one-time paid; Product Hunt) and **VibeCodePrompts** (listed on directories; not fetched).
- **"Glass UI"**: (1) **crenspire/glass-ui**: shadcn registry of Apple-"liquid glass" components (Next 16/React 19/Radix/Tailwind; license unv.), listed on 21st.dev. (2) **shadcn-glass-ui** (npm; dev.to intro). (3) **glasscn** (21st.dev). (4) Generic glassmorphism CSS generators (many). All represent one trend-specific look.

**Conclusions (≤300 words)**

*Put in the free-first ladder.* Direction: recent.design, awwwards, land-book, minimal.gallery, kage.design/style, hoverstat.es (experimental), and landing.love (its videos make it the best free *motion-in-context* source). Section-specific: navbar.gallery, footer.design, cta.gallery, pricingpages.design and supahero. Fetch these only when the task is a single section, to avoid "section collage" pages. Patterns: component.gallery is the best free cross-system component-anatomy source. Implementation: shadcn/ui (MIT), uiverse (MIT), microkit (MIT, minimal deps), animejs (MIT) and three.js (MIT). SmoothUI's public API makes it the easiest motion source for agents to integrate (license unv.). Assets: kitbitz and 3dicons (CC0), on the condition that they are customised or used sparingly.

*Optional (needs a check or has a cost).* Aceternity and Magic UI: useful effects, but they pull in Motion and have a recognisable look. Load them only if the brief wants that expressive style and the project accepts the dependency. 21st.dev: good to search, but quality is uneven and the free tier allows 2 copies/day. shadcnblocks and Scrolltide (paid tiers). Mobbin (human-in-loop or paid MCP). Shadertoy: ideas only unless the shader's license allows use. Google Stitch DESIGN.md: worth evaluating as a **format** for WhipUI's Design State/token handoff (Apache-2.0, lint and contrast checks). This is relevant to O3/O4 and should be tested, not adopted.

*Exclude from automatic use.* Brand DESIGN.md collections (styles.refero, getdesign.md) and prompt libraries (Scrolltide prompts, VibUI). They package someone else's finished style as a ready-to-paste spec, which is exactly the fixture/house-style failure (H5) and a clone risk for brand trade dress. Allow them only when the user explicitly asks to emulate a named style and the result is recorded as such. kinetics (no license) and thebookofshaders and threejs-journey are for learning only.
