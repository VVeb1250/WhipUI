# Support the player's next decision

Use for game HUDs, menus, onboarding, inventories, management screens and UI over
play. Read [Game UI Design](../library/game-ui/REFERENCE.md). For browser execution
also read [Game UI Frontend](../library/game-browser/skills/game-ui-frontend/REFERENCE.md)
through its SOURCE-MAP adapter. Native engines retain this decision layer and use
their own actual UI/input conventions.

## Ground the play context

Read the existing game, rules, state/controller owners, save contract, world/art
direction and current UI. Identify the player verbs, real-time versus paused work,
target input devices and the intended first/repeated session. Reuse known facts;
ask only consequential unknowns. Preserve game mechanics and authored content.
Classify the surface: active play, planning/comparison, menu/onboarding or a hybrid.

## Make information serve decisions

For the relevant journey, name what the player is deciding, what changes the
choice, where that information appears, and the action/consequence. Keep urgent
state and information needed for simultaneous comparison visible. Put occasional
explanations/detail behind an obvious recoverable entry point. A dense party,
inventory or finance comparison can be correct; a low HUD quota is not its goal.
Information hierarchy must follow the task, not the number of panels or words.

When the observed problem is structural, repair the grouping, sequence,
navigation, action placement or disclosure that caused it. Copy/color/spacing
alone cannot discharge that finding if the same decision obstacle remains. If
wording really is the cause, a copy change can be the complete correct fix.
Record what moved and show that needed information/actions remain accessible.
Use Intent journey/evaluate or one scoped critique/flow audit for the unanswered
question; do not run overlapping complete audits by default.

## Design and implement at the right scope

A new visual world follows design.md with Impeccable and owner feedback on a
representative playable/viewable slice. Existing approved world/assets follow
Garden preservation. Keep gameplay feedback, purposeful ornament and expressive
motion that serve this game; marketing anti-slop rules are not HUD policy.

For a browser game, separate scene, HUD, task workspace and modal/input ownership
using the existing architecture. Specify what happens to simulation speed,
camera/pointer input, focus and selection when a workspace/dialog opens and closes.
Preserve drafts/selections and restore the intended prior play state. Bind UI to
real state/actions, not a parallel fake simulation. Keep menu input from triggering
game hotkeys or camera controls; exercise nested overlays and return-to-play.

## Check the actual journey

Start from a clean test save in an isolated origin/context, then exercise the
requested first-session and consequential repeated actions. Compare the before
and after task: next-action clarity, decision-information access, interaction
steps, repeated-action effort, playfield obstruction and return to play. Fewer
clicks or less text alone is not improvement if comparison or agency is lost.
Inspect UI against moving gameplay at relevant viewports and important states,
including interruptions, errors and keyboard/touch behavior actually supported.
Keep simulation/save compatibility checks and original user data intact.

Report observed behavior separately from expert judgment and real-player tests.
A source checklist or attractive screenshot does not prove that players succeed.
Design-only stops at the requested flow/prototype; authorized implementation
continues through build.md and review.md without another invocation.
