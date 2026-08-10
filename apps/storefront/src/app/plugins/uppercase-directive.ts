import { registerUppercaseDirective } from '@arc/ui/directives/input-directives';

export default defineNuxtPlugin((nuxtApp) => {
  registerUppercaseDirective(nuxtApp.vueApp);
});
