import '@testing-library/jest-dom/vitest';

// Polyfills / stubs utiles
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {}, // legacy
    removeListener: () => {}, // legacy
    dispatchEvent: () => false,
  }),
});


