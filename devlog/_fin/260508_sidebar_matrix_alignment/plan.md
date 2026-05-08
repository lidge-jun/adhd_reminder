# Sidebar / Matrix 의미 통합 + 라벨 길이 정렬

## Goal

사이드바 smart list와 매트릭스 사분면을 같은 분류로 묶어서, 사이드바
클릭 = 매트릭스의 한 사분면 확대 보기로 만든다. 동시에 영문 라벨이
좁은 사이드바 폭(약 180px 내부)에서 잘리지 않도록 길이 룰을 정한다.

## Context

현재:

- `selectRemindersForView('today')` = `listId==='today' && status!=='done'`
- 매트릭스 top-left "Important and Urgent" = `priority==='high'`
- 두 기준이 겹치지 않아서, 같은 항목이 사이드바에선 today에 들어가도
  매트릭스에선 다른 사분면에 떨어질 수 있음.
- 또 시드 `lists` 4개가 사이드바 MY LISTS 섹션에 그대로 노출되어
  smart list와 라벨이 1:1로 중복됨.

## Part 1 — 무엇을 만드나 (한눈에)

1. **사이드바 smart list = 매트릭스 사분면 1:1**
   - 사이드바에서 한 항목을 누르면, 매트릭스에서 같은 데이터가 모이는
     사분면으로 바로 확대된다.
   - 같은 색 dot, 같은 분류 기준.

2. **글자 길이 룰**
   - 사이드바 라벨: 한국어 ≤4자, 영어 ≤8자. 잘림/줄바꿈 없도록.
   - 단일 리스트 페이지 본문 헤더: 전체 사분면 정식 명칭(긴 라벨) 사용.

3. **MY LISTS 섹션 정리**
   - 시드 `lists`를 비워서 MY LISTS 섹션을 자동 비활성화. 추후 사용자
     리스트 생성 UI 붙일 때 다시 노출.

4. **시각 위계**
   - Hero "매트릭스" 항목 카드 스타일(약한 wash + 더 큰 글자)로 분리.
   - 각 smart list 좌측 dot 색을 매트릭스 사분면 색과 동일.
   - Settings 사이드바 최하단 footer로 이동.

## 라벨 표

| ID | 사이드바 ko (≤4) | 사이드바 en (≤8) | 단일 리스트 헤더 ko | 단일 리스트 헤더 en | dot |
|---|---|---|---|---|---|
| matrix | 매트릭스 | Matrix | 우선순위 매트릭스 | Priority Matrix | (없음/accent) |
| today | 긴급 | Urgent | 중요하고 급한 것 | Important and Urgent | red |
| focus | 집중 | Focus | 중요하지만 급하지 않은 것 | Important, Not Urgent | green |
| waiting | 위임 | Waiting | 기다림 / 위임 | Waiting / Delegated | amber |
| later | 나중에 | Later | 나중에 볼 것 | Later | blue |
| done | 완료 | Done | 완료 | Done | grey |

→ 사이드바는 짧은 별명, 페이지 본문은 정식 명칭. Apple Reminders 패턴
(All / Today / Scheduled / Flagged 같은 짧은 사이드바 + 긴 페이지 헤더)
과 동일.

## Part 2 — Diff-level changes

### 1) `MODIFY` `src/features/reminders/reminder.fixtures.ts`

`lists` 빈 배열로 변경. 기존 4개 default lists 제거. 시드 reminders는
listId 참조를 유지하지만 ReminderList row가 사라지므로 사이드바
MY LISTS 섹션은 자동으로 비어진다.

```diff
- lists: [
-   { id: 'today', name: '오늘', accent: '#0f8fd6' },
-   { id: 'focus', name: '집중', accent: '#d4477f' },
-   { id: 'waiting', name: '대기', accent: '#b67818' },
-   { id: 'later', name: '나중에', accent: '#667085' },
- ],
+ lists: [],
```

### 2) `MODIFY` `src/features/reminders/reminder.store.ts`

