import { useEffect, useState, useCallback } from 'react';
import { z } from 'zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
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
import TablePagination from '@mui/material/TablePagination';
import InputAdornment from '@mui/material/InputAdornment';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

import api from '../../../utils/api';
import { useToastify } from '../../../components/Toastify';
import { useDebounce } from '../../../hooks/useDebounce';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Branch {
	_id: string;
	name: string;
	address?: string | null;
	description?: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

// ─── Zod Schema for Validation ───────────────────────────────────────────────

const branchFormSchema = z.object({
	name: z.string()
		.trim()
		.min(2, 'Tên chi nhánh phải từ 2 đến 100 ký tự')
		.max(100, 'Tên chi nhánh phải từ 2 đến 100 ký tự'),
	address: z.string()
		.trim()
		.max(300, 'Địa chỉ tối đa 300 ký tự')
		.optional()
		.or(z.literal('')),
	description: z.string()
		.trim()
		.max(500, 'Mô tả tối đa 500 ký tự')
		.optional()
		.or(z.literal('')),
	isActive: z.boolean().optional(),
});

type BranchFormValues = z.infer<typeof branchFormSchema>;

const EMPTY_FORM: BranchFormValues = {
	name: '',
	address: '',
	description: '',
	isActive: true,
};

// ─── Shared Styles ───────────────────────────────────────────────────────────

const pillButtonSx = {
	borderRadius: '100px',
	textTransform: 'none',
	px: 2.5,
	height: 36,
	fontWeight: 500,
	transition: 'all 0.2s ease-in-out',
	'&:hover': {
		transform: 'scale(1.02)',
	},
};

const dialogPaperProps = {
	sx: {
		borderRadius: '28px',
	},
};

const backdropProps = {
	sx: {
		backdropFilter: 'blur(8px)',
		backgroundColor: 'rgba(0, 0, 0, 0.4)',
	},
};

const selectPropsConfig = {
	MenuProps: {
		variant: 'menu' as const,
		disableAutoFocusItem: true,
		anchorOrigin: {
			vertical: 'bottom' as const,
			horizontal: 'left' as const,
		},
		transformOrigin: {
			vertical: 'top' as const,
			horizontal: 'left' as const,
		},
	},
};

export default function BranchManagementTab() {
	const { showToast } = useToastify();

	// ─── States ────────────────────────────────────────────────────────────────
	const [branches, setBranches] = useState<Branch[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Query params / pagination
	const [page, setPage] = useState(0); // 0-indexed for TablePagination
	const [rowsPerPage, setRowsPerPage] = useState(20);
	const [total, setTotal] = useState(0);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<'all' | 'true' | 'false'>('all');

	const debouncedSearch = useDebounce(search, 500);

	// Dialogs
	const [createOpen, setCreateOpen] = useState(false);
	const [createForm, setCreateForm] = useState<BranchFormValues>(EMPTY_FORM);
	const [createErrors, setCreateErrors] = useState<Partial<Record<keyof BranchFormValues, string>>>({});
	const [createLoading, setCreateLoading] = useState(false);

	const [editBranch, setEditBranch] = useState<Branch | null>(null);
	const [editForm, setEditForm] = useState<BranchFormValues>(EMPTY_FORM);
	const [editErrors, setEditErrors] = useState<Partial<Record<keyof BranchFormValues, string>>>({});
	const [editLoading, setEditLoading] = useState(false);

	const [deleteBranch, setDeleteBranch] = useState<Branch | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	// ─── Data Loading ──────────────────────────────────────────────────────────

	const loadBranches = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const params: Record<string, string | number | boolean> = {
				page: page + 1, // backend is 1-indexed
				limit: rowsPerPage,
			};
			if (debouncedSearch.trim()) {
				params.search = debouncedSearch.trim();
			}
			if (statusFilter !== 'all') {
				params.isActive = statusFilter; // Send 'true' or 'false' as string
			}

			const response = await api.get('/branches', { params });
			// The response shape is: { success: true, statusCode: 200, data: { items: [], total: ... } }
			const resData = response.data?.data || response.data;
			if (resData) {
				setBranches(resData.items || []);
				setTotal(resData.total || 0);
			}
		} catch (err: unknown) {
			console.error(err);
			setError('Không thể tải danh sách chi nhánh.');
		} finally {
			setLoading(false);
		}
	}, [page, rowsPerPage, debouncedSearch, statusFilter]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		loadBranches();
	}, [loadBranches]);

	// ─── Helpers ───────────────────────────────────────────────────────────────

	const buildPayload = (formData: BranchFormValues) => {
		const payload: Record<string, string | boolean> = {
			name: formData.name.trim(),
		};
		// Empty strings are omitted to avoid backend validation failure for non-empty string checks
		if (formData.address && formData.address.trim()) {
			payload.address = formData.address.trim();
		}
		if (formData.description && formData.description.trim()) {
			payload.description = formData.description.trim();
		}
		if (formData.isActive !== undefined) {
			payload.isActive = formData.isActive;
		}
		return payload;
	};

	// ─── Actions: Create ───────────────────────────────────────────────────────

	const handleOpenCreate = () => {
		setCreateForm(EMPTY_FORM);
		setCreateErrors({});
		setCreateOpen(true);
	};

	const handleCreateSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const result = branchFormSchema.safeParse(createForm);
		if (!result.success) {
			const errors: Partial<Record<keyof BranchFormValues, string>> = {};
			result.error.errors.forEach((err) => {
				if (err.path[0]) {
					errors[err.path[0] as keyof BranchFormValues] = err.message;
				}
			});
			setCreateErrors(errors);
			return;
		}

		setCreateLoading(true);
		try {
			const payload = buildPayload(createForm);
			const response = await api.post('/branches', payload);
			const data = response.data?.data || response.data;
			showToast(data?.message || 'Tạo chi nhánh thành công', 'success');
			setCreateOpen(false);
			loadBranches();
		} catch (err: unknown) {
			console.error(err);
			const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message || 'Có lỗi xảy ra khi tạo chi nhánh';
			showToast(Array.isArray(msg) ? (msg as string[]).join(', ') : String(msg), 'danger');
		} finally {
			setCreateLoading(false);
		}
	};

	// ─── Actions: Edit ─────────────────────────────────────────────────────────

	const handleOpenEdit = (branch: Branch) => {
		setEditBranch(branch);
		setEditForm({
			name: branch.name,
			address: branch.address || '',
			description: branch.description || '',
			isActive: branch.isActive,
		});
		setEditErrors({});
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editBranch) return;

		const result = branchFormSchema.safeParse(editForm);
		if (!result.success) {
			const errors: Partial<Record<keyof BranchFormValues, string>> = {};
			result.error.errors.forEach((err) => {
				if (err.path[0]) {
					errors[err.path[0] as keyof BranchFormValues] = err.message;
				}
			});
			setEditErrors(errors);
			return;
		}

		setEditLoading(true);
		try {
			const payload = buildPayload(editForm);
			const response = await api.patch(`/branches/${editBranch._id}`, payload);
			const data = response.data?.data || response.data;
			showToast(data?.message || 'Cập nhật chi nhánh thành công', 'success');
			setEditBranch(null);
			loadBranches();
		} catch (err: unknown) {
			console.error(err);
			const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật chi nhánh';
			showToast(Array.isArray(msg) ? (msg as string[]).join(', ') : String(msg), 'danger');
		} finally {
			setEditLoading(false);
		}
	};

	// ─── Actions: Delete ───────────────────────────────────────────────────────

	const handleOpenDelete = (branch: Branch) => {
		setDeleteBranch(branch);
	};

	const handleDeleteConfirm = async () => {
		if (!deleteBranch) return;
		setDeleteLoading(true);
		try {
			const response = await api.delete(`/branches/${deleteBranch._id}`);
			const data = response.data?.data || response.data;
			showToast(data?.message || 'Xóa chi nhánh thành công', 'success');
			setDeleteBranch(null);
			// Go back to page 0 if deleting the last item on the page
			if (branches.length === 1 && page > 0) {
				setPage(page - 1);
			} else {
				loadBranches();
			}
		} catch (err: unknown) {
			console.error(err);
			const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message || 'Có lỗi xảy ra khi xóa chi nhánh';
			showToast(Array.isArray(msg) ? (msg as string[]).join(', ') : String(msg), 'danger');
		} finally {
			setDeleteLoading(false);
		}
	};

	// ─── Rendering ─────────────────────────────────────────────────────────────

	return (
		<Box>
			{/* Filters & Actions Header */}
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, gap: 2, flexWrap: 'wrap' }}>
				<Typography sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 14 }}>
					Danh sách chi nhánh ({total})
				</Typography>
				<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
					{/* Search input with debouncing */}
					<TextField
						size="small"
						placeholder="Tìm theo tên chi nhánh..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(0);
						}}
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon fontSize="small" />
									</InputAdornment>
								),
							},
						}}
						sx={{
							width: 240,
							'& .MuiOutlinedInput-root': {
								borderRadius: '28px',
							},
						}}
					/>

					{/* Status Filter Dropdown */}
					<TextField
						select
						size="small"
						value={statusFilter}
						onChange={(e) => {
							setStatusFilter(e.target.value as 'all' | 'true' | 'false');
							setPage(0);
						}}
						SelectProps={selectPropsConfig}
						sx={{
							width: 180,
							'& .MuiOutlinedInput-root': {
								borderRadius: '28px',
							},
						}}
					>
						<MenuItem value="all">Tất cả trạng thái</MenuItem>
						<MenuItem value="true">Hoạt động</MenuItem>
						<MenuItem value="false">Ngưng hoạt động</MenuItem>
					</TextField>

					{/* Add Branch Button */}
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						onClick={handleOpenCreate}
						sx={pillButtonSx}
					>
						Thêm chi nhánh
					</Button>
				</Box>
			</Box>

			{error && <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError(null)}>{error}</Alert>}

			{loading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
					<CircularProgress size={36} />
				</Box>
			) : (
				<>
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell align="center" sx={{ fontWeight: 600, width: 80 }}>STT</TableCell>
									<TableCell sx={{ fontWeight: 600, width: 220 }}>Tên chi nhánh</TableCell>
									<TableCell sx={{ fontWeight: 600, width: 320 }}>Địa chỉ</TableCell>
									<TableCell sx={{ fontWeight: 600, width: 350 }}>Mô tả</TableCell>
									<TableCell sx={{ fontWeight: 600, width: 150 }}>Trạng thái</TableCell>
									<TableCell align="right" sx={{ fontWeight: 600, width: 120 }}>Thao tác</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{branches.length === 0 && (
									<TableRow>
										<TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 5 }}>
											Chưa có chi nhánh nào được tìm thấy
										</TableCell>
									</TableRow>
								)}
								{branches.map((branch, idx) => (
									<TableRow key={branch._id} hover>
										<TableCell align="center">
											{page * rowsPerPage + idx + 1}
										</TableCell>
										<TableCell sx={{ fontWeight: 600 }}>{branch.name}</TableCell>
										<TableCell sx={{ color: 'text.secondary', fontSize: 13, whiteSpace: 'normal', wordBreak: 'break-word' }}>
											{branch.address || '—'}
										</TableCell>
										<TableCell sx={{ color: 'text.secondary', fontSize: 13, whiteSpace: 'normal', wordBreak: 'break-word' }}>
											{branch.description || '—'}
										</TableCell>
										<TableCell>
											{branch.isActive ? (
												<Chip label="Hoạt động" size="small" color="success" variant="outlined" />
											) : (
												<Chip label="Ngưng hoạt động" size="small" color="default" variant="outlined" />
											)}
										</TableCell>
										<TableCell align="right">
											<Tooltip title="Chỉnh sửa">
												<IconButton size="small" onClick={() => handleOpenEdit(branch)}>
													<EditOutlinedIcon fontSize="small" />
												</IconButton>
											</Tooltip>
											<Tooltip title="Xóa">
												<IconButton size="small" color="error" onClick={() => handleOpenDelete(branch)}>
													<DeleteOutlinedIcon fontSize="small" />
												</IconButton>
											</Tooltip>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>

					{total > 0 && (
						<TablePagination
							component="div"
							count={total}
							page={page}
							onPageChange={(_, newPage) => setPage(newPage)}
							rowsPerPage={rowsPerPage}
							onRowsPerPageChange={(e) => {
								setRowsPerPage(parseInt(e.target.value, 10));
								setPage(0);
							}}
							rowsPerPageOptions={[10, 20, 50, 100]}
							labelRowsPerPage="Mỗi trang:"
							labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
						/>
					)}
				</>
			)}

			{/* Create Dialog */}
			<Dialog
				open={createOpen}
				onClose={() => !createLoading && setCreateOpen(false)}
				maxWidth="sm"
				fullWidth
				PaperProps={dialogPaperProps}
				slotProps={{ backdrop: backdropProps }}
			>
				<form onSubmit={handleCreateSubmit} noValidate>
					<DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						Thêm chi nhánh mới
						<IconButton size="small" onClick={() => setCreateOpen(false)} disabled={createLoading}>
							<CloseIcon />
						</IconButton>
					</DialogTitle>
					<DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5, maxHeight: '70vh', overflowY: 'auto' }}>
						<TextField
							label="Tên chi nhánh"
							required
							value={createForm.name}
							onChange={(e) => {
								setCreateForm((p) => ({ ...p, name: e.target.value }));
								setCreateErrors((p) => ({ ...p, name: undefined }));
							}}
							error={Boolean(createErrors.name)}
							helperText={createErrors.name || 'Từ 2 đến 100 ký tự, ví dụ: Hà Nội'}
							fullWidth
							autoFocus
						/>

						<TextField
							label="Địa chỉ (tùy chọn)"
							value={createForm.address}
							onChange={(e) => {
								setCreateForm((p) => ({ ...p, address: e.target.value }));
								setCreateErrors((p) => ({ ...p, address: undefined }));
							}}
							error={Boolean(createErrors.address)}
							helperText={createErrors.address || 'Tối đa 300 ký tự'}
							fullWidth
							multiline
							rows={2}
						/>

						<TextField
							label="Mô tả (tùy chọn)"
							value={createForm.description}
							onChange={(e) => {
								setCreateForm((p) => ({ ...p, description: e.target.value }));
								setCreateErrors((p) => ({ ...p, description: undefined }));
							}}
							error={Boolean(createErrors.description)}
							helperText={createErrors.description || 'Tối đa 500 ký tự'}
							fullWidth
							multiline
							rows={3}
						/>
					</DialogContent>
					<DialogActions sx={{ px: 3, pb: 2 }}>
						<Button
							variant="text"
							color="inherit"
							onClick={() => setCreateOpen(false)}
							disabled={createLoading}
							sx={pillButtonSx}
						>
							Hủy
						</Button>
						<Button
							type="submit"
							variant="contained"
							disabled={createLoading}
							sx={pillButtonSx}
						>
							{createLoading ? 'Đang tạo...' : 'Tạo mới'}
						</Button>
					</DialogActions>
				</form>
			</Dialog>

			{/* Edit Dialog */}
			<Dialog
				open={Boolean(editBranch)}
				onClose={() => !editLoading && setEditBranch(null)}
				maxWidth="sm"
				fullWidth
				PaperProps={dialogPaperProps}
				slotProps={{ backdrop: backdropProps }}
			>
				<form onSubmit={handleEditSubmit} noValidate>
					<DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						Chỉnh sửa chi nhánh
						<IconButton size="small" onClick={() => setEditBranch(null)} disabled={editLoading}>
							<CloseIcon />
						</IconButton>
					</DialogTitle>
					<DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5, maxHeight: '70vh', overflowY: 'auto' }}>
						<TextField
							label="Tên chi nhánh"
							required
							value={editForm.name}
							onChange={(e) => {
								setEditForm((p) => ({ ...p, name: e.target.value }));
								setEditErrors((p) => ({ ...p, name: undefined }));
							}}
							error={Boolean(editErrors.name)}
							helperText={editErrors.name || 'Từ 2 đến 100 ký tự'}
							fullWidth
							autoFocus
						/>

						<TextField
							label="Địa chỉ (tùy chọn)"
							value={editForm.address}
							onChange={(e) => {
								setEditForm((p) => ({ ...p, address: e.target.value }));
								setEditErrors((p) => ({ ...p, address: undefined }));
							}}
							error={Boolean(editErrors.address)}
							helperText={editErrors.address || 'Tối đa 300 ký tự'}
							fullWidth
							multiline
							rows={2}
						/>

						<TextField
							label="Mô tả (tùy chọn)"
							value={editForm.description}
							onChange={(e) => {
								setEditForm((p) => ({ ...p, description: e.target.value }));
								setEditErrors((p) => ({ ...p, description: undefined }));
							}}
							error={Boolean(editErrors.description)}
							helperText={editErrors.description || 'Tối đa 500 ký tự'}
							fullWidth
							multiline
							rows={3}
						/>

						{/* Edit status Dropdown */}
						<TextField
							select
							label="Trạng thái"
							value={editForm.isActive ? 'true' : 'false'}
							onChange={(e) => {
								setEditForm((p) => ({ ...p, isActive: e.target.value === 'true' }));
							}}
							SelectProps={selectPropsConfig}
							fullWidth
						>
							<MenuItem value="true">Hoạt động</MenuItem>
							<MenuItem value="false">Ngưng hoạt động</MenuItem>
						</TextField>
					</DialogContent>
					<DialogActions sx={{ px: 3, pb: 2 }}>
						<Button
							variant="text"
							color="inherit"
							onClick={() => setEditBranch(null)}
							disabled={editLoading}
							sx={pillButtonSx}
						>
							Hủy
						</Button>
						<Button
							type="submit"
							variant="contained"
							disabled={editLoading}
							sx={pillButtonSx}
						>
							{editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
						</Button>
					</DialogActions>
				</form>
			</Dialog>

			{/* Delete Confirm Dialog */}
			<Dialog
				open={Boolean(deleteBranch)}
				onClose={() => !deleteLoading && setDeleteBranch(null)}
				maxWidth="xs"
				fullWidth
				PaperProps={dialogPaperProps}
				slotProps={{ backdrop: backdropProps }}
			>
				<DialogTitle>Xác nhận xóa</DialogTitle>
				<DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
					<Typography>
						Bạn có chắc chắn muốn xóa chi nhánh <strong>{deleteBranch?.name}</strong>?
						Hành động này không thể hoàn tác.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button
						variant="text"
						color="inherit"
						onClick={() => setDeleteBranch(null)}
						disabled={deleteLoading}
						sx={pillButtonSx}
					>
						Hủy
					</Button>
					<Button
						variant="contained"
						color="error"
						onClick={handleDeleteConfirm}
						disabled={deleteLoading}
						sx={pillButtonSx}
					>
						{deleteLoading ? 'Đang xóa...' : 'Xóa'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
