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
	const [namesText, setNamesText] = useState('');
	const dispatch = useAppDispatch();
	const { actionLoading } = useAppSelector((state) => state.keywordGroups);
	const { showToast } = useToastify();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!namesText.trim()) return;

		const names = namesText.split('\n').map(n => n.trim()).filter(n => n);
		if (names.length === 0) return;

		try {
			await dispatch(createKeywordGroup({ names, domainId })).unwrap();
			showToast('Tạo bộ keywords thành công!', 'success');
			setNamesText('');
			onSuccess?.();
			onClose();
		} catch (err: unknown) {
			const errorMsg = typeof err === 'string' ? err : 'Đã có lỗi xảy ra';
			showToast(errorMsg, 'danger');
		}
	};

	const handleClose = () => {
		setNamesText('');
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
							label="Tên bộ keywords (mỗi dòng 1 từ khóa)"
							variant="outlined"
							fullWidth
							multiline
							minRows={4}
							size="small"
							value={namesText}
							onChange={(e) => setNamesText(e.target.value)}
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
						disabled={actionLoading || !namesText.trim()}
					>
						{actionLoading ? 'Đang tạo...' : 'Tạo từ khoá'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
