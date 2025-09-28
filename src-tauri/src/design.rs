use std::{collections::HashMap, fs::File, hash::Hash};
use qca_core::design::file::QCADesign;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[tauri::command]
pub fn load_design_file(
    filename: String,
) -> Result<HashMap<String, Value>, String> {
    let file = File::open(filename).map_err(|_err| "File cannot be opened")?;
    let design_file: HashMap<String, Value> = serde_json::from_reader(file)
        .map_err(|_err| "Failed to parse JSON file")?;
    Ok(design_file)
}