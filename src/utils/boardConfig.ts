import { invoke } from "@tauri-apps/api/core";
import {
  isCharKey,
  KEY_UNITS,
  LAYOUT_ROWS,
  MODIFIERS,
  NAMED_KEYS,
  toPhysicalKeyId,
  type Layout,
} from "../keys";
import type { MacroIconId } from "./macroIcons";

export interface BoardLayout {
  id: string;
  name: string;
  base: Layout;
  rows: string[][];
  backgroundColor?: string;
  keySizes?: (KeySize | null)[][];
  keyStyles?: (KeyStyle | null)[][];
  builtin?: boolean;
}

export interface KeySize {
  width: number;
  height: number;
}

export interface KeyStyle {
  labelColor?: string;
  borderColor?: string;
  backgroundColor?: string;
}

export const DEFAULT_KEY_SIZE: KeySize = { width: 1, height: 1 };

export type MacroStep =
  | { type: "keys"; keys: string[] }
  | { type: "text"; text: string };

export interface Macro {
  id: string;
  name: string;
  icon?: MacroIconId;
  steps: MacroStep[];
}

export interface BoardsFile {
  layouts: BoardLayout[];
  macros: Macro[];
}

export const MACRO_KEY_PREFIX = "macro:";

export const macroKey = (id: string) => `${MACRO_KEY_PREFIX}${id}`;

export const parseMacroKey = (key: string): string | null =>
  key.startsWith(MACRO_KEY_PREFIX) ? key.slice(MACRO_KEY_PREFIX.length) : null;

export const newId = () => crypto.randomUUID();

export const BUILTIN_LAYOUTS: BoardLayout[] = (["pt-br", "en"] as const).map(
  (id) => ({
    id,
    name: id === "pt-br" ? "PT-BR" : "EN",
    base: id,
    rows: LAYOUT_ROWS[id].map((row) => [...row]),
    builtin: true,
  }),
);

export const allLayouts = (boards: BoardsFile): BoardLayout[] => [
  ...BUILTIN_LAYOUTS,
  ...boards.layouts,
];

export const loadBoards = async (): Promise<BoardsFile> => {
  const boards = await invoke<BoardsFile>("read_boards");
  return { layouts: boards.layouts ?? [], macros: boards.macros ?? [] };
};

export const saveBoards = (boards: BoardsFile) =>
  invoke<void>("write_boards", { boards });

export const unitsFor = (key: string, base: Layout): number => {
  if (parseMacroKey(key) !== null) return 2.5;
  return KEY_UNITS[base]?.[key] ?? 1;
};

export const describeStep = (step: MacroStep): string =>
  step.type === "keys" ? step.keys.join(" + ") : `"${step.text}"`;

export const runMacroSteps = async (steps: MacroStep[], base: Layout) => {
  for (const step of steps) {
    if (step.type === "text") {
      await invoke<void>("send_text", { text: step.text });
    } else if (step.keys.length > 0) {
      const key = step.keys[step.keys.length - 1];
      const modifiers = step.keys.slice(0, -1);
      await invoke<void>("send_key", {
        key: toPhysicalKeyId(key, base),
        modifiers,
      });
    }
  }
};

export const PALETTE_CHAR_KEYS: readonly string[] = [
  ...new Set(
    [...LAYOUT_ROWS["pt-br"], ...LAYOUT_ROWS.en]
      .flat()
      .filter((key) => isCharKey(key)),
  ),
];

export const PALETTE_NAMED_KEYS = NAMED_KEYS;
export const PALETTE_MODIFIERS = MODIFIERS;
