use super::{KeyId, Modifier, NamedKey};

use evdev::{uinput::VirtualDevice, AttributeSet, Device, EventSummary, EventType, InputEvent, KeyCode, LedCode};
use std::{
    fs::OpenOptions,
    io::ErrorKind,
    sync::{
        atomic::{AtomicBool, Ordering},
        Mutex, OnceLock,
    },
    thread,
};

use super::InputStatus;
use tauri::{AppHandle, Emitter};

static VIRTUAL_KEYBOARD: OnceLock<Mutex<VirtualDevice>> = OnceLock::new();
/// Mirrors the real caps lock LED, since evdev has no synchronous "query the lock" call.
static CAPS_LOCK: AtomicBool = AtomicBool::new(false);

#[derive(Clone, serde::Serialize)]
struct PhysicalKey {
    key: String,
    source: String,
    down: bool,
}

fn physical_key_id(key: KeyCode) -> Option<String> {
    let named = match key {
        KeyCode::KEY_ESC => "Esc",
        KeyCode::KEY_BACKSPACE => "Backspace",
        KeyCode::KEY_TAB => "Tab",
        KeyCode::KEY_ENTER => "Enter",
        KeyCode::KEY_LEFTCTRL | KeyCode::KEY_RIGHTCTRL => "Ctrl",
        KeyCode::KEY_CAPSLOCK => "Caps",
        KeyCode::KEY_LEFTSHIFT | KeyCode::KEY_RIGHTSHIFT => "Shift",
        KeyCode::KEY_LEFTALT => "Alt",
        KeyCode::KEY_SPACE => "Space",
        KeyCode::KEY_RIGHTALT => "AltGr",
        KeyCode::KEY_LEFTMETA | KeyCode::KEY_RIGHTMETA => "Win",
        KeyCode::KEY_F1 => "F1",
        KeyCode::KEY_F2 => "F2",
        KeyCode::KEY_F3 => "F3",
        KeyCode::KEY_F4 => "F4",
        KeyCode::KEY_F5 => "F5",
        KeyCode::KEY_F6 => "F6",
        KeyCode::KEY_F7 => "F7",
        KeyCode::KEY_F8 => "F8",
        KeyCode::KEY_F9 => "F9",
        KeyCode::KEY_F10 => "F10",
        KeyCode::KEY_F11 => "F11",
        KeyCode::KEY_F12 => "F12",
        KeyCode::KEY_UP => "Up",
        KeyCode::KEY_DOWN => "Down",
        KeyCode::KEY_LEFT => "Left",
        KeyCode::KEY_RIGHT => "Right",
        _ => return Some(format!("physical:{}", key.code())),
    };
    Some(named.into())
}

fn physical_key_source(device_path: &str, key: KeyCode) -> String {
    format!("{device_path}:physical:{}", key.code())
}

fn listen_to_keyboard(mut device: Device, app: AppHandle, device_path: String) {
    loop {
        let events = match device.fetch_events() {
            Ok(events) => events,
            Err(error) => {
                eprintln!("physical key feedback stopped: {error}");
                return;
            }
        };

        for event in events {
            match event.destructure() {
                EventSummary::Key(_, key, value) => {
                    let source = physical_key_source(&device_path, key);
                    if let Some(key) = physical_key_id(key) {
                        if let Some(down) = match value {
                            0 => Some(false),
                            1 => Some(true),
                            _ => None,
                        } {
                            let _ = app.emit("physical-key", PhysicalKey {
                                key,
                                source,
                                down,
                            });
                        }
                    }
                }
                EventSummary::Led(_, LedCode::LED_CAPSL, value) => {
                    CAPS_LOCK.store(value != 0, Ordering::Relaxed);
                }
                _ => {}
            }
        }
    }
}

/// Mirrors physical key presses in the UI without observing FlyBoard's own uinput device.
pub fn install_hook(app: AppHandle) -> Result<(), String> {
    let mut installed = 0;
    for (device_path, device) in evdev::enumerate() {
        if device.name() == Some("FlyBoard Virtual Keyboard") || device.supported_keys().is_none() {
            continue;
        }
        if let Ok(leds) = device.get_led_state() {
            if leds.contains(LedCode::LED_CAPSL) {
                CAPS_LOCK.store(true, Ordering::Relaxed);
            }
        }
        let app = app.clone();
        let device_path = device_path.display().to_string();
        thread::spawn(move || listen_to_keyboard(device, app, device_path));
        installed += 1;
    }

    if installed == 0 {
        return Err("no readable physical keyboard devices found".into());
    }
    Ok(())
}

