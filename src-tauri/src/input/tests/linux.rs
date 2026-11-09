use super::{key_code, physical_key_id, physical_key_source};
use crate::input::{KeyId, NamedKey};
use evdev::KeyCode;

#[test]
fn resolves_accent_positions_without_colliding() {
    assert_eq!(
        key_code(KeyId::Physical(26)).unwrap().0,
        KeyCode::KEY_LEFTBRACE
    );
    assert_eq!(
        key_code(KeyId::Physical(40)).unwrap().0,
        KeyCode::KEY_APOSTROPHE
    );
    assert_eq!(key_code(KeyId::Physical(41)).unwrap().0, KeyCode::KEY_GRAVE);
}

#[test]
fn resolves_character_mappings_matching_ui_layout() {
    assert_eq!(
        key_code(KeyId::Char('\'')).unwrap().0,
        KeyCode::KEY_APOSTROPHE
    );
    assert_eq!(key_code(KeyId::Char('`')).unwrap().0, KeyCode::KEY_GRAVE);
    assert_eq!(
        key_code(KeyId::Char('[')).unwrap().0,
        KeyCode::KEY_LEFTBRACE
    );
    assert_eq!(
        key_code(KeyId::Char(']')).unwrap().0,
        KeyCode::KEY_RIGHTBRACE
    );
    assert_eq!(
        key_code(KeyId::Char('\\')).unwrap().0,
        KeyCode::KEY_BACKSLASH
    );
    assert_eq!(
        key_code(KeyId::Char(';')).unwrap().0,
        KeyCode::KEY_SEMICOLON
    );
    assert_eq!(key_code(KeyId::Char('/')).unwrap().0, KeyCode::KEY_SLASH);
    assert_eq!(
        key_code(KeyId::Char('ç')).unwrap().0,
        KeyCode::KEY_SEMICOLON
    );
}

#[test]
fn resolves_function_keys_correctly() {
    assert_eq!(
        key_code(KeyId::Named(NamedKey::Function(1))).unwrap().0,
        KeyCode::KEY_F1
    );
    assert_eq!(
        key_code(KeyId::Named(NamedKey::Function(10))).unwrap().0,
        KeyCode::KEY_F10
    );
    assert_eq!(
        key_code(KeyId::Named(NamedKey::Function(11))).unwrap().0,
        KeyCode::KEY_F11
    );
    assert_eq!(
        key_code(KeyId::Named(NamedKey::Function(12))).unwrap().0,
        KeyCode::KEY_F12
    );
}

#[test]
fn physical_key_id_preserves_printable_key_positions() {
    assert_eq!(
        physical_key_id(KeyCode::KEY_GRAVE),
        Some("physical:41".into())
    );
    assert_eq!(
        physical_key_id(KeyCode::KEY_LEFTBRACE),
        Some("physical:26".into())
    );
    assert_eq!(
        physical_key_id(KeyCode::KEY_RIGHTBRACE),
        Some("physical:27".into())
    );
    assert_eq!(
        physical_key_id(KeyCode::KEY_BACKSLASH),
        Some("physical:43".into())
    );
    assert_eq!(
        physical_key_id(KeyCode::KEY_SEMICOLON),
        Some("physical:39".into())
    );
    assert_eq!(
        physical_key_id(KeyCode::KEY_APOSTROPHE),
        Some("physical:40".into())
    );
    assert_eq!(
        physical_key_id(KeyCode::KEY_102ND),
        Some("physical:86".into())
    );
    assert_eq!(
        physical_key_id(KeyCode::KEY_SLASH),
        Some("physical:53".into())
    );
    assert_eq!(physical_key_id(KeyCode::KEY_RO), Some("physical:89".into()));
    assert_eq!(physical_key_id(KeyCode::KEY_F11), Some("F11".into()));
    assert_eq!(physical_key_id(KeyCode::KEY_F12), Some("F12".into()));
}

#[test]
fn left_and_right_modifiers_have_distinct_physical_sources() {
    assert_ne!(
        KeyCode::KEY_LEFTSHIFT.code(),
        KeyCode::KEY_RIGHTSHIFT.code()
    );
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
    assert_eq!(key_code(KeyId::Physical(89)).unwrap().0, KeyCode::new(89));
}

#[test]
fn resolves_brazilian_backslash_position() {
    assert_eq!(key_code(KeyId::Physical(86)).unwrap().0, KeyCode::KEY_102ND);
}
