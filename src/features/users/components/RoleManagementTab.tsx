import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { roleService, type Role, type CreateRoleDto, type UpdateRoleDto } from '../roleService';
import { useToastify } from '../../../components/Toastify';

const EMPTY_CREATE: CreateRoleDto = { name: '', label: '', description: '' };
const EMPTY_UPDATE: UpdateRoleDto = { label: '', description: '' };

export default function RoleManagementTab() {
  const { showToast } = useToastify();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRoleDto>(EMPTY_CREATE);
  const [createErrors, setCreateErrors] = useState<Partial<CreateRoleDto>>({});
  const [createLoading, setCreateLoading] = useState(false);

  const [editRole, setEditRole] = useState<Role | null>(null);
  const [editForm, setEditForm] = useState<UpdateRoleDto>(EMPTY_UPDATE);
  const [editErrors, setEditErrors] = useState<Partial<UpdateRoleDto>>({});
  const [editLoading, setEditLoading] = useState(false);

  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await roleService.getAll();
      setRoles(data);
    } catch {
      setError('Không thể tải danh sách phân quyền.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  // ── Create ───────────────────────────────────────────────────────────────

  const handleCreateSubmit = async () => {
    const errs: Partial<CreateRoleDto> = {};
    if (!createForm.name.trim()) errs.name = 'Vui lòng nhập tên định danh';
    else if (!/^[A-Z0-9_]+$/.test(createForm.name)) errs.name = 'Chỉ dùng chữ HOA, số và dấu gạch dưới';
    if (!createForm.label.trim()) errs.label = 'Vui lòng nhập tên hiển thị';
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }

    setCreateLoading(true);
    try {
      const created = await roleService.create(createForm);
      setRoles((prev) => [...prev, created]);
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE);
      showToast('Tạo phân quyền thành công', 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Có lỗi xảy ra';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'danger');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateChange = (field: keyof CreateRoleDto, value: string) => {
    setCreateForm((p) => ({ ...p, [field]: field === 'name' ? value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') : value }));
    setCreateErrors((p) => ({ ...p, [field]: undefined }));
  };

  // ── Edit ─────────────────────────────────────────────────────────────────

  const openEdit = (role: Role) => {
    setEditRole(role);
    setEditForm({ label: role.label, description: role.description ?? '' });
    setEditErrors({});
  };

  const handleEditSubmit = async () => {
    if (!editRole) return;
    const errs: Partial<UpdateRoleDto> = {};
    if (!editForm.label?.trim()) errs.label = 'Vui lòng nhập tên hiển thị';
    if (Object.keys(errs).length) { setEditErrors(errs); return; }

    setEditLoading(true);
    try {
      const updated = await roleService.update(editRole._id, editForm);
      setRoles((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      setEditRole(null);
      showToast('Cập nhật phân quyền thành công', 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Có lỗi xảy ra';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'danger');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!deleteRole) return;
    setDeleteLoading(true);
    try {
      await roleService.remove(deleteRole._id);
      setRoles((prev) => prev.filter((r) => r._id !== deleteRole._id));
      setDeleteRole(null);
      showToast('Xóa phân quyền thành công', 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Có lỗi xảy ra';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'danger');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 14 }}>
          Danh sách phân quyền ({roles.length})
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => { setCreateForm(EMPTY_CREATE); setCreateErrors({}); setCreateOpen(true); }}>
          Tạo phân quyền
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Tên định danh</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tên hiển thị</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Mô tả</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Loại</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                    Chưa có phân quyền nào
                  </TableCell>
                </TableRow>
              )}
              {roles.map((role) => (
                <TableRow key={role._id} hover>
                  <TableCell>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>
                      {role.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{role.label}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{role.description || '—'}</TableCell>
                  <TableCell>
                    {role.isSystem ? (
                      <Chip label="Hệ thống" size="small" color="primary" variant="outlined" />
                    ) : (
                      <Chip label="Tuỳ chỉnh" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Chỉnh sửa">
                      <IconButton size="small" onClick={() => openEdit(role)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={role.isSystem ? 'Không thể xóa vai trò hệ thống' : 'Xóa'}>
                      <span>
                        <IconButton size="small" color="error" disabled={role.isSystem} onClick={() => setDeleteRole(role)}>
                          <DeleteOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Tạo phân quyền mới
          <IconButton size="small" onClick={() => setCreateOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5 }}>
          <TextField
            label="Tên định danh"
            value={createForm.name}
            onChange={(e) => handleCreateChange('name', e.target.value)}
            error={Boolean(createErrors.name)}
            helperText={createErrors.name || 'Ví dụ: SEO_MANAGER — chỉ chữ HOA, số và _'}
            fullWidth
            autoFocus
          />
          <TextField
            label="Tên hiển thị"
            value={createForm.label}
            onChange={(e) => handleCreateChange('label', e.target.value)}
            error={Boolean(createErrors.label)}
            helperText={createErrors.label || 'Ví dụ: Quản lý SEO'}
            fullWidth
          />
          <TextField
            label="Mô tả (tuỳ chọn)"
            value={createForm.description}
            onChange={(e) => handleCreateChange('description', e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="text" color="inherit" onClick={() => setCreateOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleCreateSubmit} disabled={createLoading}>
            {createLoading ? 'Đang tạo...' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={Boolean(editRole)} onClose={() => setEditRole(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Chỉnh sửa phân quyền
          <IconButton size="small" onClick={() => setEditRole(null)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5 }}>
          <TextField
            label="Tên định danh"
            value={editRole?.name ?? ''}
            disabled
            fullWidth
            helperText="Tên định danh không thể thay đổi"
          />
          <TextField
            label="Tên hiển thị"
            value={editForm.label ?? ''}
            onChange={(e) => { setEditForm((p) => ({ ...p, label: e.target.value })); setEditErrors((p) => ({ ...p, label: undefined })); }}
            error={Boolean(editErrors.label)}
            helperText={editErrors.label}
            fullWidth
            autoFocus
          />
          <TextField
            label="Mô tả (tuỳ chọn)"
            value={editForm.description ?? ''}
            onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
            multiline
            rows={2}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="text" color="inherit" onClick={() => setEditRole(null)}>Hủy</Button>
          <Button variant="contained" onClick={handleEditSubmit} disabled={editLoading}>
            {editLoading ? 'Đang lưu...' : 'Cập nhật'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={Boolean(deleteRole)} onClose={() => setDeleteRole(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc muốn xóa phân quyền <strong>{deleteRole?.label}</strong>?
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="text" color="inherit" onClick={() => setDeleteRole(null)}>Hủy</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleteLoading}>
            {deleteLoading ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
