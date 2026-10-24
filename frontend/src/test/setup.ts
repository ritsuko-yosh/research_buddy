import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

// index.html supplies the real title in the browser. jsdom does not load it,
// so mirror it here for the document-title accessibility rule.
document.title = 'Visit Ready';

// Production defaults to the Home landing page (no hash). The existing suite
// exercises the search/study/prepare journey, so default tests to the Search
// page via the hash. Individual tests may override the hash themselves (and
// nav tests do) — their own beforeEach runs after this one.
beforeEach(() => {
  window.location.hash = '#/search';
});

afterEach(() => {
  cleanup();
  document.documentElement.lang = 'en';
  window.location.hash = '';
});
