pub(super) fn run<K, I, F>(events: I, mut emit: F) -> Result<(), String>
where
    K: Copy + Eq,
    I: IntoIterator<Item = (K, bool)>,
    F: FnMut(K, bool) -> Result<(), String>,
{
    let mut pressed = Vec::new();

    for (key, down) in events {
        if let Err(error) = emit(key, down) {
            if down && !pressed.contains(&key) {
                pressed.push(key);
            }

            let mut cleanup_error = None;
            for pressed_key in pressed.iter().rev() {
                if let Err(error) = emit(*pressed_key, false) {
                    cleanup_error.get_or_insert(error);
                }
            }

            return match cleanup_error {
                Some(cleanup_error) => Err(format!(
                    "{error}; failed to release a pressed key: {cleanup_error}"
                )),
                None => Err(error),
            };
        }

        if down {
            if !pressed.contains(&key) {
                pressed.push(key);
            }
        } else if let Some(index) = pressed.iter().rposition(|pressed_key| *pressed_key == key) {
            pressed.remove(index);
        }
    }

    Ok(())
}

#[cfg(test)]
#[path = "tests/key_sequence.rs"]
mod tests;
