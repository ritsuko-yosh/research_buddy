import type { Messages } from '../i18n/strings';

export type Page = 'home' | 'search' | 'about';

interface NavBarProps {
  m: Messages;
  current: Page;
  onNavigate: (page: Page) => void;
}

const ORDER: readonly Page[] = ['home', 'search', 'about'];

/** Primary site navigation: Home / Search / About. */
export function NavBar({ m, current, onNavigate }: NavBarProps) {
  const label: Record<Page, string> = {
    home: m.navHome,
    search: m.navSearch,
    about: m.navAbout,
  };
  return (
    <nav className="site-nav no-print" aria-label={m.navLabel}>
      <ul>
        {ORDER.map((page) => (
          <li key={page}>
            <a
              href={`#/${page}`}
              className={current === page ? 'nav-link active' : 'nav-link'}
              aria-current={current === page ? 'page' : undefined}
              onClick={(e) => {
                // Let the hash change (for deep links/back button), but also
                // drive state directly so navigation is instant.
                e.preventDefault();
                onNavigate(page);
              }}
            >
              {label[page]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
