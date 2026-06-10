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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { roleService, type Role } from '../roleService';
import api from '../../../utils/api';
import { useToastify } from '../../../components/Toastify';

const ALWAYS_ON_PAGES = ['dashboard', 'profile'] as const;

const CONFIGURABLE_PAGES: { key: string; label: string; description?: string }[] = [
  { key: 'domains', label: 'Quản lý Domain', description: 'Danh sách và chi tiết domain' },
  { key: 'keywords', label: 'Quản lý Keyword', description: 'Từ khoá, GSC, GA4 theo domain' },
  { key: 'requests', label: 'Yêu cầu', description: 'Hộp thư đến và tạo yêu cầu' },
  { key: 'users', label: 'Quản lý người dùng', description: 'Chỉ ADMIN mới nên có quyền này' },
  { key: 'settings', label: 'Cài đặt', description: 'Cài đặt hệ thống' },
  { key: 'trending-schedules', label: 'Lịch sync trending', description: 'Cấu hình lịch tự động sync Google Trending' },
];

const METHOD_COLORS: Record<string, string> = {
  GET: '#2e7d32',
  POST: '#1565c0',
  PUT: '#e65100',
  PATCH: '#6a1b9a',
  DELETE: '#c62828',
};

const pillButtonSx = {
  borderRadius: '100px',
  textTransform: 'none' as const,
  px: 2.5,
  height: 36,
  fontWeight: 500,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
  },
};

// ── Types theo response thực tế của BE ───────────────────────────────────────
interface ApiItem {
  key: string;   // vd: "GET /api/v1/users"
  label: string; // vd: "Xem danh sách người dùng"
}

interface ApiModule {
  module: string;
  apis: ApiItem[];
}

interface RolePermission {
  role: string;
  pages: string[];
  apis?: string[];
}

// ── API calls ─────────────────────────────────────────────────────────────────

async function fetchAvailableApis(): Promise<ApiModule[]> {
  try {
    const res = await api.get<{ data: ApiModule[] }>('/role-permissions/available-apis');
    return Array.isArray(res.data.data) ? res.data.data : [];
  } catch {
    return [];
  }
}

async function fetchRolePermission(roleName: string): Promise<RolePermission> {
  try {
    const res = await api.get<{ data: RolePermission | null }>(`/role-permissions/${roleName}`);
    return res.data.data ?? { role: roleName, pages: [], apis: [] };
  } catch {
    return { role: roleName, pages: [], apis: [] };
  }
}

type InnerTab = 'pages' | 'apis';

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractMethod(key: string): string {
  return key.split(' ')[0] ?? '';
}

