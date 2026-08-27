use super::{KeyId, Modifier, NamedKey};

use enigo::{Direction, Enigo, Key, Keyboard, Settings};

/// X11 `XK_ISO_Level3_Shift`, the keysym behind AltGr.
const XK_ISO_LEVEL3_SHIFT: u32 = 0xFE03;

fn modifier_key(modifier: Modifier) -> Key {
    match modifier {
        Modifier::Shift => Key::Shift,
        Modifier::Ctrl => Key::Control,
        Modifier::Alt => Key::Alt,
        Modifier::AltGr => Key::Other(XK_ISO_LEVEL3_SHIFT),
        Modifier::Win => Key::Meta,
    }
}

pub fn send_text(text: &str) -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    enigo.text(text).map_err(|e| e.to_string())
}

pub fn send(key: KeyId, modifiers: &[Modifier]) -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

    let target = match key {
        KeyId::Char(c) => Key::Unicode(c),
        KeyId::Named(named) => match named {
            NamedKey::Enter => Key::Return,
            NamedKey::Backspace => Key::Backspace,
            NamedKey::Space => Key::Space,
            NamedKey::Tab => Key::Tab,
            NamedKey::Capslock => Key::CapsLock,
            NamedKey::Escape => Key::Escape,
            NamedKey::Up => Key::UpArrow,
            NamedKey::Down => Key::DownArrow,
            NamedKey::Left => Key::LeftArrow,
            NamedKey::Right => Key::RightArrow,
            NamedKey::Function(n) => match n {
                1 => Key::F1,
                2 => Key::F2,
                3 => Key::F3,
                4 => Key::F4,
                5 => Key::F5,
                6 => Key::F6,
                7 => Key::F7,
                8 => Key::F8,
                9 => Key::F9,
                10 => Key::F10,
                11 => Key::F11,
                _ => Key::F12,
            },
        },
        KeyId::Modifier(modifier) => modifier_key(modifier),
    };

    for modifier in modifiers {
        enigo
            .key(modifier_key(*modifier), Direction::Press)
            .map_err(|e| e.to_string())?;
    }

    let result = enigo.key(target, Direction::Click).map_err(|e| e.to_string());

    // Released even if the key press failed, so nothing stays stuck down.
    for modifier in modifiers.iter().rev() {
        enigo
            .key(modifier_key(*modifier), Direction::Release)
            .map_err(|e| e.to_string())?;
    }

    result
}
