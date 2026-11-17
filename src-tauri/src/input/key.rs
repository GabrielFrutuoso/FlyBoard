#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Modifier {
    Shift,
    Ctrl,
    Alt,
    AltGr,
    Win,
}

impl Modifier {
    pub(super) fn parse(name: &str) -> Option<Self> {
        Some(match name {
            "Shift" => Self::Shift,
            "Ctrl" => Self::Ctrl,
            "Alt" => Self::Alt,
            "AltGr" => Self::AltGr,
            "Win" => Self::Win,
            _ => return None,
        })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NamedKey {
    Enter,
    Backspace,
    Space,
    Tab,
    Capslock,
    Escape,
    Up,
    Down,
    Left,
    Right,
    PageUp,
    PageDown,
    Insert,
    Delete,
    Home,
    End,
    /// F1 through F12.
    Function(u8),
}

#[derive(Debug, Clone, Copy)]
pub enum KeyId {
    Char(char),
    Physical(u16),
    Named(NamedKey),
    Modifier(Modifier),
}

impl KeyId {
    pub(super) fn parse(id: &str) -> Option<Self> {
        if let Some(rest) = id.strip_prefix("physical:") {
            let code = rest.parse::<u16>().ok()?;
            return (1..=255).contains(&code).then_some(Self::Physical(code));
        }
        if let Some(rest) = id.strip_prefix("char:") {
            let mut chars = rest.chars();
            let c = chars.next()?;
            return chars.next().is_none().then_some(Self::Char(c));
        }
        if let Some(modifier) = Modifier::parse(id) {
            return Some(Self::Modifier(modifier));
        }
        Some(Self::Named(match id {
            "Enter" => NamedKey::Enter,
            "Backspace" => NamedKey::Backspace,
            "Space" => NamedKey::Space,
            "Tab" => NamedKey::Tab,
            "Caps" => NamedKey::Capslock,
            "Esc" => NamedKey::Escape,
            "Up" => NamedKey::Up,
            "Down" => NamedKey::Down,
            "Left" => NamedKey::Left,
            "Right" => NamedKey::Right,
            "PageUp" => NamedKey::PageUp,
            "PageDown" => NamedKey::PageDown,
            "Insert" => NamedKey::Insert,
            "Delete" => NamedKey::Delete,
            "Home" => NamedKey::Home,
            "End" => NamedKey::End,
            _ => {
                let number = id.strip_prefix('F')?.parse::<u8>().ok()?;
                if !(1..=12).contains(&number) {
                    return None;
                }
                NamedKey::Function(number)
            }
        }))
    }
}

#[cfg(test)]
#[path = "tests/key.rs"]
mod tests;
