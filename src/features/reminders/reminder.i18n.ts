export type ReminderLocale = 'ko' | 'en';

export type TranslationKey =
  | 'app.title'
  | 'app.localBrowser'
  | 'app.localMac'
  | 'nav.today'
  | 'nav.focus'
  | 'nav.waiting'
  | 'nav.later'
  | 'nav.done'
  | 'nav.myLists'
  | 'nav.settings'
  | 'matrix.title'
  | 'matrix.items'
  | 'matrix.browserStore'
  | 'matrix.rustStore'
  | 'matrix.urgentImportant'
  | 'matrix.important'
  | 'matrix.waiting'
  | 'matrix.later'
  | 'matrix.create'
  | 'matrix.empty'
  | 'matrix.importance'
  | 'matrix.urgency'
  | 'rail.kicker'
  | 'rail.title'
  | 'rail.focusNow'
  | 'rail.noFocus'
  | 'rail.next'
  | 'rail.cutoff'
  | 'error.mutation'
  | 'settings.title'
  | 'settings.language'
  | 'settings.korean'
  | 'settings.english'
  | 'settings.close'
  | 'popover.title'
  | 'popover.notes'
  | 'popover.due'
  | 'popover.remind'
  | 'popover.none'
  | 'action.focus'
  | 'action.notify'
  | 'action.testNotify'
  | 'action.delete'
  | 'action.close'
  | 'status.open'
  | 'status.focused'
  | 'status.waiting'
  | 'status.done'
  | 'priority.low'
  | 'priority.normal'
  | 'priority.high';

const messages: Record<ReminderLocale, Record<TranslationKey, string>> = {
  ko: {
    'app.title': '미리알림',
    'app.localBrowser': '로컬 브라우저',
    'app.localMac': '이 Mac',
    'nav.today': '오늘',
    'nav.focus': '집중',
    'nav.waiting': '대기',
    'nav.later': '나중에',
    'nav.done': '완료',
    'nav.myLists': '나의 목록',
    'nav.settings': '설정',
    'matrix.title': '우선순위 매트릭스',
    'matrix.items': '개 항목',
    'matrix.browserStore': '브라우저 저장',
    'matrix.rustStore': 'Rust 저장',
    'matrix.urgentImportant': '중요하고 급한 것',
    'matrix.important': '중요하지만 급하지 않은 것',
    'matrix.waiting': '기다림 / 위임',
    'matrix.later': '나중에 볼 것',
    'matrix.create': '새로 만들기',
    'matrix.empty': '비어 있음',
    'matrix.importance': '중요도',
    'matrix.urgency': '긴급도',
    'rail.kicker': '오늘의 스케치',
    'rail.title': '우선순위',
    'rail.focusNow': '지금 집중',
    'rail.noFocus': '집중 항목 없음',
    'rail.next': '다음 행동 3개',
    'rail.cutoff': '컷오프: 다음 행동 3개 밖의 일은 지금 화면에서 밀어둡니다.',
    'error.mutation': '변경사항을 저장하지 못했습니다. 잠시 후 다시 시도하세요.',
    'settings.title': '설정',
    'settings.language': '언어',
    'settings.korean': '한국어',
    'settings.english': 'English',
    'settings.close': '닫기',
    'popover.title': '미리알림',
    'popover.notes': '메모',
    'popover.due': '마감',
    'popover.remind': '알림',
    'popover.none': '없음',
    'action.focus': '집중',
    'action.notify': '알림',
    'action.testNotify': '테스트 알림',
    'action.delete': '삭제',
    'action.close': '닫기',
    'status.open': '열림',
    'status.focused': '집중',
    'status.waiting': '대기',
    'status.done': '완료',
    'priority.low': '낮음',
    'priority.normal': '보통',
    'priority.high': '높음',
  },
  en: {
    'app.title': 'Reminders',
    'app.localBrowser': 'Local Browser',
    'app.localMac': 'This Mac',
    'nav.today': 'Today',
    'nav.focus': 'Focus',
    'nav.waiting': 'Waiting',
    'nav.later': 'Later',
    'nav.done': 'Done',
    'nav.myLists': 'My Lists',
    'nav.settings': 'Settings',
    'matrix.title': 'Priority Matrix',
    'matrix.items': ' items',
    'matrix.browserStore': 'Browser Store',
    'matrix.rustStore': 'Rust Store',
    'matrix.urgentImportant': 'Important and Urgent',
    'matrix.important': 'Important, Not Urgent',
    'matrix.waiting': 'Waiting / Delegated',
    'matrix.later': 'Later',
    'matrix.create': 'New Reminder',
    'matrix.empty': 'Empty',
    'matrix.importance': 'Importance',
    'matrix.urgency': 'Urgency',
    'rail.kicker': "Today's Sketch",
    'rail.title': 'Priority',
    'rail.focusNow': 'Focus Now',
    'rail.noFocus': 'No focus item',
    'rail.next': 'Next 3 Actions',
    'rail.cutoff': 'Cutoff: keep everything outside the next 3 actions off this screen.',
    'error.mutation': 'Could not save the change. Try again in a moment.',
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.korean': '한국어',
    'settings.english': 'English',
    'settings.close': 'Close',
    'popover.title': 'Reminder',
    'popover.notes': 'Notes',
    'popover.due': 'Due',
    'popover.remind': 'Reminder',
    'popover.none': 'None',
    'action.focus': 'Focus',
    'action.notify': 'Notify',
    'action.testNotify': 'Test notification',
    'action.delete': 'Delete',
    'action.close': 'Close',
    'status.open': 'Open',
    'status.focused': 'Focused',
    'status.waiting': 'Waiting',
    'status.done': 'Done',
    'priority.low': 'Low',
    'priority.normal': 'Normal',
    'priority.high': 'High',
  },
};

export type ReminderTranslator = (key: TranslationKey) => string;

export function createReminderTranslator(locale: ReminderLocale): ReminderTranslator {
  return (key) => messages[locale][key];
}
