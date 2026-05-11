import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SearchIcon from '@mui/icons-material/Search';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchGroups, deleteGroup } from '../groupSlice';
import { useToastify } from '../../../components/Toastify';
import { useRole } from '../../../hooks/useRole';
import { useDebounce } from '../../../hooks/useDebounce';
import type { Group } from '../types';

// Deterministic accent color per group based on name
const GROUP_ACCENTS = [
  { bg: 'linear-gradient(135deg, #16a34a, #22c55e)', light: '#dcfce7', text: '#15803d' },
  { bg: 'linear-gradient(135deg, #2563eb, #3b82f6)', light: '#dbeafe', text: '#1d4ed8' },
  { bg: 'linear-gradient(135deg, #7c3aed, #a855f7)', light: '#ede9fe', text: '#6d28d9' },
  { bg: 'linear-gradient(135deg, #db2777, #ec4899)', light: '#fce7f3', text: '#be185d' },
  { bg: 'linear-gradient(135deg, #d97706, #f59e0b)', light: '#fef3c7', text: '#b45309' },
  { bg: 'linear-gradient(135deg, #0891b2, #06b6d4)', light: '#cffafe', text: '#0e7490' },
];

const getAccent = (name: string) => GROUP_ACCENTS[name.charCodeAt(0) % GROUP_ACCENTS.length];

