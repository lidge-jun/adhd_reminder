# 서브태스크 UI

## Goal

스키마에 이미 있는 `subtasks: Subtask[]`를 UI에서 보고 편집할 수 있게 한다.
- InspectorPopover 안에 "하위 항목" 섹션(추가/체크/삭제).
- 매트릭스 행에 `2/5` 프로그레스 표시.

## Current Signals

- `Subtask = { id: string; title: string; done: boolean }` — `reminder.schema.ts`에 정의됨.
- demoSnapshot의 `r-focus` 항목에 2개 시드.
- Popover 실제 경로: `src/features/reminders/components/ReminderEditorPopover.tsx`(현재 169라인).
  서브태스크 섹션 추가 시 300+로 예상되어 popover 본체에 그대로 두면 cap 위험. 별도 컴포넌트로 분리.
- 매트릭스 행은 `MatrixReminderRow` 단독 파일 없음. `src/features/reminders/components/MatrixQuadrant.tsx`
  내부의 private 함수 `MatrixReminderRow`가 실제 렌더러.
- Rust 측 `UpdateReminderInput`이 `subtasks` 필드를 round-trip하는지 확인 필요:
  `src-tauri/src/reminders/domain.rs`의 `UpdateReminderInput` struct 와
  `src-tauri/src/reminders/service.rs`의 `update_reminder` 적용부에서 grep으로 확인.
  이미 존재하면 라인 번호를 plan 본문에 인용하고 변경 없음. 누락이면 P3에서 추가.

## P1 — Store 헬퍼

- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/reminder.store.ts`
  - `addSubtask(reminderId, title)`, `toggleSubtask(reminderId, subtaskId)`,
    `removeSubtask(reminderId, subtaskId)`, `renameSubtask(reminderId, subtaskId, title)`.
  - 모두 immutable update + `update_reminder` 영속화 호출(기존 패턴 재사용).
  - 라인 수 점검; 500 초과 위험 시 NEW
    `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/reminder.subtasks.ts`로
    헬퍼만 분리.

## P2 — Popover 섹션 분리

- NEW `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/components/ReminderSubtasksSection.tsx`
  - props: `reminder`, `onAdd`, `onToggle`, `onRemove`, `onRename`.
  - 렌더: 체크박스 + 인라인 편집 input + hover 시 ✕ 삭제 버튼 + "추가" 입력 행.
  - 본 파일 단독 500라인 미만 유지.
- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/components/ReminderEditorPopover.tsx`
  - `<ReminderSubtasksSection />` import 후 popover 본문에 삽입.
  - popover 본체가 500 근접하면 다른 섹션(예: 날짜 필드)도 추가 분리.

## P3 — 행 프로그레스

- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/components/MatrixQuadrant.tsx`
  - `MatrixReminderRow` 내부에서 `subtasks.length > 0`이면
    `<small>{done}/{total}</small>` 배지 추가. 기존 `.row-content` 영역 활용.
- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/components/SingleListView.tsx`
  - 동일 프로그레스 배지.

## P4 — Rust round-trip 보장

- MODIFY (조건부) `/Users/jun/Developer/new/700_projects/jaw-reminders/src-tauri/src/reminders/domain.rs`
  - `UpdateReminderInput`에 `subtasks: Option<Vec<SubtaskRecord>>`가 이미 있는지 확인.
    누락 시 추가, `#[serde(rename = "subtasks", default)]`.
- MODIFY (조건부) `/Users/jun/Developer/new/700_projects/jaw-reminders/src-tauri/src/reminders/service.rs`
  - `update_reminder` 적용 로직에서 `subtasks`가 `Some`이면 기존 벡터 교체. 누락 시에는 보존.
- 이미 있으면 본 P를 "no-op, line refs only"로 마킹하고 변경 없음.

## P5 — Verification Gate

자동:
1. `npm run typecheck`
2. `npm test`
3. `npm run build`
4. `npm run tauri:check`
5. `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings`
6. `npm run tauri:build -- --bundles app`

수동:
7. Popover에서 서브태스크 추가 → 행 프로그레스 `0/1` 표시.
8. 체크 토글 → `1/1`, 다시 토글 → `0/1`.
9. 삭제 → 프로그레스 갱신, 0이 되면 배지 사라짐.
10. 앱 재시작 후 서브태스크 상태 영속(reminders.json 직접 확인).
11. 매트릭스 + Single 두 뷰 모두에서 동일 표시.

## Out Of Scope

- 매트릭스 행 인라인 확장(클릭 시 서브태스크 펼침) — 후속.
- 서브태스크 드래그 앤 드롭 정렬.
- 서브태스크에 자체 dueAt/remindAt.
- 서브태스크 알림 발송(상위 리마인더 알림으로 충분).
