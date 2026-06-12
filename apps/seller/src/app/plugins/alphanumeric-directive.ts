export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('alphanumeric', {
    created(el: HTMLElement) {
      el.addEventListener('keydown', (e: KeyboardEvent) => {
        if (
          ['Delete', 'Backspace', 'Tab', 'Esc', 'Enter'].includes(e.key) ||

          // allow select all text
          (e.ctrlKey && e.key === 'a') ||
          (e.metaKey && e.key === 'a') ||

          // allow copy
          (e.ctrlKey && e.key === 'c') ||
          (e.metaKey && e.key === 'c') ||

          // allow cut selected text
          (e.ctrlKey && e.key === 'x') ||
          (e.metaKey && e.key === 'x') ||

          // Allow: home, end, left, right
          (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key))
        ) {
          // let it happen, don't do anything
          return;
        }
        if (
          (e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && // 48 - 57 ( 0 - 9 )
          (e.keyCode < 96 || e.keyCode > 105) && // 97 - 105 ( Num Lock 0 - 9 )
          (e.keyCode < 65 || e.keyCode > 90) // 65 - 90 ( a-z )
        ) {
          e.preventDefault();
        }
      });
    },
  });
});
