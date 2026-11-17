use super::run;

#[test]
fn preserves_press_and_release_order_on_success() {
    let events = [(1, true), (2, true), (2, false), (1, false)];
    let mut emitted = Vec::new();

    run(events, |key, down| {
        emitted.push((key, down));
        Ok(())
    })
    .unwrap();

    assert_eq!(emitted, events);
}

#[test]
fn releases_pressed_keys_in_reverse_order_when_a_press_fails() {
    let events = [(1, true), (2, true), (3, true)];
    let mut emitted = Vec::new();

    let result = run(events, |key, down| {
        emitted.push((key, down));
        if key == 3 && down {
            Err("press failed".into())
        } else {
            Ok(())
        }
    });

    assert_eq!(result, Err("press failed".into()));
    assert_eq!(
        emitted,
        [
            (1, true),
            (2, true),
            (3, true),
            (3, false),
            (2, false),
            (1, false)
        ]
    );
}

#[test]
fn retries_a_failed_release_and_releases_remaining_keys() {
    let events = [(1, true), (2, true), (2, false), (1, false)];
    let mut emitted = Vec::new();
    let mut fail_release = true;

    let result = run(events, |key, down| {
        emitted.push((key, down));
        if key == 2 && !down && fail_release {
            fail_release = false;
            Err("release failed".into())
        } else {
            Ok(())
        }
    });

    assert_eq!(result, Err("release failed".into()));
    assert_eq!(
        emitted,
        [(1, true), (2, true), (2, false), (2, false), (1, false)]
    );
}
