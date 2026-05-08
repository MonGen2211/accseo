import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchKeywordGroups, deleteKeywordGroup, updateKeywordGroupStatus, setKeywordSortField, setKeywordSortOrder, setKeywordStatusFilter } from '../keywordGroupSlice';
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
import { useParams } from 'react-router-dom';

export default function KeywordPage() {
	const { domainId } = useParams<{ domainId: string }>();
	const dispatch = useAppDispatch();
	const { items, loading, total, page, limit, deleteLoadingId, statusLoadingId, sortField, sortOrder, statusFilter } = useAppSelector((state) => state.keywordGroups);
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

	const loadData = (p: number, l: number) => {
		if (domainId) {
			dispatch(fetchKeywordGroups({ domainId, page: p + 1, limit: l, sort: sortField, order: sortOrder, status: statusFilter }));
		}
	};

	useEffect(() => {
		loadData(0, limit);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [domainId, sortField, sortOrder, statusFilter]);

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
			await dispatch(createKeywordGroupItems({ domainId, items: selectedItems.map(item => ({ name: item.name, ...(item.reason && { reason: item.reason }) })) })).unwrap();
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
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, alignItems: 'start' }}>
				{domainId && <GscPanel domainId={domainId} />}
				{domainId && <Ga4Panel domainId={domainId} />}
			</Box>

			<Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
				<Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
					<Typography sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
						Bộ Keywords
					</Typography>
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
