# 알림 스케줄러

## Goal

`remindAt` 시간이 도래하면 자동으로 macOS 네이티브 알림을 트리거한다.
현재는 수동 "테스트 알림" 버튼만 있고 시간 기반 자동 발화가 없다. 백그라운드에서 60초 주기로
폴링하여 미발송 항목을 발견하면 알림을 발송하고 `lastNotifiedAt`을 기록한다.

## Current Signals

- Tauri 2의 `@tauri-apps/plugin-notification`이 이미 설치됨.
- Rust 커맨드 `show_reminder_notification(input)`이 존재.
- 브라우저 모드에서는 `Notification API` 사용 가능.
- `remindAt`은 ISO 8601 문자열 또는 `null`.
- `src-tauri/src/reminders/service.rs`는 `RwLock<ReminderState>`를 통해 reminders.json
  접근을 직렬화한다. 직접 파일 IO는 금지(데이터 레이스 위험).

## P1 — 스키마: `lastNotifiedAt` 추가

- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/reminder.schema.ts`
  - `Reminder`에 `lastNotifiedAt: string | null` 추가, zod 스키마 동기화, 기본값 `null`.
- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src-tauri/src/reminders/domain.rs`
  - `ReminderRecord` 구조체에 `last_notified_at: Option<String>` 필드 추가.
  - `#[serde(rename = "lastNotifiedAt", default)]`로 카멜케이스 + 마이그레이션 호환.
- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src-tauri/src/reminders/service.rs`
  - 기존 load/save 경로에서 `last_notified_at`을 round-trip시키고,
    `mark_notified(id: &str, at: &str) -> Result<()>` setter를 `RwLock` write 가드 내부에서 노출.

## P2 — Rust 폴링 스케줄러 (Option A)

- NEW `/Users/jun/Developer/new/700_projects/jaw-reminders/src-tauri/src/reminders/scheduler.rs`
  - `start_scheduler(app: AppHandle, service: Arc<ReminderService>)` 함수.
  - `tauri::async_runtime::spawn` 으로 60초 tick 루프.
  - 매 tick: `service.snapshot()`(read 가드)으로 항목 목록 획득 →
    `remindAt <= now && lastNotifiedAt < remindAt && !done` 필터 →
    각 항목에 대해 `show_reminder_notification` 호출 후 `service.mark_notified` 호출.
  - 직접 `reminders.json`을 읽지 않는다. 모든 접근은 `service` handle 경유.
- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src-tauri/src/lib.rs`
  - `setup` 훅에서 `scheduler::start_scheduler` 호출.
  - `mod reminders::scheduler;` 등록.

## P3 — 프론트엔드 fallback (브라우저 모드)

- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/useReminderController.ts`
  - Tauri 환경 감지(`window.__TAURI_INTERNALS__`)가 false면 fallback hook 활성화.
- NEW `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/useNotificationFallback.ts`
  - 60초 setInterval. `Notification.permission === 'granted'`일 때만 발화.
  - `lastNotifiedAt` 갱신은 store 업데이트 함수로 영속화.
  - cleanup에서 interval 해제. silent failure 금지(에러 console.error + state).

## P4 — 라인 수 가드

- 모든 신규/수정 파일은 500라인 미만 유지. `scheduler.rs`가 200라인 초과 시
  `notify_dispatch.rs`(알림 호출부)와 `tick_loop.rs`(루프 코어) 분리.

## P5 — Verification Gate

수동/자동 모두 PASS여야 완료.

자동:
1. `npm run typecheck`
2. `npm test`
3. `npm run build`
4. `npm run tauri:check`
5. `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings`
6. `npm run tauri:build -- --bundles app`

수동:
7. 새 리마인더 생성, `remindAt`을 현재+1분으로 설정. 1분 내 macOS 알림 팝업 확인.
8. 동일 항목이 즉시 재알림되지 않음(폴링 한 번 더 돌려도 무발송).
9. 앱 창 닫고 트레이/백그라운드 상태에서 알림 정상 발화.
10. `reminders.json`을 확인하여 `lastNotifiedAt`이 ISO 형식으로 기록됨.
11. 브라우저 모드(`npm run dev`)에서 권한 grant 후 fallback 알림 확인.

## Out Of Scope

- 반복 리마인더의 다음 occurrence 자동 생성(별도 plan: `260508_repeat_reminders`).
- 알림 사운드 커스터마이징.
- Snooze / "10분 후 다시 알림" UI.
- Windows/Linux 트레이 알림(macOS 우선).
