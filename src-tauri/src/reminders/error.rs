use thiserror::Error;

#[derive(Debug, Error)]
pub enum ReminderError {
    #[error("failed to resolve app data directory")]
    AppDataDir,
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("invalid input: {0}")]
    InvalidInput(String),
}

pub type ReminderResult<T> = Result<T, ReminderError>;

pub fn to_command_error(error: ReminderError) -> String {
    error.to_string()
}
