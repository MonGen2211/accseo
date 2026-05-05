import React, { useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	Box,
	IconButton,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import Typography from '@mui/material/Typography';

import { useAppDispatch, useAppSelector } from '../../../app/store';
import { createKeywordGroupItems } from '../keywordGroupSlice';
import { useToastify } from '../../../components/Toastify';
import { KeywordItemStatus } from '../types';

interface KeywordItemRow {
	name: string;
	reason: string;
	status: KeywordItemStatus;
}

interface KeywordGroupFormProps {
	open: boolean;
	domainId: string;
	onClose: () => void;
	onSuccess?: () => void;
}

const STATUS_OPTIONS: { value: KeywordItemStatus; label: string; color: string }[] = [
	{ value: KeywordItemStatus.PENDING_APPROVAL, label: 'Chờ duyệt', color: '#f59e0b' },
	{ value: KeywordItemStatus.NOT_STARTED, label: 'Chưa triển khai', color: '#6b7280' },
	{ value: KeywordItemStatus.IN_PROGRESS, label: 'Đang triển khai', color: '#3b82f6' },
	{ value: KeywordItemStatus.DEPLOYED, label: 'Đã triển khai', color: '#10b981' },
];

const createEmptyItem = (): KeywordItemRow => ({
	name: '',
	reason: '',
	status: KeywordItemStatus.PENDING_APPROVAL,
});

export function KeywordGroupForm({ open, domainId, onClose, onSuccess }: KeywordGroupFormProps) {
	const [items, setItems] = useState<KeywordItemRow[]>([createEmptyItem()]);
	const dispatch = useAppDispatch();
	const { actionLoading } = useAppSelector((state) => state.keywordGroups);
	const { showToast } = useToastify();

	const handleAddItem = () => {
		setItems((prev) => [...prev, createEmptyItem()]);
	};

	const handleRemoveItem = (index: number) => {
		setItems((prev) => prev.filter((_, i) => i !== index));
	};

	const handleItemChange = (index: number, field: keyof KeywordItemRow, value: string) => {
		setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
	};

	const [bulkText, setBulkText] = useState('');
	const [showBulkInput, setShowBulkInput] = useState(false);

	const handleBulkPaste = () => {
		const lines = bulkText
			.split('\n')
			.map((l) => l.trim())
			.filter(Boolean);
		if (lines.length === 0) return;
		const newItems = lines.map((name) => ({ name, reason: '', status: KeywordItemStatus.PENDING_APPROVAL }));
		setItems((prev) => {
			const filtered = prev.filter((i) => i.name.trim());
			return [...filtered, ...newItems];
		});
		setBulkText('');
		setShowBulkInput(false);
	};

	const validCount = items.filter((i) => i.name.trim()).length;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const validItems = items
			.filter((item) => item.name.trim())
			.map((item) => ({
				name: item.name.trim(),
				...(item.reason.trim() && { reason: item.reason.trim() }),
				status: item.status,
			}));

		if (validItems.length === 0) return;

		try {
			await dispatch(createKeywordGroupItems({ domainId, items: validItems })).unwrap();
			showToast('Thêm từ khoá thành công!', 'success');
			setItems([createEmptyItem()]);
			onSuccess?.();
			onClose();
		} catch (err: unknown) {
			const errorMsg = typeof err === 'string' ? err : 'Đã có lỗi xảy ra';
			showToast(errorMsg, 'danger');
		}
	};

	const handleClose = () => {
		setItems([createEmptyItem()]);
		setBulkText('');
		setShowBulkInput(false);
		onClose();
	};

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
			<DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
				Thêm từ khoá
				{validCount > 0 && (
					<Chip label={`${validCount} từ khoá`} size="small" color="primary" variant="outlined" />
				)}
			</DialogTitle>
			<form onSubmit={handleSubmit}>
				<DialogContent dividers sx={{ maxHeight: '60vh' }}>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<Typography variant="body2" color="text.secondary">
							Thêm từ khoá cho Domain: <strong>{domainId}</strong>
						</Typography>

						{/* Header row */}
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: '2fr 2fr 160px 40px',
								gap: 1.5,
								px: 0.5,
							}}
						>
							<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
								Từ khoá *
							</Typography>
							<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
								Lý do
							</Typography>
							<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
								Trạng thái
							</Typography>
							<Box />
						</Box>

						{/* Item rows */}
						{items.map((item, index) => (
							<Box
								key={index}
								sx={{
									display: 'grid',
									gridTemplateColumns: '2fr 2fr 160px 40px',
									gap: 1.5,
									alignItems: 'center',
								}}
							>
								<TextField
									placeholder="Nhập từ khoá"
									size="small"
									fullWidth
									value={item.name}
									onChange={(e) => handleItemChange(index, 'name', e.target.value)}
									required
									autoFocus={index === items.length - 1}
								/>
								<TextField
									placeholder="Nhập lý do (tuỳ chọn)"
									size="small"
									fullWidth
									value={item.reason}
									onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
								/>
								<FormControl size="small" fullWidth>
									<InputLabel>Trạng thái</InputLabel>
									<Select
										value={item.status}
										label="Trạng thái"
										onChange={(e) => handleItemChange(index, 'status', e.target.value)}
									>
										{STATUS_OPTIONS.map((opt) => (
											<MenuItem key={opt.value} value={opt.value}>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<Box
														sx={{
															width: 8,
															height: 8,
															borderRadius: '50%',
															backgroundColor: opt.color,
															flexShrink: 0,
														}}
													/>
													{opt.label}
												</Box>
											</MenuItem>
										))}
									</Select>
								</FormControl>
								<IconButton
									type="button"
									onClick={() => handleRemoveItem(index)}
									disabled={items.length === 1}
									color="error"
									size="small"
								>
									<DeleteIcon fontSize="small" />
								</IconButton>
							</Box>
						))}

						{/* Bulk paste area */}
						{showBulkInput && (
							<Box sx={{ border: '1px dashed #cbd5e1', borderRadius: 2, p: 2, bgcolor: '#f8fafc' }}>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
									Dán danh sách từ khoá (mỗi từ khoá 1 dòng)
								</Typography>
								<TextField
									multiline
									rows={6}
									fullWidth
									size="small"
									placeholder={'Thanh lý\nChấm dứt\nĐiều khoản\n...'}
									value={bulkText}
									autoFocus
									onChange={(e) => setBulkText(e.target.value)}
								/>
								<Box sx={{ display: 'flex', gap: 1, mt: 1.5, justifyContent: 'flex-end' }}>
									<Button size="small" color="inherit" onClick={() => { setShowBulkInput(false); setBulkText(''); }}>
										Hủy
									</Button>
									<Button size="small" variant="contained" onClick={handleBulkPaste} disabled={!bulkText.trim()}>
										Thêm {bulkText.split('\n').filter((l) => l.trim()).length} từ khoá
									</Button>
								</Box>
							</Box>
						)}

						{/* Add buttons */}
						<Box sx={{ display: 'flex', gap: 1 }}>
							<Button
								startIcon={<AddIcon />}
								onClick={handleAddItem}
								variant="text"
								size="small"
								sx={{ textTransform: 'none' }}
							>
								Thêm dòng
							</Button>
							<Button
								startIcon={<ContentPasteIcon />}
								onClick={() => setShowBulkInput((v) => !v)}
								variant="text"
								size="small"
								color="secondary"
								sx={{ textTransform: 'none' }}
							>
								Nhập nhiều
							</Button>
						</Box>
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={handleClose} disabled={actionLoading} color="inherit">
						Hủy
					</Button>
					<Button type="submit" variant="contained" disabled={actionLoading || validCount === 0}>
						{actionLoading ? 'Đang thêm...' : `Thêm ${validCount} từ khoá`}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
