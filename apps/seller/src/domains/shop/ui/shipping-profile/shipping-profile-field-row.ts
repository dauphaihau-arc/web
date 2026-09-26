/**
 * Old-style field rows: label and description on the left, control on the
 * right. The left column is fixed per row so every control in a form starts at
 * the same x offset.
 */
export function fieldRowUi(containerClass: string) {
  return {
    inner: 'w-56 shrink-0',
    description: 'text-xs',
    container: containerClass,
  };
}
