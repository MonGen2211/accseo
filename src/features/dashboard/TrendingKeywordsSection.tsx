import { useEffect, useState, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';
import api from '../../utils/api';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import AvatarGroup from '@mui/material/AvatarGroup';
import Tooltip from '@mui/material/Tooltip';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import UpdateOutlinedIcon from '@mui/icons-material/UpdateOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import CloudSyncOutlinedIcon from '@mui/icons-material/CloudSyncOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { CustomTable } from '../../components/custom-table/CustomTable';
import { useToastify } from '../../components/Toastify';
import type { TableField } from '../../types/tableFields.types';
import type { TableRowData } from '../../types/tableRows.types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface RelatedQuery { query: string; link: string; }
interface Article { title: string; link: string; source: string; thumbnail: string | null; date: string; }

interface TrendItem {
	keyword: string;
	position: number;
	searchVolume: number | null;
	active: boolean | null;
	startTimestamp: number | null;
	endTimestamp: number | null;
	categories: string[];
	trendBreakdown: string[];
	relatedQueries: RelatedQuery[];
	articles: Article[];
	increasePercentage: number | null;
}

interface CategoryStatItem {
	categoryId: string;
	count: number;
}

interface TrendData {
	geo: string; hours: number; hl: string; categoryId: number;
	fetchedDate: string; fetchedAt: string; serpapiCreatedAt: string;
	total: number; totalAll?: number; page: number; limit: number; totalPages: number;
	count: number; items: TrendItem[];
	categoryStats?: CategoryStatItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TIME_OPTS = [
	{ label: '4 giờ', value: 4 },
	{ label: '24 giờ', value: 24 },
	{ label: '48 giờ', value: 48 },
	{ label: '7 ngày', value: 168 },
] as const;

const CATEGORY_MAP: Record<string, string> = {
	'1': 'Ô tô và phương tiện vận tải',
	'2': 'Làm đẹp và thời trang',
	'3': 'Kinh doanh và tài chính',
	'4': 'Giải trí',
	'5': 'Đồ ăn và đồ uống',
	'6': 'Trò chơi',
	'7': 'Sức khoẻ',
	'8': 'Sở thích và thú vui',
	'9': 'Việc làm và giáo dục',
	'10': 'Luật và chính phủ',
	'11': 'Khác',
	'13': 'Thú cưng và động vật',
	'14': 'Chính trị',
	'15': 'Khoa học',
	'16': 'Mua sắm',
	'17': 'Thể thao',
	'18': 'Công nghệ',
	'19': 'Du lịch và vận tải',
	'20': 'Khí hậu'
};

const getCategoryName = (id: string) => CATEGORY_MAP[id] || `Chủ đề ${id}`;

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

const posStyle = (pos: number, mode: PaletteMode) => {
	const isDark = mode === 'dark';
	if (pos === 1) {
		return { 
			color: isDark ? '#3dd6a0' : '#009975', 
			bg: isDark ? 'rgba(0, 184, 148, 0.15)' : '#e6f7f4', 
			border: isDark ? '1px solid rgba(0, 184, 148, 0.3)' : '1px solid rgba(0, 184, 148, 0.15)',
			fw: 900 
		};
	}
	if (pos === 2) {
		return { 
			color: isDark ? '#22d3ee' : '#0891b2', 
			bg: isDark ? 'rgba(6, 182, 212, 0.15)' : '#ecfeff', 
			border: isDark ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(6, 182, 212, 0.15)',
			fw: 800 
		};
	}
	if (pos === 3) {
		return { 
			color: isDark ? '#94a3b8' : '#475569', 
			bg: isDark ? 'rgba(148, 163, 184, 0.15)' : '#f1f5f9', 
			border: isDark ? '1px solid rgba(148, 163, 184, 0.3)' : '1px solid rgba(148, 163, 184, 0.15)',
			fw: 800 
		};
	}
	return { 
		color: 'text.secondary', 
		bg: 'background.default', 
		border: 'none',
		fw: 700 
	};
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

function formatRelativeTime(ms: number): string {
	if (ms < 0) return 'Vừa xong';
	const s = Math.floor(ms / 1000);
	if (s < 60) return `${s} giây trước`;
	const m = Math.floor(s / 60);
	if (m < 60) return `${m} phút trước`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h} giờ trước`;
	const d = Math.floor(h / 24);
	if (d < 30) return `${d} ngày trước`;
	const mo = Math.floor(d / 30);
	if (mo < 12) return `${mo} tháng trước`;
	return `${Math.floor(mo / 12)} năm trước`;
}

export function formatTrendDuration(start: number | null, end: number | null, active: boolean | null): string {
	if (!start) return '';
	const startMs = start * 1000;
	const startStr = formatRelativeTime(Date.now() - startMs);
	if (active) return `Bắt đầu ${startStr}`;
	if (end) {
		const durationH = Math.round((end - start) / 3600);
		return durationH < 24
			? `Kéo dài ${durationH}h (bắt đầu ${startStr})`
			: `Kéo dài ${Math.round(durationH / 24)} ngày`;
	}
	return startStr;
}

function getActiveBadge(active: boolean | null) {
	if (active === null) return null;
	return active
		? { label: 'Đang trending', variant: 'success' }
		: { label: 'Đã kết thúc', variant: 'muted' };
}

interface QP { hours: number; sortKey: string; page: number; onlyActive?: boolean; categoryId?: string; }
const DEFAULT_QP: QP = { hours: 24, sortKey: 'position_asc', page: 1, onlyActive: false, categoryId: '0' };

// ─── Expand Panel ─────────────────────────────────────────────────────────────
function ExpandPanel({ item }: { item: TrendItem }) {
	const isScrapeMaybe = item.relatedQueries.length === 0;
	const showEmptyArticles = item.articles.length === 0;

	return (
		<Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', px: { xs: 2, md: 3 }, pt: 1.5, pb: 2.5, borderLeft: (theme) => `4px solid ${theme.palette.primary.main}` }}>
			<Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
				{item.categories && item.categories.length > 0 && (
					<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
						<Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', mr: 0.5, alignSelf: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>Danh mục:</Typography>
						{item.categories.map((c, i) => (
							<Chip 
								key={i} 
								label={getCategoryName(c)} 
								size="small" 
								sx={{ 
									fontSize: 10, 
									height: 20, 
									bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5', 
									color: (theme) => theme.palette.mode === 'dark' ? '#34d399' : '#059669', 
									border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #a7f3d0', 
									fontWeight: 600 
								}} 
							/>
						))}
					</Box>
				)}

				{item.trendBreakdown.length > 0 && (
					<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', ml: item.categories?.length > 0 ? 2 : 0 }}>
						<Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', mr: 0.5, alignSelf: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>Biến thể:</Typography>
						{item.trendBreakdown.map((b, i) => (
							<Chip 
								key={i} 
								label={b} 
								size="small" 
								sx={{ 
									fontSize: 10, 
									height: 20, 
									bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9', 
									color: (theme) => theme.palette.mode === 'dark' ? '#cbd5e1' : '#475569', 
									border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0' 
								}} 
							/>
						))}
					</Box>
				)}
			</Box>
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: isScrapeMaybe ? '1fr' : '1fr 1fr' }, gap: 3 }}>
				{!isScrapeMaybe && (
				<Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25 }}>
						<SearchOutlinedIcon sx={{ fontSize: 15, color: 'primary.main' }} />
						<Typography sx={{ fontWeight: 700, fontSize: '0.73rem', color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.6 }}>Tìm kiếm liên quan</Typography>
					</Box>
					{item.relatedQueries.length === 0 ? (
						<Typography sx={{ fontSize: '0.82rem', color: 'text.disabled', fontStyle: 'italic' }}>Không có dữ liệu</Typography>
					) : (
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
							{item.relatedQueries.map((q, i) => (
								<Link key={i} href={q.link} target="_blank" rel="noopener noreferrer"
									sx={{ 
										fontSize: '0.84rem', 
										color: (theme) => theme.palette.mode === 'dark' ? '#3dd6a0' : '#009975', 
										fontWeight: 500, 
										display: 'flex', 
										alignItems: 'flex-start', 
										gap: 0.5, 
										textDecoration: 'none', 
										lineHeight: 1.4, 
										'&:hover': { 
											color: 'primary.main', 
											textDecoration: 'underline' 
										} 
									}}>
									<OpenInNewIcon sx={{ fontSize: 12, mt: '3px', flexShrink: 0 }} />
									{q.query}
								</Link>
							))}
						</Box>
					)}
				</Box>
				)}
				<Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25 }}>
						<ArticleOutlinedIcon sx={{ fontSize: 15, color: '#00b894' }} />
						<Typography sx={{ fontWeight: 700, fontSize: '0.73rem', color: '#00b894', textTransform: 'uppercase', letterSpacing: 0.6 }}>Bài viết liên quan</Typography>
					</Box>
					{showEmptyArticles ? (
						<Box>
							{item.position <= 100 ? (
								<Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontStyle: 'italic' }}>Đang cập nhật bài viết...</Typography>
							) : (
								<>
									<Typography sx={{ fontSize: '0.82rem', color: 'text.disabled', fontStyle: 'italic' }}>Chưa có bài viết liên quan</Typography>
									<Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: 0.5 }}>(Articles chỉ load cho top 100 trending)</Typography>
								</>
							)}
						</Box>
					) : (
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
							{item.articles.slice(0, 4).map((article, i) => (
								<Link key={i} href={article.link} target="_blank" rel="noopener noreferrer"
									sx={{ display: 'flex', gap: 1.25, textDecoration: 'none', '&:hover .art-title': { color: 'primary.main' } }}>
									<Avatar src={article.thumbnail ?? undefined} variant="rounded"
										sx={{ width: 52, height: 52, flexShrink: 0, bgcolor: 'action.hover', borderRadius: 1.5 }}>
										<ArticleOutlinedIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
									</Avatar>
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<Typography className="art-title" sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.primary', lineHeight: 1.4, transition: 'color 0.15s', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
											{article.title}
										</Typography>
										<Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.25 }}>
											{article.source} · {(() => {
												try {
													const dateObj = new Date(article.date);
													if (isNaN(dateObj.getTime())) return article.date;
													const diffMs = Date.now() - dateObj.getTime();
													return formatRelativeTime(diffMs);
												} catch { return article.date; }
											})()}
										</Typography>
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
	const theme = useTheme();
	const [qp, setQp] = useState<QP>(DEFAULT_QP);
	const [data, setData] = useState<TrendData | null>(null);
	const [loading, setLoading] = useState(false);
	const [isEmpty, setIsEmpty] = useState(false);
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [syncBlockedUntil, setSyncBlockedUntil] = useState<number | null>(null);
	const [countdown, setCountdown] = useState('');
	const [isSyncing, setIsSyncing] = useState(false);
	const { showToast } = useToastify();

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
		if (qp.onlyActive) params.active = true;
		if (qp.categoryId && qp.categoryId !== '0') params.categoryId = qp.categoryId;
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

	const handleSync = async () => {
		if (isSyncing || loading) return;
		setIsSyncing(true);
		try {
			showToast('Đang tiến hành lấy dữ liệu mới nhất. Quá trình này có thể mất 1-3 phút...', 'info');
			const params = { geo: 'VN', hours: qp.hours, hl: 'vi' };
			const res = await api.post('/serpapi/sync-trending-scrape', null, { params });
			if (res.data.success) {
				showToast('Đồng bộ thành công! Đang tải lại dữ liệu...', 'success');
				fetchTrending();
			} else {
				showToast(res.data.message || 'Đồng bộ thất bại', 'danger');
			}
		} catch (err: any) {
			const data = err.response?.data;
			showToast(data?.message || 'Lỗi kết nối khi đồng bộ', 'danger');
		} finally {
			setIsSyncing(false);
		}
	};

	const displayItems = data?.items ?? [];
	const isBlocked = !!syncBlockedUntil;

	// ─── CustomTable fields (bỏ Trạng thái + Danh mục) ───────────────────────
	const fields: TableField[] = [
		{
			id: 'position', name: 'position', label: '#', width: 56, align: 'center',
			renderCell: (row: TableRowData) => {
				const ps = posStyle(row.position as number, theme.palette.mode);
				return (
					<Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: ps.bg, border: ps.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<Typography sx={{ fontWeight: ps.fw, fontSize: (row.position as number) <= 3 ? '1rem' : '0.88rem', color: ps.color, lineHeight: 1 }}>{row.position}</Typography>
					</Box>
				);
			},
		},
		{
			id: 'keyword', name: 'keyword', label: 'Từ khoá', wrapText: true,
			renderCell: (row: TableRowData) => {
				const item = row as unknown as TrendItem;
				const activeBadge = getActiveBadge(item.active);
				return (
				<Box sx={{ minWidth: 0 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4, flexWrap: 'wrap' }}>
						<Typography sx={{ fontWeight: 700, fontSize: '0.94rem', lineHeight: 1.3 }} noWrap>{item.keyword}</Typography>
						{activeBadge && (
							<Chip 
								label={activeBadge.label} 
								size="small" 
								sx={{ 
									height: 18, 
									fontSize: 10, 
									fontWeight: 700, 
									color: (theme) => {
										const isDark = theme.palette.mode === 'dark';
										if (activeBadge.variant === 'success') return isDark ? '#4ade80' : '#16a34a';
										return 'text.secondary';
									}, 
									bgcolor: (theme) => {
										const isDark = theme.palette.mode === 'dark';
										if (activeBadge.variant === 'success') return isDark ? 'rgba(74, 222, 128, 0.15)' : '#dcfce7';
										return 'action.hover';
									},
									border: (theme) => {
										const isDark = theme.palette.mode === 'dark';
										if (activeBadge.variant === 'success') return isDark ? '1px solid rgba(74, 222, 128, 0.3)' : 'none';
										return 'none';
									}
								}} 
							/>
						)}
					</Box>
				</Box>
			)},
		},
		{
			id: 'articles', name: 'articles', label: 'Báo chí', width: 160,
			renderCell: (row: TableRowData) => {
				const item = row as unknown as TrendItem;
				if (item.articles.length === 0) return <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>—</Typography>;
				return (
					<AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: 13, border: '1px solid #fff' } }}>
						{item.articles.map((art, i) => (
							<Tooltip key={i} title={art.source} arrow placement="top">
								<Avatar src={art.thumbnail || undefined} />
							</Tooltip>
						))}
					</AvatarGroup>
				);
			}
		},
		{
			id: 'increasePercentage', name: 'increasePercentage', label: 'Tăng trưởng', width: 150, sortable: true,
			renderCell: (row: TableRowData) => {
				const val = row.increasePercentage as number | null;
				if (val === null) return <Typography sx={{ fontSize: '0.88rem', color: 'text.disabled' }}>—</Typography>;
				const isBreakout = val >= 1000;
				return (
					<Chip 
						label={isBreakout ? '🔥 +1,000%+' : `+${val.toLocaleString()}%`} 
						size="small" 
						sx={{ 
							fontWeight: 700, fontSize: '0.85rem', height: 24, 
							bgcolor: (theme) => {
								const isDark = theme.palette.mode === 'dark';
								if (isBreakout) return isDark ? 'rgba(231, 76, 60, 0.12)' : '#fdf2f2';
								return isDark ? 'rgba(0, 184, 148, 0.12)' : '#e6f7f4';
							},
							color: (theme) => {
								const isDark = theme.palette.mode === 'dark';
								if (isBreakout) return isDark ? '#f87171' : '#e74c3c';
								return isDark ? '#3dd6a0' : '#009975';
							},
							border: (theme) => {
								const isDark = theme.palette.mode === 'dark';
								if (isBreakout) return isDark ? '1px solid rgba(231, 76, 60, 0.25)' : '1px solid rgba(231, 76, 60, 0.15)';
								return isDark ? '1px solid rgba(0, 184, 148, 0.25)' : '1px solid rgba(0, 184, 148, 0.15)';
							}
						}} 
					/>
				);
			}
		},
		{
			id: 'searchVolume', name: 'searchVolume', label: 'Lượt tìm', width: 120, sortable: true,
			renderCell: (row: TableRowData) => (
				<Typography sx={{ fontWeight: 600, fontSize: '0.88rem' }}>{fmtVol(row.searchVolume as number | null)}</Typography>
			),
		},
		{
			id: '_expand', name: '_expand', label: '', width: 36, align: 'center',
			renderCell: (row: TableRowData) => {
				const id = String(row.position);
				return expandedId === id
					? <KeyboardArrowUpIcon fontSize="small" sx={{ color: 'primary.main' }} />
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
		<Box sx={{ width: '100%', height: 750 }}>
			<Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '100%' }}>
				{/* ── Header ── */}
				<Box sx={{ px: 3, pt: 2.5, pb: 2, background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(135deg, rgba(0, 184, 148, 0.05) 0%, transparent 70%)' : 'linear-gradient(135deg, #e6f7f4 0%, #ffffff 70%)', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
						<Box sx={{ width: 42, height: 42, borderRadius: 2.5, background: 'linear-gradient(135deg, #00b894, #009975)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0, 184, 148, 0.25)', flexShrink: 0, animation: 'pulse 2s infinite', '@keyframes pulse': { '0%': { boxShadow: '0 4px 12px rgba(0, 184, 148, 0.25)' }, '50%': { boxShadow: '0 4px 20px rgba(0, 184, 148, 0.45)' }, '100%': { boxShadow: '0 4px 12px rgba(0, 184, 148, 0.25)' } } }}>
							<WhatshotIcon sx={{ color: 'primary.contrastText', fontSize: 22 }} />
						</Box>
						<Box>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
								<Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>
									Trending Keywords
								</Typography>
								<Chip label="LIVE" size="small" sx={{ fontSize: 9, height: 16, bgcolor: 'error.main', color: 'error.contrastText', fontWeight: 800, letterSpacing: 0.5, px: 0.5, borderRadius: 1 }} />
							</Box>
							<Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.1 }}>Từ khoá bùng nổ tại Việt Nam · Nguồn Google Trends</Typography>
						</Box>
					</Box>

					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
						{/* Time pills */}
						<Box sx={{ display: 'flex', gap: 0.5, p: 0.5, bgcolor: 'action.hover', borderRadius: 2 }}>
							{TIME_OPTS.map(opt => (
								<Box key={opt.value} onClick={() => updateFilter({ hours: opt.value })} sx={{ px: 1.5, py: 0.5, borderRadius: 1.5, cursor: 'pointer', bgcolor: qp.hours === opt.value ? 'background.paper' : 'transparent', boxShadow: qp.hours === opt.value ? '0 1px 4px rgba(0,0,0,0.12)' : 'none', color: qp.hours === opt.value ? 'primary.main' : 'text.secondary', fontWeight: qp.hours === opt.value ? 700 : 500, fontSize: '0.78rem', transition: 'all 0.15s', userSelect: 'none', whiteSpace: 'nowrap' }}>
									{opt.label}
								</Box>
							))}
						</Box>

						{/* Only active toggle */}
						<FormControlLabel
							control={<Switch size="small" checked={qp.onlyActive || false} onChange={(e) => updateFilter({ onlyActive: e.target.checked })} />}
							label={<Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Chỉ đang trending</Typography>}
							sx={{ m: 0, mr: 1, '& .MuiFormControlLabel-label': { ml: 0.5 } }}
						/>

						{/* Category Filter */}
						<FormControl size="small" sx={{ minWidth: 160 }}>
							<Select
								value={qp.categoryId || '0'}
								onChange={(e) => updateFilter({ categoryId: e.target.value as string })}
								displayEmpty
								sx={{ fontSize: '0.8rem', height: 32, borderRadius: 1.5, bgcolor: 'background.paper', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
							>
								<MenuItem value="0" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
									Tất cả danh mục {data?.totalAll !== undefined ? `(${data.totalAll})` : ''}
								</MenuItem>
								
								{data?.categoryStats 
									? data.categoryStats.filter(s => s.categoryId !== '0').map(stat => (
										<MenuItem key={stat.categoryId} value={stat.categoryId} sx={{ fontSize: '0.8rem' }}>
											{getCategoryName(stat.categoryId)} ({stat.count})
										</MenuItem>
									))
									: Object.entries(CATEGORY_MAP).map(([id, name]) => (
										<MenuItem key={id} value={id} sx={{ fontSize: '0.8rem' }}>{name}</MenuItem>
									))
								}
							</Select>
						</FormControl>

						{/* Sync Latest */}
						<Button
							variant="contained"
							size="small"
							disabled={isSyncing || loading}
							startIcon={isSyncing ? <CircularProgress size={16} color="inherit" /> : <CloudSyncOutlinedIcon fontSize="small" />}
							onClick={handleSync}
							sx={{
								textTransform: 'none',
								fontWeight: 600,
								fontSize: '0.78rem',
								borderRadius: 1.5,
								boxShadow: '0 2px 6px rgba(0, 184, 148, 0.15)',
								background: 'linear-gradient(135deg, #00b894, #009975)',
								color: 'primary.contrastText',
								'&:hover': { 
									background: 'linear-gradient(135deg, #3dd6a0, #009975)',
									boxShadow: '0 4px 12px rgba(0, 184, 148, 0.3)' 
								}
							}}
						>
							{isSyncing ? 'Đang đồng bộ...' : 'Lấy dữ liệu mới'}
						</Button>

						{/* Refresh */}
						<Box onClick={() => { if (!loading && !isBlocked_ && !isSyncing) fetchTrending(); }}
							title={isBlocked_ ? 'Đang trong thời gian cooldown' : 'Làm mới'}
							sx={{ 
								minWidth: 34, 
								height: 34, 
								px: isBlocked_ && countdown ? 1 : 0, 
								borderRadius: 2, 
								border: '1px solid', 
								borderColor: (theme) => {
									const isDark = theme.palette.mode === 'dark';
									if (isBlocked_) return isDark ? 'rgba(231, 76, 60, 0.4)' : 'rgba(231, 76, 60, 0.3)';
									return 'divider';
								}, 
								bgcolor: (theme) => {
									const isDark = theme.palette.mode === 'dark';
									if (isBlocked_) return isDark ? 'rgba(231, 76, 60, 0.12)' : '#fdf2f2';
									return isDark ? 'rgba(255, 255, 255, 0.05)' : '#fff';
								}, 
								display: 'flex', 
								alignItems: 'center', 
								justifyContent: 'center', 
								gap: 0.5, 
								cursor: loading || isBlocked_ ? 'not-allowed' : 'pointer', 
								color: (theme) => {
									const isDark = theme.palette.mode === 'dark';
									if (isBlocked_) return 'error.main';
									return isDark ? '#f8fafc' : 'text.secondary';
								}, 
								transition: 'all 0.15s', 
								'&:hover': !loading && !isBlocked_ ? { 
									bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'action.hover', 
									color: 'primary.main' 
								} : {} 
							}}
						>
							<RefreshOutlinedIcon sx={{ fontSize: 18, color: isBlocked_ ? '#e74c3c' : 'inherit', animation: loading ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
							{isBlocked_ && countdown && (
								<Typography sx={{ fontSize: '0.67rem', fontWeight: 800, color: 'error.main', whiteSpace: 'nowrap', lineHeight: 1 }}>{countdown}</Typography>
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
						<Box sx={{ width: 76, height: 76, borderRadius: '50%', background: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 184, 148, 0.12)' : '#e6f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
							<TrendingUpOutlinedIcon sx={{ fontSize: 34, color: 'primary.main' }} />
						</Box>
						<Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 0.5 }}>Chưa có dữ liệu trending</Typography>
						<Typography sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>Vui lòng quay lại sau khi hệ thống đồng bộ dữ liệu</Typography>
					</Box>
				)}
				{!loading && !isEmpty && data && displayItems.length === 0 && (
					<Box sx={{ textAlign: 'center', py: 8 }}>
						<Box sx={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
							<TrendingUpOutlinedIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
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
						onSort={(id) => {
							const currentSort = qp.sortKey.split('_');
							if (currentSort[0] === id) {
								updateFilter({ sortKey: `${id}_${currentSort[1] === 'desc' ? 'asc' : 'desc'}` });
							} else {
								updateFilter({ sortKey: `${id}_desc` });
							}
						}}
						sortBy={qp.sortKey.split('_')[0]}
						sortOrder={qp.sortKey.split('_')[1] as 'asc'|'desc'}
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
