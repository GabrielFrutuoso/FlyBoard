#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "windows")]
use windows as platform;

#[cfg(target_os = "windows")]
pub mod hook;

#[cfg(target_os = "linux")]
pub(crate) mod linux;
#[cfg(target_os = "linux")]
use linux as platform;

mod key;
pub use key::{KeyId, Modifier, NamedKey};
#[cfg(any(target_os = "linux", test))]
mod key_sequence;

#[derive(serde::Serialize)]
pub struct InputStatus {
    pub ready: bool,
    pub message: Option<String>,
}

fn push_unique(modifiers: &mut Vec<Modifier>, modifier: Modifier) {
    if !modifiers.contains(&modifier) {
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
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    {
        platform::caps_lock_on()
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    {
        false
    }
}

pub fn status() -> InputStatus {
    #[cfg(target_os = "linux")]
    return platform::status();

    #[cfg(not(target_os = "linux"))]
    InputStatus {
        ready: true,
        message: None,
    }
}

pub fn send(key: &str, modifiers: &[String]) -> Result<(), String> {
    let key = KeyId::parse(key).ok_or_else(|| format!("unknown key id: {key}"))?;

    let mut resolved = Vec::new();
    for name in modifiers {
        let modifier = Modifier::parse(name).ok_or_else(|| format!("unknown modifier: {name}"))?;
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
