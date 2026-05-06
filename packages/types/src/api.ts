// Request/response DTO types and Zod schemas for RegAxis RIM API
import { z } from 'zod';

// ─── Legacy interfaces (kept for backward compatibility) ───────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  total: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

export const UuidSchema = z.string().uuid();
export const IsoDateSchema = z.string().datetime({ offset: true }).or(
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be ISO date (YYYY-MM-DD) or ISO datetime'),
);

export const PaginationQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;

// ─── Registrations ────────────────────────────────────────────────────────────

export const RegistrationStatusSchema = z.enum(['pending', 'active', 'suspended', 'lapsed', 'archived']);

export const CreateRegistrationSchema = z.object({
  productId: UuidSchema,
  marketId: UuidSchema,
  haId: UuidSchema,
  registrationNumber: z.string().min(1).optional(),
  registrationType: z.string().min(1),
  status: RegistrationStatusSchema.default('pending'),
  approvalDate: IsoDateSchema.optional(),
  expiryDate: IsoDateSchema.optional(),
  nextRenewalDue: IsoDateSchema.optional(),
  ownerUserId: UuidSchema.optional(),
  lifecycleStage: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateRegistrationSchema = z.object({
  registrationNumber: z.string().min(1).optional(),
  registrationType: z.string().min(1).optional(),
  status: RegistrationStatusSchema.optional(),
  approvalDate: IsoDateSchema.optional().nullable(),
  expiryDate: IsoDateSchema.optional().nullable(),
  nextRenewalDue: IsoDateSchema.optional().nullable(),
  ownerUserId: UuidSchema.optional().nullable(),
  lifecycleStage: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  renewalInitiated: z.boolean().optional(),
}).strict();

export const ListRegistrationsQuerySchema = PaginationQuerySchema.extend({
  status: RegistrationStatusSchema.optional(),
  market_id: UuidSchema.optional(),
  product_id: UuidSchema.optional(),
  ha_id: UuidSchema.optional(),
  expiring_within_days: z.coerce.number().int().min(0).optional(),
});

export type CreateRegistrationDto = z.infer<typeof CreateRegistrationSchema>;
export type UpdateRegistrationDto = z.infer<typeof UpdateRegistrationSchema>;
export type ListRegistrationsQuery = z.infer<typeof ListRegistrationsQuerySchema>;

// ─── Renewals ─────────────────────────────────────────────────────────────────

export const RenewalStatusSchema = z.enum(['upcoming', 'in_progress', 'submitted', 'approved', 'missed']);

export const CreateRenewalSchema = z.object({
  registrationId: UuidSchema,
  targetSubmissionDate: IsoDateSchema.optional(),
  assignedTo: UuidSchema.optional(),
  renewalNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateRenewalSchema = z.object({
  renewalNumber: z.string().optional().nullable(),
  status: RenewalStatusSchema.optional(),
  initiatedDate: IsoDateSchema.optional().nullable(),
  targetSubmissionDate: IsoDateSchema.optional().nullable(),
  submittedDate: IsoDateSchema.optional().nullable(),
  approvedDate: IsoDateSchema.optional().nullable(),
  renewalExpiryDate: IsoDateSchema.optional().nullable(),
  assignedTo: UuidSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
}).strict();

export const ListRenewalsQuerySchema = PaginationQuerySchema.extend({
  status: RenewalStatusSchema.optional(),
  due_before: IsoDateSchema.optional(),
  registration_id: UuidSchema.optional(),
});

export const CreateRenewalTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignedUserId: UuidSchema.optional(),
  dueDate: IsoDateSchema.optional(),
  sortOrder: z.number().int().default(0),
});

export const UpdateRenewalTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  assignedUserId: UuidSchema.optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'completed', 'blocked']).optional(),
  dueDate: IsoDateSchema.optional().nullable(),
  sortOrder: z.number().int().optional(),
}).strict();

export type CreateRenewalDto = z.infer<typeof CreateRenewalSchema>;
export type UpdateRenewalDto = z.infer<typeof UpdateRenewalSchema>;
export type CreateRenewalTaskDto = z.infer<typeof CreateRenewalTaskSchema>;
export type UpdateRenewalTaskDto = z.infer<typeof UpdateRenewalTaskSchema>;

// ─── Submissions ──────────────────────────────────────────────────────────────

export const SubmissionTypeSchema = z.enum([
  'ctd', 'nda', 'maa', 'ind', 'bla', 'jnda',
  'variation', 'renewal_application', 'annual_report',
]);

export const SubmissionStatusSchema = z.enum([
  'draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn',
]);

