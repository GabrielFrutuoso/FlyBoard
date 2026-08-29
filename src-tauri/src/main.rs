// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "linux")]
fn configure_linux_display_backend() {
    let is_wayland_session = std::env::var("XDG_SESSION_TYPE")
        .is_ok_and(|session_type| session_type.eq_ignore_ascii_case("wayland"));
    let backend_is_explicit = std::env::var_os("GDK_BACKEND").is_some();
    let xwayland_is_available = std::env::var_os("DISPLAY").is_some();

    if is_wayland_session && !backend_is_explicit && xwayland_is_available {
        std::env::set_var("GDK_BACKEND", "x11");
    } else if is_wayland_session && !backend_is_explicit {
        eprintln!(
            "FlyBoard could not select XWayland; this compositor may not honor always-on-top requests."
        );
    }
}

fn main() {
    #[cfg(target_os = "linux")]
    configure_linux_display_backend();

    flyboard_lib::run()
}