pub fn caps_lock_on() -> bool {
    CAPS_LOCK.load(Ordering::Relaxed)
}

pub fn status() -> InputStatus {
    match OpenOptions::new().read(true).write(true).open("/dev/uinput") {
        Ok(_) => InputStatus {
            ready: true,
            message: None,
        },
        Err(error) if error.kind() == ErrorKind::NotFound => InputStatus {
            ready: false,
            message: Some(
                "FlyBoard cannot find /dev/uinput. Load the uinput kernel module, then restart FlyBoard."
                    .into(),
            ),
        },
        Err(error) if error.kind() == ErrorKind::PermissionDenied => InputStatus {
            ready: false,
            message: Some(
                "FlyBoard cannot access /dev/uinput. Install the FlyBoard .deb or configure its udev rule, then sign out and back in."
                    .into(),
            ),
        },
        Err(error) => InputStatus {
            ready: false,
            message: Some(format!("FlyBoard cannot access /dev/uinput: {error}")),
        },
    }
}

fn modifier_key(modifier: Modifier) -> KeyCode {
    match modifier {
        Modifier::Shift => KeyCode::KEY_LEFTSHIFT,
        Modifier::Ctrl => KeyCode::KEY_LEFTCTRL,
        Modifier::Alt => KeyCode::KEY_LEFTALT,
        Modifier::AltGr => KeyCode::KEY_RIGHTALT,
        Modifier::Win => KeyCode::KEY_LEFTMETA,
    }
}

