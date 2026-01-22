# XJSON Brain IDE Desktop (Tauri)

This document describes the recommended desktop wrapper strategy for the XJSON Brain IDE.
It assumes the existing PWA stays the UI layer while Tauri provides native integration.

## Architecture

```
XJSON Desktop App
├── Rust Core (Brain, SCXQ2, KGB-ZK-1)
├── Tauri Shell
│   ├── Native menu / tray
│   ├── Auto-updater
│   ├── File system access
│   └── OS permissions
├── Web IDE (PWA)
│   ├── SVG cognition UI
│   ├── WASM decoders
│   ├── WebRTC mesh
│   └── Offline brains
└── Shared Service Worker
```

## Suggested layout

```
xjson-desktop/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs
│       └── tray.rs
├── web-ide/
└── package.json
```

## Tauri configuration

```json
{
  "package": {
    "productName": "XJSON Brain IDE",
    "version": "1.0.0"
  },
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:5173",
    "distDir": "../web-ide/dist"
  },
  "tauri": {
    "bundle": {
      "identifier": "app.xjson.ide",
      "icon": [
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "targets": ["msi", "app", "dmg"]
    },
    "updater": {
      "active": true,
      "endpoints": [
        "https://updates.xjson.app/{{target}}/{{current_version}}"
      ],
      "dialog": true
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "title": "XJSON Brain IDE",
        "width": 1400,
        "height": 900
      }
    ]
  }
}
```

## Tray + background mode

```rust
use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu};

pub fn build_tray() -> SystemTray {
    let open = CustomMenuItem::new("open".to_string(), "Open IDE");
    let sync = CustomMenuItem::new("sync".to_string(), "Sync Brains Now");
    let folder = CustomMenuItem::new("folder".to_string(), "Open Brain Folder");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

    let menu = SystemTrayMenu::new()
        .add_item(open)
        .add_item(sync)
        .add_item(folder)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(quit);

    SystemTray::new().with_menu(menu)
}
```

```rust
mod tray;

fn main() {
    tauri::Builder::default()
        .system_tray(tray::build_tray())
        .on_system_tray_event(|app, event| match event {
            tauri::SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "open" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "sync" => {
                    let _ = app.emit_all("brain-sync", {});
                }
                "folder" => {
                    let _ = tauri::api::shell::open(
                        &app.shell_scope(),
                        "./brains".into(),
                        None,
                    );
                }
                "quit" => std::process::exit(0),
                _ => {}
            },
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error running xjson desktop");
}
```

### Keep running on close

```js
import { appWindow } from "@tauri-apps/api/window";

appWindow.onCloseRequested((e) => {
  e.preventDefault();
  appWindow.hide();
});
```

## Desktop ↔ IDE bridge example

```rust
#[tauri::command]
fn list_local_brains(path: String) -> Vec<String> {
    std::fs::read_dir(path)
        .unwrap()
        .filter_map(|e| e.ok())
        .map(|e| e.path().display().to_string())
        .collect()
}
```

```js
import { invoke } from "@tauri-apps/api";

const brains = await invoke("list_local_brains", { path: "./brains" });
```

## Enterprise packaging

### Windows MSI

```powershell
msiexec /i XJSON-Brain-IDE.msi /qn INSTALLDIR="C:\\XJSON"
```

```powershell
msiexec /x XJSON-Brain-IDE.msi /qn
```

### macOS

```bash
sudo installer -pkg XJSON.pkg -target /
```

## Code signing + notarization

### Windows

```powershell
signtool sign \
  /fd SHA256 \
  /tr http://timestamp.digicert.com \
  /td SHA256 \
  /a XJSON-Brain-IDE.exe
```

```powershell
signtool sign XJSON-Brain-IDE.msi
```

### macOS

```bash
codesign --deep --force --options runtime \
  --sign "Developer ID Application: XJSON Inc" \
  XJSON.app
```

```bash
xcrun notarytool submit XJSON.dmg \
  --apple-id "$APPLE_ID" \
  --team-id "$TEAM_ID" \
  --password "$APP_PASSWORD" \
  --wait
```

```bash
xcrun stapler staple XJSON.dmg
```

## Binary asset placeholders

GitHub does not allow storing binary files in this repository. The desktop bundle
expects these files to be created locally during packaging:

- `xjson-desktop/src-tauri/icons/icon.icns`
- `xjson-desktop/src-tauri/icons/icon.ico`

See `docs/desktop-assets/` for placeholder `.md` files that describe how to
create these assets.
