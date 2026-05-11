use serde::{Deserialize, Serialize};
use serde_with::rust::double_option;
use std::collections::HashSet;

use super::error::{ReminderError, ReminderResult};

pub const SCHEMA_VERSION: u32 = 1;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ReminderStatus {
    Open,
    Focused,
    Waiting,
    Done,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ReminderPriority {
    Low,
    Normal,
    High,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReminderList {
    pub id: String,
    pub name: String,
    pub accent: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReminderSubtask {
    pub id: String,
    pub title: String,
    pub done: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Reminder {
    pub id: String,
    pub title: String,
    pub notes: String,
    pub list_id: String,
    pub status: ReminderStatus,
    pub priority: ReminderPriority,
    #[serde(default)]
    pub manual_rank: Option<f64>,
    pub due_at: Option<String>,
    pub remind_at: Option<String>,
    pub linked_instance: Option<String>,
    pub subtasks: Vec<ReminderSubtask>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReminderSnapshot {
    pub schema_version: u32,
    pub lists: Vec<ReminderList>,
    pub reminders: Vec<Reminder>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateReminderInput {
    pub title: String,
    pub list_id: String,
    pub initial_status: Option<ReminderStatus>,
    pub priority: Option<ReminderPriority>,
    #[serde(default)]
    pub manual_rank: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UpdateReminderInput {
    pub title: Option<String>,
    pub notes: Option<String>,
    pub list_id: Option<String>,
    pub status: Option<ReminderStatus>,
    pub priority: Option<ReminderPriority>,
    #[serde(default, with = "double_option")]
    pub manual_rank: Option<Option<f64>>,
    #[serde(default, with = "double_option")]
    pub due_at: Option<Option<String>>,
    #[serde(default, with = "double_option")]
    pub remind_at: Option<Option<String>>,
    #[serde(default, with = "double_option")]
    pub linked_instance: Option<Option<String>>,
    pub subtasks: Option<Vec<ReminderSubtask>>,
}

pub fn validate_snapshot(snapshot: &ReminderSnapshot) -> ReminderResult<()> {
    if snapshot.schema_version != SCHEMA_VERSION {
        return Err(ReminderError::InvalidInput(format!(
            "unsupported schema version {}",
            snapshot.schema_version
        )));
    }

    if snapshot.lists.is_empty() {
        return Err(ReminderError::InvalidInput(
            "at least one list is required".into(),
        ));
    }

    let mut list_ids = HashSet::new();
    for list in &snapshot.lists {
        if list.id.trim().is_empty() {
            return Err(ReminderError::InvalidInput("list id is required".into()));
        }
        if list.name.trim().is_empty() {
            return Err(ReminderError::InvalidInput("list name is required".into()));
        }
        if !list_ids.insert(list.id.as_str()) {
            return Err(ReminderError::InvalidInput(format!(
                "duplicate list id {}",
                list.id
            )));
        }
    }

    let mut reminder_ids = HashSet::new();
    let mut focused_count = 0usize;
    for reminder in &snapshot.reminders {
        if reminder.id.trim().is_empty() {
            return Err(ReminderError::InvalidInput(
                "reminder id is required".into(),
            ));
        }
        if reminder.title.trim().is_empty() {
            return Err(ReminderError::InvalidInput(format!(
                "reminder {} title is required",
                reminder.id
            )));
        }
        if reminder.manual_rank.is_some_and(|rank| !rank.is_finite()) {
            return Err(ReminderError::InvalidInput(format!(
                "reminder {} manual rank must be finite",
                reminder.id
            )));
        }
        if !reminder_ids.insert(reminder.id.as_str()) {
            return Err(ReminderError::InvalidInput(format!(
                "duplicate reminder id {}",
                reminder.id
            )));
        }
        if !list_ids.contains(reminder.list_id.as_str()) {
            return Err(ReminderError::InvalidInput(format!(
                "reminder {} references missing list {}",
                reminder.id, reminder.list_id
            )));
        }
        if reminder.status == ReminderStatus::Focused {
            focused_count += 1;
        }
    }

    if focused_count > 1 {
        return Err(ReminderError::InvalidInput(
            "only one focused reminder is allowed".into(),
        ));
    }

    Ok(())
}

pub fn validate_create_input(
    snapshot: &ReminderSnapshot,
    input: &CreateReminderInput,
) -> ReminderResult<()> {
    if input.title.trim().is_empty() {
        return Err(ReminderError::InvalidInput("title is required".into()));
    }
    if !snapshot.lists.iter().any(|list| list.id == input.list_id) {
        return Err(ReminderError::InvalidInput(format!(
            "unknown list id {}",
            input.list_id
        )));
    }
    if matches!(input.initial_status, Some(ReminderStatus::Focused)) {
        return Err(ReminderError::InvalidInput(
            "focused reminders must be created through set_focus_reminder".into(),
        ));
    }
    if input.manual_rank.is_some_and(|rank| !rank.is_finite()) {
        return Err(ReminderError::InvalidInput(
            "manual rank must be finite".into(),
        ));
    }
    Ok(())
}

pub fn validate_update_input(input: &UpdateReminderInput) -> ReminderResult<()> {
    if input
        .title
        .as_ref()
        .is_some_and(|title| title.trim().is_empty())
    {
        return Err(ReminderError::InvalidInput("title cannot be empty".into()));
    }
    if matches!(input.status, Some(ReminderStatus::Focused)) {
        return Err(ReminderError::InvalidInput(
            "use set_focus_reminder to focus a reminder".into(),
        ));
    }
    if input
        .manual_rank
        .flatten()
        .is_some_and(|rank| !rank.is_finite())
    {
        return Err(ReminderError::InvalidInput(
            "manual rank must be finite".into(),
        ));
    }
    Ok(())
}

pub fn validate_update_target(
    snapshot: &ReminderSnapshot,
    input: &UpdateReminderInput,
) -> ReminderResult<()> {
    if let Some(list_id) = &input.list_id {
        if !snapshot.lists.iter().any(|list| list.id == *list_id) {
            return Err(ReminderError::InvalidInput(format!(
                "unknown list id {}",
                list_id
            )));
        }
    }
    Ok(())
}

pub fn find_reminder_index(
    snapshot: &ReminderSnapshot,
    reminder_id: &str,
) -> ReminderResult<usize> {
    snapshot
        .reminders
        .iter()
        .position(|reminder| reminder.id == reminder_id)
        .ok_or_else(|| ReminderError::NotFound(format!("reminder {}", reminder_id)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::reminders::seed::seed_snapshot;

    fn snapshot_with_two_reminders() -> ReminderSnapshot {
        let mut snapshot = seed_snapshot();
        let now = "2026-05-08T02:08:00.000Z".to_string();
        snapshot.reminders = vec![
            Reminder {
                id: "r-1".to_string(),
                title: "Focused".to_string(),
                notes: String::new(),
                list_id: "today".to_string(),
                status: ReminderStatus::Focused,
                priority: ReminderPriority::High,
                manual_rank: None,
                due_at: None,
                remind_at: None,
                linked_instance: None,
                subtasks: vec![],
                created_at: now.clone(),
                updated_at: now.clone(),
            },
            Reminder {
                id: "r-2".to_string(),
                title: "Open".to_string(),
                notes: String::new(),
                list_id: "today".to_string(),
                status: ReminderStatus::Open,
                priority: ReminderPriority::Normal,
                manual_rank: None,
                due_at: None,
                remind_at: None,
                linked_instance: None,
                subtasks: vec![],
                created_at: now.clone(),
                updated_at: now,
            },
        ];
        snapshot
    }

    #[test]
    fn validates_seed_snapshot() {
        validate_snapshot(&seed_snapshot()).expect("seed must be valid");
    }

    #[test]
    fn rejects_multiple_focused_reminders() {
        let mut snapshot = snapshot_with_two_reminders();
        snapshot.reminders[1].status = ReminderStatus::Focused;

        let error = validate_snapshot(&snapshot).expect_err("two focused reminders should fail");
        assert!(error.to_string().contains("only one focused"));
    }

    #[test]
    fn rejects_missing_list_references() {
        let mut snapshot = snapshot_with_two_reminders();
        snapshot.reminders[0].list_id = "missing".into();

        let error = validate_snapshot(&snapshot).expect_err("missing list reference should fail");
        assert!(error.to_string().contains("references missing list"));
    }

    #[test]
    fn deserializes_update_patch_missing_null_and_value() {
        let input: UpdateReminderInput = serde_json::from_str(
            r#"{"title":"A","dueAt":null,"remindAt":"2026-05-08T00:00:00.000Z"}"#,
        )
        .expect("patch must parse");

        assert_eq!(input.manual_rank, None);
        assert_eq!(input.due_at, Some(None));
        assert_eq!(
            input.remind_at,
            Some(Some("2026-05-08T00:00:00.000Z".to_string()))
        );
        assert_eq!(input.linked_instance, None);
    }
}
