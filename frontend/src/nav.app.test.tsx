import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { createFixtureDataSource } from './data/fixtures/fixtureDataSource';
import { messages } from './i18n/strings';

const en = messages.en;

function renderApp() {
  // Inject the fixture data source; topicIndex null is fine for nav tests.
  return render(<App dataSource={createFixtureDataSource()} topicIndex={null} />);
}

describe('Primary navigation: Home / Search / About', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('shows the three navigation tabs', () => {
    renderApp();
    const nav = screen.getByRole('navigation', { name: en.navLabel });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.navHome })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.navSearch })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.navAbout })).toBeInTheDocument();
  });

  it('defaults to the Search page (preserves prior behavior)', () => {
    renderApp();
    // About and Home page headings are NOT shown on the default (search) load.
    expect(screen.queryByRole('heading', { name: en.aboutPageHeading })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: en.homeHeading })).not.toBeInTheDocument();
  });

  it('navigates to the About page and shows the safety boundaries', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('link', { name: en.navAbout }));
    expect(screen.getByRole('heading', { name: en.aboutPageHeading })).toBeInTheDocument();
    expect(screen.getByText(en.aboutNotHeading)).toBeInTheDocument();
    // "What it does NOT do" must state no eligibility decision.
    expect(screen.getByText(en.aboutNot1)).toBeInTheDocument();
  });

  it('navigates to the Home landing page and can start a search from it', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('link', { name: en.navHome }));
    expect(screen.getByRole('heading', { name: en.homeHeading })).toBeInTheDocument();
    // The CTA returns to the search experience.
    await user.click(screen.getByRole('button', { name: en.homeCta }));
    expect(screen.queryByText(en.homeHeading)).not.toBeInTheDocument();
  });

  it('honors a deep-link hash (#/about) on load', () => {
    window.location.hash = '#/about';
    renderApp();
    expect(screen.getByRole('heading', { name: en.aboutPageHeading })).toBeInTheDocument();
  });
});
