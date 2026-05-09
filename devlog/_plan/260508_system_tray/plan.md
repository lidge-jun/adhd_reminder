# 시스템 트레이 (macOS 상단바)

## Goal

앱 창을 닫아도 macOS 상단바에 트레이 아이콘이 상주. 좌클릭 → 메인 윈도우 토글, 우클릭 → 컨텍스트
메뉴(`보이기`, `종료`). 창 닫기 이벤트를 가로채 hide로 변환한다. 미니 팝오버는 본 plan 범위 밖.

## Current Signals

- Tauri 2의 `tray-icon` API(`tauri::tray::TrayIconBuilder`) 사용 가능.
- 현재 앱은 창 닫으면 완전 종료.
- Capability 시스템(Tauri 2)에서 트레이 권한 명시 필요: `core:tray:default`.
- 매트릭스 아이콘(2x2 그리드)을 트레이 템플릿 아이콘으로 활용.

## P1 — 트레이 아이콘 에셋

- NEW `/Users/jun/Developer/new/700_projects/jaw-reminders/src-tauri/icons/tray-16x16.png`
  (단색/투명 배경 macOS template icon).
- NEW `/Users/jun/Developer/new/700_projects/jaw-reminders/src-tauri/icons/tray-32x32.png`
- NEW `/Users/jun/Developer/new/700_projects/jaw-reminders/src-tauri/icons/tray@2x.png`
  (32x32 retina template).
- 모두 macOS template image 권장(검정 + 알파). 다크/라이트 모드 자동 반전.

## P2 — Tauri 설정

- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src-tauri/tauri.conf.json`
  - `app.windows[0]` 또는 메인 윈도우에 close-to-tray hint 키 추가
    (실제 close 가로채기는 Rust 이벤트 핸들러에서 수행, conf는 기본 윈도우 동작 유지).
  - `bundle.icon`에 트레이 PNG 경로(`icons/tray-16x16.png`, `icons/tray-32x32.png`,
    `icons/tray@2x.png`) 항목이 누락이면 추가. 기존 앱 아이콘 항목은 보존.
- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src-tauri/Cargo.toml`
  - `tauri` dependency의 `features`에 `"tray-icon"` 추가(없으면).

## P3 — Capability 권한

- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src-tauri/capabilities/*.json`
  (해당 디렉터리의 default capability JSON, 일반적으로 `default.json`)
  - `permissions` 배열에 `"core:tray:default"` 추가.
  - 단일 파일이 500라인 초과 위험은 없으나, 신규 권한 추가만 수행하고 기존 항목 보존.

## P4 — Rust 트레이 부트스트랩

- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src-tauri/src/lib.rs`
  - `setup` 훅에서:
    ```rust
    use tauri::tray::TrayIconBuilder;
    use tauri::menu::{Menu, MenuItem};
    let show = MenuItem::with_id(app, "show", "보이기", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "종료", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;
    TrayIconBuilder::new()
        .icon(app.default_window_icon().cloned().unwrap())
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => { /* show + focus main window */ }
            "quit" => { app.exit(0); }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| { /* left click → toggle window */ })
        .build(app)?;
    ```
  - 윈도우 `on_window_event` 핸들러에서 `WindowEvent::CloseRequested` 발생 시
    `api.prevent_close()` 후 `window.hide()`. 종료는 트레이 메뉴 "종료"만이 트리거.
  - `lib.rs`가 500라인 초과 위험 시 NEW
    `/Users/jun/Developer/new/700_projects/jaw-reminders/src-tauri/src/tray.rs`로
    트레이 셋업 함수 분리, `lib.rs`에서 `mod tray; tray::setup(app)?;` 호출.

## P5 — Verification Gate

자동:
1. `npm run typecheck`
2. `npm run build`
3. `npm run tauri:check`
4. `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings`
5. `npm run tauri:build -- --bundles app`

수동(macOS):
6. 빌드한 .app 실행 → 상단바에 트레이 아이콘 표시.
7. 메인 윈도우 빨간 닫기 버튼 → 윈도우만 숨김, 앱은 계속 실행(Activity Monitor 확인).
8. 트레이 좌클릭 → 윈도우 다시 표시 + 포커스.
9. 트레이 우클릭 → 메뉴 노출, "보이기" 동작 확인.
10. 우클릭 메뉴 "종료" → 프로세스 완전 종료.
11. 다크/라이트 모드 전환 시 트레이 아이콘 자동 반전(template image 검증).

## Out Of Scope

- 트레이 좌클릭 미니 팝오버(현재 집중 항목 + 빠른 완료 토글) — 별도 plan.
- Windows / Linux 트레이 동작.
- 트레이 아이콘 위에 미수신 알림 카운트 배지.
- "Login Item으로 추가" 자동 시작 기능.