`selectRemindersForView`를 매트릭스 bucket 기반으로 재작성.
`resolveReminderMatrixBucket`을 직접 사용해서 사이드바와 매트릭스가
동일 분류 기준을 공유한다.

```diff
+ import { resolveReminderMatrixBucket } from './reminder.matrix';

  export function selectRemindersForView(
    reminders: Reminder[],
    viewId: ReminderViewId,
  ): Reminder[] {
    if (viewId === 'matrix') {
      return reminders.filter((reminder) => reminder.status !== 'done');
    }
    if (viewId === 'done') {
      return reminders.filter((reminder) => reminder.status === 'done');
    }
-   if (viewId === 'focus') return reminders.filter(r => r.status === 'focused');
-   if (viewId === 'waiting') return reminders.filter(r => r.status === 'waiting');
-   if (viewId === 'later') return reminders.filter(r => r.listId === 'later' && r.status !== 'done');
-   if (viewId === 'today') return reminders.filter(r => r.listId === 'today' && r.status !== 'done');
+   if (viewId === 'today')   return reminders.filter(r => resolveReminderMatrixBucket(r) === 'urgentImportant');
+   if (viewId === 'focus')   return reminders.filter(r => resolveReminderMatrixBucket(r) === 'important');
+   if (viewId === 'waiting') return reminders.filter(r => resolveReminderMatrixBucket(r) === 'waiting');
+   if (viewId === 'later')   return reminders.filter(r => resolveReminderMatrixBucket(r) === 'later');

    const listId = viewId.slice('list:'.length);
    return reminders.filter((reminder) => reminder.listId === listId);
  }
```

`done`은 그대로 status 기반(매트릭스에서 제외되니 별도 처리 유지).

### 3) `MODIFY` `src/features/reminders/reminder.i18n.ts`

사이드바용 짧은 라벨로 갱신. 페이지 본문에는 기존 `matrix.*` 키 그대로.

```diff
- 'nav.today': '오늘',
- 'nav.focus': '집중',
- 'nav.waiting': '대기',
- 'nav.later': '나중에',
- 'nav.done': '완료',
+ 'nav.today': '긴급',
+ 'nav.focus': '집중',
+ 'nav.waiting': '위임',
+ 'nav.later': '나중에',
+ 'nav.done': '완료',
+ 'nav.matrix': '매트릭스',  // 기존 '우선순위 매트릭스'에서 단축

  // en
- 'nav.today': 'Today',
+ 'nav.today': 'Urgent',
- 'nav.focus': 'Focus',
+ 'nav.focus': 'Focus',
- 'nav.waiting': 'Waiting',
+ 'nav.waiting': 'Waiting',
- 'nav.later': 'Later',
+ 'nav.later': 'Later',
+ 'nav.matrix': 'Matrix',
```

페이지 본문은 `matrix.urgentImportant` 등 기존 키를 그대로 SingleListView
헤더에서 사용 (이미 그렇게 되어 있음).

### 4) `MODIFY` `src/features/reminders/components/Sidebar.tsx`

- 각 smart list 항목 좌측 아이콘 + dot 색 매트릭스 사분면 색으로.
- Hero "매트릭스" 카드 스타일(별도 클래스 `is-hero`로 시각 차별화).
- Settings 버튼을 `<aside>` 최하단 footer로 이동.
- MY LISTS 섹션은 `snapshot.lists.length === 0`이면 헤더+nav 둘 다 비표시.

```diff
+ const SMART_LIST_DOT: Record<SmartListId, string> = {
+   today: 'tone-red',
+   focus: 'tone-green',
+   waiting: 'tone-amber',
+   later: 'tone-blue',
+   done: 'tone-grey',
+ };
```

각 `<button className="smart-list-button">`에 `data-tone={SMART_LIST_DOT[id]}`
또는 `className`에 tone 클래스 부착. CSS에서 `::before` dot에
`background: var(--quadrant-accent)` 적용.

