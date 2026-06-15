import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import {
	fetchKeywordGroups, deleteKeywordGroup, updateKeywordGroupStatus,
	setKeywordSortField, setKeywordSortOrder, setKeywordStatusFilter, setKeywordSearchFilter,
	createKeywordGroupItems,
	setAiGroupsStreaming, setAiScrapeStreaming,
	appendAiGroupsLog, appendAiScrapeLog,
	clearAiGroupsLogs, clearAiScrapeLogs,
	setAiSuggestionsGroups, setAiSuggestionsScrape,
	clearAiSuggestionsGroups, clearAiSuggestionsScrape,
} from '../keywordGroupSlice';
import { useDebounce } from '../../../hooks/useDebounce';
import { KeywordGroupTable } from './KeywordGroupTable';
import { KeywordGroupForm } from './KeywordGroupForm';
import { KeywordGroupsAiDialog } from './KeywordGroupsAiDialog';
import { KeywordGroupsStreamDialog } from './KeywordGroupsStreamDialog';
import { KeywordAiResultDialog } from './KeywordAiResultDialog';
import { keywordGroupService } from '../keywordGroupService';
import { GscPanel } from './GscPanel';
import { Ga4Panel } from './Ga4Panel';
import { fetchGscOverview, setDateRange as setGscDateRange } from '../gscSlice';
import { fetchGa4Overview, setGa4DateRange } from '../ga4Slice';
import type { GscDateRange } from '../gscTypes';
import type { Ga4DateRange } from '../ga4Types';
import { useToastify } from '../../../components/Toastify';
import type { TableRowData } from '../../../types/tableRows.types';
import { useParams, useSearchParams } from 'react-router-dom';

// Module-level refs — survive component unmount/remount
let groupsAbortCtrl: AbortController | null = null;
let scrapeAbortCtrl: AbortController | null = null;

function fmtNum(num: number): string {
	if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
	if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
	return num.toLocaleString();
}

