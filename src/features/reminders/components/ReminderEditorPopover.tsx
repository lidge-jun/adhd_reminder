import { Bell, CalendarBlank, Trash, X } from '@phosphor-icons/react';
import type { Reminder } from '../reminder.schema';
import type { ReminderTranslator } from '../reminder.i18n';
import { notifyReminder } from '../tauri-api';

type ReminderEditorPopoverProps = {
  reminder: Reminder | null;
  t: ReminderTranslator;
  onClose: () => void;
  onFocus: (reminderId: string) => Promise<void>;
  onDelete: (reminderId: string) => Promise<void>;
  onTitleChange: (reminderId: string, title: string) => Promise<void>;
  onNotesChange: (reminderId: string, notes: string) => Promise<void>;
};

export function ReminderEditorPopover({
  reminder,
  t,
  onClose,
  onFocus,
  onDelete,
  onTitleChange,
  onNotesChange,
}: ReminderEditorPopoverProps): React.JSX.Element | null {
  if (!reminder) {
    return null;
  }

  return (
    <div className="popover-scrim" role="presentation" onMouseDown={onClose}>
      <section
        className="reminder-popover"
        aria-label={t('popover.title')}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <span>{t('popover.title')}</span>
          <button type="button" aria-label={t('action.close')} onClick={onClose}>
            <X size={15} />
          </button>
        </header>

        <textarea
          className="popover-title"
          aria-label="Reminder title"
          value={reminder.title}
          rows={2}
          onChange={(event) => void onTitleChange(reminder.id, event.target.value)}
        />
        <textarea
          className="popover-notes"
          aria-label="Reminder notes"
          value={reminder.notes}
          placeholder={t('popover.notes')}
          onChange={(event) => void onNotesChange(reminder.id, event.target.value)}
        />

        <div className="popover-field">
          <div>
            <CalendarBlank size={17} />
            <span>{t('popover.due')}</span>
          </div>
          <strong>{reminder.dueAt ? formatShortDate(reminder.dueAt) : t('popover.none')}</strong>
        </div>
        <div className="popover-field">
          <div>
            <Bell size={17} />
            <span>{t('popover.remind')}</span>
          </div>
          <strong>{reminder.remindAt ? formatShortDate(reminder.remindAt) : t('popover.none')}</strong>
        </div>

        <footer>
          <button type="button" onClick={() => void onFocus(reminder.id)}>{t('action.focus')}</button>
          <button type="button" onClick={() => void notifyReminder('Jaw Reminders', reminder.title)}>
            {t('action.notify')}
          </button>
          <button type="button" className="danger-action" onClick={() => void onDelete(reminder.id)}>
            <Trash size={15} />
            {t('action.delete')}
          </button>
        </footer>
      </section>
    </div>
  );
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
