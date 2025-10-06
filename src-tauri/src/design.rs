use std::{fs::File, io::Read};

#[tauri::command]
pub fn load_design_file(filename: String) -> Result<String, String> {
    let file = File::open(filename).map_err(|_err| "File cannot be opened")?;
    let mut buf_reader = std::io::BufReader::new(file);
    let mut file_contents = String::new();
    buf_reader
        .read_to_string(&mut file_contents)
        .map_err(|_err| "Failed to read file contents")?;
    Ok(file_contents)
}

#[tauri::command]
pub fn save_design_file(filename: String, serialized_design: String) -> Result<(), String> {
    let mut file = File::create(filename).map_err(|_err| "Failed to create file")?;
    std::io::Write::write_all(&mut file, serialized_design.as_bytes())
        .map_err(|_err| "Failed to write to file")?;
    Ok(())
}
