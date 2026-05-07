import type { CreateReminderInput, Reminder, UpdateReminderInput } from './reminder.schema';

export type MatrixBucket = 'urgentImportant' | 'important' | 'waiting' | 'later';

export function matrixBucketToCreateInput(
  bucket: MatrixBucket,
  title: string,
): CreateReminderInput {
  const base = matrixBucketDefaults(bucket);
  return {
    title,
    listId: base.listId,
    initialStatus: base.status,
    priority: base.priority,
  };
}

export function matrixBucketToUpdateInput(bucket: MatrixBucket): UpdateReminderInput {
  return matrixBucketDefaults(bucket);
}

export function resolveReminderMatrixBucket(reminder: Reminder): MatrixBucket | null {
  if (reminder.status === 'done') {
    return null;
  }
  if (reminder.status === 'focused') {
    return 'urgentImportant';
  }
  if (reminder.status === 'waiting') {
    return 'waiting';
  }
  if (reminder.listId === 'later' || reminder.priority === 'low') {
    return 'later';
  }
  if (reminder.priority === 'high') {
    return 'urgentImportant';
  }
  return 'important';
}

export function shouldApplyMatrixBucketMove(reminder: Reminder, bucket: MatrixBucket): boolean {
  return resolveReminderMatrixBucket(reminder) !== bucket;
}

function matrixBucketDefaults(bucket: MatrixBucket): Required<Pick<UpdateReminderInput, 'listId' | 'status' | 'priority'>> {
  if (bucket === 'urgentImportant') {
    return { listId: 'today', status: 'open', priority: 'high' };
  }
  if (bucket === 'important') {
    return { listId: 'today', status: 'open', priority: 'normal' };
  }
  if (bucket === 'waiting') {
    return { listId: 'waiting', status: 'waiting', priority: 'normal' };
  }
  return { listId: 'later', status: 'open', priority: 'low' };
}