export default function KeywordPage() {
	const { domainId } = useParams<{ domainId: string }>();
	const [searchParams] = useSearchParams();
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const {
		items, loading, total, page, limit, deleteLoadingId, statusLoadingId,
		sortField, sortOrder, statusFilter, searchFilter, summary,
		aiGroupsStreaming, aiScrapeStreaming,
		aiGroupsStreamLogs, aiScrapeStreamLogs,
		aiSuggestionsGroups, aiSuggestionsScrape,
	} = useAppSelector((state) => state.keywordGroups);
	const { showToast } = useToastify();

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isAiGroupsDialogOpen, setIsAiGroupsDialogOpen] = useState(false);
	const [isStreamDialogOpen, setIsStreamDialogOpen] = useState(false);
	const [isAiResultOpen, setIsAiResultOpen] = useState(false);
	const [aiSubmitLoading, setAiSubmitLoading] = useState(false);
	const [lastAiGroupsTimeRange, setLastAiGroupsTimeRange] = useState<string>('3-m');
	const [lastAiGroupsMinScore, setLastAiGroupsMinScore] = useState<number>(60);
	const [lastAiGroupsCount, setLastAiGroupsCount] = useState<number>(2);
	const [lastAiGroupsKeywordHot, setLastAiGroupsKeywordHot] = useState<boolean>(true);

	// ── AI Scrape (Puppeteer) ─────────────────────────────────────────────────
	const [isAiScrapeDialogOpen, setIsAiScrapeDialogOpen] = useState(false);
	const [isAiScrapeStreamDialogOpen, setIsAiScrapeStreamDialogOpen] = useState(false);
	const [isAiScrapeResultOpen, setIsAiScrapeResultOpen] = useState(false);
	const [aiScrapeSubmitLoading, setAiScrapeSubmitLoading] = useState(false);
	const [lastScrapeTimeRange, setLastScrapeTimeRange] = useState<string>('3-m');
	const [lastScrapeMinScore, setLastScrapeMinScore] = useState<number>(60);
	const [lastScrapeCount, setLastScrapeCount] = useState<number>(2);
	const [lastScrapeKeywordHot, setLastScrapeKeywordHot] = useState<boolean>(true);

	const [activeAnalytic, setActiveAnalytic] = useState<'gsc' | 'ga4'>('gsc');
	const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
	const debouncedSearch = useDebounce(searchFilter, 400);

	// GSC/GA4 overview data for compact analytics bar
	const { overview: gscOverview, overviewLoading: gscOverviewLoading, dateRange: gscDateRange } = useAppSelector((state) => state.gsc);
	const { overview: ga4Overview, overviewLoading: ga4OverviewLoading, dateRange: ga4DateRange } = useAppSelector((state) => state.ga4);
	const currentDateRange = activeAnalytic === 'gsc' ? gscDateRange : ga4DateRange;

	useEffect(() => {
		if (!domainId) return;
		dispatch(fetchGscOverview({ domainId, days: gscDateRange }));
	}, [domainId, gscDateRange, dispatch]);

	useEffect(() => {
		if (!domainId) return;
		dispatch(fetchGa4Overview({ domainId, days: ga4DateRange }));
	}, [domainId, ga4DateRange, dispatch]);

	const handleDateRangeChange = (_: React.MouseEvent<HTMLElement>, newRange: number | null) => {
		if (newRange === null) return;
		if (activeAnalytic === 'gsc') {
			dispatch(setGscDateRange(newRange as GscDateRange));
		} else {
			dispatch(setGa4DateRange(newRange as Ga4DateRange));
		}
	};

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

	const startStream = async (timeRange: string, minScore: number, count: number, keywordHot: boolean) => {
		if (!domainId) return;

		setLastAiGroupsTimeRange(timeRange);
		setLastAiGroupsMinScore(minScore);
		setLastAiGroupsCount(count);
		setLastAiGroupsKeywordHot(keywordHot);
		dispatch(clearAiGroupsLogs());
		dispatch(setAiGroupsStreaming(true));
		setIsAiGroupsDialogOpen(false);
		setIsStreamDialogOpen(true);

		groupsAbortCtrl = new AbortController();

		try {
			await keywordGroupService.suggestKeywordsByGroupsStream(
				{ domainId, timeRange, minScore, count, keywordHot },
				(log) => dispatch(appendAiGroupsLog(log)),
				(suggestions) => {
					dispatch(setAiGroupsStreaming(false));
					dispatch(setAiSuggestionsGroups(suggestions));
					setIsStreamDialogOpen(false);
					setIsAiResultOpen(true);
					showToast('AI đã tạo xong! Xem kết quả để xác nhận.', 'success');
				},
				(errMsg) => {
					dispatch(setAiGroupsStreaming(false));
					setIsStreamDialogOpen(false);
					showToast(errMsg, 'danger');
				},
				groupsAbortCtrl.signal,
			);
		} catch (err: unknown) {
			if ((err as { name?: string }).name === 'AbortError') return;
			dispatch(setAiGroupsStreaming(false));
			setIsStreamDialogOpen(false);
			showToast('Đã có lỗi xảy ra', 'danger');
		} finally {
			groupsAbortCtrl = null;
		}
	};

	const handleStreamCancel = () => {
		groupsAbortCtrl?.abort();
		groupsAbortCtrl = null;
		dispatch(setAiGroupsStreaming(false));
		setIsStreamDialogOpen(false);
	};

	const handleAiRetry = (retryTimeRange: string) => {
		setLastAiGroupsTimeRange(retryTimeRange);
		setIsAiResultOpen(false);
		dispatch(clearAiSuggestionsGroups());
		startStream(retryTimeRange, lastAiGroupsMinScore, lastAiGroupsCount, lastAiGroupsKeywordHot);
	};

	const handleAiConfirmSelected = async (selectedItems: import('../types').AiSuggestedKeyword[]) => {
		if (!domainId || selectedItems.length === 0) return;
		try {
			setAiSubmitLoading(true);
			await dispatch(createKeywordGroupItems({
				domainId, aiGen: true, items: selectedItems.map((s) => ({
					name: s.name,
					reason: s.reason ?? null,
					status: 'pending_approval' as const,
					nameScore: s.nameScore,
					currentScore: s.currentScore,
					avg: s.avg,
					slope: s.slope,
					isSpike: s.isSpike,
					isPartial: s.isPartial,
					trendTimeline: s.trendTimeline,
					relatedQueries: s.relatedQueries,
					relatedTopics: s.relatedTopics,
				}))
			})).unwrap();
			await keywordGroupService.clearTrendsLiveCache(domainId);
			showToast('Tạo keywords từ gợi ý thành công!', 'success');
			loadData(0, limit);
			setIsAiResultOpen(false);
			dispatch(clearAiSuggestionsGroups());
		} catch (err: unknown) {
			const errorMsg = typeof err === 'string' ? err : 'Đã có lỗi xảy ra';
			showToast(errorMsg, 'danger');
		} finally {
			setAiSubmitLoading(false);
		}
	};

	const handleAiExit = async () => {
		setIsAiResultOpen(false);
		dispatch(clearAiSuggestionsGroups());
		if (domainId) {
			try { await keywordGroupService.clearGroupsSuggestCache(domainId); } catch { /* best-effort */ }
		}
	};

	// ── AI Scrape (Puppeteer) handlers ────────────────────────────────────────
	const startPuppeteerStream = async (timeRange: string, minScore: number, count: number, keywordHot: boolean) => {
		if (!domainId) return;

		setLastScrapeTimeRange(timeRange);
		setLastScrapeMinScore(minScore);
		setLastScrapeCount(count);
		setLastScrapeKeywordHot(keywordHot);
		dispatch(clearAiScrapeLogs());
		dispatch(setAiScrapeStreaming(true));
		setIsAiScrapeDialogOpen(false);
		setIsAiScrapeStreamDialogOpen(true);

		scrapeAbortCtrl = new AbortController();

		try {
			await keywordGroupService.suggestKeywordsByGroupsPuppeteerStream(
				{ domainId, timeRange, minScore, count, keywordHot },
				(log) => dispatch(appendAiScrapeLog(log)),
				(suggestions) => {
					dispatch(setAiScrapeStreaming(false));
					dispatch(setAiSuggestionsScrape(suggestions));
					setIsAiScrapeStreamDialogOpen(false);
					setIsAiScrapeResultOpen(true);
					showToast('AI Scrape đã xong! Xem kết quả để xác nhận.', 'success');
				},
				(errMsg) => {
					dispatch(setAiScrapeStreaming(false));
					setIsAiScrapeStreamDialogOpen(false);
					showToast(errMsg, 'danger');
				},
				scrapeAbortCtrl.signal,
			);
		} catch (err: unknown) {
			if ((err as { name?: string }).name === 'AbortError') return;
			dispatch(setAiScrapeStreaming(false));
			setIsAiScrapeStreamDialogOpen(false);
			showToast('Đã có lỗi xảy ra', 'danger');
		} finally {
			scrapeAbortCtrl = null;
		}
	};

	const handlePuppeteerStreamCancel = () => {
		scrapeAbortCtrl?.abort();
		scrapeAbortCtrl = null;
		dispatch(setAiScrapeStreaming(false));
		setIsAiScrapeStreamDialogOpen(false);
	};

	const handlePuppeteerRetry = (retryTimeRange: string) => {
		setLastScrapeTimeRange(retryTimeRange);
		setIsAiScrapeResultOpen(false);
		dispatch(clearAiSuggestionsScrape());
		startPuppeteerStream(retryTimeRange, lastScrapeMinScore, lastScrapeCount, lastScrapeKeywordHot);
	};

	const handlePuppeteerConfirmSelected = async (selectedItems: import('../types').AiSuggestedKeyword[]) => {
		if (!domainId || selectedItems.length === 0) return;
		try {
			setAiScrapeSubmitLoading(true);
			await dispatch(createKeywordGroupItems({
				domainId, aiGen: true, items: selectedItems.map((s) => ({
					name: s.name,
					reason: s.reason ?? null,
					status: 'pending_approval' as const,
					nameScore: s.nameScore,
					currentScore: s.currentScore,
					avg: s.avg,
					slope: s.slope,
					isSpike: s.isSpike,
					isPartial: s.isPartial,
					trendTimeline: s.trendTimeline,
					relatedQueries: s.relatedQueries,
					relatedTopics: s.relatedTopics,
				}))
			})).unwrap();
			await keywordGroupService.clearPuppeteerSuggestCache(domainId);
			showToast('Tạo keywords từ AI Scrape thành công!', 'success');
			loadData(0, limit);
			setIsAiScrapeResultOpen(false);
			dispatch(clearAiSuggestionsScrape());
		} catch (err: unknown) {
			const errorMsg = typeof err === 'string' ? err : 'Đã có lỗi xảy ra';
			showToast(errorMsg, 'danger');
		} finally {
			setAiScrapeSubmitLoading(false);
		}
	};

	const handlePuppeteerExit = async () => {
		setIsAiScrapeResultOpen(false);
		dispatch(clearAiSuggestionsScrape());
		if (domainId) {
			try { await keywordGroupService.clearPuppeteerSuggestCache(domainId); } catch { /* best-effort */ }
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
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 10 }}>

			{/* ── Compact Analytics Overview Bar ── */}
			<Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', px: 3, py: 2, gap: 2.5, flexWrap: 'wrap' }}>
					{/* GSC/GA4 Toggle */}
					<Box sx={{ display: 'flex', gap: 1 }}>
						{[
							{ key: 'gsc' as const, label: 'Search Console', icon: <ManageSearchIcon sx={{ fontSize: 16 }} />, color: '#4285F4' },
							{ key: 'ga4' as const, label: 'Analytics 4', icon: <BarChartOutlinedIcon sx={{ fontSize: 16 }} />, color: '#E37400' },
						].map(({ key, label, icon, color }) => (
							<Chip
								key={key}
								icon={icon}
								label={label}
								onClick={() => setActiveAnalytic(key)}
								sx={{
									fontWeight: 600, fontSize: 12, height: 32, cursor: 'pointer',
									...(activeAnalytic === key
										? {
											bgcolor: (theme) => theme.palette.mode === 'dark' ? `${color}18` : `${color}10`,
											color,
											border: `1.5px solid ${color}`,
											'& .MuiChip-icon': { color },
										}
										: {
											border: '1px solid', borderColor: 'divider',
											'& .MuiChip-icon': { color: 'text.secondary' },
										}),
								}}
							/>
						))}
					</Box>

					<Divider orientation="vertical" flexItem />

					{/* Inline Metrics */}
					<Box sx={{ display: 'flex', gap: 3, flex: 1, alignItems: 'center', minWidth: 0 }}>
						{activeAnalytic === 'gsc' ? (
							gscOverviewLoading ? (
								<>{[1, 2, 3, 4].map((i) => <Skeleton key={i} width={70} height={28} />)}</>
							) : gscOverview?.summary ? (
								<>
									{[
										{ label: 'Clicks', value: fmtNum(gscOverview.summary.clicks), color: isDark ? '#64b5f6' : '#1565c0' },
										{ label: 'Impr.', value: fmtNum(gscOverview.summary.impressions), color: isDark ? '#ce93d8' : '#7b1fa2' },
										{ label: 'CTR', value: `${(gscOverview.summary.ctr * 100).toFixed(2)}%`, color: isDark ? '#69f0ae' : '#00895e' },
										{ label: 'Position', value: gscOverview.summary.position.toFixed(1), color: isDark ? '#ffb74d' : '#e65100' },
									].map((m) => (
										<Box key={m.label} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
											<Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap' }}>{m.label}</Typography>
											<Typography sx={{ fontSize: 15, fontWeight: 800, color: m.color, whiteSpace: 'nowrap' }}>{m.value}</Typography>
										</Box>
									))}
								</>
							) : null
						) : (
							ga4OverviewLoading ? (
								<>{[1, 2, 3, 4].map((i) => <Skeleton key={i} width={70} height={28} />)}</>
							) : ga4Overview?.summary ? (
								<>
									{[
										{ label: 'Sessions', value: fmtNum(ga4Overview.summary.sessions), color: isDark ? '#64b5f6' : '#1565c0' },
										{ label: 'Users', value: fmtNum(ga4Overview.summary.activeUsers), color: isDark ? '#81c784' : '#2e7d32' },
										{ label: 'Views', value: fmtNum(ga4Overview.summary.screenPageViews), color: isDark ? '#ce93d8' : '#7b1fa2' },
										{ label: 'Pages', value: fmtNum(ga4Overview.summary.totalPages), color: isDark ? '#ffb74d' : '#e65100' },
									].map((m) => (
										<Box key={m.label} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
											<Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap' }}>{m.label}</Typography>
											<Typography sx={{ fontSize: 15, fontWeight: 800, color: m.color, whiteSpace: 'nowrap' }}>{m.value}</Typography>
										</Box>
									))}
								</>
							) : null
						)}
					</Box>

					{/* Date Range Toggle */}
					<ToggleButtonGroup
						value={currentDateRange}
						exclusive
						onChange={handleDateRangeChange}
						size="small"
						sx={{
							'& .MuiToggleButton-root': {
								textTransform: 'none', fontSize: 12, fontWeight: 600, px: 1.5, py: 0.5,
								borderRadius: '8px !important', border: '1px solid', borderColor: 'divider',
								'&.Mui-selected': {
									backgroundColor: 'primary.main', color: 'primary.contrastText',
									'&:hover': { backgroundColor: 'primary.dark' },
								},
							},
						}}
					>
						{[{ label: '7 ngày', value: 7 }, { label: '28 ngày', value: 28 }, { label: '90 ngày', value: 90 }].map((opt) => (
							<ToggleButton key={opt.value} value={opt.value}>{opt.label}</ToggleButton>
						))}
					</ToggleButtonGroup>

					{/* Detail Button */}
					<Button
						size="small"
						variant="outlined"
						onClick={() => setDetailDrawerOpen(true)}
						endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
						sx={{ borderRadius: '100px', height: 36, px: 2, textTransform: 'none', fontWeight: 600, fontSize: 12, borderColor: 'divider', color: 'text.secondary' }}
					>
						Chi tiết
					</Button>
				</Box>
			</Paper>

			{/* ── Bộ Keywords (full-width) ── */}
			<Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', minWidth: 0 }}>
				<Box sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
						<Typography sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
							Bộ Keywords
						</Typography>
					</Box>

					{/* Quick stats bar */}
					{summary && (
						<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
							{[
								{ label: 'Tổng', value: summary.total, color: '#64748b' },
								{ label: 'Chờ duyệt', value: summary.pending_approval, color: '#d97706' },
								{ label: 'Chưa triển khai', value: summary.not_started, color: '#94a3b8' },
								{ label: 'Đang triển khai', value: summary.in_progress, color: '#2563eb' },
								{ label: 'Đã triển khai', value: summary.deployed, color: '#00b894' },
								{ label: 'Từ chối', value: summary.rejected, color: '#e74c3c' },
							].map(({ label, value, color }) => (
								<Chip
									key={label}
									label={`${label}: ${value}`}
									size="small"
									sx={{
										bgcolor: (theme) => theme.palette.mode === 'dark' ? `${color}18` : `${color}0c`,
										color,
										fontWeight: 600,
										fontSize: 11,
										border: `1px solid ${color}30`,
										height: 22
									}}
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
					generateAiScrapeLoading={aiScrapeStreaming}
					hasAiScrapeSuggestions={aiSuggestionsScrape.length > 0}
					deleteLoadingId={deleteLoadingId}
					statusLoadingId={statusLoadingId}
					onPageChange={handlePageChange}
					onRowsPerPageChange={handleRowsPerPageChange}
					onOpenCreate={() => setIsFormOpen(true)}
					onAiScrapeByGroups={() => {
						if (aiScrapeStreaming) {
							setIsAiScrapeStreamDialogOpen(true);
						} else if (aiSuggestionsScrape.length > 0) {
							setIsAiScrapeResultOpen(true);
						} else {
							setIsAiScrapeDialogOpen(true);
						}
					}}
					onDelete={handleDelete}
					onStatusChange={handleStatusChange}
					sortBy={sortField}
					sortOrder={sortOrder}
					onSort={handleSort}
					statusFilter={statusFilter}
					onStatusFilterChange={(st) => dispatch(setKeywordStatusFilter(st))}
					searchValue={searchFilter}
					onSearchChange={(v) => dispatch(setKeywordSearchFilter(v))}
				/>
			</Paper>

			{/* ── Detail Drawer (GSC/GA4 full panel) ── */}
			<Drawer
				anchor="right"
				open={detailDrawerOpen}
				onClose={() => setDetailDrawerOpen(false)}
				PaperProps={{ sx: { width: { xs: '100%', sm: 520 }, bgcolor: 'background.default' } }}
			>
				<Box sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}>
					<IconButton
						onClick={() => setDetailDrawerOpen(false)}
						size="small"
						sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
					>
						<CloseIcon fontSize="small" />
					</IconButton>
				</Box>
				<Box sx={{ p: 2, height: '100%' }}>
					{domainId && activeAnalytic === 'gsc' && <GscPanel domainId={domainId} />}
					{domainId && activeAnalytic === 'ga4' && <Ga4Panel domainId={domainId} />}
				</Box>
			</Drawer>

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
					onConfirm={(timeRange, minScore, count, keywordHot) => startStream(timeRange, minScore, count, keywordHot)}
				/>
			)}

			<KeywordGroupsStreamDialog
				open={isStreamDialogOpen}
				logs={aiGroupsStreamLogs}
				onCancel={handleStreamCancel}
				onHide={() => setIsStreamDialogOpen(false)}
			/>

			{domainId && (
				<KeywordAiResultDialog
					open={isAiResultOpen}
					loading={aiSubmitLoading}
					generateLoading={false}
					suggestions={aiSuggestionsGroups}
					timeRange={lastAiGroupsTimeRange}
					onClose={() => setIsAiResultOpen(false)}
					onConfirm={handleAiConfirmSelected}
					onRetry={handleAiRetry}
					onExit={handleAiExit}
				/>
			)}

			{/* ── AI Scrape (Puppeteer) dialogs ─────────────────────────────────── */}
			{domainId && (
				<KeywordGroupsAiDialog
					open={isAiScrapeDialogOpen}
					loading={false}
					onClose={() => setIsAiScrapeDialogOpen(false)}
					onConfirm={(timeRange, minScore, count, keywordHot) => startPuppeteerStream(timeRange, minScore, count, keywordHot)}
				/>
			)}

			<KeywordGroupsStreamDialog
				open={isAiScrapeStreamDialogOpen}
				logs={aiScrapeStreamLogs}
				onCancel={handlePuppeteerStreamCancel}
				onHide={() => setIsAiScrapeStreamDialogOpen(false)}
			/>

			{domainId && (
				<KeywordAiResultDialog
					open={isAiScrapeResultOpen}
					loading={aiScrapeSubmitLoading}
					generateLoading={false}
					suggestions={aiSuggestionsScrape}
					timeRange={lastScrapeTimeRange}
					hideRelated
					onClose={() => setIsAiScrapeResultOpen(false)}
					onConfirm={handlePuppeteerConfirmSelected}
					onRetry={handlePuppeteerRetry}
					onExit={handlePuppeteerExit}
				/>
			)}
		</Box>
	);
}

