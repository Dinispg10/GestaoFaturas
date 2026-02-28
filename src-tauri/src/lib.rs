use std::{fs, io, path::Path};
use tauri::Manager;/<

/ Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg(target_os = "windows")]
fn clear_webview_cache_on_version_change(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let current_version = app.package_info().version.to_string();
    let local_data_dir = app.path().app_local_data_dir()?;
    fs::create_dir_all(&local_data_dir)?;

    let marker_file = local_data_dir.join("last-webview-cache-version.txt");
    let previous_version = fs::read_to_string(&marker_file).unwrap_or_default();

    if previous_version.trim() != current_version {
        clear_known_webview_dirs(&local_data_dir)?;

        if let Ok(cache_dir) = app.path().app_cache_dir() {
            clear_known_webview_dirs(&cache_dir)?;
        }

        fs::write(marker_file, current_version)?;
    }

    Ok(())
}

#[cfg(not(target_os = "windows"))]
fn clear_webview_cache_on_version_change(_app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    Ok(())
}

fn clear_known_webview_dirs(base_dir: &Path) -> io::Result<()> {
    for dir_name in ["EBWebView", "WebView2", "webview2"] {
        let dir = base_dir.join(dir_name);
        if dir.exists() {
            fs::remove_dir_all(dir)?;
        }
    }

    Ok(())
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
    .setup(|app| {
            if let Err(error) = clear_webview_cache_on_version_change(&app.handle().clone()) {
                eprintln!("failed to clear webview cache on version change: {error}");
            }

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

}
