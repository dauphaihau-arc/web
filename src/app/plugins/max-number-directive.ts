/**
 * Max number
 *
 * example: <UInput v-max-number="11" />
 */
import type { DirectiveBinding } from 'vue';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('max-number', {
    updated(el: HTMLElement, binding: DirectiveBinding<number>) {
      const input = el.querySelector('input');
      const maxNumber = binding.value;
      const event = new Event('input', { bubbles: true });
      if (input && Number(input.value) > maxNumber) {
        input.value = maxNumber.toString();
        input.dispatchEvent(event);
      }
    },
  });
});
