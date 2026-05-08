import { invoke, isTauri } from '@tauri-apps/api/core';
import { isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';
import type {
  CreateReminderInput,
  ReminderDataSnapshot,
  ReminderSnapshot,
  UpdateReminderInput,
} from './reminder.schema';
import { loadBrowserSnapshot, saveBrowserSnapshot, toDataSnapshot } from './reminder.store';

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

export function isTauriRuntime(): boolean {
  try {
    return isTauri();
  } catch {
    return Boolean(window.__TAURI_INTERNALS__);
  }
}

export async function loadReminderData(): Promise<ReminderDataSnapshot> {
  if (!isTauriRuntime()) {
    return toDataSnapshot(loadBrowserSnapshot());
  }

  return invoke<ReminderDataSnapshot>('load_reminders');
}

export async function loadReminderSnapshot(): Promise<ReminderSnapshot> {
  if (!isTauriRuntime()) {
    return loadBrowserSnapshot();
  }

  const data = await loadReminderData();
  return {
    ...data,
    selectedViewId: 'today',
    selectedReminderId: data.reminders[0]?.id ?? null,
  };
}

export async function saveReminderSnapshot(snapshot: ReminderSnapshot): Promise<ReminderDataSnapshot> {
  if (!isTauriRuntime()) {
    saveBrowserSnapshot(snapshot);
    return toDataSnapshot(snapshot);
  }

  try {
    return await invoke<ReminderDataSnapshot>('save_reminders', { snapshot: toDataSnapshot(snapshot) });
  } catch (error) {
    console.error('[reminders] tauri save failed', error);
    return toDataSnapshot(snapshot);
  }
}

export async function createReminderNative(input: CreateReminderInput): Promise<ReminderDataSnapshot> {
  return invoke<ReminderDataSnapshot>('create_reminder', { input });
}

export async function updateReminderNative(
  reminderId: string,
  input: UpdateReminderInput,
): Promise<ReminderDataSnapshot> {
  return invoke<ReminderDataSnapshot>('update_reminder', { reminderId, input });
}

export async function deleteReminderNative(reminderId: string): Promise<ReminderDataSnapshot> {
  return invoke<ReminderDataSnapshot>('delete_reminder', { reminderId });
}

export async function setFocusReminderNative(reminderId: string): Promise<ReminderDataSnapshot> {
  return invoke<ReminderDataSnapshot>('set_focus_reminder', { reminderId });
}

export async function notifyReminder(title: string, body: string): Promise<void> {
  if (!isTauriRuntime()) {
    console.info('[reminders] notification preview', { title, body });
    return;
  }

  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === 'granted';
    }

    if (granted) {
      await invoke('show_reminder_notification', { input: { title, body } });
    }
  } catch (error) {
    console.error('[reminders] notification failed', error);
  }
}
