import {
  ListChecks,
  MousePointer2,
  Palette,
  RotateCcw,
  Ruler,
  Trash2,
} from "lucide-react";
import { MAX_KEY_GAP } from "../../../utils/boardConfig";
import { SurfaceControls, type SurfaceChoice } from "./SurfaceControls";

interface KeySizeToolbarProps {
  label: string | null;
  selectedCount: number;
  totalKeyCount: number;
  appearance: SurfaceChoice;
  transparency: number;
  widthDraft: string;
  heightDraft: string;
  labelColor: string;
  customLabel: string;
  labelWeight: number;
  borderColor: string;
  borderWidth: number;
  borderTransparency: number;
  backgroundColor: string;
  keyGap: number;
  layoutKeyRadius: number;
  keyLabelSize: number;
  keyboardPadding: number;
  onAppearanceChange: (appearance: SurfaceChoice) => void;
  onTransparencyChange: (transparency: number) => void;
  onResetBackgroundColor: () => void;
  onWidthChange: (value: string) => void;
  onWidthCommit: (value: string) => void;
  onHeightChange: (value: string) => void;
  onHeightCommit: (value: string) => void;
  onLabelColorChange: (value: string) => void;
  onCustomLabelChange: (value: string) => void;
  onLabelWeightChange: (value: number) => void;
  onBorderColorChange: (value: string) => void;
  onBorderWidthChange: (value: number) => void;
  onBorderTransparencyChange: (value: number) => void;
  onBackgroundColorChange: (value: string) => void;
  onKeyGapChange: (value: number) => void;
  onKeyRadiusChange: (value: number) => void;
  onKeyLabelSizeChange: (value: number) => void;
  onKeyboardPaddingChange: (value: number) => void;
  onReset: () => void;
  onResetStyle: () => void;
  onRemove: () => void;
  onSelectAll: () => void;
}

