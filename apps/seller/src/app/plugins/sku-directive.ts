import { registerSkuDirective } from '@arc/ui/directives/input-directives';

export default defineNuxtPlugin((nuxtApp) => {
  registerSkuDirective(nuxtApp.vueApp);
});
