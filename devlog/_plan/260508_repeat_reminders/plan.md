# 반복 리마인더

## Goal

"매일", "매주 월요일", "매월 1일" 같은 반복 규칙을 설정하면 완료 시 자동으로 다음 occurrence
리마인더가 생성된다. Apple Reminders 패턴: 원본은 done, 새 항목은 다음 dueAt으로 open.

## Depends On

- `260508_alarm_scheduler` — 다음 occurrence 알림은 폴링 루프와 `lastNotifiedAt` 메커니즘에
  의존한다. 알림 스케줄러 plan이 먼저 머지되어야 한다.

## Current Signals

- 현재 스키마에 반복 관련 필드 없음.
- `ReminderEditorPopover.tsx`는 169라인. 반복 UI 추가 시 300+ 예상. 500 초과 위험 시 split.
- Rust 도메인/서비스/스토리지 레이어 분리됨:
  `src-tauri/src/reminders/{domain.rs, service.rs, storage.rs}`. JSON 마이그레이션은
  `storage.rs`의 load 경로에 추가.

## P1 — 스키마

- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/reminder.schema.ts`
  ```ts
  type RecurrenceRule = {
    kind: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;            // ≥1
    weekdays?: number[];         // weekly: 0=일..6=토
    endAt?: string | null;
  };
  // Reminder { ..., recurrence: RecurrenceRule | null }
  ```
- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src-tauri/src/reminders/domain.rs`
  - `RecurrenceKind` enum + `RecurrenceRule` struct (`#[derive(Serialize, Deserialize)]`,
    `rename_all = "camelCase"`).
  - `ReminderRecord.recurrence: Option<RecurrenceRule>`. `#[serde(default)]`로 구버전 호환.

## P2 — 다음 occurrence 계산(순수 함수)

- NEW `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/reminder.recurrence.ts`
  - `computeNextOccurrence(reminder: Reminder, completedAt: Date): Reminder | null`
  - `endAt`을 넘으면 `null` 반환.
  - 새 항목은 새 `id`(uuid), `done: false`, `lastNotifiedAt: null`, recurrence 그대로 복사,
    `dueAt`/`remindAt`을 `interval`/`kind`/`weekdays`에 따라 시프트.
- NEW `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/reminder.recurrence.test.ts`
  - daily/weekly(weekdays)/monthly(말일 보정)/yearly/endAt 만료/interval=2 케이스.

## P3 — Store 통합

- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/reminder.store.ts`
  - `toggleReminder(id)`에서 `done: true` 전이 + `recurrence != null`이면
    `computeNextOccurrence` 결과를 push.
- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src-tauri/src/reminders/service.rs`
  - 동일 의미를 Rust 측 `update_reminder` / `toggle` 경로에서도 수행할 필요는 없음
    (프론트엔드 store가 진실 공급원이며 Rust는 영속화). round-trip 직렬화만 보장.
- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src-tauri/src/reminders/storage.rs`
  - load 시 `recurrence` 누락 항목은 `None` 기본값으로 채우는 마이그레이션 경로 명시
    (`#[serde(default)]`로 충분하면 코멘트로 명시, 추가 변환 불필요).

## P4 — UI(드롭다운)

- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/components/ReminderEditorPopover.tsx`
  - "반복" 섹션: `없음 / 매일 / 매주 / 매월 / 매년` 드롭다운 + interval 숫자 입력 +
    weekly 선택 시 요일 토글 + endAt 옵션.
  - **Split 규칙**: 본 파일이 500라인 초과 예상 시 즉시 NEW
    `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/components/ReminderRecurrenceSection.tsx`로
    분리하고 popover에서 import.
- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/components/MatrixQuadrant.tsx`
  - 행에 `🔄` 아이콘(recurrence != null) 표기. 기존 `row-content` flex에 inline.

## P5 — Verification Gate

자동:
1. `npm run typecheck`
2. `npm test` (recurrence 테스트 포함)
3. `npm run build`
4. `npm run tauri:check`
5. `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings`
6. `npm run tauri:build -- --bundles app`

수동:
7. "매일" 리마인더 생성 → 완료 → 다음 날짜 동일 항목 자동 생성, 원본은 done.
8. "매주 월/수/금" 설정 → 완료 후 가장 가까운 다음 요일로 dueAt 시프트.
9. `endAt = 어제` 설정 → 완료 시 새 occurrence 미생성.
10. 구버전 reminders.json(필드 누락) 로드 → `recurrence: null`로 마이그레이션, 크래시 없음.
11. 알림 스케줄러와 결합: 새 occurrence의 `remindAt`이 도래하면 알림 발화.

## Out Of Scope

- iCal RRULE 호환.
- "마지막 평일" 같은 복잡 규칙.
- 완료 시 일괄 N개 미리 생성(우리는 lazy 1개 생성).
- 반복 항목 일괄 편집 ("이 시리즈 전체 수정").
