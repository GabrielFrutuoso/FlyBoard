interface KeySizeToolbarProps {
  label: string | null;
  selectedCount: number;
  widthDraft: string;
  heightDraft: string;
  labelColor: string;
  borderColor: string;
  backgroundColor: string;
  onWidthChange: (value: string) => void;
  onWidthCommit: (value: string) => void;
  onHeightChange: (value: string) => void;
  onHeightCommit: (value: string) => void;
  onLabelColorChange: (value: string) => void;
  onBorderColorChange: (value: string) => void;
  onBackgroundColorChange: (value: string) => void;
  onReset: () => void;
  onResetStyle: () => void;
  onRemove: () => void;
}

/** Width/height editor + reset/remove actions for the currently selected key. */
export function KeySizeToolbar({
  label,
  selectedCount,
  widthDraft,
  heightDraft,
  labelColor,
  borderColor,
  backgroundColor,
  onWidthChange,
  onWidthCommit,
  onHeightChange,
  onHeightCommit,
  onLabelColorChange,
  onBorderColorChange,
  onBackgroundColorChange,
  onReset,
  onResetStyle,
  onRemove,
}: KeySizeToolbarProps) {
  if (label === null) {
    return (
      <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-2 py-1.5">
        <span className="text-[10px] text-zinc-500">
          Select a key below to edit its width and height.
        </span>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-zinc-800 px-2 py-1.5">
      <span className="max-w-36 truncate text-xs text-zinc-200">
        {selectedCount > 1 ? `${selectedCount} keys selected` : label}
      </span>
      <label className="flex items-center gap-1 text-[10px] text-zinc-500">
        Label color
        <input
          type="color"
          value={labelColor || "#e4e4e7"}
          onChange={(event) => onLabelColorChange(event.target.value)}
          className="h-6 w-8 cursor-pointer rounded-sm border border-zinc-700 bg-zinc-900 p-0.5"
          aria-label="Selected key label color"
        />
      </label>
      <label className="flex items-center gap-1 text-[10px] text-zinc-500">
        Width
        <input
          type="text"
          inputMode="decimal"
          value={widthDraft}
          onChange={(event) => onWidthChange(event.target.value)}
          onBlur={(event) => onWidthCommit(event.target.value)}
          className="w-14 rounded-sm border border-zinc-700 bg-zinc-900 px-1 py-1 text-xs text-zinc-200 outline-none focus:border-sky-600"
          aria-label="Selected key width"
        />
        x
      </label>
      <label className="flex items-center gap-1 text-[10px] text-zinc-500">
        Border
        <input
          type="color"
          value={borderColor || "#27272a"}
          onChange={(event) => onBorderColorChange(event.target.value)}
          className="h-6 w-8 cursor-pointer rounded-sm border border-zinc-700 bg-zinc-900 p-0.5"
          aria-label="Selected key border color"
        />
      </label>
      <label className="flex items-center gap-1 text-[10px] text-zinc-500">
        Background
        <input
          type="color"
          value={backgroundColor || "#18181b"}
          onChange={(event) => onBackgroundColorChange(event.target.value)}
          className="h-6 w-8 cursor-pointer rounded-sm border border-zinc-700 bg-zinc-900 p-0.5"
          aria-label="Selected key background color"
        />
      </label>
      <label className="flex items-center gap-1 text-[10px] text-zinc-500">
        Height
        <input
          type="text"
          inputMode="decimal"
          value={heightDraft}
          onChange={(event) => onHeightChange(event.target.value)}
          onBlur={(event) => onHeightCommit(event.target.value)}
          className="w-14 rounded-sm border border-zinc-700 bg-zinc-900 px-1 py-1 text-xs text-zinc-200 outline-none focus:border-sky-600"
          aria-label="Selected key height"
        />
        x
      </label>
      <button
        type="button"
        onClick={onReset}
        className="text-[10px] text-zinc-500 hover:text-zinc-200"
      >
        Reset
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
        Remove key
      </button>
    </div>
  );
}
