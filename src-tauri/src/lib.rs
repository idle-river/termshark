use diesel::{Connection, RunQueryDsl, SelectableHelper, SqliteConnection};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use dotenvy::dotenv;

use crate::models::Key;
mod models;
mod schema;

#[tauri::command]
fn get_keys() -> Result<Vec<Key>, String> {
    use self::schema::keys::dsl::*;
    use diesel::QueryDsl;

    let conn = &mut establish_connection();

    let ident_keys = keys
        .select(Key::as_select())
        .load(conn)
        .map_err(|err| err.to_string())?;

    Ok(ident_keys)
}

#[tauri::command]
fn create_key(label: String, pubkey: String, privkey: String) -> Result<Key, String> {
    use self::models::NewKey;
    use self::schema::keys::dsl::keys;

    let new_key = NewKey {
        label,
        pubkey,
        privkey,
    };
    let conn = &mut establish_connection();

    diesel::insert_into(keys)
        .values(&new_key)
        .returning(Key::as_returning())
        .get_result(conn)
        .map_err(|e| e.to_string())
}

const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

fn establish_connection() -> SqliteConnection {
    dotenv().ok();

    let database_url = std::env::var("DATABASE_URL").expect("database url must be present");
    let mut conn = SqliteConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to DB: {}", database_url));
    conn.run_pending_migrations(MIGRATIONS).unwrap();
    conn
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_keys, create_key])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
