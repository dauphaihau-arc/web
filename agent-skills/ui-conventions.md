# Web UI Conventions

Use this file when changing visible UI, user flows, or reusable components.

## Default Bias

- Match the existing Nuxt UI, Tailwind, and component patterns in the touched app.
- Keep operational screens dense, scannable, and predictable.
- Prefer local page components for page-specific UI before introducing shared abstractions.
- Use shared UI only when reuse is real and the API is stable.

## Interaction Rules

- Use existing form, table, dialog, toast, loading, and empty-state patterns in the app.
- Keep mutation feedback explicit: loading, success, and failure states should be visible when the action is user-facing.
- Do not add explanatory in-app text about implementation details or shortcuts.
- Keep labels and actions aligned with existing route and domain vocabulary.

## Responsive Rules

- Check mobile and desktop layout for changed pages or components.
- Ensure button text and table content do not overflow their containers.
- Prefer stable dimensions for repeated controls, table actions, and compact toolbar elements.

## Icons

Use the icon system already present in the app. Prefer existing icon names and
button patterns over adding custom SVGs.
