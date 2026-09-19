interface KeySizeToolbarProps {
  label: string | null;
  widthDraft: string;
  heightDraft: string;
  onWidthChange: (value: string) => void;
  onWidthCommit: (value: string) => void;
  onHeightChange: (value: string) => void;
  onHeightCommit: (value: string) => void;
  onReset: () => void;
  onRemove: () => void;
}

/** Width/height editor + reset/remove actions for the currently selected key. */
export function KeySizeToolbar({
  label,
  widthDraft,
  heightDraft,
  onWidthChange,
  onWidthCommit,
  onHeightChange,
  onHeightCommit,
  onReset,
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
    <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-2 py-1.5">
      <span className="max-w-36 truncate text-xs text-zinc-200">{label}</span>
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
        onClick={onRemove}
        className="text-[10px] text-red-400 hover:text-red-200"
      >
        Remove key
      </button>
    </div>
  );
}
