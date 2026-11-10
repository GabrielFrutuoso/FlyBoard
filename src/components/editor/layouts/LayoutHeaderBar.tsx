import { Copy, Trash2 } from "lucide-react";
import type {
  BoardLayout,
  LayoutAppearance,
} from "../../../utils/boardConfig";
import { surfaceTransparency } from "../../../utils/boardConfig";
import { SurfaceControls } from "./SurfaceControls";

const smallIconButton =
  "cursor-pointer rounded-sm p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100";

interface LayoutHeaderBarProps {
  layout: BoardLayout;
  editable: boolean;
  onRename: (name: string) => void;
  onAppearanceChange: (appearance: LayoutAppearance) => void;
  onBackgroundColorChange: (color: string | undefined) => void;
  onTransparencyChange: (transparency: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/** Layout name (editable for custom layouts) plus duplicate/delete actions. */
export function LayoutHeaderBar({
  layout,
  editable,
  onRename,
  onAppearanceChange,
  onBackgroundColorChange,
  onTransparencyChange,
  onDuplicate,
  onDelete,
}: LayoutHeaderBarProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-zinc-800 p-2">
      {editable ? (
        <input
          value={layout.name}
          onChange={(event) => onRename(event.target.value)}
          className="w-40 rounded-sm border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-sky-600"
          aria-label="Layout name"
        />
      ) : (
        <span className="text-xs font-semibold text-zinc-200">
          {layout.name}
        </span>
      )}
      {layout.builtin && (
        <span className="rounded-sm bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
          Built-in (read-only)
        </span>
      )}
      {editable && (
        <SurfaceControls
          title="Layout surface"
          appearance={layout.appearance ?? "solid"}
          transparency={surfaceTransparency(layout)}
          backgroundColor={layout.backgroundColor ?? "#09090b"}
          onAppearanceChange={(value) => {
            if (value !== "inherit") onAppearanceChange(value);
          }}
          onTransparencyChange={onTransparencyChange}
          onBackgroundColorChange={onBackgroundColorChange}
          onResetBackgroundColor={() => onBackgroundColorChange(undefined)}
        />
      )}
      <button
        type="button"
        onClick={onDuplicate}
        className={smallIconButton}
        title="Duplicate as new custom layout"
      >
        <Copy size={12} />
      </button>
      {editable && (
        <button
          type="button"
          onClick={onDelete}
          className={`${smallIconButton} hover:bg-red-900 hover:text-red-100`}
          title="Delete layout"
        >
          <Trash2 size={12} />
        </button>
      )}
      <span className="ml-auto text-[10px] text-zinc-500">
        Drag to reorder · Ctrl/⌘-click to multi-select
      </span>
    </div>
  );
}
