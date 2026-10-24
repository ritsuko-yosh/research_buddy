import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import App from '../../App';
import { createFixtureDataSource } from '../../data/fixtures/fixtureDataSource';
import { messages } from '../../i18n/strings';
import { TEST_TOPIC_INDEX } from '../../test/topicIndex.fixture';

const en = messages.en;
const fixtureSource = createFixtureDataSource();

function renderHome(index = TEST_TOPIC_INDEX) {
  return render(<App dataSource={fixtureSource} topicIndex={index} />);
}

describe('home hero doors (now on the Home page, route to Search)', () => {
  function renderOnHome(index = TEST_TOPIC_INDEX) {
    window.location.hash = '#/home';
    return render(<App dataSource={fixtureSource} topicIndex={index} />);
  }

  it('the condition door routes to Search and focuses the condition input', async () => {
    const user = userEvent.setup();
    renderOnHome();

    await user.click(screen.getByRole('button', { name: new RegExp(en.doorConditionTitle) }));

    expect(document.getElementById('condition-input')).toBeInTheDocument();
    expect(document.activeElement).toBe(document.getElementById('condition-input'));
  });

  it('the study ID door routes to Search and focuses the NCT input', async () => {
    const user = userEvent.setup();
    renderOnHome();

    await user.click(screen.getByRole('button', { name: new RegExp(en.doorNctTitle) }));

    expect(document.getElementById('nct-input')).toBeInTheDocument();
    expect(document.activeElement).toBe(document.getElementById('nct-input'));
  });

  it('the "explore research" door routes to Search (browse garden)', async () => {
    const user = userEvent.setup();
    renderOnHome();

    await user.click(screen.getByRole('button', { name: new RegExp(en.doorExploreTitle) }));

    // Landed on Search: the browse garden heading is present.
    expect(document.getElementById('garden-heading')).toBeInTheDocument();
  });
});

describe('topic garden', () => {
  it('opens details inline, Escape closes them, and focus returns to the topic', async () => {
    const user = userEvent.setup();
    renderHome();

    const topic = screen.getByRole('button', { name: /Metabolic health/ });
    await user.click(topic);

    expect(topic).toHaveAttribute('aria-pressed', 'true');
    expect(topic).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('od-topic-details')).toBeInTheDocument();
    expect(within(document.getElementById('od-topic-details') as HTMLElement).getByText(/Nutritional and Metabolic Diseases/)).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(document.getElementById('od-topic-details')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(document.getElementById('topic-metabolic_diseases'));
  });

  it('shows the study count and the update date from the index', () => {
    renderHome();

    expect(screen.getByText(en.topicStudies(5))).toBeInTheDocument();
    expect(screen.getByText(/Counts from ClinicalTrials\.gov, updated/)).toBeInTheDocument();
  });

  it('says that a study can appear in more than one area', () => {
    renderHome();

    expect(screen.getByText(en.gardenMultiNote)).toBeInTheDocument();
  });

  it('switches to the related topic from "Shares conditions with"', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: /Metabolic health/ }));
    const details = document.getElementById('od-topic-details') as HTMLElement;
    await user.click(within(details).getByRole('button', { name: /Cancers/ }));

    expect(document.getElementById('topic-neoplasms')).toHaveAttribute('aria-pressed', 'true');
    expect(document.getElementById('topic-metabolic_diseases')).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('homepage without a topic index', () => {
  it('shows the unavailable message and keeps search working', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={null} />);

    expect(screen.getByText(en.topicsUnavailable)).toBeInTheDocument();

    await user.type(screen.getByLabelText(en.conditionInputLabel), 'asthma');
    await user.click(screen.getByRole('button', { name: en.conditionSearch }));

    expect(await screen.findByRole('heading', { name: en.resultsHeading })).toBeInTheDocument();
  });
});

describe('i18n parity', () => {
  it('every English string key exists in Spanish', () => {
    const missing = Object.keys(messages.en).filter((key) => !(key in messages.es));
    expect(missing).toEqual([]);
  });
});

describe('accessibility', () => {
  it('homepage has no axe violations (contrast is verified by token calculation)', async () => {
    renderHome();

    const results = await axe.run(document, { rules: { 'color-contrast': { enabled: false } } });

    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});

describe('motion rules (styles.css)', () => {
  it('every transition and animation declaration sits inside the no-preference media query', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
    const reducedMotionHeader = '(prefers-reduced-motion: no-preference)';
    const violations: string[] = [];

    // Line-based check: find each declaration and confirm an enclosing block mentions the query.
    const lines = css.split('\n');
    const blockStack: string[] = [];
    lines.forEach((line, index) => {
      const opens = (line.match(/\{/g) ?? []).length;
      const closes = (line.match(/\}/g) ?? []).length;
      // Declarations that switch motion off (value "none") are allowed anywhere.
      if (/^\s*(transition|animation)\s*:/.test(line) && !/:\s*none\s*;/.test(line)) {
        const enclosed = blockStack.some((header) => header.includes(reducedMotionHeader));
        if (!enclosed) {
          violations.push(`line ${index + 1}: ${line.trim()}`);
        }
      }
      for (let k = 0; k < opens; k++) {
        blockStack.push(line.includes('{') ? line.slice(0, line.indexOf('{')) : line);
      }
      for (let k = 0; k < closes; k++) {
        blockStack.pop();
      }
    });

    expect(violations).toEqual([]);
  });
});

describe('search error is never shown before submit', () => {
  it('shows no invalid state on first render of the search page', () => {
    renderHome();

    expect(screen.queryByText(en.conditionInvalid)).not.toBeInTheDocument();
    expect(document.getElementById('condition-input')).toHaveAttribute('aria-invalid', 'false');
  });
});

