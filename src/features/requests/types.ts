export type RequestType = 'KEYWORD_APPROVAL' | 'CONTENT_TASK' | 'REVIEW' | 'DOMAIN_TASK' | 'GENERAL';
export type RequestPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type RequestStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'REJECTED' | 'CANCELLED';
export type AssignmentType = 'user' | 'role' | 'group';

export interface UserRef {
  id: string;
  name: string;
  email: string;
  imgAvatar?: string;
}

export interface GroupRef {
  id: string;
  name: string;
}

export interface Participant {
  user: UserRef;
  status: RequestStatus;
  claimedAt?: string;
  completedAt?: string;
  note?: string;
}

export interface Reminder {
  offsetHours: number;
  sent: boolean;
}

export interface Request {
  id: string;
  title: string;
  description: string;
  type: RequestType;
  priority: RequestPriority;
  status: RequestStatus;
  assignmentType: AssignmentType;
  fromUser: UserRef;
  toUser?: UserRef | null;
  toRole?: string | null;
  toGroup?: GroupRef | null;
  claimedBy?: UserRef | null;
  splitMode: boolean;
  participants: Participant[];
  dueDate?: string | null;
  reminders: Reminder[];
  completionNote?: string | null;
  refType?: string | null;
  refId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: UserRef;
  changes?: Record<string, unknown>;
  note?: string;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  imgAvatar?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: GroupMember[];
  createdBy: { id: string; name: string };
  isActive: boolean;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RequestState {
  inbox: Request[];
  outbox: Request[];
  current: Request | null;
  auditLogs: AuditLog[];
  loading: boolean;
  actionLoading: boolean;
  inboxTotal: number;
  inboxPages: number;
  outboxTotal: number;
  outboxPages: number;
  error: string | null;
}

export interface GroupState {
  items: Group[];
  current: Group | null;
  loading: boolean;
  actionLoading: boolean;
  total: number;
  totalPages: number;
  error: string | null;
}

export interface CreateRequestPayload {
  title: string;
  description: string;
  type: RequestType;
  priority: RequestPriority;
  assignmentType: AssignmentType;
  toUser?: string;
  toRole?: string;
  toGroup?: string;
  splitMode?: boolean;
  dueDate?: string;
  reminders?: { offsetHours: number }[];
  refType?: string;
  refId?: string;
}

export interface ResolvePayload {
  action: 'DONE' | 'REJECTED';
  note?: string;
}

export interface ReassignPayload {
  toUserId: string;
  note?: string;
}
