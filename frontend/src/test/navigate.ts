import { screen } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { messages } from '../i18n/strings';

type User = ReturnType<typeof userEvent.setup>;

/**
 * Opens the search dialog the way a patient does: the header Search button,
 * then the By Study ID tab when requested. Does nothing if the dialog is already open.
 */
export async function openSearch(user: User, tab: 'condition' | 'nct' = 'condition') {
  const en = messages.en;
  if (!document.querySelector('[role="dialog"]')) {
    await user.click(screen.getByRole('button', { name: en.navSearch  }));
  }
  if (tab === 'nct') {
    await user.click(screen.getByRole('tab', { name: en.tabNct }));
  }
}
