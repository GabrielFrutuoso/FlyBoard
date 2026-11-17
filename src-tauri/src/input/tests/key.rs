use super::{KeyId, Modifier, NamedKey};

#[test]
fn parses_printable_physical_key_codes() {
    assert!(matches!(
        KeyId::parse("physical:26"),
        Some(KeyId::Physical(26))
    ));
    assert!(matches!(
        KeyId::parse("physical:40"),
        Some(KeyId::Physical(40))
    ));
    assert!(matches!(
        KeyId::parse("physical:89"),
        Some(KeyId::Physical(89))
    ));
    assert!(matches!(
        KeyId::parse("physical:86"),
        Some(KeyId::Physical(86))
    ));
    assert!(KeyId::parse("physical:0").is_none());
    assert!(KeyId::parse("physical:256").is_none());
}

#[test]
fn parses_character_named_and_modifier_ids() {
    assert!(matches!(KeyId::parse("char:a"), Some(KeyId::Char('a'))));
    assert!(matches!(
        KeyId::parse("Enter"),
        Some(KeyId::Named(NamedKey::Enter))
    ));
    assert!(matches!(
        KeyId::parse("F12"),
        Some(KeyId::Named(NamedKey::Function(12)))
    ));
    assert!(matches!(
        KeyId::parse("Shift"),
        Some(KeyId::Modifier(Modifier::Shift))
    ));
    assert!(KeyId::parse("char:ab").is_none());
    assert!(KeyId::parse("F13").is_none());
    assert!(KeyId::parse("Unknown").is_none());
}