const Section = ({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <section className="rounded-xl border border-white/7 bg-black/10 p-3">
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-sky-300/80" />
        <h3 className="text-[10px] font-semibold text-zinc-300">{title}</h3>
      </div>
      {action}
    </div>
    {children}
  </section>
);

const RangeControl = ({
  label,
  value,
  min,
  max,
  unit = "",
  onChange,
  ariaLabel,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
  ariaLabel: string;
}) => (
  <label className="block">
    <span className="mb-1.5 flex items-center justify-between text-[10px] text-zinc-500">
      {label}
      <output className="rounded-md bg-white/5 px-1.5 py-0.5 font-medium text-zinc-300">
        {value}
        {unit}
      </output>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step="1"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-4 w-full cursor-pointer accent-sky-300"
      aria-label={ariaLabel}
    />
  </label>
);

interface KeyboardGeometryControlsProps {
  keyGap: number;
  layoutKeyRadius: number;
  keyLabelSize: number;
  keyboardPadding: number;
  onKeyGapChange: (value: number) => void;
  onKeyRadiusChange: (value: number) => void;
  onKeyLabelSizeChange: (value: number) => void;
  onKeyboardPaddingChange: (value: number) => void;
}

const KeyboardGeometryControls = ({
  keyGap,
  layoutKeyRadius,
  keyLabelSize,
  keyboardPadding,
  onKeyGapChange,
  onKeyRadiusChange,
  onKeyLabelSizeChange,
  onKeyboardPaddingChange,
}: KeyboardGeometryControlsProps) => (
  <div className="space-y-4">
    <RangeControl
      label="Spacing between keys"
      value={keyGap}
      min={0}
      max={MAX_KEY_GAP}
      unit="px"
      onChange={onKeyGapChange}
      ariaLabel="Key gap"
    />
    <RangeControl
      label="Corner radius"
      value={layoutKeyRadius}
      min={0}
      max={16}
      unit="px"
      onChange={onKeyRadiusChange}
      ariaLabel="Key corner radius"
    />
    <RangeControl
      label="Label size"
      value={keyLabelSize}
      min={8}
      max={24}
      unit="px"
      onChange={onKeyLabelSizeChange}
      ariaLabel="Key label size"
    />
    <RangeControl
      label="Keyboard padding"
      value={keyboardPadding}
      min={0}
      max={24}
      unit="px"
      onChange={onKeyboardPaddingChange}
      ariaLabel="Keyboard padding"
    />
  </div>
);

export function KeySizeToolbar({
  label,
  selectedCount,
  totalKeyCount,
  appearance,
  transparency,
  widthDraft,
  heightDraft,
  labelColor,
  customLabel,
  labelWeight,
  borderColor,
  borderWidth,
  borderTransparency,
  backgroundColor,
  keyGap,
  layoutKeyRadius,
  keyLabelSize,
  keyboardPadding,
  onAppearanceChange,
  onTransparencyChange,
  onResetBackgroundColor,
  onWidthChange,
  onWidthCommit,
  onHeightChange,
  onHeightCommit,
  onLabelColorChange,
  onCustomLabelChange,
  onLabelWeightChange,
  onBorderColorChange,
  onBorderWidthChange,
  onBorderTransparencyChange,
  onBackgroundColorChange,
  onKeyGapChange,
  onKeyRadiusChange,
  onKeyLabelSizeChange,
  onKeyboardPaddingChange,
  onReset,
  onResetStyle,
  onRemove,
  onSelectAll,
}: KeySizeToolbarProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      {label === null ? (
        <>
          <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-6 text-center">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-zinc-500">
              <MousePointer2 size={18} />
            </span>
            <p className="mt-3 text-xs font-medium text-zinc-200">
              Select a key to customize it
            </p>
            <p className="mt-1 max-w-44 text-[10px] leading-relaxed text-zinc-500">
              Click a key on the preview, or select everything for batch editing.
            </p>
            <button
              type="button"
              onClick={onSelectAll}
              disabled={totalKeyCount === 0}
              className="editor-secondary-button mt-4 inline-flex cursor-pointer items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ListChecks size={12} /> Select all keys
            </button>
            <div className="mt-5 w-full space-y-2 border-t border-white/7 pt-4 text-left text-[9px] text-zinc-600">
              <p className="flex items-center justify-between">
                Duplicate <kbd>Ctrl/⌘ + D</kbd>
              </p>
              <p className="flex items-center justify-between">
                Remove <kbd>Delete</kbd>
              </p>
              <p className="flex items-center justify-between">
                Select all <kbd>Ctrl/⌘ + A</kbd>
              </p>
              <p className="flex items-center justify-between">
                Clear selection <kbd>Esc</kbd>
              </p>
            </div>
          </div>
          <div className="mt-3">
            <Section icon={Palette} title="Appearance & geometry">
              <KeyboardGeometryControls
                keyGap={keyGap}
                layoutKeyRadius={layoutKeyRadius}
                keyLabelSize={keyLabelSize}
                keyboardPadding={keyboardPadding}
                onKeyGapChange={onKeyGapChange}
                onKeyRadiusChange={onKeyRadiusChange}
                onKeyLabelSizeChange={onKeyLabelSizeChange}
                onKeyboardPaddingChange={onKeyboardPaddingChange}
              />
            </Section>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-sky-300/15 bg-sky-300/5 p-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-300 text-lg font-semibold text-zinc-950">
              {selectedCount > 1 ? selectedCount : label}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase tracking-wider text-sky-300/60">
                Current selection
              </p>
              <p className="mt-0.5 truncate text-xs font-medium text-zinc-100">
                {selectedCount > 1 ? `${selectedCount} keys` : label}
              </p>
            </div>
            {selectedCount < totalKeyCount && (
              <button
                type="button"
                onClick={onSelectAll}
                className="editor-icon-button cursor-pointer text-sky-300"
                title="Select all keys"
                aria-label="Select all keys"
              >
                <ListChecks size={14} />
              </button>
            )}
          </div>

          {selectedCount > 1 && (
            <p className="rounded-lg border border-white/7 bg-white/3 px-3 py-2 text-[9px] leading-relaxed text-zinc-500">
              Changes apply to every selected key. Use one value to create a
              consistent keyboard.
            </p>
          )}

          <Section
            icon={Ruler}
            title="Size"
            action={
              <button
                type="button"
                onClick={onReset}
                className="text-[9px] text-zinc-500 transition hover:text-zinc-200"
              >
                Reset
              </button>
            }
          >
            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="mb-1 block text-[9px] text-zinc-500">
                  Width
                </span>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={widthDraft}
                    onChange={(event) => onWidthChange(event.target.value)}
                    onBlur={(event) => onWidthCommit(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.currentTarget.blur();
                    }}
                    className="editor-input pr-7 text-center"
                    aria-label="Selected key width"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-600">
                    u
                  </span>
                </div>
              </label>
              <label>
                <span className="mb-1 block text-[9px] text-zinc-500">
                  Height
                </span>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={heightDraft}
                    onChange={(event) => onHeightChange(event.target.value)}
                    onBlur={(event) => onHeightCommit(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.currentTarget.blur();
                    }}
                    className="editor-input pr-7 text-center"
                    aria-label="Selected key height"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-600">
                    u
                  </span>
                </div>
              </label>
            </div>
          </Section>

          <Section icon={Palette} title="Appearance & geometry" action={
            <button
              type="button"
              onClick={onResetStyle}
              className="flex items-center gap-1 text-[9px] text-zinc-500 transition hover:text-zinc-200"
              title="Reset key appearance"
            >
              <RotateCcw size={10} /> Reset
            </button>
          }>
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
            <label className="mt-3 block">
              <span className="mb-1.5 block text-[9px] text-zinc-500">
                Custom label
              </span>
              <input
                type="text"
                value={customLabel}
                onChange={(event) => onCustomLabelChange(event.target.value)}
                placeholder="Use the key's default label"
                className="editor-input"
                aria-label="Selected key custom label"
                maxLength={24}
              />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="rounded-lg border border-white/7 bg-white/3 p-2">
                <span className="mb-2 block text-[9px] text-zinc-500">
                  Label
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={labelColor || "#e4e4e7"}
                    onChange={(event) => onLabelColorChange(event.target.value)}
                    className="h-6 w-8 cursor-pointer rounded-md border border-white/10 bg-zinc-950 p-0.5"
                    aria-label="Selected key label color"
                  />
                  <span className="truncate text-[9px] font-mono text-zinc-400">
                    {(labelColor || "#e4e4e7").toUpperCase()}
                  </span>
                </div>
              </label>
              <label className="rounded-lg border border-white/7 bg-white/3 p-2">
                <span className="mb-2 block text-[9px] text-zinc-500">
                  Border
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={borderColor || "#27272a"}
                    onChange={(event) => onBorderColorChange(event.target.value)}
                    className="h-6 w-8 cursor-pointer rounded-md border border-white/10 bg-zinc-950 p-0.5"
                    aria-label="Selected key border color"
                  />
                  <span className="truncate text-[9px] font-mono text-zinc-400">
                    {(borderColor || "#27272a").toUpperCase()}
                  </span>
                </div>
              </label>
            </div>
            <div className="mt-3">
              <RangeControl
                label="Border transparency"
                value={borderTransparency}
                min={0}
                max={100}
                unit="%"
                onChange={onBorderTransparencyChange}
                ariaLabel="Selected key border transparency"
              />
            </div>
            <div className="mt-3 space-y-3">
              <RangeControl
                label="Key border width"
                value={borderWidth}
                min={0}
                max={8}
                unit="px"
                onChange={onBorderWidthChange}
                ariaLabel="Selected key border width"
              />
              <label className="block">
                <span className="mb-1.5 block text-[9px] text-zinc-500">
                  Label weight
                </span>
                <select
                  value={labelWeight}
                  onChange={(event) =>
                    onLabelWeightChange(Number(event.target.value))
                  }
                  className="editor-input cursor-pointer"
                  aria-label="Selected key label weight"
                >
                  <option value={400}>Regular</option>
                  <option value={500}>Medium</option>
                  <option value={600}>Semibold</option>
                  <option value={700}>Bold</option>
                </select>
              </label>
            </div>
            <div className="mt-3 border-t border-white/7 pt-3">
              <KeyboardGeometryControls
                keyGap={keyGap}
                layoutKeyRadius={layoutKeyRadius}
                keyLabelSize={keyLabelSize}
                keyboardPadding={keyboardPadding}
                onKeyGapChange={onKeyGapChange}
                onKeyRadiusChange={onKeyRadiusChange}
                onKeyLabelSizeChange={onKeyLabelSizeChange}
                onKeyboardPaddingChange={onKeyboardPaddingChange}
              />
            </div>
          </Section>

          <button
            type="button"
            onClick={onRemove}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-400/10 bg-red-400/5 px-3 py-2 text-[10px] text-red-300 transition hover:border-red-400/20 hover:bg-red-400/10"
          >
            <Trash2 size={12} />
            Delete {selectedCount > 1 ? `${selectedCount} keys` : "key"}
          </button>
        </div>
      )}

    </div>
  );
}
