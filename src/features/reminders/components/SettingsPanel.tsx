import { Minus, Plus, X } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';
import type { ReminderLocale, ReminderTranslator } from '../reminder.i18n';

type SettingsPanelProps = {
  locale: ReminderLocale;
  zoom: number;
  t: ReminderTranslator;
  onLocaleChange: (locale: ReminderLocale) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onClose: () => void;
};

export function SettingsPanel({
  locale,
  zoom,
  t,
  onLocaleChange,
  onZoomIn,
  onZoomOut,
  onZoomReset,
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
        <div className="settings-field">
          <span>{t('settings.zoom')}</span>
          <div className="zoom-control">
            <button type="button" aria-label={t('settings.zoomOut')} onClick={onZoomOut}>
              <Minus size={14} weight="bold" />
            </button>
            <button
              type="button"
              className="zoom-reset"
              aria-label={t('settings.zoomReset')}
              onClick={onZoomReset}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button type="button" aria-label={t('settings.zoomIn')} onClick={onZoomIn}>
              <Plus size={14} weight="bold" />
            </button>
          </div>
        </div>
        <p className="settings-hint">{t('settings.zoomHint')}</p>
      </section>
    </div>
  );
}
