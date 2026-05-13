import type { Reminder } from './reminder.schema';

export const DEFAULT_MANUAL_RANK_STEP = 1000;

export function compareManualReminderOrder(left: Reminder, right: Reminder): number {
  return (
    focusedScore(left) - focusedScore(right) ||
    priorityScore(left) - priorityScore(right) ||
    manualRankScore(left) - manualRankScore(right) ||
    nextTimeScore(left) - nextTimeScore(right) ||
    Date.parse(left.createdAt) - Date.parse(right.createdAt)
  );
}

export function nextManualRankBetween(previous: Reminder | null, next: Reminder | null): number {
  const previousRank = previous?.manualRank ?? null;
  const nextRank = next?.manualRank ?? null;
  if (previousRank === null && nextRank === null) return DEFAULT_MANUAL_RANK_STEP;
  if (previousRank === null && nextRank !== null) return nextRank - DEFAULT_MANUAL_RANK_STEP;
  if (previousRank !== null && nextRank === null) return previousRank + DEFAULT_MANUAL_RANK_STEP;
  return ((previousRank ?? 0) + (nextRank ?? 0)) / 2;
}

export function rankPriorityReminders(reminders: Reminder[], limit?: number): Reminder[] {
  const ranked = reminders
    .filter((reminder) => reminder.status !== 'done')
    .sort(compareManualReminderOrder);
  return typeof limit === 'number' ? ranked.slice(0, limit) : ranked;
}

function focusedScore(reminder: Reminder): number {
  return reminder.status === 'focused' ? 0 : 1;
}

function manualRankScore(reminder: Reminder): number {
  return reminder.manualRank ?? Number.MAX_SAFE_INTEGER;
}

function nextTimeScore(reminder: Reminder): number {
  const candidates = [reminder.remindAt, reminder.dueAt]
    .filter((value): value is string => Boolean(value))
    .map((value) => Date.parse(value))
    .filter((value) => Number.isFinite(value));

  return candidates.length > 0 ? Math.min(...candidates) : Number.MAX_SAFE_INTEGER;
}

function priorityScore(reminder: Reminder): number {
  if (reminder.priority === 'high') return 0;
  if (reminder.priority === 'normal') return 1;
  return 2;
}
