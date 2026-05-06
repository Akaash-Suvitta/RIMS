-- Migration 004: reference tables — countries and health_authorities

CREATE TABLE IF NOT EXISTS countries (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iso2                 CHAR(2) NOT NULL UNIQUE,
    iso3                 CHAR(3) NOT NULL UNIQUE,
    country_name         TEXT NOT NULL,
    region               TEXT,
    regulatory_framework TEXT
);

CREATE TABLE IF NOT EXISTS health_authorities (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id             UUID NOT NULL REFERENCES countries(id),
    code                   TEXT NOT NULL UNIQUE,
    full_name              TEXT NOT NULL,
    acronym                TEXT,
    submission_portal_url  TEXT,
    ectd_version           TEXT,
    accepts_ectd           BOOLEAN DEFAULT TRUE,
    typical_review_days    INTEGER,
    fast_track_review_days INTEGER
);
