use super::{KeyId, Modifier, NamedKey};

use evdev::{uinput::VirtualDevice, AttributeSet, Device, EventSummary, EventType, InputEvent, KeyCode};
use std::{
    fs::OpenOptions,
    io::ErrorKind,
    sync::{Mutex, OnceLock},
    thread,
};

use super::InputStatus;
use tauri::{AppHandle, Emitter};

static VIRTUAL_KEYBOARD: OnceLock<Mutex<VirtualDevice>> = OnceLock::new();

#[derive(Clone, serde::Serialize)]
struct PhysicalKey {
    key: String,
    down: bool,
}

fn physical_key_id(key: KeyCode) -> Option<&'static str> {
    Some(match key {
        KeyCode::KEY_ESC => "Esc",
        KeyCode::KEY_1 => "1",
        KeyCode::KEY_2 => "2",
        KeyCode::KEY_3 => "3",
        KeyCode::KEY_4 => "4",
        KeyCode::KEY_5 => "5",
        KeyCode::KEY_6 => "6",
        KeyCode::KEY_7 => "7",
        KeyCode::KEY_8 => "8",
        KeyCode::KEY_9 => "9",
        KeyCode::KEY_0 => "0",
        KeyCode::KEY_MINUS => "-",
        KeyCode::KEY_EQUAL => "=",
        KeyCode::KEY_BACKSPACE => "Backspace",
        KeyCode::KEY_TAB => "Tab",
        KeyCode::KEY_Q => "q",
        KeyCode::KEY_W => "w",
        KeyCode::KEY_E => "e",
        KeyCode::KEY_R => "r",
        KeyCode::KEY_T => "t",
        KeyCode::KEY_Y => "y",
        KeyCode::KEY_U => "u",
        KeyCode::KEY_I => "i",
        KeyCode::KEY_O => "o",
        KeyCode::KEY_P => "p",
        KeyCode::KEY_LEFTBRACE => "´",
        KeyCode::KEY_RIGHTBRACE => "[",
        KeyCode::KEY_BACKSLASH => "]",
        KeyCode::KEY_ENTER => "Enter",
        KeyCode::KEY_LEFTCTRL | KeyCode::KEY_RIGHTCTRL => "Ctrl",
        KeyCode::KEY_A => "a",
        KeyCode::KEY_S => "s",
        KeyCode::KEY_D => "d",
        KeyCode::KEY_F => "f",
        KeyCode::KEY_G => "g",
        KeyCode::KEY_H => "h",
        KeyCode::KEY_J => "j",
        KeyCode::KEY_K => "k",
        KeyCode::KEY_L => "l",
        KeyCode::KEY_SEMICOLON => "ç",
        KeyCode::KEY_APOSTROPHE => "~",
        KeyCode::KEY_CAPSLOCK => "Caps",
        KeyCode::KEY_LEFTSHIFT | KeyCode::KEY_RIGHTSHIFT => "Shift",
        KeyCode::KEY_102ND => "\\",
        KeyCode::KEY_Z => "z",
        KeyCode::KEY_X => "x",
        KeyCode::KEY_C => "c",
        KeyCode::KEY_V => "v",
        KeyCode::KEY_B => "b",
        KeyCode::KEY_N => "n",
        KeyCode::KEY_M => "m",
        KeyCode::KEY_COMMA => ",",
        KeyCode::KEY_DOT => ".",
        KeyCode::KEY_SLASH => ";",
        KeyCode::KEY_LEFTALT => "Alt",
        KeyCode::KEY_SPACE => "Space",
        KeyCode::KEY_RIGHTALT => "AltGr",
        KeyCode::KEY_LEFTMETA | KeyCode::KEY_RIGHTMETA => "Win",
        KeyCode::KEY_RO => "/",
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
        _ => return None,
    })
}

