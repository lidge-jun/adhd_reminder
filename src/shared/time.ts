export function formatShortDate(value: string | null): string {
  if (!value) {
    return '날짜 없음';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '날짜 오류';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
