
CREATE TABLE IF NOT EXISTS hosts (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,

    -- Connection
    hostname TEXT NOT NULL,
    port INTEGER NOT NULL DEFAULT 22
        CHECK (port BETWEEN 1 AND 65535),
    username TEXT NOT NULL,

    -- Authentication
    auth_method TEXT NOT NULL DEFAULT 'agent'
        CHECK (auth_method IN (
            'agent',
            'privateKey',
            'password',
            'certificate'
        )),
    credential_id TEXT,

    created_at TEXT NOT NULL DEFAULT (
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    ),
    updated_at TEXT NOT NULL DEFAULT (
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    ),
    last_connected_at TEXT
);

CREATE INDEX idx_hosts_name ON hosts(name);
