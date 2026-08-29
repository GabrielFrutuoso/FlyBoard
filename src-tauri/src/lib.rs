mod input;

#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::WindowsAndMessaging::{
    GetWindowLongPtrW, SetWindowLongPtrW, GWL_EXSTYLE, WS_EX_NOACTIVATE,
};

#[cfg(target_os = "linux")]
use gtk::prelude::*;

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
                    let gtk_window = window.gtk_window();
                    gtk_window?.set_accept_focus(false);
                }
            }
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![send_key, send_text, caps_lock, input_status])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
