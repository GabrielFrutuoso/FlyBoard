export const MODIFIERS = ["Shift", "Ctrl", "Alt", "AltGr", "Win"] as const;
export type Modifier = (typeof MODIFIERS)[number];

export const FUNCTION_KEYS = Array.from({ length: 12 }, (_, i) => `F${i + 1}`);

export const NAMED_KEYS: readonly string[] = [
  "Enter",
  "Backspace",
  "Space",
  "Tab",
  "Caps",
  "Esc",
  "Up",
  "Down",
  "Left",
  "Right",
  ...FUNCTION_KEYS,
];

/** What the number row becomes while the Fn layer is latched. */
export const FN_MAP: Record<string, string> = {
  "'": "Esc",
  "1": "F1",
  "2": "F2",
  "3": "F3",
  "4": "F4",
  "5": "F5",
  "6": "F6",
  "7": "F7",
  "8": "F8",
  "9": "F9",
  "0": "F10",
  "-": "F11",
  "=": "F12",
};

export const isModifier = (key: string): key is Modifier =>
  (MODIFIERS as readonly string[]).includes(key);

export const isNamedKey = (key: string) => NAMED_KEYS.includes(key);

export const isCharKey = (key: string) => !isModifier(key) && !isNamedKey(key);

/** Linux evdev codes for the physical positions represented by printable keys. */
export const PHYSICAL_KEY_CODES: Record<string, number> = {
  "'": 41,
  "1": 2,
  "2": 3,
  "3": 4,
  "4": 5,
  "5": 6,
  "6": 7,
  "7": 8,
  "8": 9,
  "9": 10,
  "0": 11,
  "-": 12,
  "=": 13,
  q: 16,
  w: 17,
  e: 18,
  r: 19,
  t: 20,
  y: 21,
  u: 22,
  i: 23,
  o: 24,
  p: 25,
  "´": 26,
  "[": 27,
  "]": 43,
  a: 30,
  s: 31,
  d: 32,
  f: 33,
  g: 34,
  h: 35,
  j: 36,
  k: 37,
  l: 38,
  "ç": 39,
  "~": 40,
  z: 44,
  x: 45,
  c: 46,
  v: 47,
  b: 48,
  n: 49,
  m: 50,
  ",": 51,
  ".": 52,
  ";": 53,
  "\\": 86,
  "/": 89,
};

/** Canonical id understood by the Rust `send_key` command. */
export const toKeyId = (key: string) => {
  const physicalCode = PHYSICAL_KEY_CODES[key];
  return physicalCode ? `physical:${physicalCode}` : key;
};

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
  "\\": "|",
  ";": ":",
  ",": "<",
  ".": ">",
  "/": "?",
  "-": "_",
  "=": "+",
};

// Relative widths, chosen so every row adds up to the same total.
export const KEY_UNITS: Record<string, number> = {
  Backspace: 2,
  Enter: 2,
  Shift: 2,
  Space: 5.5,
  Ctrl: 1.5,
  Win: 1.5,
  Alt: 1.5,
  AltGr: 1.5,
  Fn: 1.5,
  Tab: 1.5,
  Caps: 1.75,
};

export const shifted = (key: string) => SHIFT_MAP[key] ?? key.toUpperCase();
