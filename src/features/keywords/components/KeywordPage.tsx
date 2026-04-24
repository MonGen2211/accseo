import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useParams, useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchKeywordGroups, suggestAiKeywords, deleteKeywordGroup, updateKeywordGroupStatus } from '../keywordGroupSlice';
import { KeywordGroupTable } from './KeywordGroupTable';
import { KeywordGroupForm } from './KeywordGroupForm';
import { KeywordAiDialog } from './KeywordAiDialog';
import { GscPanel } from './GscPanel';
import { Ga4Panel } from './Ga4Panel';

import { useToastify } from '../../../components/Toastify';
import type { TableRowData } from '../../../types/tableRows.types';

export default function KeywordPage() {
	const { domainId } = useParams<{ domainId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { items, loading, total, page, limit, generateAiLoading, deleteLoadingId, statusLoadingId } = useAppSelector((state) => state.keywordGroups);
	const { showToast } = useToastify();

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

	const loadData = (p: number, l: number) => {
		if (domainId) {
			dispatch(fetchKeywordGroups({ domainId, page: p + 1, limit: l }));
		}
	};

	useEffect(() => {
		loadData(0, limit);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [domainId]);

	const handlePageChange = (newPage: number) => {
		loadData(newPage, limit);
	};

	const handleRowsPerPageChange = (newLimit: number) => {
		loadData(0, newLimit);
	};

	const handleFormSuccess = () => {
		loadData(0, limit);
	};

	const handleAiGenerate = async (days: number, top: number) => {
		if (!domainId) return;
		try {
			await dispatch(suggestAiKeywords({ domainId, payload: { days, top } })).unwrap();
			showToast('Tạo keywords bằng AI thành công!', 'success');
			loadData(0, limit);
			setIsAiDialogOpen(false);
		} catch (err: unknown) {
			const errorMsg = typeof err === 'string' ? err : 'Đã có lỗi xảy ra';
			showToast(errorMsg, 'danger');
		}
	};

	const handleDelete = async (row: TableRowData) => {
		const id = row.id || row._id;
		if (!id) return;
		try {
			await dispatch(deleteKeywordGroup(String(id))).unwrap();
			showToast('Xóa bộ keywords thành công!', 'success');
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
			await dispatch(updateKeywordGroupStatus({ id: String(id), status: newStatus })).unwrap();
			showToast('Cập nhật trạng thái thành công!', 'success');
		} catch (err: unknown) {
			const errorMsg = typeof err === 'string' ? err : 'Đã có lỗi xảy ra';
			showToast(errorMsg, 'danger');
		}
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
			{/* Page Header */}
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
				<IconButton onClick={() => navigate(-1)} size="small">
					<ArrowBackIcon />
				</IconButton>
				<Typography sx={{ fontSize: '20px', fontWeight: 700, color: 'text.primary' }}>
					Chi tiết trang web
				</Typography>
			</Box>

			{/* Top Row: GSC (left) + GA4 (right) — 50/50 */}
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, alignItems: 'start' }}>
				{/* LEFT: GSC Panel */}
				{domainId && <GscPanel domainId={domainId} />}

				{/* RIGHT: GA4 Panel */}
				{domainId && <Ga4Panel domainId={domainId} />}
			</Box>

			{/* Bottom: Keyword Groups — full width */}
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
					generateAiLoading={generateAiLoading}
					deleteLoadingId={deleteLoadingId}
					statusLoadingId={statusLoadingId}
					onPageChange={handlePageChange}
					onRowsPerPageChange={handleRowsPerPageChange}
					onOpenCreate={() => setIsFormOpen(true)}
					onAiGenerate={() => setIsAiDialogOpen(true)}
					onDelete={handleDelete}
					onStatusChange={handleStatusChange}
				/>
			</Paper>

			{/* Dialogs */}
			{domainId && (
				<KeywordGroupForm
					open={isFormOpen}
					domainId={domainId}
					onClose={() => setIsFormOpen(false)}
					onSuccess={handleFormSuccess}
				/>
			)}

			{domainId && (
				<KeywordAiDialog
					open={isAiDialogOpen}
					loading={generateAiLoading}
					onClose={() => setIsAiDialogOpen(false)}
					onConfirm={handleAiGenerate}
				/>
			)}
		</Box>
	);
}
