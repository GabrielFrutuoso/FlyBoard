#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "windows")]
use windows as platform;

#[cfg(target_os = "windows")]
pub mod hook;

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "linux")]
use linux as platform;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Modifier {
    Shift,
    Ctrl,
    Alt,
    AltGr,
    Win,
}

impl Modifier {
    fn parse(name: &str) -> Option<Self> {
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
    /// F1 through F12.
    Function(u8),
}

#[derive(Debug, Clone, Copy)]
pub enum KeyId {
    Char(char),
    Named(NamedKey),
    Modifier(Modifier),
}

impl KeyId {
    fn parse(id: &str) -> Option<Self> {
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

fn push_unique(modifiers: &mut Vec<Modifier>, modifier: Modifier) {    if !modifiers.contains(&modifier) {
        modifiers.push(modifier);
    }
}

pub fn send_text(text: &str) -> Result<(), String> {
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    return platform::send_text(text);

    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    {
        let _ = text;
        Err("text injection is not supported on this platform".into())
    }
}

pub fn caps_lock() -> bool {
    #[cfg(target_os = "windows")]
    {
        platform::caps_lock_on()
    }
    #[cfg(not(target_os = "windows"))]
    {
        false
    }
}

pub fn send(key: &str, modifiers: &[String]) -> Result<(), String> {
    let key = KeyId::parse(key).ok_or_else(|| format!("unknown key id: {key}"))?;

    let mut resolved = Vec::new();
    for name in modifiers {
        let modifier =
            Modifier::parse(name).ok_or_else(|| format!("unknown modifier: {name}"))?;
        push_unique(&mut resolved, modifier);
    }

    #[cfg(any(target_os = "windows", target_os = "linux"))]
    return platform::send(key, &resolved);

    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    {
        let _ = (key, resolved);
        Err("key injection is not supported on this platform".into())
    }
}
