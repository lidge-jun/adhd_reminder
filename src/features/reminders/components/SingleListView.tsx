import { CheckCircle, Circle, DotsThree, Flag } from '@phosphor-icons/react';
import type { ReminderTranslator, TranslationKey } from '../reminder.i18n';
import type { Reminder, SmartListId } from '../reminder.schema';
import type { MatrixBucket } from '../reminder.matrix';

type Tone = 'red' | 'green' | 'amber' | 'blue' | 'grey';

type ViewMeta = {
  titleKey: TranslationKey;
  tone: Tone;
  bucket: MatrixBucket | null;
};

const VIEW_META: Record<SmartListId, ViewMeta> = {
  today: { titleKey: 'matrix.urgentImportant', tone: 'red', bucket: 'urgentImportant' },
  focus: { titleKey: 'matrix.important', tone: 'green', bucket: 'important' },
  waiting: { titleKey: 'matrix.waiting', tone: 'amber', bucket: 'waiting' },
  later: { titleKey: 'matrix.later', tone: 'blue', bucket: 'later' },
  done: { titleKey: 'nav.done', tone: 'grey', bucket: null },
};

type SingleListViewProps = {
  viewId: SmartListId;
  reminders: Reminder[];
  selectedReminderId: string | null;
  t: ReminderTranslator;
  draft: string;
  onDraftChange: (value: string) => void;
  onAdd: (bucket: MatrixBucket, title: string) => Promise<void>;
  onSelect: (reminderId: string) => void;
  onOpenDetails: (reminderId: string) => void;
  onToggle: (reminderId: string) => Promise<void>;
};

export function SingleListView({
  viewId,
  reminders,
  selectedReminderId,
  t,
  draft,
  onDraftChange,
  onAdd,
  onSelect,
  onOpenDetails,
  onToggle,
}: SingleListViewProps): React.JSX.Element {
  const meta = VIEW_META[viewId];

  return (
    <section className={`single-list-view tone-${meta.tone}`} aria-label={t(meta.titleKey)}>
      <header>
        <h2>{t(meta.titleKey)}</h2>
        <span>{reminders.length}</span>
      </header>
      <ul>
        {reminders.map((reminder) => (
          <SingleListRow
            key={reminder.id}
            reminder={reminder}
            selected={selectedReminderId === reminder.id}
            t={t}
            onSelect={onSelect}
            onOpenDetails={onOpenDetails}
            onToggle={onToggle}
          />
        ))}
        {meta.bucket ? (
          <li className="matrix-inline-create">
            <Circle size={16} />
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (meta.bucket) {
                  void onAdd(meta.bucket, draft);
                }
              }}
            >
              <input
                aria-label={`${t(meta.titleKey)} ${t('matrix.create')}`}
                placeholder={t('matrix.create')}
                value={draft}
                onChange={(event) => onDraftChange(event.target.value)}
              />
            </form>
          </li>
        ) : null}
        {reminders.length === 0 ? <li className="matrix-empty">{t('matrix.empty')}</li> : null}
      </ul>
    </section>
  );
}

type SingleListRowProps = {
  reminder: Reminder;
  selected: boolean;
  t: ReminderTranslator;
  onSelect: (reminderId: string) => void;
  onOpenDetails: (reminderId: string) => void;
  onToggle: (reminderId: string) => Promise<void>;
};

function SingleListRow({
  reminder,
  selected,
  t,
  onSelect,
  onOpenDetails,
  onToggle,
}: SingleListRowProps): React.JSX.Element {
  const done = reminder.status === 'done';

  return (
    <li className={`matrix-reminder-row ${selected ? 'is-selected' : ''} ${done ? 'is-done' : ''}`}>
      <button
        type="button"
        className="row-check"
        aria-label={t(`status.${done ? 'open' : 'done'}` as TranslationKey)}
        onClick={() => void onToggle(reminder.id)}
      >
        {done ? <CheckCircle size={18} weight="fill" /> : <Circle size={18} weight="regular" />}
      </button>
      <button type="button" className="row-content" onClick={() => onSelect(reminder.id)}>
        <span>{reminder.title}</span>
        <small>{subtitleForReminder(reminder, t)}</small>
      </button>
      <button
        type="button"
        className="row-detail-button"
        aria-label={t('popover.title')}
        onClick={() => onOpenDetails(reminder.id)}
      >
        <DotsThree size={18} weight="bold" />
      </button>
      {reminder.priority === 'high' ? <Flag className="row-flag" size={15} weight="fill" /> : null}
    </li>
  );
}

function subtitleForReminder(reminder: Reminder, t: ReminderTranslator): string {
  const parts: string[] = [
    t(`status.${reminder.status}` as TranslationKey),
    t(`priority.${reminder.priority}` as TranslationKey),
  ];
  if (reminder.linkedInstance) {
    parts.push(reminder.linkedInstance);
  }
  return parts.join(' · ');
}
