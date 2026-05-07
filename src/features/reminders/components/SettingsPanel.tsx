import { X } from '@phosphor-icons/react';
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
  return (
    <div className="settings-scrim" role="presentation" onMouseDown={onClose}>
      <section
        className="settings-panel"
        aria-label={t('settings.title')}
        onMouseDown={(event) => event.stopPropagation()}
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
