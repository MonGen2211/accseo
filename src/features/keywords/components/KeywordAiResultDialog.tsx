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
} from '@mui/material';
import type { AiSuggestedKeyword } from '../types';
import CustomTable from '../../../components/custom-table/CustomTable';
import type { TableField } from '../../../types/tableFields.types';
import type { TableRowData } from '../../../types/tableRows.types';

interface KeywordAiResultDialogProps {
	open: boolean;
	loading: boolean;
	suggestions: AiSuggestedKeyword[];
	onClose: () => void;
	onConfirm: (selectedNames: string[]) => void;
}

export function KeywordAiResultDialog({ open, loading, suggestions, onClose, onConfirm }: KeywordAiResultDialogProps) {
	const [selected, setSelected] = useState<string[]>([]);
	const [prevOpen, setPrevOpen] = useState(open);

	// Derived state during render (React 18 recommended way to reset state on prop change)
	if (open !== prevOpen) {
		setPrevOpen(open);
		if (open) {
			setSelected(suggestions.map((s) => s.name));
		} else {
			setSelected([]);
		}
	}

	const handleToggleAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelected(suggestions.map((s) => s.name));
		} else {
			setSelected([]);
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
		onConfirm(selected);
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
			label: 'LÝ DO (REASON)',
			width: 400,
		},
	], [selected, handleToggle]);

	const tableData = useMemo(() => {
		return suggestions.map((s, idx) => ({ ...s, id: s.name, __index: idx }));
	}, [suggestions]);

	return (
		<Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="lg" fullWidth>
			<DialogTitle sx={{ fontWeight: 600 }}>Kết quả gợi ý từ AI</DialogTitle>
			<DialogContent dividers>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					<Typography variant="body2" color="text.secondary">
						Dưới đây là danh sách từ khóa do AI gợi ý. Chọn các từ khóa muốn tạo và nhấn Xác nhận.
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
											indeterminate={selected.length > 0 && selected.length < suggestions.length}
											checked={suggestions.length > 0 && selected.length === suggestions.length}
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
				<Button onClick={onClose} disabled={loading} color="inherit">
					Bỏ qua
				</Button>
				<Button
					onClick={handleSubmit}
					variant="contained"
					disabled={loading || selected.length === 0}
				>
					{loading ? 'Đang tạo...' : `Xác nhận tạo (${selected.length})`}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
