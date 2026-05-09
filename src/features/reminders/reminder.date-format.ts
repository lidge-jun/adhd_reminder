import type { ReminderLocale } from './reminder.i18n';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function formatRelativeDate(
  iso: string | null,
  locale: ReminderLocale,
  now: Date = new Date(),
): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const today = startOfDay(now);
  const target = startOfDay(date);
  const diffDays = Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);

  const hasTime = !(date.getHours() === 0 && date.getMinutes() === 0);
  const timeLabel = hasTime ? formatTime(date, locale) : '';

  if (diffDays === 0) {
    return joinParts(locale === 'ko' ? '오늘' : 'Today', timeLabel);
  }
  if (diffDays === 1) {
    return joinParts(locale === 'ko' ? '내일' : 'Tomorrow', timeLabel);
  }
  if (diffDays === -1) {
    return joinParts(locale === 'ko' ? '어제' : 'Yesterday', timeLabel);
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  const dateLabel = sameYear ? formatSameYear(date, locale) : formatDifferentYear(date, locale);
  return joinParts(dateLabel, timeLabel);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function joinParts(left: string, right: string): string {
  if (!right) {
    return left;
  }
  return `${left} ${right}`;
}

function formatTime(date: Date, locale: ReminderLocale): string {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const minutePart = minute.toString().padStart(2, '0');
  if (locale === 'ko') {
    const period = hour < 12 ? '오전' : '오후';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return minute === 0 ? `${period} ${hour12}시` : `${period} ${hour12}:${minutePart}`;
  }
  const period = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return minute === 0 ? `${hour12} ${period}` : `${hour12}:${minutePart} ${period}`;
}

const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;
const EN_WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const EN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function formatSameYear(date: Date, locale: ReminderLocale): string {
  if (locale === 'ko') {
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${KO_WEEKDAYS[date.getDay()]})`;
  }
  return `${EN_WEEKDAYS_SHORT[date.getDay()]} ${EN_MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
}

function formatDifferentYear(date: Date, locale: ReminderLocale): string {
  if (locale === 'ko') {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  }
  return `${EN_MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
