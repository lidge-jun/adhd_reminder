import {
  Archive,
  Bell,
  CalendarBlank,
  CircleDashed,
  ListChecks,
  GearSix,
  SquaresFour,
  Target,
} from '@phosphor-icons/react';
import type { ReminderList, ReminderSnapshot, ReminderViewId, SmartListId } from '../reminder.schema';
import type { ReminderTranslator } from '../reminder.i18n';
import { cn } from '../../../shared/cn';

type SidebarProps = {
  snapshot: ReminderSnapshot;
  isNative: boolean;
  t: ReminderTranslator;
  onSelectView: (viewId: ReminderViewId) => void;
  onOpenSettings: () => void;
};

const smartLists = [
  { id: 'today', labelKey: 'nav.today', icon: CalendarBlank },
  { id: 'focus', labelKey: 'nav.focus', icon: Target },
  { id: 'waiting', labelKey: 'nav.waiting', icon: Bell },
  { id: 'later', labelKey: 'nav.later', icon: CircleDashed },
  { id: 'done', labelKey: 'nav.done', icon: Archive },
] as const;

export function Sidebar({
  snapshot,
  isNative,
  t,
  onSelectView,
  onOpenSettings,
}: SidebarProps): React.JSX.Element {
  return (
    <aside className="sidebar" aria-label="Reminder lists">
      <div className="brand-lockup">
        <ListChecks size={20} weight="duotone" />
        <div>
          <strong>{t('app.title')}</strong>
          <span>{isNative ? t('app.localMac') : t('app.localBrowser')}</span>
        </div>
      </div>

      <nav className="smart-list-nav" aria-label="Smart lists">
        <button
          className={cn('smart-list-button', 'is-hero', snapshot.selectedViewId === 'matrix' && 'is-active')}
          type="button"
          onClick={() => onSelectView('matrix')}
        >
          <SquaresFour size={17} />
          <span>{t('nav.matrix')}</span>
          <strong>{snapshot.reminders.filter((reminder) => reminder.status !== 'done').length}</strong>
        </button>
        {smartLists.map((item) => {
          const Icon = item.icon;
          const count = countForSmartList(snapshot, item.id);

          return (
            <button
              className={cn('smart-list-button', snapshot.selectedViewId === item.id && 'is-active')}
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
            >
              <Icon size={17} />
              <span>{t(item.labelKey)}</span>
              <strong>{count}</strong>
            </button>
          );
        })}
      </nav>

      <button className="settings-button" type="button" onClick={onOpenSettings}>
        <GearSix size={17} />
        <span>{t('nav.settings')}</span>
      </button>

      <div className="sidebar-section-label">{t('nav.myLists')}</div>
      <nav className="user-list-nav" aria-label="User lists">
        {snapshot.lists.map((list) => (
          <UserListButton
            key={list.id}
            list={list}
            active={snapshot.selectedViewId === `list:${list.id}`}
            count={snapshot.reminders.filter((reminder) => reminder.listId === list.id).length}
            onSelectView={onSelectView}
          />
        ))}
      </nav>
    </aside>
  );
}

type UserListButtonProps = {
  list: ReminderList;
  active: boolean;
  count: number;
  onSelectView: (viewId: ReminderViewId) => void;
};

function UserListButton({ list, active, count, onSelectView }: UserListButtonProps): React.JSX.Element {
  return (
    <button
      className={cn('user-list-button', active && 'is-active')}
      type="button"
      onClick={() => onSelectView(`list:${list.id}`)}
    >
      <i style={{ '--list-accent': list.accent } as React.CSSProperties} />
      <span>{list.name}</span>
      <strong>{count}</strong>
    </button>
  );
}

function countForSmartList(snapshot: ReminderSnapshot, id: SmartListId): number {
  if (id === 'done') {
    return snapshot.reminders.filter((reminder) => reminder.status === 'done').length;
  }

  if (id === 'focus') {
    return snapshot.reminders.filter((reminder) => reminder.status === 'focused').length;
  }

  if (id === 'waiting') {
    return snapshot.reminders.filter((reminder) => reminder.status === 'waiting').length;
  }

  return snapshot.reminders.filter((reminder) => reminder.listId === id && reminder.status !== 'done').length;
}
