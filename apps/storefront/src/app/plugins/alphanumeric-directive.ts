import { registerAlphanumericDirective } from '@arc/ui/directives/input-directives';

export default defineNuxtPlugin((nuxtApp) => {
  registerAlphanumericDirective(nuxtApp.vueApp);
});
