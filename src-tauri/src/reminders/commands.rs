use tauri::AppHandle;

use super::domain::{CreateReminderInput, ReminderSnapshot, UpdateReminderInput};
use super::error::to_command_error;
use super::{service, storage};

#[tauri::command]
pub fn load_reminders(app: AppHandle) -> Result<ReminderSnapshot, String> {
    storage::load_snapshot(&app).map_err(to_command_error)
}

#[tauri::command]
pub fn save_reminders(
    app: AppHandle,
    snapshot: ReminderSnapshot,
) -> Result<ReminderSnapshot, String> {
    let snapshot = service::validate_for_save(snapshot).map_err(to_command_error)?;
    storage::save_snapshot(&app, &snapshot).map_err(to_command_error)?;
    Ok(snapshot)
}

#[tauri::command]
pub fn create_reminder(
    app: AppHandle,
    input: CreateReminderInput,
) -> Result<ReminderSnapshot, String> {
    let snapshot = storage::load_snapshot(&app).map_err(to_command_error)?;
    let next = service::create_reminder(&snapshot, input).map_err(to_command_error)?;
    storage::save_snapshot(&app, &next).map_err(to_command_error)?;
    Ok(next)
}

#[tauri::command]
pub fn update_reminder(
    app: AppHandle,
    reminder_id: String,
    input: UpdateReminderInput,
) -> Result<ReminderSnapshot, String> {
    let snapshot = storage::load_snapshot(&app).map_err(to_command_error)?;
    let next =
        service::update_reminder(&snapshot, &reminder_id, input).map_err(to_command_error)?;
    storage::save_snapshot(&app, &next).map_err(to_command_error)?;
    Ok(next)
}

#[tauri::command]
pub fn delete_reminder(app: AppHandle, reminder_id: String) -> Result<ReminderSnapshot, String> {
    let snapshot = storage::load_snapshot(&app).map_err(to_command_error)?;
    let next = service::delete_reminder(&snapshot, &reminder_id).map_err(to_command_error)?;
    storage::save_snapshot(&app, &next).map_err(to_command_error)?;
    Ok(next)
}

#[tauri::command]
pub fn set_focus_reminder(app: AppHandle, reminder_id: String) -> Result<ReminderSnapshot, String> {
    let snapshot = storage::load_snapshot(&app).map_err(to_command_error)?;
    let next = service::set_focus_reminder(&snapshot, &reminder_id).map_err(to_command_error)?;
    storage::save_snapshot(&app, &next).map_err(to_command_error)?;
    Ok(next)
}
