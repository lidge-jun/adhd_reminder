import { CheckCircle, Circle, DotsThree, Flag } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
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
import type { Reminder, SmartListId } from './reminder.schema';
import { useReminderController, type MatrixGroups } from './useReminderController';

const REMINDER_DRAG_MIME = 'application/x-jaw-reminder-id';
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
              title={t('matrix.urgentImportant')}
              tone="red"
              count={controller.matrixGroups.urgentImportant.length}
              reminders={controller.matrixGroups.urgentImportant}
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
              onDropReminder={controller.moveReminderToBucket}
            />
            <MatrixQuadrant
              bucket="important"
              title={t('matrix.important')}
              tone="green"
              count={controller.matrixGroups.important.length}
              reminders={controller.matrixGroups.important}
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
              onDropReminder={controller.moveReminderToBucket}
            />
            <MatrixQuadrant
              bucket="waiting"
              title={t('matrix.waiting')}
              tone="amber"
              count={controller.matrixGroups.waiting.length}
              reminders={controller.matrixGroups.waiting}
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
              onDropReminder={controller.moveReminderToBucket}
            />
            <MatrixQuadrant
              bucket="later"
              title={t('matrix.later')}
              tone="blue"
              count={controller.matrixGroups.later.length}
              reminders={controller.matrixGroups.later}
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
              onDropReminder={controller.moveReminderToBucket}
            />
          </div>
        ) : (
          <SingleListView
            viewId={asSmartListId(currentViewId)}
            reminders={controller.visibleReminders}
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

type MatrixQuadrantProps = {
  bucket: MatrixBucket;
  title: string;
  tone: 'red' | 'green' | 'amber' | 'blue';
  count: number;
  reminders: MatrixGroups[keyof MatrixGroups];
  selectedReminderId: string | null;
  t: ReminderTranslator;
  draft: string;
  onDraftChange: (value: string) => void;
  onAdd: () => Promise<void>;
  onSelect: (reminderId: string) => void;
  onOpenDetails: (reminderId: string) => void;
  onToggle: (reminderId: string) => Promise<void>;
  onDropReminder: (reminderId: string, bucket: MatrixBucket) => Promise<void>;
};

function MatrixQuadrant({
  bucket,
  title,
  tone,
  count,
  reminders,
  selectedReminderId,
  t,
  draft,
  onDraftChange,
  onAdd,
  onSelect,
  onOpenDetails,
  onToggle,
  onDropReminder,
}: MatrixQuadrantProps): React.JSX.Element {
  return (
    <section
      className={`matrix-quadrant tone-${tone}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const reminderId = event.dataTransfer.getData(REMINDER_DRAG_MIME);
        if (reminderId) {
          void onDropReminder(reminderId, bucket);
        }
      }}
    >
      <header>
        <h2>{title}</h2>
        <span>{count}</span>
      </header>
      <ul>
        {reminders.map((reminder) => (
          <MatrixReminderRow
            key={reminder.id}
            reminder={reminder}
            selected={selectedReminderId === reminder.id}
            t={t}
            onSelect={onSelect}
            onOpenDetails={onOpenDetails}
            onToggle={onToggle}
          />
        ))}
        <li className="matrix-inline-create">
          <Circle size={16} />
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onAdd();
            }}
          >
            <input
              aria-label={`${title} ${t('matrix.create')}`}
              placeholder={t('matrix.create')}
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
            />
          </form>
        </li>
        {reminders.length === 0 ? <li className="matrix-empty">{t('matrix.empty')}</li> : null}
      </ul>
    </section>
  );
}

type MatrixReminderRowProps = {
  reminder: Reminder;
  selected: boolean;
  t: ReminderTranslator;
  onSelect: (reminderId: string) => void;
  onOpenDetails: (reminderId: string) => void;
  onToggle: (reminderId: string) => Promise<void>;
};

function MatrixReminderRow({
  reminder,
  selected,
  t,
  onSelect,
  onOpenDetails,
  onToggle,
}: MatrixReminderRowProps): React.JSX.Element {
  const done = reminder.status === 'done';

  return (
    <li
      className={`matrix-reminder-row ${selected ? 'is-selected' : ''} ${done ? 'is-done' : ''}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData(REMINDER_DRAG_MIME, reminder.id);
      }}
    >
      <button type="button" className="row-check" aria-label={t(`status.${done ? 'open' : 'done'}` as TranslationKey)} onClick={() => void onToggle(reminder.id)}>
        {done ? <CheckCircle size={18} weight="fill" /> : <Circle size={18} weight="regular" />}
      </button>
      <button type="button" className="row-content" onClick={() => onSelect(reminder.id)}>
        <span>{reminder.title}</span>
        <small>{subtitleForReminder(reminder, t)}</small>
      </button>
      <button type="button" className="row-detail-button" aria-label={t('popover.title')} onClick={() => onOpenDetails(reminder.id)}>
        <DotsThree size={18} weight="bold" />
      </button>
      {reminder.priority === 'high' ? <Flag className="row-flag" size={15} weight="fill" /> : null}
    </li>
  );
}

function subtitleForReminder(reminder: Reminder, t: ReminderTranslator): string {
  const parts: string[] = [
    t(`status.${reminder.status}` as TranslationKey),
    t(`priority.${reminder.priority}` as TranslationKey),
  ];
  if (reminder.linkedInstance) {
    parts.push(reminder.linkedInstance);
  }
  return parts.join(' · ');
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
