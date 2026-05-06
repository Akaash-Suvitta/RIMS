// Request/response DTO types for RegAxis RIM API

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Registration DTOs
export interface CreateRegistrationDto {
  productId: string;
  marketId: string;
  licenseNumber?: string;
  firstApprovalDate?: string; // ISO date string
  expiryDate?: string;        // ISO date string
  renewalDueDate?: string;    // ISO date string
  notes?: string;
}

export interface UpdateRegistrationDto {
  licenseNumber?: string;
  status?: 'draft' | 'active' | 'under_renewal' | 'expired' | 'withdrawn' | 'archived';
  firstApprovalDate?: string;
  expiryDate?: string;
  renewalDueDate?: string;
  notes?: string;
}

// Renewal DTOs
export interface CreateRenewalDto {
  registrationId: string;
  targetSubmissionDate?: string; // ISO date string
  notes?: string;
}

// Submission DTOs
export interface CreateSubmissionDto {
  renewalId: string;
  referenceNumber?: string;
  metadata?: Record<string, unknown>;
}

// Task DTOs
export interface CreateTaskDto {
  renewalId: string;
  title: string;
  description?: string;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string; // ISO date string
}

// AI Copilot DTOs
export interface AiChatDto {
  message: string;
  contextEntityType?: 'registration' | 'renewal' | 'dossier' | 'submission';
  contextEntityId?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface AiChatResponse {
  reply: string;
  tokensUsed?: number;
}
