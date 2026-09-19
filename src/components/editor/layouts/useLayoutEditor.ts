import { useEffect, useState } from "react";
import {
  allLayouts,
  BUILTIN_LAYOUTS,
  DEFAULT_KEY_SIZE,
  newId,
  parseMacroKey,
  type BoardLayout,
  type BoardsFile,
  type KeySize,
} from "../../../utils/boardConfig";
import type { PaletteMode, SelectedKey } from "./types";

export function useLayoutEditor(
  boards: BoardsFile,
  onChange: (boards: BoardsFile) => void,
) {
  const layouts = allLayouts(boards);
  const [selectedId, setSelectedId] = useState("pt-br");
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedKey, setSelectedKey] = useState<SelectedKey | null>(null);
  const [widthDraft, setWidthDraft] = useState("1");
  const [heightDraft, setHeightDraft] = useState("1");
  const [paletteMode, setPaletteMode] = useState<PaletteMode>("add");
  const [newName, setNewName] = useState("");
  const [template, setTemplate] = useState("blank");

  const selected =
    layouts.find((layout) => layout.id === selectedId) ?? layouts[0];
  const editable = !selected.builtin;
  const macrosById = new Map(boards.macros.map((macro) => [macro.id, macro]));

  const labelFor = (key: string) => {
    const macroId = parseMacroKey(key);
    if (macroId !== null) return `⚡ ${macrosById.get(macroId)?.name ?? "?"}`;
    return key;
  };

  const sizeFor = (rowIndex: number, keyIndex: number): KeySize =>
    selected.keySizes?.[rowIndex]?.[keyIndex] ?? DEFAULT_KEY_SIZE;

  useEffect(() => {
    if (!selectedKey) return;
    const size = sizeFor(selectedKey.rowIndex, selectedKey.keyIndex);
    setWidthDraft(String(size.width));
    setHeightDraft(String(size.height));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedKey]);

  const updateCustom = (fn: (layout: BoardLayout) => BoardLayout) => {
    if (!editable) return;
    onChange({
      ...boards,
      layouts: boards.layouts.map((layout) =>
        layout.id === selected.id ? fn(layout) : layout,
      ),
    });
  };

  const updateKeySize = (
    rowIndex: number,
    keyIndex: number,
    fn: (size: KeySize) => KeySize,
  ) => {
    updateCustom((layout) => {
      const keySizes = layout.rows.map((row, currentRow) =>
        row.map(
          (_, currentKey) =>
            layout.keySizes?.[currentRow]?.[currentKey] ?? null,
        ),
      );
      keySizes[rowIndex][keyIndex] = fn(
        keySizes[rowIndex][keyIndex] ?? DEFAULT_KEY_SIZE,
      );
      return { ...layout, keySizes };
    });
  };

  const insertKeyAt = (key: string, rowIndex: number, insertIndex: number) => {
    updateCustom((layout) => {
      const rows = layout.rows.length
        ? layout.rows.map((row) => [...row])
        : [[]];
      const target = Math.min(Math.max(rowIndex, 0), rows.length - 1);
      const at = Math.min(Math.max(insertIndex, 0), rows[target].length);
      const keySizes = rows.map((_, currentRow) => [
        ...(layout.keySizes?.[currentRow] ?? []),
      ]);
      rows[target] = [
        ...rows[target].slice(0, at),
        key,
        ...rows[target].slice(at),
      ];
      keySizes[target] = [
        ...keySizes[target].slice(0, at),
        null,
        ...keySizes[target].slice(at),
      ];
      return { ...layout, rows, keySizes };
    });
    setSelectedRow(rowIndex);
  };

  const appendKey = (key: string, rowIndex: number) => {
    const row = selected.rows[rowIndex] ?? [];
    insertKeyAt(key, rowIndex, row.length);
  };

  const replaceSelectedKey = (key: string) => {
    if (!selectedKey) return;
    updateCustom((layout) => ({
      ...layout,
      rows: layout.rows.map((row, rowIndex) =>
        rowIndex === selectedKey.rowIndex
          ? row.map((currentKey, keyIndex) =>
              keyIndex === selectedKey.keyIndex ? key : currentKey,
            )
          : row,
      ),
    }));
    setPaletteMode("add");
  };

  const pickPaletteKey = (key: string) => {
    if (paletteMode === "replace" && selectedKey) {
      replaceSelectedKey(key);
      return;
    }
    appendKey(key, selectedRow);
  };

  const removeSelectedKey = () => {
    if (!selectedKey) return;
    const { rowIndex, keyIndex } = selectedKey;
    updateCustom((layout) => ({
      ...layout,
      rows: layout.rows.map((row, i) =>
        i === rowIndex ? row.filter((_, j) => j !== keyIndex) : row,
      ),
      keySizes: layout.rows.map((_, i) =>
        i === rowIndex
          ? (layout.keySizes?.[i] ?? []).filter((_, j) => j !== keyIndex)
          : [...(layout.keySizes?.[i] ?? [])],
      ),
    }));
    setSelectedKey(null);
    setPaletteMode("add");
  };

  const resetSelectedKeySize = () => {
    if (!selectedKey) return;
    updateKeySize(
      selectedKey.rowIndex,
      selectedKey.keyIndex,
      () => DEFAULT_KEY_SIZE,
    );
  };

  const commitWidth = (value: string) => {
    const parsed = Number(value);
    const normalized =
      Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_KEY_SIZE.width;
    setWidthDraft(String(normalized));
    if (selectedKey) {
      updateKeySize(selectedKey.rowIndex, selectedKey.keyIndex, (size) => ({
        ...size,
        width: normalized,
      }));
    }
  };

  const commitHeight = (value: string) => {
    const parsed = Number(value);
    const normalized =
      Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_KEY_SIZE.height;
    setHeightDraft(String(normalized));
    if (selectedKey) {
      updateKeySize(selectedKey.rowIndex, selectedKey.keyIndex, (size) => ({
        ...size,
        height: normalized,
      }));
    }
  };

  const onWidthDraftChange = (value: string) => {
    setWidthDraft(value);
    const parsed = Number(value);
    if (selectedKey && Number.isFinite(parsed) && parsed > 0) {
      updateKeySize(selectedKey.rowIndex, selectedKey.keyIndex, (size) => ({
        ...size,
        width: parsed,
      }));
    }
  };

  const onHeightDraftChange = (value: string) => {
    setHeightDraft(value);
    const parsed = Number(value);
    if (selectedKey && Number.isFinite(parsed) && parsed > 0) {
      updateKeySize(selectedKey.rowIndex, selectedKey.keyIndex, (size) => ({
        ...size,
        height: parsed,
      }));
    }
  };

  const selectLayout = (id: string) => {
    setSelectedId(id);
    setSelectedRow(0);
    setSelectedKey(null);
    setPaletteMode("add");
  };

  const selectKey = (selection: SelectedKey, size: KeySize) => {
    if (!editable) return;
    setSelectedKey(selection);
    setWidthDraft(String(size.width));
    setHeightDraft(String(size.height));
  };

  const renameLayout = (name: string) =>
    updateCustom((layout) => ({ ...layout, name }));

  const addRow = () =>
    updateCustom((layout) => ({
      ...layout,
      rows: [...layout.rows, []],
      keySizes: [
        ...(layout.keySizes ?? layout.rows.map((row) => row.map(() => null))),
        [],
      ],
    }));

  const removeRow = (rowIndex: number) => {
    updateCustom((layout) => ({
      ...layout,
      rows: layout.rows.filter((_, i) => i !== rowIndex),
      keySizes: (layout.keySizes ?? []).filter((_, i) => i !== rowIndex),
    }));
    setSelectedRow((prev) =>
      Math.max(0, Math.min(prev, selected.rows.length - 2)),
    );
    setSelectedKey(null);
    setPaletteMode("add");
  };

  const moveRow = (fromIndex: number, insertBeforeIndex: number) => {
    updateCustom((layout) => {
      if (fromIndex < 0 || fromIndex >= layout.rows.length) return layout;
      const rows = layout.rows.map((row) => [...row]);
      const keySizes = layout.rows.map((_, i) => [
        ...(layout.keySizes?.[i] ?? []),
      ]);
      const [movedRow] = rows.splice(fromIndex, 1);
      const [movedSizes] = keySizes.splice(fromIndex, 1);
      const target = Math.min(
        Math.max(
          insertBeforeIndex > fromIndex
            ? insertBeforeIndex - 1
            : insertBeforeIndex,
          0,
        ),
        rows.length,
      );
      rows.splice(target, 0, movedRow);
      keySizes.splice(target, 0, movedSizes ?? []);
      return { ...layout, rows, keySizes };
    });
    setSelectedKey(null);
  };

  const createLayout = () => {
    const from =
      template === "blank"
        ? null
        : BUILTIN_LAYOUTS.find((layout) => layout.id === template);
    const layout: BoardLayout = {
      id: newId(),
      name: newName.trim() || "New layout",
      base: from?.base ?? "pt-br",
      rows: from ? from.rows.map((row) => [...row]) : [[]],
    };
    onChange({ ...boards, layouts: [...boards.layouts, layout] });
    selectLayout(layout.id);
    setNewName("");
  };

  const duplicateLayout = () => {
    const copy: BoardLayout = {
      id: newId(),
      name: `${selected.name} copy`,
      base: selected.base,
      rows: selected.rows.map((row) => [...row]),
      keySizes: selected.keySizes?.map((row) =>
        row.map((size) => (size ? { ...size } : null)),
      ),
    };
    onChange({ ...boards, layouts: [...boards.layouts, copy] });
    selectLayout(copy.id);
  };

  const deleteLayout = () => {
    onChange({
      ...boards,
      layouts: boards.layouts.filter((layout) => layout.id !== selected.id),
    });
    selectLayout("pt-br");
  };

  return {
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
  };
}
