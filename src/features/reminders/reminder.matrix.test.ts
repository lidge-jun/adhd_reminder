import { describe, expect, it } from 'vitest';
import {
  matrixBucketToCreateInput,
  matrixBucketToUpdateInput,
  resolveReminderMatrixBucket,
  shouldApplyMatrixBucketMove,
  type MatrixBucket,
} from './reminder.matrix';
import { demoSnapshot } from './reminder.fixtures';
import { addReminderWithInput } from './reminder.store';

describe('reminder matrix mapping', () => {
  it('creates reminders with bucket-specific defaults', () => {
    expect(matrixBucketToCreateInput('urgentImportant', 'A')).toEqual({
      title: 'A',
      listId: 'today',
      initialStatus: 'open',
      priority: 'high',
    });
    expect(matrixBucketToCreateInput('waiting', 'B')).toEqual({
      title: 'B',
      listId: 'waiting',
      initialStatus: 'waiting',
      priority: 'normal',
    });
  });

  it('moves reminders by patching list, status, and priority', () => {
    expect(matrixBucketToUpdateInput('later')).toEqual({
      listId: 'later',
      status: 'open',
      priority: 'low',
    });
  });

  it('places reminders created from each bucket back into that bucket', () => {
    const buckets: MatrixBucket[] = ['urgentImportant', 'important', 'waiting', 'later'];

    for (const bucket of buckets) {
      const next = addReminderWithInput(
        demoSnapshot,
        matrixBucketToCreateInput(bucket, `${bucket} test`),
      );

      expect(resolveReminderMatrixBucket(next.reminders[0]!)).toBe(bucket);
    }
  });

  it('classifies each active seed reminder into one matrix bucket', () => {
    expect(
      demoSnapshot.reminders
        .filter((reminder) => reminder.status !== 'done')
        .map((reminder) => resolveReminderMatrixBucket(reminder)),
    ).toEqual(['urgentImportant', 'important', 'waiting']);
  });

  it('keeps focused reminders in urgentImportant even when list metadata is later', () => {
    const focusedLater = {
      ...demoSnapshot.reminders[1]!,
      listId: 'later',
      status: 'focused' as const,
      priority: 'low' as const,
    };

    expect(resolveReminderMatrixBucket(focusedLater)).toBe('urgentImportant');
    expect(shouldApplyMatrixBucketMove(focusedLater, 'urgentImportant')).toBe(false);
  });
});
