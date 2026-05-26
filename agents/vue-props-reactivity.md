# Vue Props Reactivity

Rule: do not destructure `defineProps()` into local variables when those props are used in computed state, watchers, or rendering paths that must react to parent updates.

Bad:

```ts
const { orderShop } = defineProps<{
  orderShop: OrderShop
}>()
```

This can cause stale values in derived state and UI because the destructured binding may stop tracking the latest prop updates in the way the component expects.

Use this instead:

```ts
const props = defineProps<{
  orderShop: OrderShop
}>()
```

Then always read through `props`:

```ts
const shippingStatus = computed(() => props.orderShop.shipping.shipping_status)
```

If you need individually reactive refs from props, use `toRefs(props)` explicitly and only when necessary.

Reason:
- prevents losing reactivity in nested UI state
- keeps computed values and watchers aligned with the latest parent prop object
- avoids bugs where debug data shows the prop changed but child UI still renders stale values
