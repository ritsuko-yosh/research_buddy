import type { Locale, Messages } from '../i18n/strings';
import { LanguageToggle } from './LanguageToggle';

interface SiteHeaderProps {
  m: Messages;
  locale: Locale;
  onLocale: (locale: Locale) => void;
  /** Goes to the homepage. An optional anchor scrolls to a homepage section (explore, how). */
  onHome: (anchor?: 'explore' | 'how') => void;
  /** Opens the search dialog on the By Condition tab. */
  onSearch: () => void;
  /** True while the search dialog is open. The page behind it is hidden from assistive technology. */
  hidden: boolean;
}

/**
 * Site header, following the approved Open Door reference: the Visit Ready
 * badge and wordmark, the three navigation actions, and the language toggle.
 * The badge is the approved light asset, used unchanged.
 */
export function SiteHeader({ m, locale, onLocale, onHome, onSearch, hidden }: SiteHeaderProps) {
  return (
    <header className="site-header no-print" aria-hidden={hidden ? true : undefined}>
      <button type="button" className="brand" onClick={() => onHome()} aria-label={m.appName}>
        <img src={`${import.meta.env.BASE_URL}brand/visit-ready-badge-light.svg`} alt="" width={46} height={46} />
        <span className="wm">
          {m.appName}
          <small>{m.brandSubtitle}</small>
        </span>
      </button>

      <nav className="site-nav" aria-label={m.navLabel}>
        <button type="button" className="link" onClick={() => onHome('explore')}>
          {m.navExplore}
        </button>
        <button type="button" className="link" onClick={() => onHome('how')}>
          {m.navHow}
        </button>
        <button type="button" className="searchbtn" onClick={onSearch} aria-haspopup="dialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span>{m.navSearch}</span>
        </button>
      </nav>

      <LanguageToggle locale={locale} label={m.languageLabel} onChange={onLocale} />
    </header>
  );
}
