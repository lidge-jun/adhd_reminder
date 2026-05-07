import { useEffect, useMemo, useState } from 'react';
import type {
  Reminder,
  ReminderDataSnapshot,
  ReminderSnapshot,
  ReminderViewId,
  ReminderViewState,
  UpdateReminderInput,
} from './reminder.schema';
import {
  matrixBucketToCreateInput,
  matrixBucketToUpdateInput,
  resolveReminderMatrixBucket,
  shouldApplyMatrixBucketMove,
  type MatrixBucket,
} from './reminder.matrix';
import {
  addReminderWithInput,
  createInitialView,
  deleteReminder,
  getVisibleReminders,
  mergeSnapshot,
  patchReminder,
  selectView,
  setSingleFocus,
  toggleReminder,
} from './reminder.store';
import {
  createReminderNative,
  deleteReminderNative,
  isTauriRuntime,
  loadReminderData,
  loadReminderSnapshot,
  saveReminderSnapshot,
  setFocusReminderNative,
  updateReminderNative,
} from './tauri-api';

type ControllerStatus = 'loading' | 'ready' | 'error';

export type ReminderController = {
  snapshot: ReminderSnapshot | null;
  selectedReminder: Reminder | null;
  visibleReminders: Reminder[];
  matrixGroups: MatrixGroups;
  status: ControllerStatus;
  isNative: boolean;
  selectViewId: (viewId: ReminderViewId) => void;
  selectReminder: (reminderId: string) => void;
  toggleDone: (reminderId: string) => Promise<void>;
  focusReminder: (reminderId: string) => Promise<void>;
  deleteReminderById: (reminderId: string) => Promise<void>;
  updateReminderById: (reminderId: string, input: UpdateReminderInput) => Promise<void>;
  addReminderToBucket: (bucket: MatrixBucket, title: string) => Promise<void>;
  moveReminderToBucket: (reminderId: string, bucket: MatrixBucket) => Promise<void>;
  moveSelection: (direction: 1 | -1) => void;
};

export type MatrixGroups = {
  urgentImportant: Reminder[];
  important: Reminder[];
  waiting: Reminder[];
  later: Reminder[];
};

