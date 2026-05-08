# Sidebar Routing + 완료 Page + Hero Checked-State Bug

## Goal

Apple Reminders 같이 각 사이드바 항목(오늘/집중/대기/나중에/완료)을
"단일 사분면 리스트 페이지"로 만들고, 2x2 매트릭스 뷰는 별도의
"우선순위 매트릭스" 항목으로 분리한다. 동시에 매트릭스에서 새로
만든 항목이 체크된 것처럼 렌더되는 시각 버그를 잡는다.

## Part 2 — Diff-level changes

### 1) `src/features/reminders/reminder.schema.ts` (MODIFY)

`ReminderViewId` 유니온에 `'matrix'` 추가.

```diff
- export type ReminderViewId = SmartListId | `list:${string}`;
+ export type ReminderViewId = 'matrix' | SmartListId | `list:${string}`;
```

`createInitialView`의 기본값은 첫 인상 보호 위해 `'matrix'`로 변경
(이미 데이터가 있으면 매트릭스로 시작, 없을 때도 매트릭스 hero 화면).

### 2) `src/features/reminders/components/Sidebar.tsx` (MODIFY)

최상단에 "우선순위 매트릭스" 항목 추가.

```diff
- import { Archive, Bell, CalendarBlank, CircleDashed, ListChecks, GearSix, Target } from '@phosphor-icons/react';
+ import { Archive, Bell, CalendarBlank, CircleDashed, ListChecks, GearSix, SquaresFour, Target } from '@phosphor-icons/react';

+ const heroItem = { id: 'matrix' as const, labelKey: 'nav.matrix', icon: SquaresFour };
  const smartLists = [
    { id: 'today', ... },
    ...
  ] as const;
```

근거: `node_modules/@phosphor-icons/react/dist/index.d.ts`에서
`export * from './csr/SquaresFour'` 직접 확인 완료 (audit FAIL 사유는
잘못된 경로 grep 결과였음).

렌더 시 nav 첫 줄에 hero 버튼, 그 아래 smartLists. 기존 selectedViewId
비교 로직은 그대로 동작.

### 3) `src/features/reminders/reminder.i18n.ts` (MODIFY)

```diff
+ | 'nav.matrix'
```

ko: `우선순위 매트릭스`, en: `Priority Matrix`.

### 4) `NEW` `src/features/reminders/components/SingleListView.tsx`

매트릭스 1개 사분면을 풀 폭으로 보여주는 리스트 뷰. 헤더(아이콘 +
제목 + 카운트), 인라인 "새로 만들기" 입력, 행 리스트, 빈 상태.
기존 `MatrixQuadrant`의 시각 스타일(`tone-red/green/amber/blue` wash,
헤더 dot, row layout)을 재사용한다.

```tsx
type Props = {
  viewId: SmartListId;        // 'today' | 'focus' | 'waiting' | 'later' | 'done'
  reminders: Reminder[];      // 이미 필터된 목록
  selectedReminderId: string | null;
  draft: string;
  t: ReminderTranslator;
  onSelect, onOpenDetails, onToggle, onDraftChange, onAdd
};
```

매핑:
- `today` → tone-red, urgentImportant CreateInput
- `focus` → tone-green, important CreateInput
- `waiting` → tone-amber, waiting CreateInput
- `later` → tone-blue, later CreateInput
- `done` → tone-grey (신규), inline create 비활성, 토글로 다시 open

### 5) `src/features/reminders/RemindersApp.tsx` (MODIFY)

매트릭스 보드 렌더 분기.

```diff
- <main className="matrix-shell">
-   <div className="matrix-board">…4 quadrants…</div>
- </main>
+ <main className="matrix-shell">
+   {viewId === 'matrix'
+     ? <MatrixBoard … />
+     : <SingleListView viewId={viewId} … />}
+ </main>
```

기존 매트릭스 마크업은 `MatrixBoard`로 추출(같은 파일 내 함수). axis
라벨/십자선 CSS는 매트릭스 화면에서만 보임 (분기로 자동 처리).

### 6) `src/features/reminders/reminder.store.ts` (MODIFY)

뷰별 reminders selector를 store에 추가하고, 기존
`getVisibleReminders`가 이 selector를 호출하도록 통합 (정의 drift
방지).

