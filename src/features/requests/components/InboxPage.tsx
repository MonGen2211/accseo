import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchInbox, claimRequest, resolveRequest } from '../requestSlice';
import { TypeBadge, PriorityBadge, StatusBadge, getDueDateInfo } from './RequestBadges';
import { useToastify } from '../../../components/Toastify';
import type { Request } from '../types';

const REQUEST_TYPES = ['KEYWORD_APPROVAL', 'CONTENT_TASK', 'REVIEW', 'DOMAIN_TASK', 'GENERAL'];
const REQUEST_STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE', 'REJECTED', 'CANCELLED'];
const REQUEST_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const PRIORITY_COLOR: Record<string, string> = {
  LOW: '#94a3b8', NORMAL: '#3b82f6', HIGH: '#f97316', URGENT: '#ef4444',
};
const TYPE_LABEL: Record<string, string> = {
  KEYWORD_APPROVAL: 'Duyệt từ khoá', CONTENT_TASK: 'Nội dung', REVIEW: 'Review', DOMAIN_TASK: 'Tên miền', GENERAL: 'Chung',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xử lý', IN_PROGRESS: 'Đang xử lý', DONE: 'Hoàn thành', REJECTED: 'Từ chối', CANCELLED: 'Đã huỷ',
};
const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Thấp', NORMAL: 'Bình thường', HIGH: 'Cao', URGENT: 'Khẩn cấp',
};