fn key_code(key: KeyId) -> Result<(KeyCode, bool), String> {
    let key = match key {
        KeyId::Physical(code) => (KeyCode::new(code), false),
        KeyId::Char(character) => match character {
            'a' | 'A' => (KeyCode::KEY_A, character.is_ascii_uppercase()),
            'b' | 'B' => (KeyCode::KEY_B, character.is_ascii_uppercase()),
            'c' | 'C' => (KeyCode::KEY_C, character.is_ascii_uppercase()),
            'd' | 'D' => (KeyCode::KEY_D, character.is_ascii_uppercase()),
            'e' | 'E' => (KeyCode::KEY_E, character.is_ascii_uppercase()),
            'f' | 'F' => (KeyCode::KEY_F, character.is_ascii_uppercase()),
            'g' | 'G' => (KeyCode::KEY_G, character.is_ascii_uppercase()),
            'h' | 'H' => (KeyCode::KEY_H, character.is_ascii_uppercase()),
            'i' | 'I' => (KeyCode::KEY_I, character.is_ascii_uppercase()),
            'j' | 'J' => (KeyCode::KEY_J, character.is_ascii_uppercase()),
            'k' | 'K' => (KeyCode::KEY_K, character.is_ascii_uppercase()),
            'l' | 'L' => (KeyCode::KEY_L, character.is_ascii_uppercase()),
            'm' | 'M' => (KeyCode::KEY_M, character.is_ascii_uppercase()),
            'n' | 'N' => (KeyCode::KEY_N, character.is_ascii_uppercase()),
            'o' | 'O' => (KeyCode::KEY_O, character.is_ascii_uppercase()),
            'p' | 'P' => (KeyCode::KEY_P, character.is_ascii_uppercase()),
            'q' | 'Q' => (KeyCode::KEY_Q, character.is_ascii_uppercase()),
            'r' | 'R' => (KeyCode::KEY_R, character.is_ascii_uppercase()),
            's' | 'S' => (KeyCode::KEY_S, character.is_ascii_uppercase()),
            't' | 'T' => (KeyCode::KEY_T, character.is_ascii_uppercase()),
            'u' | 'U' => (KeyCode::KEY_U, character.is_ascii_uppercase()),
            'v' | 'V' => (KeyCode::KEY_V, character.is_ascii_uppercase()),
            'w' | 'W' => (KeyCode::KEY_W, character.is_ascii_uppercase()),
            'x' | 'X' => (KeyCode::KEY_X, character.is_ascii_uppercase()),
            'y' | 'Y' => (KeyCode::KEY_Y, character.is_ascii_uppercase()),
            'z' | 'Z' => (KeyCode::KEY_Z, character.is_ascii_uppercase()),
            '1' | '!' => (KeyCode::KEY_1, character == '!'),
            '2' | '@' => (KeyCode::KEY_2, character == '@'),
            '3' | '#' => (KeyCode::KEY_3, character == '#'),
            '4' | '$' => (KeyCode::KEY_4, character == '$'),
            '5' | '%' => (KeyCode::KEY_5, character == '%'),
            '6' => (KeyCode::KEY_6, false),
            '7' | '&' => (KeyCode::KEY_7, character == '&'),
            '8' | '*' => (KeyCode::KEY_8, character == '*'),
            '9' | '(' => (KeyCode::KEY_9, character == '('),
            '0' | ')' => (KeyCode::KEY_0, character == ')'),
            '-' | '_' => (KeyCode::KEY_MINUS, character == '_'),
            '=' | '+' => (KeyCode::KEY_EQUAL, character == '+'),
            '`' | '~' | '^' => (KeyCode::KEY_GRAVE, character != '`'),
            '[' | '{' => (KeyCode::KEY_LEFTBRACE, character == '{'),
            ']' | '}' => (KeyCode::KEY_RIGHTBRACE, character == '}'),
            '\\' | '|' => (KeyCode::KEY_BACKSLASH, character == '|'),
            ';' | ':' => (KeyCode::KEY_SEMICOLON, character == ':'),
            '\'' | '"' => (KeyCode::KEY_APOSTROPHE, character == '"'),
            ',' | '<' => (KeyCode::KEY_COMMA, character == '<'),
            '.' | '>' => (KeyCode::KEY_DOT, character == '>'),
            '/' | '?' => (KeyCode::KEY_SLASH, character == '?'),
            'ç' | 'Ç' => (KeyCode::KEY_SEMICOLON, character == 'Ç'),
            '´' => (KeyCode::KEY_LEFTBRACE, false),
            ' ' => (KeyCode::KEY_SPACE, false),
            _ => {
                return Err(format!(
                    "The Linux virtual keyboard cannot type {character:?}."
                ))
            }
        },
        KeyId::Named(named) => match named {
            NamedKey::Enter => (KeyCode::KEY_ENTER, false),
            NamedKey::Backspace => (KeyCode::KEY_BACKSPACE, false),
            NamedKey::Space => (KeyCode::KEY_SPACE, false),
            NamedKey::Tab => (KeyCode::KEY_TAB, false),
            NamedKey::Capslock => (KeyCode::KEY_CAPSLOCK, false),
            NamedKey::Escape => (KeyCode::KEY_ESC, false),
            NamedKey::Up => (KeyCode::KEY_UP, false),
            NamedKey::Down => (KeyCode::KEY_DOWN, false),
            NamedKey::Left => (KeyCode::KEY_LEFT, false),
            NamedKey::Right => (KeyCode::KEY_RIGHT, false),
            NamedKey::Function(number) => match number {
                1 => (KeyCode::KEY_F1, false),
                2 => (KeyCode::KEY_F2, false),
                3 => (KeyCode::KEY_F3, false),
                4 => (KeyCode::KEY_F4, false),
                5 => (KeyCode::KEY_F5, false),
                6 => (KeyCode::KEY_F6, false),
                7 => (KeyCode::KEY_F7, false),
                8 => (KeyCode::KEY_F8, false),
                9 => (KeyCode::KEY_F9, false),
                10 => (KeyCode::KEY_F10, false),
                11 => (KeyCode::KEY_F11, false),
                12 => (KeyCode::KEY_F12, false),
                _ => return Err(format!("Invalid function key F{number}")),
            },
        },
        KeyId::Modifier(modifier) => (modifier_key(modifier), false),
    };
    Ok(key)
}

fn virtual_keyboard() -> Result<&'static Mutex<VirtualDevice>, String> {
    if let Some(keyboard) = VIRTUAL_KEYBOARD.get() {
        return Ok(keyboard);
    }

    let input_status = status();
    if !input_status.ready {
        return Err(input_status
            .message
            .unwrap_or_else(|| "FlyBoard's virtual keyboard is unavailable.".into()));
    }

    let mut keys = AttributeSet::new();
    for code in 1..=511 {
        keys.insert(KeyCode::new(code));
    }

    let keyboard = VirtualDevice::builder()
        .map_err(|error| format!("Cannot initialize FlyBoard's virtual keyboard: {error}"))?
        .name("FlyBoard Virtual Keyboard")
        .with_keys(&keys)
        .and_then(|builder| builder.build())
        .map_err(|error| format!("Cannot create FlyBoard's virtual keyboard. Grant this user read/write access to /dev/uinput: {error}"))?;

    Ok(VIRTUAL_KEYBOARD.get_or_init(|| Mutex::new(keyboard)))
}

