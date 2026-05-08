import { CheckCircle, Circle, ClockCountdown, DotsThree, ListChecks, Target } from '@phosphor-icons/react';
import { appConfig } from '../../../../config/app.config';
import type { Reminder, ReminderSnapshot } from '../reminder.schema';
import type { ReminderTranslator, TranslationKey } from '../reminder.i18n';

type PriorityRailProps = {
  snapshot: ReminderSnapshot;
  visibleReminders: Reminder[];
  selectedReminder: Reminder | null;
  t: ReminderTranslator;
  onOpenDetails: (reminderId: string) => void;
  onToggle: (reminderId: string) => Promise<void>;
};

export function PriorityRail({
  snapshot,
  visibleReminders,
  selectedReminder,
  t,
  onOpenDetails,
  onToggle,
}: PriorityRailProps): React.JSX.Element {
  const focusReminder = snapshot.reminders.find((reminder) => reminder.status === 'focused') ?? null;
  const nextActions = rankNextActions(visibleReminders, focusReminder?.id ?? null);

  return (
    <aside className="priority-rail" aria-label={t('rail.title')}>
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
            onToggle={onToggle}
          />
        ) : (
          <p>{t('rail.noFocus')}</p>
        )}
      </section>

      <section className="rail-next">
        <div className="rail-section-title">
          <ListChecks size={18} />
          <span>{t('rail.next')}</span>
        </div>
        {nextActions.map((reminder) => (
          <RailReminderRow
            key={reminder.id}
            reminder={reminder}
            selected={selectedReminder?.id === reminder.id}
            t={t}
            onOpenDetails={onOpenDetails}
            onToggle={onToggle}
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
  selected: boolean;
  t: ReminderTranslator;
  onOpenDetails: (reminderId: string) => void;
  onToggle: (reminderId: string) => Promise<void>;
};

function RailReminderRow({
  reminder,
  selected,
  t,
  onOpenDetails,
  onToggle,
}: RailReminderRowProps): React.JSX.Element {
  const done = reminder.status === 'done';

  return (
    <article className={`rail-reminder-row ${selected ? 'is-active' : ''}`}>
      <button type="button" className="row-check" aria-label={t(`status.${done ? 'open' : 'done'}` as TranslationKey)} onClick={() => void onToggle(reminder.id)}>
        {done ? <CheckCircle size={18} weight="fill" /> : <Circle size={18} />}
      </button>
      <button type="button" className="rail-reminder-body" onClick={() => onOpenDetails(reminder.id)}>
        <strong>{reminder.title}</strong>
        <small>{t(`priority.${reminder.priority}` as TranslationKey)}</small>
      </button>
      <button type="button" className="row-detail-button" aria-label={t('popover.title')} onClick={() => onOpenDetails(reminder.id)}>
        <DotsThree size={18} weight="bold" />
      </button>
    </article>
  );
}

function rankNextActions(reminders: Reminder[], focusReminderId: string | null): Reminder[] {
  return reminders
    .filter((reminder) => reminder.status === 'open' && reminder.id !== focusReminderId)
    .sort(compareNextAction)
    .slice(0, appConfig.nextActionLimit);
}

function compareNextAction(left: Reminder, right: Reminder): number {
  return (
    nextTimeScore(left) - nextTimeScore(right) ||
    priorityScore(left) - priorityScore(right) ||
    Date.parse(left.createdAt) - Date.parse(right.createdAt)
  );
}

function nextTimeScore(reminder: Reminder): number {
  const candidates = [reminder.remindAt, reminder.dueAt]
    .filter((value): value is string => Boolean(value))
    .map((value) => Date.parse(value))
    .filter((value) => Number.isFinite(value));

  return candidates.length > 0 ? Math.min(...candidates) : Number.MAX_SAFE_INTEGER;
}

function priorityScore(reminder: Reminder): number {
  if (reminder.priority === 'high') {
    return 0;
  }
  if (reminder.priority === 'normal') {
    return 1;
  }
  return 2;
}
