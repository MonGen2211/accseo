import React, { useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	Box,
	Typography,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { createKeywordGroup } from '../keywordGroupSlice';
import { useToastify } from '../../../components/Toastify';

interface KeywordGroupFormProps {
	open: boolean;
	domainId: string;
	onClose: () => void;
	onSuccess?: () => void;
}

export function KeywordGroupForm({ open, domainId, onClose, onSuccess }: KeywordGroupFormProps) {
	const [name, setName] = useState('');
	const dispatch = useAppDispatch();
	const { actionLoading } = useAppSelector((state) => state.keywordGroups);
	const { showToast } = useToastify();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		try {
			await dispatch(createKeywordGroup({ name: name.trim(), domainId })).unwrap();
			showToast('Tạo bộ keywords thành công!', 'success');
			setName('');
			onSuccess?.();
			onClose();
		} catch (err: unknown) {
			const errorMsg = typeof err === 'string' ? err : 'Đã có lỗi xảy ra';
			showToast(errorMsg, 'danger');
		}
	};

	const handleClose = () => {
		setName('');
		onClose();
	};

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle sx={{ fontWeight: 600 }}>Thêm bộ keywords</DialogTitle>
			<form onSubmit={handleSubmit}>
				<DialogContent dividers>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<Typography variant="body2" color="text.secondary">
							Nhập tên bộ keywords bạn muốn tạo cho Domain ID: <strong>{domainId}</strong>
						</Typography>
						<TextField
							label="Tên bộ keywords"
							variant="outlined"
							fullWidth
							size="small"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							autoFocus
						/>
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={handleClose} disabled={actionLoading} color="inherit">
						Hủy
					</Button>
					<Button
						type="submit"
						variant="contained"
						disabled={actionLoading || !name.trim()}
					>
						{actionLoading ? 'Đang tạo...' : 'Tạo từ khoá'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
