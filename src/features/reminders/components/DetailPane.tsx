import { Bell, Checks, ClockCountdown, Target } from '@phosphor-icons/react';
import type { Reminder } from '../reminder.schema';
import { formatShortDate } from '../../../shared/time';

type DetailPaneProps = {
  reminder: Reminder | null;
  onFocus: (reminderId: string) => void;
  onNotify: (reminder: Reminder) => void;
};

export function DetailPane({ reminder, onFocus, onNotify }: DetailPaneProps): React.JSX.Element {
  if (!reminder) {
    return (
      <aside className="detail-pane empty-detail">
        <Checks size={28} />
        <strong>선택된 미리알림 없음</strong>
        <span>왼쪽 목록에서 작업을 선택하면 세부 정보가 표시됩니다.</span>
      </aside>
    );
  }

  return (
    <aside className="detail-pane" aria-label="Reminder detail">
      <header>
        <span className="detail-kicker">Current item</span>
        <h2>{reminder.title}</h2>
        <p>{reminder.notes || '메모가 아직 없습니다.'}</p>
      </header>

      <div className="detail-actions">
        <button type="button" onClick={() => onFocus(reminder.id)}>
          <Target size={17} />
          집중으로 이동
        </button>
        <button type="button" onClick={() => onNotify(reminder)}>
          <Bell size={17} />
          알림 테스트
        </button>
      </div>

      <dl className="detail-grid">
        <div>
          <dt>상태</dt>
          <dd>{reminder.status}</dd>
        </div>
        <div>
          <dt>우선순위</dt>
          <dd>{reminder.priority}</dd>
        </div>
        <div>
          <dt>마감</dt>
          <dd>{formatShortDate(reminder.dueAt)}</dd>
        </div>
        <div>
          <dt>연결</dt>
          <dd>{reminder.linkedInstance ?? '없음'}</dd>
        </div>
      </dl>

      <section className="subtask-panel" aria-labelledby="subtask-title">
        <div className="section-heading">
          <h3 id="subtask-title">쪼갠 행동</h3>
          <span>{reminder.subtasks.length}</span>
        </div>
        {reminder.subtasks.length > 0 ? (
          <ul>
            {reminder.subtasks.map((subtask) => (
              <li key={subtask.id}>
                <Checks size={15} weight={subtask.done ? 'fill' : 'regular'} />
                <span>{subtask.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>아직 쪼갠 행동이 없습니다.</p>
        )}
      </section>

      <footer className="cutoff-box">
        <ClockCountdown size={18} />
        <span>컷오프는 지금 항목을 끝낸 뒤 새 범위를 만들지 않는 ADHD 안전장치입니다.</span>
      </footer>
    </aside>
  );
}
