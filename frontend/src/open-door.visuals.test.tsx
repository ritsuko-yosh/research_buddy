import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { openSearch } from './test/navigate';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { ExplainerArt } from './components/art/ExplainerArt';
import { VerificationIcon } from './components/art/VerificationIcon';
import { createFixtureDataSource } from './data/fixtures/fixtureDataSource';
import { messages } from './i18n/strings';
import { MIN_LOADER_MS, PAUSE_STORAGE_KEY, readAnimationPaused, waitForMinimumLoader, writeAnimationPaused } from './lib/motion';
import { RIPPLE_MS, spawnRipple } from './lib/ripple';
import { TEST_TOPIC_INDEX } from './test/topicIndex.fixture';
import type { VerificationCategory } from './types/trial';

const en = messages.en;
const es = messages.es;
const fixtureSource = createFixtureDataSource();

/** Lets a test decide exactly when the real search request finishes. */
function gate<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function stubReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: matches && query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('search loading feedback', () => {
  it('shows the loader in the dialog, disables the button, and moves to the results view when results arrive', async () => {
    const user = userEvent.setup();
    const pending = gate<Awaited<ReturnType<typeof fixtureSource.searchByCondition>>>();
    const source = { getTrial: fixtureSource.getTrial, searchByCondition: () => pending.promise };
    render(<App dataSource={source} topicIndex={TEST_TOPIC_INDEX} />);

    await openSearch(user);
    await user.type(screen.getByLabelText(en.conditionInputLabel), 'asthma');
    await user.click(screen.getByRole('button', { name: en.conditionSearch }));

    const busy = screen.getByRole('button', { name: en.conditionSearching });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText(en.searchingFor('asthma'))).toBeInTheDocument();
    expect(document.querySelector('.od-loader [role="status"]')).toHaveTextContent(en.resultsLoading);
    // Focus stays inside the dialog while the button is disabled, so keyboard users are not dropped.
    expect(document.querySelector('[role="dialog"]')).toContainElement(document.activeElement as HTMLElement);

    await act(async () => {
      pending.resolve(await fixtureSource.searchByCondition('asthma'));
    });

    // The dialog closes, and the app moves to the results view with focus on its title.
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    expect(screen.getByRole('button', { name: en.reviseSearch })).toBeInTheDocument();
    expect(document.getElementById('search-title')).toHaveFocus();
    expect(screen.getByText(en.resultsFound(document.querySelectorAll('.study-card').length))).toBeInTheDocument();
  });

  it('closes the dialog with Escape and returns focus to the Search button that opened it', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);

    const opener = screen.getByRole('button', { name: en.navSearch });
    await openSearch(user);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    await user.keyboard('{Escape}');

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(opener).toHaveFocus();
  });

  it('shows the error with retry, and returns to the results view', async () => {
    const user = userEvent.setup();
    const failing = gate<never>();
    const source = { getTrial: fixtureSource.getTrial, searchByCondition: () => failing.promise };
    render(<App dataSource={source} topicIndex={TEST_TOPIC_INDEX} />);

    await openSearch(user);
    await user.type(screen.getByLabelText(en.conditionInputLabel), 'asthma');
    await user.click(screen.getByRole('button', { name: en.conditionSearch }));
    await act(async () => {
      failing.reject(new Error('network'));
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(en.resultsError);
    expect(screen.getByRole('button', { name: en.retry })).toBeInTheDocument();
  });

  it('keeps the loader on screen for at least the minimum time, even when the response is instant', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);

    const startedAt = Date.now();
    await openSearch(user);
    await user.click(screen.getByRole('button', { name: 'Asthma' }));

    expect(screen.getByText(en.searchingFor('asthma'))).toBeInTheDocument();
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(MIN_LOADER_MS - 20);
  });

  it('ignores a slow earlier response when a newer garden search starts', async () => {
    const user = userEvent.setup();
    // The garden's condition chips are the only way to start a second search while one is still loading.
    const topic = TEST_TOPIC_INDEX.topics.find((t) => t.topConditions.length >= 2);
    if (!topic) {
      throw new Error('fixture needs a topic with two conditions');
    }
    const cap = (term: string) => term.charAt(0).toUpperCase() + term.slice(1);
    const [slowTerm, fastTerm] = topic.topConditions.map((c) => c.term);
    const slow = gate<Awaited<ReturnType<typeof fixtureSource.searchByCondition>>>();
    const source = {
      getTrial: fixtureSource.getTrial,
      searchByCondition: (term: string) => (term === slowTerm ? slow.promise : fixtureSource.searchByCondition(term)),
    };
    render(<App dataSource={source} topicIndex={TEST_TOPIC_INDEX} />);

    await user.click(document.getElementById(`topic-${topic.id}`) as HTMLElement);
    await user.click(screen.getByRole('button', { name: cap(slowTerm) }));
    expect(screen.getByText(en.searchingFor(slowTerm))).toBeInTheDocument();

    // Return to the garden through the header and start the newer search.
    await user.click(screen.getByRole('button', { name: en.navExplore }));
    await user.click(document.getElementById(`topic-${topic.id}`) as HTMLElement);
    await user.click(screen.getByRole('button', { name: cap(fastTerm) }));

    const expected = await fixtureSource.searchByCondition(fastTerm);
    await waitFor(() => expect(document.querySelectorAll('.study-card')).toHaveLength(expected.length));
    await act(async () => {
      slow.resolve(await fixtureSource.searchByCondition(slowTerm));
    });
    // The late response must not replace the newer results.
    expect(document.querySelectorAll('.study-card')).toHaveLength(expected.length);
    expect(screen.getByRole('heading', { level: 1, name: en.resultsForTerm(fastTerm) })).toBeInTheDocument();
  });
});

