import { useEffect, useState } from "react";
import {
  loadBoards,
  saveBoards,
  type BoardsFile,
} from "../../../utils/boardConfig";

const EMPTY_BOARDS: BoardsFile = { layouts: [], macros: [] };

export function useBoardDocument() {
  const [boards, setBoards] = useState<BoardsFile>(EMPTY_BOARDS);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBoards()
      .then(setBoards)
      .catch((loadError) =>
        setError(
          loadError instanceof Error ? loadError.message : String(loadError),
        ),
      )
      .finally(() => setLoaded(true));
  }, []);

  const updateBoards = (next: BoardsFile) => {
    setBoards(next);
    setDirty(true);
  };

  const save = () => {
    setSaving(true);
    saveBoards(boards)
      .then(() => {
        setDirty(false);
        setError(null);
      })
      .catch((saveError) =>
        setError(
          saveError instanceof Error ? saveError.message : String(saveError),
        ),
      )
      .finally(() => setSaving(false));
  };

  return { boards, loaded, dirty, saving, error, updateBoards, save };
}
