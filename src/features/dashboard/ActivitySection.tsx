import { useEffect, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchActivities, loadMoreActivities } from './activitySlice';

const LIMIT = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (iso: string): string => {
	const d = new Date(iso);
	const hh = d.getHours().toString().padStart(2, '0');
	const mm = d.getMinutes().toString().padStart(2, '0');
	const dd = d.getDate().toString().padStart(2, '0');
	const mo = (d.getMonth() + 1).toString().padStart(2, '0');
	const yyyy = d.getFullYear();
	return `${hh}:${mm} , ${dd}/${mo}/${yyyy}`;
};

const getMsgColor = (msg: string): { bg: string; color: string } => {
	const m = msg.toLowerCase();
	if (m.includes('approve') || m.includes('complete') || m.includes('phê duyệt') || m.includes('thành công'))
		return { bg: '#f0fdf4', color: '#16a34a' };
	if (m.includes('cancel') || m.includes('reject') || m.includes('từ chối') || m.includes('hủy'))
		return { bg: '#fff5f5', color: '#dc2626' };
	if (m.includes('wait') || m.includes('review') || m.includes('pending') || m.includes('chờ'))
		return { bg: '#fffbeb', color: '#d97706' };
	if (m.includes('process') || m.includes('update') || m.includes('cập nhật'))
		return { bg: '#eff6ff', color: '#2563eb' };
	if (m.includes('creat') || m.includes('add') || m.includes('tạo'))
		return { bg: '#e6fcf5', color: '#00b894' };
	return { bg: 'background.default', color: 'text.secondary' };
};

const getAvatarColor = (name: string | null | undefined): string => {
	const colors = ['#3b82f6', '#00cec9', '#f97316', '#10b981', '#ef4444', '#0ea5e9', '#d97706'];
	if (!name) return colors[0];
	let hash = 0;
	for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
	return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string | null | undefined) => (name || '??').slice(0, 2).toUpperCase();

// ─── Component ────────────────────────────────────────────────────────────────
interface ActivitySectionProps {
	onViewAll?: () => void;
}

export default function ActivitySection({ onViewAll }: ActivitySectionProps) {
	const dispatch = useAppDispatch();
	const { items, loading, loadingMore, hasMore } = useAppSelector(state => state.activities);
	const [page, setPage] = useState(1);

	// Initial fetch
	useEffect(() => {
		dispatch(fetchActivities({ page: 1, limit: LIMIT, success: true }));
	}, [dispatch]);

	// Load next page
	const loadMore = useCallback(() => {
		if (loadingMore || !hasMore) return;
		const nextPage = page + 1;
		setPage(nextPage);
		dispatch(loadMoreActivities({ page: nextPage, limit: LIMIT, success: true }));
	}, [dispatch, loadingMore, hasMore, page]);

	// Scroll handler — fire when within 100px of bottom
	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const el = e.currentTarget;
		if (el.scrollHeight - el.scrollTop <= el.clientHeight + 100) {
			loadMore();
		}
	};

	return (
		<Box sx={{ flex: 1, minWidth: { xs: '100%', md: 380 }, height: { xs: 600, md: '100%' } }}>
			<Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '100%' }}>

				{/* ── Header ── */}
				<Box sx={{ px: 3, pt: 2.5, pb: 2, background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 70%)' : 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 70%)', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
						<Box sx={{ width: 42, height: 42, borderRadius: 2.5, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)', flexShrink: 0 }}>
							<HistoryOutlinedIcon sx={{ color: 'primary.contrastText', fontSize: 22 }} />
						</Box>
						<Box>
							<Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>
								Hoạt động gần đây
							</Typography>
							<Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.1 }}>
								Lịch sử hoạt động hệ thống gần đây
							</Typography>
						</Box>
					</Box>
					<Chip label="LIVE" size="small" sx={{ fontSize: 9, height: 16, bgcolor: '#3b82f6', color: 'primary.contrastText', fontWeight: 800, letterSpacing: 0.5, px: 0.25 }} />
				</Box>

				{/* ── List ── */}
				<Box onScroll={handleScroll} sx={{ flex: 1, overflowY: 'auto', px: 0 }}>
					{loading ? (
						<Box>
							{[...Array(7)].map((_, i) => (
								<Box key={i} sx={{ display: 'flex', gap: 2, px: 3, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', alignItems: 'flex-start' }}>
									<Skeleton variant="circular" width={34} height={34} sx={{ flexShrink: 0 }} />
									<Box sx={{ flex: 1 }}>
										<Skeleton width={`${50 + (i * 7) % 30}%`} height={18} />
										<Skeleton width={`${30 + (i * 5) % 20}%`} height={14} sx={{ mt: 0.5 }} />
									</Box>
								</Box>
							))}
						</Box>
					) : items.length === 0 ? (
						<Box sx={{ textAlign: 'center', py: 10 }}>
							<HistoryOutlinedIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
							<Typography sx={{ color: 'text.secondary', fontSize: '0.88rem' }}>Chưa có hoạt động nào</Typography>
						</Box>
					) : (
						<>
							{items.map((item) => {
								const { bg, color } = getMsgColor(item.message);
								const avatarBg = getAvatarColor(item.name);
								return (
									<Box
										key={item.id}
										sx={{
											display: 'flex',
											gap: 1.75,
											px: 3,
											py: 1.6,
											borderBottom: '1px solid',
											borderColor: 'divider',
											alignItems: 'flex-start',
											transition: 'background 0.15s',
											'&:hover': { bgcolor: '#fafbfc' },
										}}
									>
										<Avatar
											src={item.userAvatar ?? undefined}
											sx={{ width: 34, height: 34, fontSize: '0.72rem', fontWeight: 700, bgcolor: avatarBg, flexShrink: 0, mt: 0.25 }}
										>
											{getInitials(item.name)}
										</Avatar>

										<Box sx={{ flex: 1, minWidth: 0 }}>
											<Typography sx={{ fontSize: '0.875rem', lineHeight: 1.45, color: 'text.primary' }}>
												<Box component="span" sx={{ fontWeight: 800, color: '#0f172a', mr: 0.5 }}>
													{item.name}
												</Box>
												<Box component="span" sx={{ color, fontWeight: 600, bgcolor: bg, px: 0.6, py: 0.1, borderRadius: 0.75, fontSize: '0.82rem' }}>
													{item.message}
												</Box>
											</Typography>
											<Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mt: 0.4, fontWeight: 500 }}>
												{fmtTime(item.createdAt)}
											</Typography>
										</Box>
									</Box>
								);
							})}

							{/* Loading more indicator */}
							<Box sx={{ py: 1, display: 'flex', justifyContent: 'center' }}>
								{loadingMore && <CircularProgress size={20} sx={{ color: '#3b82f6', my: 0.5 }} />}
								{!loadingMore && !hasMore && items.length > 0 && (
									<Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', py: 0.5 }}>
										Đã tải hết
									</Typography>
								)}
							</Box>
						</>
					)}
				</Box>

				{/* ── Footer ── */}
				<Box
					onClick={onViewAll}
					sx={{
						px: 3, py: 1.5,
						borderTop: '1px solid', borderColor: 'divider',
						display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5,
						cursor: onViewAll ? 'pointer' : 'default',
						bgcolor: '#fafbfc',
						'&:hover': onViewAll ? { bgcolor: 'action.hover' } : {},
						transition: 'background 0.15s',
					}}
				>
					<Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#3b82f6' }}>View all</Typography>
					<ArrowForwardIosIcon sx={{ fontSize: 11, color: '#3b82f6' }} />
				</Box>
			</Paper>
		</Box>
	);
}
