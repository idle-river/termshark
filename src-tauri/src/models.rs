use diesel::prelude::*;
use serde::Serialize;

#[derive(Queryable, Selectable, Serialize)]
#[diesel(table_name = crate::schema::keys)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Key {
    pub id: i32,
    pub label: String,
    pub pubkey: String,
    pub privkey: String,
}

#[derive(Insertable)]
#[diesel(table_name = crate::schema::keys)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct NewKey {
    pub label: String,
    pub pubkey: String,
    pub privkey: String,
}

#[derive(Queryable, Selectable, Serialize)]
#[diesel(table_name = crate::schema::hosts)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Host {
    pub id: String,
    pub name: String,
    pub hostname: String,
    pub port: i32,
    pub username: String,
    pub auth_method: String,
    pub credential_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub last_connected_at: Option<String>,
}

#[derive(Insertable)]
#[diesel(table_name = crate::schema::hosts)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct NewHost {
    pub id: String,
    name: String,
    hostname: String,
    port: Option<i32>,
    username: String,
    auth_method: Option<String>,
    credential_id: Option<String>,
    last_connected_at: Option<String>,
}
