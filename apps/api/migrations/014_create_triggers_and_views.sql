-- Migration 014: updated_at trigger function, per-table triggers, and views

-- ─── updated_at trigger function ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Apply trigger to all mutable tables that carry updated_at ───────────────
-- (excludes: audit_log, dossier_documents, label_versions, ha_query_responses,
--  notifications — these are append-only or lack updated_at)

DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY[
        'tenants',
        'users',
        'products',
        'registrations',
        'registration_renewals',
        'registration_variations',
        'registration_conditions',
        'documents',
        'dossiers',
        'dossier_modules',
        'submissions',
        'submission_tasks',
        'ha_queries',
        'labels',
        'label_translations',
        'ai_insights',
        'regulatory_intelligence',
        'publishing_jobs'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- Drop existing trigger if present so we can recreate safely
        EXECUTE format(
            'DROP TRIGGER IF EXISTS set_updated_at ON %I',
            t
        );
        EXECUTE format(
            'CREATE TRIGGER set_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
            t
        );
    END LOOP;
END;
$$;

-- ─── Views ────────────────────────────────────────────────────────────────────

-- Registrations expiring within 180 days
CREATE OR REPLACE VIEW vw_registrations_expiring AS
SELECT
    r.id,
    r.tenant_id,
    r.registration_number,
    r.status,
    r.expiry_date,
    r.days_until_expiry,
    r.next_renewal_due,
    r.renewal_initiated,
    p.name               AS product_name,
    p.brand_name,
    c.country_name,
    c.iso2               AS country_iso2,
    ha.code              AS ha_code,
    ha.full_name         AS ha_full_name,
    u.full_name          AS owner_name
FROM registrations r
JOIN products  p  ON p.id  = r.product_id
JOIN countries c  ON c.id  = r.country_id
JOIN health_authorities ha ON ha.id = r.ha_id
LEFT JOIN users u ON u.id  = r.owner_user_id
WHERE r.archived_at IS NULL
  AND r.days_until_expiry IS NOT NULL
  AND r.days_until_expiry BETWEEN 0 AND 180;

-- Dossier completeness per dossier
CREATE OR REPLACE VIEW vw_dossier_completeness AS
SELECT
    d.id              AS dossier_id,
    d.tenant_id,
    d.name,
    d.completeness_pct,
    d.status,
    COUNT(dm.id)                                           AS total_modules,
    COUNT(dm.id) FILTER (WHERE dm.status = 'complete')    AS complete_modules,
    COUNT(dm.id) FILTER (WHERE dm.ai_gap_detected = TRUE) AS gap_modules
FROM dossiers d
LEFT JOIN dossier_modules dm ON dm.dossier_id = d.id
WHERE d.archived_at IS NULL
GROUP BY d.id, d.tenant_id, d.name, d.completeness_pct, d.status;

-- Submission pipeline — active (non-terminal) submissions with open HA query counts
CREATE OR REPLACE VIEW vw_submission_pipeline AS
SELECT
    s.id,
    s.tenant_id,
    s.submission_number,
    s.submission_type,
    s.status,
    s.target_file_date,
    s.actual_file_date,
    s.pdufa_date,
    s.completeness_pct,
    p.name            AS product_name,
    ha.code           AS ha_code,
    ha.full_name      AS ha_full_name,
    COUNT(hq.id) FILTER (WHERE hq.status NOT IN ('closed')) AS open_query_count
FROM submissions s
JOIN products p ON p.id = s.product_id
JOIN health_authorities ha ON ha.id = s.ha_id
LEFT JOIN ha_queries hq ON hq.submission_id = s.id
WHERE s.archived_at IS NULL
  AND s.status NOT IN ('approved', 'rejected', 'withdrawn')
GROUP BY s.id, s.tenant_id, s.submission_number, s.submission_type,
         s.status, s.target_file_date, s.actual_file_date, s.pdufa_date,
         s.completeness_pct, p.name, ha.code, ha.full_name;

-- Open / overdue HA queries with days remaining
CREATE OR REPLACE VIEW vw_ha_queries_open AS
SELECT
    hq.id,
    hq.tenant_id,
    hq.query_reference,
    hq.query_type,
    hq.status,
    hq.received_date,
    hq.due_date,
    hq.ai_draft_ready,
    CASE WHEN hq.due_date IS NOT NULL
         THEN (hq.due_date - CURRENT_DATE)::INTEGER
         ELSE NULL
    END AS days_remaining,
    ha.code           AS ha_code,
    s.submission_number
FROM ha_queries hq
JOIN health_authorities ha ON ha.id = hq.ha_id
JOIN submissions s ON s.id = hq.submission_id
WHERE hq.status NOT IN ('closed', 'response_submitted');
