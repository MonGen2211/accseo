import React, { useState, useMemo } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	Checkbox,
	FormControlLabel,
	Chip,
	TextField,
} from '@mui/material';
import type { AiSuggestedKeyword } from '../types';
import CustomTable from '../../../components/custom-table/CustomTable';
import type { TableField } from '../../../types/tableFields.types';
import type { TableRowData } from '../../../types/tableRows.types';

interface KeywordAiResultDialogProps {
	open: boolean;
	loading: boolean;
	generateLoading?: boolean;
	suggestions: AiSuggestedKeyword[];
	onClose: () => void;
	onConfirm: (selectedItems: AiSuggestedKeyword[]) => void;
	onRetry?: (rejection_reason: string[]) => void;
}

export function KeywordAiResultDialog({ open, loading, generateLoading, suggestions, onClose, onConfirm, onRetry }: KeywordAiResultDialogProps) {
	const [selected, setSelected] = useState<string[]>([]);
	const [prevOpen, setPrevOpen] = useState(open);
	const [prevSuggestions, setPrevSuggestions] = useState(suggestions);

	// Derived state during render: accumulate picks instead of flush
	if (open !== prevOpen) {
		setPrevOpen(open);
		if (open) {
			setSelected(suggestions.map((s) => s.name));
		} else {
			setSelected([]);
		}
	} else if (suggestions !== prevSuggestions) {
		setPrevSuggestions(suggestions);
		// Auto-select NEW suggestions and retain old ones
		setSelected([...new Set([...selected, ...suggestions.map((s) => s.name)])]);
	}

	// ── Reason dialog state ──
	const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
	const [reasons, setReasons] = useState<Record<string, string>>({});

	const uncheckedItems = suggestions.filter(s => !selected.includes(s.name));
	const allReasonsProvided = uncheckedItems.length > 0 && uncheckedItems.every(item => (reasons[item.name] || '').trim().length > 0);

	const handleRetryClick = () => {
		if (uncheckedItems.length > 0) {
			const initialReasons: Record<string, string> = {};
			uncheckedItems.forEach(item => {
				initialReasons[item.name] = '';
			});
			setReasons(initialReasons);
			setReasonDialogOpen(true);
		} else {
			onRetry?.(suggestions.map(() => ''));
		}
	};

	const handleReasonConfirm = () => {
		const rejection_reason = suggestions.map(s => {
			if (selected.includes(s.name)) return '';
			return reasons[s.name] || '';
		});
		setReasonDialogOpen(false);
		onRetry?.(rejection_reason);
	};

	const handleToggleAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelected(prev => [...new Set([...prev, ...suggestions.map((s) => s.name)])]);
		} else {
			const currentNames = new Set(suggestions.map(s => s.name));
			setSelected(prev => prev.filter(name => !currentNames.has(name)));
		}
	};

	const handleToggle = React.useCallback((name: string) => {
		setSelected((prev) => {
			const newSelected = [...prev];
			const currentIndex = newSelected.indexOf(name);
			if (currentIndex === -1) {
				newSelected.push(name);
			} else {
				newSelected.splice(currentIndex, 1);
			}
			return newSelected;
		});
	}, []);

	const handleSubmit = () => {
		if (selected.length === 0) return;
		const selectedItems = suggestions.filter(s => selected.includes(s.name));
		onConfirm(selectedItems);
	};

	const fields: TableField[] = useMemo(() => [
		{
			id: 'select',
			name: 'select',
			label: 'CHỌN',
			width: 80,
			align: 'left',
			renderCell: (row: TableRowData) => (
				<Checkbox
					size="small"
					checked={selected.includes(String(row.name))}
					onChange={() => handleToggle(String(row.name))}
				/>
			),
		},
		{
			id: 'stt',
			name: 'stt',
			label: 'STT',
			width: 60,
			align: 'center',
			renderCell: (row: TableRowData) => row.__index + 1,
		},
		{
			id: 'name',
			name: 'name',
			label: 'TÊN KEYWORD',
			width: 250,
		},
		{
			id: 'reason',
			name: 'reason',
			label: 'LÝ DO',
			width: 400,
			wrapText: true,
		},
		{
			id: 'expandExample',
			name: 'expandExample',
			label: 'VÍ DỤ MỞ RỘNG',
			width: 300,
			wrapText: true,
		},
	], [selected, handleToggle]);

	const tableData = useMemo(() => {
		return suggestions.map((s, idx) => ({ ...s, id: s.name, __index: idx }));
	}, [suggestions]);

	const checkedInCurrentPage = suggestions.filter(s => selected.includes(s.name));
	const allCheckedInPage = suggestions.length > 0 && checkedInCurrentPage.length === suggestions.length;
	const isIndeterminate = checkedInCurrentPage.length > 0 && checkedInCurrentPage.length < suggestions.length;

	return (
		<>
			<Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="lg" fullWidth>
				<DialogTitle sx={{ fontWeight: 600 }}>Kết quả gợi ý bộ từ khóa từ AI</DialogTitle>
				<DialogContent dividers>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

						{/* Giỏ chứa từ khoá đã chọn (Cherry-picks) */}
						<Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
							<Typography variant="body2" color="primary.main" sx={{ fontWeight: 600, mb: 1.5 }}>
								Giỏ chứa bộ từ khoá sẽ tạo ({selected.length})
							</Typography>
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 150, overflow: 'auto' }}>
								{selected.length === 0 && (
									<Typography variant="caption" color="text.secondary">
										Chưa có bộ từ khoá nào được chọn.
									</Typography>
								)}
								{selected.map(name => (
									<Chip
										key={name}
										label={name}
										onDelete={() => handleToggle(name)}
										size="small"
										color="primary"
										variant="filled"
										sx={{ fontWeight: 500 }}
									/>
								))}
							</Box>
						</Box>

						<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
							Dưới đây là danh sách các bộ từ khóa do AI gợi ý ở lần Generate này. Tick chọn để thêm vào Giỏ.
						</Typography>

						{/* CustomTable integration */}
						<Box sx={{ '.MuiPaper-root': { mx: 0, mb: 0 } }}>
							<CustomTable
								fields={fields}
								data={tableData}
								enablePagination={false}
								headerActions={
									<FormControlLabel
										control={
											<Checkbox
												size="small"
												indeterminate={isIndeterminate}
												checked={allCheckedInPage}
												onChange={handleToggleAll}
											/>
										}
										label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Chọn tất cả</Typography>}
										sx={{ mr: 0 }}
									/>
								}
							/>
						</Box>
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					{onRetry && (
						<Button onClick={handleRetryClick} disabled={loading || generateLoading} color="secondary">
							{generateLoading ? 'Đang tạo lại...' : 'Tạo lại AI (Retry)'}
						</Button>
					)}
					<Button
						onClick={handleSubmit}
						variant="contained"
						disabled={loading || generateLoading || selected.length === 0}
					>
						{loading ? 'Đang tạo...' : `Xác nhận tạo (${selected.length})`}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Popup nhập lý do cho keywords không chọn */}
			<Dialog open={reasonDialogOpen} onClose={() => setReasonDialogOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ fontWeight: 600 }}>Lý do không chọn</DialogTitle>
				<DialogContent dividers>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
						<Typography variant="body2" color="text.secondary">
							Vui lòng nhập lý do cho các keyword không được chọn:
						</Typography>
						{uncheckedItems.map((item) => (
							<TextField
								key={item.name}
								label={item.name}
								value={reasons[item.name] || ''}
								onChange={(e) => setReasons(prev => ({ ...prev, [item.name]: e.target.value }))}
								fullWidth
								size="small"
								required
								multiline
								minRows={1}
								maxRows={3}
								placeholder="Nhập lý do..."
							/>
						))}
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={() => setReasonDialogOpen(false)} color="inherit">Hủy</Button>
					<Button onClick={handleReasonConfirm} variant="contained" disabled={!allReasonsProvided}>
						Xác nhận
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
