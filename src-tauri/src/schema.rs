// @generated automatically by Diesel CLI.

diesel::table! {
    keys (id) {
        id -> Integer,
        label -> Text,
        pubkey -> Text,
        privkey -> Text,
    }
}