```diff
- <div className="sidebar-section-label">{t('nav.myLists')}</div>
- <nav className="user-list-nav" aria-label="User lists">
-   {snapshot.lists.map(...)}
- </nav>
+ {snapshot.lists.length > 0 ? (
+   <>
+     <div className="sidebar-section-label">{t('nav.myLists')}</div>
+     <nav className="user-list-nav" aria-label="User lists">
+       {snapshot.lists.map(...)}
+     </nav>
+   </>
+ ) : null}
```

settings 버튼 위치를 nav 끝에서 footer로 옮기되, JSX 구조는 `<aside>`
바로 하위 마지막 자식으로.

### 5) `MODIFY` `src/styles/app.css`

- `.smart-list-button` grid에 dot ::before 추가, 사분면 색 변수 사용.
- `.smart-list-button.is-hero` 카드 스타일(약한 wash bg, 살짝 큰 글자, dot 없음).
- `.sidebar` 하단 영역에 `margin-top: auto`로 settings 밀어내기.
- 사이드바 width를 살짝 늘리고 라벨 컬럼 `text-overflow: ellipsis` 안전장치.

```diff
.smart-list-button {
  ...
+ position: relative;
+ padding-left: 26px;  /* dot 자리 */
}

+ .smart-list-button::before {
+   content: '';
+   position: absolute;
+   left: 12px;
+   top: 50%;
+   width: 8px;
+   height: 8px;
+   margin-top: -4px;
+   border-radius: 50%;
+   background: var(--quadrant-accent, transparent);
+ }

+ .smart-list-button.is-hero {
+   background: color-mix(in srgb, var(--accent) 8%, #fff);
+   font-weight: 600;
+ }
+
+ .smart-list-button.is-hero::before {
+   display: none;  /* hero는 dot 안 그림 */
+ }

+ .smart-list-button span {
+   overflow: hidden;
+   text-overflow: ellipsis;
+   white-space: nowrap;
+ }
```

### 6) `MODIFY` `src/features/reminders/reminder.view-selector.test.ts`

기존 8 케이스 중 today/focus/waiting/later는 매트릭스 bucket 기반으로
바뀌었으므로 fixture와 expected를 업데이트한다.

- "today returns matrix urgentImportant bucket items"
- "focus returns matrix important bucket items"
- "waiting returns matrix waiting bucket items"
- "later returns matrix later bucket items"
- 기타 matrix/done/list:custom/empty는 그대로.

## Out of scope

- 사용자 리스트 추가 UI (MY LISTS 동적 입력) — 이번 패치는 비표시까지만.
- 사이드바 카운트 dim 처리 (값 0일 때 색 흐리게) — 디자인 결정 후 후속.
- 다국어 폴리싱(중국어/일본어 등) — ko/en 두 종류만.

## Risks / open questions

- 시드 `lists`를 비우면 기존 사용자(이미 lists에 4개가 저장된 사람)는
  여전히 사이드바에 남아 있는다. 시드 변경은 새 설치/리셋에만 영향.
  → 기존 데이터 마이그레이션은 별도. 일단 깨끗한 시드만 적용.
- "Urgent" 영문 라벨이 single-word라 본문 "Important and Urgent"와
  살짝 다른 인상. 라벨 별명임을 받아들임.
- 한국어 "긴급" 단어가 매트릭스 본문 "중요하고 급한 것"과 어휘 차이.
  사이드바 별명이라 OK 판단.

## Verification

1. `npm run typecheck` 통과.
2. `npm test` 통과 (selector 테스트 fixture 업데이트 포함 8개 케이스).
3. dev 서버에서:
   - 사이드바 한국어/영어 모두 라벨 잘림 없는지.
   - smart list 클릭 → 매트릭스에서 같은 사분면 색 wash로 단일
     리스트 보임.
   - 같은 reminder를 매트릭스에서 본 사분면과 사이드바에서 본 카테고리가
     일치하는지 (예: 빨간 사분면에 들어간 항목 = 사이드바 "긴급" 카운트).
   - MY LISTS 섹션 사라졌는지.
   - Settings 버튼 사이드바 최하단인지.
4. `npm run tauri:build -- --bundles app` 후 macOS 앱에서 동일 확인.
