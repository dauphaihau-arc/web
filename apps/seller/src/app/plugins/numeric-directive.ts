import { registerNumericDirective } from '@arc/ui/directives/input-directives';

export default defineNuxtPlugin((nuxtApp) => {
  registerNumericDirective(nuxtApp.vueApp);
});
