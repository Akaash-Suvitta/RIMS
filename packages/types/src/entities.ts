// Domain entity types for RegAxis RIM

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  preferences: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  tenantId: string;
  cognitoSub: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole =
  | 'super_admin'
  | 'regulatory_lead'
  | 'regulatory_affairs_manager'
  | 'regulatory_affairs_specialist'
  | 'dossier_manager'
  | 'submission_coordinator'
  | 'labeling_specialist'
  | 'read_only'
  | 'external_reviewer';

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  productCode: string;
  category: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Market {
  id: string;
  countryCode: string;
  countryName: string;
  regulatoryAuthority: string;
  region: string;
}

export type RegistrationStatus =
  | 'draft'
  | 'active'
  | 'under_renewal'
  | 'expired'
  | 'withdrawn'
  | 'archived';

export interface Registration {
  id: string;
  tenantId: string;
  productId: string;
  marketId: string;
  licenseNumber: string | null;
  status: RegistrationStatus;
  firstApprovalDate: Date | null;
  expiryDate: Date | null;
  renewalDueDate: Date | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RenewalStatus =
  | 'planned'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface Renewal {
  id: string;
  tenantId: string;
  registrationId: string;
  targetSubmissionDate: Date | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  status: RenewalStatus;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface RenewalTask {
  id: string;
  tenantId: string;
  renewalId: string;
  title: string;
  description: string | null;
  assignedTo: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  completedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SubmissionStatus =
  | 'draft'
  | 'ready'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface Submission {
  id: string;
  tenantId: string;
  renewalId: string;
  referenceNumber: string | null;
  status: SubmissionStatus;
  submittedAt: Date | null;
  acknowledgedAt: Date | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type DossierStatus = 'draft' | 'in_review' | 'approved' | 'archived';

export interface Dossier {
  id: string;
  tenantId: string;
  registrationId: string;
  title: string;
  status: DossierStatus;
  version: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DossierSection {
  id: string;
  tenantId: string;
  dossierId: string;
  title: string;
  sectionCode: string | null;
  sortOrder: number;
  content: string | null;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentStatus = 'pending' | 'uploaded' | 'processing' | 'ready' | 'error';

export interface Document {
  id: string;
  tenantId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  s3Key: string;
  status: DocumentStatus;
  uploadedBy: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Label {
  id: string;
  tenantId: string;
  productId: string;
  marketId: string;
  version: string;
  language: string;
  content: Record<string, unknown>;
  approvedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationChannel = 'in_app' | 'email';
export type NotificationType =
  | 'renewal_due'
  | 'submission_milestone'
  | 'task_assigned'
  | 'document_uploaded'
  | 'ha_query'
  | 'system';

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  isRead: boolean;
  entityType: string | null;
  entityId: string | null;
  sentAt: Date | null;
  createdAt: Date;
}

export type AuditAction = 'create' | 'update' | 'delete' | 'view' | 'export';

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}
