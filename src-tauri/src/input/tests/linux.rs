use super::{is_physical_keyboard, key_code, key_events, physical_key_id, physical_key_source};
use crate::input::{KeyId, Modifier, NamedKey};
use evdev::{AttributeSet, KeyCode};

#[test]
fn shortcut_events_press_modifiers_before_the_target() {
    assert_eq!(
        key_events(key_code(KeyId::Physical(46)).unwrap(), &[Modifier::Ctrl]),
        [
            (KeyCode::KEY_LEFTCTRL, true),
            (KeyCode::KEY_C, true),
            (KeyCode::KEY_C, false),
            (KeyCode::KEY_LEFTCTRL, false),
        ]
    );
    assert_eq!(
        key_events(key_code(KeyId::Named(NamedKey::Function(4))).unwrap(), &[Modifier::Alt]),
        [
            (KeyCode::KEY_LEFTALT, true),
            (KeyCode::KEY_F4, true),
            (KeyCode::KEY_F4, false),
            (KeyCode::KEY_LEFTALT, false),
        ]
    );
}

#[test]
fn physical_feedback_requires_a_keyboard_not_just_any_input_device() {
    let mut keys = AttributeSet::new();
    keys.insert(KeyCode::BTN_LEFT);
    assert!(!is_physical_keyboard(Some("Mouse"), Some(&keys)));
    assert!(!is_physical_keyboard(Some("Keyboard"), None));

    keys.insert(KeyCode::KEY_A);
    assert!(is_physical_keyboard(Some("Keyboard"), Some(&keys)));
    assert!(!is_physical_keyboard(
        Some("FlyBoard Virtual Keyboard"),
        Some(&keys)
    ));
}

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
