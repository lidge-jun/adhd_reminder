import { CheckCircle, Circle, DotsThree, Flag } from '@phosphor-icons/react';
import { formatRelativeDate } from '../reminder.date-format';
import type { ReminderLocale, ReminderTranslator, TranslationKey } from '../reminder.i18n';
import type { Reminder, SmartListId } from '../reminder.schema';
import type { MatrixBucket } from '../reminder.matrix';
import { InlineReminderTitle } from './InlineReminderTitle';

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
  locale: ReminderLocale;
  draft: string;
  onDraftChange: (value: string) => void;
  onAdd: (bucket: MatrixBucket, title: string) => Promise<void>;
  onSelect: (reminderId: string) => void;
  onOpenDetails: (reminderId: string) => void;
  onRename: (reminderId: string, title: string) => Promise<void>;
  onToggle: (reminderId: string) => Promise<void>;
  onPointerReminderStart: (
    reminderId: string,
    event: React.PointerEvent<HTMLElement>,
    options: { title: string },
  ) => void;
};

export function SingleListView({
  viewId,
  reminders,
  selectedReminderId,
  t,
  locale,
  draft,
  onDraftChange,
  onAdd,
  onSelect,
  onOpenDetails,
  onRename,
  onToggle,
  onPointerReminderStart,
}: SingleListViewProps): React.JSX.Element {
  const meta = VIEW_META[viewId];

  return (
    <section
      className={`single-list-view tone-${meta.tone}`}
      aria-label={t(meta.titleKey)}
      data-reminder-drop-bucket={meta.bucket ?? undefined}
      data-reminder-drop-action={meta.bucket ? undefined : 'done'}
      data-reminder-drop-before-id={reminders.at(-1)?.id ?? undefined}
    >
      <header>
        <h2>{t(meta.titleKey)}</h2>
        <span>{reminders.length}</span>
      </header>
      <ul>
        {reminders.map((reminder, index) => (
          <SingleListRow
            key={reminder.id}
            reminder={reminder}
            bucket={meta.bucket}
            beforeId={reminders[index - 1]?.id ?? null}
            afterId={reminder.id}
            selected={selectedReminderId === reminder.id}
            t={t}
            locale={locale}
            onSelect={onSelect}
            onOpenDetails={onOpenDetails}
            onRename={onRename}
            onToggle={onToggle}
            onPointerDragStart={onPointerReminderStart}
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
  bucket: MatrixBucket | null;
  beforeId: string | null;
  afterId: string | null;
  selected: boolean;
  t: ReminderTranslator;
  locale: ReminderLocale;
  onSelect: (reminderId: string) => void;
  onOpenDetails: (reminderId: string) => void;
  onRename: (reminderId: string, title: string) => Promise<void>;
  onToggle: (reminderId: string) => Promise<void>;
  onPointerDragStart: (
    reminderId: string,
    event: React.PointerEvent<HTMLElement>,
    options: { title: string },
  ) => void;
};

function SingleListRow({
  reminder,
  bucket,
  beforeId,
  afterId,
  selected,
  t,
  locale,
  onSelect,
  onOpenDetails,
  onRename,
  onToggle,
  onPointerDragStart,
}: SingleListRowProps): React.JSX.Element {
  const done = reminder.status === 'done';
  const dateHint = formatRelativeDate(reminder.dueAt ?? reminder.remindAt, locale);

  return (
    <li
      className={`matrix-reminder-row ${selected ? 'is-selected' : ''} ${done ? 'is-done' : ''}`}
      data-reminder-drop-bucket={bucket ?? undefined}
      data-reminder-drop-action={bucket ? undefined : 'done'}
      data-reminder-drop-before-id={beforeId ?? undefined}
      data-reminder-drop-after-id={afterId ?? undefined}
      onPointerDown={(event) => onPointerDragStart(reminder.id, event, { title: reminder.title })}
    >
      <button
        type="button"
        className="row-check"
        aria-label={t(`status.${done ? 'open' : 'done'}` as TranslationKey)}
        onClick={() => void onToggle(reminder.id)}
      >
        {done ? <CheckCircle size={18} weight="fill" /> : <Circle size={18} weight="regular" />}
      </button>
      <div className="row-content" role="button" tabIndex={0} onClick={() => onSelect(reminder.id)}>
        <InlineReminderTitle reminder={reminder} onRename={onRename} />
        <small>{subtitleForReminder(reminder, t)}</small>
        {dateHint ? <small className="row-date-hint">{dateHint}</small> : null}
      </div>
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
