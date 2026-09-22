#[tauri::command]
fn autosave_backup(content: String) -> Result<(), String> {
    use std::fs;
    use std::path::Path;
    
    let folder = Path::new(r#"C:\Users\jeffv\OneDrive\Documents\Levels\MATERIAL\ATM\Installer\ATM\SNAPSHOT"#);
    if !folder.exists() {
        fs::create_dir_all(folder).map_err(|e| e.to_string())?;
    }
    
    // Save to a fixed file name or with a timestamp? The user said "a function of autosaving".
    // I'll just use a single autosave.json file to avoid spamming the folder, or maybe keep the latest one.
    let file_path = folder.join("autosave.json");
    fs::write(file_path, content).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![autosave_backup])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
