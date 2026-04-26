import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { useDebounce } from '../../../hooks/useDebounce';
import {
	fetchUsers,
	createUser,
	updateUser,
	deleteUser,
	setSelectedUser,
	clearSelectedUser,
	clearUserError,
	setSortField,
	setSortOrder,
} from '../userSlice';
import type { UserFormData } from './UserForm';
import UserTable from './UserTable';
import UserForm from './UserForm';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { Paper, Typography } from '@mui/material';
import { useToastify } from '../../../components/Toastify';

export default function UserPage() {
	const dispatch = useAppDispatch();
	const { users, selectedUser, loading, error, pagination, sortField, sortOrder } = useAppSelector((state) => state.users);
	const [showForm, setShowForm] = useState(false);
	const [search, setSearch] = useState('');
	const debouncedSearch = useDebounce(search, 300);
	const { showToast } = useToastify();

	useEffect(() => {
		dispatch(fetchUsers({ page: pagination.page, limit: pagination.limit, search: debouncedSearch, sort: sortField, order: sortOrder }));
	}, [dispatch, pagination.page, pagination.limit, debouncedSearch, sortField, sortOrder]);

	const handlePageChange = (newPage: number) => {
		dispatch(fetchUsers({ page: newPage + 1, limit: pagination.limit, search: debouncedSearch, sort: sortField, order: sortOrder }));
	};

	const handleRowsPerPageChange = (newLimit: number) => {
		dispatch(fetchUsers({ page: 1, limit: newLimit, search: debouncedSearch, sort: sortField, order: sortOrder }));
	};

	const handleSort = (field: string) => {
		if (field === sortField) {
			dispatch(setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'));
		} else {
			dispatch(setSortField(field as typeof sortField));
			dispatch(setSortOrder('desc'));
		}
	};

	const handleCreate = () => {
		dispatch(clearSelectedUser());
		dispatch(clearUserError());
		setShowForm(true);
	};

	const handleEdit = (user: typeof selectedUser) => {
		dispatch(setSelectedUser(user));
		dispatch(clearUserError());
		setShowForm(true);
	};

	const handleDelete = async (id: string) => {
		await dispatch(deleteUser(id));
	};

	const handleStatusChange = async (userToUpdate: typeof selectedUser, newStatus: string) => {
		if (userToUpdate) {
			const data: Partial<UserFormData> = {
				status: newStatus as 'active' | 'inactive',
			};
			const action = await dispatch(updateUser({ id: userToUpdate.id, data }));
			if (!action.type.endsWith('/rejected')) {
				showToast('Cập nhật trạng thái người dùng thành công', 'success');
			} else {
				showToast(action.payload as string || 'Có lỗi xảy ra', 'danger');
			}
		}
	};

	const handleSubmit = async (data: UserFormData) => {
		if (selectedUser) {
			const changedData: Partial<UserFormData> = {};
			if (data.name !== selectedUser.name) changedData.name = data.name;
			if (data.role !== selectedUser.role) changedData.role = data.role;
			if (data.status !== selectedUser.status) changedData.status = data.status;

			if (Object.keys(changedData).length === 0) {
				setShowForm(false);
				dispatch(clearSelectedUser());
				return;
			}

			const action = await dispatch(updateUser({ id: selectedUser.id, data: changedData }));
			if (!action.type.endsWith('/rejected')) {
				showToast('Cập nhật người dùng thành công', 'success');
				setShowForm(false);
				dispatch(clearSelectedUser());
			} else {
				showToast(action.payload as string || 'Có lỗi xảy ra', 'danger');
			}
		} else {
			const action = await dispatch(createUser(data));
			if (!action.type.endsWith('/rejected')) {
				showToast('Tạo người dùng thành công', 'success');
				setShowForm(false);
				dispatch(clearSelectedUser());
			} else {
				showToast(action.payload as string || 'Có lỗi xảy ra', 'danger');
			}
		}
	};

	const handleCloseForm = () => {
		setShowForm(false);
		dispatch(clearSelectedUser());
	};

	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 3 }}>
			<Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
				<Box sx={{ px: 3, pt: 3, pb: 1.5 }}>
					<Typography sx={{ fontSize: '20px', fontWeight: 700, color: 'text.primary' }}>
						Danh sách người dùng
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<UserTable
						users={users}
						loading={loading}
						page={pagination.page - 1}
						rowsPerPage={pagination.limit}
						totalCount={pagination.total}
						onPageChange={handlePageChange}
						onRowsPerPageChange={handleRowsPerPageChange}
						onEdit={handleEdit}
						onDelete={handleDelete}
						onStatusChange={handleStatusChange}
						searchValue={search}
						onSearchChange={setSearch}
						sortBy={sortField}
						sortOrder={sortOrder}
						onSort={handleSort}
						headerActions={
							<Button variant="contained" startIcon={<PersonAddOutlinedIcon />} onClick={handleCreate}>
								Thêm người dùng
							</Button>
						}
					/>
				</Box>
			</Paper>

			<Dialog open={showForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					{selectedUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
					<IconButton size="small" onClick={handleCloseForm}>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent dividers>
					<UserForm
						initialData={
							selectedUser
								? {
									email: selectedUser.email,
									name: selectedUser.name,
									role: selectedUser.role,
									status: selectedUser.status,
								}
								: undefined
						}
						onSubmit={handleSubmit}
						onCancel={handleCloseForm}
						loading={loading}
						apiError={error}
					/>
				</DialogContent>
			</Dialog>
		</Box>
	);
}
