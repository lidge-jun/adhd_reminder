import { useEffect, useMemo, useState } from 'react';
import { DragPreviewOverlay } from './components/DragPreviewOverlay';
import { MatrixQuadrant } from './components/MatrixQuadrant';
import { PriorityRail } from './components/PriorityRail';
import { ReminderEditorPopover } from './components/ReminderEditorPopover';
import { SettingsPanel } from './components/SettingsPanel';
import { Sidebar } from './components/Sidebar';
import { SingleListView } from './components/SingleListView';
import {
  createReminderTranslator,
  type ReminderLocale,
  type ReminderTranslator,
  type TranslationKey,
} from './reminder.i18n';
import type { MatrixBucket } from './reminder.matrix';
import type { SmartListId, UpdateReminderInput } from './reminder.schema';
import { useReminderController } from './useReminderController';
import { useReminderDrag, type ReminderDropTarget } from './useReminderDrag';

const LOCALE_STORAGE_KEY = 'jaw-reminders.locale';
const ZOOM_STORAGE_KEY = 'jaw-reminders.zoom';
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 1.6;
const ZOOM_STEP = 0.1;

export function RemindersApp(): React.JSX.Element {
  const controller = useReminderController();
  const [locale, setLocale] = useState<ReminderLocale>(() => loadLocale());
  const [zoom, setZoom] = useState<number>(() => loadZoom());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const t = useMemo(() => createReminderTranslator(locale), [locale]);
  const reminderDrag = useReminderDrag({ onDrop: moveReminderToDropTarget });

  useEffect(() => {
    document.documentElement.style.zoom = String(zoom);
    window.localStorage.setItem(ZOOM_STORAGE_KEY, String(zoom));
  }, [zoom]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (!(event.metaKey || event.ctrlKey)) {
        return;
      }
      if (event.key === '=' || event.key === '+') {
        event.preventDefault();
        setZoom((current) => clampZoom(current + ZOOM_STEP));
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        setZoom((current) => clampZoom(current - ZOOM_STEP));
      } else if (event.key === '0') {
        event.preventDefault();
        setZoom(1);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [bucketDrafts, setBucketDrafts] = useState<Record<MatrixBucket, string>>({
    urgentImportant: '',
    important: '',
    waiting: '',
    later: '',
  });
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);

  if (!controller.snapshot) {
    return (
      <main className="boot-screen">
        {controller.status === 'error' ? t('error.mutation') : 'Loading reminders'}
      </main>
    );
  }

  const snapshot = controller.snapshot;
  const editingReminder =
    snapshot.reminders.find((reminder) => reminder.id === editingReminderId) ?? null;
  const currentViewId = snapshot.selectedViewId;

  async function moveReminderToDropTarget(
    reminderId: string,
    target: ReminderDropTarget,
  ): Promise<void> {
    if (target.kind === 'bucket') {
      await controller.moveReminderToBucket(reminderId, target.bucket);
      return;
    }
    if (target.kind === 'done') {
      await controller.updateReminderById(reminderId, { status: 'done' });
      return;
    }
    await controller.updateReminderById(reminderId, inputForListDrop(target.listId));
  }

  return (
    <main
      className="app-shell"
      onKeyDown={(event) => {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
          return;
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          controller.moveSelection(1);
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          controller.moveSelection(-1);
        }
      }}
    >
      <Sidebar
        snapshot={controller.snapshot}
        isNative={controller.isNative}
        t={t}
        dragActive={reminderDrag.dragActive}
        onSelectView={controller.selectViewId}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <section className="matrix-pane" aria-label="Priority matrix">
        {controller.mutationError ? (
          <div className="mutation-banner" role="alert">
            <span>{t('error.mutation')}</span>
            <button type="button" onClick={controller.clearMutationError}>
              {t('action.close')}
            </button>
          </div>
        ) : null}
        <header className="matrix-titlebar">
          <div>
            <h1>{titleForView(currentViewId, t)}</h1>
            <p>{snapshot.reminders.length}{t('matrix.items')}</p>
          </div>
          <span>{controller.isNative ? t('matrix.rustStore') : t('matrix.browserStore')}</span>
        </header>

        {currentViewId === 'matrix' ? (
          <div className="matrix-board">
            <div className="matrix-axis matrix-axis-y" aria-hidden="true">
              <b>↑</b>
              <span lang={locale}>{t('matrix.importance')}</span>
            </div>
            <div className="matrix-axis matrix-axis-x" aria-hidden="true">
              <b>←</b>
              <span lang={locale}>{t('matrix.urgency')}</span>
            </div>
            <MatrixQuadrant
              bucket="urgentImportant"
              dragActive={reminderDrag.dragActive}
              title={t('matrix.urgentImportant')}
              tone="red"
              count={controller.matrixGroups.urgentImportant.length}
              reminders={controller.matrixGroups.urgentImportant}
              locale={locale}
              selectedReminderId={controller.snapshot.selectedReminderId}
              t={t}
              onSelect={controller.selectReminder}
              onOpenDetails={setEditingReminderId}
              onToggle={controller.toggleDone}
              draft={bucketDrafts.urgentImportant}
              onDraftChange={(value) => setBucketDrafts((drafts) => ({ ...drafts, urgentImportant: value }))}
              onAdd={async () => {
                await controller.addReminderToBucket('urgentImportant', bucketDrafts.urgentImportant);
                setBucketDrafts((drafts) => ({ ...drafts, urgentImportant: '' }));
              }}
              onPointerReminderStart={reminderDrag.startReminderDrag}
            />
            <MatrixQuadrant
              bucket="important"
              dragActive={reminderDrag.dragActive}
              title={t('matrix.important')}
              tone="green"
              count={controller.matrixGroups.important.length}
              reminders={controller.matrixGroups.important}
              locale={locale}
              selectedReminderId={controller.snapshot.selectedReminderId}
              t={t}
              onSelect={controller.selectReminder}
              onOpenDetails={setEditingReminderId}
              onToggle={controller.toggleDone}
              draft={bucketDrafts.important}
              onDraftChange={(value) => setBucketDrafts((drafts) => ({ ...drafts, important: value }))}
              onAdd={async () => {
                await controller.addReminderToBucket('important', bucketDrafts.important);
                setBucketDrafts((drafts) => ({ ...drafts, important: '' }));
              }}
              onPointerReminderStart={reminderDrag.startReminderDrag}
            />
            <MatrixQuadrant
              bucket="waiting"
              dragActive={reminderDrag.dragActive}
              title={t('matrix.waiting')}
              tone="amber"
              count={controller.matrixGroups.waiting.length}
              reminders={controller.matrixGroups.waiting}
              locale={locale}
              selectedReminderId={controller.snapshot.selectedReminderId}
              t={t}
              onSelect={controller.selectReminder}
              onOpenDetails={setEditingReminderId}
              onToggle={controller.toggleDone}
              draft={bucketDrafts.waiting}
              onDraftChange={(value) => setBucketDrafts((drafts) => ({ ...drafts, waiting: value }))}
              onAdd={async () => {
                await controller.addReminderToBucket('waiting', bucketDrafts.waiting);
                setBucketDrafts((drafts) => ({ ...drafts, waiting: '' }));
              }}
              onPointerReminderStart={reminderDrag.startReminderDrag}
            />
            <MatrixQuadrant
              bucket="later"
              dragActive={reminderDrag.dragActive}
              title={t('matrix.later')}
              tone="blue"
              count={controller.matrixGroups.later.length}
              reminders={controller.matrixGroups.later}
              locale={locale}
              selectedReminderId={controller.snapshot.selectedReminderId}
              t={t}
              onSelect={controller.selectReminder}
              onOpenDetails={setEditingReminderId}
              onToggle={controller.toggleDone}
              draft={bucketDrafts.later}
              onDraftChange={(value) => setBucketDrafts((drafts) => ({ ...drafts, later: value }))}
              onAdd={async () => {
                await controller.addReminderToBucket('later', bucketDrafts.later);
                setBucketDrafts((drafts) => ({ ...drafts, later: '' }));
              }}
              onPointerReminderStart={reminderDrag.startReminderDrag}
            />
          </div>
        ) : (
          <SingleListView
            viewId={asSmartListId(currentViewId)}
            reminders={controller.visibleReminders}
            locale={locale}
            selectedReminderId={snapshot.selectedReminderId}
            t={t}
            draft={singleListDraftFor(currentViewId, bucketDrafts)}
            onDraftChange={(value) => updateBucketDraft(currentViewId, value, setBucketDrafts)}
            onAdd={async (bucket, title) => {
              await controller.addReminderToBucket(bucket, title);
              clearBucketDraftFor(bucket, setBucketDrafts);
            }}
            onSelect={controller.selectReminder}
            onOpenDetails={setEditingReminderId}
            onToggle={controller.toggleDone}
          />
        )}
      </section>

      <PriorityRail
        snapshot={controller.snapshot}
        visibleReminders={controller.visibleReminders}
        selectedReminder={controller.selectedReminder}
        t={t}
        onOpenDetails={setEditingReminderId}
        onToggle={controller.toggleDone}
      />

      <ReminderEditorPopover
        reminder={editingReminder}
        t={t}
        onClose={() => setEditingReminderId(null)}
        onFocus={controller.focusReminder}
        onDelete={async (reminderId) => {
          await controller.deleteReminderById(reminderId);
          setEditingReminderId(null);
        }}
        onTitleChange={(reminderId, title) => controller.updateReminderById(reminderId, { title })}
        onNotesChange={(reminderId, notes) => controller.updateReminderById(reminderId, { notes })}
        onDueChange={(reminderId, dueAt) => controller.updateReminderById(reminderId, { dueAt })}
        onRemindChange={(reminderId, remindAt) => controller.updateReminderById(reminderId, { remindAt })}
      />
      {reminderDrag.dragPreview ? (
        <DragPreviewOverlay
          title={reminderDrag.dragPreview.title}
          x={reminderDrag.dragPreview.x}
          y={reminderDrag.dragPreview.y}
        />
      ) : null}
      {settingsOpen ? (
        <SettingsPanel
          locale={locale}
          zoom={zoom}
          t={t}
          onLocaleChange={(nextLocale) => {
            setLocale(nextLocale);
            window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
          }}
          onZoomIn={() => setZoom((current) => clampZoom(current + ZOOM_STEP))}
          onZoomOut={() => setZoom((current) => clampZoom(current - ZOOM_STEP))}
          onZoomReset={() => setZoom(1)}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}
    </main>
  );
}

function loadLocale(): ReminderLocale {
  const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return saved === 'en' ? 'en' : 'ko';
}

function loadZoom(): number {
  const saved = window.localStorage.getItem(ZOOM_STORAGE_KEY);
  if (!saved) {
    return 1;
  }
  const parsed = Number.parseFloat(saved);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return clampZoom(parsed);
}

function clampZoom(value: number): number {
  if (value < ZOOM_MIN) return ZOOM_MIN;
  if (value > ZOOM_MAX) return ZOOM_MAX;
  return Math.round(value * 100) / 100;
}

const SMART_LIST_TITLE_KEY: Record<SmartListId, TranslationKey> = {
  today: 'matrix.urgentImportant',
  focus: 'matrix.important',
  waiting: 'matrix.waiting',
  later: 'matrix.later',
  done: 'nav.done',
};

const SMART_LIST_BUCKET: Record<Exclude<SmartListId, 'done'>, MatrixBucket> = {
  today: 'urgentImportant',
  focus: 'important',
  waiting: 'waiting',
  later: 'later',
};

function titleForView(viewId: string, t: ReminderTranslator): string {
  if (viewId === 'matrix') {
    return t('matrix.title');
  }
  if (viewId in SMART_LIST_TITLE_KEY) {
    return t(SMART_LIST_TITLE_KEY[viewId as SmartListId]);
  }
  return t('matrix.title');
}

function asSmartListId(viewId: string): SmartListId {
  if (viewId === 'today' || viewId === 'focus' || viewId === 'waiting' || viewId === 'later' || viewId === 'done') {
    return viewId;
  }
  return 'today';
}

function singleListDraftFor(viewId: string, drafts: Record<MatrixBucket, string>): string {
  const smart = asSmartListId(viewId);
  if (smart === 'done') {
    return '';
  }
  return drafts[SMART_LIST_BUCKET[smart]];
}

function updateBucketDraft(
  viewId: string,
  value: string,
  setDrafts: React.Dispatch<React.SetStateAction<Record<MatrixBucket, string>>>,
): void {
  const smart = asSmartListId(viewId);
  if (smart === 'done') {
    return;
  }
  const bucket = SMART_LIST_BUCKET[smart];
  setDrafts((current) => ({ ...current, [bucket]: value }));
}

function clearBucketDraftFor(
  bucket: MatrixBucket,
  setDrafts: React.Dispatch<React.SetStateAction<Record<MatrixBucket, string>>>,
): void {
  setDrafts((current) => ({ ...current, [bucket]: '' }));
}

function inputForListDrop(listId: string): UpdateReminderInput {
  if (listId === 'waiting') {
    return { listId, status: 'waiting', priority: 'normal' };
  }
  if (listId === 'later') {
    return { listId, status: 'open', priority: 'low' };
  }
  if (listId === 'focus') {
    return { listId, status: 'open', priority: 'normal' };
  }
  return { listId, status: 'open' };
}
