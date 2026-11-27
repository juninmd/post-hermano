import '@testing-library/jest-dom/vitest';

// jsdom 30 expõe HTMLDialogElement, mas ainda não implementa showModal/close.
// O Dialog e o CommandPalette do Sonido usam o <dialog> nativo; este polyfill
// mantém o comportamento (atributo open) fiel ao navegador nos testes.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
}
