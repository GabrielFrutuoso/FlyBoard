import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { LayoutAppearance } from "../../../utils/boardConfig";

export type SurfaceChoice = LayoutAppearance | "inherit";

interface SurfaceControlsProps {
  title: string;
  appearance: SurfaceChoice;
  allowInherit?: boolean;
  transparency: number;
  backgroundColor?: string;
  onAppearanceChange: (appearance: SurfaceChoice) => void;
  onTransparencyChange: (transparency: number) => void;
  onBackgroundColorChange?: (color: string) => void;
  onResetBackgroundColor?: () => void;
}

const surfaceChoices: { value: SurfaceChoice; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "transparent", label: "Transparent" },
];

const appearanceLabel = (appearance: SurfaceChoice) =>
  appearance === "inherit"
    ? "Layout"
    : (surfaceChoices.find((choice) => choice.value === appearance)?.label ??
      "Solid");

export function SurfaceControls({
  title,
  appearance,
  allowInherit = false,
  transparency,
  backgroundColor,
  onAppearanceChange,
  onTransparencyChange,
  onBackgroundColorChange,
  onResetBackgroundColor,
}: SurfaceControlsProps) {
  const choices = allowInherit
    ? [{ value: "inherit" as const, label: "Layout" }, ...surfaceChoices]
    : surfaceChoices;

  return (
    <details className="relative shrink-0">
      <summary
        className="flex cursor-pointer list-none items-center gap-1 rounded-sm border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-200 hover:bg-zinc-800 [&::-webkit-details-marker]:hidden"
        aria-label={`${title} settings, ${appearanceLabel(appearance)}`}
      >
        <SlidersHorizontal size={12} />
        {title}: {appearanceLabel(appearance)}
        <ChevronDown size={12} />
      </summary>
      <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-md border border-zinc-700 bg-zinc-900 p-3 text-zinc-200 shadow-xl">
        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-1.5 text-[10px] font-medium text-zinc-400">
              Surface style
            </p>
            <div
              className="flex gap-1"
              role="group"
              aria-label={`${title} style`}
            >
              {choices.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  aria-pressed={appearance === choice.value}
                  onClick={() => onAppearanceChange(choice.value)}
                  className={`flex-1 rounded-sm border px-2 py-1 text-[10px] transition-colors ${
                    appearance === choice.value
                      ? "border-sky-500 bg-sky-950 text-sky-100"
                      : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1">
            <span className="flex items-center justify-between text-[10px] text-zinc-300">
              Transparency
              <output className="font-medium text-zinc-100">
                {transparency}%
              </output>
            </span>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={transparency}
              onChange={(event) =>
                onTransparencyChange(Number(event.target.value))
              }
              className="w-full accent-sky-500"
              aria-label={`${title} transparency`}
            />
            <span className="text-[9px] text-zinc-500">
              1% is nearly opaque; 100% removes the surface tint.
            </span>
          </label>

          {backgroundColor && onBackgroundColorChange && (
            <div className="flex items-center justify-between border-t border-zinc-800 pt-2">
              <label className="flex items-center gap-2 text-[10px] text-zinc-300">
                Tint color
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(event) =>
                    onBackgroundColorChange(event.target.value)
                  }
                  className="h-6 w-8 cursor-pointer rounded-sm border border-zinc-700 bg-zinc-950 p-0.5"
                  aria-label={`${title} tint color`}
                />
              </label>
              {onResetBackgroundColor && (
                <button
                  type="button"
                  onClick={onResetBackgroundColor}
                  className="text-[10px] text-zinc-400 hover:text-zinc-100"
                >
                  Reset tint
                </button>
              )}
            </div>
          )}
          <p className="border-t border-zinc-800 pt-2 text-[9px] text-zinc-500">
            Preview updates now. Click Save to apply it to the keyboard.
          </p>
        </div>
      </div>
    </details>
  );
}
