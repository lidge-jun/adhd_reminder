export type ReminderStatus = 'open' | 'focused' | 'waiting' | 'done';
export type ReminderPriority = 'low' | 'normal' | 'high';
export type SmartListId = 'today' | 'focus' | 'waiting' | 'later' | 'done';
export type ReminderViewId = SmartListId | `list:${string}`;

export type ReminderList = {
  id: string;
  name: string;
  accent: string;
};

export type ReminderSubtask = {
  id: string;
  title: string;
  done: boolean;
};

export type Reminder = {
  id: string;
  title: string;
  notes: string;
  listId: string;
  status: ReminderStatus;
  priority: ReminderPriority;
  dueAt: string | null;
  remindAt: string | null;
  linkedInstance: string | null;
  subtasks: ReminderSubtask[];
  createdAt: string;
  updatedAt: string;
};

export type ReminderDataSnapshot = {
  schemaVersion: 1;
  lists: ReminderList[];
  reminders: Reminder[];
};

export type ReminderViewState = {
  selectedViewId: ReminderViewId;
  selectedReminderId: string | null;
};

export type ReminderSnapshot = ReminderDataSnapshot & ReminderViewState;

export type CreateReminderInput = {
  title: string;
  listId: string;
  initialStatus?: Exclude<ReminderStatus, 'focused'>;
  priority?: ReminderPriority;
};

export type UpdateReminderInput = {
  title?: string;
  notes?: string;
  listId?: string;
  status?: Exclude<ReminderStatus, 'focused'>;
  priority?: ReminderPriority;
  dueAt?: string | null;
  remindAt?: string | null;
  linkedInstance?: string | null;
  subtasks?: ReminderSubtask[];
};
