import { describe, expect, it } from 'vitest';
import { selectRemindersForView } from './reminder.store';
import type { Reminder } from './reminder.schema';

function makeReminder(partial: Partial<Reminder>): Reminder {
  return {
    id: partial.id ?? 'r-1',
    title: partial.title ?? 'untitled',
    notes: '',
    listId: partial.listId ?? 'today',
    status: partial.status ?? 'open',
    priority: partial.priority ?? 'normal',
    dueAt: null,
    remindAt: null,
    linkedInstance: null,
    subtasks: [],
    createdAt: '2026-05-08T00:00:00.000Z',
    updatedAt: '2026-05-08T00:00:00.000Z',
  };
}

describe('selectRemindersForView', () => {
  const reminders: Reminder[] = [
    makeReminder({ id: 'r-today-open', listId: 'today', status: 'open', priority: 'high' }),
    makeReminder({ id: 'r-today-done', listId: 'today', status: 'done' }),
    makeReminder({ id: 'r-focused', listId: 'today', status: 'focused' }),
    makeReminder({ id: 'r-waiting', listId: 'waiting', status: 'waiting' }),
    makeReminder({ id: 'r-later', listId: 'later', status: 'open', priority: 'low' }),
    makeReminder({ id: 'r-custom', listId: 'work', status: 'open' }),
  ];

  it('matrix excludes done items only', () => {
    const result = selectRemindersForView(reminders, 'matrix');
    expect(result.map((r) => r.id)).toEqual([
      'r-today-open',
      'r-focused',
      'r-waiting',
      'r-later',
      'r-custom',
    ]);
  });

  it('done returns only status=done', () => {
    const result = selectRemindersForView(reminders, 'done');
    expect(result.map((r) => r.id)).toEqual(['r-today-done']);
  });

  it('today returns matrix urgentImportant bucket items', () => {
    const result = selectRemindersForView(reminders, 'today');
    expect(result.map((r) => r.id)).toEqual(['r-today-open', 'r-focused']);
  });

  it('focus returns matrix important bucket items', () => {
    const result = selectRemindersForView(reminders, 'focus');
    expect(result.map((r) => r.id)).toEqual(['r-custom']);
  });

  it('waiting returns matrix waiting bucket items', () => {
    const result = selectRemindersForView(reminders, 'waiting');
    expect(result.map((r) => r.id)).toEqual(['r-waiting']);
  });

  it('later returns matrix later bucket items', () => {
    const result = selectRemindersForView(reminders, 'later');
    expect(result.map((r) => r.id)).toEqual(['r-later']);
  });

  it('list:custom returns matching listId', () => {
    const result = selectRemindersForView(reminders, 'list:work');
    expect(result.map((r) => r.id)).toEqual(['r-custom']);
  });

  it('matrix on empty list returns empty', () => {
    expect(selectRemindersForView([], 'matrix')).toEqual([]);
  });
});
