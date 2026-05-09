import { describe, expect, it } from 'vitest';
import { formatRelativeDate } from './reminder.date-format';

const NOW = new Date(2026, 4, 8, 14, 0); // 2026-05-08 14:00 local

describe('formatRelativeDate', () => {
  it('returns empty for null', () => {
    expect(formatRelativeDate(null, 'ko', NOW)).toBe('');
    expect(formatRelativeDate(null, 'en', NOW)).toBe('');
  });

  it('returns empty for unparseable strings', () => {
    expect(formatRelativeDate('not-a-date', 'ko', NOW)).toBe('');
  });

  it('formats today with time (ko)', () => {
    const iso = new Date(2026, 4, 8, 15, 30).toISOString();
    expect(formatRelativeDate(iso, 'ko', NOW)).toBe('오늘 오후 3:30');
  });

  it('formats today with time (en)', () => {
    const iso = new Date(2026, 4, 8, 15, 30).toISOString();
    expect(formatRelativeDate(iso, 'en', NOW)).toBe('Today 3:30 PM');
  });

  it('omits time when at midnight', () => {
    const iso = new Date(2026, 4, 8, 0, 0).toISOString();
    expect(formatRelativeDate(iso, 'ko', NOW)).toBe('오늘');
    expect(formatRelativeDate(iso, 'en', NOW)).toBe('Today');
  });

  it('formats tomorrow', () => {
    const iso = new Date(2026, 4, 9, 9, 0).toISOString();
    expect(formatRelativeDate(iso, 'ko', NOW)).toBe('내일 오전 9시');
    expect(formatRelativeDate(iso, 'en', NOW)).toBe('Tomorrow 9 AM');
  });

  it('formats yesterday', () => {
    const iso = new Date(2026, 4, 7, 12, 0).toISOString();
    expect(formatRelativeDate(iso, 'ko', NOW)).toBe('어제 오후 12시');
    expect(formatRelativeDate(iso, 'en', NOW)).toBe('Yesterday 12 PM');
  });

  it('formats same-year date with weekday (ko)', () => {
    const iso = new Date(2026, 4, 12, 0, 0).toISOString();
    expect(formatRelativeDate(iso, 'ko', NOW)).toBe('5월 12일 (화)');
  });

  it('formats same-year date with weekday (en)', () => {
    const iso = new Date(2026, 4, 12, 0, 0).toISOString();
    expect(formatRelativeDate(iso, 'en', NOW)).toBe('Tue May 12');
  });

  it('formats different-year date', () => {
    const iso = new Date(2027, 0, 3, 10, 15).toISOString();
    expect(formatRelativeDate(iso, 'ko', NOW)).toBe('2027년 1월 3일 오전 10:15');
    expect(formatRelativeDate(iso, 'en', NOW)).toBe('Jan 3, 2027 10:15 AM');
  });
});
