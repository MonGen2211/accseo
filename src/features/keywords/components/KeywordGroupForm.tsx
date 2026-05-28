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
	Chip,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
} from '@mui/material';

import { useAppDispatch, useAppSelector } from '../../../app/store';
import { createKeywordGroupItems } from '../keywordGroupSlice';
import { useToastify } from '../../../components/Toastify';
import { KeywordItemStatus } from '../types';

interface KeywordGroupFormProps {
	open: boolean;
	domainId: string;
	onClose: () => void;
	onSuccess?: () => void;
}

const STATUS_OPTIONS: { value: KeywordItemStatus; label: string; color: string }[] = [
	{ value: KeywordItemStatus.PENDING_APPROVAL, label: 'Chờ duyệt', color: '#f59e0b' },
	{ value: KeywordItemStatus.NOT_STARTED, label: 'Chưa triển khai', color: 'text.secondary' },
	{ value: KeywordItemStatus.IN_PROGRESS, label: 'Đang triển khai', color: '#3b82f6' },
	{ value: KeywordItemStatus.DEPLOYED, label: 'Đã triển khai', color: '#10b981' },
];

export function KeywordGroupForm({ open, domainId, onClose, onSuccess }: KeywordGroupFormProps) {
	const [text, setText] = useState('');
	const [status, setStatus] = useState<KeywordItemStatus>(KeywordItemStatus.PENDING_APPROVAL);
	const dispatch = useAppDispatch();
	const { actionLoading } = useAppSelector((state) => state.keywordGroups);
	const { showToast } = useToastify();

	const keywords = text
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (keywords.length === 0) return;

		const items = keywords.map((name) => ({ name, status }));

		try {
			await dispatch(createKeywordGroupItems({ domainId, items })).unwrap();
			showToast('Thêm từ khoá thành công!', 'success');
			setText('');
			onSuccess?.();
			onClose();
		} catch (err: unknown) {
			const errorMsg = typeof err === 'string' ? err : 'Đã có lỗi xảy ra';
			showToast(errorMsg, 'danger');
		}
	};

	const handleClose = () => {
		setText('');
		setStatus(KeywordItemStatus.PENDING_APPROVAL);
		onClose();
	};

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
				Thêm từ khoá
				{keywords.length > 0 && (
					<Chip label={`${keywords.length} từ khoá`} size="small" color="primary" variant="outlined" />
				)}
			</DialogTitle>
			<form onSubmit={handleSubmit}>
				<DialogContent dividers>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<Typography variant="body2" color="text.secondary">
							Mỗi dòng một từ khoá.
						</Typography>
						<TextField
							multiline
							rows={10}
							fullWidth
							size="small"
							placeholder={'Thanh lý\nChấm dứt\nĐiều khoản\n...'}
							value={text}
							autoFocus
							onChange={(e) => setText(e.target.value)}
						/>
						<FormControl size="small" fullWidth>
							<InputLabel>Trạng thái</InputLabel>
							<Select
								value={status}
								label="Trạng thái"
								onChange={(e) => setStatus(e.target.value as KeywordItemStatus)}
							>
								{STATUS_OPTIONS.map((opt) => (
									<MenuItem key={opt.value} value={opt.value}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											<Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: opt.color, flexShrink: 0 }} />
											{opt.label}
										</Box>
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={handleClose} disabled={actionLoading} color="inherit">
						Hủy
					</Button>
					<Button type="submit" variant="contained" disabled={actionLoading || keywords.length === 0}>
						{actionLoading ? 'Đang thêm...' : `Thêm ${keywords.length > 0 ? keywords.length + ' ' : ''}từ khoá`}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
