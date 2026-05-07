use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotifyReminderInput {
    pub title: String,
    pub body: Option<String>,
}

#[tauri::command]
pub fn show_reminder_notification(
    app: AppHandle,
    input: NotifyReminderInput,
) -> Result<(), String> {
    let title = input.title.trim();
    if title.is_empty() {
        return Err("invalid input: notification title is required".into());
    }

    let body = input
        .body
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("미리알림");

    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn notify_input_serializes_camel_case() {
        let encoded = serde_json::to_string(&NotifyReminderInput {
            title: "T".into(),
            body: Some("B".into()),
        })
        .expect("serialize");

        assert!(encoded.contains("title"));
        assert!(encoded.contains("body"));
    }
}
