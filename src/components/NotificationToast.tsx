import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import type { AppNotification } from '../types/notification.types';
import { NOTIFICATION_TOAST_EVENT } from '../utils/notificationToast';
import { useAppDispatch } from '../app/store';
import { markAsRead } from '../features/notifications/notificationSlice';

interface ToastItem {
	notification: AppNotification;
	key: number;
}

export default function NotificationToast() {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const counterRef = useRef(0);

	// Nhận notification mới → thêm vào danh sách toast
	const handleShow = useCallback((notification: AppNotification) => {
		counterRef.current += 1;
		const newItem: ToastItem = { notification, key: counterRef.current };
		setToasts((prev) => [...prev, newItem]);
	}, []);

	// Xóa 1 toast theo key
	const removeToast = useCallback((key: number) => {
		setToasts((prev) => prev.filter((t) => t.key !== key));
	}, []);

	// Lắng nghe custom event từ window
	useEffect(() => {
		const handler = (e: Event) => {
			handleShow((e as CustomEvent<AppNotification>).detail);
		};
		window.addEventListener(NOTIFICATION_TOAST_EVENT, handler);
		return () => window.removeEventListener(NOTIFICATION_TOAST_EVENT, handler);
	}, [handleShow]);

	return (
		<Box
			sx={{
				position: 'fixed',
				bottom: 24,
				right: 24,
				zIndex: 9999,
				display: 'flex',
				flexDirection: 'column-reverse',
				gap: 1,
			}}
		>
			{toasts.map((toast) => (
				<SingleToast
					key={toast.key}
					notification={toast.notification}
					onClose={() => removeToast(toast.key)}
				/>
			))}
		</Box>
	);
}

// ── Toast đơn lẻ — tự ẩn sau 5 giây ──────────────────────────

function SingleToast({
	notification,
	onClose,
}: {
	notification: AppNotification;
	onClose: () => void;
}) {
	const [visible, setVisible] = useState(false);
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	useEffect(() => {
		const showTimer = requestAnimationFrame(() => setVisible(true));
		const hideTimer = setTimeout(() => {
			setVisible(false);
			setTimeout(onClose, 300);
		}, 5000);

		return () => {
			cancelAnimationFrame(showTimer);
			clearTimeout(hideTimer);
		};
	}, [onClose]);

	// Chuẩn hóa data nhận được
	let data = notification.data;
	if (typeof data === 'string') {
		try {
			data = JSON.parse(data);
		} catch (e) {}
	}
	if (data && typeof data === 'object') {
		if (typeof data.recovered === 'string') {
			data.recovered = data.recovered === 'true';
		}
	}

	// Xác định Icon, màu sắc và border dựa vào loại thông báo
	let toastIcon = <NotificationsActiveOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />;
	let iconBgColor = 'rgba(0, 184, 148, 0.1)';
	let toastBorderColor = 'divider';

	if (notification.type === 'SCRAPER_HEALTH_ALERT') {
		const isRecovered = data?.recovered === true;
		if (isRecovered) {
			toastIcon = <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: 'success.main' }} />;
			iconBgColor = 'rgba(46, 125, 50, 0.1)';
			toastBorderColor = '#2e7d32';
		} else {
			const severity = data?.severity || 'WARN';
			if (severity === 'CRITICAL') {
				toastIcon = <ErrorOutlinedIcon sx={{ fontSize: 18, color: 'error.main' }} />;
				iconBgColor = 'rgba(211, 47, 47, 0.1)';
				toastBorderColor = '#d32f2f';
			} else {
				toastIcon = <WarningAmberIcon sx={{ fontSize: 18, color: 'warning.main' }} />;
				iconBgColor = 'rgba(237, 108, 2, 0.1)';
				toastBorderColor = '#ed6c02';
			}
		}
	}

	const handleClick = (e: React.MouseEvent) => {
		// Bỏ qua nếu nhấn vào nút close
		if ((e.target as HTMLElement).closest('button')) {
			return;
		}

		if (!notification.isRead) {
			dispatch(markAsRead(notification._id));
		}

		if (notification.type === 'SCRAPER_HEALTH_ALERT') {
			navigate('/scraper/health', { state: { highlightSource: data?.source } });
		} else if (data?.requestId) {
			navigate(`/requests/${data.requestId}`);
		} else if (data?.entityType === 'keyword_group') {
			navigate('/domains');
		}

		// Đóng toast sau khi nhấn
		setVisible(false);
		setTimeout(onClose, 300);
	};

	return (
		<Box
			sx={{
				opacity: visible ? 1 : 0,
				transform: visible ? 'translateX(0)' : 'translateX(40px)',
				transition: 'opacity 0.3s ease, transform 0.3s ease',
				pointerEvents: visible ? 'auto' : 'none',
			}}
		>
			<Box
				onClick={handleClick}
				sx={{
					display: 'flex',
					alignItems: 'flex-start',
					gap: 1.5,
					bgcolor: 'background.paper',
					color: 'text.primary',
					borderRadius: '14px',
					px: 2,
					py: 1.5,
					boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
					border: '1px solid',
					borderColor: toastBorderColor,
					minWidth: 300,
					maxWidth: 380,
					cursor: 'pointer',
					transition: 'all 0.2s ease-in-out',
					'&:hover': {
						borderColor: toastBorderColor === 'divider' ? 'primary.main' : toastBorderColor,
						transform: 'translateY(-2px)',
						boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
					},
				}}
			>
				<Box
					sx={{
						width: 36, height: 36, borderRadius: '10px',
						bgcolor: iconBgColor,
						display: 'flex', alignItems: 'center', justifyContent: 'center',
						flexShrink: 0, mt: 0.3,
					}}
				>
					{toastIcon}
				</Box>

				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Typography
						sx={{ fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.3, color: 'text.primary', mb: 0.3 }}
					>
						{notification.title}
					</Typography>
					<Typography
						sx={{
							fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.4,
							whiteSpace: 'pre-line',
						}}
					>
						{notification.body}
					</Typography>
				</Box>

				<IconButton
					size="small"
					onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
					sx={{
						color: 'text.secondary', p: 0.5, mt: -0.3, mr: -0.5,
						'&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
					}}
				>
					<CloseIcon sx={{ fontSize: 16 }} />
				</IconButton>
			</Box>
		</Box>
	);
}
