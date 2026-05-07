use chrono::{SecondsFormat, Utc};
use uuid::Uuid;

use super::domain::{
    find_reminder_index, validate_create_input, validate_snapshot, validate_update_input,
    validate_update_target, CreateReminderInput, Reminder, ReminderPriority, ReminderSnapshot,
    ReminderStatus, UpdateReminderInput,
};
use super::error::ReminderResult;

pub fn create_reminder(
    snapshot: &ReminderSnapshot,
    input: CreateReminderInput,
) -> ReminderResult<ReminderSnapshot> {
    validate_create_input(snapshot, &input)?;

    let now = now_iso();
    let reminder = Reminder {
        id: new_reminder_id(),
        title: input.title.trim().to_string(),
        notes: String::new(),
        list_id: input.list_id,
        status: input.initial_status.unwrap_or(ReminderStatus::Open),
        priority: input.priority.unwrap_or(ReminderPriority::Normal),
        due_at: None,
        remind_at: None,
        linked_instance: None,
        subtasks: vec![],
        created_at: now.clone(),
        updated_at: now,
    };

    let mut next = snapshot.clone();
    next.reminders.insert(0, reminder);
    validate_snapshot(&next)?;
    Ok(next)
}

pub fn update_reminder(
    snapshot: &ReminderSnapshot,
    reminder_id: &str,
    input: UpdateReminderInput,
) -> ReminderResult<ReminderSnapshot> {
    validate_update_input(&input)?;
    let mut next = snapshot.clone();
    validate_update_target(&next, &input)?;
    let index = find_reminder_index(&next, reminder_id)?;
    let reminder = &mut next.reminders[index];

    if let Some(title) = input.title {
        reminder.title = title.trim().to_string();
    }
    if let Some(notes) = input.notes {
        reminder.notes = notes;
    }
    if let Some(list_id) = input.list_id {
        reminder.list_id = list_id;
    }
    if let Some(status) = input.status {
        reminder.status = status;
    }
    if let Some(priority) = input.priority {
        reminder.priority = priority;
    }
    if let Some(due_at) = input.due_at {
        reminder.due_at = due_at;
    }
    if let Some(remind_at) = input.remind_at {
        reminder.remind_at = remind_at;
    }
    if let Some(linked_instance) = input.linked_instance {
        reminder.linked_instance = linked_instance;
    }
    if let Some(subtasks) = input.subtasks {
        reminder.subtasks = subtasks;
    }
    reminder.updated_at = now_iso();

    validate_snapshot(&next)?;
    Ok(next)
}

pub fn delete_reminder(
    snapshot: &ReminderSnapshot,
    reminder_id: &str,
) -> ReminderResult<ReminderSnapshot> {
    find_reminder_index(snapshot, reminder_id)?;

    let mut next = snapshot.clone();
    next.reminders.retain(|reminder| reminder.id != reminder_id);
    validate_snapshot(&next)?;
    Ok(next)
}

pub fn set_focus_reminder(
    snapshot: &ReminderSnapshot,
    reminder_id: &str,
) -> ReminderResult<ReminderSnapshot> {
    find_reminder_index(snapshot, reminder_id)?;

    let mut next = snapshot.clone();
    let now = now_iso();
    for reminder in &mut next.reminders {
        if reminder.id == reminder_id {
            reminder.status = ReminderStatus::Focused;
            reminder.updated_at = now.clone();
        } else if reminder.status == ReminderStatus::Focused {
            reminder.status = ReminderStatus::Open;
            reminder.updated_at = now.clone();
        }
    }

    validate_snapshot(&next)?;
    Ok(next)
}

pub fn validate_for_save(snapshot: ReminderSnapshot) -> ReminderResult<ReminderSnapshot> {
    validate_snapshot(&snapshot)?;
    Ok(snapshot)
}

fn new_reminder_id() -> String {
    format!("r-{}", Uuid::new_v4())
}

fn now_iso() -> String {
    Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::reminders::domain::{ReminderPriority, ReminderStatus, UpdateReminderInput};
    use crate::reminders::seed::seed_snapshot;

    #[test]
    fn create_generates_r_prefixed_id_and_timestamps() {
        let snapshot = seed_snapshot();
        let next = create_reminder(
            &snapshot,
            CreateReminderInput {
                title: "  Rust MVP 구현  ".into(),
                list_id: "today".into(),
                initial_status: None,
                priority: None,
            },
        )
        .expect("create succeeds");

        let created = &next.reminders[0];
        assert!(created.id.starts_with("r-"));
        assert_eq!(created.title, "Rust MVP 구현");
        assert_eq!(created.status, ReminderStatus::Open);
        assert!(chrono::DateTime::parse_from_rfc3339(&created.created_at).is_ok());
        assert_eq!(created.created_at, created.updated_at);
    }

    #[test]
    fn update_uses_tri_state_nullable_fields() {
        let snapshot = seed_snapshot();
        let next = update_reminder(
            &snapshot,
            "r-focus",
            UpdateReminderInput {
                due_at: Some(None),
                remind_at: Some(Some("2026-05-08T04:00:00.000Z".into())),
                linked_instance: None,
                priority: Some(ReminderPriority::Low),
                ..Default::default()
            },
        )
        .expect("update succeeds");

        let reminder = next
            .reminders
            .iter()
            .find(|item| item.id == "r-focus")
            .unwrap();
        assert_eq!(reminder.due_at, None);
        assert_eq!(reminder.remind_at, Some("2026-05-08T04:00:00.000Z".into()));
        assert_eq!(reminder.linked_instance, Some(":3333".into()));
        assert_eq!(reminder.priority, ReminderPriority::Low);
    }

    #[test]
    fn update_can_move_between_lists() {
        let snapshot = seed_snapshot();
        let next = update_reminder(
            &snapshot,
            "r-next-1",
            UpdateReminderInput {
                list_id: Some("later".into()),
                status: Some(ReminderStatus::Open),
                priority: Some(ReminderPriority::Low),
                ..Default::default()
            },
        )
        .expect("move succeeds");

        let reminder = next
            .reminders
            .iter()
            .find(|item| item.id == "r-next-1")
            .unwrap();
        assert_eq!(reminder.list_id, "later");
        assert_eq!(reminder.priority, ReminderPriority::Low);
    }

    #[test]
    fn update_rejects_direct_focus_status() {
        let snapshot = seed_snapshot();
        let error = update_reminder(
            &snapshot,
            "r-next-1",
            UpdateReminderInput {
                status: Some(ReminderStatus::Focused),
                ..Default::default()
            },
        )
        .expect_err("direct focus should fail");

        assert!(error.to_string().contains("set_focus_reminder"));
    }

    #[test]
    fn set_focus_demotes_prior_focus() {
        let snapshot = seed_snapshot();
        let next = set_focus_reminder(&snapshot, "r-next-1").expect("focus succeeds");

        assert_eq!(
            next.reminders
                .iter()
                .filter(|item| item.status == ReminderStatus::Focused)
                .count(),
            1
        );
        assert_eq!(
            next.reminders
                .iter()
                .find(|item| item.id == "r-next-1")
                .unwrap()
                .status,
            ReminderStatus::Focused
        );
        assert_eq!(
            next.reminders
                .iter()
                .find(|item| item.id == "r-focus")
                .unwrap()
                .status,
            ReminderStatus::Open
        );
    }

    #[test]
    fn delete_unknown_id_returns_not_found() {
        let error = delete_reminder(&seed_snapshot(), "missing").expect_err("missing should fail");
        assert!(error.to_string().contains("not found"));
    }
}
