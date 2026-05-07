import { describe, expect, it } from 'vitest';
import {
  getVisibleReminders,
  selectView,
  setSingleFocus,
  toggleReminder,
} from './reminder.store';
import { seedSnapshot } from './reminder.fixtures';

describe('reminder store', () => {
  it('toggles a reminder done and open without changing other reminders', () => {
    const done = toggleReminder(seedSnapshot, 'r-next-1');
    expect(done.reminders.find((reminder) => reminder.id === 'r-next-1')?.status).toBe('done');

    const open = toggleReminder(done, 'r-next-1');
    expect(open.reminders.find((reminder) => reminder.id === 'r-next-1')?.status).toBe('open');
  });

  it('selects the first reminder in a smart view', () => {
    const next = selectView(seedSnapshot, 'waiting');
    expect(next.selectedViewId).toBe('waiting');
    expect(next.selectedReminderId).toBe('r-waiting');
  });

  it('keeps only one focused reminder in browser fallback', () => {
    const next = setSingleFocus(seedSnapshot, 'r-next-1');
    expect(next.reminders.filter((reminder) => reminder.status === 'focused')).toHaveLength(1);
    expect(next.reminders.find((reminder) => reminder.id === 'r-next-1')?.status).toBe('focused');
  });

  it('filters smart views without persisting selection to data', () => {
    expect(getVisibleReminders(seedSnapshot, 'focus').map((reminder) => reminder.id)).toEqual(['r-focus']);
    expect(getVisibleReminders(seedSnapshot, 'done')).toEqual([]);
  });
});
