use keyring::Entry;

const SERVICE_NAME: &str = "com.laraframe.app";

fn entry(key: &str) -> Result<Entry, String> {
    Entry::new(SERVICE_NAME, key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_api_key(service: String, token: String) -> Result<(), String> {
    let entry = entry(&service)?;
    entry.set_password(&token).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_api_key(service: String) -> Result<Option<String>, String> {
    let entry = entry(&service)?;
    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn delete_api_key(service: String) -> Result<(), String> {
    let entry = entry(&service)?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn has_api_key(service: String) -> Result<bool, String> {
    let entry = entry(&service)?;
    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(e.to_string()),
    }
}
