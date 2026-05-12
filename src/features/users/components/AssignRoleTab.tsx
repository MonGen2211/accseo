import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import { roleService, type Role } from '../roleService';
import { userService } from '../userService';
import type { UserProfile } from '../../../types/user.types';
import { useToastify } from '../../../components/Toastify';
import { useDebounce } from '../../../hooks/useDebounce';

interface UserWithRoles extends UserProfile {
  roles: string[];
}

export default function AssignRoleTab() {
  const { showToast } = useToastify();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [assignUser, setAssignUser] = useState<UserWithRoles | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, rolesData] = await Promise.all([
        userService.getAll(page + 1, rowsPerPage, debouncedSearch),
        allRoles.length === 0 ? roleService.getAll() : Promise.resolve(allRoles),
      ]);
      setTotal(usersData.total);

      const withRoles: UserWithRoles[] = usersData.items.map((u) => ({
        ...u,
        roles: u.role ? [u.role as string] : [],
      }));
      setUsers(withRoles);

      if (allRoles.length === 0) setAllRoles(rolesData as Role[]);
    } catch {
      setError('Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, debouncedSearch]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData(); }, [loadData]);

  const openAssign = (user: UserWithRoles) => {
    setAssignUser(user);
    setSelectedRoles(user.roles);
  };

  const handleToggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
    );
  };

  const handleAssignSubmit = async () => {
    if (!assignUser) return;
    setAssignLoading(true);
    try {
      await userService.update(assignUser.id, { roles: selectedRoles });
      setUsers((prev) =>
        prev.map((u) => u.id === assignUser.id ? { ...u, roles: selectedRoles } : u)
      );
      setAssignUser(null);
      showToast('Cập nhật phân quyền thành công', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message || 'Có lỗi xảy ra';
      showToast(Array.isArray(msg) ? (msg as string[]).join(', ') : String(msg), 'danger');
    } finally {
      setAssignLoading(false);
    }
  };

  const getRoleLabel = (roleName: string) => {
    const found = allRoles.find((r) => r.name === roleName);
    return found?.label || roleName;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 14 }}>
          Cấp quyền cho người dùng
        </Typography>
        <TextField
          size="small"
          placeholder="Tìm người dùng..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: 240 }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Người dùng</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Vai trò hiện tại</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                      Không có người dùng nào
                    </TableCell>
                  </TableRow>
                )}
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={user.imgAvatar ?? undefined}
                          sx={{ width: 32, height: 32, fontSize: 13 }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{user.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{user.email}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {user.roles.length === 0 ? (
                          <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>Chưa có vai trò</Typography>
                        ) : (
                          user.roles.map((r) => (
                            <Chip key={r} label={getRoleLabel(r)} size="small" variant="outlined" color="primary" />
                          ))
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ManageAccountsOutlinedIcon />}
                        onClick={() => openAssign(user)}
                      >
                        Cấp quyền
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
          />
        </>
      )}

      {/* Assign Roles Dialog */}
      <Dialog open={Boolean(assignUser)} onClose={() => setAssignUser(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontWeight: 700 }}>Cấp quyền</Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{assignUser?.name}</Typography>
          </Box>
          <IconButton size="small" onClick={() => setAssignUser(null)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {allRoles.length === 0 && (
                <Typography sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
                  Chưa có phân quyền nào. Hãy tạo phân quyền trước.
                </Typography>
              )}
              {allRoles.map((role) => (
                <FormControlLabel
                  key={role._id}
                  control={
                    <Checkbox
                      checked={selectedRoles.includes(role.name)}
                      onChange={() => handleToggleRole(role.name)}
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{role.label}</Typography>
                      {role.description && (
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{role.description}</Typography>
                      )}
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', py: 0.5 }}
                />
              ))}
            </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="text" color="inherit" onClick={() => setAssignUser(null)}>Hủy</Button>
          <Button variant="contained" onClick={handleAssignSubmit} disabled={assignLoading}>
            {assignLoading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