export const CreateSubmissionSchema = z.object({
  productId: UuidSchema,
  haId: UuidSchema,
  submissionType: SubmissionTypeSchema,
  dossierId: UuidSchema.optional(),
  internalRef: z.string().optional(),
  targetFileDate: IsoDateSchema.optional(),
  pdufaDate: IsoDateSchema.optional(),
  notes: z.string().optional(),
});

export const UpdateSubmissionSchema = z.object({
  submissionType: SubmissionTypeSchema.optional(),
  status: SubmissionStatusSchema.optional(),
  internalRef: z.string().optional().nullable(),
  targetFileDate: IsoDateSchema.optional().nullable(),
  actualFileDate: IsoDateSchema.optional().nullable(),
  pdufaDate: IsoDateSchema.optional().nullable(),
  acceptanceDate: IsoDateSchema.optional().nullable(),
  completenessPct: z.number().int().min(0).max(100).optional(),
  milestones: z.array(z.record(z.unknown())).optional(),
  notes: z.string().optional().nullable(),
}).strict();

export const ListSubmissionsQuerySchema = PaginationQuerySchema.extend({
  type: SubmissionTypeSchema.optional(),
  status: SubmissionStatusSchema.optional(),
  registration_id: UuidSchema.optional(),
  ha_id: UuidSchema.optional(),
});

export type CreateSubmissionDto = z.infer<typeof CreateSubmissionSchema>;
export type UpdateSubmissionDto = z.infer<typeof UpdateSubmissionSchema>;

// ─── Dossiers ─────────────────────────────────────────────────────────────────

export const DossierFormatSchema = z.enum([
  'ectd_v3', 'ectd_v4', 'eu_ctd', 'j_ctd',
  'anvisa_edossier', 'cdsco_format', 'nmpa_ctd', 'non_ectd',
]);

export const DossierStatusSchema = z.enum([
  'in_preparation', 'under_review', 'submission_ready', 'submitted', 'archived',
]);

export const CreateDossierSchema = z.object({
  productId: UuidSchema,
  name: z.string().min(1),
  dossierFormat: DossierFormatSchema.default('ectd_v4'),
  targetHaId: UuidSchema.optional(),
  notes: z.string().optional(),
});

export const UpdateDossierSchema = z.object({
  name: z.string().min(1).optional(),
  dossierFormat: DossierFormatSchema.optional(),
  status: DossierStatusSchema.optional(),
  targetHaId: UuidSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
}).strict();

export const ListDossiersQuerySchema = PaginationQuerySchema.extend({
  product_id: UuidSchema.optional(),
  status: DossierStatusSchema.optional(),
});

export const CreateDossierModuleSchema = z.object({
  parentModuleId: UuidSchema.optional(),
  moduleCode: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(['not_started', 'in_progress', 'complete', 'gap_identified', 'pending_review']).optional().default('not_started'),
  sortOrder: z.number().int().default(0),
  notes: z.string().optional(),
});

export type CreateDossierDto = z.infer<typeof CreateDossierSchema>;
export type UpdateDossierDto = z.infer<typeof UpdateDossierSchema>;
export type CreateDossierModuleDto = z.infer<typeof CreateDossierModuleSchema>;

// ─── Documents ────────────────────────────────────────────────────────────────

export const DocumentUploadContextSchema = z.object({
  type: z.enum(['dossier_section', 'submission']),
  id: UuidSchema,
});

export const DocumentUploadUrlSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  context: DocumentUploadContextSchema.optional(),
});

export const ConfirmUploadSchema = z.object({
  documentId: UuidSchema,
});

export type DocumentUploadUrlDto = z.infer<typeof DocumentUploadUrlSchema>;
export type ConfirmUploadDto = z.infer<typeof ConfirmUploadSchema>;

// ─── Products ─────────────────────────────────────────────────────────────────

export const ProductTypeSchema = z.enum([
  'small_molecule', 'biologic', 'biosimilar', 'vaccine',
  'gene_therapy', 'medical_device', 'combination_product',
]);

export const CreateProductSchema = z.object({
  name: z.string().min(1),
  brandName: z.string().optional(),
  internalCode: z.string().optional(),
  inn: z.string().optional(),
  atcCode: z.string().optional(),
  productType: ProductTypeSchema.default('small_molecule'),
  therapeuticArea: z.string().optional(),
  dosageForm: z.string().optional(),
  strength: z.string().optional(),
  routeOfAdmin: z.string().optional(),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1).optional(),
  brandName: z.string().optional().nullable(),
  internalCode: z.string().optional().nullable(),
  inn: z.string().optional().nullable(),
  atcCode: z.string().optional().nullable(),
  productType: ProductTypeSchema.optional(),
  therapeuticArea: z.string().optional().nullable(),
  dosageForm: z.string().optional().nullable(),
  strength: z.string().optional().nullable(),
  routeOfAdmin: z.string().optional().nullable(),
}).strict();

