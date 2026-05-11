import { CheckCircle, Circle, ClockCountdown, DotsThree, ListChecks, Target } from '@phosphor-icons/react';
import { appConfig } from '../../../../config/app.config';
import type { Reminder, ReminderSnapshot } from '../reminder.schema';
import type { ReminderTranslator, TranslationKey } from '../reminder.i18n';
import { rankPriorityReminders } from '../reminder.order';
import { InlineReminderTitle } from './InlineReminderTitle';

type PriorityRailProps = {
  snapshot: ReminderSnapshot;
  selectedReminder: Reminder | null;
  t: ReminderTranslator;
  dragActive: boolean;
  onOpenDetails: (reminderId: string) => void;
  onRename: (reminderId: string, title: string) => Promise<void>;
  onToggle: (reminderId: string) => Promise<void>;
  onPointerReminderStart: (
    reminderId: string,
    event: React.PointerEvent<HTMLElement>,
    options: { title: string },
  ) => void;
};

export function PriorityRail({
  snapshot,
  selectedReminder,
  t,
  dragActive,
  onOpenDetails,
  onRename,
  onToggle,
  onPointerReminderStart,
}: PriorityRailProps): React.JSX.Element {
  const focusReminder = snapshot.reminders.find((reminder) => reminder.status === 'focused') ?? null;
  const nextActions = rankNextActions(snapshot.reminders, focusReminder?.id ?? null);

  return (
    <aside className="priority-rail" aria-label={t('rail.title')} data-drag-active={dragActive ? 'true' : 'false'}>
      <header>
        <span>{t('rail.kicker')}</span>
        <h2>{t('rail.title')}</h2>
      </header>

      <section className="rail-focus">
        <div>
          <Target size={19} />
          <span>{t('rail.focusNow')}</span>
        </div>
        {focusReminder ? (
          <RailReminderRow
            reminder={focusReminder}
            selected={selectedReminder?.id === focusReminder.id}
            t={t}
            onOpenDetails={onOpenDetails}
            onRename={onRename}
            onToggle={onToggle}
            onPointerDragStart={onPointerReminderStart}
          />
        ) : (
          <p>{t('rail.noFocus')}</p>
        )}
      </section>

      <section
        className="rail-next"
        data-reminder-drop-priority
        data-reminder-drop-before-id={nextActions.at(-1)?.id ?? undefined}
      >
        <div className="rail-section-title">
          <ListChecks size={18} />
          <span>{t('rail.next')}</span>
        </div>
        {nextActions.map((reminder, index) => (
          <RailReminderRow
            key={reminder.id}
            reminder={reminder}
            beforeId={nextActions[index - 1]?.id ?? null}
            afterId={reminder.id}
            selected={selectedReminder?.id === reminder.id}
            t={t}
            onOpenDetails={onOpenDetails}
            onRename={onRename}
            onToggle={onToggle}
            onPointerDragStart={onPointerReminderStart}
          />
        ))}
      </section>

      <footer className="rail-cutoff">
        <ClockCountdown size={18} />
        <span>{t('rail.cutoff')}</span>
      </footer>
    </aside>
  );
}

type RailReminderRowProps = {
  reminder: Reminder;
  beforeId?: string | null;
  afterId?: string | null;
  selected: boolean;
  t: ReminderTranslator;
  onOpenDetails: (reminderId: string) => void;
  onRename: (reminderId: string, title: string) => Promise<void>;
  onToggle: (reminderId: string) => Promise<void>;
  onPointerDragStart: (
    reminderId: string,
    event: React.PointerEvent<HTMLElement>,
    options: { title: string },
  ) => void;
};

function RailReminderRow({
  reminder,
  beforeId = null,
  afterId = null,
  selected,
  t,
  onOpenDetails,
  onRename,
  onToggle,
  onPointerDragStart,
}: RailReminderRowProps): React.JSX.Element {
  const done = reminder.status === 'done';

  return (
    <article
      className={`rail-reminder-row ${selected ? 'is-active' : ''}`}
      data-reminder-drop-priority
      data-reminder-drop-before-id={beforeId ?? undefined}
      data-reminder-drop-after-id={afterId ?? undefined}
      onPointerDown={(event) => onPointerDragStart(reminder.id, event, { title: reminder.title })}
    >
      <button type="button" className="row-check" aria-label={t(`status.${done ? 'open' : 'done'}` as TranslationKey)} onClick={() => void onToggle(reminder.id)}>
        {done ? <CheckCircle size={18} weight="fill" /> : <Circle size={18} />}
      </button>
      <div className="rail-reminder-body" role="button" tabIndex={0} onClick={() => onOpenDetails(reminder.id)}>
        <InlineReminderTitle reminder={reminder} onRename={onRename} />
        <small>{t(`priority.${reminder.priority}` as TranslationKey)}</small>
      </div>
      <button type="button" className="row-detail-button" aria-label={t('popover.title')} onClick={() => onOpenDetails(reminder.id)}>
        <DotsThree size={18} weight="bold" />
      </button>
    </article>
  );
}

function rankNextActions(reminders: Reminder[], focusReminderId: string | null): Reminder[] {
  return rankPriorityReminders(
    reminders.filter((reminder) => reminder.status === 'open' && reminder.id !== focusReminderId),
    appConfig.nextActionLimit,
  );
}
