import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// index.html supplies the real title in the browser. jsdom does not load it,
// so mirror it here for the document-title accessibility rule.
document.title = 'Visit Ready';

afterEach(() => {
  cleanup();
  document.documentElement.lang = 'en';
});
