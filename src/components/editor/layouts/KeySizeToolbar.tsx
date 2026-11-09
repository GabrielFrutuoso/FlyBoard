import { SurfaceControls, type SurfaceChoice } from "./SurfaceControls";
import { Keyboard, ListChecks, MousePointer2 } from "lucide-react";
import { MAX_KEY_GAP } from "../../../utils/boardConfig";

interface KeySizeToolbarProps {
  label: string | null;
  selectedCount: number;
  totalKeyCount: number;
  appearance: SurfaceChoice;
  transparency: number;
  widthDraft: string;
  heightDraft: string;
  labelColor: string;
  borderColor: string;
  borderTransparency: number;
  backgroundColor: string;
  keyGap: number;
  keyRadius: number;
  keyLabelSize: number;
  onAppearanceChange: (appearance: SurfaceChoice) => void;
  onTransparencyChange: (transparency: number) => void;
  onResetBackgroundColor: () => void;
  onWidthChange: (value: string) => void;
  onWidthCommit: (value: string) => void;
  onHeightChange: (value: string) => void;
  onHeightCommit: (value: string) => void;
  onLabelColorChange: (value: string) => void;
  onBorderColorChange: (value: string) => void;
  onBorderTransparencyChange: (value: number) => void;
  onBackgroundColorChange: (value: string) => void;
  onKeyGapChange: (value: number) => void;
  onKeyRadiusChange: (value: number) => void;
  onKeyLabelSizeChange: (value: number) => void;
  onReset: () => void;
  onResetStyle: () => void;
  onRemove: () => void;
  onSelectAll: () => void;
}

