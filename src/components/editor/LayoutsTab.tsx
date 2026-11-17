import { DndContext, DragOverlay } from "@dnd-kit/core";
import { useEffect, useState } from "react";
import {
  DEFAULT_KEY_LABEL_SIZE,
  DEFAULT_KEY_RADIUS,
  layoutAppearance,
  normalizeKeyGap,
  surfaceTransparency,
  type BoardsFile,
} from "../../utils/boardConfig";
import { KeySizeToolbar } from "./layouts/KeySizeToolbar";
import { LayoutHeaderBar } from "./layouts/LayoutHeaderBar";
import { LayoutPreviewGrid } from "./layouts/LayoutPreviewGrid";
import { LayoutSidebar } from "./layouts/LayoutSidebar";
import { PaletteFooter } from "./layouts/PaletteFooter";
import { RowControls } from "./layouts/RowControls";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";
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
    setAppearance,
    setBackgroundColor,
    setTransparency,
    setKeyGap,
    setKeyRadius,
    setKeyLabelSize,
    clearKeySelection,
    selectAllKeys,
    insertKeyAt,
    pickPaletteKey,
    removeSelectedKey,
    duplicateSelectedKeys,
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
    moveKey,
    createLayout,
    duplicateLayout,
    deleteLayout,
  } = useLayoutEditor(boards, onChange);

  const dragAndDrop = useLayoutDragAndDrop({
    rows: selected.rows,
    labelFor,
    onInsertKey: insertKeyAt,
    onMoveKey: moveKey,
    onMoveRow: moveRow,
  });

  const selectedKeyLabel =
    selectedKey &&
    selected.rows[selectedKey.rowIndex]?.[selectedKey.keyIndex] !== undefined
      ? labelFor(selected.rows[selectedKey.rowIndex][selectedKey.keyIndex])
      : null;
  const totalKeyCount = selected.rows.reduce(
    (total, row) => total + row.length,
    0,
  );
  const selectedKeyStyle = selectedKey
    ? styleFor(selectedKey.rowIndex, selectedKey.keyIndex)
    : {};
  const selectedKeyAppearance =
    selectedKeyStyle.appearance ?? layoutAppearance(selected);
  const selectedKeyTransparency = surfaceTransparency({
    appearance: selectedKeyAppearance,
    transparency: selectedKeyStyle.transparency ?? selected.transparency,
  });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleKeyContextMenu = (
    selection: { rowIndex: number; keyIndex: number },
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    const alreadySelected = selectedKeys.some(
      (item) =>
        item.rowIndex === selection.rowIndex &&
        item.keyIndex === selection.keyIndex,
    );
    if (!alreadySelected) {
      selectKey(
        selection,
        sizeFor(selection.rowIndex, selection.keyIndex),
        false,
      );
    }
    setContextMenu({ x: event.clientX, y: event.clientY });
  };

  useEffect(() => {
    const handleShortcuts = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")
      ) {
        return;
      }

      if (event.key === "Escape") {
        setContextMenu(null);
        clearKeySelection();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
        event.preventDefault();
        selectAllKeys();
        return;
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "d" &&
        selectedKeys.length > 0
      ) {
        event.preventDefault();
        duplicateSelectedKeys();
        setContextMenu(null);
        return;
      }

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedKeys.length > 0
      ) {
        event.preventDefault();
        removeSelectedKey();
        setContextMenu(null);
      }
    };

    document.addEventListener("keydown", handleShortcuts);
    return () => document.removeEventListener("keydown", handleShortcuts);
  }, [
    clearKeySelection,
    duplicateSelectedKeys,
    removeSelectedKey,
    selectAllKeys,
    selectedKeys.length,
  ]);

  return (
    <DndContext
      sensors={dragAndDrop.sensors}
      onDragStart={dragAndDrop.handleDragStart}
      onDragMove={dragAndDrop.handleDragMove}
      onDragEnd={dragAndDrop.handleDragEnd}
      onDragCancel={dragAndDrop.handleDragCancel}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1">
          <ResizablePanel defaultSize="70%" minSize="240px">
            <ResizablePanelGroup orientation="horizontal" className="min-h-0">
              <ResizablePanel
                id="layout-list-panel"
                defaultSize="18%"
                minSize="150px"
                maxSize="30%"
              >
                <aside className="flex h-full min-h-0 min-w-0 flex-col">
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
                </aside>
              </ResizablePanel>
              <ResizableHandle
                withHandle
                className="bg-zinc-800 hover:bg-sky-600"
                aria-label="Resize layout list"
              />
              <ResizablePanel
                id="keyboard-canvas-panel"
                defaultSize="60%"
                minSize="300px"
              >
                <section className="flex h-full min-h-0 min-w-0 flex-col">
                  <LayoutHeaderBar
                    layout={selected}
                    editable={editable}
                    onRename={renameLayout}
                    onAppearanceChange={setAppearance}
                    onBackgroundColorChange={setBackgroundColor}
                    onTransparencyChange={setTransparency}
                    onDuplicate={duplicateLayout}
                    onDelete={deleteLayout}
                  />

                  <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto bg-zinc-950 p-3">
                    <div
                      className="keyboard-preview-stage"
                      data-appearance={layoutAppearance(selected)}
                    >
                      <div
                        className="keyboard-preview-backdrop"
                        aria-hidden="true"
                      />
                      <LayoutPreviewGrid
                        layout={selected}
                        editable={editable}
                        sizeFor={sizeFor}
                        labelFor={labelFor}
                        macrosById={macrosById}
                        selectedKeys={selectedKeys}
                        onSelectRow={setSelectedRow}
                        onSelectKey={selectKey}
                        onKeyContextMenu={handleKeyContextMenu}
                        styleFor={styleFor}
                        dropTarget={dragAndDrop.dropTarget}
                        rowDropTarget={dragAndDrop.rowDropTarget}
                        draggingRowIndex={dragAndDrop.draggingRowIndex}
                      />
                    </div>
                    {editable && (
                      <RowControls
                        hasRows={selected.rows.length > 0}
                        selectedRow={selectedRow}
                        onAddRow={addRow}
                        onRemoveRow={removeRow}
                      />
                    )}
                  </div>
                </section>
              </ResizablePanel>
              <ResizableHandle
                withHandle
                className="bg-zinc-800 hover:bg-sky-600"
                aria-label="Resize key properties"
              />
              <ResizablePanel
                id="key-properties-panel"
                defaultSize="22%"
                minSize="160px"
                maxSize="34%"
              >
                <aside className="flex h-full min-h-0 min-w-0 flex-col bg-zinc-950">
                  <h2 className="shrink-0 border-b border-zinc-800 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                    Key properties
                  </h2>
                  {editable ? (
                    <KeySizeToolbar
                      label={selectedKeyLabel}
                      selectedCount={selectedKeys.length}
                      totalKeyCount={totalKeyCount}
                      appearance={selectedKeyStyle.appearance ?? "inherit"}
                      transparency={selectedKeyTransparency}
                      widthDraft={widthDraft}
                      heightDraft={heightDraft}
                      labelColor={selectedKeyStyle.labelColor ?? ""}
                      borderColor={selectedKeyStyle.borderColor ?? ""}
                      borderTransparency={
                        selectedKeyStyle.borderTransparency ?? 0
                      }
                      keyGap={normalizeKeyGap(selected.keyGap)}
                      keyRadius={selected.keyRadius ?? DEFAULT_KEY_RADIUS}
                      keyLabelSize={
                        selected.keyLabelSize ?? DEFAULT_KEY_LABEL_SIZE
                      }
                      backgroundColor={selectedKeyStyle.backgroundColor ?? ""}
                      onAppearanceChange={(value) =>
                        value === "inherit"
                          ? updateSelectedKeyStyle({
                              appearance: undefined,
                              transparency: undefined,
                              backgroundColor: undefined,
                            })
                          : updateSelectedKeyStyle({ appearance: value })
                      }
                      onTransparencyChange={(value) =>
                        updateSelectedKeyStyle({ transparency: value })
                      }
                      onResetBackgroundColor={() =>
                        updateSelectedKeyStyle({ backgroundColor: undefined })
                      }
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
                      onBorderTransparencyChange={(value) =>
                        updateSelectedKeyStyle({ borderTransparency: value })
                      }
                      onKeyGapChange={setKeyGap}
                      onKeyRadiusChange={setKeyRadius}
                      onKeyLabelSizeChange={setKeyLabelSize}
                      onBackgroundColorChange={(value) =>
                        updateSelectedKeyStyle({ backgroundColor: value })
                      }
                      onReset={resetSelectedKeySize}
                      onResetStyle={resetSelectedKeyStyle}
                      onRemove={removeSelectedKey}
                      onSelectAll={selectAllKeys}
                    />
                  ) : (
                    <p className="p-3 text-[10px] leading-relaxed text-zinc-500">
                      Built-in layouts are read-only. Duplicate one to customize
                      its keys.
                    </p>
                  )}
                </aside>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle
            withHandle
            className="bg-zinc-800 hover:bg-sky-600"
            aria-label="Resize key library"
          />
          <ResizablePanel
            id="key-library-panel"
            defaultSize="30%"
            minSize="120px"
          >
            {editable ? (
              <PaletteFooter
                macros={boards.macros}
                paletteMode={paletteMode}
                hasSelectedKey={selectedKeys.length > 0}
                onModeChange={setPaletteMode}
                onPick={pickPaletteKey}
              />
            ) : (
              <p className="h-full px-3 py-2 text-[10px] text-zinc-500">
                Duplicate this built-in layout to add or edit keys.
              </p>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      {contextMenu && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setContextMenu(null)}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div
            role="menu"
            className="absolute min-w-40 rounded-md border border-zinc-700 bg-zinc-900 p-1 shadow-xl"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 176),
              top: Math.min(contextMenu.y, window.innerHeight - 88),
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              className="block w-full rounded-sm px-2 py-1.5 text-left text-xs text-zinc-200 hover:bg-zinc-800"
              onClick={() => {
                duplicateSelectedKeys();
                setContextMenu(null);
              }}
            >
              Duplicate selected <span className="text-zinc-500">Ctrl+D</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full rounded-sm px-2 py-1.5 text-left text-xs text-red-300 hover:bg-zinc-800"
              onClick={() => {
                removeSelectedKey();
                setContextMenu(null);
              }}
            >
              Delete selected <span className="text-zinc-500">Del</span>
            </button>
          </div>
        </div>
      )}
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
