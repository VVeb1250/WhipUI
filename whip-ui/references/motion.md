# Motion craft: temporal behavior, not decoration

Load only when animation or interactive responsiveness materially contributes to feedback, orientation, meaning or brand identity. Honor platform preferences; a request for static or reduced motion supersedes an aesthetic suggestion.

## Define purpose before technique

Motion types:

- **Feedback:** confirms press, selection, success/error, or drag position.
- **Continuity/orientation:** shows where a view came from or where an object moved.
- **Attention:** highlights one important new item without hijacking navigation.
- **Identity/expressive:** a deliberately authored highlight that supports a product's world.

Avoid a cascade of independent slide-up reveals and continuous decorative oscillations; one purposeful authored sequence can be stronger. Frequent controls should not make users wait to finish animation.

## Temporal contract for each motion

```
Trigger → Start state → End state → Easing/physical behavior
→ Interrupt/retarget behavior → Input lock? (normally no)
→ Reduced-motion alternative → What verifies it?
```

For gesture-linked UI, visual feedback should track the finger/pointer; spring/momentum can preserve physical continuity when a framework supports it. Don't invent arbitrary timing tokens; derive consistent fast/medium/slow roles and test perception on target device. If motion conveys essential information, add non-motion feedback. Avoid animating large surfaces gratuitously, and check flicker/flash/vestibular issues.

## Implementation choice

CSS transitions for simple opacity/transform; framework motion library when sequence/gesture complexity justifies it; canvas/WebGL only if the experience benefits enough to offset performance and accessibility costs. Prefer transform/opacity where possible; avoid long layout reflows or JS-thread-blocked interactions. Respect `prefers-reduced-motion` on web and native system settings when relevant.

## Inspect real playback

Use actual recording/simulator if available. Review entry, halfway, interruption, reversal, exit, repeated activation and reduced-motion. A still screenshot and a code review **cannot** establish motion quality. If capture/playback is unavailable, mark it unverified instead of calling the result cinematic.

## Escalate taste questions

Motion intensity and character may be subjective. Autonomously choose reasonable feedback motion when intent is clear. Ask or use WhipDesign for a high-impact hero animation or identity-level choreography when unapproved, expensive to change, or at odds with user preference.
