/* eslint-disable react-refresh/only-export-components */
import Chip from '@mui/material/Chip';
import type { RequestType, RequestPriority, RequestStatus } from '../types';

const TYPE_CONFIG: Record<RequestType, { label: string; color: string }> = {
  KEYWORD_APPROVAL: { label: 'Duyệt từ khoá', color: '#7C3AED' },
  CONTENT_TASK: { label: 'Nội dung', color: '#0D9488' },
  REVIEW: { label: 'Review', color: '#4338CA' },
  DOMAIN_TASK: { label: 'Tên miền', color: '#0891B2' },
  GENERAL: { label: 'Chung', color: '#6B7280' },
};

const PRIORITY_CONFIG: Record<RequestPriority, { label: string; color: string }> = {
  LOW: { label: 'Thấp', color: '#6B7280' },
  NORMAL: { label: 'Bình thường', color: '#2563EB' },
  HIGH: { label: 'Cao', color: '#EA580C' },
  URGENT: { label: 'Khẩn cấp', color: '#DC2626' },
};

export const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xử lý', color: '#D97706' },
  IN_PROGRESS: { label: 'Đang xử lý', color: '#2563EB' },
  DONE: { label: 'Hoàn thành', color: '#059669' },
  REJECTED: { label: 'Từ chối', color: '#DC2626' },
  CANCELLED: { label: 'Đã huỷ', color: '#EF4444' },
};

const badgeChip = (label: string, color: string, size: 'small' | 'medium' = 'small') => (
  <Chip
    label={label}
    size={size}
    sx={{
      bgcolor: `${color}1A`,
      color,
      fontWeight: 600,
      fontSize: 11,
      height: 22,
      border: `1px solid ${color}40`,
    }}
  />
);

export const TypeBadge = ({ type }: { type: RequestType }) => {
  const cfg = TYPE_CONFIG[type] ?? { label: type, color: '#6B7280' };
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{
        bgcolor: '#f1f5f9',
        color: '#475569',
        fontWeight: 600,
        fontSize: 11,
        height: 22,
        border: '1px solid #cbd5e1',
      }}
    />
  );
};

export const PriorityBadge = ({ priority }: { priority: RequestPriority }) => {
  const cfg = PRIORITY_CONFIG[priority] ?? { label: priority, color: '#6B7280' };
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{
        bgcolor: '#f1f5f9',
        color: '#475569',
        fontWeight: 600,
        fontSize: 11,
        height: 22,
        border: '1px solid #cbd5e1',
      }}
    />
  );
};

export const StatusBadge = ({ status }: { status: RequestStatus }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: '#6B7280' };
  return badgeChip(cfg.label, cfg.color);
};

export const getDueDateInfo = (dueDate: string | null | undefined): { label: string; color: 'error' | 'warning' | 'default' } | null => {
  if (!dueDate) return null;
  const diff = new Date(dueDate).getTime() - Date.now();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    const over = Math.abs(days);
    return { label: over > 0 ? `Quá hạn ${over} ngày` : 'Quá hạn hôm nay', color: 'error' };
  }
  if (hours < 2) return { label: `Còn ${hours} giờ`, color: 'error' };
  if (days === 0) return { label: `Còn ${hours} giờ`, color: 'warning' };
  if (days === 1) return { label: 'Còn 1 ngày', color: 'warning' };
  return { label: `Còn ${days} ngày`, color: 'default' };
};
