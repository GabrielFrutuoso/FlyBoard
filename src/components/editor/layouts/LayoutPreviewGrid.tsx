import {
  parseMacroKey,
  DEFAULT_KEY_LABEL_SIZE,
  DEFAULT_KEY_RADIUS,
  layoutAppearance,
  normalizeKeyGap,
  layoutSurfaceStyle,
  unitsFor,
  type BoardLayout,
  type KeySize,
  type KeyStyle,
  type Macro,
} from "../../../utils/boardConfig";
import type { MouseEvent } from "react";
import { Key } from "../../Key";
import { KeyboardGrid } from "../../KeyboardGrid";
import { KeyDragHandle, KeySlot, RowSlot } from "./dnd";
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
  onKeyContextMenu: (
    selection: SelectedKey,
    event: MouseEvent<HTMLButtonElement>,
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
  onKeyContextMenu,
  dropTarget,
  rowDropTarget,
  draggingRowIndex,
}: LayoutPreviewGridProps) {
  const maxColumns = Math.max(
    ...layout.rows.map((row, rowIndex) =>
      row.reduce(
        (total, key, keyIndex) =>
          total +
          Math.max(
            1,
            Math.round(
              unitsFor(key, layout.base) *
                4 *
                sizeFor(rowIndex, keyIndex).width,
            ),
          ),
        0,
      ),
    ),
    1,
  );
  const totalRowHeight = layout.rows.reduce(
    (total, row, rowIndex) =>
      total +
      Math.max(
        1,
        ...row.map((_, keyIndex) => sizeFor(rowIndex, keyIndex).height),
      ),
    0,
  );
  const hasKeys = layout.rows.some((row) => row.length > 0);

  return (
    <div
      className={`keyboard-surface flex min-w-0 rounded-sm border border-zinc-800 ${
        hasKeys ? "w-full max-w-full shrink-0" : "min-h-32 flex-1"
      }`}
      data-appearance={layoutAppearance(layout)}
      style={{
        ...layoutSurfaceStyle(layout),
        ...(hasKeys
          ? {
              aspectRatio: `${maxColumns} / ${Math.max(1, totalRowHeight * 4)}`,
              maxHeight: "100%",
            }
          : {}),
      }}
    >
      <KeyboardGrid
        rows={layout.rows}
        unitFor={(key) => unitsFor(key, layout.base)}
        keySizeFor={sizeFor}
        keyGap={normalizeKeyGap(layout.keyGap)}
        preserveProportions
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
        renderKey={(key, rowIndex, keyIndex, span, keySize, keyGap) => {
          const macroId = parseMacroKey(key);
          const rowLength = layout.rows[rowIndex]?.length ?? 0;
          const keyStyle = styleFor(rowIndex, keyIndex);
          const isSelected = selectedKeys.some(
            (selection) =>
              selection.rowIndex === rowIndex &&
              selection.keyIndex === keyIndex,
          );
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
              borderTransparency={keyStyle.borderTransparency}
              backgroundColor={keyStyle.backgroundColor}
              keyRadius={layout.keyRadius ?? DEFAULT_KEY_RADIUS}
              keyGap={keyGap}
              keyLabelSize={layout.keyLabelSize ?? DEFAULT_KEY_LABEL_SIZE}
              appearance={keyStyle.appearance ?? layoutAppearance(layout)}
              transparency={keyStyle.transparency ?? layout.transparency}
              className={
                editable && isSelected
                  ? "ring-2 ring-sky-400 ring-offset-1 ring-offset-zinc-950"
                  : ""
              }
              onContextMenu={(event) =>
                editable && onKeyContextMenu({ rowIndex, keyIndex }, event)
              }
              onClick={(event) => {
                if (editable) {
                  onSelectKey(
                    { rowIndex, keyIndex },
                    keySize,
                    event.ctrlKey || event.metaKey,
                  );
                }
              }}
              isActive={editable && isSelected}
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
              <KeyDragHandle rowIndex={rowIndex} keyIndex={keyIndex}>
                {keyElement}
              </KeyDragHandle>
            </KeySlot>
          );
        }}
      />
    </div>
  );
}
