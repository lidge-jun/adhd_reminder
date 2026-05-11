import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InlineReminderTitle } from './InlineReminderTitle';
import type { Reminder } from '../reminder.schema';

let root: Root | null = null;
let container: HTMLDivElement | null = null;

afterEach(() => {
  root?.unmount();
  root = null;
  container?.remove();
  container = null;
});

function makeReminder(): Reminder {
  return {
    id: 'r-inline',
    title: 'Draft title',
    notes: '',
    listId: 'today',
    status: 'open',
    priority: 'normal',
    manualRank: null,
    dueAt: null,
    remindAt: null,
    linkedInstance: null,
    subtasks: [],
    createdAt: '2026-05-10T00:00:00.000Z',
    updatedAt: '2026-05-10T00:00:00.000Z',
  };
}

describe('InlineReminderTitle', () => {
  it('enters edit mode on double click without bubbling to row details', async () => {
    const onOpenDetails = vi.fn();
    const onRename = vi.fn<Parameters<typeof InlineReminderTitle>[0]['onRename']>().mockResolvedValue(undefined);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root!.render(
        <div onClick={onOpenDetails}>
          <InlineReminderTitle reminder={makeReminder()} onRename={onRename} />
        </div>,
      );
    });

    const title = container.querySelector<HTMLElement>('.inline-reminder-title');
    expect(title).not.toBeNull();

    await act(async () => {
      title!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      title!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      title!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    });

    expect(onOpenDetails).not.toHaveBeenCalled();
    expect(container.querySelector('[data-reminder-inline-edit="true"].inline-reminder-title-input')).not.toBeNull();
  });
});
