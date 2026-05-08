use super::domain::{ReminderList, ReminderSnapshot, SCHEMA_VERSION};

pub fn seed_snapshot() -> ReminderSnapshot {
    ReminderSnapshot {
        schema_version: SCHEMA_VERSION,
        lists: vec![
            ReminderList {
                id: "today".to_string(),
                name: "오늘".to_string(),
                accent: "#0f8fd6".to_string(),
            },
            ReminderList {
                id: "focus".to_string(),
                name: "집중".to_string(),
                accent: "#d4477f".to_string(),
            },
            ReminderList {
                id: "waiting".to_string(),
                name: "대기".to_string(),
                accent: "#b67818".to_string(),
            },
            ReminderList {
                id: "later".to_string(),
                name: "나중에".to_string(),
                accent: "#667085".to_string(),
            },
        ],
        reminders: vec![],
    }
}
