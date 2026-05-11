import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { roleService, type Role } from '../roleService';
import api from '../../../utils/api';
import { useToastify } from '../../../components/Toastify';

// ── Trang luôn bật — không hiển thị trong UI nhưng luôn gửi kèm khi save ────
const ALWAYS_ON_PAGES = ['dashboard', 'profile'] as const;

// ── Trang cấu hình được — hiển thị và cho phép bật/tắt ───────────────────────
const CONFIGURABLE_PAGES: { key: string; label: string; description?: string }[] = [
  { key: 'domains', label: 'Quản lý Domain', description: 'Danh sách và chi tiết domain' },
  { key: 'keywords', label: 'Quản lý Keyword', description: 'Từ khoá, GSC, GA4 theo domain' },
  { key: 'requests', label: 'Yêu cầu', description: 'Hộp thư đến và tạo yêu cầu' },
  { key: 'users', label: 'Quản lý người dùng', description: 'Chỉ ADMIN mới nên có quyền này' },
  { key: 'settings', label: 'Cài đặt', description: 'Cài đặt hệ thống' },
];

interface RolePermission {
  role: string;
  pages: string[];
  apis?: string[];
}

async function fetchRolePermission(roleName: string): Promise<string[]> {
  try {
    const res = await api.get<{ data: RolePermission | null }>(`/role-permissions/${roleName}`);
    return res.data.data?.pages ?? [];
  } catch {
    return [];
  }
}

async function saveRolePermission(roleName: string, pages: string[]): Promise<void> {
  await api.put(`/role-permissions/${roleName}`, { pages });
}

export default function RolePermissionsTab() {
  const { showToast } = useToastify();
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [checkedPages, setCheckedPages] = useState<string[]>([]);
  const [permLoading, setPermLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      const data = await roleService.getAll();
      setRoles(data);
    } catch {
      setRolesError('Không thể tải danh sách vai trò.');
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const handleSelectRole = async (role: Role) => {
    if (dirty) {
      const ok = window.confirm('Bạn có thay đổi chưa lưu. Bỏ qua và chuyển vai trò?');
      if (!ok) return;
    }
    setSelectedRole(role);
    setDirty(false);
    setPermLoading(true);
    try {
      const pages = await fetchRolePermission(role.name);
      // strip always-on pages khỏi state — chúng không cần track vì luôn được gửi
      setCheckedPages(pages.filter((p) => !(ALWAYS_ON_PAGES as readonly string[]).includes(p)));
    } finally {
      setPermLoading(false);
    }
  };

  const handleTogglePage = (pageKey: string) => {
    setCheckedPages((prev) =>
      prev.includes(pageKey) ? prev.filter((p) => p !== pageKey) : [...prev, pageKey]
    );
    setDirty(true);
  };

  const handleToggleAll = () => {
    if (checkedPages.length === CONFIGURABLE_PAGES.length) {
      setCheckedPages([]);
    } else {
      setCheckedPages(CONFIGURABLE_PAGES.map((p) => p.key));
    }
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaveLoading(true);
    try {
      await saveRolePermission(selectedRole.name, [...ALWAYS_ON_PAGES, ...checkedPages]);
      setDirty(false);
      showToast(`Đã lưu quyền trang cho vai trò ${selectedRole.label}`, 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Có lỗi xảy ra';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'danger');
    } finally {
      setSaveLoading(false);
    }
  };

  const allChecked = checkedPages.length === CONFIGURABLE_PAGES.length;
  const someChecked = checkedPages.length > 0 && !allChecked;

  return (
    <Box sx={{ display: 'flex', gap: 3, minHeight: 420 }}>
      {/* ── Cột trái: danh sách vai trò ─────────────────────────────────── */}
      <Paper variant="outlined" sx={{ width: 220, flexShrink: 0, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary' }}>
            Chọn vai trò
          </Typography>
        </Box>

        {rolesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : rolesError ? (
          <Alert severity="error" sx={{ m: 1 }}>{rolesError}</Alert>
        ) : (
          <List dense disablePadding>
            {roles.map((role, idx) => (
              <Box key={role._id}>
                {idx > 0 && <Divider />}
                <ListItemButton
                  selected={selectedRole?._id === role._id}
                  onClick={() => handleSelectRole(role)}
                  sx={{ px: 2, py: 1.25 }}
                >
                  <ListItemText
                    primary={role.label}
                    secondary={role.name}
                    slotProps={{
                      primary: { style: { fontSize: 14, fontWeight: selectedRole?._id === role._id ? 600 : 400 } },
                      secondary: { style: { fontSize: 11, fontFamily: 'monospace' } },
                    }}
                  />
                </ListItemButton>
              </Box>
            ))}
          </List>
        )}
      </Paper>

      {/* ── Cột phải: danh sách trang ───────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!selectedRole ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'text.disabled' }}>
            <Typography sx={{ fontSize: 14 }}>← Chọn một vai trò để cấu hình quyền trang</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{selectedRole.label}</Typography>
                <Chip label={selectedRole.name} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 11 }} />
                {dirty && <Chip label="Chưa lưu" size="small" color="warning" />}
              </Box>
              <Button
                variant="contained"
                size="small"
                startIcon={<SaveOutlinedIcon />}
                onClick={handleSave}
                disabled={saveLoading || !dirty}
              >
                {saveLoading ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </Box>

            {permLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5 }}>
                <Box sx={{ mb: 1.5, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={allChecked}
                        indeterminate={someChecked}
                        onChange={handleToggleAll}
                        size="small"
                      />
                    }
                    label={
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                        Tất cả trang ({checkedPages.length}/{CONFIGURABLE_PAGES.length})
                      </Typography>
                    }
                  />
                </Box>
                <FormGroup sx={{ gap: 0.25 }}>
                  {CONFIGURABLE_PAGES.map((page) => (
                    <FormControlLabel
                      key={page.key}
                      control={
                        <Checkbox
                          checked={checkedPages.includes(page.key)}
                          onChange={() => handleTogglePage(page.key)}
                          size="small"
                        />
                      }
                      label={
                        <Box>
                          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{page.label}</Typography>
                          {page.description && (
                            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{page.description}</Typography>
                          )}
                        </Box>
                      }
                      sx={{ alignItems: 'flex-start', py: 0.5 }}
                    />
                  ))}
                </FormGroup>
              </Paper>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
