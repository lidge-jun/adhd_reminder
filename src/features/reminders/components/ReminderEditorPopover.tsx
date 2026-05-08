import { Bell, CalendarBlank, Trash, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
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
  onDueChange: (reminderId: string, dueAt: string | null) => Promise<void>;
  onRemindChange: (reminderId: string, remindAt: string | null) => Promise<void>;
};

export function ReminderEditorPopover({
  reminder,
  t,
  onClose,
  onFocus,
  onDelete,
  onTitleChange,
  onNotesChange,
  onDueChange,
  onRemindChange,
}: ReminderEditorPopoverProps): React.JSX.Element | null {
  const panelRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');

  useEffect(() => {
    if (!reminder) {
      return;
    }
    setTitleDraft(reminder.title);
    setNotesDraft(reminder.notes);
  }, [reminder]);

  useEffect(() => {
    if (!reminder) {
      return undefined;
    }
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus();
    };
  }, [reminder]);

  if (!reminder) {
    return null;
  }

  async function saveTitle(): Promise<void> {
    if (reminder && titleDraft.trim() !== reminder.title) {
      await onTitleChange(reminder.id, titleDraft);
    }
  }

  async function saveNotes(): Promise<void> {
    if (reminder && notesDraft !== reminder.notes) {
      await onNotesChange(reminder.id, notesDraft);
    }
  }

  return (
    <div className="popover-scrim" role="presentation" onMouseDown={onClose}>
      <section
        ref={panelRef}
        className="reminder-popover"
        role="dialog"
        aria-modal="true"
        aria-label={t('popover.title')}
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
          <span>{t('popover.title')}</span>
          <button type="button" aria-label={t('action.close')} onClick={onClose}>
            <X size={15} />
          </button>
        </header>

        <textarea
          className="popover-title"
          aria-label={t('popover.title')}
          value={titleDraft}
          rows={2}
          onChange={(event) => setTitleDraft(event.target.value)}
          onBlur={() => void saveTitle()}
        />
        <textarea
          className="popover-notes"
          aria-label={t('popover.notes')}
          value={notesDraft}
          placeholder={t('popover.notes')}
          onChange={(event) => setNotesDraft(event.target.value)}
          onBlur={() => void saveNotes()}
        />

        <div className="popover-field">
          <div>
            <CalendarBlank size={17} />
            <span>{t('popover.due')}</span>
          </div>
          <input
            type="datetime-local"
            aria-label={t('popover.due')}
            value={toDateTimeLocal(reminder.dueAt)}
            onChange={(event) => void onDueChange(reminder.id, fromDateTimeLocal(event.target.value))}
          />
        </div>
        <div className="popover-field">
          <div>
            <Bell size={17} />
            <span>{t('popover.remind')}</span>
          </div>
          <input
            type="datetime-local"
            aria-label={t('popover.remind')}
            value={toDateTimeLocal(reminder.remindAt)}
            onChange={(event) => void onRemindChange(reminder.id, fromDateTimeLocal(event.target.value))}
          />
        </div>

        <footer>
          <button type="button" onClick={() => void onFocus(reminder.id)}>{t('action.focus')}</button>
          <button type="button" onClick={() => void notifyReminder('Jaw Reminders', reminder.title)}>
            {t('action.testNotify')}
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

function toDateTimeLocal(value: string | null): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string): string | null {
  if (!value) {
    return null;
  }
  return new Date(value).toISOString();
}
