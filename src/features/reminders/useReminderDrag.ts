import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { MatrixBucket } from './reminder.matrix';

const POINTER_DRAG_THRESHOLD = 6;

export type ReminderDropTarget =
  | { kind: 'bucket'; bucket: MatrixBucket }
  | { kind: 'done' }
  | { kind: 'list'; listId: string };

export type ReminderDragPreview = {
  reminderId: string;
  title: string;
  x: number;
  y: number;
};

type PointerDragState = {
  reminderId: string;
  title: string;
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  active: boolean;
};

type UseReminderDragOptions = {
  onDrop: (reminderId: string, target: ReminderDropTarget) => Promise<void>;
};

type StartReminderDragOptions = {
  title: string;
};

type ReminderDragController = {
  draggedReminderId: string | null;
  dragActive: boolean;
  dragPreview: ReminderDragPreview | null;
  startReminderDrag: (
    reminderId: string,
    event: ReactPointerEvent<HTMLElement>,
    options: StartReminderDragOptions,
  ) => void;
  clearReminderDrag: () => void;
};

export function useReminderDrag({ onDrop }: UseReminderDragOptions): ReminderDragController {
  const [draggedReminderId, setDraggedReminderId] = useState<string | null>(null);
  const [pointerDragState, setPointerDragState] = useState<PointerDragState | null>(null);

  function clearReminderDrag(): void {
    setPointerDragState(null);
    setDraggedReminderId(null);
  }

  useEffect(() => {
    if (!pointerDragState) {
      return;
    }
    const activePointerDrag = pointerDragState;

    function handlePointerMove(event: PointerEvent): void {
      if (event.pointerId !== activePointerDrag.pointerId) {
        return;
      }

      setPointerDragState((current) => {
        if (!current || event.pointerId !== current.pointerId) {
          return current;
        }

        const deltaX = event.clientX - current.startX;
        const deltaY = event.clientY - current.startY;
        const active = current.active || Math.hypot(deltaX, deltaY) >= POINTER_DRAG_THRESHOLD;
        return {
          ...current,
          currentX: event.clientX,
          currentY: event.clientY,
          active,
        };
      });
    }

    function handlePointerUp(event: PointerEvent): void {
      if (event.pointerId !== activePointerDrag.pointerId) {
        return;
      }

      const deltaX = event.clientX - activePointerDrag.startX;
      const deltaY = event.clientY - activePointerDrag.startY;
      const movedEnough =
        activePointerDrag.active || Math.hypot(deltaX, deltaY) >= POINTER_DRAG_THRESHOLD;
      const target = movedEnough
        ? reminderDropTargetFromElement(document.elementFromPoint(event.clientX, event.clientY))
        : null;

      if (target) {
        void onDrop(activePointerDrag.reminderId, target).finally(clearReminderDrag);
      } else {
        clearReminderDrag();
      }
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', clearReminderDrag);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', clearReminderDrag);
    };
  }, [onDrop, pointerDragState]);

  function startReminderDrag(
    reminderId: string,
    event: ReactPointerEvent<HTMLElement>,
    options: StartReminderDragOptions,
  ): void {
    if (event.button !== 0) {
      return;
    }
    if (event.target instanceof HTMLElement && event.target.closest('.row-check, .row-detail-button')) {
      return;
    }

    setDraggedReminderId(reminderId);
    setPointerDragState({
      reminderId,
      title: options.title,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      active: false,
    });
  }

  const dragPreview = useMemo<ReminderDragPreview | null>(() => {
    if (!pointerDragState || !pointerDragState.active) {
      return null;
    }
    return {
      reminderId: pointerDragState.reminderId,
      title: pointerDragState.title,
      x: pointerDragState.currentX,
      y: pointerDragState.currentY,
    };
  }, [pointerDragState]);

  return {
    draggedReminderId,
    dragActive: dragPreview !== null,
    dragPreview,
    startReminderDrag,
    clearReminderDrag,
  };
}

function reminderDropTargetFromElement(element: Element | null): ReminderDropTarget | null {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  const target = element.closest<HTMLElement>(
    '[data-reminder-drop-bucket], [data-reminder-drop-action], [data-reminder-drop-list-id]',
  );
  if (!target) {
    return null;
  }

  const bucket = target.dataset.reminderDropBucket;
  if (isMatrixBucket(bucket)) {
    return { kind: 'bucket', bucket };
  }

  if (target.dataset.reminderDropAction === 'done') {
    return { kind: 'done' };
  }

  const listId = target.dataset.reminderDropListId;
  return listId ? { kind: 'list', listId } : null;
}

function isMatrixBucket(value: string | undefined): value is MatrixBucket {
  return value === 'urgentImportant' || value === 'important' || value === 'waiting' || value === 'later';
}
