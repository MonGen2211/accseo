import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Popover from '@mui/material/Popover';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../app/store';
import { markAsRead, markAllAsRead } from '../../features/notifications/notificationSlice';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { NotificationType } from '../../types/notification.types';

const TAB_LABELS = ['Tất cả', 'Bài viết', 'Thay đổi', 'Đồng bộ'];
const TAB_TYPES: (NotificationType | null)[] = [null, 'article', 'change', 'sync'];

function NotifIcon({ type }: { type: NotificationType }) {
	const map: Record<NotificationType, { icon: React.ReactElement; color: string }> = {
		article: { icon: <ArticleOutlinedIcon sx={{ fontSize: 20 }} />, color: '#00b894' },
		schedule: { icon: <CalendarTodayOutlinedIcon sx={{ fontSize: 20 }} />, color: '#0984e3' },
		system: { icon: <CheckCircleOutlinedIcon sx={{ fontSize: 20 }} />, color: '#636e72' },
		sync: { icon: <SyncOutlinedIcon sx={{ fontSize: 20 }} />, color: '#fdcb6e' },
		change: { icon: <EditOutlinedIcon sx={{ fontSize: 20 }} />, color: '#e17055' },
	};
	const { icon, color } = map[type] || map.system;
	return (
		<Box sx={{
			width: 40, height: 40, borderRadius: '50%',
			bgcolor: `${color}18`,
			display: 'flex', alignItems: 'center', justifyContent: 'center',
			color, flexShrink: 0,
		}}>
			{icon}
		</Box>
	);
}

function formatTime(dateStr: string): string {
	try {
		return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
	} catch {
		return dateStr;
	}
}

export default function NotificationPanel() {
	const dispatch = useAppDispatch();
	const { items, unreadCount, loading } = useAppSelector((state) => state.notifications);
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const [tab, setTab] = useState(0);

	const filtered = tab === 0
		? items
		: items.filter((n) => n.type === TAB_TYPES[tab]);

	const handleMarkAllRead = () => {
		dispatch(markAllAsRead());
	};

	const handleMarkRead = (_id: string) => {
		dispatch(markAsRead(_id));
	};

	return (
		<>
			<IconButton
				size="small"
				onClick={(e) => setAnchorEl(e.currentTarget)}
				sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff' } }}
			>
				<Badge
					badgeContent={unreadCount}
					color="error"
					sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}
				>
					<NotificationsNoneOutlinedIcon sx={{ fontSize: 22 }} />
				</Badge>
			</IconButton>

			<Popover
				open={Boolean(anchorEl)}
				anchorEl={anchorEl}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				slotProps={{
					paper: {
						sx: {
							width: 380,
							maxHeight: 560,
							borderRadius: 3,
							boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
							mt: 1,
							overflow: 'hidden',
							display: 'flex',
							flexDirection: 'column',
						},
					},
				}}
			>
				{/* Header */}
				<Box sx={{ px: 2.5, pt: 2, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					<Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>Thông báo</Typography>
					<Button
						startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
						size="small"
						onClick={handleMarkAllRead}
						disabled={unreadCount === 0}
						sx={{ fontSize: '0.75rem', textTransform: 'none', color: '#00b894', fontWeight: 600, gap: 0.5 }}
					>
						Đánh dấu đã đọc
					</Button>
				</Box>

				{/* Tabs */}
				<Tabs
					value={tab}
					onChange={(_, v) => setTab(v)}
					variant="scrollable"
					scrollButtons={false}
					sx={{
						px: 1.5,
						minHeight: 36,
						'& .MuiTab-root': { fontSize: '0.78rem', minHeight: 36, textTransform: 'none', fontWeight: 500, px: 1.5 },
						'& .Mui-selected': { color: '#00b894 !important', fontWeight: 700 },
						'& .MuiTabs-indicator': { bgcolor: '#00b894' },
					}}
				>
					{TAB_LABELS.map((label) => (
						<Tab key={label} label={label} />
					))}
				</Tabs>
				<Divider />

				{/* List */}
				<Box sx={{ overflowY: 'auto', flex: 1 }}>
					{loading ? (
						<Box sx={{ py: 6, textAlign: 'center' }}>
							<CircularProgress size={28} sx={{ color: '#00b894' }} />
						</Box>
					) : filtered.length === 0 ? (
						<Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled' }}>
							<NotificationsNoneOutlinedIcon sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
							<Typography sx={{ fontSize: '0.85rem' }}>Không có thông báo</Typography>
						</Box>
					) : (
						filtered.map((notif) => (
							<Box
								key={notif._id}
								onClick={() => handleMarkRead(notif._id)}
								sx={{
									display: 'flex', alignItems: 'flex-start', gap: 1.5,
									px: 2.5, py: 1.5, cursor: 'pointer',
									bgcolor: notif.isRead ? 'transparent' : 'rgba(0, 184, 148, 0.05)',
									borderLeft: notif.isRead ? '3px solid transparent' : '3px solid #00b894',
									'&:hover': { bgcolor: 'action.hover' },
									transition: 'background 0.15s',
								}}
							>
								<NotifIcon type={notif.type} />
								<Box sx={{ flex: 1, minWidth: 0 }}>
									<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
										<Typography sx={{ fontSize: '0.82rem', fontWeight: notif.isRead ? 500 : 700, color: 'text.primary' }}>
											{notif.title}
										</Typography>
										{!notif.isRead && (
											<Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#00b894', flexShrink: 0 }} />
										)}
									</Box>
									<Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
										{notif.body}
									</Typography>
									<Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: 0.5 }}>
										🕐 {formatTime(notif.createdAt)}
									</Typography>
								</Box>
							</Box>
						))
					)}
				</Box>
			</Popover>
		</>
	);
}
