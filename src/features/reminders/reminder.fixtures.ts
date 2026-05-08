import type { ReminderSnapshot } from './reminder.schema';

const now = '2026-05-08T02:08:00.000Z';

export const seedSnapshot: ReminderSnapshot = {
  schemaVersion: 1,
  selectedViewId: 'today',
  selectedReminderId: null,
  lists: [
    { id: 'today', name: '오늘', accent: '#0f8fd6' },
    { id: 'focus', name: '집중', accent: '#d4477f' },
    { id: 'waiting', name: '대기', accent: '#b67818' },
    { id: 'later', name: '나중에', accent: '#667085' },
  ],
  reminders: [],
};

export const demoSnapshot: ReminderSnapshot = {
  ...seedSnapshot,
  selectedReminderId: 'r-focus',
  reminders: [
    {
      id: 'r-focus',
      title: 'Todo i2i 후보 확인',
      notes: '첨부 스케치 기반으로 ADHD Todo UI 후보를 고른다.',
      listId: 'today',
      status: 'focused',
      priority: 'high',
      dueAt: '2026-05-08T03:00:00.000Z',
      remindAt: '2026-05-08T02:40:00.000Z',
      linkedInstance: ':3333',
      subtasks: [
        { id: 's1', title: '후보 B/D 비교', done: false },
        { id: 's2', title: '컷오프 UX 결정', done: false },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'r-next-1',
      title: 'cli-jaw 미리알림 계획 정리',
      notes: '구현 범위와 검증 명령을 단계별로 쪼갠다.',
      listId: 'today',
      status: 'open',
      priority: 'normal',
      dueAt: null,
      remindAt: null,
      linkedInstance: null,
      subtasks: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'r-waiting',
      title: 'Tauri 알림 권한 확인',
      notes: 'macOS 권한 요청과 브라우저 대체 동작을 분리한다.',
      listId: 'waiting',
      status: 'waiting',
      priority: 'normal',
      dueAt: null,
      remindAt: null,
      linkedInstance: null,
      subtasks: [],
      createdAt: now,
      updatedAt: now,
    },
  ],
};
