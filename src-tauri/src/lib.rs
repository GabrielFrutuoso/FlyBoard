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
            }
            #[cfg(target_os = "linux")]
            {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    let gtk_window = window.gtk_window();
                    gtk_window?.set_accept_focus(false);
                }
            }
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![send_key])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