fn listen_to_keyboard(mut device: Device, app: AppHandle) {
    loop {
        let events = match device.fetch_events() {
            Ok(events) => events,
            Err(error) => {
                eprintln!("physical key feedback stopped: {error}");
                return;
            }
        };

        for event in events {
            if let EventSummary::Key(_, key, value) = event.destructure() {
                if let Some(key) = physical_key_id(key) {
                    if let Some(down) = match value {
                        0 => Some(false),
                        1 => Some(true),
                        _ => None,
                    } {
                        let _ = app.emit("physical-key", PhysicalKey {
                            key: key.into(),
                            down,
                        });
                    }
                }
            }
        }
    }
}

/// Mirrors physical key presses in the UI without observing FlyBoard's own uinput device.
pub fn install_hook(app: AppHandle) -> Result<(), String> {
    let mut installed = 0;
    for (_, device) in evdev::enumerate() {
        if device.name() == Some("FlyBoard Virtual Keyboard") || device.supported_keys().is_none() {
            continue;
        }
        let app = app.clone();
        thread::spawn(move || listen_to_keyboard(device, app));
        installed += 1;
    }

    if installed == 0 {
        return Err("no readable physical keyboard devices found".into());
    }
    Ok(())
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
            '6' | '^' => (KeyCode::KEY_6, character == '^'),
            '7' | '&' => (KeyCode::KEY_7, character == '&'),
            '8' | '*' => (KeyCode::KEY_8, character == '*'),
            '9' | '(' => (KeyCode::KEY_9, character == '('),
            '0' | ')' => (KeyCode::KEY_0, character == ')'),
            '-' | '_' => (KeyCode::KEY_MINUS, character == '_'),
            '=' | '+' => (KeyCode::KEY_EQUAL, character == '+'),
            '[' | '{' => (KeyCode::KEY_LEFTBRACE, character == '{'),
            ']' | '}' => (KeyCode::KEY_RIGHTBRACE, character == '}'),
            ';' | ':' => (KeyCode::KEY_SEMICOLON, character == ':'),
            '\'' | '"' => (KeyCode::KEY_APOSTROPHE, character == '"'),
            ',' | '<' => (KeyCode::KEY_COMMA, character == '<'),
            '.' | '>' => (KeyCode::KEY_DOT, character == '>'),
            '/' | '?' => (KeyCode::KEY_SLASH, character == '?'),
            '`' | '~' | '´' => (KeyCode::KEY_GRAVE, character == '~'),
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
            NamedKey::Function(number) => (
                KeyCode::new(KeyCode::KEY_F1.code() + u16::from(number) - 1),
                false,
            ),
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
    for code in 1..=255 {
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

fn click(keyboard: &mut VirtualDevice, key: KeyCode) -> Result<(), String> {
    keyboard
        .emit(&[
            InputEvent::new(EventType::KEY.0, key.code(), 1),
            InputEvent::new(EventType::KEY.0, key.code(), 0),
        ])
        .map_err(|error| format!("Could not send an event through the virtual keyboard: {error}"))
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
        keyboard
            .emit(&[InputEvent::new(
                EventType::KEY.0,
                modifier_key(*modifier).code(),
                1,
            )])
            .map_err(|error| format!("Could not press virtual modifier {modifier:?}: {error}"))?;
    }
    let result = click(&mut keyboard, target);
    for modifier in active_modifiers.iter().rev() {
        keyboard
            .emit(&[InputEvent::new(
                EventType::KEY.0,
                modifier_key(*modifier).code(),
                0,
            )])
            .map_err(|error| format!("Could not release virtual modifier {modifier:?}: {error}"))?;
    }
    result
}

pub fn send_text(text: &str) -> Result<(), String> {
    for character in text.chars() {
        send_resolved(key_code(KeyId::Char(character))?, &[])?;
    }
    Ok(())
}

pub fn send(key: KeyId, modifiers: &[Modifier]) -> Result<(), String> {
    send_resolved(key_code(key)?, modifiers)
}

#[cfg(test)]
mod tests {
    use super::key_code;
    use crate::input::KeyId;

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
