import { X } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';
import type { ReminderLocale, ReminderTranslator } from '../reminder.i18n';

type SettingsPanelProps = {
  locale: ReminderLocale;
  t: ReminderTranslator;
  onLocaleChange: (locale: ReminderLocale) => void;
  onClose: () => void;
};

export function SettingsPanel({
  locale,
  t,
  onLocaleChange,
  onClose,
}: SettingsPanelProps): React.JSX.Element {
  const panelRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  return (
    <div className="settings-scrim" role="presentation" onMouseDown={onClose}>
      <section
        ref={panelRef}
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('settings.title')}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
          }
        }}
      >
        <header>
          <h2>{t('settings.title')}</h2>
          <button type="button" aria-label={t('settings.close')} onClick={onClose}>
            <X size={15} />
          </button>
        </header>
        <div className="settings-field">
          <span>{t('settings.language')}</span>
          <div className="segmented-control">
            <button
              type="button"
              className={locale === 'ko' ? 'is-active' : ''}
              onClick={() => onLocaleChange('ko')}
            >
              {t('settings.korean')}
            </button>
            <button
              type="button"
              className={locale === 'en' ? 'is-active' : ''}
              onClick={() => onLocaleChange('en')}
            >
              {t('settings.english')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
