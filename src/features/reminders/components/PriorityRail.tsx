import { CheckCircle, Circle, ClockCountdown, DotsThree, ListChecks, Target } from '@phosphor-icons/react';
import type { Reminder, ReminderSnapshot } from '../reminder.schema';
import type { ReminderTranslator, TranslationKey } from '../reminder.i18n';
import type { MatrixGroups } from '../useReminderController';

type PriorityRailProps = {
  snapshot: ReminderSnapshot;
  matrixGroups: MatrixGroups;
  selectedReminder: Reminder | null;
  t: ReminderTranslator;
  onOpenDetails: (reminderId: string) => void;
  onToggle: (reminderId: string) => Promise<void>;
};

export function PriorityRail({
  snapshot,
  selectedReminder,
  t,
  onOpenDetails,
  onToggle,
}: PriorityRailProps): React.JSX.Element {
  const focusReminder = snapshot.reminders.find((reminder) => reminder.status === 'focused') ?? null;
  const nextActions = snapshot.reminders
    .filter((reminder) => reminder.status === 'open')
    .slice(0, 3);

  return (
    <aside className="priority-rail" aria-label="우선순위 요약">
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
      <button type="button" className="row-check" onClick={() => void onToggle(reminder.id)}>
        {done ? <CheckCircle size={18} weight="fill" /> : <Circle size={18} />}
      </button>
      <button type="button" className="rail-reminder-body" onClick={() => onOpenDetails(reminder.id)}>
        <strong>{reminder.title}</strong>
        <small>{t(`priority.${reminder.priority}` as TranslationKey)}</small>
      </button>
      <button type="button" className="row-detail-button" aria-label="상세 열기" onClick={() => onOpenDetails(reminder.id)}>
        <DotsThree size={18} weight="bold" />
      </button>
    </article>
  );
}
