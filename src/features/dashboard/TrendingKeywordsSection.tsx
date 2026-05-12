import { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import Link from '@mui/material/Link';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import UpdateOutlinedIcon from '@mui/icons-material/UpdateOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import { CustomTable } from '../../components/custom-table/CustomTable';
import type { TableField } from '../../types/tableFields.types';
import type { TableRowData } from '../../types/tableRows.types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface RelatedQuery { query: string; link: string; }
interface Article { title: string; link: string; source: string; thumbnail: string | null; date: string; }

interface TrendItem {
	keyword: string;
	position: number;
	searchVolume: number | null;
	active: boolean;
	startTimestamp: number;
	endTimestamp: number;
	categories: string[];
	trendBreakdown: string[];
	relatedQueries: RelatedQuery[];
	articles: Article[];
}

interface TrendData {
	geo: string; hours: number; hl: string; categoryId: number;
	fetchedDate: string; fetchedAt: string; serpapiCreatedAt: string;
	total: number; page: number; limit: number; totalPages: number;
	count: number; items: TrendItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TIME_OPTS = [
	{ label: '4 giờ', value: 4 },
	{ label: '24 giờ', value: 24 },
	{ label: '48 giờ', value: 48 },
	{ label: '7 ngày', value: 168 },
] as const;

const fmtVol = (v: number | null): string => {
	if (v === null || v === undefined) return '—';
	return new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(v);
};

const fmtDateTime = (iso: string): string => {
	const d = new Date(iso);
	const hh = d.getHours().toString().padStart(2, '0');
	const mm = d.getMinutes().toString().padStart(2, '0');
	const dd = d.getDate().toString().padStart(2, '0');
	const mo = (d.getMonth() + 1).toString().padStart(2, '0');
	return `Cập nhật lúc ${hh}:${mm} ${dd}/${mo}/${d.getFullYear()}`;
};

const posStyle = (pos: number) => {
	if (pos === 1) return { color: '#92400e', bg: '#fef3c7', fw: 900 };
	if (pos === 2) return { color: '#374151', bg: '#f1f5f9', fw: 800 };
	if (pos === 3) return { color: '#78350f', bg: '#ffedd5', fw: 800 };
	return { color: '#64748b', bg: '#f8fafc', fw: 700 };
};

const parseRetryAfterMs = (errData: { retryAfterMs?: number; retryAfter?: number; message?: string }): number | null => {
	if (typeof errData.retryAfterMs === 'number') return errData.retryAfterMs;
	if (typeof errData.retryAfter === 'number') return errData.retryAfter * 1000;
	const msg = errData.message ?? '';
	const hourMatch = msg.match(/Còn (\d+) giờ(?: (\d+) phút)? nữa/);
	if (hourMatch) {
		const h = parseInt(hourMatch[1], 10);
		const m = parseInt(hourMatch[2] ?? '0', 10);
		return (h * 60 + m) * 60 * 1000;
	}
	const dayMatch = msg.match(/Còn (\d+) ngày/);
	if (dayMatch) return parseInt(dayMatch[1], 10) * 24 * 60 * 60 * 1000;
	return null;
};

const fmtCountdown = (ms: number): string => {
	const s = Math.max(0, Math.ceil(ms / 1000));
	const d = Math.floor(s / 86400);
	const h = Math.floor((s % 86400) / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = s % 60;
	if (d > 0) return `${d}n ${h}g`;
	if (h > 0) return `${h}g ${m}p`;
	if (m > 0) return `${m}p ${sec}s`;
	return `${sec}s`;
};

interface QP { hours: number; sortKey: string; page: number; }
const DEFAULT_QP: QP = { hours: 24, sortKey: 'position_asc', page: 1 };

// ─── Expand Panel ─────────────────────────────────────────────────────────────
function ExpandPanel({ item }: { item: TrendItem }) {
	return (
		<Box sx={{ bgcolor: '#fffbf7', borderBottom: '1px solid', borderColor: 'divider', px: { xs: 2, md: 3 }, pt: 1.5, pb: 2.5, borderLeft: '4px solid #f97316' }}>
			{item.trendBreakdown.length > 0 && (
				<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
					<Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#c2410c', mr: 0.5, alignSelf: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>Biến thể:</Typography>
					{item.trendBreakdown.map((b, i) => (
						<Chip key={i} label={b} size="small" sx={{ fontSize: 10, height: 20, bgcolor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }} />
					))}
				</Box>
			)}
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
				<Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25 }}>
						<SearchOutlinedIcon sx={{ fontSize: 15, color: '#2563eb' }} />
						<Typography sx={{ fontWeight: 700, fontSize: '0.73rem', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.6 }}>Tìm kiếm liên quan</Typography>
					</Box>
					{item.relatedQueries.length === 0 ? (
						<Typography sx={{ fontSize: '0.82rem', color: 'text.disabled', fontStyle: 'italic' }}>Không có dữ liệu</Typography>
					) : (
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
							{item.relatedQueries.map((q, i) => (
								<Link key={i} href={q.link} target="_blank" rel="noopener noreferrer"
									sx={{ fontSize: '0.84rem', color: '#1d4ed8', fontWeight: 500, display: 'flex', alignItems: 'flex-start', gap: 0.5, textDecoration: 'none', lineHeight: 1.4, '&:hover': { color: '#ef4444', textDecoration: 'underline' } }}>
									<OpenInNewIcon sx={{ fontSize: 12, mt: '3px', flexShrink: 0 }} />
									{q.query}
								</Link>
							))}
						</Box>
					)}
				</Box>
				<Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25 }}>
						<ArticleOutlinedIcon sx={{ fontSize: 15, color: '#7c3aed' }} />
						<Typography sx={{ fontWeight: 700, fontSize: '0.73rem', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.6 }}>Bài viết liên quan</Typography>
					</Box>
					{item.articles.length === 0 ? (
						<Typography sx={{ fontSize: '0.82rem', color: 'text.disabled', fontStyle: 'italic' }}>Không có bài viết</Typography>
					) : (
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
							{item.articles.slice(0, 4).map((article, i) => (
								<Link key={i} href={article.link} target="_blank" rel="noopener noreferrer"
									sx={{ display: 'flex', gap: 1.25, textDecoration: 'none', '&:hover .art-title': { color: '#ef4444' } }}>
									<Avatar src={article.thumbnail ?? undefined} variant="rounded"
										sx={{ width: 52, height: 52, flexShrink: 0, bgcolor: '#f1f5f9', borderRadius: 1.5 }}>
										<ArticleOutlinedIcon sx={{ fontSize: 22, color: '#94a3b8' }} />
									</Avatar>
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<Typography className="art-title" sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.4, transition: 'color 0.15s', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
											{article.title}
										</Typography>
										<Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.25 }}>{article.source} · {article.date}</Typography>
									</Box>
								</Link>
							))}
						</Box>
					)}
				</Box>
			</Box>
		</Box>
	);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TrendingKeywordsSection() {
	const [qp, setQp] = useState<QP>(DEFAULT_QP);
	const [data, setData] = useState<TrendData | null>(null);
	const [loading, setLoading] = useState(false);
	const [isEmpty, setIsEmpty] = useState(false);
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [syncBlockedUntil, setSyncBlockedUntil] = useState<number | null>(null);
	const [countdown, setCountdown] = useState('');

	const updateFilter = useCallback((updates: Partial<QP>) => {
		setQp(prev => ({ ...prev, ...updates, page: 1 }));
	}, []);



	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		if (!syncBlockedUntil) { setCountdown(''); return; }
		const update = () => {
			const rem = syncBlockedUntil - Date.now();
			if (rem <= 0) { setSyncBlockedUntil(null); setCountdown(''); return; }
			setCountdown(fmtCountdown(rem));
		};
		update();
		const id = setInterval(update, 1000);
		return () => clearInterval(id);
	}, [syncBlockedUntil]);

	const fetchTrending = useCallback(async () => {
		setLoading(true);
		setIsEmpty(false);
		setExpandedId(null);
		const [sortBy, sortOrder] = qp.sortKey.split('_');
		const params: Record<string, unknown> = {
			geo: 'VN', hours: qp.hours, hl: 'vi',
			page: qp.page, limit: 10, sortBy, sortOrder,
		};
		try {
			const res = await api.get<{ success: boolean; data: TrendData }>('/serpapi/trending-current', { params });
			setSyncBlockedUntil(null);
			setData(res.data.data);
		} catch (err: unknown) {
			const e = err as { response?: { data?: { code?: string; errorCode?: string; message?: string; retryAfterMs?: number; retryAfter?: number }; status?: number } };
			const errData = e?.response?.data ?? {};
			const errCode = errData.code ?? errData.errorCode ?? '';
			if (errCode === 'SYNC_TOO_EARLY') {
				const ms = parseRetryAfterMs(errData);
				if (ms && ms > 0) setSyncBlockedUntil(Date.now() + ms);
			} else if (e?.response?.status === 404 && errCode === 'SERPAPI_NO_SNAPSHOT') {
				setIsEmpty(true); setData(null);
			} else {
				setData(null);
			}
		} finally {
			setLoading(false);
		}
	}, [qp]);

	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => { fetchTrending(); }, [fetchTrending]);

	const displayItems = data?.items ?? [];
	const isBlocked = !!syncBlockedUntil;

	// ─── CustomTable fields (bỏ Trạng thái + Danh mục) ───────────────────────
	const fields: TableField[] = [
		{
			id: 'position', name: 'position', label: '#', width: 56, align: 'center',
			renderCell: (row: TableRowData) => {
				const ps = posStyle(row.position as number);
				return (
					<Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: ps.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<Typography sx={{ fontWeight: ps.fw, fontSize: (row.position as number) <= 3 ? '1rem' : '0.88rem', color: ps.color, lineHeight: 1 }}>{row.position}</Typography>
					</Box>
				);
			},
		},
		{
			id: 'keyword', name: 'keyword', label: 'Từ khoá', wrapText: true,
			renderCell: (row: TableRowData) => (
				<Box sx={{ minWidth: 0 }}>
					<Typography sx={{ fontWeight: 700, fontSize: '0.94rem', lineHeight: 1.3, mb: 0.4 }} noWrap>{row.keyword}</Typography>
					{(row.trendBreakdown as string[]).length > 0 && (
						<Box sx={{ display: 'flex', gap: 0.5, overflow: 'hidden' }}>
							{(row.trendBreakdown as string[]).slice(0, 3).map((b, i) => (
								<Chip key={i} label={b} size="small" sx={{ fontSize: 10, height: 18, bgcolor: '#f1f5f9', color: '#475569', flexShrink: 0, maxWidth: 110 }} />
							))}
						</Box>
					)}
				</Box>
			),
		},
		{
			id: 'searchVolume', name: 'searchVolume', label: 'Lượt tìm', width: 90, sortable: true,
			renderCell: (row: TableRowData) => (
				<Typography sx={{ fontWeight: 600, fontSize: '0.88rem' }}>{fmtVol(row.searchVolume as number | null)}</Typography>
			),
		},
		{
			id: '_expand', name: '_expand', label: '', width: 36, align: 'center',
			renderCell: (row: TableRowData) => {
				const id = String(row.position);
				return expandedId === id
					? <KeyboardArrowUpIcon fontSize="small" sx={{ color: '#f97316' }} />
					: <KeyboardArrowDownIcon fontSize="small" sx={{ color: 'text.disabled' }} />;
			},
		},
	];

	const tableData: TableRowData[] = displayItems.map(item => ({
		...item,
		id: String(item.position),
	}));

	const renderExpandedRow = (row: TableRowData) => {
		const id = String(row.position);
		return expandedId === id ? <ExpandPanel item={row as unknown as TrendItem} /> : null;
	};

	const handleRowClick = (row: TableRowData) => {
		const id = String(row.position);
		setExpandedId(prev => prev === id ? null : id);
	};

	const isBlocked_ = isBlocked;

	return (
		<Box sx={{ flex: 1, minWidth: { xs: '100%', md: 480 }, height: { xs: 600, md: '100%' } }}>
			<Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '100%' }}>
				{/* ── Header ── */}
				<Box sx={{ px: 3, pt: 2.5, pb: 2, background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 70%)', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
						<Box sx={{ width: 42, height: 42, borderRadius: 2.5, background: 'linear-gradient(135deg, #ef4444, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.3)', flexShrink: 0, animation: 'pulse 2s infinite', '@keyframes pulse': { '0%': { boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }, '50%': { boxShadow: '0 4px 20px rgba(239,68,68,0.55)' }, '100%': { boxShadow: '0 4px 12px rgba(239,68,68,0.3)' } } }}>
							<WhatshotIcon sx={{ color: '#fff', fontSize: 22 }} />
						</Box>
						<Box>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
								<Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>
									Trending Keywords
								</Typography>
								<Chip label="LIVE" size="small" sx={{ fontSize: 9, height: 16, bgcolor: '#ef4444', color: '#fff', fontWeight: 800, letterSpacing: 0.5, px: 0.25 }} />
							</Box>
							<Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.1 }}>Từ khoá bùng nổ tại Việt Nam · Nguồn Google Trends</Typography>
						</Box>
					</Box>

					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
						{/* Time pills */}
						<Box sx={{ display: 'flex', gap: 0.5, p: 0.5, bgcolor: '#f1f5f9', borderRadius: 2 }}>
							{TIME_OPTS.map(opt => (
								<Box key={opt.value} onClick={() => updateFilter({ hours: opt.value })} sx={{ px: 1.5, py: 0.5, borderRadius: 1.5, cursor: 'pointer', bgcolor: qp.hours === opt.value ? '#fff' : 'transparent', boxShadow: qp.hours === opt.value ? '0 1px 4px rgba(0,0,0,0.12)' : 'none', color: qp.hours === opt.value ? '#ef4444' : '#64748b', fontWeight: qp.hours === opt.value ? 700 : 500, fontSize: '0.78rem', transition: 'all 0.15s', userSelect: 'none', whiteSpace: 'nowrap' }}>
									{opt.label}
								</Box>
							))}
						</Box>

						{/* Refresh */}
						<Box onClick={() => { if (!loading && !isBlocked_) fetchTrending(); }}
							title={isBlocked_ ? 'Đang trong thời gian cooldown' : 'Làm mới'}
							sx={{ minWidth: 34, height: 34, px: isBlocked_ && countdown ? 1 : 0, borderRadius: 2, border: '1px solid', borderColor: isBlocked_ ? '#fca5a5' : 'divider', bgcolor: isBlocked_ ? '#fff5f5' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, cursor: loading || isBlocked_ ? 'not-allowed' : 'pointer', color: isBlocked_ ? '#ef4444' : 'text.secondary', transition: 'all 0.15s', '&:hover': !loading && !isBlocked_ ? { bgcolor: '#f1f5f9', color: '#ef4444' } : {} }}>
							<RefreshOutlinedIcon sx={{ fontSize: 18, color: isBlocked_ ? '#ef4444' : 'inherit', animation: loading ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
							{isBlocked_ && countdown && (
								<Typography sx={{ fontSize: '0.67rem', fontWeight: 800, color: '#ef4444', whiteSpace: 'nowrap', lineHeight: 1 }}>{countdown}</Typography>
							)}
						</Box>

						{data?.fetchedAt && !loading && (
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
								<UpdateOutlinedIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
								<Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>{fmtDateTime(data.fetchedAt)}</Typography>
							</Box>
						)}
					</Box>
				</Box>

				{/* ── Body (scrollable) ── */}
				<Box sx={{ flex: 1, overflowY: 'auto' }}>
				{/* ── Skeleton ── */}
				{loading && (
					<Box>
						{[...Array(8)].map((_, i) => (
							<Box key={i} sx={{ display: 'flex', gap: 2, px: 3, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', alignItems: 'center' }}>
								<Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 1.5, flexShrink: 0 }} />
								<Box sx={{ flex: 1 }}>
									<Skeleton width={`${35 + (i * 7) % 35}%`} height={20} />
									<Skeleton width={`${20 + (i * 5) % 20}%`} height={16} sx={{ mt: 0.5 }} />
								</Box>
								<Skeleton width={55} height={20} />
								<Skeleton width={70} height={26} sx={{ borderRadius: 4 }} />
							</Box>
						))}
					</Box>
				)}

				{/* ── Empty states ── */}
				{!loading && isEmpty && (
					<Box sx={{ textAlign: 'center', py: 10 }}>
						<Box sx={{ width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
							<TrendingUpOutlinedIcon sx={{ fontSize: 34, color: '#f97316' }} />
						</Box>
						<Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 0.5 }}>Chưa có dữ liệu trending</Typography>
						<Typography sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>Vui lòng quay lại sau khi hệ thống đồng bộ dữ liệu</Typography>
					</Box>
				)}
				{!loading && !isEmpty && data && displayItems.length === 0 && (
					<Box sx={{ textAlign: 'center', py: 8 }}>
						<Box sx={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
							<TrendingUpOutlinedIcon sx={{ fontSize: 28, color: '#94a3b8' }} />
						</Box>
						<Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 0.5 }}>Không có kết quả</Typography>
						<Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>Thử điều chỉnh bộ lọc hoặc chọn khung thời gian khác</Typography>
					</Box>
				)}

				{/* ── CustomTable (pagination tích hợp sẵn) ── */}
				{!loading && displayItems.length > 0 && (
					<CustomTable
						fields={fields}
						data={tableData}
						loading={false}
						enablePagination
						page={qp.page - 1}
						rowsPerPage={10}
						totalCount={data?.total ?? 0}
						onPageChange={(p) => setQp(prev => ({ ...prev, page: p + 1 }))}
						onRowClick={handleRowClick}
						expandedRowId={expandedId}
						renderExpandedRow={renderExpandedRow}
					/>
				)}
				</Box>{/* end scrollable body */}
			</Paper>
		</Box>
	);
}
