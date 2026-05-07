use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};

use chrono::{SecondsFormat, Utc};
use tauri::{AppHandle, Manager};

use super::domain::{validate_snapshot, ReminderSnapshot};
use super::error::{ReminderError, ReminderResult};
use super::seed::seed_snapshot;

const REMINDERS_FILE: &str = "reminders.json";
const TMP_FILE: &str = "reminders.json.tmp";

pub struct ReminderStorage {
    base_dir: PathBuf,
}

impl ReminderStorage {
    pub fn new(base_dir: impl Into<PathBuf>) -> Self {
        Self {
            base_dir: base_dir.into(),
        }
    }

    pub fn load_snapshot(&self) -> ReminderResult<ReminderSnapshot> {
        let path = self.snapshot_path();
        self.remove_stale_tmp()?;

        if !path.exists() {
            return Ok(seed_snapshot());
        }

        let raw = fs::read_to_string(&path)?;
        let snapshot = match serde_json::from_str::<ReminderSnapshot>(&raw) {
            Ok(snapshot) => snapshot,
            Err(_) => {
                self.quarantine(&path, "corrupt")?;
                return Ok(seed_snapshot());
            }
        };

        if validate_snapshot(&snapshot).is_err() {
            self.quarantine(&path, "invalid")?;
            return Ok(seed_snapshot());
        }

        Ok(snapshot)
    }

    pub fn save_snapshot(&self, snapshot: &ReminderSnapshot) -> ReminderResult<()> {
        validate_snapshot(snapshot)?;
        fs::create_dir_all(&self.base_dir)?;

        let tmp_path = self.tmp_path();
        let final_path = self.snapshot_path();
        let encoded = serde_json::to_string_pretty(snapshot)?;

        {
            let mut file = File::create(&tmp_path)?;
            file.write_all(encoded.as_bytes())?;
            file.sync_all()?;
        }

        fs::rename(tmp_path, final_path)?;
        Ok(())
    }

    fn snapshot_path(&self) -> PathBuf {
        self.base_dir.join(REMINDERS_FILE)
    }

    fn tmp_path(&self) -> PathBuf {
        self.base_dir.join(TMP_FILE)
    }

    fn remove_stale_tmp(&self) -> ReminderResult<()> {
        let tmp_path = self.tmp_path();
        if tmp_path.exists() {
            fs::remove_file(tmp_path)?;
        }
        Ok(())
    }

    fn quarantine(&self, path: &Path, kind: &str) -> ReminderResult<()> {
        let stamp = Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true);
        let safe_stamp = stamp.replace([':', '.'], "-");
        let target = self
            .base_dir
            .join(format!("reminders.{kind}.{safe_stamp}.json"));
        fs::rename(path, target)?;
        Ok(())
    }
}

pub fn storage_from_app(app: &AppHandle) -> ReminderResult<ReminderStorage> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|_| ReminderError::AppDataDir)?;
    Ok(ReminderStorage::new(dir))
}

pub fn load_snapshot(app: &AppHandle) -> ReminderResult<ReminderSnapshot> {
    storage_from_app(app)?.load_snapshot()
}

pub fn save_snapshot(app: &AppHandle, snapshot: &ReminderSnapshot) -> ReminderResult<()> {
    storage_from_app(app)?.save_snapshot(snapshot)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::reminders::domain::ReminderSnapshot;
    use tempfile::tempdir;

    #[test]
    fn missing_file_loads_seed_snapshot() {
        let dir = tempdir().expect("tempdir");
        let snapshot = ReminderStorage::new(dir.path())
            .load_snapshot()
            .expect("missing file should load seed");

        assert_eq!(snapshot.reminders[0].id, "r-focus");
    }

    #[test]
    fn save_and_load_roundtrip() {
        let dir = tempdir().expect("tempdir");
        let storage = ReminderStorage::new(dir.path());
        let snapshot = seed_snapshot();

        storage.save_snapshot(&snapshot).expect("save succeeds");
        let loaded = storage.load_snapshot().expect("load succeeds");

        assert_eq!(loaded, snapshot);
    }

    #[test]
    fn corrupt_json_is_quarantined_and_seeded() {
        let dir = tempdir().expect("tempdir");
        let path = dir.path().join(REMINDERS_FILE);
        fs::write(&path, "{not valid").expect("write corrupt");

        let snapshot = ReminderStorage::new(dir.path())
            .load_snapshot()
            .expect("corrupt should recover");

        assert_eq!(snapshot, seed_snapshot());
        assert!(!path.exists());
        assert!(fs::read_dir(dir.path())
            .expect("read dir")
            .any(|entry| entry
                .expect("entry")
                .file_name()
                .to_string_lossy()
                .contains(".corrupt.")));
    }

    #[test]
    fn parseable_invalid_json_is_quarantined_and_seeded() {
        let dir = tempdir().expect("tempdir");
        let path = dir.path().join(REMINDERS_FILE);
        let mut invalid: ReminderSnapshot = seed_snapshot();
        invalid.reminders[0].list_id = "missing".into();
        fs::write(
            &path,
            serde_json::to_string_pretty(&invalid).expect("serialize invalid"),
        )
        .expect("write invalid");

        let snapshot = ReminderStorage::new(dir.path())
            .load_snapshot()
            .expect("invalid should recover");

        assert_eq!(snapshot, seed_snapshot());
        assert!(!path.exists());
        assert!(fs::read_dir(dir.path())
            .expect("read dir")
            .any(|entry| entry
                .expect("entry")
                .file_name()
                .to_string_lossy()
                .contains(".invalid.")));
    }

    #[test]
    fn stale_tmp_is_removed_on_load() {
        let dir = tempdir().expect("tempdir");
        let tmp_path = dir.path().join(TMP_FILE);
        fs::write(&tmp_path, "stale").expect("write tmp");

        ReminderStorage::new(dir.path())
            .load_snapshot()
            .expect("load removes tmp");

        assert!(!tmp_path.exists());
    }
}
