-- ============================================================================
-- Migration 002: Create Assistant FAQs Table
-- Safe, idempotent migration to support Database-Powered Assistant Mode
-- ============================================================================

CREATE TABLE IF NOT EXISTS assistant_faqs (
    id VARCHAR(64) PRIMARY KEY,
    question_key VARCHAR(128) NOT NULL UNIQUE,
    category VARCHAR(64) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    audience VARCHAR(32) NOT NULL DEFAULT 'all',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_assistant_faqs_key ON assistant_faqs(question_key);
CREATE INDEX IF NOT EXISTS idx_assistant_faqs_active ON assistant_faqs(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_assistant_faqs_audience ON assistant_faqs(audience);
