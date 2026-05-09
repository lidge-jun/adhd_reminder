# 리마인더 검색

## Goal

사이드바 상단에 검색창을 추가하여, 전체 리마인더를 title/notes/subtask title 기준으로 즉시
필터링한다. Cmd+K 단축키와 검색 히스토리는 본 plan 범위 밖.

## Current Signals

- 현재 필터링은 사이드바 smart list(매트릭스 bucket)뿐. 텍스트 검색 없음.
- `RemindersApp.tsx`가 라우트/뷰 레벨 상태를 보유. `Sidebar.tsx`는 prop drilling 패턴.
- 따라서 query 상태는 **`RemindersApp.tsx`가 보유(useState)**, `Sidebar.tsx`에 `value`/
  `onChange` props로 드릴링한다(컨텍스트 신설 금지 — 단일 사용처).
- 검색 로직은 `reminder.store.ts`(이미 큼)와 분리. 별도 순수 모듈로 둔다.

## P1 — 순수 검색 함수

- NEW `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/reminder.search.ts`
  - `searchReminders(reminders: Reminder[], query: string): Reminder[]`
  - 정규화: `query.trim().toLowerCase()`. 빈 문자열이면 입력 배열 그대로 반환.
  - 매칭: `title`, `notes`, `subtasks[].title` 중 하나라도 substring 포함.
  - 한국어 자소 분리는 하지 않음(첫 버전).
- NEW `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/reminder.search.test.ts`
  - title 매치 / notes 매치 / subtask 매치 / 대소문자 무시 / 한글 / 빈 쿼리 / 공백만 케이스.

## P2 — 상태 lift

- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/RemindersApp.tsx`
  - `const [searchQuery, setSearchQuery] = useState('')`.
  - query가 비어있지 않으면 현재 매트릭스 뷰 대신 `searchReminders(allReminders, searchQuery)`
    결과를 `SingleListView`로 렌더(neutral tone).
  - `Sidebar`에 `searchQuery`, `onSearchQueryChange` 전달.

## P3 — Sidebar 입력

- MODIFY `/Users/jun/Developer/new/700_projects/jaw-reminders/src/features/reminders/components/Sidebar.tsx`
  - 상단에 `<input type="search" />`(돋보기 placeholder).
  - 컨트롤드: `value={props.searchQuery}` `onChange`로 콜백.
  - `aria-label="리마인더 검색"`. clear 버튼(✕)은 query.length>0일 때 노출.
  - 파일 라인수 점검: 500 미만 유지. 초과 위험 시 NEW
    `src/features/reminders/components/SidebarSearchInput.tsx`로 분리.

## P4 — Verification Gate

자동:
1. `npm run typecheck`
2. `npm test` (search 테스트 포함)
3. `npm run build`
4. `npm run tauri:check`
5. `npm run tauri:build -- --bundles app`

수동:
6. 검색창에 한글 단어 입력 → 매칭 항목만 SingleListView에 표시.
7. 영어 대소문자 무시 매칭(`Foo` → `foo` 매칭).
8. notes/subtask title에 있는 단어로 매칭.
9. 검색어 비우면 원래 매트릭스 뷰 복귀.
10. 검색 중 항목 완료 토글 → 결과 리스트가 즉시 갱신.

## Out Of Scope

- **Cmd+K 단축키** — 차기 plan.
- 최근 검색어 히스토리 / 자동완성.
- 한국어 자소 분리, 초성 검색.
- 퍼지 매칭(typo tolerance, ranking).
- Rust 측 검색 인덱스(현재 데이터 규모로는 클라이언트 in-memory 필터로 충분).
