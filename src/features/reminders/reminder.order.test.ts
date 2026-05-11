import { describe, expect, it } from 'vitest';
import { demoSnapshot } from './reminder.fixtures';
import { nextManualRankBetween, rankPriorityReminders } from './reminder.order';

describe('reminder manual ordering', () => {
  it('ranks manual priorities before time and priority fallback', () => {
    const reminders = demoSnapshot.reminders.map((reminder) => {
      if (reminder.id === 'r-next-1') return { ...reminder, manualRank: 2000 };
      if (reminder.id === 'r-waiting') return { ...reminder, manualRank: 1000 };
      return reminder;
    });

    expect(rankPriorityReminders(reminders).map((reminder) => reminder.id)).toEqual([
      'r-focus',
      'r-waiting',
      'r-next-1',
    ]);
  });

  it('allocates ranks between existing neighbors', () => {
    const previous = { ...demoSnapshot.reminders[1]!, manualRank: 1000 };
    const next = { ...demoSnapshot.reminders[2]!, manualRank: 3000 };

    expect(nextManualRankBetween(previous, next)).toBe(2000);
    expect(nextManualRankBetween(null, next)).toBe(2000);
    expect(nextManualRankBetween(previous, null)).toBe(2000);
  });
});