function extractPath(key: string): string {
  return key.split(' ').slice(1).join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────

export default function RolePermissionsTab() {
  const { showToast } = useToastify();
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [innerTab, setInnerTab] = useState<InnerTab>('pages');

  // Tab Trang
  const [checkedPages, setCheckedPages] = useState<string[]>([]);

  // Tab Chức năng
  const [apiModules, setApiModules] = useState<ApiModule[]>([]);
  const [apisLoading, setApisLoading] = useState(false);
  const [blockedApis, setBlockedApis] = useState<string[]>([]);

  const [permLoading, setPermLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      const fetchedRoles = await roleService.getAll();
      setRoles(fetchedRoles);
      
      // Auto select admin role if available
      const adminRole = fetchedRoles.find((r) => r.name === 'ADMIN');
      if (adminRole) {
        setSelectedRole(adminRole);
        setPermLoading(true);
        try {
          const perm = await fetchRolePermission(adminRole.name);
          setCheckedPages(perm.pages.filter((p) => !(ALWAYS_ON_PAGES as readonly string[]).includes(p)));
          setBlockedApis(perm.apis ?? []);
        } finally {
          setPermLoading(false);
        }
      }
    } catch {
      setRolesError('Không thể tải danh sách vai trò.');
    } finally {
      setRolesLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadRoles(); }, [loadRoles]);

  // Load master list một lần khi mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApisLoading(true);
    fetchAvailableApis().then(setApiModules).finally(() => setApisLoading(false));
  }, []);

  const handleSelectRole = async (role: Role) => {
    if (dirty) {
      const ok = window.confirm('Bạn có thay đổi chưa lưu. Bỏ qua và chuyển vai trò?');
      if (!ok) return;
    }
    setSelectedRole(role);
    setDirty(false);
    setPermLoading(true);
    try {
      const perm = await fetchRolePermission(role.name);
      setCheckedPages(perm.pages.filter((p) => !(ALWAYS_ON_PAGES as readonly string[]).includes(p)));
      setBlockedApis(perm.apis ?? []);
    } finally {
      setPermLoading(false);
    }
  };

  // ── Tab Trang ─────────────────────────────────────────────────────────────

  const handleTogglePage = (pageKey: string) => {
    setCheckedPages((prev) =>
      prev.includes(pageKey) ? prev.filter((p) => p !== pageKey) : [...prev, pageKey]
    );
    setDirty(true);
  };

  const handleToggleAllPages = () => {
    setCheckedPages(
      checkedPages.length === CONFIGURABLE_PAGES.length ? [] : CONFIGURABLE_PAGES.map((p) => p.key)
    );
    setDirty(true);
  };

  // ── Tab Chức năng ─────────────────────────────────────────────────────────

  const handleToggleApi = (key: string) => {
    setBlockedApis((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
    setDirty(true);
  };

  const handleToggleModule = (apis: ApiItem[]) => {
    const keys = apis.map((a) => a.key);
    const noneBlocked = keys.every((k) => !blockedApis.includes(k));
    setBlockedApis((prev) =>
      noneBlocked
        ? [...new Set([...prev, ...keys])]
        : prev.filter((a) => !keys.includes(a))
    );
    setDirty(true);
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaveLoading(true);
    try {
      await api.put(`/role-permissions/${selectedRole.name}`, {
        pages: [...ALWAYS_ON_PAGES, ...checkedPages],
        apis: blockedApis,
      });
      setDirty(false);
      showToast(`Đã lưu quyền cho vai trò ${selectedRole.label}`, 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message || 'Có lỗi xảy ra';
      showToast(Array.isArray(msg) ? (msg as string[]).join(', ') : String(msg), 'danger');
    } finally {
      setSaveLoading(false);
    }
  };

  const allPagesChecked = checkedPages.length === CONFIGURABLE_PAGES.length;
  const somePagesChecked = checkedPages.length > 0 && !allPagesChecked;

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

      {/* ── Cột phải: nội dung ───────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!selectedRole ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'text.disabled' }}>
            <Typography sx={{ fontSize: 14 }}>← Chọn một vai trò để cấu hình quyền</Typography>
          </Box>
        ) : (
          <>
            {/* Header: tên role + nút lưu */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{selectedRole.label}</Typography>
                <Chip
                  label={selectedRole.name}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', fontSize: 11 }}
                />
                {dirty && <Chip label="Chưa lưu" size="small" color="warning" />}
              </Box>
              <Button
                variant="contained"
                size="small"
                startIcon={<SaveOutlinedIcon />}
                onClick={handleSave}
                disabled={saveLoading || !dirty || selectedRole.name === 'ADMIN'}
                sx={pillButtonSx}
              >
                {saveLoading ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </Box>

            {selectedRole.name === 'ADMIN' && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: '12px' }}>
                Vai trò Quản trị viên (ADMIN) có đầy đủ toàn quyền hệ thống và không thể thay đổi.
              </Alert>
            )}

            {/* Inner tabs */}
            <Tabs
              value={innerTab}
              onChange={(_, v) => setInnerTab(v as InnerTab)}
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider', 
                mb: 2, 
                minHeight: 36,
                '& .MuiTabs-indicator': {
                  display: 'none'
                },
                '& .MuiTab-root': { 
                  minHeight: 36, 
                  py: 0.75, 
                  fontSize: 13,
                  borderBottom: '2px solid transparent',
                  '&.Mui-selected': {
                    color: 'primary.main',
                    borderColor: 'primary.main',
                  }
                }
              }}
            >
              <Tab label="Trang" value="pages" sx={{ minHeight: 36, py: 0.75, fontSize: 13 }} />
              <Tab label="Chức năng" value="apis" sx={{ minHeight: 36, py: 0.75, fontSize: 13 }} />
            </Tabs>

            {permLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={28} />
              </Box>
            ) : innerTab === 'pages' ? (
              // ── Tab Trang ──────────────────────────────────────────────────
              <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5 }}>
                <Box sx={{ mb: 1.5, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={allPagesChecked}
                        indeterminate={somePagesChecked}
                        onChange={handleToggleAllPages}
                        size="small"
                        disabled={selectedRole.name === 'ADMIN'}
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
                          disabled={selectedRole.name === 'ADMIN'}
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
            ) : (
              // ── Tab Chức năng ──────────────────────────────────────────────
              apisLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : apiModules.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'text.disabled' }}>
                  <Typography sx={{ fontSize: 14 }}>Không có chức năng nào để cấu hình</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'auto' }}>
                  {apiModules.map(({ module, apis }) => {
                    const blockedCount = apis.filter((a) => blockedApis.includes(a.key)).length;
                    const noneBlocked = blockedCount === 0;
                    const allBlocked = blockedCount === apis.length;

                    return (
                      <Paper key={module} variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                        {/* Module header */}
                        <Box sx={{ mb: 1, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={noneBlocked}
                                indeterminate={!noneBlocked && !allBlocked}
                                onChange={() => handleToggleModule(apis)}
                                size="small"
                                disabled={selectedRole.name === 'ADMIN'}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{module}</Typography>
                                {blockedCount > 0 && (
                                  <Chip
                                    label={`${blockedCount} bị chặn`}
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    sx={{ height: 18, fontSize: 11 }}
                                  />
                                )}
                              </Box>
                            }
                            sx={{ m: 0 }}
                          />
                        </Box>

                        {/* API list */}
                        <FormGroup sx={{ gap: 0.25, pl: 0.5 }}>
                          {apis.map((item) => {
                            const isBlocked = blockedApis.includes(item.key);
                            const method = extractMethod(item.key);
                            const path = extractPath(item.key);
                            return (
                              <FormControlLabel
                                key={item.key}
                                control={
                                  <Checkbox
                                    checked={!isBlocked}
                                    onChange={() => handleToggleApi(item.key)}
                                    size="small"
                                    disabled={selectedRole.name === 'ADMIN'}
                                  />
                                }
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip
                                      label={method}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: 10,
                                        fontWeight: 700,
                                        fontFamily: 'monospace',
                                        bgcolor: METHOD_COLORS[method] ?? 'grey.500',
                                        color: 'primary.contrastText',
                                        borderRadius: 1,
                                      }}
                                    />
                                    <Typography sx={{
                                      fontSize: 13,
                                      fontWeight: isBlocked ? 400 : 500,
                                      color: isBlocked ? 'text.disabled' : 'text.primary',
                                    }}>
                                      {item.label}
                                    </Typography>
                                    <Typography sx={{ fontSize: 11, color: 'text.disabled', fontFamily: 'monospace' }}>
                                      {path}
                                    </Typography>
                                  </Box>
                                }
                                sx={{ alignItems: 'center', py: 0.25 }}
                              />
                            );
                          })}
                        </FormGroup>
                      </Paper>
                    );
                  })}
                </Box>
              )
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
