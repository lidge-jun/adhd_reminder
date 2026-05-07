use super::domain::{
    Reminder, ReminderList, ReminderPriority, ReminderSnapshot, ReminderStatus, ReminderSubtask,
    SCHEMA_VERSION,
};

pub fn seed_snapshot() -> ReminderSnapshot {
    let now = "2026-05-08T02:08:00.000Z".to_string();

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
        reminders: vec![
            Reminder {
                id: "r-focus".to_string(),
                title: "Todo i2i 후보 확인".to_string(),
                notes: "첨부 스케치 기반으로 ADHD Todo UI 후보를 고른다.".to_string(),
                list_id: "today".to_string(),
                status: ReminderStatus::Focused,
                priority: ReminderPriority::High,
                due_at: Some("2026-05-08T03:00:00.000Z".to_string()),
                remind_at: Some("2026-05-08T02:40:00.000Z".to_string()),
                linked_instance: Some(":3333".to_string()),
                subtasks: vec![
                    ReminderSubtask {
                        id: "s1".to_string(),
                        title: "후보 B/D 비교".to_string(),
                        done: false,
                    },
                    ReminderSubtask {
                        id: "s2".to_string(),
                        title: "컷오프 UX 결정".to_string(),
                        done: false,
                    },
                ],
                created_at: now.clone(),
                updated_at: now.clone(),
            },
            Reminder {
                id: "r-next-1".to_string(),
                title: "cli-jaw 미리알림 계획 정리".to_string(),
                notes: "구현 범위와 검증 명령을 단계별로 쪼갠다.".to_string(),
                list_id: "today".to_string(),
                status: ReminderStatus::Open,
                priority: ReminderPriority::Normal,
                due_at: None,
                remind_at: None,
                linked_instance: None,
                subtasks: vec![],
                created_at: now.clone(),
                updated_at: now.clone(),
            },
            Reminder {
                id: "r-waiting".to_string(),
                title: "Tauri 알림 권한 확인".to_string(),
                notes: "macOS 권한 요청과 브라우저 대체 동작을 분리한다.".to_string(),
                list_id: "waiting".to_string(),
                status: ReminderStatus::Waiting,
                priority: ReminderPriority::Normal,
                due_at: None,
                remind_at: None,
                linked_instance: None,
                subtasks: vec![],
                created_at: now.clone(),
                updated_at: now,
            },
        ],
    }
}
