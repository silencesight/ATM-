#[tauri::command]
fn autosave_backup(content: String, filename: Option<String>) -> Result<String, String> {
    use std::fs;
    use std::path::Path;
    
    let main_folder = Path::new(r#"C:\Users\jeffv\OneDrive\Documents\Levels\MATERIAL\ATM\SNAPSHOT"#);
    let _ = fs::create_dir_all(main_folder);

    let file_name = filename.unwrap_or_else(|| "autosave.json".to_string());
    let target_path = main_folder.join(&file_name);
    fs::write(&target_path, &content).map_err(|e| e.to_string())?;

    // Also update latest autosave.json
    let latest_path = main_folder.join("autosave.json");
    let _ = fs::write(&latest_path, &content);
    
    Ok(target_path.to_string_lossy().to_string())
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
