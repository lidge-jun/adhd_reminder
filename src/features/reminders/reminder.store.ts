import { appConfig } from '../../../config/app.config';
import type {
  CreateReminderInput,
  Reminder,
  ReminderDataSnapshot,
  ReminderSnapshot,
  ReminderStatus,
  ReminderViewId,
  ReminderViewState,
  SmartListId,
  UpdateReminderInput,
} from './reminder.schema';
import { seedSnapshot } from './reminder.fixtures';
import { resolveReminderMatrixBucket } from './reminder.matrix';
import { compareManualReminderOrder } from './reminder.order';

export const smartListIds: SmartListId[] = ['today', 'focus', 'waiting', 'later', 'done'];

export function createReminder(input: CreateReminderInput): Reminder {
  const now = new Date().toISOString();
  const cleanTitle = input.title.trim();

  return {
    id: `r-${crypto.randomUUID()}`,
    title: cleanTitle.length > 0 ? cleanTitle : '제목 없는 미리알림',
    notes: '',
    listId: input.listId,
    status: input.initialStatus ?? 'open',
    priority: input.priority ?? 'normal',
    manualRank: input.manualRank ?? null,
    dueAt: null,
    remindAt: null,
    linkedInstance: null,
    subtasks: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function toDataSnapshot(snapshot: ReminderSnapshot): ReminderDataSnapshot {
  return {
    schemaVersion: snapshot.schemaVersion,
    lists: snapshot.lists,
    reminders: snapshot.reminders,
  };
}

export function mergeSnapshot(
  data: ReminderDataSnapshot,
  view: ReminderViewState,
): ReminderSnapshot {
  return {
    ...data,
    ...view,
  };
}

export function createInitialView(data: ReminderDataSnapshot): ReminderViewState {
  return {
    selectedViewId: 'matrix',
    selectedReminderId: data.reminders[0]?.id ?? null,
  };
}

export function toggleReminder(snapshot: ReminderSnapshot, reminderId: string): ReminderSnapshot {
  return updateReminder(snapshot, reminderId, (reminder) => ({
    ...reminder,
    status: reminder.status === 'done' ? 'open' : 'done',
    updatedAt: new Date().toISOString(),
  }));
}

export function patchReminder(
  snapshot: ReminderSnapshot,
  reminderId: string,
  input: UpdateReminderInput,
): ReminderSnapshot {
  return updateReminder(snapshot, reminderId, (reminder) => ({
    ...reminder,
    ...input,
    updatedAt: new Date().toISOString(),
  }));
}

export function addReminderWithInput(
  snapshot: ReminderSnapshot,
  input: CreateReminderInput,
): ReminderSnapshot {
  const reminder = createReminder(input);

  return {
    ...snapshot,
    reminders: [reminder, ...snapshot.reminders],
    selectedReminderId: reminder.id,
  };
}

export function setReminderStatus(
  snapshot: ReminderSnapshot,
  reminderId: string,
  status: ReminderStatus,
): ReminderSnapshot {
  return updateReminder(snapshot, reminderId, (reminder) => ({
    ...reminder,
    status,
    updatedAt: new Date().toISOString(),
  }));
}

export function selectView(snapshot: ReminderSnapshot, viewId: ReminderViewId): ReminderSnapshot {
  const firstReminder = getVisibleReminders(snapshot, viewId)[0] ?? null;

  return {
    ...snapshot,
    selectedViewId: viewId,
    selectedReminderId: firstReminder?.id ?? null,
  };
}

export function loadBrowserSnapshot(): ReminderSnapshot {
  try {
    const raw = window.localStorage.getItem(appConfig.storageKey);
    if (!raw) {
      return seedSnapshot;
    }

    const parsed: unknown = JSON.parse(raw);
    if (isReminderSnapshot(parsed)) {
      return normalizeSnapshot(parsed);
    }
    console.error('[reminders] ignored malformed browser snapshot');
    return seedSnapshot;
  } catch (error) {
    console.error('[reminders] failed to load browser snapshot', error);
    return seedSnapshot;
  }
}

function normalizeSnapshot(snapshot: ReminderSnapshot): ReminderSnapshot {
  return {
    ...snapshot,
    reminders: snapshot.reminders.map((reminder) => ({
      ...reminder,
      manualRank:
        typeof reminder.manualRank === 'number' && Number.isFinite(reminder.manualRank)
          ? reminder.manualRank
          : null,
    })),
  };
}

function isReminderSnapshot(value: unknown): value is ReminderSnapshot {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<ReminderSnapshot>;
  return (
    candidate.schemaVersion === 1 &&
    Array.isArray(candidate.lists) &&
    Array.isArray(candidate.reminders) &&
    typeof candidate.selectedViewId === 'string' &&
    (typeof candidate.selectedReminderId === 'string' || candidate.selectedReminderId === null)
  );
}

export function saveBrowserSnapshot(snapshot: ReminderSnapshot): void {
  try {
    window.localStorage.setItem(appConfig.storageKey, JSON.stringify(snapshot));
  } catch (error) {
    console.error('[reminders] failed to save browser snapshot', error);
  }
}

function updateReminder(
  snapshot: ReminderSnapshot,
  reminderId: string,
  mapReminder: (reminder: Reminder) => Reminder,
): ReminderSnapshot {
  return {
    ...snapshot,
    reminders: snapshot.reminders.map((reminder) =>
      reminder.id === reminderId ? mapReminder(reminder) : reminder,
    ),
  };
}

export function selectRemindersForView(
  reminders: Reminder[],
  viewId: ReminderViewId,
): Reminder[] {
  if (viewId === 'matrix') {
    return reminders.filter((reminder) => reminder.status !== 'done').sort(compareManualReminderOrder);
  }
  if (viewId === 'done') {
    return reminders.filter((reminder) => reminder.status === 'done').sort(compareManualReminderOrder);
  }
  if (viewId === 'today')   return reminders.filter((r) => resolveReminderMatrixBucket(r) === 'urgentImportant').sort(compareManualReminderOrder);
  if (viewId === 'focus')   return reminders.filter((r) => resolveReminderMatrixBucket(r) === 'important').sort(compareManualReminderOrder);
  if (viewId === 'waiting') return reminders.filter((r) => resolveReminderMatrixBucket(r) === 'waiting').sort(compareManualReminderOrder);
  if (viewId === 'later')   return reminders.filter((r) => resolveReminderMatrixBucket(r) === 'later').sort(compareManualReminderOrder);

  const listId = viewId.slice('list:'.length);
  return reminders.filter((reminder) => reminder.listId === listId).sort(compareManualReminderOrder);
}

export function getVisibleReminders(snapshot: ReminderSnapshot, viewId = snapshot.selectedViewId): Reminder[] {
  return selectRemindersForView(snapshot.reminders, viewId);
}

export function setSingleFocus(snapshot: ReminderSnapshot, reminderId: string): ReminderSnapshot {
  return {
    ...snapshot,
    reminders: snapshot.reminders.map((reminder) => {
      if (reminder.id === reminderId) {
        return { ...reminder, status: 'focused', updatedAt: new Date().toISOString() };
      }
      if (reminder.status === 'focused') {
        return { ...reminder, status: 'open', updatedAt: new Date().toISOString() };
      }
      return reminder;
    }),
    selectedReminderId: reminderId,
  };
}

export function deleteReminder(snapshot: ReminderSnapshot, reminderId: string): ReminderSnapshot {
  const reminders = snapshot.reminders.filter((reminder) => reminder.id !== reminderId);
  const selectedReminderId =
    snapshot.selectedReminderId === reminderId
      ? getVisibleReminders({ ...snapshot, reminders })[0]?.id ?? null
      : snapshot.selectedReminderId;

  return {
    ...snapshot,
    reminders,
    selectedReminderId,
  };
}
