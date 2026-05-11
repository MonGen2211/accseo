import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchKeywordGroups, deleteKeywordGroup, updateKeywordGroupStatus, setKeywordSortField, setKeywordSortOrder, setKeywordStatusFilter, setKeywordSearchFilter } from '../keywordGroupSlice';
import { useDebounce } from '../../../hooks/useDebounce';
import { KeywordGroupTable } from './KeywordGroupTable';
import { KeywordGroupForm } from './KeywordGroupForm';
import { KeywordGroupsAiDialog } from './KeywordGroupsAiDialog';
import { KeywordGroupsStreamDialog } from './KeywordGroupsStreamDialog';
import { KeywordAiResultDialog } from './KeywordAiResultDialog';
import type { AiSuggestedKeyword, StreamLogEvent } from '../types';
import { keywordGroupService } from '../keywordGroupService';
import { createKeywordGroupItems } from '../keywordGroupSlice';
import { GscPanel } from './GscPanel';
import { Ga4Panel } from './Ga4Panel';

import { useToastify } from '../../../components/Toastify';
import type { TableRowData } from '../../../types/tableRows.types';
import { useParams, useSearchParams } from 'react-router-dom';

export default function KeywordPage() {
	const { domainId } = useParams<{ domainId: string }>();
	const [searchParams] = useSearchParams();
	const dispatch = useAppDispatch();
	const { items, loading, total, page, limit, deleteLoadingId, statusLoadingId, sortField, sortOrder, statusFilter, searchFilter, summary } = useAppSelector((state) => state.keywordGroups);
	const { showToast } = useToastify();

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isAiGroupsDialogOpen, setIsAiGroupsDialogOpen] = useState(false);
	const [isStreamDialogOpen, setIsStreamDialogOpen] = useState(false);
	const [isAiResultOpen, setIsAiResultOpen] = useState(false);
	const [streamLogs, setStreamLogs] = useState<StreamLogEvent[]>([]);
	const [isStreaming, setIsStreaming] = useState(false);
	const [aiSuggestions, setAiSuggestions] = useState<AiSuggestedKeyword[]>([]);
	const [aiSubmitLoading, setAiSubmitLoading] = useState(false);
	const [lastAiGroupsTimeRange, setLastAiGroupsTimeRange] = useState<string>('3-m');
	const [lastAiGroupsMinScore, setLastAiGroupsMinScore] = useState<number>(60);
	const [lastAiGroupsCount, setLastAiGroupsCount] = useState<number>(2);

	const abortRef = useRef<AbortController | null>(null);
	const [activeAnalytic, setActiveAnalytic] = useState<'gsc' | 'ga4'>('gsc');
	const debouncedSearch = useDebounce(searchFilter, 400);

	const loadData = (p: number, l: number) => {
		if (domainId) {
			dispatch(fetchKeywordGroups({ domainId, page: p + 1, limit: l, sort: sortField, order: sortOrder, status: statusFilter, search: searchFilter }));
		}
	};

	// Pre-fill search/status từ URL query param khi navigate từ dashboard
	useEffect(() => {
		const searchFromUrl = searchParams.get('search');
		const statusFromUrl = searchParams.get('status');
		if (searchFromUrl) dispatch(setKeywordSearchFilter(searchFromUrl));
		if (statusFromUrl) dispatch(setKeywordStatusFilter(statusFromUrl));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		loadData(0, limit);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [domainId, sortField, sortOrder, statusFilter, debouncedSearch]);

	const handlePageChange = (newPage: number) => loadData(newPage, limit);
	const handleRowsPerPageChange = (newLimit: number) => loadData(0, newLimit);

	const handleSort = (field: string) => {
		if (field === sortField) {
			dispatch(setKeywordSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'));
		} else {
			dispatch(setKeywordSortField(field as typeof sortField));
			dispatch(setKeywordSortOrder('desc'));
		}
	};

	const handleFormSuccess = () => loadData(0, limit);

	const startStream = async (timeRange: string, minScore: number, count: number) => {
		if (!domainId) return;

		setLastAiGroupsTimeRange(timeRange);
		setLastAiGroupsMinScore(minScore);
		setLastAiGroupsCount(count);
		setStreamLogs([]);
		setIsStreaming(true);
		setIsAiGroupsDialogOpen(false);
		setIsStreamDialogOpen(true);

		const controller = new AbortController();
		abortRef.current = controller;

		try {
			await keywordGroupService.suggestKeywordsByGroupsStream(
				{ domainId, timeRange, minScore, count },
				(log) => setStreamLogs((prev) => [...prev, log]),
				(suggestions) => {
					setIsStreamDialogOpen(false);
					setIsStreaming(false);
					setAiSuggestions(suggestions);
					setIsAiResultOpen(true);
					showToast('AI đã tạo xong! Xem kết quả để xác nhận.', 'success');
				},
				(errMsg) => {
					setIsStreamDialogOpen(false);
					setIsStreaming(false);
					showToast(errMsg, 'danger');
				},
				controller.signal,
			);
		} catch (err: unknown) {
			if ((err as { name?: string }).name === 'AbortError') return;
			setIsStreamDialogOpen(false);
			setIsStreaming(false);
			showToast('Đã có lỗi xảy ra', 'danger');
		} finally {
			abortRef.current = null;
		}
	};

	const handleStreamCancel = () => {
		abortRef.current?.abort();
		abortRef.current = null;
		setIsStreamDialogOpen(false);
		setIsStreaming(false);
		setStreamLogs([]);
	};

	const handleAiRetry = (retryTimeRange: string) => {
		setLastAiGroupsTimeRange(retryTimeRange);
		setIsAiResultOpen(false);
		setAiSuggestions([]);
		startStream(retryTimeRange, lastAiGroupsMinScore, lastAiGroupsCount);
	};

	const handleAiConfirmSelected = async (selectedItems: AiSuggestedKeyword[]) => {
		if (!domainId || selectedItems.length === 0) return;
		try {
			setAiSubmitLoading(true);
			await dispatch(createKeywordGroupItems({ domainId, items: selectedItems.map(item => ({ name: item.name, status: 'pending_approval' as const, ...(item.reason && { reason: item.reason }) })) })).unwrap();
			await keywordGroupService.clearTrendsLiveCache(domainId);
			showToast('Tạo keywords từ gợi ý thành công!', 'success');
			loadData(0, limit);
			setIsAiResultOpen(false);
			setAiSuggestions([]);
		} catch (err: unknown) {
			const errorMsg = typeof err === 'string' ? err : 'Đã có lỗi xảy ra';
			showToast(errorMsg, 'danger');
		} finally {
			setAiSubmitLoading(false);
		}
	};

	const handleAiExit = async () => {
		setIsAiResultOpen(false);
		setAiSuggestions([]);
		if (domainId) {
			try {
				await keywordGroupService.clearGroupsSuggestCache(domainId);
			} catch { /* best-effort */ }
		}
	};

	const handleDelete = async (row: TableRowData) => {
		const id = row.id || row._id;
		if (!id) return;
		try {
			const result = await dispatch(deleteKeywordGroup(String(id))).unwrap();
			showToast(result.message || 'Xóa bộ keywords thành công!', 'success');
			const zeroPage = page - 1;
			loadData(zeroPage > 0 && items.length === 1 ? zeroPage - 1 : zeroPage, limit);
		} catch (err: unknown) {
			const errorMsg = typeof err === 'string' ? err : 'Đã có lỗi xảy ra';
			showToast(errorMsg, 'danger');
		}
	};

	const handleStatusChange = async (row: TableRowData, newStatus: string) => {
		const id = row.id || row._id;
		if (!id) return;
		try {
			const result = await dispatch(updateKeywordGroupStatus({ id: String(id), status: newStatus })).unwrap();
			showToast(result.message || 'Cập nhật trạng thái thành công!', 'success');
		} catch (err: unknown) {
			const errorMsg = typeof err === 'string' ? err : 'Đã có lỗi xảy ra';
			showToast(errorMsg, 'danger');
		}
	};

	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, alignItems: 'stretch', pb: 10, zoom: 0.85 }}>

			{/* LEFT: 2 card chuyển đổi + panel detail */}
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, overflow: 'hidden' }}>

				{/* 2 card GSC / GA4 */}
				<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
					{/* GSC card */}
					<Paper
						elevation={0}
						onClick={() => setActiveAnalytic('gsc')}
						sx={{
							p: 2.5, borderRadius: 3, cursor: 'pointer',
							border: '2px solid',
							borderColor: activeAnalytic === 'gsc' ? '#4285F4' : 'divider',
							boxShadow: activeAnalytic === 'gsc' ? '0 4px 20px rgba(66,133,244,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
							transition: 'all 0.2s',
							'&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(66,133,244,0.15)' },
							display: 'flex', alignItems: 'center', gap: 1.5,
						}}
					>
						<Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#EBF1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
							<ManageSearchIcon sx={{ color: '#4285F4', fontSize: 22 }} />
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary', lineHeight: 1.2 }}>Search Console</Typography>
							<Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.3 }}>Clicks · Impressions</Typography>
						</Box>
						{activeAnalytic === 'gsc' && <Chip label="Đang xem" size="small" sx={{ ml: 'auto', fontSize: 10, height: 18, bgcolor: '#EBF1FB', color: '#4285F4', flexShrink: 0 }} />}
					</Paper>

					{/* GA4 card */}
					<Paper
						elevation={0}
						onClick={() => setActiveAnalytic('ga4')}
						sx={{
							p: 2.5, borderRadius: 3, cursor: 'pointer',
							border: '2px solid',
							borderColor: activeAnalytic === 'ga4' ? '#E37400' : 'divider',
							boxShadow: activeAnalytic === 'ga4' ? '0 4px 20px rgba(227,116,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
							transition: 'all 0.2s',
							'&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(227,116,0,0.15)' },
							display: 'flex', alignItems: 'center', gap: 1.5,
						}}
					>
						<Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#FEF3E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
							<BarChartOutlinedIcon sx={{ color: '#E37400', fontSize: 22 }} />
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary', lineHeight: 1.2 }}>Analytics 4</Typography>
							<Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.3 }}>Views · Sessions</Typography>
						</Box>
						{activeAnalytic === 'ga4' && <Chip label="Đang xem" size="small" sx={{ ml: 'auto', fontSize: 10, height: 18, bgcolor: '#FEF3E2', color: '#E37400', flexShrink: 0 }} />}
					</Paper>
				</Box>

				{/* Panel detail — flex: 1 để kéo dài bằng cột phải */}
				<Box sx={{ flex: 1, minHeight: 0 }}>
					{domainId && activeAnalytic === 'gsc' && <GscPanel domainId={domainId} />}
					{domainId && activeAnalytic === 'ga4' && <Ga4Panel domainId={domainId} />}
				</Box>
			</Box>

			{/* RIGHT: Bộ Keywords */}
			<Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', minWidth: 0 }}>
				<Box sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
						<Typography sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
							Bộ Keywords
						</Typography>
						<TextField
							size="small"
							placeholder="Tìm theo tên..."
							value={searchFilter}
							onChange={(e) => dispatch(setKeywordSearchFilter(e.target.value))}
							slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> } }}
							sx={{ width: 200, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
						/>
					</Box>

					{/* Quick stats bar */}
					{summary && (
						<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
							{[
								{ label: 'Tổng', value: summary.total, color: '#6B7280' },
								{ label: 'Chờ duyệt', value: summary.pending_approval, color: '#D97706' },
								{ label: 'Chưa triển khai', value: summary.not_started, color: '#9CA3AF' },
								{ label: 'Đang triển khai', value: summary.in_progress, color: '#2563EB' },
								{ label: 'Đã triển khai', value: summary.deployed, color: '#059669' },
								{ label: 'Từ chối', value: summary.rejected, color: '#DC2626' },
							].map(({ label, value, color }) => (
								<Chip
									key={label}
									label={`${label}: ${value}`}
									size="small"
									sx={{ bgcolor: `${color}12`, color, fontWeight: 600, fontSize: 11, border: `1px solid ${color}30`, height: 22 }}
								/>
							))}
						</Box>
					)}
				</Box>

				<KeywordGroupTable
					data={items}
					loading={loading}
					total={total}
					page={page - 1}
					limit={limit}
					generateAiGroupsLoading={isStreaming}
					deleteLoadingId={deleteLoadingId}
					statusLoadingId={statusLoadingId}
					onPageChange={handlePageChange}
					onRowsPerPageChange={handleRowsPerPageChange}
					onOpenCreate={() => setIsFormOpen(true)}
					onAiGenerateByGroups={() => {
						if (isStreaming) {
							setIsStreamDialogOpen(true);
						} else if (aiSuggestions.length > 0) {
							setIsAiResultOpen(true);
						} else {
							setIsAiGroupsDialogOpen(true);
						}
					}}
					onDelete={handleDelete}
					onStatusChange={handleStatusChange}
					sortBy={sortField}
					sortOrder={sortOrder}
					onSort={handleSort}
					statusFilter={statusFilter}
					onStatusFilterChange={(st) => dispatch(setKeywordStatusFilter(st))}
				/>
			</Paper>

			{/* Dialogs (không bị ảnh hưởng bởi layout) */}
			{domainId && (
				<KeywordGroupForm
					open={isFormOpen}
					domainId={domainId}
					onClose={() => setIsFormOpen(false)}
					onSuccess={handleFormSuccess}
				/>
			)}

			{domainId && (
				<KeywordGroupsAiDialog
					open={isAiGroupsDialogOpen}
					loading={false}
					onClose={() => setIsAiGroupsDialogOpen(false)}
					onConfirm={(timeRange, minScore, count) => startStream(timeRange, minScore, count)}
				/>
			)}

			<KeywordGroupsStreamDialog
				open={isStreamDialogOpen}
				logs={streamLogs}
				onCancel={handleStreamCancel}
			/>

			{domainId && (
				<KeywordAiResultDialog
					open={isAiResultOpen}
					loading={aiSubmitLoading}
					generateLoading={false}
					suggestions={aiSuggestions}
					timeRange={lastAiGroupsTimeRange}
					onClose={() => setIsAiResultOpen(false)}
					onConfirm={handleAiConfirmSelected}
					onRetry={handleAiRetry}
					onExit={handleAiExit}
				/>
			)}
		</Box>
	);
}

