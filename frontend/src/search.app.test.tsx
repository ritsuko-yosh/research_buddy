import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { TEST_TOPIC_INDEX } from './test/topicIndex.fixture';
import { createFixtureDataSource } from './data/fixtures/fixtureDataSource';
import { messages } from './i18n/strings';

const en = messages.en;
const fixtureSource = createFixtureDataSource();

describe('condition search (free text and presets)', () => {
  it('rejects an invalid term without contacting the data source', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);

    await user.type(screen.getByLabelText(en.conditionInputLabel), 'x');
    await user.click(screen.getByRole('button', { name: en.conditionSearch }));

    expect(screen.getByText(en.conditionInvalid)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: en.resultsHeading })).not.toBeInTheDocument();
  });

  it('accepts a term the user types, even when it is not a preset, and reports no matches honestly', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);

    await user.type(screen.getByLabelText(en.conditionInputLabel), 'ulcerative colitis');
    await user.click(screen.getByRole('button', { name: en.conditionSearch }));

    expect(await screen.findByText(en.resultsEmpty)).toBeInTheDocument();
  });

  it('searches the preset term when a preset is chosen', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);

    await user.click(screen.getByRole('button', { name: 'Asthma' }));

    expect(await screen.findByRole('heading', { name: en.resultsHeading })).toBeInTheDocument();
    expect(screen.getByLabelText(en.conditionInputLabel)).toHaveValue('asthma');
  });

  it('shows the live-results disclosure when results are returned', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);

    await user.click(screen.getByRole('button', { name: 'Type 2 diabetes' }));

    expect(await screen.findByText(en.resultsLiveNote)).toBeInTheDocument();
  });

  it('keeps the search term for retry after a network error', async () => {
    const user = userEvent.setup();
    let attempts = 0;
    const flaky = {
      getTrial: fixtureSource.getTrial,
      searchByCondition: async (term: string) => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error('network');
        }
        return fixtureSource.searchByCondition(term);
      },
    };
    render(<App dataSource={flaky} topicIndex={TEST_TOPIC_INDEX} />);

    await user.click(screen.getByRole('button', { name: 'Type 2 diabetes' }));
    await user.click(await screen.findByRole('button', { name: en.retry }));

    await waitFor(() => expect(attempts).toBe(2));
    expect(await screen.findByRole('button', { name: /View study: \[SAMPLE A\]/ })).toBeInTheDocument();
  });
});
