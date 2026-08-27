export const MODIFIERS = ["Shift", "Ctrl", "Alt", "AltGr", "Win"] as const;
export type Modifier = (typeof MODIFIERS)[number];

export const NAMED_KEYS = ["Enter", "Backspace", "Space", "Tab"] as const;

export const isModifier = (key: string): key is Modifier =>
  (MODIFIERS as readonly string[]).includes(key);

export const isNamedKey = (key: string) =>
  (NAMED_KEYS as readonly string[]).includes(key);

export const isCharKey = (key: string) => !isModifier(key) && !isNamedKey(key);

/** Canonical id understood by the Rust `send_key` command. */
export const toKeyId = (key: string) => (isCharKey(key) ? `char:${key}` : key);

export const SHIFT_MAP: Record<string, string> = {
  "1": "!",
  "2": "@",
  "3": "#",
  "4": "$",
  "5": "%",
  "6": "^",
  "7": "&",
  "8": "*",
  "9": "(",
  "0": ")",
  "'": "`",
  "[": "{",
  "]": "}",
  ";": ":",
  ",": "<",
  ".": ">",
  "/": "?",
  "-": "_",
  "=": "+",
};

export const shifted = (key: string) => SHIFT_MAP[key] ?? key.toUpperCase();
