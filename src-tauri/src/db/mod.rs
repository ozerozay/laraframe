use rusqlite::{Connection, Result as SqlResult};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

pub struct Database(pub Mutex<Connection>);

fn db_path(app: &tauri::AppHandle) -> PathBuf {
    let dir = app.path().app_data_dir().expect("failed to get app data dir");
    std::fs::create_dir_all(&dir).expect("failed to create app data dir");
    dir.join("laraframe.db")
}

pub fn init(app: &tauri::AppHandle) -> Database {
    let path = db_path(app);
    let conn = Connection::open(path).expect("failed to open database");
    run_migrations(&conn);
    Database(Mutex::new(conn))
}

fn run_migrations(conn: &Connection) {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS forge_servers (
            id          INTEGER PRIMARY KEY,
            name        TEXT NOT NULL,
            ip_address  TEXT,
            provider    TEXT,
            region      TEXT,
            status      TEXT,
            php_version TEXT,
            data_json   TEXT,
            updated_at  TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS cloud_apps (
            id         TEXT PRIMARY KEY,
            name       TEXT NOT NULL,
            status     TEXT,
            data_json  TEXT,
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS nightwatch_monitors (
            id         INTEGER PRIMARY KEY,
            url        TEXT NOT NULL,
            status     TEXT,
            uptime     REAL,
            data_json  TEXT,
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS ai_messages (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            role       TEXT NOT NULL,
            content    TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        );
        ",
    )
    .expect("failed to run migrations");
}

#[tauri::command]
pub fn get_setting(key: String, state: tauri::State<'_, Database>) -> Result<Option<String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT value FROM settings WHERE key = ?1")
        .map_err(|e| e.to_string())?;
    let result: SqlResult<String> = stmt.query_row([&key], |row| row.get(0));
    match result {
        Ok(val) => Ok(Some(val)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn set_setting(key: String, value: String, state: tauri::State<'_, Database>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
        [&key, &value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
