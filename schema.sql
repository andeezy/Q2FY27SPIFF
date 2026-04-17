-- Run this once to initialize your D1 database
-- Command: npx wrangler d1 execute spiff-tracker --file=schema.sql

CREATE TABLE IF NOT EXISTS spiff_state (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
