-- Your SQL goes here
CREATE TABLE keys (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    label VARCHAR NOT NULL,
    pubkey TEXT NOT NULL,
    privkey TEXT NOT NULL
);
