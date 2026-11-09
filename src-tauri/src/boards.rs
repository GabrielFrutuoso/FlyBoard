use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct KeySize {
    width: f64,
    height: f64,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct KeyStyle {
    #[serde(default)]
    label_color: Option<String>,
    #[serde(default)]
    border_color: Option<String>,
    #[serde(default)]
    background_color: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct BoardLayout {
    id: String,
    name: String,
    base: String,
    rows: Vec<Vec<String>>,
    #[serde(default)]
    background_color: Option<String>,
    #[serde(default)]
    key_sizes: Option<Vec<Vec<Option<KeySize>>>>,
    #[serde(default)]
    key_styles: Option<Vec<Vec<Option<KeyStyle>>>>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "lowercase")]
enum MacroStep {
    Keys { keys: Vec<String> },
    Text { text: String },
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Macro {
    id: String,
    name: String,
    #[serde(default)]
    icon: Option<String>,
    steps: Vec<MacroStep>,
}

#[derive(Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub(super) struct BoardsFile {
    layouts: Vec<BoardLayout>,
    macros: Vec<Macro>,
}

fn boards_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir.join("boards.json"))
}

#[tauri::command]
pub(super) fn read_boards(app: AppHandle) -> Result<BoardsFile, String> {
    let path = boards_path(&app)?;
    match std::fs::read_to_string(&path) {
        Ok(contents) => {
            serde_json::from_str(&contents).map_err(|error| format!("invalid boards.json: {error}"))
        }
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(BoardsFile::default()),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
pub(super) fn write_boards(app: AppHandle, boards: BoardsFile) -> Result<(), String> {
    let path = boards_path(&app)?;
    let json = serde_json::to_string_pretty(&boards).map_err(|error| error.to_string())?;
    std::fs::write(&path, json).map_err(|error| error.to_string())?;
    app.emit("boards-changed", ())
        .map_err(|error| error.to_string())
}
