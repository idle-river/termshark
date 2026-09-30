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
