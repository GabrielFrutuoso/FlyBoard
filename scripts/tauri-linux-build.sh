#!/usr/bin/env bash

set -euo pipefail

appimage_dir="src-tauri/target/release/bundle/appimage"
shopt -s nullglob
appimages=("$appimage_dir"/*.AppImage)

if ((${#appimages[@]})) && fuser -s -- "${appimages[@]}"; then
  echo "Cannot rebuild while a generated AppImage is in use:" >&2
  fuser -v -- "${appimages[@]}" >&2 || true
  echo "Close FlyBoard, then run pnpm tauri:linux:build again." >&2
  exit 1
fi

exec env \
  -u LD_LIBRARY_PATH \
  -u GTK_PATH \
  -u GTK_EXE_PREFIX \
  -u GIO_MODULE_DIR \
  -u GSETTINGS_SCHEMA_DIR \
  -u LOCPATH \
  -u GTK_IM_MODULE_FILE \
  pnpm tauri build "$@"