export const ListProductsQuerySchema = PaginationQuerySchema.extend({
  product_type: ProductTypeSchema.optional(),
  therapeutic_area: z.string().optional(),
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;

// ─── Labels ───────────────────────────────────────────────────────────────────

export const LabelTypeSchema = z.enum([
  'uspi', 'smpc', 'ccds', 'jpi', 'pil', 'patient_leaflet', 'prescribing_info',
]);

export const LabelStatusSchema = z.enum(['draft', 'review', 'approved', 'superseded']);

export const CreateLabelSchema = z.object({
  productId: UuidSchema,
  marketId: UuidSchema.optional(),
  labelType: LabelTypeSchema,
  status: LabelStatusSchema.default('draft'),
});

export const UpdateLabelSchema = z.object({
  status: LabelStatusSchema.optional(),
  marketId: UuidSchema.optional().nullable(),
}).strict();

export const ApproveLabelSchema = z.object({
  versionId: UuidSchema,
});

export const ListLabelsQuerySchema = PaginationQuerySchema.extend({
  product_id: UuidSchema.optional(),
  market_id: UuidSchema.optional(),
  status: LabelStatusSchema.optional(),
  label_type: LabelTypeSchema.optional(),
});

export type CreateLabelDto = z.infer<typeof CreateLabelSchema>;
export type UpdateLabelDto = z.infer<typeof UpdateLabelSchema>;
export type ApproveLabelDto = z.infer<typeof ApproveLabelSchema>;

// ─── AI Insights ──────────────────────────────────────────────────────────────

export const AiContextSchema = z.object({
  module: z.enum(['registration', 'renewal', 'submission', 'dossier', 'labeling', 'general']),
  entityId: UuidSchema.optional(),
});

export const AiChatSchema = z.object({
  message: z.string().min(1),
  context: AiContextSchema.optional(),
});

export const AiGapAnalysisSchema = z.object({
  registrationId: UuidSchema,
});

export const AiSubmissionReadinessSchema = z.object({
  submissionId: UuidSchema,
});

export type AiChatDto = z.infer<typeof AiChatSchema>;
export type AiGapAnalysisDto = z.infer<typeof AiGapAnalysisSchema>;
export type AiSubmissionReadinessDto = z.infer<typeof AiSubmissionReadinessSchema>;

// Legacy DTO (kept for backward compat)
export interface AiChatResponse {
  reply: string;
  tokensUsed?: number;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export const ListNotificationsQuerySchema = PaginationQuerySchema.extend({
  read: z.string().transform((v) => v === 'true').optional(),
});

export type ListNotificationsQuery = z.infer<typeof ListNotificationsQuerySchema>;

// ─── Admin ────────────────────────────────────────────────────────────────────

export const InviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum([
    'regulatory_lead',
    'regulatory_affairs_manager',
    'regulatory_affairs_specialist',
    'dossier_manager',
    'submission_coordinator',
    'labeling_specialist',
    'read_only',
    'external_reviewer',
  ]),
});

export const UpdateUserRoleSchema = z.object({
  role: z.enum([
    'super_admin',
    'regulatory_lead',
    'regulatory_affairs_manager',
    'regulatory_affairs_specialist',
    'dossier_manager',
    'submission_coordinator',
    'labeling_specialist',
    'read_only',
    'external_reviewer',
  ]),
});

export const CreateTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  plan: z.enum(['trial', 'demo', 'professional', 'enterprise']).default('trial'),
});

export const UpdateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  plan: z.enum(['trial', 'demo', 'professional', 'enterprise']).optional(),
  metadata: z.record(z.unknown()).optional(),
}).strict();

export type InviteUserDto = z.infer<typeof InviteUserSchema>;
export type UpdateUserRoleDto = z.infer<typeof UpdateUserRoleSchema>;
export type CreateTenantDto = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantDto = z.infer<typeof UpdateTenantSchema>;

// ─── Audit log ────────────────────────────────────────────────────────────────

export const ListAuditLogQuerySchema = PaginationQuerySchema.extend({
  entity_type: z.string().optional(),
  entity_id: UuidSchema.optional(),
  user_id: UuidSchema.optional(),
  action: z.enum(['create', 'update', 'delete', 'view', 'export']).optional(),
  from_date: IsoDateSchema.optional(),
  to_date: IsoDateSchema.optional(),
});

export type ListAuditLogQuery = z.infer<typeof ListAuditLogQuerySchema>;

// ─── Cursor-based pagination helper ──────────────────────────────────────────

export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
  total: number;
}