export function useReminderController(): ReminderController {
  const [data, setData] = useState<ReminderDataSnapshot | null>(null);
  const [view, setView] = useState<ReminderViewState | null>(null);
  const [status, setStatus] = useState<ControllerStatus>('loading');
  const [isNative] = useState(() => isTauriRuntime());

  useEffect(() => {
    let active = true;

    async function hydrate(): Promise<void> {
      try {
        if (isNative) {
          const loaded = await loadReminderData();
          if (!active) {
            return;
          }
          setData(loaded);
          setView(createInitialView(loaded));
        } else {
          const loaded = await loadReminderSnapshot();
          if (!active) {
            return;
          }
          setData(loaded);
          setView({
            selectedViewId: loaded.selectedViewId,
            selectedReminderId: loaded.selectedReminderId,
          });
        }
        setStatus('ready');
      } catch (error) {
        console.error('[reminders] hydration failed', error);
        if (active) {
          setStatus('error');
        }
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, [isNative]);

  const snapshot = useMemo(() => {
    if (!data || !view) {
      return null;
    }
    return mergeSnapshot(data, view);
  }, [data, view]);

  useEffect(() => {
    if (!snapshot || isNative || status !== 'ready') {
      return;
    }
    void saveReminderSnapshot(snapshot);
  }, [isNative, snapshot, status]);

  const visibleReminders = useMemo(() => (snapshot ? getVisibleReminders(snapshot) : []), [snapshot]);
  const selectedReminder = useMemo(() => {
    if (!snapshot?.selectedReminderId) {
      return null;
    }
    return snapshot.reminders.find((reminder) => reminder.id === snapshot.selectedReminderId) ?? null;
  }, [snapshot]);
  const matrixGroups = useMemo(() => groupForMatrix(snapshot?.reminders ?? []), [snapshot]);

  function applyBrowser(next: ReminderSnapshot): void {
    setData(next);
    setView({
      selectedViewId: next.selectedViewId,
      selectedReminderId: next.selectedReminderId,
    });
  }

  function selectViewId(viewId: ReminderViewId): void {
    if (!snapshot) {
      return;
    }
    const next = selectView(snapshot, viewId);
    setView({
      selectedViewId: next.selectedViewId,
      selectedReminderId: next.selectedReminderId,
    });
  }

  function selectReminder(reminderId: string): void {
    setView((current) =>
      current
        ? {
            ...current,
            selectedReminderId: reminderId,
          }
        : current,
    );
  }

  async function toggleDone(reminderId: string): Promise<void> {
    if (!snapshot) {
      return;
    }

    const reminder = snapshot.reminders.find((item) => item.id === reminderId);
    if (!reminder) {
      return;
    }

    const input: UpdateReminderInput = {
      status: reminder.status === 'done' ? 'open' : 'done',
    };

    if (isNative) {
      setData(await updateReminderNative(reminderId, input));
    } else {
      applyBrowser(toggleReminder(snapshot, reminderId));
    }
  }

  async function focusReminder(reminderId: string): Promise<void> {
    if (!snapshot) {
      return;
    }

    if (isNative) {
      setData(await setFocusReminderNative(reminderId));
      setView((current) => (current ? { ...current, selectedReminderId: reminderId } : current));
    } else {
      applyBrowser(setSingleFocus(snapshot, reminderId));
    }
  }

  async function deleteReminderById(reminderId: string): Promise<void> {
    if (!snapshot) {
      return;
    }

    if (isNative) {
      const next = await deleteReminderNative(reminderId);
      setData(next);
      setView((current) =>
        current
          ? {
              ...current,
              selectedReminderId: getVisibleReminders(mergeSnapshot(next, current))[0]?.id ?? null,
            }
          : current,
      );
    } else {
      applyBrowser(deleteReminder(snapshot, reminderId));
    }
  }

  async function updateReminderById(reminderId: string, input: UpdateReminderInput): Promise<void> {
    if (!snapshot) {
      return;
    }

    if (isNative) {
      setData(await updateReminderNative(reminderId, input));
    } else {
      applyBrowser(patchReminder(snapshot, reminderId, input));
    }
  }

  async function addReminderToBucket(bucket: MatrixBucket, title: string): Promise<void> {
    if (!snapshot || title.trim().length === 0) {
      return;
    }

    const input = matrixBucketToCreateInput(bucket, title);
    if (isNative) {
      const next = await createReminderNative(input);
      setData(next);
      setView((current) => ({
        selectedViewId: current?.selectedViewId ?? 'today',
        selectedReminderId: next.reminders[0]?.id ?? current?.selectedReminderId ?? null,
      }));
    } else {
      applyBrowser(addReminderWithInput(snapshot, input));
    }
  }

  async function moveReminderToBucket(reminderId: string, bucket: MatrixBucket): Promise<void> {
    if (!snapshot) {
      return;
    }

    const reminder = snapshot.reminders.find((item) => item.id === reminderId);
    if (!reminder || !shouldApplyMatrixBucketMove(reminder, bucket)) {
      return;
    }

    const input = matrixBucketToUpdateInput(bucket);
    if (isNative) {
      setData(await updateReminderNative(reminderId, input));
    } else {
      applyBrowser(patchReminder(snapshot, reminderId, input));
    }
  }

  function moveSelection(direction: 1 | -1): void {
    if (!snapshot || visibleReminders.length === 0) {
      return;
    }

    const currentIndex = visibleReminders.findIndex(
      (reminder) => reminder.id === snapshot.selectedReminderId,
    );
    const nextIndex =
      currentIndex === -1
        ? 0
        : Math.min(Math.max(currentIndex + direction, 0), visibleReminders.length - 1);
    const nextReminder = visibleReminders[nextIndex];

    if (nextReminder) {
      selectReminder(nextReminder.id);
    }
  }

  return {
    snapshot,
    selectedReminder,
    visibleReminders,
    matrixGroups,
    status,
    isNative,
    selectViewId,
    selectReminder,
    toggleDone,
    focusReminder,
    deleteReminderById,
    updateReminderById,
    addReminderToBucket,
    moveReminderToBucket,
    moveSelection,
  };
}

function groupForMatrix(reminders: Reminder[]): MatrixGroups {
  const groups: MatrixGroups = {
    urgentImportant: [],
    important: [],
    waiting: [],
    later: [],
  };

  for (const reminder of reminders) {
    const bucket = resolveReminderMatrixBucket(reminder);
    if (bucket === 'urgentImportant') {
      groups.urgentImportant.push(reminder);
    } else if (bucket === 'important') {
      groups.important.push(reminder);
    } else if (bucket === 'waiting') {
      groups.waiting.push(reminder);
    } else if (bucket === 'later') {
      groups.later.push(reminder);
    }
  }

  return groups;
}
