import { describe, expect, it } from 'vitest';
import {
  getVisibleReminders,
  patchReminder,
  selectView,
  setSingleFocus,
  toggleReminder,
} from './reminder.store';
import { demoSnapshot } from './reminder.fixtures';

describe('reminder store', () => {
  it('toggles a reminder done and open without changing other reminders', () => {
    const done = toggleReminder(demoSnapshot, 'r-next-1');
    expect(done.reminders.find((reminder) => reminder.id === 'r-next-1')?.status).toBe('done');

    const open = toggleReminder(done, 'r-next-1');
    expect(open.reminders.find((reminder) => reminder.id === 'r-next-1')?.status).toBe('open');
  });

  it('selects the first reminder in a smart view', () => {
    const next = selectView(demoSnapshot, 'waiting');
    expect(next.selectedViewId).toBe('waiting');
    expect(next.selectedReminderId).toBe('r-waiting');
  });

  it('keeps only one focused reminder in browser fallback', () => {
    const next = setSingleFocus(demoSnapshot, 'r-next-1');
    expect(next.reminders.filter((reminder) => reminder.status === 'focused')).toHaveLength(1);
    expect(next.reminders.find((reminder) => reminder.id === 'r-next-1')?.status).toBe('focused');
  });

  it('filters smart views without persisting selection to data', () => {
    expect(getVisibleReminders(demoSnapshot, 'focus').map((reminder) => reminder.id)).toEqual(['r-next-1']);
    expect(getVisibleReminders(demoSnapshot, 'done')).toEqual([]);
  });

  it('uses manual rank before automatic priority ordering', () => {
    const ranked = patchReminder(
      patchReminder(demoSnapshot, 'r-next-1', { manualRank: 2000 }),
      'r-waiting',
      { manualRank: 1000 },
    );

    expect(getVisibleReminders(ranked, 'matrix').map((reminder) => reminder.id)).toEqual([
      'r-focus',
      'r-waiting',
      'r-next-1',
    ]);
  });
});