describe('Pause Animation', () => {
  it('toggles the page class and the saved choice, and reports the state with aria-pressed', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);

    const pause = screen.getByRole('button', { name: en.pauseAnimation });
    expect(pause).toHaveAttribute('aria-pressed', 'false');

    await user.click(pause);
    const play = screen.getByRole('button', { name: en.playAnimation });
    expect(play).toHaveAttribute('aria-pressed', 'true');
    expect(document.getElementById('main')).toHaveClass('anim-paused');
    expect(window.localStorage.getItem(PAUSE_STORAGE_KEY)).toBe('1');

    await user.click(play);
    expect(screen.getByRole('button', { name: en.pauseAnimation })).toHaveAttribute('aria-pressed', 'false');
    expect(document.getElementById('main')).not.toHaveClass('anim-paused');
  });

  it('remembers the choice on the next visit', () => {
    window.localStorage.setItem(PAUSE_STORAGE_KEY, '1');
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);
    expect(screen.getByRole('button', { name: en.playAnimation })).toHaveAttribute('aria-pressed', 'true');
  });

  it('still works when localStorage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readAnimationPaused()).toBe(false);
    expect(() => writeAnimationPaused(true)).not.toThrow();
  });
});

describe('minimum loader time', () => {
  it('waits the remainder of MIN_LOADER_MS and returns at once when it has already passed', async () => {
    vi.useFakeTimers();
    const startedAt = Date.now();
    let done = false;
    const wait = waitForMinimumLoader(startedAt).then(() => {
      done = true;
    });
    vi.advanceTimersByTime(MIN_LOADER_MS - 1);
    await Promise.resolve();
    expect(done).toBe(false);
    vi.advanceTimersByTime(1);
    await wait;
    expect(done).toBe(true);

    await expect(waitForMinimumLoader(Date.now() - MIN_LOADER_MS * 2)).resolves.toBeUndefined();
  });
});

