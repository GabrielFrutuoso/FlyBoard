import { useState } from "react";
import { isModifier } from "../../../keys";
import {
  macroKey,
  newId,
  runMacroSteps,
  type BoardsFile,
  type Macro,
} from "../../../utils/boardConfig";

export function useMacroEditor(
  boards: BoardsFile,
  onChange: (boards: BoardsFile) => void,
) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [combo, setCombo] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [newName, setNewName] = useState("");
  const [testError, setTestError] = useState<string | null>(null);

  const selected =
    boards.macros.find((macro) => macro.id === selectedId) ?? boards.macros[0];

  const updateMacro = (update: (macro: Macro) => Macro) => {
    if (!selected) return;
    onChange({
      ...boards,
      macros: boards.macros.map((macro) =>
        macro.id === selected.id ? update(macro) : macro,
      ),
    });
  };

  const selectMacro = (id: string) => {
    setSelectedId(id);
    setCombo([]);
    setTestError(null);
  };

  const addMacro = () => {
    const macro: Macro = {
      id: newId(),
      name: newName.trim() || `Macro ${boards.macros.length + 1}`,
      steps: [],
    };
    onChange({ ...boards, macros: [...boards.macros, macro] });
    setSelectedId(macro.id);
    setNewName("");
  };

  const deleteMacro = () => {
    if (!selected) return;
    const key = macroKey(selected.id);
    onChange({
      layouts: boards.layouts.map((layout) => ({
        ...layout,
        rows: layout.rows.map((row) => row.filter((item) => item !== key)),
      })),
      macros: boards.macros.filter((macro) => macro.id !== selected.id),
    });
    setSelectedId(null);
    setCombo([]);
  };

  const pickKey = (key: string) => {
    setCombo((previous) => {
      if (isModifier(key)) {
        return previous.includes(key)
          ? previous.filter((item) => item !== key)
          : [...previous, key];
      }
      const last = previous[previous.length - 1];
      if (last && !isModifier(last)) return [...previous.slice(0, -1), key];
      return [...previous, key];
    });
  };

  const clearCombo = () => setCombo([]);

  const comboReady = combo.length > 0 && !isModifier(combo[combo.length - 1]);

  const addKeysStep = () => {
    if (!comboReady) return;
    updateMacro((macro) => ({
      ...macro,
      steps: [...macro.steps, { type: "keys", keys: combo }],
    }));
    setCombo([]);
  };

  const addTextStep = () => {
    if (!text) return;
    updateMacro((macro) => ({
      ...macro,
      steps: [...macro.steps, { type: "text", text }],
    }));
    setText("");
  };

  const moveStep = (index: number, direction: -1 | 1) =>
    updateMacro((macro) => {
      const steps = [...macro.steps];
      const target = index + direction;
      if (target < 0 || target >= steps.length) return macro;
      [steps[index], steps[target]] = [steps[target], steps[index]];
      return { ...macro, steps };
    });

  const removeStep = (index: number) =>
    updateMacro((macro) => ({
      ...macro,
      steps: macro.steps.filter((_, stepIndex) => stepIndex !== index),
    }));

  const testMacro = () => {
    if (!selected) return;
    setTestError(null);
    runMacroSteps(selected.steps, "pt-br").catch((error) =>
      setTestError(error instanceof Error ? error.message : String(error)),
    );
  };

  return {
    selected,
    combo,
    comboReady,
    text,
    setText,
    newName,
    setNewName,
    testError,
    selectMacro,
    addMacro,
    deleteMacro,
    pickKey,
    clearCombo,
    addKeysStep,
    addTextStep,
    moveStep,
    removeStep,
    testMacro,
    updateMacro,
  };
}
