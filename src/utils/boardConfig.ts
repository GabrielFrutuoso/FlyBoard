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
  appearance?: LayoutAppearance;
  backgroundColor?: string;
  transparency?: number;
  keyGap?: number;
  keyRadius?: number;
  keyLabelSize?: number;
  keySizes?: (KeySize | null)[][];
  keyStyles?: (KeyStyle | null)[][];
  builtin?: boolean;
}

export type LayoutAppearance = "solid" | "transparent";

export interface SurfaceStyleOptions {
  appearance?: LayoutAppearance;
  backgroundColor?: string;
  transparency?: number;
}

export interface KeySize {
  width: number;
  height: number;
}

export interface KeyStyle {
  labelColor?: string;
  borderColor?: string;
  borderTransparency?: number;
  backgroundColor?: string;
  appearance?: LayoutAppearance;
  transparency?: number;
}

export const DEFAULT_KEY_SIZE: KeySize = { width: 1, height: 1 };
export const DEFAULT_KEY_GAP = 2;
export const MAX_KEY_GAP = 4;
export const DEFAULT_KEY_RADIUS = 2;
export const DEFAULT_KEY_LABEL_SIZE = 12;

export const normalizeKeyGap = (value: number | undefined) =>
  Math.min(MAX_KEY_GAP, Math.max(0, Math.round(value ?? DEFAULT_KEY_GAP)));

const normalizePercentage = (value: number | undefined, fallback: number) =>
  Math.min(100, Math.max(1, Math.round(value ?? fallback)));

export const surfaceTransparency = (
  surface: Pick<SurfaceStyleOptions, "appearance" | "transparency">,
) =>
  normalizePercentage(
    surface.transparency,
    surface.appearance === "transparent" ? 100 : 1,
  );

export const layoutAppearance = (
  layout: Pick<BoardLayout, "appearance">,
): LayoutAppearance => layout.appearance ?? "solid";

const colorChannels = (color: string) => {
  const hex = color.replace(/^#/, "");
  const expanded =
    hex.length === 3 ? [...hex].map((digit) => digit.repeat(2)).join("") : hex;
  return /^[\da-f]{6}$/i.test(expanded)
    ? [0, 2, 4].map((index) =>
        Number.parseInt(expanded.slice(index, index + 2), 16),
      )
    : [9, 9, 11];
};

export const surfaceStyle = (
  surface: SurfaceStyleOptions,
  fallbackColor: string,
) => {
  const transparency = surfaceTransparency(surface);
  const channels = colorChannels(surface.backgroundColor ?? fallbackColor);
  const opacity = (100 - transparency) / 100;

  return {
    backgroundColor: `rgba(${channels.join(", ")}, ${opacity})`,
  };
};

export const layoutSurfaceStyle = (layout: SurfaceStyleOptions) =>
  surfaceStyle(layout, "#09090b");

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

const migrateLegacyGlass = <
  T extends {
    appearance?: LayoutAppearance;
    transparency?: number;
    glassIntensity?: number;
  },
>(
  surface: T,
) => {
  const isLegacyGlass = (surface.appearance as string | undefined) === "glass";
  return {
    ...surface,
    appearance: isLegacyGlass ? "transparent" : surface.appearance,
    transparency: isLegacyGlass
      ? (surface.transparency ?? 48)
      : surface.transparency,
    glassIntensity: undefined,
  };
};

export const loadBoards = async (): Promise<BoardsFile> => {
  const boards = await invoke<BoardsFile>("read_boards");
  return {
    layouts: (boards.layouts ?? []).map((layout) => {
      const migratedLayout = migrateLegacyGlass(layout);
      return {
        ...migratedLayout,
        keyStyles: layout.keyStyles?.map((row) =>
          row.map((style) => (style ? migrateLegacyGlass(style) : null)),
        ),
      };
    }),
    macros: boards.macros ?? [],
  };
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
