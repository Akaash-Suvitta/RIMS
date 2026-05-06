-- Migration 013: all indexes (idempotent via IF NOT EXISTS)

-- tenants
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- users
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- products
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(tenant_id) WHERE archived_at IS NULL;

-- registrations
CREATE INDEX IF NOT EXISTS idx_registrations_tenant_id ON registrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_registrations_product_id ON registrations(product_id);
CREATE INDEX IF NOT EXISTS idx_registrations_market_id ON registrations(country_id);
CREATE INDEX IF NOT EXISTS idx_registrations_ha_id ON registrations(ha_id);
CREATE INDEX IF NOT EXISTS idx_registrations_expiry_date ON registrations(expiry_date);
CREATE INDEX IF NOT EXISTS idx_registrations_tenant_status ON registrations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_tenant_market ON registrations(tenant_id, country_id);
CREATE INDEX IF NOT EXISTS idx_registrations_tenant_product ON registrations(tenant_id, product_id);

-- registration_renewals
CREATE INDEX IF NOT EXISTS idx_renewals_tenant_id ON registration_renewals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_renewals_registration_id ON registration_renewals(registration_id);
CREATE INDEX IF NOT EXISTS idx_renewals_tenant_due ON registration_renewals(tenant_id, target_submission_date);
CREATE INDEX IF NOT EXISTS idx_renewals_tenant_status ON registration_renewals(tenant_id, status);

-- registration_variations
CREATE INDEX IF NOT EXISTS idx_variations_tenant_id ON registration_variations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_variations_registration_id ON registration_variations(registration_id);

-- registration_conditions
CREATE INDEX IF NOT EXISTS idx_conditions_tenant_id ON registration_conditions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conditions_registration_id ON registration_conditions(registration_id);

-- documents
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_previous_version ON documents(previous_version_id);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_file_name_trgm ON documents USING GIN(file_name gin_trgm_ops);

-- dossiers
CREATE INDEX IF NOT EXISTS idx_dossiers_tenant_id ON dossiers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_product_id ON dossiers(product_id);

-- dossier_modules
CREATE INDEX IF NOT EXISTS idx_dossier_modules_tenant_id ON dossier_modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dossier_modules_dossier_id ON dossier_modules(dossier_id);
CREATE INDEX IF NOT EXISTS idx_dossier_modules_parent ON dossier_modules(parent_module_id);
CREATE INDEX IF NOT EXISTS idx_dossier_modules_gap ON dossier_modules(ai_gap_detected) WHERE ai_gap_detected = TRUE;

-- dossier_documents
CREATE INDEX IF NOT EXISTS idx_dossier_documents_tenant_id ON dossier_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dossier_documents_module_id ON dossier_documents(module_id);

-- submissions
CREATE INDEX IF NOT EXISTS idx_submissions_tenant_id ON submissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_submissions_product_id ON submissions(product_id);
CREATE INDEX IF NOT EXISTS idx_submissions_ha_id ON submissions(ha_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_pdufa_date ON submissions(pdufa_date);

-- submission_documents
CREATE INDEX IF NOT EXISTS idx_submission_docs_tenant_id ON submission_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_submission_docs_submission_id ON submission_documents(submission_id);

-- submission_tasks
CREATE INDEX IF NOT EXISTS idx_submission_tasks_tenant_id ON submission_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_submission_tasks_submission_id ON submission_tasks(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_tasks_assigned_user ON submission_tasks(assigned_user_id);

-- ha_queries
CREATE INDEX IF NOT EXISTS idx_ha_queries_tenant_id ON ha_queries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ha_queries_submission_id ON ha_queries(submission_id);
CREATE INDEX IF NOT EXISTS idx_ha_queries_status ON ha_queries(status);
CREATE INDEX IF NOT EXISTS idx_ha_queries_due_date ON ha_queries(due_date);

-- ha_query_responses
CREATE INDEX IF NOT EXISTS idx_ha_responses_tenant_id ON ha_query_responses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ha_responses_query_id ON ha_query_responses(query_id);

-- labels
CREATE INDEX IF NOT EXISTS idx_labels_tenant_id ON labels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_labels_product_id ON labels(product_id);

-- label_versions
CREATE INDEX IF NOT EXISTS idx_label_versions_tenant_id ON label_versions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_label_versions_label_id ON label_versions(label_id);

-- label_translations
CREATE INDEX IF NOT EXISTS idx_label_translations_tenant_id ON label_translations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_label_translations_label_id ON label_translations(label_id);

-- ai_insights
CREATE INDEX IF NOT EXISTS idx_ai_insights_tenant_id ON ai_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_entity ON ai_insights(referenced_entity_type, referenced_entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_severity ON ai_insights(severity);
CREATE INDEX IF NOT EXISTS idx_ai_insights_status ON ai_insights(status);

-- regulatory_intelligence
CREATE INDEX IF NOT EXISTS idx_reg_intel_ha_id ON regulatory_intelligence(ha_id);
CREATE INDEX IF NOT EXISTS idx_reg_intel_impact ON regulatory_intelligence(impact_level);
CREATE INDEX IF NOT EXISTS idx_reg_intel_published ON regulatory_intelligence(published_date DESC);

-- publishing_jobs
CREATE INDEX IF NOT EXISTS idx_publishing_tenant_id ON publishing_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_publishing_submission_id ON publishing_jobs(submission_id);
CREATE INDEX IF NOT EXISTS idx_publishing_status ON publishing_jobs(status);

-- audit_log
CREATE INDEX IF NOT EXISTS idx_audit_tenant_id ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_occurred_at ON audit_log(tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_log(user_id);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
