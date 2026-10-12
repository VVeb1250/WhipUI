# Surface-specific reasoning overlays

Do not generalize every page into landing-page aesthetics. Pick one dominant surface and apply relevant cross-cutting constraints (a11y, localization, performance, responsive).

## Marketing / portfolio / editorial

Goal: communicate a point of view and evidence efficiently to first-time visitors. Identify the content that provides credibility (work artifacts, real writing, demos), then design the story and transitions. Strong composition and custom asset treatment can be valuable. Beware empty generic benefit cards, invented metrics and visual effects that bury navigation. Check scan path, contact/action clarity, real copy length and mobile storytelling.

## Product UI / dashboard / admin

Goal: support frequent tasks, scanning, comparison, error recovery. Prioritize information hierarchy, dense data legibility, consistent navigation, functional interactions and state clarity over decorative hero experiences. Choose tables, charts and cards by the information relationship, not trends. Verify empty/loading/error states and long labels. For data visualization, distinguish category/date/quantity, zero baselines where appropriate, units, legends and keyboard/data alternatives.

## Commerce and conversion

Goal: compare offerings, understand trust/total cost, complete a transaction without surprise. Check product imagery, specifications, options, prices, availability (never invent), form validation, shipping/fees disclosure, cart/checkout recovery, accessible controls and clear next action. Don't optimize only for clicks at the expense of truthful user expectations.

## Game-like / creative interactive UI

Goal: let the product borrow **interaction grammar and narrative craft** from games when appropriate: selection, status, feedback, transitions, visual layering, world-specific accents. Distinguish inspiration from copying a game HUD or IP. Keep legibility, keyboard/touch support, fast access and realistic component boundaries. A user's interest in game-inspired art does not mean every screen should have dense panels or sci-fi neon. Use motion intentionally, with reduced-motion strategy.

## Mobile/native

Goal: platform-appropriate navigation, gestures, safe areas, typography, semantic colors, sheets/modals, back behavior and performance. Prefer platform HIG/Material native patterns instead of web layout transported onto phone. When Expo/React Native and a suitable tool are present, inspect simulator whole flows, including animations. Appllama may supply production mobile screen references via its own MCP, but don't rely on access or require dozens of screenshots for every small change.

## Exact reproduction / design-to-code

Goal: fidelity to supplied pixels and specified behavior. Use same viewport, accurate content/assets, image cropping and typography as source. Document differences that are impossible because assets/fonts/rights are missing. Do not inject WhipUI visual style or "improve" the reference unless explicitly asked. Existing design-system extension follows the same preserve-first principle.