describe('garden selection', () => {
  it('opens a topic, shows its details, and closes with Escape', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);

    const topic = TEST_TOPIC_INDEX.topics[0];
    const button = document.getElementById(`topic-${topic.id}`) as HTMLButtonElement;
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(document.getElementById('od-topic-details')).toBeInTheDocument();
    expect(document.querySelector('.od-garden')).toHaveClass('has-selection');

    await user.keyboard('{Escape}');
    expect(document.getElementById('od-topic-details')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('marks the related topics so their neighbors can make room', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);

    const topic = TEST_TOPIC_INDEX.topics.find((t) => t.sharedWith.length > 0);
    if (!topic) {
      throw new Error('fixture needs a topic with related topics');
    }
    await user.click(document.getElementById(`topic-${topic.id}`) as HTMLButtonElement);

    for (const relation of topic.sharedWith) {
      expect(document.getElementById(`topic-${relation.topicId}`)).toHaveClass('is-related');
    }
  });
});

describe('ripple on select', () => {
  it('adds a decorative ripple that removes itself after the ripple duration', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const container = document.createElement('div');
    document.body.appendChild(container);

    spawnRipple(container, 10, 20, 'rgb(1, 2, 3)');
    const ripple = container.querySelector<HTMLElement>('.od-ripple');
    expect(ripple).not.toBeNull();
    expect(ripple).toHaveAttribute('aria-hidden', 'true');
    expect(ripple?.style.background).toBe('rgb(1, 2, 3)');

    vi.advanceTimersByTime(RIPPLE_MS);
    expect(container.querySelector('.od-ripple')).toBeNull();
    container.remove();
  });

  it('adds nothing under reduced motion', () => {
    stubReducedMotion(true);
    const container = document.createElement('div');
    spawnRipple(container, 0, 0, 'red');
    expect(container.children).toHaveLength(0);
  });
});

describe('artwork', () => {
  it.each([1, 2, 3] as const)('explainer picture %i is decorative', (index) => {
    const { container } = render(<ExplainerArt index={index} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.querySelector('[filter]')).not.toBeNull();
  });

  it.each(['self_answer', 'check_records', 'ask_study_team', 'cannot_assess'] as VerificationCategory[])(
    'Verification Map icon for %s is decorative and draws its own symbol',
    (category) => {
      const { container } = render(<VerificationIcon category={category} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg?.querySelectorAll('path').length).toBeGreaterThanOrEqual(2);
    },
  );

  it('shows the icons in the Verification Map group headings', async () => {
    const user = userEvent.setup();
    render(<App dataSource={fixtureSource} topicIndex={TEST_TOPIC_INDEX} />);
    await openSearch(user);
    await user.click(screen.getByRole('button', { name: 'Asthma' }));
    await screen.findByRole('heading', { name: en.resultsHeading });
    const study = await screen.findByRole('button', { name: new RegExp(en.viewStudy) });
    await user.click(study);
    await screen.findByRole('heading', { name: en.mapHeading });
    const headings = document.querySelectorAll('.map-group > h3 > svg.vm-icon');
    expect(headings.length).toBeGreaterThan(0);
    headings.forEach((svg) => expect(svg).toHaveAttribute('aria-hidden', 'true'));
  });
});

describe('English and Spanish strings for the new visuals', () => {
  it('provides every new string in both languages, and Spanish differs from English', () => {
    expect(es.conditionSearching).not.toBe(en.conditionSearching);
    expect(es.pauseAnimation).not.toBe(en.pauseAnimation);
    expect(es.playAnimation).not.toBe(en.playAnimation);
    expect(es.searchingFor('asthma')).toContain('asthma');
    expect(en.searchingFor('asthma')).toContain('asthma');
  });

  it('pluralizes the result count in both languages', () => {
    expect(en.resultsFound(1)).toBe('1 study found.');
    expect(en.resultsFound(3)).toBe('3 studies found.');
    expect(es.resultsFound(1)).toBe('Se encontró 1 estudio.');
    expect(es.resultsFound(3)).toBe('Se encontraron 3 estudios.');
  });
});
