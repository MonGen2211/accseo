import { useState, useEffect, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CloseIcon from '@mui/icons-material/Close';
import type { Domain } from '../../../types/domain.types';
import type { UserProfile } from '../../../types/user.types';

interface DomainEditFormProps {
	open: boolean;
	domain: Domain | null;
	users: UserProfile[];
	loading?: boolean;
	usersLoading?: boolean;
	onSubmit: (domainId: string, ownerIds: string[]) => void;
	onClose: () => void;
}

export default function DomainEditForm({ open, domain, users, loading, usersLoading, onSubmit, onClose }: DomainEditFormProps) {
	// Tính pre-selected từ domain.owners
	const preSelected = useMemo(() => {
		if (!domain?.owners || users.length === 0) return [];
		return users.filter((u) => domain.owners?.some((o) => o._id === u.id));
	}, [domain, users]);

	const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>(preSelected);

	// Sync khi dialog mở với domain/users mới
	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => { setSelectedUsers(preSelected); }, [preSelected]);

	const handleSubmit = () => {
		if (!domain) return;
		const ownerIds = selectedUsers.map((u) => u.id);
		onSubmit(domain._id, ownerIds);
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				Quản lý người phụ trách
				<IconButton size="small" onClick={onClose} disabled={loading}>
					<CloseIcon />
				</IconButton>
			</DialogTitle>
			<DialogContent dividers>
				{domain && (
					<Box sx={{ mb: 3 }}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
							Tên miền
						</Typography>
						<Typography variant="body1" sx={{ fontWeight: 600 }}>
							{domain.domain}
						</Typography>
					</Box>
				)}

				<Autocomplete
					multiple
					options={users}
					value={selectedUsers}
					onChange={(_e, newValue) => setSelectedUsers(newValue)}
					getOptionLabel={(option) => `${option.name} (${option.email})`}
					isOptionEqualToValue={(option, value) => option.id === value.id}
					loading={usersLoading}
					renderInput={(params) => (
						<TextField
							{...params}
							label="Chọn người quản lý"
							placeholder={selectedUsers.length === 0 ? 'Tìm theo tên hoặc email...' : ''}
						/>
					)}
					sx={{ mb: 3 }}
				/>

				<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
					<Button variant="text" color="inherit" onClick={onClose} disabled={loading}>
						Hủy
					</Button>
					<Button variant="contained" onClick={handleSubmit} disabled={loading}>
						{loading ? 'Đang lưu...' : 'Lưu'}
					</Button>
				</Box>
			</DialogContent>
		</Dialog>
	);
}
