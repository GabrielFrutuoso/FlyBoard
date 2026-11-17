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
    border_transparency: Option<u8>,
    #[serde(default)]
    background_color: Option<String>,
    #[serde(default)]
    appearance: Option<LayoutAppearance>,
    #[serde(default)]
    transparency: Option<u8>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct BoardLayout {
    id: String,
    name: String,
    base: String,
    rows: Vec<Vec<String>>,
    #[serde(default)]
    appearance: LayoutAppearance,
    #[serde(default)]
    background_color: Option<String>,
    #[serde(default)]
    transparency: Option<u8>,
    #[serde(default)]
    key_gap: Option<u8>,
    #[serde(default)]
    key_radius: Option<u8>,
    #[serde(default)]
    key_label_size: Option<u8>,
    #[serde(default)]
    key_sizes: Option<Vec<Vec<Option<KeySize>>>>,
    #[serde(default)]
    key_styles: Option<Vec<Vec<Option<KeyStyle>>>>,
}

#[derive(Serialize, Deserialize, Clone, Copy, Default)]
#[serde(rename_all = "lowercase")]
enum LayoutAppearance {
    #[default]
    Solid,
    // Kept to deserialize existing files; the frontend migrates it to transparent.
    Glass,
    Transparent,
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

#[cfg(test)]
mod tests {
    use super::{BoardsFile, LayoutAppearance};
    use serde_json::json;

    #[test]
    fn old_layouts_default_to_solid_appearance() {
        let boards: BoardsFile = serde_json::from_value(json!({
            "layouts": [{
                "id": "custom",
                "name": "Custom",
                "base": "en",
                "rows": [["a"]]
            }]
        }))
        .unwrap();

        assert!(matches!(
            boards.layouts[0].appearance,
            LayoutAppearance::Solid
        ));
    }

    #[test]
    fn transparency_round_trips_for_layouts_and_keys() {
        let boards: BoardsFile = serde_json::from_value(json!({
            "layouts": [{
                "id": "custom",
                "name": "Custom",
                "base": "en",
                "rows": [["a"]],
                "appearance": "transparent",
                "transparency": 72,
                "keyGap": 6,
                "keyRadius": 8,
                "keyLabelSize": 15,
                "glassIntensity": 31,
                "keyStyles": [[{
                    "appearance": "transparent",
                    "transparency": 88,
                    "borderTransparency": 37,
                    "glassIntensity": 42
                }]]
            }]
        }))
        .unwrap();

        let saved = serde_json::to_value(boards).unwrap();
        let layout = &saved["layouts"][0];
        let key = &layout["keyStyles"][0][0];
        assert_eq!(layout["appearance"], "transparent");
        assert_eq!(layout["transparency"], 72);
        assert_eq!(layout["keyGap"], 6);
        assert_eq!(layout["keyRadius"], 8);
        assert_eq!(layout["keyLabelSize"], 15);
        assert_eq!(key["appearance"], "transparent");
        assert_eq!(key["transparency"], 88);
        assert_eq!(key["borderTransparency"], 37);
        assert!(layout.get("glassIntensity").is_none());
        assert!(key.get("glassIntensity").is_none());
    }

    #[test]
    fn legacy_glass_settings_remain_readable_until_frontend_migration() {
        let boards: BoardsFile = serde_json::from_value(json!({
            "layouts": [{
                "id": "custom",
                "name": "Custom",
                "base": "en",
                "rows": [["a"]],
                "appearance": "glass",
                "transparency": 48
            }]
        }))
        .unwrap();

        assert!(matches!(
            boards.layouts[0].appearance,
            LayoutAppearance::Glass
        ));
        assert_eq!(boards.layouts[0].transparency, Some(48));
    }
}
