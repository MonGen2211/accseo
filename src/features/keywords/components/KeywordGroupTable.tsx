import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Select, MenuItem, FormControl, InputLabel, Link,
  Table, TableHead, TableBody, TableRow, TableCell, TableSortLabel,
  Collapse, Avatar, Chip, Tooltip, IconButton, CircularProgress,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DoNotDisturbAltOutlinedIcon from '@mui/icons-material/DoNotDisturbAltOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { approveKeywordGroup, rejectKeywordGroup } from '../keywordGroupSlice';
import { useRole } from '../../../hooks/useRole';
import { useToastify } from '../../../components/Toastify';
import type { KeywordGroup } from '../types';

interface KeywordGroupTableProps {
  data: KeywordGroup[];
  loading: boolean;
  total: number;
  page: number;
  limit: number;
  generateAiGroupsLoading?: boolean;
  deleteLoadingId?: string | null;
  statusLoadingId?: string | null;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newLimit: number) => void;
  onOpenCreate: () => void;
  onAiGenerateByGroups?: () => void;
  onDelete?: (row: KeywordGroup) => void;
  onStatusChange?: (row: KeywordGroup, newStatus: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending_approval: { label: 'Chờ duyệt',       color: '#D97706' },
  not_started:      { label: 'Chưa triển khai',  color: '#6B7280' },
  in_progress:      { label: 'Đang triển khai',  color: '#2563EB' },
  deployed:         { label: 'Đã triển khai',    color: '#059669' },
  rejected:         { label: 'Bị từ chối',       color: '#DC2626' },
};

function StatusChip({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: '#6B7280' };
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{ bgcolor: `${cfg.color}1A`, color: cfg.color, fontWeight: 600, fontSize: 11, border: `1px solid ${cfg.color}40` }}
    />
  );
}

// === THAY THẾ HÀM NÀY ===
function UserCell({ user }: { user?: any }) {   // cho phép any để an toàn
  if (!user) {
    return <Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>;
  }

  // Xử lý cả 2 trường hợp: user là Object hoặc chỉ là string (ID)
  const name = typeof user === 'object' && user !== null ? user.name : '';
  const imgAvatar = typeof user === 'object' && user !== null ? user.imgAvatar : undefined;

  if (!name) {
    return <Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar 
        src={imgAvatar} 
        sx={{ width: 26, height: 26, fontSize: 11 }}
      >
        {name?.[0] || '?'}
      </Avatar>
      <Typography variant="body2" sx={{ fontSize: 13 }}>{name}</Typography>
    </Box>
  );
}

