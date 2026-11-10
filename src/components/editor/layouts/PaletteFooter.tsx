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
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-zinc-950">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800 px-3 py-1.5">
        <div className="min-w-0">
          <span className="text-[10px] font-semibold text-zinc-200">
            Key library
          </span>
          <span className="ml-2 hidden text-[10px] text-zinc-500 sm:inline">
            Choose a key or drag it onto the keyboard
          </span>
        </div>
        <div className="flex rounded-sm border border-zinc-700 bg-zinc-900 p-0.5">
          <button
            type="button"
            onClick={() => onModeChange("add")}
            className={`flex cursor-pointer items-center gap-1 rounded-sm px-1.5 py-1 text-[10px] ${
              paletteMode === "add"
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800"
            }`}
            title="Add a key to the selected row"
          >
            <Plus size={11} /> Add
          </button>
          <button
            type="button"
            disabled={!hasSelectedKey}
            onClick={() => onModeChange("replace")}
            className={`flex cursor-pointer items-center gap-1 rounded-sm px-1.5 py-1 text-[10px] disabled:cursor-default disabled:opacity-35 ${
              paletteMode === "replace"
                ? "bg-sky-800 text-sky-100"
                : "text-zinc-400 hover:bg-zinc-800"
            }`}
            title={
              hasSelectedKey
                ? "Replace all selected keys"
                : "Select a key in the keyboard first"
            }
          >
            <Replace size={11} /> Replace
          </button>
        </div>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden px-3 py-2">
        <KeyPalette macros={macros} onPick={onPick} />
      </div>
    </div>
  );
}
