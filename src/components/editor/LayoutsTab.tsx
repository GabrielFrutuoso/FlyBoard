import { DndContext, DragOverlay } from "@dnd-kit/core";
import type { BoardsFile } from "../../utils/boardConfig";
import { KeySizeToolbar } from "./layouts/KeySizeToolbar";
import { LayoutHeaderBar } from "./layouts/LayoutHeaderBar";
import { LayoutPreviewGrid } from "./layouts/LayoutPreviewGrid";
import { LayoutSidebar } from "./layouts/LayoutSidebar";
import { PaletteFooter } from "./layouts/PaletteFooter";
import { RowControls } from "./layouts/RowControls";
import { useLayoutEditor } from "./layouts/useLayoutEditor";
import { useLayoutDragAndDrop } from "./layouts/dnd";

interface LayoutsTabProps {
  boards: BoardsFile;
  onChange: (boards: BoardsFile) => void;
}

const LayoutsTab = ({ boards, onChange }: LayoutsTabProps) => {
  const {
    layouts,
    selected,
    editable,
    macrosById,
    labelFor,
    sizeFor,
    styleFor,
    selectedRow,
    setSelectedRow,
    selectedKey,
    selectedKeys,
    widthDraft,
    heightDraft,
    paletteMode,
    setPaletteMode,
    newName,
    setNewName,
    template,
    setTemplate,
    selectLayout,
    selectKey,
    renameLayout,
    setBackgroundColor,
    insertKeyAt,
    pickPaletteKey,
    removeSelectedKey,
    resetSelectedKeySize,
    resetSelectedKeyStyle,
    updateSelectedKeyStyle,
    onWidthDraftChange,
    onHeightDraftChange,
    commitWidth,
    commitHeight,
    addRow,
    removeRow,
    moveRow,
    createLayout,
    duplicateLayout,
    deleteLayout,
  } = useLayoutEditor(boards, onChange);

  const dragAndDrop = useLayoutDragAndDrop({
    rows: selected.rows,
    labelFor,
    onInsertKey: insertKeyAt,
    onMoveRow: moveRow,
  });

  const selectedKeyLabel =
    selectedKey &&
    selected.rows[selectedKey.rowIndex]?.[selectedKey.keyIndex] !== undefined
      ? labelFor(selected.rows[selectedKey.rowIndex][selectedKey.keyIndex])
      : null;
  const selectedKeyStyle = selectedKey
    ? styleFor(selectedKey.rowIndex, selectedKey.keyIndex)
    : {};

  return (
    <DndContext
      sensors={dragAndDrop.sensors}
      onDragStart={dragAndDrop.handleDragStart}
      onDragMove={dragAndDrop.handleDragMove}
      onDragEnd={dragAndDrop.handleDragEnd}
      onDragCancel={dragAndDrop.handleDragCancel}
    >
      <div className="flex min-h-0 flex-1">
        <LayoutSidebar
          layouts={layouts}
          selectedId={selected.id}
          onSelect={selectLayout}
          newName={newName}
          onNewNameChange={setNewName}
          template={template}
          onTemplateChange={setTemplate}
          onCreate={createLayout}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <LayoutHeaderBar
            layout={selected}
            editable={editable}
            onRename={renameLayout}
            onBackgroundColorChange={setBackgroundColor}
            onDuplicate={duplicateLayout}
            onDelete={deleteLayout}
          />

          {editable && (
            <KeySizeToolbar
              label={selectedKeyLabel}
              selectedCount={selectedKeys.length}
              widthDraft={widthDraft}
              heightDraft={heightDraft}
              labelColor={selectedKeyStyle.labelColor ?? ""}
              borderColor={selectedKeyStyle.borderColor ?? ""}
              backgroundColor={selectedKeyStyle.backgroundColor ?? ""}
              onWidthChange={onWidthDraftChange}
              onWidthCommit={commitWidth}
              onHeightChange={onHeightDraftChange}
              onHeightCommit={commitHeight}
              onLabelColorChange={(value) =>
                updateSelectedKeyStyle({ labelColor: value })
              }
              onBorderColorChange={(value) =>
                updateSelectedKeyStyle({ borderColor: value })
              }
              onBackgroundColorChange={(value) =>
                updateSelectedKeyStyle({ backgroundColor: value })
              }
              onReset={resetSelectedKeySize}
              onResetStyle={resetSelectedKeyStyle}
              onRemove={removeSelectedKey}
            />
          )}

          <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-zinc-950 p-3">
            <LayoutPreviewGrid
              layout={selected}
              editable={editable}
              sizeFor={sizeFor}
              labelFor={labelFor}
              macrosById={macrosById}
              selectedKeys={selectedKeys}
              onSelectRow={setSelectedRow}
              onSelectKey={selectKey}
              styleFor={styleFor}
              dropTarget={dragAndDrop.dropTarget}
              rowDropTarget={dragAndDrop.rowDropTarget}
              draggingRowIndex={dragAndDrop.draggingRowIndex}
            />
            {editable && (
              <RowControls
                hasRows={selected.rows.length > 0}
                selectedRow={selectedRow}
                onAddRow={addRow}
                onRemoveRow={removeRow}
              />
            )}
          </div>

          {editable && (
            <PaletteFooter
              macros={boards.macros}
              paletteMode={paletteMode}
              hasSelectedKey={selectedKey !== null}
              onModeChange={setPaletteMode}
              onPick={pickPaletteKey}
            />
          )}
        </div>
      </div>
      <DragOverlay>
        {dragAndDrop.activeDragLabel && (
          <div className="cursor-grabbing rounded-sm border border-sky-600 bg-sky-950 px-2 py-1 text-xs text-sky-100 shadow-lg">
            {dragAndDrop.activeDragLabel}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default LayoutsTab;
