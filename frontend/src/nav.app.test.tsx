import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { createFixtureDataSource } from './data/fixtures/fixtureDataSource';
import { messages } from './i18n/strings';

const en = messages.en;

function renderApp() {
  // Inject the fixture data source; topicIndex null is fine for navigation tests.
  return render(<App dataSource={createFixtureDataSource()} topicIndex={null} />);
}

describe('Header navigation and About page', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('shows the approved header actions: Explore topics, How it works, and Search', () => {
    renderApp();
    const nav = screen.getByRole('navigation', { name: en.navLabel });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('button', { name: en.navExplore })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: en.navHow })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: en.navSearch })).toBeInTheDocument();
  });

  it('defaults to the Home page with the guided doors, not About', () => {
    renderApp();
    expect(screen.getByRole('heading', { name: new RegExp(en.heroEmphasis) })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(en.doorConditionTitle) })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: en.aboutPageHeading })).not.toBeInTheDocument();
  });

  it('the Search action opens the search dialog', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: en.navSearch }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('a condition door opens the dialog on the By Condition tab', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: new RegExp(en.doorConditionTitle) }));
    expect(screen.getByRole('tab', { name: en.tabCondition })).toHaveAttribute('aria-selected', 'true');
  });

  it('reaches the About page from the footer and shows the safety boundaries', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: en.navAbout }));
    expect(screen.getByRole('heading', { name: en.aboutPageHeading })).toBeInTheDocument();
    expect(screen.getByText(en.aboutNotHeading)).toBeInTheDocument();
    expect(screen.getByText(en.aboutNot1)).toBeInTheDocument();
  });

  it('honors a deep-link hash (#/about) on load', () => {
    window.location.hash = '#/about';
    renderApp();
    expect(screen.getByRole('heading', { name: en.aboutPageHeading })).toBeInTheDocument();
  });
});
