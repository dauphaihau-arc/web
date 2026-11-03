# Web UI Conventions

Use this file when changing visible UI, user flows, or reusable components.

## Default Bias

- Match the existing Nuxt UI, Tailwind, and component patterns in the touched app.
- Keep operational screens dense, scannable, and predictable.
- Prefer local page components for page-specific UI before introducing shared abstractions.
- Use shared UI only when reuse is real and the API is stable.

## Color

- One gray ramp is canonical: Tailwind `zinc`.
- Reach grays only through semantic tokens: `bg-surface-*`, `border-border-*`, `text-text-*`, and the `state-*` tokens.
- Raw palette classes (`gray-*`, `zinc-*`, `slate-*`, `neutral-*`, `stone-*`) are forbidden in light mode.
- The only sanctioned raw usage is a `dark:` variant, because there is no dark-mode token layer.
- `packages/ui/src/foundation/design-tokens.ts` is the single source of truth. `design-tokens.css` is generated from it: run `pnpm --filter @arc/ui generate:tokens`. Never hand-edit the CSS.
- Do not add new gray ramps or one-off hex values. `customGray` is retired.

## Interaction Rules

- Use existing form, table, dialog, toast, loading, and empty-state patterns in the app.
- Keep mutation feedback explicit: loading, success, and failure states should be visible when the action is user-facing.
- Reserve `:loading` for user-initiated actions (submit, withdraw, save, refresh). An initial data fetch must not render as a loading button: render the block's skeleton, or keep the control `disabled` until every input that decides its enabled state is resolved.
- When a form submit is in flight, lock the whole form, not just the submit button: inputs disabled (or read-only) and secondary actions disabled too. Links cannot take `disabled`; mark them `aria-disabled="true"`, add `tabindex="-1"`, and use the `aria-disabled:` variants for `pointer-events-none` and `opacity-50`.
- When a control is disabled because its inputs failed to load, explain it in the existing hint/tooltip pattern instead of leaving a silent dead control.
- Do not add explanatory in-app text about implementation details or shortcuts.
- Keep labels and actions aligned with existing route and domain vocabulary.

## Responsive Rules

- Check mobile and desktop layout for changed pages or components.
- Ensure button text and table content do not overflow their containers.
- Prefer stable dimensions for repeated controls, table actions, and compact toolbar elements.

## Icons

Use the icon system already present in the app. Prefer existing icon names and
button patterns over adding custom SVGs.
