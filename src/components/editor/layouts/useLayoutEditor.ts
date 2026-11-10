import { useEffect, useState } from "react";
import {
  allLayouts,
  BUILTIN_LAYOUTS,
  DEFAULT_KEY_SIZE,
  newId,
  normalizeKeyGap,
  parseMacroKey,
  type LayoutAppearance,
  type BoardLayout,
  type BoardsFile,
  type KeySize,
  type KeyStyle,
} from "../../../utils/boardConfig";
import type { PaletteMode, SelectedKey, SelectedKeys } from "./types";

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
  const [selectedKeys, setSelectedKeys] = useState<SelectedKeys>([]);
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

  const styleFor = (rowIndex: number, keyIndex: number): KeyStyle =>
    selected.keyStyles?.[rowIndex]?.[keyIndex] ?? {};

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

  const updateSelectedKeySizes = (update: (size: KeySize) => KeySize) => {
    if (selectedKeys.length === 0) return;
    updateCustom((layout) => {
      const keySizes = layout.rows.map((row, currentRow) =>
        row.map(
          (_, currentKey) =>
            layout.keySizes?.[currentRow]?.[currentKey] ?? null,
        ),
      );
      selectedKeys.forEach(({ rowIndex, keyIndex }) => {
        keySizes[rowIndex][keyIndex] = update(
          keySizes[rowIndex][keyIndex] ?? DEFAULT_KEY_SIZE,
        );
      });
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
      const keyStyles = rows.map((_, currentRow) => [
        ...(layout.keyStyles?.[currentRow] ?? []),
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
      keyStyles[target] = [
        ...keyStyles[target].slice(0, at),
        null,
        ...keyStyles[target].slice(at),
      ];
      return { ...layout, rows, keySizes, keyStyles };
    });
    setSelectedRow(rowIndex);
  };

  const appendKey = (key: string, rowIndex: number) => {
    const row = selected.rows[rowIndex] ?? [];
    insertKeyAt(key, rowIndex, row.length);
  };

  const replaceSelectedKey = (key: string) => {
    const targets =
      selectedKeys.length > 0 ? selectedKeys : selectedKey ? [selectedKey] : [];
    if (targets.length === 0) return;
    const targetIds = new Set(
      targets.map(({ rowIndex, keyIndex }) => `${rowIndex}:${keyIndex}`),
    );
    updateCustom((layout) => ({
      ...layout,
      rows: layout.rows.map((row, rowIndex) =>
        row.map((currentKey, keyIndex) =>
          targetIds.has(`${rowIndex}:${keyIndex}`) ? key : currentKey,
        ),
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
    const targets =
      selectedKeys.length > 0 ? selectedKeys : selectedKey ? [selectedKey] : [];
    if (targets.length === 0) return;
    const targetIds = new Set(
      targets.map(({ rowIndex, keyIndex }) => `${rowIndex}:${keyIndex}`),
    );
    updateCustom((layout) => ({
      ...layout,
      rows: layout.rows.map((row, i) =>
        row.filter((_, j) => !targetIds.has(`${i}:${j}`)),
      ),
      keySizes: layout.rows.map((_, i) =>
        (layout.keySizes?.[i] ?? []).filter(
          (_, j) => !targetIds.has(`${i}:${j}`),
        ),
      ),
      keyStyles: layout.rows.map((_, i) =>
        (layout.keyStyles?.[i] ?? []).filter(
          (_, j) => !targetIds.has(`${i}:${j}`),
        ),
      ),
    }));
    setSelectedKey(null);
    setSelectedKeys([]);
    setPaletteMode("add");
  };

  const duplicateSelectedKeys = () => {
    const targets =
      selectedKeys.length > 0 ? selectedKeys : selectedKey ? [selectedKey] : [];
    if (targets.length === 0) return;

    const orderedTargets = [...targets].sort(
      (a, b) => b.rowIndex - a.rowIndex || b.keyIndex - a.keyIndex,
    );
    updateCustom((layout) => {
      const rows = layout.rows.map((row) => [...row]);
      const keySizes = rows.map((row, rowIndex) =>
        row.map(
          (_, keyIndex) => layout.keySizes?.[rowIndex]?.[keyIndex] ?? null,
        ),
      );
      const keyStyles = rows.map((row, rowIndex) =>
        row.map(
          (_, keyIndex) => layout.keyStyles?.[rowIndex]?.[keyIndex] ?? null,
        ),
      );

      orderedTargets.forEach(({ rowIndex, keyIndex }) => {
        const row = rows[rowIndex];
        if (!row || keyIndex < 0 || keyIndex >= row.length) return;
        const insertAt = keyIndex + 1;
        row.splice(insertAt, 0, row[keyIndex]);
        const size = keySizes[rowIndex][keyIndex];
        keySizes[rowIndex].splice(insertAt, 0, size ? { ...size } : null);
        const style = keyStyles[rowIndex][keyIndex];
        keyStyles[rowIndex].splice(insertAt, 0, style ? { ...style } : null);
      });

      return { ...layout, rows, keySizes, keyStyles };
    });

    const duplicates = [...targets]
      .sort((a, b) => a.rowIndex - b.rowIndex || a.keyIndex - b.keyIndex)
      .map((target, _, ordered) => ({
        rowIndex: target.rowIndex,
        keyIndex:
          target.keyIndex +
          1 +
          ordered.filter(
            (item) =>
              item.rowIndex === target.rowIndex &&
              item.keyIndex < target.keyIndex,
          ).length,
      }));
    setSelectedKeys(duplicates);
    setSelectedKey(duplicates[duplicates.length - 1] ?? null);
    if (duplicates.length > 0) {
      const selected = duplicates[duplicates.length - 1];
      setSelectedRow(selected.rowIndex);
      const source = [...targets].sort(
        (a, b) => a.rowIndex - b.rowIndex || a.keyIndex - b.keyIndex,
      )[duplicates.length - 1];
      const size = sizeFor(source.rowIndex, source.keyIndex);
      setWidthDraft(String(size.width));
      setHeightDraft(String(size.height));
    }
  };

  const moveKey = (
    fromRow: number,
    fromIndex: number,
    toRow: number,
    insertIndex: number,
  ) => {
    if (
      fromRow === toRow &&
      (insertIndex === fromIndex || insertIndex === fromIndex + 1)
    ) {
      return;
    }
    updateCustom((layout) => {
      if (
        fromRow < 0 ||
        fromRow >= layout.rows.length ||
        fromIndex < 0 ||
        fromIndex >= layout.rows[fromRow].length ||
        toRow < 0 ||
        toRow >= layout.rows.length
      ) {
        return layout;
      }

      const rows = layout.rows.map((row) => [...row]);
      const keySizes = rows.map((row, rowIndex) =>
        row.map(
          (_, keyIndex) => layout.keySizes?.[rowIndex]?.[keyIndex] ?? null,
        ),
      );
      const keyStyles = rows.map((row, rowIndex) =>
        row.map(
          (_, keyIndex) => layout.keyStyles?.[rowIndex]?.[keyIndex] ?? null,
        ),
      );
      const [key] = rows[fromRow].splice(fromIndex, 1);
      const [size] = keySizes[fromRow].splice(fromIndex, 1);
      const [style] = keyStyles[fromRow].splice(fromIndex, 1);
      const targetIndex =
        toRow === fromRow && insertIndex > fromIndex
          ? insertIndex - 1
          : insertIndex;
      const at = Math.max(0, Math.min(targetIndex, rows[toRow].length));
      rows[toRow].splice(at, 0, key);
      keySizes[toRow].splice(at, 0, size ?? null);
      keyStyles[toRow].splice(at, 0, style ?? null);
      return { ...layout, rows, keySizes, keyStyles };
    });
    const keyIndex =
      toRow === fromRow && insertIndex > fromIndex
        ? insertIndex - 1
        : insertIndex;
    setSelectedRow(toRow);
    setSelectedKey({ rowIndex: toRow, keyIndex });
    setSelectedKeys([{ rowIndex: toRow, keyIndex }]);
  };

  const clearKeySelection = () => {
    setSelectedKey(null);
    setSelectedKeys([]);
    setPaletteMode("add");
  };

  const selectAllKeys = () => {
    const allKeys = selected.rows.flatMap((row, rowIndex) =>
      row.map((_, keyIndex) => ({ rowIndex, keyIndex })),
    );
    const lastKey = allKeys[allKeys.length - 1] ?? null;
    setSelectedKeys(allKeys);
    setSelectedKey(lastKey);
    if (lastKey) {
      setSelectedRow(lastKey.rowIndex);
      const size = sizeFor(lastKey.rowIndex, lastKey.keyIndex);
      setWidthDraft(String(size.width));
      setHeightDraft(String(size.height));
    }
  };

  const resetSelectedKeySize = () => {
    updateSelectedKeySizes(() => DEFAULT_KEY_SIZE);
  };

  const resetSelectedKeyStyle = () => {
    if (selectedKeys.length === 0) return;
    updateKeyStyles(() => ({}));
  };

  const updateSelectedKeyStyle = (patch: Partial<KeyStyle>) => {
    if (selectedKeys.length === 0) return;
    updateKeyStyles((style) => ({ ...style, ...patch }));
  };

  const updateKeyStyles = (update: (style: KeyStyle) => KeyStyle) => {
    if (selectedKeys.length === 0) return;
    updateCustom((layout) => {
      const keyStyles = layout.rows.map((row, currentRow) =>
        row.map(
          (_, currentKey) =>
            layout.keyStyles?.[currentRow]?.[currentKey] ?? null,
        ),
      );
      selectedKeys.forEach(({ rowIndex, keyIndex }) => {
        keyStyles[rowIndex][keyIndex] = update(
          keyStyles[rowIndex][keyIndex] ?? {},
        );
      });
      return { ...layout, keyStyles };
    });
  };

  const commitWidth = (value: string) => {
    const parsed = Number(value);
    const normalized =
      Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_KEY_SIZE.width;
    setWidthDraft(String(normalized));
    updateSelectedKeySizes((size) => ({ ...size, width: normalized }));
  };

  const commitHeight = (value: string) => {
    const parsed = Number(value);
    const normalized =
      Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_KEY_SIZE.height;
    setHeightDraft(String(normalized));
    updateSelectedKeySizes((size) => ({ ...size, height: normalized }));
  };

  const onWidthDraftChange = (value: string) => {
    setWidthDraft(value);
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      updateSelectedKeySizes((size) => ({ ...size, width: parsed }));
    }
  };

  const onHeightDraftChange = (value: string) => {
    setHeightDraft(value);
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      updateSelectedKeySizes((size) => ({ ...size, height: parsed }));
    }
  };

  const selectLayout = (id: string) => {
    setSelectedId(id);
    setSelectedRow(0);
    setSelectedKey(null);
    setSelectedKeys([]);
    setPaletteMode("add");
  };

  const selectKey = (
    selection: SelectedKey,
    size: KeySize,
    additive = false,
  ) => {
    if (!editable) return;
    const alreadySelected = selectedKeys.some(
      (item) =>
        item.rowIndex === selection.rowIndex &&
        item.keyIndex === selection.keyIndex,
    );
    const nextSelection = additive
      ? alreadySelected
        ? selectedKeys.filter(
            (item) =>
              item.rowIndex !== selection.rowIndex ||
              item.keyIndex !== selection.keyIndex,
          )
        : [...selectedKeys, selection]
      : [selection];
    const activeSelection = nextSelection[nextSelection.length - 1] ?? null;
    setSelectedKey(activeSelection);
    setSelectedKeys(nextSelection);
    if (activeSelection) {
      setSelectedRow(activeSelection.rowIndex);
      const activeSize =
        activeSelection.rowIndex === selection.rowIndex &&
        activeSelection.keyIndex === selection.keyIndex
          ? size
          : sizeFor(activeSelection.rowIndex, activeSelection.keyIndex);
      setWidthDraft(String(activeSize.width));
      setHeightDraft(String(activeSize.height));
    }
  };

  const renameLayout = (name: string) =>
    updateCustom((layout) => ({ ...layout, name }));

  const setBackgroundColor = (backgroundColor: string | undefined) =>
    updateCustom((layout) => ({ ...layout, backgroundColor }));

  const setAppearance = (appearance: LayoutAppearance) =>
    updateCustom((layout) => ({ ...layout, appearance }));

  const setTransparency = (transparency: number) =>
    updateCustom((layout) => ({ ...layout, transparency }));

  const setKeyGap = (keyGap: number) =>
    updateCustom((layout) => ({ ...layout, keyGap: normalizeKeyGap(keyGap) }));

  const setKeyRadius = (keyRadius: number) =>
    updateCustom((layout) => ({ ...layout, keyRadius }));

  const setKeyLabelSize = (keyLabelSize: number) =>
    updateCustom((layout) => ({ ...layout, keyLabelSize }));

  const addRow = () =>
    updateCustom((layout) => ({
      ...layout,
      rows: [...layout.rows, []],
      keySizes: [
        ...(layout.keySizes ?? layout.rows.map((row) => row.map(() => null))),
        [],
      ],
      keyStyles: [
        ...(layout.keyStyles ?? layout.rows.map((row) => row.map(() => null))),
        [],
      ],
    }));

  const removeRow = (rowIndex: number) => {
    updateCustom((layout) => ({
      ...layout,
      rows: layout.rows.filter((_, i) => i !== rowIndex),
      keySizes: (layout.keySizes ?? []).filter((_, i) => i !== rowIndex),
      keyStyles: (layout.keyStyles ?? []).filter((_, i) => i !== rowIndex),
    }));
    setSelectedRow((prev) =>
      Math.max(0, Math.min(prev, selected.rows.length - 2)),
    );
    setSelectedKey(null);
    setSelectedKeys([]);
    setPaletteMode("add");
  };

  const moveRow = (fromIndex: number, insertBeforeIndex: number) => {
    updateCustom((layout) => {
      if (fromIndex < 0 || fromIndex >= layout.rows.length) return layout;
      const rows = layout.rows.map((row) => [...row]);
      const keySizes = layout.rows.map((_, i) => [
        ...(layout.keySizes?.[i] ?? []),
      ]);
      const keyStyles = layout.rows.map((_, i) => [
        ...(layout.keyStyles?.[i] ?? []),
      ]);
      const [movedRow] = rows.splice(fromIndex, 1);
      const [movedSizes] = keySizes.splice(fromIndex, 1);
      const [movedStyles] = keyStyles.splice(fromIndex, 1);
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
      keyStyles.splice(target, 0, movedStyles ?? []);
      return { ...layout, rows, keySizes, keyStyles };
    });
    setSelectedKey(null);
    setSelectedKeys([]);
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
      appearance: selected.appearance,
      backgroundColor: selected.backgroundColor,
      transparency: selected.transparency,
      keySizes: selected.keySizes?.map((row) =>
        row.map((size) => (size ? { ...size } : null)),
      ),
      keyStyles: selected.keyStyles?.map((row) =>
        row.map((style) => (style ? { ...style } : null)),
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
    clearKeySelection,
    selectAllKeys,
    renameLayout,
    setAppearance,
    setBackgroundColor,
    setTransparency,
    setKeyGap,
    setKeyRadius,
    setKeyLabelSize,
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
  };
}
