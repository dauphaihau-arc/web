export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('numeric', {
    created(el: HTMLElement) {
      el.addEventListener('keydown', (event: KeyboardEvent) => {
        if (
          ['Delete', 'Backspace', 'Tab', 'Esc', 'Enter', '.'].includes(event.key)

          // allow select all text
          || (event.ctrlKey && event.key === 'a')
          || (event.metaKey && event.key === 'a')

          // allow copy
          || (event.ctrlKey && event.key === 'c')
          || (event.metaKey && event.key === 'c')

          // allow cut selected text
          || (event.ctrlKey && event.key === 'x')
          || (event.metaKey && event.key === 'x')

          // Allow: home, end, left, right
          || (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key))
        ) {
          // let it happen, don't do anything
          return;
        }
        // Ensure that it is a number and stop the keypress
        // 97 - 105 ( Num Lock 0 - 9 )
        // 48 - 57 ( 0 - 9 )
        if (
          (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) // 48 - 57 ( 0 - 9 )
          && (event.keyCode < 96 || event.keyCode > 105) // 97 - 105 ( Num Lock 0 - 9 )
        ) {
          event.preventDefault();
        }
      });
    },
  });
});
