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
	LinearProgress,
	Link,
	Divider,
	ToggleButtonGroup,
	ToggleButton,
} from '@mui/material';
import type { AiSuggestedKeyword } from '../types';
import CustomTable from '../../../components/custom-table/CustomTable';
import type { TableField } from '../../../types/tableFields.types';
import type { TableRowData } from '../../../types/tableRows.types';
import { useAiProgress } from '../hooks/useAiProgress';
import { RelatedQueriesPanel } from './RelatedQueriesPanel';
import { RelatedTopicsPanel } from './RelatedTopicsPanel';
import { TrendLineChart } from './TrendLineChart';

interface KeywordAiResultDialogProps {
	open: boolean;
	loading: boolean;
	generateLoading?: boolean;
	suggestions: AiSuggestedKeyword[];
	timeRange?: string;
	hideRelated?: boolean;
	onClose: () => void;
	onConfirm: (selectedItems: AiSuggestedKeyword[]) => void;
	onRetry?: (timeRange: string) => void;
	onExit?: () => void;
}

function toGoogleTrendsDate(timeRange: string): string {
	return `today ${timeRange}`;
}

function buildTrendsUrl(keyword: string, timeRange: string): string {
	const date = encodeURIComponent(toGoogleTrendsDate(timeRange));
	return `https://trends.google.com.vn/trends/explore?date=${date}&geo=VN&q=${encodeURIComponent(keyword)}&hl=vi`;
}

