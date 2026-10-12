import {
  parseMacroKey,
  unitsFor,
  type BoardLayout,
  type KeySize,
  type KeyStyle,
  type Macro,
} from "../../../utils/boardConfig";
import { Key } from "../../Key";
import { KeyboardGrid } from "../../KeyboardGrid";
import { KeySlot, RowSlot } from "./dnd";
import type { DropTarget, SelectedKey, SelectedKeys } from "./types";

interface LayoutPreviewGridProps {
  layout: BoardLayout;
  editable: boolean;
  sizeFor: (rowIndex: number, keyIndex: number) => KeySize;
  styleFor: (rowIndex: number, keyIndex: number) => KeyStyle;
  labelFor: (key: string) => string;
  macrosById: Map<string, Macro>;
  selectedKeys: SelectedKeys;
  onSelectRow: (rowIndex: number) => void;
  onSelectKey: (
    selection: SelectedKey,
    size: KeySize,
    additive: boolean,
  ) => void;
  dropTarget: DropTarget | null;
  rowDropTarget: number | null;
  draggingRowIndex: number | null;
}

/** Renders the editable keyboard preview, wrapped in its own dnd-kit context. */
export function LayoutPreviewGrid({
  layout,
  editable,
  sizeFor,
  styleFor,
  labelFor,
  macrosById,
  selectedKeys,
  onSelectRow,
  onSelectKey,
  dropTarget,
  rowDropTarget,
  draggingRowIndex,
}: LayoutPreviewGridProps) {
  return (
    <div
      className="flex min-h-32 flex-1 rounded-sm border border-zinc-800 bg-zinc-950"
      style={
        layout.backgroundColor
          ? { backgroundColor: layout.backgroundColor }
          : undefined
      }
    >
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
          const keyStyle = styleFor(rowIndex, keyIndex);
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
              labelColor={keyStyle.labelColor}
              borderColor={keyStyle.borderColor}
              backgroundColor={keyStyle.backgroundColor}
              onClick={(event) => {
                if (editable) {
                  onSelectKey(
                    { rowIndex, keyIndex },
                    keySize,
                    event.ctrlKey || event.metaKey,
                  );
                }
              }}
              isActive={
                editable &&
                selectedKeys.some(
                  (selection) =>
                    selection.rowIndex === rowIndex &&
                    selection.keyIndex === keyIndex,
                )
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
  );
}
