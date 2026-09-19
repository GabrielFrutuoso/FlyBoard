import { DndContext, DragOverlay } from "@dnd-kit/core";
import {
  parseMacroKey,
  unitsFor,
  type BoardLayout,
  type KeySize,
  type Macro,
} from "../../../utils/boardConfig";
import { Key } from "../../Key";
import { KeyboardGrid } from "../../KeyboardGrid";
import { KeySlot, RowSlot, useLayoutDragAndDrop } from "./dnd";
import type { SelectedKey } from "./types";

interface LayoutPreviewGridProps {
  layout: BoardLayout;
  editable: boolean;
  sizeFor: (rowIndex: number, keyIndex: number) => KeySize;
  labelFor: (key: string) => string;
  macrosById: Map<string, Macro>;
  selectedKey: SelectedKey | null;
  onSelectRow: (rowIndex: number) => void;
  onSelectKey: (selection: SelectedKey, size: KeySize) => void;
  onInsertKey: (key: string, rowIndex: number, insertIndex: number) => void;
  onMoveRow: (fromIndex: number, insertBeforeIndex: number) => void;
}

/** Renders the editable keyboard preview, wrapped in its own dnd-kit context. */
export function LayoutPreviewGrid({
  layout,
  editable,
  sizeFor,
  labelFor,
  macrosById,
  selectedKey,
  onSelectRow,
  onSelectKey,
  onInsertKey,
  onMoveRow,
}: LayoutPreviewGridProps) {
  const {
    dropTarget,
    rowDropTarget,
    draggingRowIndex,
    activeDragLabel,
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  } = useLayoutDragAndDrop({
    rows: layout.rows,
    labelFor,
    onInsertKey,
    onMoveRow,
  });

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex min-h-32 flex-1 rounded-sm border border-zinc-800 bg-zinc-950">
        <KeyboardGrid
          rows={layout.rows}
          unitFor={(key) => unitsFor(key, layout.base)}
          keySizeFor={sizeFor}
          className="flex min-h-0 w-full flex-1 flex-col gap-0.5 p-0.5 text-[clamp(0.625rem,2.2vh,1rem)]"
          getRowProps={(rowIndex) => ({
            onClick: () => onSelectRow(rowIndex),
          })}
          renderRow={(rowIndex, _row, content) =>
            editable ? (
              <RowSlot
                key={rowIndex}
                rowIndex={rowIndex}
                isLastRow={rowIndex === layout.rows.length - 1}
                editable={editable}
                rowDropTarget={rowDropTarget}
                draggingRowIndex={draggingRowIndex}
              >
                {content}
              </RowSlot>
            ) : (
              content
            )
          }
          renderKey={(key, rowIndex, keyIndex, span, keySize) => {
            const macroId = parseMacroKey(key);
            const rowLength = layout.rows[rowIndex]?.length ?? 0;
            const keyElement = (
              <Key
                key={`${key}-${rowIndex}-${keyIndex}`}
                label={labelFor(key)}
                macroIcon={
                  macroId === null ? undefined : macrosById.get(macroId)?.icon
                }
                macroName={
                  macroId === null ? undefined : macrosById.get(macroId)?.name
                }
                size={keySize}
                span={span}
                onClick={() => {
                  if (editable) onSelectKey({ rowIndex, keyIndex }, keySize);
                }}
                isActive={
                  editable &&
                  selectedKey?.rowIndex === rowIndex &&
                  selectedKey.keyIndex === keyIndex
                }
              />
            );
            if (!editable) {
              return keyElement;
            }
            return (
              <KeySlot
                key={`${key}-${rowIndex}-${keyIndex}`}
                rowIndex={rowIndex}
                keyIndex={keyIndex}
                span={span}
                isRowEnd={keyIndex === rowLength - 1}
                dropTarget={dropTarget}
              >
                {keyElement}
              </KeySlot>
            );
          }}
        />
      </div>
      <DragOverlay>
        {activeDragLabel && (
          <div className="cursor-grabbing rounded-sm border border-sky-600 bg-sky-950 px-2 py-1 text-xs text-sky-100 shadow-lg">
            {activeDragLabel}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
