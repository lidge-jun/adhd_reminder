# 날짜 부제목 + 날짜 편집 UI

## Goal

리마인더 행에 `dueAt`/`remindAt`이 있으면 Apple Reminders처럼 타이틀 아래에 작은 회색 부제목
(`오늘`, `내일 오후 3시`, `5월 12일 월요일`)을 표시한다. InspectorPopover의 날짜 피커 UX를 다듬고,
ko/en 로케일에 맞춰 상대 날짜를 포맷한다.

## Current Signals

- 스키마에 `dueAt: string | null`, `remindAt: string | null` 이미 존재. Rust/브라우저 양쪽
  영속화 됨.
- 행 컴포넌트: 매트릭스 행은 **`MatrixReminderRow.tsx`가 존재하지 않음**. 실제 위치는
  `src/features/reminders/components/MatrixQuadrant.tsx` 내부의 private 함수
  `MatrixReminderRow`. Single 리스트는 `SingleListView.tsx`.
- 스타일 파일 `src/styles/app.css`는 480라인으로 500 캡 근접. 신규 룰을 여기 추가하면 안 된다.
  스타일은 별도 파일로 분리하고 `src/styles/index.ts`의 배럴에서 import.

## P1 — 상대 날짜 포맷터(순수 함수)

- NEW `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/reminder.date-format.ts`
  - `formatRelativeDate(iso: string | null, locale: 'ko' | 'en', now?: Date): string`
  - 분기: null → `''`, 오늘 → `오늘 HH:mm` / `Today HH:mm`, 내일 → `내일 HH:mm` / `Tomorrow HH:mm`,
    같은 해 → `M월 D일 (요일)` / `MMM D`, 다른 해 → `YYYY년 M월 D일` / `YYYY MMM D`.
  - 시간 정보 없이 자정(00:00)이면 시간 부분 생략.
- NEW `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/reminder.date-format.test.ts`
  - `now`를 고정한 채 오늘/내일/이번 주/올해/다른 해/null/자정 케이스 테스트.

## P2 — 행 부제목 렌더

- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/components/MatrixQuadrant.tsx`
  - private `MatrixReminderRow` 내부에서 `dueAt || remindAt` 존재 시
    `<small className="row-date-hint">{formatRelativeDate(...)}</small>` 추가.
  - locale은 기존 `useLocale` 훅(또는 동등 컨텍스트) 사용. 없는 경우 props 드릴링.
- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/components/SingleListView.tsx`
  - 동일 부제목 컴포넌트 적용.

## P3 — 스타일 분리(라인 수 가드)

- NEW `/Users/jun/Developer/new/700_projects/jaw-reminders/src/styles/row-date-hint.css`
  - `.row-date-hint { font-size: 12px; color: var(--ink-soft); margin-top: 2px; }` 등
    부제목 전용 룰만 포함.
- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src/styles/index.ts`
  - 신규 css 배럴 import 추가. `app.css`는 건드리지 않는다(480/500 캡 보호).

## P4 — 인라인 날짜 편집(InspectorPopover 다듬기)

- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/components/ReminderEditorPopover.tsx`
  - 기존 due/remind 필드를 `<input type="datetime-local">`로 통일.
  - "지우기" 버튼으로 `null` 세팅 가능. 변경 시 store update.
  - 파일이 500라인 초과 예상되면 `ReminderDateFields.tsx`로 split. 현재 169라인이라
    이번 패치로 초과 가능성 낮음, 그러나 임계 도달 시 즉시 분할.

## P5 — Verification Gate

자동:
1. `npm run typecheck`
2. `npm test` (포맷터 테스트 포함)
3. `npm run build`
4. `npm run tauri:check`
5. `npm run tauri:build -- --bundles app`

수동:
6. dev 서버에서 `dueAt`이 있는 항목 행 아래 회색 부제목 표시 확인.
7. ko↔en locale 토글 시 포맷이 즉시 변경.
8. InspectorPopover에서 날짜 변경 → 행 부제목 즉시 갱신, 재시작 후 영속.
9. `dueAt`/`remindAt` 둘 다 없는 항목은 부제목 미표시(빈 줄 없음).
10. `app.css` 라인 수 변동 없음(`wc -l src/styles/app.css`).

## Out Of Scope

- 매트릭스 인라인 생성(`matrix-inline-create`)에서 optional 날짜 버튼 추가.
- 자연어 입력 파서("내일 3시" → datetime).
- 종 🔔 / 캘린더 아이콘 분리 표기(텍스트 부제목만).
- Cargo/Rust 변경(스키마는 이미 `dueAt`/`remindAt` 보유, 프론트엔드만 수정).
