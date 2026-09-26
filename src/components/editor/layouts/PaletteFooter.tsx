import { Plus, Replace } from "lucide-react";
import type { Macro } from "../../../utils/boardConfig";
import { KeyPalette } from "../KeyPalette";
import type { PaletteMode } from "./types";

interface PaletteFooterProps {
  macros: Macro[];
  paletteMode: PaletteMode;
  hasSelectedKey: boolean;
  onModeChange: (mode: PaletteMode) => void;
  onPick: (key: string) => void;
}

export function PaletteFooter({
  macros,
  paletteMode,
  hasSelectedKey,
  onModeChange,
  onPick,
}: PaletteFooterProps) {
  return (
    <div className="flex h-44 shrink-0 flex-col border-t border-zinc-800">
      <div className="flex shrink-0 items-center gap-1 border-b border-zinc-800 px-2 py-1">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Palette action
        </span>
        <button
          type="button"
          onClick={() => onModeChange("add")}
          className={`flex cursor-pointer items-center gap-1 rounded-sm px-2 py-1 text-[10px] ${
            paletteMode === "add"
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          <Plus size={11} /> Add
        </button>
        <button
          type="button"
          disabled={!hasSelectedKey}
          onClick={() => onModeChange("replace")}
          className={`flex cursor-pointer items-center gap-1 rounded-sm px-2 py-1 text-[10px] disabled:cursor-default disabled:opacity-35 ${
            paletteMode === "replace"
              ? "bg-sky-800 text-sky-100"
              : "text-zinc-400 hover:bg-zinc-800"
          }`}
          title={
            hasSelectedKey
              ? "Replace the selected key"
              : "Select a key in the preview first"
          }
        >
          <Replace size={11} /> Replace selected
        </button>
        {paletteMode === "replace" && hasSelectedKey && (
          <span className="ml-1 min-w-0 truncate text-[10px] text-sky-300">
            Choose the replacement below
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <KeyPalette macros={macros} onPick={onPick} />
      </div>
    </div>
  );
}
