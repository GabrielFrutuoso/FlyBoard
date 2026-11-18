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
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-zinc-950/25">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/7 px-4 py-2">
        <div className="min-w-0">
          <span className="text-xs font-semibold text-zinc-200">
            Key library
          </span>
          <span className="ml-2 hidden text-[10px] text-zinc-500 sm:inline">
            Choose a key or drag it onto the keyboard
          </span>
        </div>
        <div className="flex rounded-lg border border-white/7 bg-black/20 p-0.5">
          <button
            type="button"
            onClick={() => onModeChange("add")}
            className={`flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] ${
              paletteMode === "add"
                ? "bg-white/10 text-zinc-100"
                : "text-zinc-400 hover:bg-white/5"
            }`}
            title="Add a key to the selected row"
          >
            <Plus size={11} /> Add
          </button>
          <button
            type="button"
            disabled={!hasSelectedKey}
            onClick={() => onModeChange("replace")}
            className={`flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] disabled:cursor-default disabled:opacity-35 ${
              paletteMode === "replace"
                ? "bg-sky-300 text-zinc-950"
                : "text-zinc-400 hover:bg-white/5"
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
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden px-4 py-3">
        <KeyPalette macros={macros} onPick={onPick} />
      </div>
    </div>
  );
}
