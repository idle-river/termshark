// @generated automatically by Diesel CLI.

diesel::table! {
    hosts (id) {
        id -> Text,
        name -> Text,
        hostname -> Text,
        port -> Integer,
        username -> Text,
        auth_method -> Text,
        credential_id -> Nullable<Text>,
        created_at -> Text,
        updated_at -> Text,
        last_connected_at -> Nullable<Text>,
    }
}

diesel::table! {
    keys (id) {
        id -> Integer,
        label -> Text,
        pubkey -> Text,
        privkey -> Text,
    }
}

diesel::allow_tables_to_appear_in_same_query!(hosts, keys,);
