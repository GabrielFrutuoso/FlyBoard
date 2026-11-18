import { Copy, Info, Trash2 } from "lucide-react";
import type {
  BoardLayout,
  LayoutAppearance,
} from "../../../utils/boardConfig";
import { surfaceTransparency } from "../../../utils/boardConfig";
import { SurfaceControls } from "./SurfaceControls";

const smallIconButton =
  "editor-icon-button cursor-pointer";

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
    <div className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b border-white/7 px-4 py-2.5">
      <div className="mr-1 min-w-0">
        {editable ? (
          <input
            value={layout.name}
            onChange={(event) => onRename(event.target.value)}
            className="editor-title-input"
            aria-label="Layout name"
          />
        ) : (
          <p className="text-sm font-semibold text-zinc-100">{layout.name}</p>
        )}
        <p className="mt-0.5 flex items-center gap-1 text-[9px] text-zinc-500">
          {layout.builtin ? (
            <>
              <Info size={10} /> Duplicate this template to edit it
            </>
          ) : (
            `${layout.rows.length} rows · changes appear in the preview`
          )}
        </p>
      </div>
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
        className={`${smallIconButton} hover:bg-white/8`}
        title="Duplicate as new custom layout"
      >
        <Copy size={12} />
      </button>
      {editable && (
        <button
          type="button"
          onClick={onDelete}
          className={`${smallIconButton} hover:bg-red-500/15 hover:text-red-300`}
          title="Delete layout"
        >
          <Trash2 size={12} />
        </button>
      )}
      <span className="ml-auto hidden rounded-full border border-white/7 bg-black/10 px-2.5 py-1 text-[9px] text-zinc-500 2xl:inline">
        Tip: drag keys to reorder · Ctrl/⌘-click to multi-select
      </span>
    </div>
  );
}
