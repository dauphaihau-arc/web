# Web Agent Notes

Follow the focused rules in [`agents/`](./agents/).

Current rules:
- [`vue-props-reactivity.md`](./agents/vue-props-reactivity.md): avoid destructuring Vue props in component setup when the values must stay reactive.
- [`clean-vue-components.md`](./agents/clean-vue-components.md): keep Vue components focused on rendering and user actions; move option catalogs, normalization logic, and reusable state handling into nearby modules or composables.