export default function InboxPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToastify();
  const { inbox, loading, actionLoading, inboxPages, error } = useAppSelector((s) => s.requests);
  const currentUser = useAppSelector((s) => s.auth.user);

  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<Request | null>(null);
  const [resolveAction, setResolveAction] = useState<'DONE' | 'REJECTED'>('DONE');
  const [resolveNote, setResolveNote] = useState('');

  const hasFilter = !!(filterType || filterStatus || filterPriority);

  useEffect(() => {
    dispatch(fetchInbox({
      page,
      limit: 12,
      type: filterType || undefined,
      status: filterStatus || undefined,
      priority: filterPriority || undefined,
    }));
  }, [dispatch, page, filterType, filterStatus, filterPriority]);

  const handleClaim = async (req: Request) => {
    const result = await dispatch(claimRequest(req.id));
    if (!result.type.endsWith('/rejected')) {
      showToast('Nhận việc thành công', 'success');
      dispatch(fetchInbox({ page, limit: 12 }));
    } else {
      showToast(String((result as { payload?: unknown }).payload ?? 'Lỗi nhận việc'), 'danger');
    }
  };

  const openResolve = (req: Request) => {
    setResolveTarget(req);
    setResolveAction('DONE');
    setResolveNote('');
    setResolveOpen(true);
  };

  const handleResolve = async () => {
    if (!resolveTarget) return;
    const result = await dispatch(resolveRequest({ id: resolveTarget.id, data: { action: resolveAction, note: resolveNote || undefined } }));
    if (!result.type.endsWith('/rejected')) {
      showToast(resolveAction === 'DONE' ? 'Đã hoàn thành' : 'Đã từ chối', 'success');
      setResolveOpen(false);
      dispatch(fetchInbox({ page, limit: 12 }));
    } else {
      showToast(String((result as { payload?: unknown }).payload ?? 'Lỗi'), 'danger');
    }
  };

  return (
    <Box sx={{ px: 3, pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: 3,
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
          flexShrink: 0,
        }}>
          <InboxOutlinedIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>Hộp thư đến</Typography>
          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
            Các yêu cầu được gửi đến bạn
          </Typography>
        </Box>
      </Box>

      {/* Filter bar */}
      <Box sx={{
        display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center',
        p: 1.5, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid', borderColor: 'divider',
      }}>
        <FilterListOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary', ml: 0.5 }} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Loại yêu cầu</InputLabel>
          <Select value={filterType} label="Loại yêu cầu"
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            sx={{ borderRadius: 2, bgcolor: '#fff' }}>
            <MenuItem value="">Tất cả</MenuItem>
            {REQUEST_TYPES.map((t) => <MenuItem key={t} value={t}>{TYPE_LABEL[t] ?? t}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select value={filterStatus} label="Trạng thái"
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            sx={{ borderRadius: 2, bgcolor: '#fff' }}>
            <MenuItem value="">Tất cả</MenuItem>
            {REQUEST_STATUSES.map((s) => <MenuItem key={s} value={s}>{STATUS_LABEL[s] ?? s}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Độ ưu tiên</InputLabel>
          <Select value={filterPriority} label="Độ ưu tiên"
            onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
            sx={{ borderRadius: 2, bgcolor: '#fff' }}>
            <MenuItem value="">Tất cả</MenuItem>
            {REQUEST_PRIORITIES.map((p) => <MenuItem key={p} value={p}>{PRIORITY_LABEL[p] ?? p}</MenuItem>)}
          </Select>
        </FormControl>
        {hasFilter && (
          <Button size="small" onClick={() => { setFilterType(''); setFilterStatus(''); setFilterPriority(''); setPage(1); }}
            sx={{ borderRadius: 2, color: 'text.secondary', fontSize: '0.78rem' }}>
            Xoá bộ lọc
          </Button>
        )}
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress size={36} sx={{ color: '#7c3aed' }} />
        </Box>
      )}

      {/* Error */}
      {!loading && error && inbox.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ color: 'error.main', fontSize: '0.9rem', mb: 1 }}>{error}</Typography>
          <Button size="small" variant="outlined" color="error"
            onClick={() => dispatch(fetchInbox({ page, limit: 12, type: filterType || undefined, status: filterStatus || undefined, priority: filterPriority || undefined }))}>
            Thử lại
          </Button>
        </Box>
      )}

      {/* Empty */}
      {!loading && !error && inbox.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 12 }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2,
          }}>
            <InboxOutlinedIcon sx={{ fontSize: 36, color: '#7c3aed' }} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>Hộp thư trống</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
            {hasFilter ? 'Không có yêu cầu nào khớp với bộ lọc' : 'Không có yêu cầu nào được gửi đến bạn'}
          </Typography>
        </Box>
      )}

      {/* Request list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {inbox.map((req) => {
          const due = getDueDateInfo(req.dueDate);
          const doneCount = req.participants.filter((p) => p.status === 'DONE').length;
          const canClaim = req.status === 'PENDING' && !req.splitMode && (
            req.assignmentType !== 'user' || currentUser?.id === req.toUser?.id
          );
          const canResolve = req.status === 'IN_PROGRESS' && (
            req.splitMode
              ? req.participants.some((p) => p.user.id === currentUser?.id && p.status !== 'DONE' && p.status !== 'REJECTED')
              : req.claimedBy?.id === currentUser?.id
          );
          const priorityColor = PRIORITY_COLOR[req.priority] ?? '#94a3b8';

          return (
            <Paper
              key={req.id}
              elevation={0}
              onClick={() => navigate(`/requests/${req.id}`)}
              sx={{
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                borderLeft: `4px solid ${priorityColor}`,
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.15s',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  borderLeftColor: priorityColor,
                  bgcolor: '#fafafa',
                  transform: 'translateX(2px)',
                },
              }}
            >
              <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                {/* Main content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {/* Badges row */}
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                    <TypeBadge type={req.type} />
                    <PriorityBadge priority={req.priority} />
                    <StatusBadge status={req.status} />
                    {due && (
                      <Chip
                        icon={<AccessTimeOutlinedIcon sx={{ fontSize: '12px !important' }} />}
                        label={due.label}
                        size="small"
                        color={due.color}
                        variant="outlined"
                        sx={{ fontSize: 11, height: 22 }}
                      />
                    )}
                  </Box>

                  {/* Title */}
                  <Typography sx={{
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    lineHeight: 1.4,
                    mb: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {req.title}
                  </Typography>

                  {/* From user */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <PersonOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    <Avatar src={req.fromUser?.imgAvatar} sx={{ width: 18, height: 18, fontSize: 10 }}>
                      {req.fromUser?.name?.[0]}
                    </Avatar>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      {req.fromUser?.name}
                    </Typography>
                  </Box>

                  {/* Progress (split mode) */}
                  {req.splitMode && req.participants.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Tiến độ nhóm</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#7c3aed' }}>
                          {doneCount}/{req.participants.length}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(doneCount / req.participants.length) * 100}
                        sx={{ borderRadius: 4, height: 5, bgcolor: '#ede9fe', '& .MuiLinearProgress-bar': { bgcolor: '#7c3aed' } }}
                      />
                    </Box>
                  )}
                </Box>

                {/* Action buttons */}
                {(canClaim || canResolve) && (
                  <Box
                    onClick={(e) => e.stopPropagation()}
                    sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, flexShrink: 0, alignSelf: 'center' }}
                  >
                    {canClaim && (
                      <Button
                        size="small"
                        variant="contained"
                        disabled={actionLoading}
                        onClick={() => handleClaim(req)}
                        sx={{
                          borderRadius: 2, fontWeight: 700, fontSize: '0.78rem',
                          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                          boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
                          whiteSpace: 'nowrap',
                          '&:hover': { boxShadow: '0 4px 12px rgba(124,58,237,0.4)' },
                        }}
                      >
                        Nhận việc
                      </Button>
                    )}
                    {canResolve && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        onClick={() => openResolve(req)}
                        sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                      >
                        Xử lý
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>

      {/* Pagination */}
      {inboxPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <Pagination
            count={inboxPages} page={page}
            onChange={(_, v) => setPage(v)}
            color="primary" shape="rounded"
            sx={{ '& .MuiPaginationItem-root': { borderRadius: 1.5 } }}
          />
        </Box>
      )}

      {/* Resolve Dialog */}
      <Dialog open={resolveOpen} onClose={() => setResolveOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Xử lý yêu cầu</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <RadioGroup value={resolveAction} onChange={(e) => setResolveAction(e.target.value as 'DONE' | 'REJECTED')} row sx={{ mb: 2.5 }}>
            <FormControlLabel value="DONE" control={<Radio color="success" />} label="Hoàn thành" />
            <FormControlLabel value="REJECTED" control={<Radio color="error" />} label="Từ chối" />
          </RadioGroup>
          <TextField fullWidth multiline rows={3} label="Ghi chú (tuỳ chọn)"
            value={resolveNote} onChange={(e) => setResolveNote(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setResolveOpen(false)} sx={{ borderRadius: 2 }}>Huỷ</Button>
          <Button variant="contained" onClick={handleResolve} disabled={actionLoading}
            color={resolveAction === 'DONE' ? 'success' : 'error'}
            sx={{ borderRadius: 2, fontWeight: 700 }}>
            {resolveAction === 'DONE' ? 'Xác nhận hoàn thành' : 'Xác nhận từ chối'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
