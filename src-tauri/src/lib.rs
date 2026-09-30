use diesel::{Connection, QueryDsl, RunQueryDsl, SelectableHelper, SqliteConnection};
use dotenvy::dotenv;

use crate::models::Key;
mod models;
mod schema;

#[tauri::command]
fn get_keys() -> Result<Vec<Key>, String> {
    use self::schema::keys::dsl::*;
    let conn = &mut establish_connection();

    let ident_keys = keys
        .select(Key::as_select())
        .load(conn)
        .map_err(|err| err.to_string())?;

    Ok(ident_keys)
}

fn establish_connection() -> SqliteConnection {
    dotenv().ok();

    let database_url = std::env::var("DATABASE_URL").expect("database url must be present");
    SqliteConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to DB: {}", database_url))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_keys])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
