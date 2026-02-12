// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
    INPUT, INPUT_0, INPUT_KEYBOARD,
    KEYEVENTF_KEYUP, KEYEVENTF_UNICODE, SendInput,
    VK_SHIFT, VK_CONTROL, VK_MENU, VK_RETURN, VK_BACK,
};
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::WindowsAndMessaging::{
    GetWindowLongPtrW, SetWindowLongPtrW, GWL_EXSTYLE, WS_EX_NOACTIVATE,
};

#[cfg(target_os = "linux")]
use enigo::{Enigo, Key, KeyboardControllable};
#[cfg(target_os = "linux")]
use gtk::prelude::*;

#[tauri::command]
fn send_key(key: String, modifiers: Vec<String>) {
    #[cfg(target_os = "windows")]
    unsafe {
        let mut inputs: Vec<INPUT> = Vec::new();

        for modifier in &modifiers {
            let vk = match modifier.as_str() {
                "Shift" => VK_SHIFT,
                "Ctrl" => VK_CONTROL,
                "Alt" => VK_MENU,
                _ => 0,
            };
            if vk != 0 {
                inputs.push(INPUT {
                    r#type: INPUT_KEYBOARD,
                    Anonymous: INPUT_0 {
                        ki: windows_sys::Win32::UI::Input::KeyboardAndMouse::KEYBDINPUT {
                            wVk: vk,
                            wScan: 0,
                            dwFlags: 0, // Key Down
                            time: 0,
                            dwExtraInfo: 0,
                        }
                    }
                });
            }
        }

        // 2. Send Key
        if key == "Return" {
            inputs.push(INPUT { r#type: INPUT_KEYBOARD, Anonymous: INPUT_0 { ki: windows_sys::Win32::UI::Input::KeyboardAndMouse::KEYBDINPUT { wVk: VK_RETURN, wScan: 0, dwFlags: 0, time: 0, dwExtraInfo: 0 } } });
            inputs.push(INPUT { r#type: INPUT_KEYBOARD, Anonymous: INPUT_0 { ki: windows_sys::Win32::UI::Input::KeyboardAndMouse::KEYBDINPUT { wVk: VK_RETURN, wScan: 0, dwFlags: KEYEVENTF_KEYUP, time: 0, dwExtraInfo: 0 } } });
        } else if key == "Backspace" {
            inputs.push(INPUT { r#type: INPUT_KEYBOARD, Anonymous: INPUT_0 { ki: windows_sys::Win32::UI::Input::KeyboardAndMouse::KEYBDINPUT { wVk: VK_BACK, wScan: 0, dwFlags: 0, time: 0, dwExtraInfo: 0 } } });
            inputs.push(INPUT { r#type: INPUT_KEYBOARD, Anonymous: INPUT_0 { ki: windows_sys::Win32::UI::Input::KeyboardAndMouse::KEYBDINPUT { wVk: VK_BACK, wScan: 0, dwFlags: KEYEVENTF_KEYUP, time: 0, dwExtraInfo: 0 } } });
        } else {
            // Send Character (Unicode)
            for char_code in key.encode_utf16() {
                inputs.push(INPUT {
                    r#type: INPUT_KEYBOARD,
                    Anonymous: INPUT_0 {
                        ki: windows_sys::Win32::UI::Input::KeyboardAndMouse::KEYBDINPUT {
                            wVk: 0,
                            wScan: char_code,
                            dwFlags: KEYEVENTF_UNICODE,
                            time: 0,
                            dwExtraInfo: 0,
                        }
                    }
                });
                inputs.push(INPUT {
                    r#type: INPUT_KEYBOARD,
                    Anonymous: INPUT_0 {
                        ki: windows_sys::Win32::UI::Input::KeyboardAndMouse::KEYBDINPUT {
                            wVk: 0,
                            wScan: char_code,
                            dwFlags: KEYEVENTF_UNICODE | KEYEVENTF_KEYUP,
                            time: 0,
                            dwExtraInfo: 0,
                        }
                    }
                });
            }
        }

        // 3. Release Modifiers
        for modifier in &modifiers {
            let vk = match modifier.as_str() {
                "Shift" => VK_SHIFT,
                "Ctrl" => VK_CONTROL,
                "Alt" => VK_MENU,
                _ => 0,
            };
            if vk != 0 {
                inputs.push(INPUT {
                    r#type: INPUT_KEYBOARD,
                    Anonymous: INPUT_0 {
                        ki: windows_sys::Win32::UI::Input::KeyboardAndMouse::KEYBDINPUT {
                            wVk: vk,
                            wScan: 0,
                            dwFlags: KEYEVENTF_KEYUP,
                            time: 0,
                            dwExtraInfo: 0,
                        }
                    }
                });
            }
        }

        SendInput(inputs.len() as u32, inputs.as_mut_ptr(), std::mem::size_of::<INPUT>() as i32);
    }

    #[cfg(target_os = "linux")]
    {
        let mut enigo = Enigo::new();

        for modifier in &modifiers {
            match modifier.as_str() {
                "Shift" => enigo.key_down(Key::Shift),
                "Ctrl" => enigo.key_down(Key::Control),
                "Alt" => enigo.key_down(Key::Alt),
                _ => {}
            }
        }

        match key.as_str() {
            "Return" => enigo.key_click(Key::Return),
            "Backspace" => enigo.key_click(Key::Backspace),
            s => enigo.key_sequence(s),
        }

        for modifier in &modifiers {
            match modifier.as_str() {
                "Shift" => enigo.key_up(Key::Shift),
                "Ctrl" => enigo.key_up(Key::Control),
                "Alt" => enigo.key_up(Key::Alt),
                _ => {}
            }
        }
    }
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
                    gtk_window.set_accept_focus(false);
                }
            }
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![send_key])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
