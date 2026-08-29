use super::{KeyId, Modifier, NamedKey};

use evdev::{
    uinput::VirtualDeviceBuilder, AttributeSet, EventType, InputEvent, KeyCode, VirtualDevice,
};
use std::sync::{Mutex, OnceLock};

static VIRTUAL_KEYBOARD: OnceLock<Mutex<VirtualDevice>> = OnceLock::new();

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
            NamedKey::Function(number) => {
                (KeyCode::new(KeyCode::KEY_F1.code() + number - 1), false)
            }
        },
        KeyId::Modifier(modifier) => (modifier_key(modifier), false),
    };
    Ok(key)
}

fn virtual_keyboard() -> Result<&'static Mutex<VirtualDevice>, String> {
    if let Some(keyboard) = VIRTUAL_KEYBOARD.get() {
        return Ok(keyboard);
    }

    let mut keys = AttributeSet::new();
    for code in 1..=255 {
        keys.insert(KeyCode::new(code));
    }

    let keyboard = VirtualDeviceBuilder::new()
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
            InputEvent::new(EventType::KEY, key.code(), 1),
            InputEvent::new(EventType::KEY, key.code(), 0),
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
                EventType::KEY,
                modifier_key(*modifier).code(),
                1,
            )])
            .map_err(|error| format!("Could not press virtual modifier {modifier:?}: {error}"))?;
    }
    let result = click(&mut keyboard, target);
    for modifier in active_modifiers.iter().rev() {
        keyboard
            .emit(&[InputEvent::new(
                EventType::KEY,
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
