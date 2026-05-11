import { useEffect, useRef, useState } from 'react';
import type { Reminder } from '../reminder.schema';

type InlineReminderTitleProps = {
  reminder: Reminder;
  className?: string;
  onRename: (reminderId: string, title: string) => Promise<void>;
};

export function InlineReminderTitle({
  reminder,
  className,
  onRename,
}: InlineReminderTitleProps): React.JSX.Element {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(reminder.title);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(reminder.title);
    }
  }, [editing, reminder.title]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.select();
    }
  }, [editing]);

  async function commit(): Promise<void> {
    const title = draft.trim();
    setEditing(false);
    if (!title || title === reminder.title) {
      setDraft(reminder.title);
      return;
    }
    await onRename(reminder.id, title);
  }

  function cancel(): void {
    setDraft(reminder.title);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        data-reminder-inline-edit="true"
        className={`inline-reminder-title-input ${className ?? ''}`}
        aria-label="Reminder title"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => void commit()}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            void commit();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            cancel();
          }
        }}
      />
    );
  }

  return (
    <span
      data-reminder-inline-edit="true"
      className={`inline-reminder-title ${className ?? ''}`}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setEditing(true);
      }}
    >
      {reminder.title}
    </span>
  );
}
