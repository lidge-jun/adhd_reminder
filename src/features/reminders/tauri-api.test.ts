import { beforeEach, describe, expect, it, vi } from 'vitest';
import { seedSnapshot } from './reminder.fixtures';

const invoke = vi.fn();
const isTauri = vi.fn();
const isPermissionGranted = vi.fn();
const requestPermission = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke,
  isTauri,
}));

vi.mock('@tauri-apps/plugin-notification', () => ({
  isPermissionGranted,
  requestPermission,
}));

describe('tauri api wrappers', () => {
  beforeEach(() => {
    invoke.mockReset();
    isTauri.mockReset();
    isPermissionGranted.mockReset();
    requestPermission.mockReset();
  });

  it('uses official runtime detection helper', async () => {
    isTauri.mockReturnValue(true);
    invoke.mockResolvedValue(seedSnapshot);
    const api = await import('./tauri-api');

    expect(api.isTauriRuntime()).toBe(true);
  });

  it('sends create payload with camelCase keys', async () => {
    isTauri.mockReturnValue(true);
    invoke.mockResolvedValue(seedSnapshot);
    const api = await import('./tauri-api');

    await api.createReminderNative({
      title: 'Native add',
      listId: 'today',
      initialStatus: 'open',
    });

    expect(invoke).toHaveBeenCalledWith('create_reminder', {
      input: {
        title: 'Native add',
        listId: 'today',
        initialStatus: 'open',
      },
    });
  });

  it('sends update payload with nullable patch fields intact', async () => {
    isTauri.mockReturnValue(true);
    invoke.mockResolvedValue(seedSnapshot);
    const api = await import('./tauri-api');

    await api.updateReminderNative('r-focus', {
      dueAt: null,
      remindAt: '2026-05-08T04:00:00.000Z',
    });

    expect(invoke).toHaveBeenCalledWith('update_reminder', {
      reminderId: 'r-focus',
      input: {
        dueAt: null,
        remindAt: '2026-05-08T04:00:00.000Z',
      },
    });
  });

  it('keeps permission helpers but invokes Rust for notification send', async () => {
    isTauri.mockReturnValue(true);
    isPermissionGranted.mockResolvedValue(true);
    invoke.mockResolvedValue(undefined);
    const api = await import('./tauri-api');

    await api.notifyReminder('Jaw Reminders', 'Ping');

    expect(invoke).toHaveBeenCalledWith('show_reminder_notification', {
      input: { title: 'Jaw Reminders', body: 'Ping' },
    });
  });
});
