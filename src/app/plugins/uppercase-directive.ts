/**
 * Uppercase
 *
 * example: <UInput v-uppercase />
 */

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('uppercase', {
    updated(el: HTMLElement) {
      const input = el.querySelector('input');
      const event = new Event('input', { bubbles: true });
      if (input && input.value) {
        input.value = input.value.toUpperCase();
        input.dispatchEvent(event);
      }
    },
  });
});
