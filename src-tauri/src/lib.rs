mod reminders;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            reminders::commands::load_reminders,
            reminders::commands::save_reminders,
            reminders::commands::create_reminder,
            reminders::commands::update_reminder,
            reminders::commands::delete_reminder,
            reminders::commands::set_focus_reminder,
            reminders::notifications::show_reminder_notification
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
