use std::sync::OnceLock;

use serde::Serialize;
use tauri::{AppHandle, Emitter};
use windows_sys::Win32::Foundation::{LPARAM, LRESULT, WPARAM};
use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
    VIRTUAL_KEY, VK_BACK, VK_CAPITAL, VK_DOWN, VK_ESCAPE, VK_F1, VK_F12, VK_LCONTROL, VK_LEFT,
    VK_LMENU, VK_LSHIFT, VK_LWIN, VK_RCONTROL, VK_RETURN, VK_RIGHT, VK_RMENU, VK_RSHIFT, VK_RWIN,
    VK_SPACE, VK_TAB, VK_UP,
};
use windows_sys::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, SetWindowsHookExW, KBDLLHOOKSTRUCT, WH_KEYBOARD_LL, WM_KEYDOWN, WM_KEYUP,
    WM_SYSKEYDOWN, WM_SYSKEYUP,
};

use super::windows::INJECTED_TAG;

/// Inverse of the injection-side translation: real presses arrive as Windows scan codes,
/// but the frontend matches physical keys against Linux evdev codes.
fn scan_code_to_evdev(scan_code: u32) -> u32 {
    match scan_code {
        // Windows scan 0x73 is the ABNT2 "?/" key, evdev KEY_RO = 89.
        0x73 => 89,
        _ => scan_code,
    }
}

static APP: OnceLock<AppHandle> = OnceLock::new();

#[derive(Clone, Serialize)]
struct PhysicalKey {
    key: String,
    down: bool,
}

/// Translates non-printable keys and preserves printable hardware positions.
fn key_id(vk: VIRTUAL_KEY, scan_code: u32) -> Option<String> {
    let named = match vk {
        VK_RETURN => "Enter",
        VK_BACK => "Backspace",
        VK_SPACE => "Space",
        VK_TAB => "Tab",
        VK_CAPITAL => "Caps",
        VK_ESCAPE => "Esc",
        VK_UP => "Up",
        VK_DOWN => "Down",
        VK_LEFT => "Left",
        VK_RIGHT => "Right",
        VK_LSHIFT | VK_RSHIFT => "Shift",
        VK_LCONTROL | VK_RCONTROL => "Ctrl",
        VK_LMENU => "Alt",
        VK_RMENU => "AltGr",
        VK_LWIN | VK_RWIN => "Win",
        _ => {
            if (VK_F1..=VK_F12).contains(&vk) {
                return Some(format!("F{}", vk - VK_F1 + 1));
            }
            return (scan_code != 0).then(|| format!("physical:{}", scan_code_to_evdev(scan_code)));
        }
    };
    Some(named.to_string())
}

unsafe extern "system" fn hook_proc(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    if code >= 0 {
        let event = &*(lparam as *const KBDLLHOOKSTRUCT);
        // Skip our own SendInput events, or clicking a key would echo back as a physical press.
        if event.dwExtraInfo != INJECTED_TAG {
            let message = wparam as u32;
            let down = message == WM_KEYDOWN || message == WM_SYSKEYDOWN;
            let up = message == WM_KEYUP || message == WM_SYSKEYUP;

            if down || up {
                if let (Some(app), Some(key)) = (
                    APP.get(),
                    key_id(event.vkCode as VIRTUAL_KEY, event.scanCode),
                ) {
                    let _ = app.emit("physical-key", PhysicalKey { key, down });
                }
            }
        }
    }
    CallNextHookEx(0, code, wparam, lparam)
}

/// Observes keystrokes only to mirror them in the UI; nothing is stored or forwarded.
pub fn install(app: AppHandle) -> Result<(), String> {
    let _ = APP.set(app);
    // A low-level hook needs the installing thread to pump messages, which the Tauri main thread does.
    let hook = unsafe { SetWindowsHookExW(WH_KEYBOARD_LL, Some(hook_proc), 0, 0) };
    if hook == 0 {
        return Err("failed to install the keyboard hook".into());
    }
    Ok(())
}
