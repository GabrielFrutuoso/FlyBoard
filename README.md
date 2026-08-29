# FlyBoard

FlyBoard is a compact desktop virtual keyboard. On Linux it creates a native
kernel `uinput` keyboard, so the currently focused application receives normal
keyboard events.

## Ubuntu installation

Install the Debian package:

```bash
sudo apt install ./flyboard_*.deb
```

The package installs FlyBoard's udev rule at
`/usr/lib/udev/rules.d/60-flyboard-uinput.rules`. Restart the graphical session
or reboot after the first installation so logind can grant the active desktop
session access to `/dev/uinput`.

FlyBoard does not add users to the `input` group. That group can read physical
input devices and is broader than a virtual keyboard requires.

Physical key highlighting follows the session's existing access to
`/dev/input/event*` keyboard devices. Most graphical Linux sessions grant that
access to their active user through `uaccess`; when they do not, key injection
still works but physical key highlighting is unavailable.

## Development and AppImage setup

Development runs and AppImages cannot install system udev rules themselves.
Install and activate the included rule once:

```bash
sudo install -Dm644 src-tauri/resources/60-flyboard-uinput.rules /usr/lib/udev/rules.d/60-flyboard-uinput.rules
sudo udevadm control --reload-rules
sudo udevadm trigger --action=change --subsystem-match=misc --sysname-match=uinput
```

Restart the graphical session if FlyBoard still reports that `/dev/uinput` is
unavailable. The app displays the same diagnosis in its window rather than
silently dropping key presses.

## Verify setup

```bash
ls -l /dev/uinput
getfacl /dev/uinput
```

The active graphical user should have a write ACL on `/dev/uinput`. If the
device does not exist, load its kernel module with `sudo modprobe uinput` and
start FlyBoard again.

## Build

```bash
pnpm install
pnpm tauri:linux dev
pnpm tauri:linux:build
```

Close FlyBoard before rebuilding an AppImage. Linux cannot replace an
executable while it is running, which causes `Text file busy (os error 26)`.
To identify a process holding a generated artifact, run:

```bash
fuser -v src-tauri/target/release/bundle/appimage/*.AppImage
```

## Window behavior on Linux

GNOME Wayland does not provide ordinary desktop applications with a guaranteed
always-on-top layer. When FlyBoard starts in a Wayland session and XWayland is
available, it automatically uses XWayland so it can stay above normal
application windows without taking focus from the active input target.

To force native Wayland, launch FlyBoard with `GDK_BACKEND=wayland`. The
virtual keyboard remains functional, but the compositor can reject its
always-on-top request.
