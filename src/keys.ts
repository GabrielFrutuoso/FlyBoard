export type Layout = "pt-br" | "en";

export type AccentKey = "´" | "`" | "~" | "^";

export const ACCENT_MARKS: Record<AccentKey, string> = {
  "´": "\u0301",
  "`": "\u0300",
  "~": "\u0303",
  "^": "\u0302",
};

const ACCENT_BASES: Record<AccentKey, readonly string[]> = {
  "´": ["a", "e", "i", "o", "u"],
  "`": ["a", "e", "i", "o", "u"],
  "~": ["a", "n", "o"],
  "^": ["a", "e", "i", "o", "u"],
};

export const accentFor = (key: string): AccentKey | undefined =>
  key in ACCENT_MARKS ? (key as AccentKey) : undefined;

export const isAccentBase = (accent: AccentKey, key: string) =>
  ACCENT_BASES[accent].includes(key.toLowerCase());

export const composeAccent = (accent: AccentKey, text: string) => {
  if (text === " ") return accent;

  const marked = `${text}${ACCENT_MARKS[accent]}`;
  const composed = marked.normalize("NFC");
  return composed === marked ? `${accent}${text}` : composed;
};

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
  "PageUp",
  "PageDown",
  ...FUNCTION_KEYS,
];

export const LAYOUT_ROWS: Record<Layout, readonly (readonly string[])[]> = {
  "pt-br": [
    [
      "'",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      "-",
      "=",
      "Backspace",
    ],
    ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "´", "[", "]"],
    ["Caps", "a", "s", "d", "f", "g", "h", "j", "k", "l", "ç", "~", "Enter"],
    [
      "Shift",
      "\\",
      "z",
      "x",
      "c",
      "v",
      "b",
      "n",
      "m",
      ",",
      ".",
      ";",
      "/",
      "PageUp",
      "Up",
      "PageDown",
    ],
    ["Ctrl", "Fn", "Win", "Space", "AltGr", "Alt", "Left", "Down", "Right"],
  ],
  en: [
    [
      "`",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      "-",
      "=",
      "Backspace",
    ],
    ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
    ["Caps", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "Enter"],
    [
      "Shift",
      "z",
      "x",
      "c",
      "v",
      "b",
      "n",
      "m",
      ",",
      ".",
      "/",
      "PageUp",
      "Up",
      "PageDown",
    ],
    ["Ctrl", "Fn", "Win", "Space", "AltGr", "Alt", "Left", "Down", "Right"],
  ],
};

/** What the number row becomes while the Fn layer is latched. */
export const FN_MAP: Record<Layout, Record<string, string>> = {
  "pt-br": {
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
  },
  en: {
    "`": "Esc",
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
  },
};

export const isModifier = (key: string): key is Modifier =>
  (MODIFIERS as readonly string[]).includes(key);

export const isNamedKey = (key: string) => NAMED_KEYS.includes(key);

export const isCharKey = (key: string) => !isModifier(key) && !isNamedKey(key);

/** Linux evdev codes for the physical positions represented by printable keys. */
export const PHYSICAL_KEY_CODES: Record<Layout, Record<string, number>> = {
  "pt-br": {
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
    ç: 39,
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
  },
  en: {
    "`": 41,
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
    "[": 26,
    "]": 27,
    "\\": 43,
    a: 30,
    s: 31,
    d: 32,
    f: 33,
    g: 34,
    h: 35,
    j: 36,
    k: 37,
    l: 38,
    ";": 39,
    "'": 40,
    z: 44,
    x: 45,
    c: 46,
    v: 47,
    b: 48,
    n: 49,
    m: 50,
    ",": 51,
    ".": 52,
    "/": 53,
  },
};

/** Canonical id understood by the Rust `send_key` command. */
export const toKeyId = (key: string) => (isCharKey(key) ? `char:${key}` : key);

/** Canonical id for a printable key's physical position in the selected layout. */
export const toPhysicalKeyId = (key: string, layout: Layout) => {
  const code = PHYSICAL_KEY_CODES[layout]?.[key];
  return code === undefined ? toKeyId(key) : `physical:${code}`;
};

export const SHIFT_MAP: Record<Layout, Record<string, string>> = {
  "pt-br": {
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
    "'": '"',
    "´": "`",
    "[": "{",
    "]": "}",
    "\\": "|",
    ";": ":",
    ",": "<",
    ".": ">",
    "/": "?",
    "-": "_",
    "=": "+",
    "~": "^",
  },
  en: {
    "`": "~",
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
    "-": "_",
    "=": "+",
    "[": "{",
    "]": "}",
    "\\": "|",
    ";": ":",
    "'": '"',
    ",": "<",
    ".": ">",
    "/": "?",
  },
};

// Relative widths, tuned so every row's keys render at a consistent size: rows share a
// row-total of ~15 units (17 for the shift/bottom rows, which carry the extra arrow cluster).
const BASE_KEY_UNITS: Record<string, number> = {
  Backspace: 2,
  Enter: 2.25,
  Shift: 2,
  Space: 6.5,
  Ctrl: 1.5,
  Win: 1.5,
  Alt: 1.5,
  AltGr: 1.5,
  Fn: 1.5,
  Tab: 2,
  Caps: 1.75,
};

// EN's bottom-left row has two fewer keys than pt-br's ABNT2 row (no "\" or ";"), so its
// Space is narrowed to keep that row's total width equal to the row below it (arrow cluster
// alignment depends on both rows summing to the same total).
export const KEY_UNITS: Record<Layout, Record<string, number>> = {
  "pt-br": BASE_KEY_UNITS,
  en: { ...BASE_KEY_UNITS, Space: 4.5 },
};

export const shifted = (key: string, layout: Layout = "pt-br") =>
  SHIFT_MAP[layout]?.[key] ?? key.toUpperCase();

export const getPhysicalKeyLabel = (rawKey: string, layout: Layout): string => {
  const match = /^physical:(\d+)$/.exec(rawKey);
  if (!match) return rawKey;

  const code = Number(match[1]);
  return (
    Object.entries(PHYSICAL_KEY_CODES[layout]).find(
      ([, physicalCode]) => physicalCode === code,
    )?.[0] ?? rawKey
  );
};
