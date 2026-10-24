import { LANGUAGE_NAMES, type Locale } from '../i18n/strings';

interface LanguageToggleProps {
  locale: Locale;
  label: string;
  onChange: (locale: Locale) => void;
}

const OPTIONS: readonly Locale[] = ['en', 'es'];

export function LanguageToggle({ locale, label, onChange }: LanguageToggleProps) {
  return (
    <div role="group" aria-label={label} className="chip-row">
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          className="chip"
          lang={option}
          aria-pressed={locale === option}
          onClick={() => onChange(option)}
        >
          {LANGUAGE_NAMES[option]}
        </button>
      ))}
    </div>
  );
}