export default function GroupsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToastify();
  const isAdmin = useRole(['ADMIN']);
  const { items, loading, actionLoading, total, totalPages } = useAppSelector((s) => s.groups);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<Group | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    dispatch(fetchGroups({
      page,
      limit: 12,
      search: debouncedSearch || undefined,
      isActive: activeFilter === 'active' ? true : activeFilter === 'inactive' ? false : undefined,
    }));
  }, [dispatch, page, debouncedSearch, activeFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteGroup(deleteTarget.id));
    if (!result.type.endsWith('/rejected')) {
      showToast('Đã xoá nhóm', 'success');
      setDeleteTarget(null);
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
          background: 'linear-gradient(135deg, #16a34a, #22c55e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
          flexShrink: 0,
        }}>
          <GroupsOutlinedIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>Nhóm</Typography>
          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
            {total > 0 ? `${total} nhóm · Quản lý nhóm và thành viên` : 'Quản lý nhóm và thành viên'}
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={() => navigate('/groups/create')}
            sx={{
              borderRadius: 2, fontWeight: 700,
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
              '&:hover': { boxShadow: '0 4px 14px rgba(22,163,74,0.4)' },
            }}
          >
            Tạo nhóm
          </Button>
        )}
      </Box>

      {/* Filter bar */}
      <Box sx={{
        display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center',
        p: 1.5, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid', borderColor: 'divider',
      }}>
        <TextField
          size="small"
          placeholder="Tìm nhóm..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: 220, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }}
        />
        <ToggleButtonGroup
          size="small"
          value={activeFilter}
          exclusive
          onChange={(_, v) => { if (v) { setActiveFilter(v); setPage(1); } }}
          sx={{
            '& .MuiToggleButton-root': {
              borderRadius: '8px !important',
              fontWeight: 600,
              fontSize: '0.78rem',
              px: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              '&.Mui-selected': { bgcolor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
            },
          }}
        >
          <ToggleButton value="all">Tất cả</ToggleButton>
          <ToggleButton value="active">Hoạt động</ToggleButton>
          <ToggleButton value="inactive">Tắt</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress size={36} sx={{ color: '#16a34a' }} />
        </Box>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 12 }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2,
          }}>
            <GroupsOutlinedIcon sx={{ fontSize: 36, color: '#16a34a' }} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>Chưa có nhóm nào</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 2.5 }}>
            Tạo nhóm để phân công công việc dễ hơn
          </Typography>
          {isAdmin && (
            <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => navigate('/groups/create')}
              sx={{ borderRadius: 2, fontWeight: 700, background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
              Tạo nhóm đầu tiên
            </Button>
          )}
        </Box>
      )}

      {/* Group cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
        {items.map((group) => {
          const accent = getAccent(group.name);
          return (
            <Box key={group.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 10px)', md: 'calc(33.33% - 14px)' } }}>
              <Paper
                elevation={0}
                onClick={() => setExpandedGroup(group)}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
                    borderColor: 'transparent',
                  },
                }}
              >
                {/* Colored header */}
                <Box sx={{
                  p: 2.5, pb: 2,
                  background: group.isActive ? accent.bg : 'linear-gradient(135deg, #e2e8f0, #cbd5e1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                    <Box sx={{
                      width: 42, height: 42, borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.25)',
                      backdropFilter: 'blur(4px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <GroupsOutlinedIcon sx={{ color: '#fff', fontSize: 22 }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', lineHeight: 1.3 }} noWrap>
                        {group.name}
                      </Typography>
                      <Chip
                        label={group.isActive ? 'Hoạt động' : 'Tắt'}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.25)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 10,
                          height: 20,
                          mt: 0.25,
                          backdropFilter: 'blur(4px)',
                        }}
                      />
                    </Box>
                  </Box>

                  {isAdmin && (
                    <Box sx={{ display: 'flex', gap: 0.25, ml: 1 }} onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/groups/${group.id}/edit`)}
                        sx={{ color: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }, width: 30, height: 30 }}
                      >
                        <EditOutlinedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTarget(group)}
                        sx={{ color: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }, width: 30, height: 30 }}
                      >
                        <DeleteOutlinedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                {/* Body */}
                <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2" sx={{
                    color: 'text.secondary',
                    mb: 2,
                    flex: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.6,
                    minHeight: '3.2em',
                  }}>
                    {group.description || 'Không có mô tả'}
                  </Typography>

                  {/* Members */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <AvatarGroup
                      max={5}
                      sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 11, border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } }}
                    >
                      {group.members.map((m) => (
                        <Avatar key={m.id} src={m.imgAvatar} title={m.name}>{m.name?.[0]}</Avatar>
                      ))}
                    </AvatarGroup>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PeopleOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {group.members.length} thành viên
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 1.5 }} />

                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Tạo bởi{' '}
                    <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {group.createdBy?.name ?? '—'}
                    </Box>
                  </Typography>
                </Box>
              </Paper>
            </Box>
          );
        })}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Tổng <strong>{total}</strong> nhóm
          </Typography>
          <Pagination
            count={totalPages} page={page}
            onChange={(_, v) => setPage(v)}
            color="primary" shape="rounded"
            sx={{ '& .MuiPaginationItem-root': { borderRadius: 1.5 } }}
          />
        </Box>
      )}

      {/* Member list dialog */}
      <Dialog open={!!expandedGroup} onClose={() => setExpandedGroup(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        {expandedGroup && (
          <Box sx={{
            p: 3, pb: 2,
            background: getAccent(expandedGroup.name).bg,
            display: 'flex', alignItems: 'center', gap: 1.5,
          }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GroupsOutlinedIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{expandedGroup.name}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem' }}>
                {expandedGroup.members.length} thành viên
              </Typography>
            </Box>
          </Box>
        )}
        <DialogContent sx={{ p: 0 }}>
          {expandedGroup?.members.map((m, i) => (
            <Box
              key={m.id}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                px: 3, py: 1.5,
                borderBottom: i < (expandedGroup.members.length - 1) ? '1px solid' : 'none',
                borderColor: 'divider',
                '&:hover': { bgcolor: '#f8fafc' },
              }}
            >
              <Avatar src={m.imgAvatar} sx={{ width: 38, height: 38, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                {m.name?.[0]}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }} noWrap>{m.name}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>{m.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                <Chip label={m.role} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                {!m.isActive && <Chip label="Tắt" size="small" sx={{ bgcolor: '#f1f5f9', fontSize: 11 }} />}
              </Box>
            </Box>
          ))}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
          {isAdmin && expandedGroup && (
            <Button
              onClick={() => { navigate(`/groups/${expandedGroup.id}/edit`); setExpandedGroup(null); }}
              startIcon={<EditOutlinedIcon />}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Chỉnh sửa
            </Button>
          )}
          <Button onClick={() => setExpandedGroup(null)} variant="outlined" sx={{ borderRadius: 2 }}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xoá nhóm</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Typography>Bạn có chắc muốn xoá nhóm <strong>"{deleteTarget?.name}"</strong>?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ borderRadius: 2 }}>Huỷ</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={actionLoading}
            sx={{ borderRadius: 2, fontWeight: 700 }}>Xoá</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