export function KeywordAiResultDialog({ open, loading, generateLoading, suggestions, timeRange = '3-m', hideRelated = false, onClose, onConfirm, onRetry, onExit }: KeywordAiResultDialogProps) {
	const progress = useAiProgress(generateLoading ?? false);
	const [selected, setSelected] = useState<string[]>([]);
	const [prevOpen, setPrevOpen] = useState(open);
	const [prevSuggestions, setPrevSuggestions] = useState(suggestions);
	const [allSuggestions, setAllSuggestions] = useState<Map<string, AiSuggestedKeyword>>(new Map());
	const [activeKeyword, setActiveKeyword] = useState<string>('');
	const [retryTimeRange, setRetryTimeRange] = useState(timeRange);

	// Derived state: accumulate picks instead of flush
	if (open !== prevOpen) {
		setPrevOpen(open);
		if (open) {
			setAllSuggestions(new Map(suggestions.map(s => [s.name, s])));
			setSelected(suggestions.map((s) => s.name));
			if (suggestions.length > 0) setActiveKeyword(suggestions[0].name);
		} else {
			setAllSuggestions(new Map());
			setSelected([]);
			setActiveKeyword('');
		}
	} else if (suggestions !== prevSuggestions) {
		setPrevSuggestions(suggestions);
		const newAllSuggestions = new Map(allSuggestions);
		let updated = false;
		suggestions.forEach(s => {
			if (!newAllSuggestions.has(s.name)) {
				newAllSuggestions.set(s.name, s);
				updated = true;
			}
		});
		if (updated) {
			setAllSuggestions(newAllSuggestions);
		}
		// Auto-select NEW suggestions and retain old ones
		setSelected([...new Set([...selected, ...suggestions.map((s) => s.name)])]);
		if (!activeKeyword && suggestions.length > 0) setActiveKeyword(suggestions[0].name);
	}

	const handleRetryClick = () => {
		onRetry?.(retryTimeRange);
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
		const selectedItems = selected.map(name => allSuggestions.get(name) || { name });
		console.log("selectedItems", selectedItems);
		onConfirm(selectedItems as AiSuggestedKeyword[]);
	};

	const hasGroupsFields = suggestions.some(s => s.currentScore !== undefined || s.avg !== undefined);
	const hasTrendTimeline = suggestions.some(s => s.trendTimeline && s.trendTimeline.length > 0);

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
			label: 'TÊN BỘ KEYWORD',
			width: 250,
			renderCell: (row: TableRowData) => (
				<Link
					href={buildTrendsUrl(String(row.name), timeRange)}
					target="_blank"
					rel="noopener noreferrer"
					underline="hover"
				>
					{String(row.name)}
				</Link>
			)
		},
		{
			id: 'reason',
			name: 'reason',
			label: 'LÝ DO',
			width: 400,
			wrapText: true,
		},
		...(!hasGroupsFields ? [{
			id: 'nameScore',
			name: 'nameScore',
			label: 'ĐIỂM SỐ',
			width: 120,
			align: 'center' as const,
			renderCell: (row: TableRowData) => row.nameScore !== undefined ? `~${row.nameScore}` : '-',
		}] : []),
		...(hasGroupsFields ? [
			{
				id: 'currentScore',
				name: 'currentScore',
				label: 'ĐIỂM HIỆN TẠI',
				width: 120,
				align: 'center' as const,
				renderCell: (row: TableRowData) => row.currentScore !== undefined ? String(row.currentScore) : '-',
			},
			{
				id: 'avg',
				name: 'avg',
				label: 'TB TRENDS',
				width: 100,
				align: 'center' as const,
				renderCell: (row: TableRowData) => row.avg !== undefined ? String(row.avg) : '-',
			},
			{
				id: 'slope',
				name: 'slope',
				label: 'XU HƯỚNG',
				width: 100,
				align: 'center' as const,
				renderCell: (row: TableRowData) => row.slope !== undefined ? (Number(row.slope) > 0 ? `+${row.slope}` : String(row.slope)) : '-',
			},
			{
				id: 'isSpike',
				name: 'isSpike',
				label: 'SPIKE',
				width: 80,
				align: 'center' as const,
				renderCell: (row: TableRowData) => row.isSpike ? 'Có' : 'Không',
			},
		] : []),
		...(hasTrendTimeline ? [{
			id: 'trendTimeline',
			name: 'trendTimeline',
			label: 'XU HƯỚNG',
			width: 160,
			align: 'center' as const,
			renderCell: (row: TableRowData) => {
				const timeline = row.trendTimeline as import('../types').TrendTimelinePoint[] | undefined;
				if (!timeline || timeline.length === 0) return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>;
				const score = row.currentScore !== undefined ? Number(row.currentScore) : undefined;
				return (
					<Box sx={{ width: 150, height: 48 }}>
						<TrendLineChart data={timeline} currentScore={score} height={48} showAxes={false} />
					</Box>
				);
			},
		}] : []),
	], [selected, handleToggle, hasGroupsFields, hasTrendTimeline, timeRange]);

	const tableData = useMemo(() => {
		return suggestions.map((s, idx) => ({ ...s, id: s.name, __index: idx }));
	}, [suggestions]);

	const checkedInCurrentPage = suggestions.filter(s => selected.includes(s.name));
	const allCheckedInPage = suggestions.length > 0 && checkedInCurrentPage.length === suggestions.length;
	const isIndeterminate = checkedInCurrentPage.length > 0 && checkedInCurrentPage.length < suggestions.length;

	return (
		<>
			<Dialog open={open} onClose={!loading && !generateLoading ? onClose : undefined} maxWidth="lg" fullWidth>
				<DialogTitle sx={{ fontWeight: 600, pb: generateLoading ? 0 : undefined }}>Kết quả gợi ý bộ từ khóa từ AI</DialogTitle>
				{generateLoading && (
					<Box sx={{ px: 3, pt: 1.5, pb: 0.5 }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
							<Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
								✨ AI đang tạo lại keywords, bạn có thể đóng hộp thoại này...
							</Typography>
							<Typography variant="caption" color="primary" sx={{ fontWeight: 700, ml: 1, whiteSpace: 'nowrap' }}>
								{Math.round(progress)}%
							</Typography>
						</Box>
						<LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 2, height: 6 }} />
					</Box>
				)}
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

						{/* Trends Analysis từ data trả về */}
						{suggestions.length > 0 && suggestions.some(s => hideRelated ? !!s.trendTimeline?.length : !!(s.relatedQueries ?? s.relatedTopics ?? s.trendTimeline?.length)) && (
							<>
								<Divider sx={{ my: 1 }} />
								<Box>
									<Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
										Phân tích xu hướng
									</Typography>
									<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
										{suggestions.filter(s => hideRelated ? !!s.trendTimeline?.length : !!(s.relatedQueries ?? s.relatedTopics ?? s.trendTimeline?.length)).map((s) => (
											<Chip
												key={s.name}
												label={s.name}
												size="small"
												variant={activeKeyword === s.name ? 'filled' : 'outlined'}
												color={activeKeyword === s.name ? 'primary' : 'default'}
												onClick={() => setActiveKeyword(s.name)}
												sx={{ cursor: 'pointer', fontWeight: activeKeyword === s.name ? 700 : 400 }}
											/>
										))}
									</Box>
									{activeKeyword && (() => {
										const activeSuggestion = suggestions.find(s => s.name === activeKeyword);
										return (
											<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
												{activeSuggestion?.trendTimeline && activeSuggestion.trendTimeline.length > 0 && (
													<Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
														<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
															Biểu đồ xu hướng — {activeKeyword}
														</Typography>
														<TrendLineChart
															data={activeSuggestion.trendTimeline}
															currentScore={activeSuggestion.currentScore}
															height={180}
															showAxes={true}
														/>
													</Box>
												)}
												{!hideRelated && (
													<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
														<RelatedQueriesPanel data={activeSuggestion?.relatedQueries} timeRange={retryTimeRange} />
														<RelatedTopicsPanel data={activeSuggestion?.relatedTopics} timeRange={retryTimeRange} />
													</Box>
												)}
											</Box>
										);
									})()}
								</Box>
							</>
						)}
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					{onExit && !generateLoading && (
						<Button onClick={onExit} color="error" variant="outlined" disabled={loading} sx={{ mr: 'auto' }}>
							Thoát
						</Button>
					)}
					{generateLoading && (
						<Button onClick={onClose} color="inherit" sx={{ mr: 'auto' }}>
							Đóng (vẫn xử lý nền)
						</Button>
					)}
					{onRetry && (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<ToggleButtonGroup
								value={retryTimeRange}
								exclusive
								onChange={(_, val) => { if (val) setRetryTimeRange(val); }}
								size="small"
								disabled={loading || generateLoading}
								sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.5, fontSize: 12, textTransform: 'none', fontWeight: 600 } }}
							>
								<ToggleButton value="1-m">1 tháng</ToggleButton>
								<ToggleButton value="3-m">3 tháng</ToggleButton>
							</ToggleButtonGroup>
							<Button onClick={handleRetryClick} disabled={loading || generateLoading} color="secondary">
								{generateLoading ? 'Đang tạo lại...' : 'Tạo lại AI (Retry)'}
							</Button>
						</Box>
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

		</>
	);
}