const aiButtonSx = (isLoading: boolean) => ({
  borderRadius: 2, textTransform: 'none' as const, fontWeight: 700,
  background: isLoading ? '#94a3b8' : 'linear-gradient(45deg, #6366f1 30%, #8b5cf6 90%)',
  boxShadow: isLoading ? 'none' : '0 3px 5px 2px rgba(99,102,241,.3)',
  color: 'white',
  '&:hover': { background: 'linear-gradient(45deg, #8b5cf6 30%, #6366f1 90%)' },
  ...(isLoading && { animation: 'aiPulse 1.5s ease-in-out infinite', '@keyframes aiPulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } } }),
});

export function KeywordGroupTable({
  data, loading, total, page, limit,
  generateAiGroupsLoading = false,
  deleteLoadingId: _deleteLoadingId, statusLoadingId: _statusLoadingId,
  onPageChange, onRowsPerPageChange, onOpenCreate, onAiGenerateByGroups,
  onDelete: _onDelete, onStatusChange: _onStatusChange,
  sortBy, sortOrder, onSort,
  statusFilter, onStatusFilterChange,
}: KeywordGroupTableProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToastify();
  const { approveLoadingId } = useAppSelector((s) => s.keywordGroups);
  const currentUser = useAppSelector((s) => s.auth.user);
  const canApprove = useRole(['REVIEWER', 'MAR_SPECIALIST']);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approveDialog, setApproveDialog] = useState<{ group: KeywordGroup; action: 'approve' | 'reject' } | null>(null);
  const [actionReason, setActionReason] = useState('');

  const getId = (g: KeywordGroup) => (g as { _id?: string })._id || g.id;

  const handleRowClick = (g: KeywordGroup) => {
    const id = getId(g);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const openApproveDialog = (e: React.MouseEvent, group: KeywordGroup, action: 'approve' | 'reject') => {
    e.stopPropagation();
    setApproveDialog({ group, action });
    setActionReason('');
  };

  const handleSendApproval = (e: React.MouseEvent, group: KeywordGroup) => {
    e.stopPropagation();
    navigate('/requests/create', {
      state: {
        title: `Duyệt bộ keyword: ${group.name}`,
        type: 'KEYWORD_APPROVAL',
        assignmentType: 'role',
        toRole: 'REVIEWER',
        priority: 'NORMAL',
        refType: 'keyword_group',
        refId: getId(group),
        refDomainId: group.domainId,
      },
    });
  };

  const handleConfirmAction = async () => {
    if (!approveDialog) return;
    const { group, action } = approveDialog;
    const id = getId(group);
    const thunk = action === 'approve' ? approveKeywordGroup : rejectKeywordGroup;
    const result = await dispatch(thunk({ id, reason: actionReason || undefined }));
    if (!result.type.endsWith('/rejected')) {
      showToast(action === 'approve' ? 'Đã duyệt bộ keywords' : 'Đã từ chối bộ keywords', 'success');
      setApproveDialog(null);
    } else {
      showToast(String((result as { payload?: unknown }).payload ?? 'Lỗi'), 'danger');
    }
  };

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'pending_approval', label: 'Chờ duyệt' },
    { value: 'not_started', label: 'Chưa triển khai' },
    { value: 'in_progress', label: 'Đang triển khai' },
    { value: 'deployed', label: 'Đã triển khai' },
    { value: 'rejected', label: 'Bị từ chối' },
  ];

  return (
    <Box sx={{ px: 2, pb: 2 }}>
      {/* Header toolbar */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        {onStatusFilterChange && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel sx={{ fontSize: 14, top: '-1px' }}>Trạng thái</InputLabel>
            <Select
              label="Trạng thái"
              value={statusFilter || ''}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              sx={{ bgcolor: '#fff', borderRadius: 2, height: 40, '& .MuiSelect-select': { py: 1, fontSize: 14 } }}
            >
              {statusOptions.map((o) => (
                <MenuItem key={o.value} value={o.value} sx={{ fontSize: 14 }}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <Box sx={{ flex: 1 }} />
        {onAiGenerateByGroups && (
          <Button variant="contained" onClick={onAiGenerateByGroups} startIcon={!generateAiGroupsLoading && <AutoAwesomeIcon />} sx={aiButtonSx(generateAiGroupsLoading)}>
            {generateAiGroupsLoading ? 'Đang tạo bằng AI... (Xem tiến trình)' : 'Tạo bằng AI'}
          </Button>
        )}
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={onOpenCreate} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
          Tạo mới
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell width={40} align="center">STT</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortOrder : 'asc'}
                    onClick={() => onSort?.('name')}
                  >
                    Tên Bộ Keywords
                  </TableSortLabel>
                </TableCell>
                <TableCell width={160}>Người tạo</TableCell>
                <TableCell width={160}>Người duyệt</TableCell>
                <TableCell width={140}>
                  <TableSortLabel
                    active={sortBy === 'status'}
                    direction={sortBy === 'status' ? sortOrder : 'asc'}
                    onClick={() => onSort?.('status')}
                  >
                    Trạng thái
                  </TableSortLabel>
                </TableCell>
                {canApprove && <TableCell width={100} align="center">Thao tác</TableCell>}
                <TableCell width={36} />
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canApprove ? 7 : 6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canApprove ? 7 : 6} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : data.map((group, idx) => {
                const id = getId(group);
                const isExpanded = expandedId === id;
                const isApproving = approveLoadingId === id;
                const colSpan = canApprove ? 7 : 6;

                return (
                  <>
                    <TableRow
                      key={id}
                      hover
                      sx={{ cursor: 'pointer', '& td': { borderBottom: isExpanded ? 0 : undefined } }}
                      onClick={() => handleRowClick(group)}
                    >
                      <TableCell align="center" sx={{ color: 'text.secondary', fontSize: 13 }}>
                        {page * limit + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`https://trends.google.com.vn/trends/explore?date=today%203-m&geo=VN&q=${encodeURIComponent(String(group.name || ''))}&hl=vi`}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="none"
                          onClick={(e) => e.stopPropagation()}
                          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.primary', fontSize: 13, fontWeight: 500, '&:hover': { color: 'primary.main' } }}
                        >
                          {/* === ĐÃ SỬA === */}
                          {group.name 
                            ? (group.name.charAt(0).toUpperCase() + group.name.slice(1))
                            : 'Không có tên'}
                          <OpenInNewIcon sx={{ fontSize: 13, opacity: 0.45, flexShrink: 0 }} />
                        </Link>
                      </TableCell>
                      <TableCell><UserCell user={group.createdBy} /></TableCell>
                      <TableCell><UserCell user={group.approvedBy} /></TableCell>
                      <TableCell>
                        <StatusChip status={(group as { status?: string }).status ?? 'not_started'} />
                      </TableCell>
                      {canApprove && (
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          {(group as { status?: string }).status === 'pending_approval' && (
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="Duyệt">
                                <IconButton size="small" color="success" disabled={isApproving} onClick={(e) => openApproveDialog(e, group, 'approve')}>
                                  {isApproving ? <CircularProgress size={16} /> : <CheckCircleOutlinedIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Từ chối">
                                <IconButton size="small" color="error" disabled={isApproving} onClick={(e) => openApproveDialog(e, group, 'reject')}>
                                  <DoNotDisturbAltOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </TableCell>
                      )}
                      <TableCell align="center" sx={{ pr: 1 }}>
                        {isExpanded ? <KeyboardArrowUpIcon fontSize="small" sx={{ color: 'text.disabled' }} /> : <KeyboardArrowDownIcon fontSize="small" sx={{ color: 'text.disabled' }} />}
                      </TableCell>
                    </TableRow>

                    {/* Expand row */}
                    <TableRow key={`${id}-expand`}>
                      <TableCell colSpan={colSpan} sx={{ p: 0, border: 0 }}>
                        <Collapse in={isExpanded} unmountOnExit>
                          <Box sx={{ px: 3, py: 2, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {group.reason && (
                              <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                  Lý do đề xuất
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>{group.reason}</Typography>
                              </Box>
                            )}

                            {(group as { status?: string }).status === 'rejected' && (
                              <Box>
                                <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                  Lý do từ chối
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5, color: 'error.main' }}>
                                  {group.approvalReason ?? 'Không có lý do cụ thể'}
                                </Typography>
                              </Box>
                            )}

                            {!group.reason && (group as { status?: string }).status !== 'rejected' && (
                              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                Không có thông tin bổ sung
                              </Typography>
                            )}

                            {!canApprove
                              && (group as { status?: string }).status === 'pending_approval'
                              && group.createdBy?._id === currentUser?.id && (
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 0.5 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<SendOutlinedIcon />}
                                  onClick={(e) => handleSendApproval(e, group)}
                                  sx={{ textTransform: 'none', fontWeight: 600 }}
                                >
                                  Gửi duyệt
                                </Button>
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                );
              })}
            </TableBody>
          </Table>
        </Box>

        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={limit}
          onPageChange={(_, p) => onPageChange(p)}
          onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Hàng/trang"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
        />
      </Paper>

      {/* Approve / Reject dialog */}
      <Dialog open={!!approveDialog} onClose={() => setApproveDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {approveDialog?.action === 'approve' ? '✅ Duyệt bộ keywords' : '❌ Từ chối bộ keywords'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Bộ: <strong>{approveDialog?.group.name || 'Không có tên'}</strong>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Lý do (tuỳ chọn)"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            placeholder={approveDialog?.action === 'approve' ? 'Nội dung ổn, đồng ý triển khai...' : 'Từ khoá chưa phù hợp với chiến lược...'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(null)}>Huỷ</Button>
          <Button
            variant="contained"
            color={approveDialog?.action === 'approve' ? 'success' : 'error'}
            onClick={handleConfirmAction}
            disabled={!!approveLoadingId}
          >
            {approveDialog?.action === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}