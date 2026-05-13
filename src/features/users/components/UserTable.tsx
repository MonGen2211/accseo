import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CloseIcon from '@mui/icons-material/Close';
import type { UserProfile } from '../../../types/user.types';
import { CustomTable } from '../../../components/custom-table';
import type { TableField } from '../../../types/tableFields.types';
import type { TableRowData } from '../../../types/tableRows.types';
import type { UserRole } from '../../../types/auth.types';
import { userService } from '../userService';
import { useToastify } from '../../../components/Toastify';

function generatePassword(): string {
	const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const lower = 'abcdefghijklmnopqrstuvwxyz';
	const digits = '0123456789';
	const special = '!@#$%^&*()_+-=';
	const all = upper + lower + digits + special;
	const pool = [
		upper[Math.floor(Math.random() * upper.length)],
		upper[Math.floor(Math.random() * upper.length)],
		lower[Math.floor(Math.random() * lower.length)],
		lower[Math.floor(Math.random() * lower.length)],
		digits[Math.floor(Math.random() * digits.length)],
		digits[Math.floor(Math.random() * digits.length)],
		special[Math.floor(Math.random() * special.length)],
		special[Math.floor(Math.random() * special.length)],
	];
	while (pool.length < 20) pool.push(all[Math.floor(Math.random() * all.length)]);
	return pool.sort(() => Math.random() - 0.5).join('');
}

const ROLE_LABELS: Record<UserRole, string> = {
	ADMIN: 'Quản trị viên',
	SEO_COLLABORATOR: 'Cộng tác viên SEO',
	MAR_SPECIALIST: 'Chuyên viên Marketing',
	REVIEWER: 'Người kiểm duyệt',
	CONTENT_SPECIALIST: 'Chuyên viên Content',
};

interface UserTableProps {
	users: UserProfile[];
	loading?: boolean;
	page?: number;
	rowsPerPage?: number;
	totalCount?: number;
	onPageChange?: (newPage: number) => void;
	onRowsPerPageChange?: (newLimit: number) => void;
	onEdit: (user: UserProfile) => void;
	onDelete: (id: string) => void;
	onStatusChange?: (user: UserProfile, newStatus: string) => void;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	headerActions?: React.ReactNode;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	onSort?: (field: string) => void;
}

