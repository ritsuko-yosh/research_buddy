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

  it('defaults to the Home landing page (hero), not About', () => {
    // local beforeEach set hash to '' -> Home is the default landing.
    renderApp();
    // The hero headline + "where to start" doors are the Home content.
    expect(screen.getByRole('heading', { name: new RegExp(en.heroEmphasis) })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(en.doorConditionTitle) })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: en.aboutPageHeading })).not.toBeInTheDocument();
  });

  it('navigates from Home to Search via the nav', async () => {
    const user = userEvent.setup();
    renderApp();
    expect(screen.getByRole('button', { name: new RegExp(en.doorConditionTitle) })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: en.navSearch }));
    // Leaving Home: the hero doors are gone.
    expect(screen.queryByRole('button', { name: new RegExp(en.doorConditionTitle) })).not.toBeInTheDocument();
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

  it('a Home hero door starts the search experience', async () => {
    const user = userEvent.setup();
    renderApp(); // starts on Home (no hash)
    expect(screen.getByRole('button', { name: new RegExp(en.doorConditionTitle) })).toBeInTheDocument();
    // Clicking the condition door moves into the search experience.
    await user.click(screen.getByRole('button', { name: new RegExp(en.doorConditionTitle) }));
    expect(screen.getByRole('navigation', { name: en.navLabel })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: new RegExp(en.doorConditionTitle) })).not.toBeInTheDocument();
  });

  it('honors a deep-link hash (#/about) on load', () => {
    window.location.hash = '#/about';
    renderApp();
    expect(screen.getByRole('heading', { name: en.aboutPageHeading })).toBeInTheDocument();
  });
});
