import type { BoardsFile } from "../../utils/boardConfig";
import { KeySizeToolbar } from "./layouts/KeySizeToolbar";
import { LayoutHeaderBar } from "./layouts/LayoutHeaderBar";
import { LayoutPreviewGrid } from "./layouts/LayoutPreviewGrid";
import { LayoutSidebar } from "./layouts/LayoutSidebar";
import { PaletteFooter } from "./layouts/PaletteFooter";
import { RowControls } from "./layouts/RowControls";
import { useLayoutEditor } from "./layouts/useLayoutEditor";

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
    selectedRow,
    setSelectedRow,
    selectedKey,
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
    insertKeyAt,
    pickPaletteKey,
    removeSelectedKey,
    resetSelectedKeySize,
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

  const selectedKeyLabel =
    selectedKey &&
    selected.rows[selectedKey.rowIndex]?.[selectedKey.keyIndex] !== undefined
      ? labelFor(selected.rows[selectedKey.rowIndex][selectedKey.keyIndex])
      : null;

  return (
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
          onDuplicate={duplicateLayout}
          onDelete={deleteLayout}
        />

        {editable && (
          <KeySizeToolbar
            label={selectedKeyLabel}
            widthDraft={widthDraft}
            heightDraft={heightDraft}
            onWidthChange={onWidthDraftChange}
            onWidthCommit={commitWidth}
            onHeightChange={onHeightDraftChange}
            onHeightCommit={commitHeight}
            onReset={resetSelectedKeySize}
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
            selectedKey={selectedKey}
            onSelectRow={setSelectedRow}
            onSelectKey={selectKey}
            onInsertKey={insertKeyAt}
            onMoveRow={moveRow}
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
  );
};

export default LayoutsTab;
