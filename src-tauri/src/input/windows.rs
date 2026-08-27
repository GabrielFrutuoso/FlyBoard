use super::{push_unique, KeyId, Modifier, NamedKey};

use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
    GetKeyboardLayout, MapVirtualKeyExW, SendInput, VkKeyScanExW, INPUT, INPUT_0, INPUT_KEYBOARD,
    KEYBDINPUT, KEYEVENTF_EXTENDEDKEY, KEYEVENTF_KEYUP, KEYEVENTF_UNICODE, VIRTUAL_KEY, VK_APPS,
    VK_BACK, VK_CAPITAL, VK_DELETE, VK_DIVIDE, VK_DOWN, VK_END, VK_ESCAPE, VK_F1, VK_HOME,
    VK_INSERT, VK_LCONTROL, VK_LEFT,
    VK_LMENU, VK_LSHIFT, VK_LWIN, VK_NEXT, VK_NUMLOCK, VK_PRIOR, VK_RCONTROL, VK_RETURN, VK_RIGHT,
    VK_RMENU, VK_RWIN, VK_SPACE, VK_TAB, VK_UP,
};
use windows_sys::Win32::UI::TextServices::HKL;
use windows_sys::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowThreadProcessId};

/// Not exported by windows-sys 0.52.
const MAPVK_VK_TO_VSC_EX: u32 = 4;

/// The layout of the window that will receive the input, which may differ from ours.
fn foreground_layout() -> HKL {
    unsafe {
        let hwnd = GetForegroundWindow();
        let thread = if hwnd == 0 {
            0
        } else {
            GetWindowThreadProcessId(hwnd, std::ptr::null_mut())
        };
        GetKeyboardLayout(thread)
    }
}

fn modifier_vk(modifier: Modifier) -> VIRTUAL_KEY {
    match modifier {
        Modifier::Shift => VK_LSHIFT,
        Modifier::Ctrl => VK_LCONTROL,
        Modifier::Alt => VK_LMENU,
        Modifier::AltGr => VK_RMENU,
        Modifier::Win => VK_LWIN,
    }
}

fn is_extended(vk: VIRTUAL_KEY, scan: u32) -> bool {
    let prefix = (scan >> 8) & 0xFF;
    prefix == 0xE0
        || prefix == 0xE1
        || matches!(
            vk,
            VK_RMENU
                | VK_RCONTROL
                | VK_LWIN
                | VK_RWIN
                | VK_APPS
                | VK_INSERT
                | VK_DELETE
                | VK_HOME
                | VK_END
                | VK_PRIOR
                | VK_NEXT
                | VK_UP
                | VK_DOWN
                | VK_LEFT
                | VK_RIGHT
                | VK_NUMLOCK
                | VK_DIVIDE
        )
}

fn keyboard_input(vk: VIRTUAL_KEY, scan: u16, flags: u32) -> INPUT {
    INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 {
            ki: KEYBDINPUT {
                wVk: vk,
                wScan: scan,
                dwFlags: flags,
                time: 0,
                dwExtraInfo: 0,
            },
        },
    }
}

/// Carries both the virtual key and its scan code, as a physical keyboard would.
fn key_event(vk: VIRTUAL_KEY, hkl: HKL, key_up: bool) -> INPUT {
    let scan = unsafe { MapVirtualKeyExW(vk as u32, MAPVK_VK_TO_VSC_EX, hkl) };
    let mut flags = 0;
    if is_extended(vk, scan) {
        flags |= KEYEVENTF_EXTENDEDKEY;
    }
    if key_up {
        flags |= KEYEVENTF_KEYUP;
    }
    keyboard_input(vk, (scan & 0xFF) as u16, flags)
}

fn unicode_event(unit: u16, key_up: bool) -> INPUT {
    let mut flags = KEYEVENTF_UNICODE;
    if key_up {
        flags |= KEYEVENTF_KEYUP;
    }
    keyboard_input(0, unit, flags)
}

/// Resolves a character on the target layout, appending the modifiers that layout requires.
fn resolve_char(c: char, hkl: HKL, modifiers: &mut Vec<Modifier>) -> Option<VIRTUAL_KEY> {
    let mut buffer = [0u16; 2];
    let encoded = c.encode_utf16(&mut buffer);
    if encoded.len() != 1 {
        return None;
    }

    let result = unsafe { VkKeyScanExW(encoded[0], hkl) };
    if result == -1 {
        return None;
    }

    let state = (result >> 8) & 0xFF;
    if state & 1 != 0 {
        push_unique(modifiers, Modifier::Shift);
    }
    match (state & 2 != 0, state & 4 != 0) {
        (true, true) => push_unique(modifiers, Modifier::AltGr),
        (true, false) => push_unique(modifiers, Modifier::Ctrl),
        (false, true) => push_unique(modifiers, Modifier::Alt),
        (false, false) => {}
    }

    Some((result & 0xFF) as VIRTUAL_KEY)
}

pub fn send(key: KeyId, modifiers: &[Modifier]) -> Result<(), String> {
    let hkl = foreground_layout();
    let mut modifiers = modifiers.to_vec();

    let target = match key {
        KeyId::Named(named) => Some(match named {
            NamedKey::Enter => VK_RETURN,
            NamedKey::Backspace => VK_BACK,
            NamedKey::Space => VK_SPACE,
            NamedKey::Tab => VK_TAB,
            NamedKey::Capslock => VK_CAPITAL,
            NamedKey::Escape => VK_ESCAPE,
            NamedKey::Up => VK_UP,
            NamedKey::Down => VK_DOWN,
            NamedKey::Left => VK_LEFT,
            NamedKey::Right => VK_RIGHT,
            // VK_F1 through VK_F12 are contiguous.
            NamedKey::Function(n) => VK_F1 + u16::from(n) - 1,
        }),
        KeyId::Modifier(modifier) => Some(modifier_vk(modifier)),
        KeyId::Char(c) => resolve_char(c, hkl, &mut modifiers),
    };

    let mut inputs = Vec::new();
    match (target, key) {
        (Some(vk), _) => {
            for modifier in &modifiers {
                inputs.push(key_event(modifier_vk(*modifier), hkl, false));
            }
            inputs.push(key_event(vk, hkl, false));
            inputs.push(key_event(vk, hkl, true));
            for modifier in modifiers.iter().rev() {
                inputs.push(key_event(modifier_vk(*modifier), hkl, true));
            }
        }
        // Unicode injection carries no virtual key, so apps would ignore any combo built around it.
        (None, KeyId::Char(c)) => {
            if modifiers.iter().any(|m| *m != Modifier::Shift) {
                return Err(format!(
                    "'{c}' is not reachable on the active keyboard layout, so it cannot be combined with modifiers"
                ));
            }
            let mut buffer = [0u16; 2];
            for unit in c.encode_utf16(&mut buffer) {
                inputs.push(unicode_event(*unit, false));
                inputs.push(unicode_event(*unit, true));
            }
        }
        (None, _) => return Err("unsupported key".into()),
    }

    let sent = unsafe {
        SendInput(
            inputs.len() as u32,
            inputs.as_ptr(),
            std::mem::size_of::<INPUT>() as i32,
        )
    };
    if sent as usize != inputs.len() {
        return Err("SendInput was blocked, likely by a more privileged window".into());
    }
    Ok(())
}