fn press(keyboard: &mut VirtualDevice, key: KeyCode) -> Result<(), String> {
    keyboard
        .emit(&[InputEvent::new(EventType::KEY.0, key.code(), 1)])
        .map_err(|error| format!("Could not send key press event through virtual keyboard: {error}"))
}

fn release(keyboard: &mut VirtualDevice, key: KeyCode) -> Result<(), String> {
    keyboard
        .emit(&[InputEvent::new(EventType::KEY.0, key.code(), 0)])
        .map_err(|error| format!("Could not send key release event through virtual keyboard: {error}"))
}

fn unicode_digit_key(character: char) -> KeyCode {
    match character {
        '0' => KeyCode::KEY_0,
        '1' => KeyCode::KEY_1,
        '2' => KeyCode::KEY_2,
        '3' => KeyCode::KEY_3,
        '4' => KeyCode::KEY_4,
        '5' => KeyCode::KEY_5,
        '6' => KeyCode::KEY_6,
        '7' => KeyCode::KEY_7,
        '8' => KeyCode::KEY_8,
        '9' => KeyCode::KEY_9,
        'a' => KeyCode::KEY_A,
        'b' => KeyCode::KEY_B,
        'c' => KeyCode::KEY_C,
        'd' => KeyCode::KEY_D,
        'e' => KeyCode::KEY_E,
        'f' => KeyCode::KEY_F,
        _ => unreachable!("Unicode code points are hexadecimal"),
    }
}

fn send_unicode_text(text: &str) -> Result<(), String> {
    let mut keyboard = virtual_keyboard().and_then(|keyboard| {
        keyboard
            .lock()
            .map_err(|_| "FlyBoard's virtual keyboard lock is unavailable.".into())
    })?;

    for character in text.chars() {
        press(&mut keyboard, KeyCode::KEY_LEFTCTRL)?;
        press(&mut keyboard, KeyCode::KEY_LEFTSHIFT)?;
        press(&mut keyboard, KeyCode::KEY_U)?;
        release(&mut keyboard, KeyCode::KEY_U)?;
        release(&mut keyboard, KeyCode::KEY_LEFTSHIFT)?;
        release(&mut keyboard, KeyCode::KEY_LEFTCTRL)?;

        for digit in format!("{:x}", character as u32).chars() {
            let key = unicode_digit_key(digit);
            press(&mut keyboard, key)?;
            release(&mut keyboard, key)?;
        }

        press(&mut keyboard, KeyCode::KEY_ENTER)?;
        release(&mut keyboard, KeyCode::KEY_ENTER)?;
    }

    Ok(())
}

fn send_resolved(key: (KeyCode, bool), modifiers: &[Modifier]) -> Result<(), String> {
    let (target, needs_shift) = key;
    let mut active_modifiers = modifiers.to_vec();
    if needs_shift && !active_modifiers.contains(&Modifier::Shift) {
        active_modifiers.push(Modifier::Shift);
    }

    let mut keyboard = virtual_keyboard().and_then(|keyboard| {
        keyboard
            .lock()
            .map_err(|_| "FlyBoard's virtual keyboard lock is unavailable.".into())
    })?;

    for modifier in &active_modifiers {
        press(&mut keyboard, modifier_key(*modifier))?;
    }
    if !active_modifiers.is_empty() {
        thread::sleep(std::time::Duration::from_millis(5));
    }

    press(&mut keyboard, target)?;
    thread::sleep(std::time::Duration::from_millis(12));
    release(&mut keyboard, target)?;

    if !active_modifiers.is_empty() {
        thread::sleep(std::time::Duration::from_millis(5));
    }

    for modifier in active_modifiers.iter().rev() {
        release(&mut keyboard, modifier_key(*modifier))?;
    }

    Ok(())
}

pub fn send_text(text: &str) -> Result<(), String> {
    send_unicode_text(text)
}

pub fn send(key: KeyId, modifiers: &[Modifier]) -> Result<(), String> {
    send_resolved(key_code(key)?, modifiers)
}

#[cfg(test)]
mod tests {
    use super::{key_code, physical_key_id, physical_key_source};
    use crate::input::{KeyId, NamedKey};
    use evdev::KeyCode;

