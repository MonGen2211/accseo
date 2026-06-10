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
import { userService } from '../userService';
import type { UserFormData } from './UserForm';
import UserTable from './UserTable';
import UserForm from './UserForm';
import RoleManagementTab from './RoleManagementTab';
import RolePermissionsTab from './RolePermissionsTab';
import BranchManagementTab from './BranchManagementTab';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';

import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useToastify } from '../../../components/Toastify';

type TabValue = 'users' | 'roles' | 'permissions' | 'branches';

export default function UserPage() {
	const dispatch = useAppDispatch();
	const { users, selectedUser, loading, error, pagination, sortField, sortOrder } = useAppSelector((state) => state.users);
	const currentUser = useAppSelector((state) => state.auth.user);
	const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.roles?.includes('ADMIN');
	const [tab, setTab] = useState<TabValue>('users');
	const [showForm, setShowForm] = useState(false);
	const [search, setSearch] = useState('');
	const debouncedSearch = useDebounce(search, 300);
	const { showToast } = useToastify();

	useEffect(() => {
		if (tab !== 'users') return;
		dispatch(fetchUsers({ page: pagination.page, limit: pagination.limit, search: debouncedSearch, sort: sortField, order: sortOrder }));
	}, [dispatch, pagination.page, pagination.limit, debouncedSearch, sortField, sortOrder, tab]);

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

	const handleEdit = async (user: typeof selectedUser) => {
		if (!user) return;
		try {
			const fullUser = await userService.getById(user.id);
			dispatch(setSelectedUser(fullUser));
			dispatch(clearUserError());
			setShowForm(true);
		} catch {
			showToast('Không thể tải thông tin chi tiết người dùng', 'danger');
		}
	};

	const handleDelete = async (id: string) => {
		await dispatch(deleteUser(id));
	};

	const handleStatusChange = async (userToUpdate: typeof selectedUser, newStatus: string) => {
		if (userToUpdate) {
			const data: Partial<UserFormData> = { status: newStatus as 'active' | 'inactive' };
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
			if (data.status !== selectedUser.status) changedData.status = data.status;
			if (data.companyName !== selectedUser.companyName) changedData.companyName = data.companyName;
			if (data.branch !== selectedUser.branch) changedData.branch = data.branch;
			if (data.msnv !== selectedUser.msnv) changedData.msnv = data.msnv;

			const oldDob = selectedUser.dateOfBirth ? selectedUser.dateOfBirth.split('T')[0] : '';
			if ((data.dateOfBirth || '') !== oldDob) changedData.dateOfBirth = data.dateOfBirth;

			const newRoles = [...(data.roles || [])].sort();
			const oldRoles = [...(selectedUser.roles || (selectedUser.role ? [selectedUser.role] : []))].sort();
			if (JSON.stringify(newRoles) !== JSON.stringify(oldRoles)) changedData.roles = data.roles;

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
				const payload = action.payload as { user: unknown; message: string };
				console.log(payload);
				showToast(payload.message || 'Tạo người dùng thành công', 'success');
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
		<Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 3, zoom: 0.8 }}>
			<Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
				<Box sx={{ px: 3, pt: 3, pb: 0 }}>
					<Tabs
						value={tab}
						onChange={(_, v) => setTab(v as TabValue)}
						sx={{ 
							borderBottom: 1, 
							borderColor: 'divider',
							'& .MuiTabs-indicator': { display: 'none' }
						}}
					>
						<Tab 
							label="Danh sách người dùng" 
							value="users" 
							sx={{ '&.Mui-selected': { borderBottom: '2px solid', borderColor: 'primary.main', mb: '-1px' } }} 
						/>
						{isAdmin && (
							<Tab 
								label="Tạo phân quyền" 
								value="roles" 
								sx={{ '&.Mui-selected': { borderBottom: '2px solid', borderColor: 'primary.main', mb: '-1px' } }} 
							/>
						)}
						{isAdmin && (
							<Tab 
								label="Phân quyền theo vai trò" 
								value="permissions" 
								sx={{ '&.Mui-selected': { borderBottom: '2px solid', borderColor: 'primary.main', mb: '-1px' } }} 
							/>
						)}
						<Tab 
							label="Quản lý chi nhánh" 
							value="branches" 
							sx={{ '&.Mui-selected': { borderBottom: '2px solid', borderColor: 'primary.main', mb: '-1px' } }} 
						/>
					</Tabs>
				</Box>

				<Box sx={{ p: 3 }}>
					{tab === 'users' && (
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
					)}

					{tab === 'roles' && isAdmin && <RoleManagementTab />}

					{tab === 'permissions' && isAdmin && <RolePermissionsTab />}

					{tab === 'branches' && <BranchManagementTab />}
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
									roles: selectedUser.roles || (selectedUser.role ? [selectedUser.role] : []),
									status: selectedUser.status,
									companyName: selectedUser.companyName,
									branch: selectedUser.branch,
									msnv: selectedUser.msnv || '',
									dateOfBirth: selectedUser.dateOfBirth ? selectedUser.dateOfBirth.split('T')[0] : '',
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