/** Width/height editor + reset/remove actions for the currently selected key. */
export function KeySizeToolbar({
  label,
  selectedCount,
  totalKeyCount,
  appearance,
  transparency,
  widthDraft,
  heightDraft,
  labelColor,
  borderColor,
  borderTransparency,
  backgroundColor,
  keyGap,
  keyRadius,
  keyLabelSize,
  onAppearanceChange,
  onTransparencyChange,
  onResetBackgroundColor,
  onWidthChange,
  onWidthCommit,
  onHeightChange,
  onHeightCommit,
  onLabelColorChange,
  onBorderColorChange,
  onBorderTransparencyChange,
  onBackgroundColorChange,
  onKeyGapChange,
  onKeyRadiusChange,
  onKeyLabelSizeChange,
  onReset,
  onResetStyle,
  onRemove,
  onSelectAll,
}: KeySizeToolbarProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
      {label === null ? (
        <div className="flex min-h-40 flex-col items-center justify-center p-2 text-center">
          <div className="max-w-40 text-center">
            <MousePointer2 className="mx-auto mb-2 text-zinc-600" size={20} />
            <p className="text-xs font-medium text-zinc-300">Select a key</p>
            <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
              Click to edit, or select every key for batch changes.
            </p>
            <button
              type="button"
              onClick={onSelectAll}
              disabled={totalKeyCount === 0}
              className="mt-3 inline-flex items-center gap-1.5 rounded-sm border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[10px] text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ListChecks size={13} /> Select all keys
            </button>
            <div className="mt-4 space-y-2 border-t border-zinc-800 pt-3 text-left">
              <p className="flex items-center gap-2 text-[10px] text-zinc-500">
                <Keyboard size={13} /> Ctrl/⌘+D to duplicate
              </p>
              <p className="flex items-center gap-2 text-[10px] text-zinc-500">
                <span className="w-3 text-center font-semibold">Del</span> to
                delete selected keys
              </p>
              <p className="text-[10px] text-zinc-500">
                Ctrl/⌘+A selects all keys
              </p>
              <p className="text-[10px] text-zinc-500">Esc clears selection</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                Selection
              </p>
              <p className="mt-1 truncate text-sm font-medium text-zinc-100">
                {selectedCount > 1 ? `${selectedCount} keys` : label}
              </p>
            </div>
            {selectedCount < totalKeyCount && (
              <button
                type="button"
                onClick={onSelectAll}
                className="inline-flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-1 text-[10px] text-sky-300 hover:bg-zinc-800 hover:text-sky-200"
              >
                <ListChecks size={12} /> Select all
              </button>
            )}
          </div>
          <SurfaceControls
            title="Key surface"
            appearance={appearance}
            allowInherit
            transparency={transparency}
            backgroundColor={backgroundColor || "#18181b"}
            onAppearanceChange={onAppearanceChange}
            onTransparencyChange={onTransparencyChange}
            onBackgroundColorChange={onBackgroundColorChange}
            onResetBackgroundColor={onResetBackgroundColor}
          />
          {selectedCount > 1 && (
            <p className="text-[10px] leading-relaxed text-zinc-500">
              Appearance changes apply to all selected keys. Editing width or
              height sets that value on the whole selection.
            </p>
          )}
          <label className="flex items-center justify-between gap-2 text-[10px] text-zinc-500">
            Label color
            <input
              type="color"
              value={labelColor || "#e4e4e7"}
              onChange={(event) => onLabelColorChange(event.target.value)}
              className="h-6 w-8 cursor-pointer rounded-sm border border-zinc-700 bg-zinc-900 p-0.5"
              aria-label="Selected key label color"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-[10px] text-zinc-500">
            Width
            <input
              type="text"
              inputMode="decimal"
              value={widthDraft}
              onChange={(event) => onWidthChange(event.target.value)}
              onBlur={(event) => onWidthCommit(event.target.value)}
              className="w-20 rounded-sm border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-sky-600"
              aria-label="Selected key width"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-[10px] text-zinc-500">
            Border
            <input
              type="color"
              value={borderColor || "#27272a"}
              onChange={(event) => onBorderColorChange(event.target.value)}
              className="h-6 w-8 cursor-pointer rounded-sm border border-zinc-700 bg-zinc-900 p-0.5"
              aria-label="Selected key border color"
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] text-zinc-500">
            <span className="flex items-center justify-between">
              Border transparency
              <output>{borderTransparency}%</output>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={borderTransparency}
              onChange={(event) =>
                onBorderTransparencyChange(Number(event.target.value))
              }
              className="h-4 w-full cursor-pointer accent-sky-500"
              aria-label="Selected key border transparency"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-[10px] text-zinc-500">
            Height
            <input
              type="text"
              inputMode="decimal"
              value={heightDraft}
              onChange={(event) => onHeightChange(event.target.value)}
              onBlur={(event) => onHeightCommit(event.target.value)}
              className="w-20 rounded-sm border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-sky-600"
              aria-label="Selected key height"
            />
          </label>
          <button
            type="button"
            onClick={onReset}
            className="text-[10px] text-zinc-500 hover:text-zinc-200"
          >
            Reset size
          </button>
          <button
            type="button"
            onClick={onResetStyle}
            className="text-[10px] text-zinc-500 hover:text-zinc-200"
          >
            Reset appearance
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-[10px] text-red-400 hover:text-red-200"
          >
            Delete {selectedCount > 1 ? `${selectedCount} keys` : "key"}
          </button>
        </>
      )}
      <section className="space-y-2 border-t border-zinc-800 pt-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Keyboard geometry
        </h3>
        <label className="flex flex-col gap-1 text-[10px] text-zinc-500">
          <span className="flex justify-between">
            Key gap <output>{keyGap}px</output>
          </span>
          <input
            type="range"
            min="0"
            max={MAX_KEY_GAP}
            step="1"
            value={keyGap}
            onChange={(event) => onKeyGapChange(Number(event.target.value))}
            className="h-4 w-full cursor-pointer accent-sky-500"
            aria-label="Key gap"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] text-zinc-500">
          <span className="flex justify-between">
            Corner radius <output>{keyRadius}px</output>
          </span>
          <input
            type="range"
            min="0"
            max="16"
            step="1"
            value={keyRadius}
            onChange={(event) => onKeyRadiusChange(Number(event.target.value))}
            className="h-4 w-full cursor-pointer accent-sky-500"
            aria-label="Key corner radius"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] text-zinc-500">
          <span className="flex justify-between">
            Key label size <output>{keyLabelSize}px</output>
          </span>
          <input
            type="range"
            min="8"
            max="24"
            step="1"
            value={keyLabelSize}
            onChange={(event) =>
              onKeyLabelSizeChange(Number(event.target.value))
            }
            className="h-4 w-full cursor-pointer accent-sky-500"
            aria-label="Key label size"
          />
        </label>
      </section>
    </div>
  );
}