```ts
export function selectRemindersForView(
  reminders: Reminder[],
  viewId: ReminderViewId,
): Reminder[] {
  if (viewId === 'matrix') return reminders.filter(r => r.status !== 'done');
  if (viewId === 'done')   return reminders.filter(r => r.status === 'done');
  if (viewId === 'focus')  return reminders.filter(r => r.status === 'focused');
  if (viewId === 'waiting') return reminders.filter(r => r.status === 'waiting');
  if (viewId === 'today')  return reminders.filter(r => r.listId === 'today' && r.status !== 'done');
  if (viewId === 'later')  return reminders.filter(r => r.listId === 'later' && r.status !== 'done');
  if (viewId.startsWith('list:')) return reminders.filter(r => r.listId === viewId.slice(5));
  return reminders;
}

// 기존 getVisibleReminders는 새 selector를 위임 호출하도록 변경
export function getVisibleReminders(snapshot: ReminderSnapshot): Reminder[] {
  return selectRemindersForView(snapshot.reminders, snapshot.selectedViewId);
}
```

`useReminderController.ts`는 별도 변경 없이 기존 `getVisibleReminders`
호출 그대로 사용. `matrixGroups`도 그대로 (단, viewId='matrix'에서만
의미 있음 — RemindersApp 분기에서 처리).

### 7) `src/features/reminders/RemindersApp.tsx` row icon fix (MODIFY)

체크박스 아이콘을 상태 명시적으로 바꿔서 "regular" 모양이 체크된
것처럼 보이는 혼동 제거.

```diff
- import { CheckCircle, ... } from '@phosphor-icons/react';
+ import { Circle, CheckCircle, ... } from '@phosphor-icons/react';
...
- <CheckCircle size={18} weight={done ? 'fill' : 'regular'} />
+ {done
+   ? <CheckCircle size={18} weight="fill" />
+   : <Circle size={18} weight="regular" />}
```

`Circle weight=regular` = 체크마크 없는 빈 원. SingleListView도 동일
적용.

### 8) `src/styles/app.css` (MODIFY)

- `.row-check { color: var(--accent); }` → 사분면 컨텍스트에서는
  `currentColor` 또는 `var(--quadrant-accent, var(--accent))`로 바꿔서
  무조건 파랑으로 채워지지 않게 함.
- `.matrix-reminder-row.is-selected`의 채움이 row-check 시각을 체크된
  것처럼 보이게 만드는지 확인 — 필요하면 `.row-check` 자체는 selection
  영향 받지 않게 명시.
- `.single-list-view` 신규 스타일: `.matrix-quadrant`와 같은 wash + row
  layout. axis 십자선 스타일은 `.matrix-board` 안에만 있어서 자동 격리.

### 9) `NEW` `src/features/reminders/reminder.view-selector.test.ts`

기존 vitest 파일들이 `src/features/reminders/*.test.ts` 위치에
co-located 되어 있는 컨벤션을 따른다 (root `tests/` 폴더 사용 안 함).

- `selectRemindersForView` 단위 테스트:
  matrix / today / focus / waiting / later / done / list:custom
  케이스 각각 검증.
- 기존 reminder/store 테스트는 변경 없음.

## Out of scope

- macOS notarization / DMG 정식 패키징 (이전 결정대로 후속).
- 사이드바 카운트 로직 자체 정합성(listId vs status 혼용)은 이번에
  건드리지 않음. 시각 분기 우선.

## Risks / open questions

- "today" 필터를 listId='today' AND status≠'done'으로 잡는데, focus/
  waiting/done은 status로 잡는 비대칭은 그대로 둔다 (사이드바 기존
  count 로직과 동일).
- `done` 사분면이 추가되면 hero에서는 어떻게? → 현재 매트릭스는
  `resolveReminderMatrixBucket`이 done을 null로 빼고 있으므로 hero에는
  표시 안 됨. 유지.
- Hero 진입 기본값을 `matrix`로 바꾸면 첫 실행 시 빈 4분면이라
  심심해 보일 수 있음 — 그래도 정보 구조 명시가 더 중요.

## Verification

1. `npm run typecheck` 통과
2. `npm test` 통과 (selectRemindersForView 신규 테스트 포함)
3. dev 서버에서 사이드바 각 항목 클릭 시 단일 리스트 렌더 확인
4. `우선순위 매트릭스` 클릭 시 2x2 + 십자축 정상
5. 새 항목 추가 → 빈 원으로 렌더 (체크된 것처럼 안 보임)
6. 완료 페이지에서 done 항목 보임 + 토글로 다시 open 가능
