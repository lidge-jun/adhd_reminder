import { CheckCircle, Circle, DotsThree, Flag } from '@phosphor-icons/react';
import { formatRelativeDate } from '../reminder.date-format';
import type { ReminderLocale, ReminderTranslator, TranslationKey } from '../reminder.i18n';
import type { MatrixBucket } from '../reminder.matrix';
import type { Reminder } from '../reminder.schema';
import type { MatrixGroups } from '../useReminderController';
import { InlineReminderTitle } from './InlineReminderTitle';

type MatrixQuadrantProps = {
  bucket: MatrixBucket;
  title: string;
  tone: 'red' | 'green' | 'amber' | 'blue';
  count: number;
  reminders: MatrixGroups[keyof MatrixGroups];
  selectedReminderId: string | null;
  t: ReminderTranslator;
  locale: ReminderLocale;
  draft: string;
  dragActive: boolean;
  onDraftChange: (value: string) => void;
  onAdd: () => Promise<void>;
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

export function MatrixQuadrant({
  bucket,
  title,
  tone,
  count,
  reminders,
  selectedReminderId,
  t,
  locale,
  draft,
  dragActive,
  onDraftChange,
  onAdd,
  onSelect,
  onOpenDetails,
  onRename,
  onToggle,
  onPointerReminderStart,
}: MatrixQuadrantProps): React.JSX.Element {
  return (
    <section
      className={`matrix-quadrant tone-${tone}`}
      data-reminder-drop-bucket={bucket}
      data-reminder-drop-before-id={reminders.at(-1)?.id ?? undefined}
      data-drag-active={dragActive ? 'true' : 'false'}
    >
      <header>
        <h2>{title}</h2>
        <span>{count}</span>
      </header>
      <ul>
        {reminders.map((reminder, index) => (
          <MatrixReminderRow
            key={reminder.id}
            reminder={reminder}
            bucket={bucket}
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
        <li className="matrix-inline-create">
          <Circle size={16} />
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onAdd();
            }}
          >
            <input
              aria-label={`${title} ${t('matrix.create')}`}
              placeholder={t('matrix.create')}
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
            />
          </form>
        </li>
        {reminders.length === 0 ? <li className="matrix-empty">{t('matrix.empty')}</li> : null}
      </ul>
    </section>
  );
}

type MatrixReminderRowProps = {
  reminder: Reminder;
  bucket: MatrixBucket;
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

function MatrixReminderRow({
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
}: MatrixReminderRowProps): React.JSX.Element {
  const done = reminder.status === 'done';
  const dateHint = formatRelativeDate(reminder.dueAt ?? reminder.remindAt, locale);

  return (
    <li
      className={`matrix-reminder-row ${selected ? 'is-selected' : ''} ${done ? 'is-done' : ''}`}
      data-reminder-drop-bucket={bucket}
      data-reminder-drop-before-id={beforeId ?? undefined}
      data-reminder-drop-after-id={afterId ?? undefined}
      draggable={false}
      onPointerDown={(event) => onPointerDragStart(reminder.id, event, { title: reminder.title })}
    >
      <button type="button" className="row-check" aria-label={t(`status.${done ? 'open' : 'done'}` as TranslationKey)} onClick={() => void onToggle(reminder.id)}>
        {done ? <CheckCircle size={18} weight="fill" /> : <Circle size={18} weight="regular" />}
      </button>
      <div className="row-content" role="button" tabIndex={0} onClick={() => onSelect(reminder.id)}>
        <InlineReminderTitle reminder={reminder} onRename={onRename} />
        <small>{subtitleForReminder(reminder, t)}</small>
        {dateHint ? <small className="row-date-hint">{dateHint}</small> : null}
      </div>
      <button type="button" className="row-detail-button" aria-label={t('popover.title')} onClick={() => onOpenDetails(reminder.id)}>
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
