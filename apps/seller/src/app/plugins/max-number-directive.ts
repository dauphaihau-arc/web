import { registerMaxNumberDirective } from '@arc/ui/directives/input-directives';

export default defineNuxtPlugin((nuxtApp) => {
  registerMaxNumberDirective(nuxtApp.vueApp);
});
