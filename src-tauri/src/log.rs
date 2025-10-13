use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::str::FromStr;
use std::sync::{Arc, Mutex, OnceLock};
use tauri::{AppHandle, Emitter};

const MAX_LOG_ENTRIES: usize = 1000;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub timestamp: chrono::DateTime<chrono::Local>,
    pub level: String,
    pub target: String,
    pub message: String,
    pub file: Option<String>,
    pub line: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogFilter {
    pub level: Option<String>,
    pub target: Option<String>,
    pub search: Option<String>,
}

#[derive(Debug)]
struct QCAForgeLoggerContext {
    app: AppHandle,
    entries: Arc<Mutex<VecDeque<LogEntry>>>,
}

impl QCAForgeLoggerContext {
    fn add_entry(&self, entry: LogEntry) {
        if let Ok(mut entries) = self.entries.lock() {
            if entries.len() >= MAX_LOG_ENTRIES {
                entries.pop_front();
            }
            entries.push_back(entry.clone());
            let _ = self.app.emit("logEntryAdded", entry);
        }
    }

    fn get_entries(&self, filter: Option<LogFilter>) -> Vec<LogEntry> {
        if let Ok(entries) = self.entries.lock() {
            let mut filtered_entries: Vec<LogEntry> = entries.iter().cloned().collect();

            if let Some(filter) = filter {
                filtered_entries.retain(|entry| {
                    // Filter by level
                    if let Some(ref level_filter) = filter.level {
                        if entry.level != *level_filter {
                            return false;
                        }
                    }

                    // Filter by target
                    if let Some(ref target_filter) = filter.target {
                        if !entry.target.contains(target_filter) {
                            return false;
                        }
                    }

                    // Filter by search term
                    if let Some(ref search_filter) = filter.search {
                        let search_lower = search_filter.to_lowercase();
                        if !entry.message.to_lowercase().contains(&search_lower)
                            && !entry.target.to_lowercase().contains(&search_lower)
                        {
                            return false;
                        }
                    }

                    true
                });
            }

            filtered_entries
        } else {
            Vec::new()
        }
    }

    fn clear_entries(&self) {
        if let Ok(mut entries) = self.entries.lock() {
            entries.clear();
        }
    }
}

pub struct QCAForgeLogger;

static LOGGER_CONTEXT: OnceLock<QCAForgeLoggerContext> = OnceLock::new();

impl QCAForgeLogger {
    pub fn init(app: AppHandle) {
        LOGGER_CONTEXT
            .set(QCAForgeLoggerContext {
                app: app.clone(),
                entries: Arc::new(Mutex::new(VecDeque::with_capacity(MAX_LOG_ENTRIES))),
            })
            .expect("Logger already initialized");

        log::set_boxed_logger(Box::new(QCAForgeLogger)).unwrap();
        log::info!("Logger initialized");

        QCAForgeLogger::set_level(log::LevelFilter::Trace);
    }

    pub fn set_level(level: log::LevelFilter) {
        log::set_max_level(level);
        log::info!("Log level set to: {:?}", level);
    }

    pub fn get_level() -> log::LevelFilter {
        log::max_level()
    }

    fn get_instance() -> &'static QCAForgeLoggerContext {
        LOGGER_CONTEXT.get().expect("Logger not initialized")
    }
}

impl log::Log for QCAForgeLogger {
    fn enabled(&self, metadata: &log::Metadata) -> bool {
        metadata.level() <= log::max_level()
    }

    fn log(&self, record: &log::Record) {
        if self.enabled(record.metadata()) {
            let timestamp = chrono::Local::now();
            let pretty_timestamp: String = timestamp.format("%Y-%m-%d %H:%M:%S%.3f").to_string();

            let entry = LogEntry {
                timestamp,
                level: record.level().to_string(),
                target: record.target().to_string(),
                message: record.args().to_string(),
                file: record.file().map(|f| f.to_string()),
                line: record.line(),
            };

            // Print to console for development
            println!(
                "[{}] {} - {} - {}",
                pretty_timestamp, entry.level, entry.target, entry.message
            );

            QCAForgeLogger::get_instance().add_entry(entry);
        }
    }

    fn flush(&self) {}
}

#[tauri::command]
pub fn set_log_level(log_level: String) -> Result<(), String> {
    let log_level = log::LevelFilter::from_str(&log_level).map_err(|_err| "Invalid log level")?;
    QCAForgeLogger::set_level(log_level);
    Ok(())
}

#[tauri::command]
pub fn get_log_level() -> String {
    format!("{:?}", QCAForgeLogger::get_level())
}

#[tauri::command]
pub fn clear_log() {
    QCAForgeLogger::get_instance().clear_entries();
}

#[tauri::command]
pub fn get_log(filter: Option<LogFilter>) -> Vec<LogEntry> {
    QCAForgeLogger::get_instance().get_entries(filter)
}

#[tauri::command]
pub fn get_log_stats() -> serde_json::Value {
    if let Ok(entries) = QCAForgeLogger::get_instance().entries.lock() {
        let mut stats = std::collections::HashMap::new();
        let mut level_counts = std::collections::HashMap::new();
        let mut target_counts = std::collections::HashMap::new();

        for entry in entries.iter() {
            *level_counts.entry(entry.level.clone()).or_insert(0) += 1;
            *target_counts.entry(entry.target.clone()).or_insert(0) += 1;
        }

        stats.insert(
            "total_entries",
            serde_json::Value::Number(entries.len().into()),
        );
        stats.insert(
            "max_entries",
            serde_json::Value::Number(MAX_LOG_ENTRIES.into()),
        );
        stats.insert(
            "level_counts",
            serde_json::to_value(level_counts).unwrap_or_default(),
        );
        stats.insert(
            "target_counts",
            serde_json::to_value(target_counts).unwrap_or_default(),
        );
        stats.insert("current_level", serde_json::Value::String(get_log_level()));

        serde_json::Value::Object(stats.into_iter().map(|(k, v)| (k.to_string(), v)).collect())
    } else {
        serde_json::json!({})
    }
}

#[tauri::command]
pub fn log_message(level: String, target: String, message: String) -> Result<(), String> {
    match level.to_uppercase().as_str() {
        "ERROR" => log::error!(target: &target, "{}", message),
        "WARN" => log::warn!(target: &target, "{}", message),
        "INFO" => log::info!(target: &target, "{}", message),
        "DEBUG" => log::debug!(target: &target, "{}", message),
        "TRACE" => log::trace!(target: &target, "{}", message),
        _ => return Err("Invalid log level".to_string()),
    }

    Ok(())
}