    #[test]
    fn resolves_accent_positions_without_colliding() {
        assert_eq!(
            key_code(KeyId::Physical(26)).unwrap().0,
            evdev::KeyCode::KEY_LEFTBRACE
        );
        assert_eq!(
            key_code(KeyId::Physical(40)).unwrap().0,
            evdev::KeyCode::KEY_APOSTROPHE
        );
        assert_eq!(
            key_code(KeyId::Physical(41)).unwrap().0,
            evdev::KeyCode::KEY_GRAVE
        );
    }

    #[test]
    fn resolves_character_mappings_matching_ui_layout() {
        assert_eq!(key_code(KeyId::Char('\'')).unwrap().0, KeyCode::KEY_APOSTROPHE);
        assert_eq!(key_code(KeyId::Char('`')).unwrap().0, KeyCode::KEY_GRAVE);
        assert_eq!(key_code(KeyId::Char('[')).unwrap().0, KeyCode::KEY_LEFTBRACE);
        assert_eq!(key_code(KeyId::Char(']')).unwrap().0, KeyCode::KEY_RIGHTBRACE);
        assert_eq!(key_code(KeyId::Char('\\')).unwrap().0, KeyCode::KEY_BACKSLASH);
        assert_eq!(key_code(KeyId::Char(';')).unwrap().0, KeyCode::KEY_SEMICOLON);
        assert_eq!(key_code(KeyId::Char('/')).unwrap().0, KeyCode::KEY_SLASH);
        assert_eq!(key_code(KeyId::Char('ç')).unwrap().0, KeyCode::KEY_SEMICOLON);
    }

    #[test]
    fn resolves_function_keys_correctly() {
        assert_eq!(key_code(KeyId::Named(NamedKey::Function(1))).unwrap().0, KeyCode::KEY_F1);
        assert_eq!(key_code(KeyId::Named(NamedKey::Function(10))).unwrap().0, KeyCode::KEY_F10);
        assert_eq!(key_code(KeyId::Named(NamedKey::Function(11))).unwrap().0, KeyCode::KEY_F11);
        assert_eq!(key_code(KeyId::Named(NamedKey::Function(12))).unwrap().0, KeyCode::KEY_F12);
    }

    #[test]
    fn physical_key_id_preserves_printable_key_positions() {
        assert_eq!(physical_key_id(KeyCode::KEY_GRAVE), Some("physical:41".into()));
        assert_eq!(physical_key_id(KeyCode::KEY_LEFTBRACE), Some("physical:26".into()));
        assert_eq!(physical_key_id(KeyCode::KEY_RIGHTBRACE), Some("physical:27".into()));
        assert_eq!(physical_key_id(KeyCode::KEY_BACKSLASH), Some("physical:43".into()));
        assert_eq!(physical_key_id(KeyCode::KEY_SEMICOLON), Some("physical:39".into()));
        assert_eq!(physical_key_id(KeyCode::KEY_APOSTROPHE), Some("physical:40".into()));
        assert_eq!(physical_key_id(KeyCode::KEY_102ND), Some("physical:86".into()));
        assert_eq!(physical_key_id(KeyCode::KEY_SLASH), Some("physical:53".into()));
        assert_eq!(physical_key_id(KeyCode::KEY_RO), Some("physical:89".into()));
        assert_eq!(physical_key_id(KeyCode::KEY_F11), Some("F11".into()));
        assert_eq!(physical_key_id(KeyCode::KEY_F12), Some("F12".into()));
    }

    #[test]
    fn left_and_right_modifiers_have_distinct_physical_sources() {
        assert_ne!(KeyCode::KEY_LEFTSHIFT.code(), KeyCode::KEY_RIGHTSHIFT.code());
        assert_ne!(KeyCode::KEY_LEFTCTRL.code(), KeyCode::KEY_RIGHTCTRL.code());
        assert_ne!(KeyCode::KEY_LEFTALT.code(), KeyCode::KEY_RIGHTALT.code());
    }

    #[test]
    fn same_modifier_on_different_keyboards_has_distinct_source() {
        assert_ne!(
            physical_key_source("/dev/input/event3", KeyCode::KEY_LEFTSHIFT),
            physical_key_source("/dev/input/event7", KeyCode::KEY_LEFTSHIFT)
        );
    }

    #[test]
    fn resolves_brazilian_slash_position() {
        assert_eq!(
            key_code(KeyId::Physical(89)).unwrap().0,
            evdev::KeyCode::new(89)
        );
    }

    #[test]
    fn resolves_brazilian_backslash_position() {
        assert_eq!(
            key_code(KeyId::Physical(86)).unwrap().0,
            evdev::KeyCode::KEY_102ND
        );
    }
}
