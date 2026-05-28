import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
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
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchInbox, claimRequest, resolveRequest } from '../requestSlice';
import { TypeBadge, PriorityBadge, StatusBadge, getDueDateInfo, STATUS_CONFIG } from './RequestBadges';
import { useToastify } from '../../../components/Toastify';
import type { Request } from '../types';

const REQUEST_TYPES = ['KEYWORD_APPROVAL', 'CONTENT_TASK', 'REVIEW', 'DOMAIN_TASK', 'GENERAL'];
const REQUEST_STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE', 'REJECTED', 'CANCELLED'];
const REQUEST_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const TYPE_LABEL: Record<string, string> = {
  KEYWORD_APPROVAL: 'Duyệt từ khoá', CONTENT_TASK: 'Nội dung', REVIEW: 'Review', DOMAIN_TASK: 'Tên miền', GENERAL: 'Chung',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xử lý', IN_PROGRESS: 'Đang xử lý', DONE: 'Hoàn thành', REJECTED: 'Từ chối', CANCELLED: 'Đã huỷ',
};
const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Thấp', NORMAL: 'Bình thường', HIGH: 'Cao', URGENT: 'Khẩn cấp',
};

export default function InboxPage({ tabsNode }: { tabsNode?: React.ReactNode }) {
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
      {/* Header Row: Tabs & Filter */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box sx={{ flexShrink: 0 }}>
          {tabsNode}
        </Box>

        {/* Filter Right */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: '0.85rem' }}>Loại yêu cầu</InputLabel>
            <Select value={filterType} label="Loại yêu cầu"
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              sx={{ borderRadius: 2, bgcolor: 'background.paper', height: 36, fontSize: '0.85rem' }}>
              <MenuItem value="" sx={{ fontSize: '0.85rem' }}>Tất cả</MenuItem>
              {REQUEST_TYPES.map((t) => <MenuItem key={t} value={t} sx={{ fontSize: '0.85rem' }}>{TYPE_LABEL[t] ?? t}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: '0.85rem' }}>Trạng thái</InputLabel>
            <Select value={filterStatus} label="Trạng thái"
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              sx={{ borderRadius: 2, bgcolor: 'background.paper', height: 36, fontSize: '0.85rem' }}>
              <MenuItem value="" sx={{ fontSize: '0.85rem' }}>Tất cả</MenuItem>
              {REQUEST_STATUSES.map((s) => <MenuItem key={s} value={s} sx={{ fontSize: '0.85rem' }}>{STATUS_LABEL[s] ?? s}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: '0.85rem' }}>Độ ưu tiên</InputLabel>
            <Select value={filterPriority} label="Độ ưu tiên"
              onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
              sx={{ borderRadius: 2, bgcolor: 'background.paper', height: 36, fontSize: '0.85rem' }}>
              <MenuItem value="" sx={{ fontSize: '0.85rem' }}>Tất cả</MenuItem>
              {REQUEST_PRIORITIES.map((p) => <MenuItem key={p} value={p} sx={{ fontSize: '0.85rem' }}>{PRIORITY_LABEL[p] ?? p}</MenuItem>)}
            </Select>
          </FormControl>
          {hasFilter && (
            <Button size="small" onClick={() => { setFilterType(''); setFilterStatus(''); setFilterPriority(''); setPage(1); }}
              sx={{ borderRadius: 2, color: 'text.secondary', fontSize: '0.78rem', minWidth: 'auto' }}>
              Xoá lọc
            </Button>
          )}
        </Box>
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
            background: 'linear-gradient(135deg, #e6f8f4, #cbf2e8)',
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
          const statusColor = STATUS_CONFIG[req.status]?.color ?? '#94a3b8';

          return (
            <Paper
              key={req.id}
              elevation={0}
              onClick={() => navigate(`/requests/${req.id}`)}
              sx={{
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                borderLeft: `4px solid ${statusColor}`,
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.15s',
                position: 'relative',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  borderLeftColor: statusColor,
                  bgcolor: '#fafafa',
                  transform: 'translateX(2px)',
                },
              }}
            >
              <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'stretch' }}>
                {/* Main content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {/* Badges row */}
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
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

                  {/* Bottom row: Attributes & From user */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <TypeBadge type={req.type} />
                      <PriorityBadge priority={req.priority} />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 'auto' }}>
                      {req.splitMode && req.participants.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            {doneCount}/{req.participants.length}
                          </Typography>
                          <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: 10, border: '2px solid #fff' } }}>
                            {req.participants.map((p) => (
                              <Avatar key={p.user.id} src={p.user.imgAvatar}>{p.user.name?.[0]}</Avatar>
                            ))}
                          </AvatarGroup>
                          <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25 }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
                          {new Date(req.updatedAt || req.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <PersonOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          <Avatar src={req.fromUser?.imgAvatar} sx={{ width: 18, height: 18, fontSize: 10 }}>
                            {req.fromUser?.name?.[0]}
                          </Avatar>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            Người gửi: {req.fromUser?.name}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Actions */}
                <Box
                  onClick={(e) => e.stopPropagation()}
                  sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0, alignItems: 'flex-end', alignSelf: 'stretch' }}
                >
                  <Box sx={{ flexGrow: 1 }} />

                  {/* Buttons */}
                  {(canClaim || canResolve) && (
                    <Box sx={{ display: 'flex', gap: 0.75, mt: 'auto' }}>
                      {canClaim && (
                        <Button
                          size="small"
                          onClick={() => handleClaim(req)}
                          disabled={actionLoading}
                          sx={{
                            borderRadius: 1.5, fontWeight: 700, fontSize: '0.72rem', px: 1.5, py: 0.25, minWidth: 0,
                            background: 'linear-gradient(135deg, #00b894, #00cec9)',
                            boxShadow: '0 2px 8px rgba(0,184,148,0.3)',
                            color: 'primary.contrastText',
                            whiteSpace: 'nowrap',
                            '&:hover': { boxShadow: '0 4px 12px rgba(0,184,148,0.4)' },
                          }}
                        >
                          Nhận việc
                        </Button>
                      )}
                      {canResolve && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openResolve(req)}
                          sx={{ borderRadius: 1.5, fontWeight: 600, fontSize: '0.72rem', px: 1.5, py: 0.25, minWidth: 0, whiteSpace: 'nowrap', color: '#00b894', borderColor: '#a7f3d0', bgcolor: '#ecfdf5', '&:hover': { bgcolor: '#d1fae5', borderColor: '#6ee7b7' } }}
                        >
                          Xử lý
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Absolute Progress (split mode) */}
              {req.splitMode && req.participants.length > 0 && (
                <LinearProgress
                  variant="determinate"
                  value={(doneCount / req.participants.length) * 100}
                  sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: '#cbd5e1' } }}
                />
              )}
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
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
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
