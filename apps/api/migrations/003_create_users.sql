-- Migration 003: users table

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email         TEXT NOT NULL,
    cognito_sub   UUID NOT NULL UNIQUE,
    full_name     TEXT NOT NULL,
    role          user_role NOT NULL DEFAULT 'regulatory_affairs_specialist',
    phone         TEXT,
    department    TEXT,
    preferences   JSONB DEFAULT '{}',
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, email)
);
