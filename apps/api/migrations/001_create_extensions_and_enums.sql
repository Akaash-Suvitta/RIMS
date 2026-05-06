-- Migration 001: PostgreSQL extensions and enum types
-- Safe to run multiple times (IF NOT EXISTS on extension; DO blocks guard enums)

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tenant plan
DO $$ BEGIN
  CREATE TYPE tenant_plan AS ENUM ('trial', 'demo', 'professional', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User role
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin', 'regulatory_lead', 'regulatory_affairs_manager',
    'regulatory_affairs_specialist', 'dossier_manager',
    'submission_coordinator', 'labeling_specialist',
    'read_only', 'external_reviewer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Product type
DO $$ BEGIN
  CREATE TYPE product_type AS ENUM (
    'small_molecule', 'biologic', 'biosimilar', 'vaccine',
    'gene_therapy', 'medical_device', 'combination_product'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Registration status
DO $$ BEGIN
  CREATE TYPE registration_status AS ENUM (
    'pending', 'active', 'suspended', 'lapsed', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Submission type
DO $$ BEGIN
  CREATE TYPE submission_type AS ENUM (
    'ctd', 'nda', 'maa', 'ind', 'bla', 'jnda',
    'variation', 'renewal_application', 'annual_report'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Submission status
DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM (
    'draft', 'submitted', 'under_review',
    'approved', 'rejected', 'withdrawn'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Renewal status
DO $$ BEGIN
  CREATE TYPE renewal_status AS ENUM (
    'upcoming', 'in_progress', 'submitted', 'approved', 'missed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Task status
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'completed', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Dossier format
DO $$ BEGIN
  CREATE TYPE dossier_format AS ENUM (
    'ectd_v3', 'ectd_v4', 'eu_ctd', 'j_ctd',
    'anvisa_edossier', 'cdsco_format', 'nmpa_ctd', 'non_ectd'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Dossier status
DO $$ BEGIN
  CREATE TYPE dossier_status AS ENUM (
    'in_preparation', 'under_review', 'submission_ready',
    'submitted', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Module status
DO $$ BEGIN
  CREATE TYPE module_status AS ENUM (
    'not_started', 'in_progress', 'complete',
    'gap_identified', 'pending_review'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Label status
DO $$ BEGIN
  CREATE TYPE label_status AS ENUM ('draft', 'review', 'approved', 'superseded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Label type
DO $$ BEGIN
  CREATE TYPE label_type AS ENUM (
    'uspi', 'smpc', 'ccds', 'jpi', 'pil',
    'patient_leaflet', 'prescribing_info'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Translation status
DO $$ BEGIN
  CREATE TYPE translation_status AS ENUM (
    'pending', 'in_progress', 'ai_draft_ready',
    'under_review', 'approved', 'flagged'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- HA query status
DO $$ BEGIN
  CREATE TYPE ha_query_status AS ENUM (
    'open', 'in_progress', 'response_drafted',
    'response_submitted', 'closed', 'overdue'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- HA query type
DO $$ BEGIN
  CREATE TYPE ha_query_type AS ENUM (
    'clinical', 'nonclinical', 'quality_cmc', 'labeling',
    'administrative', 'pharmacovigilance', 'rems', 'general'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Variation type
DO $$ BEGIN
  CREATE TYPE variation_type AS ENUM (
    'type_ia', 'type_ib', 'type_ii', 'prior_approval_supplement',
    'cbe_30', 'cbe_0', 'minor_change', 'major_change'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Variation status
DO $$ BEGIN
  CREATE TYPE variation_status AS ENUM (
    'planning', 'submitted', 'under_review',
    'approved', 'rejected', 'withdrawn'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Response source
DO $$ BEGIN
  CREATE TYPE response_source AS ENUM (
    'manual', 'ai_generated', 'ai_assisted', 'template'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Publishing status
DO $$ BEGIN
  CREATE TYPE publishing_status AS ENUM (
    'queued', 'in_progress', 'quality_check',
    'submitted', 'acknowledged', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AI insight type
DO $$ BEGIN
  CREATE TYPE ai_insight_type AS ENUM (
    'gap_detection', 'renewal_risk', 'query_assist',
    'market_gap', 'reg_watch'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AI insight severity
DO $$ BEGIN
  CREATE TYPE ai_insight_severity AS ENUM (
    'critical', 'high', 'medium', 'low', 'informational'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AI insight status
DO $$ BEGIN
  CREATE TYPE ai_insight_status AS ENUM (
    'new', 'acknowledged', 'actioned', 'dismissed', 'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AI module context
DO $$ BEGIN
  CREATE TYPE ai_module_context AS ENUM (
    'registration', 'renewal', 'submission',
    'dossier', 'labeling', 'general'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Impact level
DO $$ BEGIN
  CREATE TYPE impact_level AS ENUM (
    'critical', 'high', 'medium', 'low', 'monitoring'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification type
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'renewal_due', 'submission_update', 'task_assigned',
    'ai_complete', 'system'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
