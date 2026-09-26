mod input;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};

#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::WindowsAndMessaging::{
    GetWindowLongPtrW, SetWindowLongPtrW, GWL_EXSTYLE, WS_EX_NOACTIVATE,
};

#[cfg(target_os = "linux")]
use gtk::prelude::*;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct KeySize {
    width: f64,
    height: f64,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct KeyStyle {
    #[serde(default)]
    label_color: Option<String>,
    #[serde(default)]
    border_color: Option<String>,
    #[serde(default)]
    background_color: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct BoardLayout {
    id: String,
    name: String,
    base: String,
    rows: Vec<Vec<String>>,
    #[serde(default)]
    background_color: Option<String>,
    #[serde(default)]
    key_sizes: Option<Vec<Vec<Option<KeySize>>>>,
    #[serde(default)]
    key_styles: Option<Vec<Vec<Option<KeyStyle>>>>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "lowercase")]
enum MacroStep {
    Keys { keys: Vec<String> },
    Text { text: String },
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Macro {
    id: String,
    name: String,
    #[serde(default)]
    icon: Option<String>,
    steps: Vec<MacroStep>,
}

#[derive(Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct BoardsFile {
    layouts: Vec<BoardLayout>,
    macros: Vec<Macro>,
}

fn boards_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("boards.json"))
}

#[tauri::command]
fn read_boards(app: AppHandle) -> Result<BoardsFile, String> {
    let path = boards_path(&app)?;
    match std::fs::read_to_string(&path) {
        Ok(contents) => serde_json::from_str(&contents)
            .map_err(|e| format!("invalid boards.json: {e}")),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            Ok(BoardsFile::default())
        }
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
fn write_boards(app: AppHandle, boards: BoardsFile) -> Result<(), String> {
    let path = boards_path(&app)?;
    let json = serde_json::to_string_pretty(&boards).map_err(|e| e.to_string())?;
    std::fs::write(&path, json).map_err(|e| e.to_string())?;
    app.emit("boards-changed", ()).map_err(|e| e.to_string())
}

#[cfg(target_os = "linux")]
fn configure_linux_window(window: &gtk::ApplicationWindow) {
    window.set_keep_above(true);
    window.set_focus_on_map(false);
    window.set_accept_focus(false);
}

#[tauri::command]
fn send_key(key: String, modifiers: Vec<String>) -> Result<(), String> {
    input::send(&key, &modifiers)
}

#[tauri::command]
fn send_text(text: String) -> Result<(), String> {
    input::send_text(&text)
}

#[tauri::command]
fn caps_lock() -> bool {
    input::caps_lock()
}

#[tauri::command]
fn input_status() -> input::InputStatus {
    input::status()
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(target_os = "windows")]
            {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    let hwnd = window.hwnd().unwrap().0;
                    unsafe {
                        let ex_style = GetWindowLongPtrW(hwnd as _, GWL_EXSTYLE);
                        SetWindowLongPtrW(hwnd as _, GWL_EXSTYLE, ex_style | WS_EX_NOACTIVATE as isize);
                    }
                }
                if let Err(error) = input::hook::install(app.handle().clone()) {
                    eprintln!("physical key feedback disabled: {error}");
                }
            }
            #[cfg(target_os = "linux")]
            {
                use tauri::Manager;
                let input_status = input::status();
                if !input_status.ready {
                    eprintln!(
                        "FlyBoard virtual keyboard unavailable: {}",
                        input_status
                            .message
                            .unwrap_or_else(|| "unknown setup error".into())
                    );
                }
                if let Some(window) = app.get_webview_window("main") {
                    let gtk_window = window.gtk_window()?;
                    configure_linux_window(&gtk_window);
                    gtk_window.connect_map_event(|gtk_window, _| {
                        configure_linux_window(gtk_window);
                        false.into()
                    });
                    gtk_window.connect_window_state_event(|gtk_window, _| {
                        configure_linux_window(gtk_window);
                        false.into()
                    });
                }
                if let Err(error) = input::linux::install_hook(app.handle().clone()) {
                    eprintln!("physical key feedback disabled: {error}");
                }
            }
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            send_key,
            send_text,
            caps_lock,
            input_status,
            read_boards,
            write_boards
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
