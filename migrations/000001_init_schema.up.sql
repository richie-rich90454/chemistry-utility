CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'researcher', 'admin')),
    email_verified INTEGER NOT NULL DEFAULT 0,
    oauth_provider TEXT NOT NULL DEFAULT '',
    oauth_id TEXT NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calculations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calculator_type TEXT NOT NULL,
    inputs TEXT NOT NULL DEFAULT '{}',
    result TEXT NOT NULL DEFAULT '{}',
    annotation TEXT NOT NULL DEFAULT '',
    starred INTEGER NOT NULL DEFAULT 0,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS compounds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    formula TEXT NOT NULL,
    cas_number TEXT NOT NULL DEFAULT '',
    smiles TEXT NOT NULL DEFAULT '',
    inchi TEXT NOT NULL DEFAULT '',
    molar_mass REAL NOT NULL DEFAULT 0,
    properties TEXT NOT NULL DEFAULT '{}',
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('pubchem', 'nist', 'chembl', 'manual')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    last_used_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plugins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    version TEXT NOT NULL DEFAULT '1.0.0',
    author TEXT NOT NULL DEFAULT '',
    manifest TEXT NOT NULL DEFAULT '{}',
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_data TEXT NOT NULL DEFAULT '{}',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_calculations_workspace_id ON calculations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_calculations_calculator_type ON calculations(calculator_type);
CREATE INDEX IF NOT EXISTS idx_calculations_created_at ON calculations(created_at);
CREATE INDEX IF NOT EXISTS idx_compounds_formula ON compounds(formula);
CREATE INDEX IF NOT EXISTS idx_compounds_cas_number ON compounds(cas_number);
CREATE INDEX IF NOT EXISTS idx_compounds_name ON compounds(name);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

CREATE VIRTUAL TABLE IF NOT EXISTS compounds_fts USING fts5(name, formula, cas_number, smiles, inchi, content=compounds, content_rowid=rowid);

CREATE TRIGGER IF NOT EXISTS compounds_ai AFTER INSERT ON compounds BEGIN
    INSERT INTO compounds_fts(rowid, name, formula, cas_number, smiles, inchi) VALUES (new.rowid, new.name, new.formula, new.cas_number, new.smiles, new.inchi);
END;

CREATE TRIGGER IF NOT EXISTS compounds_ad AFTER DELETE ON compounds BEGIN
    INSERT INTO compounds_fts(compounds_fts, rowid, name, formula, cas_number, smiles, inchi) VALUES ('delete', old.rowid, old.name, old.formula, old.cas_number, old.smiles, old.inchi);
END;

CREATE TRIGGER IF NOT EXISTS compounds_au AFTER UPDATE ON compounds BEGIN
    INSERT INTO compounds_fts(compounds_fts, rowid, name, formula, cas_number, smiles, inchi) VALUES ('delete', old.rowid, old.name, old.formula, old.cas_number, old.smiles, old.inchi);
    INSERT INTO compounds_fts(rowid, name, formula, cas_number, smiles, inchi) VALUES (new.rowid, new.name, new.formula, new.cas_number, new.smiles, new.inchi);
END;
