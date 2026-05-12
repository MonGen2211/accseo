import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchGroupById, createGroup, updateGroup, updateGroupMembers } from '../groupSlice';
import { useToastify } from '../../../components/Toastify';
import { userService } from '../../users/userService';
import type { UserProfile } from '../../../types/user.types';

export default function GroupFormPage() {
	const { id } = useParams<{ id: string }>();
	const isEdit = !!id;
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { showToast } = useToastify();
	const { current, loading, actionLoading } = useAppSelector((s) => s.groups);

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [isActive, setIsActive] = useState(true);
	const [selectedMembers, setSelectedMembers] = useState<UserProfile[]>([]);
	const [userOptions, setUserOptions] = useState<UserProfile[]>([]);
	const [userSearch, setUserSearch] = useState('');

	useEffect(() => {
		if (isEdit && id) dispatch(fetchGroupById(id));
	}, [dispatch, id, isEdit]);

	useEffect(() => {
		if (isEdit && current) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setName(current.name);
			setDescription(current.description ?? '');
			setIsActive(current.isActive);
			// Map members to UserProfile shape for the form
			setSelectedMembers(current.members.map((m) => ({
				id: m.id,
				name: m.name,
				email: m.email,
				role: m.role as UserProfile['role'],
				status: m.isActive ? 'active' : 'inactive',
				createdAt: '',
				imgAvatar: m.imgAvatar,
			})));
		}
	}, [current, isEdit]);

	useEffect(() => {
		userService.getAssignable(userSearch).then(setUserOptions);
	}, [userSearch]);

	const handleSubmit = async () => {
		if (!name.trim()) { showToast('Vui lòng nhập tên nhóm', 'warning'); return; }

		if (isEdit && id) {
			const updateResult = await dispatch(updateGroup({ id, data: { name: name.trim(), description: description.trim() || undefined, isActive } }));
			if (updateResult.type.endsWith('/rejected')) {
				showToast(String((updateResult as { payload?: unknown }).payload ?? 'Lỗi cập nhật'), 'danger');
				return;
			}
			const memberResult = await dispatch(updateGroupMembers({ id, members: selectedMembers.map((m) => m.id) }));
			if (memberResult.type.endsWith('/rejected')) {
				showToast(String((memberResult as { payload?: unknown }).payload ?? 'Lỗi cập nhật thành viên'), 'danger');
				return;
			}
			showToast('Cập nhật nhóm thành công', 'success');
			navigate(-1);
		} else {
			const result = await dispatch(createGroup({
				name: name.trim(),
				description: description.trim() || undefined,
				members: selectedMembers.map((m) => m.id),
			}));
			if (!result.type.endsWith('/rejected')) {
				showToast('Tạo nhóm thành công', 'success');
				navigate(-1);
			} else {
				showToast(String((result as { payload?: unknown }).payload ?? 'Lỗi tạo nhóm'), 'danger');
			}
		}
	};

	if (isEdit && loading && !current) {
		return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
	}

	return (
		<Box sx={{ p: 3, pb: 10, maxWidth: 640, mx: 'auto' }}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
				<IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
				<Typography variant="h5" sx={{ fontWeight: 700 }}>{isEdit ? 'Chỉnh sửa nhóm' : 'Tạo nhóm mới'}</Typography>
			</Box>

			<Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
				<TextField
					label="Tên nhóm *"
					fullWidth
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>

				<TextField
					label="Mô tả (tuỳ chọn)"
					fullWidth
					multiline
					rows={3}
					value={description}
					onChange={(e) => setDescription(e.target.value)}
				/>

				{isEdit && (
					<FormControlLabel
						control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
						label="Đang hoạt động"
					/>
				)}

				<Box>
					<Typography sx={{ fontWeight: 600, mb: 1 }}>Thành viên</Typography>
					<Autocomplete
						multiple
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						options={userOptions.filter((u: any) => !selectedMembers.find((m: any) => m.id === u.id)) as any[]}
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						getOptionLabel={(u: any) => `${u.name} (${u.email})`}
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						value={selectedMembers as any[]}
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						onChange={(_: any, v: any) => setSelectedMembers(v)}
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						onInputChange={(_: any, v: string) => setUserSearch(v)}
						renderInput={(params) => <TextField {...params} label="Tìm và thêm thành viên" size="small" />}
					/>
					<Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
						{selectedMembers.length} thành viên đã chọn
					</Typography>
				</Box>

				<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
					<Button variant="outlined" onClick={() => navigate(-1)}>Huỷ</Button>
					<Button variant="contained" onClick={handleSubmit} disabled={actionLoading}>
						{actionLoading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo nhóm'}
					</Button>
				</Box>
			</Paper>
		</Box>
	);
}
