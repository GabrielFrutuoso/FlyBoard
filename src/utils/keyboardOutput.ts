import { invoke } from "@tauri-apps/api/core";
import {
    isCharKey,
    toKeyId,
    toPhysicalKeyId,
    type Layout,
    type Modifier,
} from "../keys";
import { getKeyLabel } from "./keyboardText";

// Use physical key events for these shifted symbols; Linux Unicode entry inherits held Shift.
const PHYSICAL_SHIFT_SYMBOLS = new Set([
    "<",
    ">",
    ":",
    "?",
    "+",
    "_",
    "|",
    "{",
    "}",
    "!",
    "@",
    "#",
    "$",
    "%",
    "^",
    "&",
    "*",
    "(",
    ")",
    '"',
]);

interface SendKeyboardInputOptions {
    key: string;
    modifiers: Modifier[];
    text?: string;
    physicalModifierHeld?: boolean;
    capsActive: boolean;
    layout: Layout;
    builtinLayout?: boolean;
}

export function sendKeyboardInput({
    key,
    modifiers,
    text,
    physicalModifierHeld = false,
    capsActive,
    layout,
    builtinLayout,
}: SendKeyboardInputOptions) {
    const hasShortcutModifier = modifiers.some(
        (modifier) => modifier !== "Shift",
    );
    const outputText =
        text ?? getKeyLabel(key, modifiers.includes("Shift"), capsActive, layout);
    const canUsePhysicalShift =
        physicalModifierHeld &&
        modifiers.includes("Shift") &&
        PHYSICAL_SHIFT_SYMBOLS.has(outputText);
    const useCustomText =
        !builtinLayout &&
        isCharKey(key) &&
        !hasShortcutModifier &&
        !canUsePhysicalShift;

    if (
        isCharKey(key) &&
        !hasShortcutModifier &&
        (!physicalModifierHeld || useCustomText)
    ) {
        return invoke<void>("send_text", { text: outputText });
    }

    return invoke<void>("send_key", {
        key: canUsePhysicalShift
            ? toPhysicalKeyId(key, layout)
            : !builtinLayout && isCharKey(key)
                ? toKeyId(key)
                : toPhysicalKeyId(key, layout),
        modifiers,
    });
}