export default function UserTable({
	users, loading, page, rowsPerPage, totalCount,
	onPageChange, onRowsPerPageChange, onEdit, onDelete, onStatusChange,
	searchValue, onSearchChange, headerActions, sortBy, sortOrder, onSort,
}: UserTableProps) {
	const { showToast } = useToastify();
	const [resetTarget, setResetTarget] = useState<UserProfile | null>(null);
	const [newPassword, setNewPassword] = useState('');
	const [resetLoading, setResetLoading] = useState(false);

	const openReset = (user: UserProfile) => {
		setResetTarget(user);
		setNewPassword(generatePassword());
	};

	const handleResetConfirm = async () => {
		if (!resetTarget) return;
		setResetLoading(true);
		try {
			await userService.resetPassword(resetTarget.id, newPassword);
			showToast(`Đã đặt lại mật khẩu cho ${resetTarget.name}`, 'success');
			setResetTarget(null);
		} catch (err: unknown) {
			const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message || 'Có lỗi xảy ra';
			showToast(Array.isArray(msg) ? (msg as string[]).join(', ') : String(msg), 'danger');
		} finally {
			setResetLoading(false);
		}
	};

	const fields: TableField[] = [
		{ id: 'stt', name: 'stt', label: 'STT', type: 'text', width: 80, align: 'center' },
		{ id: 'name', name: 'name', label: 'Người dùng', type: 'text', width: 200, sortable: true },
		{ id: 'email', name: 'email', label: 'Email', type: 'text', width: 200, sortable: true },
		{
			id: 'role', name: 'role', label: 'Vai trò', type: 'text', width: 200, sortable: true,
			renderCell: (row: TableRowData) => {
				const roles = row.roles as string[] | undefined;
				if (roles && roles.length > 0) {
					return roles.map((r) => ROLE_LABELS[r as UserRole] || r).join(', ');
				}
				return ROLE_LABELS[row.role as UserRole] || row.role as string || '';
			},
		},
		{ id: 'status', name: 'isActive', label: 'Trạng thái', type: 'status', width: 150, statusType: 'user', sortable: true },
		{
			id: 'password',
			name: 'password',
			label: 'Mật khẩu',
			width: 160,
			align: 'left',
			renderCell: (row: TableRowData) => (
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
					<Typography sx={{ fontFamily: 'monospace', fontSize: 18, color: 'text.disabled', letterSpacing: 2, lineHeight: 1 }}>
						•••••••••
					</Typography>
					<Tooltip title="Đặt lại mật khẩu">
						<IconButton
							size="small"
							onClick={(e) => { e.stopPropagation(); openReset(row as unknown as UserProfile); }}
						>
							<LockResetOutlinedIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				</Box>
			),
		},
		{ id: 'actions', name: 'actions', label: 'Thao tác', type: 'actions', width: 100, align: 'center' },
	];

	const tableData: TableRowData[] = users.map((user, index) => ({
		stt: (page !== undefined && rowsPerPage !== undefined) ? (page * rowsPerPage) + index + 1 : index + 1,
		...user,
	}));

	return (
		<>
			<CustomTable
				fields={fields as TableField[]}
				data={tableData}
				loading={loading}
				minWidth={890}
				searchValue={searchValue}
				onSearchChange={onSearchChange}
				searchPlaceholder="Tìm kiếm người dùng..."
				headerActions={headerActions}
				page={page}
				rowsPerPage={rowsPerPage}
				totalCount={totalCount}
				onPageChange={onPageChange}
				onRowsPerPageChange={onRowsPerPageChange}
				onEdit={(row) => onEdit(row as UserProfile)}
				onDelete={(row) => onDelete(row.id as string)}
				onStatusChange={(row, newStatus) => onStatusChange && onStatusChange(row as UserProfile, newStatus)}
				sortBy={sortBy}
				sortOrder={sortOrder}
				onSort={onSort}
			/>

			{/* Reset Password Dialog */}
			<Dialog open={Boolean(resetTarget)} onClose={() => !resetLoading && setResetTarget(null)} maxWidth="xs" fullWidth>
				<DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<Box>
						<Typography sx={{ fontWeight: 700 }}>Đặt lại mật khẩu</Typography>
						<Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{resetTarget?.name}</Typography>
					</Box>
					<IconButton size="small" onClick={() => setResetTarget(null)} disabled={resetLoading}>
						<CloseIcon />
					</IconButton>
				</DialogTitle>

				<DialogContent dividers>
					<Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}>
						Mật khẩu mới sẽ được đặt ngay lập tức. User sẽ bị đăng xuất khỏi tất cả thiết bị.
					</Typography>
					<TextField
						label="Mật khẩu mới"
						value={newPassword}
						fullWidth
						slotProps={{
							input: {
								readOnly: true,
								endAdornment: (
									<InputAdornment position="end">
										<Tooltip title="Tạo mật khẩu mới">
											<IconButton size="small" onClick={() => setNewPassword(generatePassword())} edge="end">
												<AutorenewIcon fontSize="small" />
											</IconButton>
										</Tooltip>
									</InputAdornment>
								),
							},
						}}
						helperText="Nhấn nút làm mới để tạo mật khẩu khác"
						sx={{ '& input': { fontFamily: 'monospace', letterSpacing: 1 } }}
					/>
				</DialogContent>

				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button variant="text" color="inherit" onClick={() => setResetTarget(null)} disabled={resetLoading}>
						Hủy
					</Button>
					<Button variant="contained" color="error" onClick={handleResetConfirm} disabled={resetLoading}>
						{resetLoading ? 'Đang đặt lại...' : 'Xác nhận đặt lại'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
