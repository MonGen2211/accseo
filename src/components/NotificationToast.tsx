import { useState, useEffect, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import type { AppNotification } from '../types/notification.types';
import { NOTIFICATION_TOAST_EVENT } from '../utils/notificationToast';

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
				sx={{
					display: 'flex',
					alignItems: 'flex-start',
					gap: 1.5,
					bgcolor: '#ffffff',
					color: '#1e293b',
					borderRadius: '14px',
					px: 2,
					py: 1.5,
					boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
					border: '1px solid #e2e8f0',
					minWidth: 300,
					maxWidth: 380,
				}}
			>
				<Box
					sx={{
						width: 36, height: 36, borderRadius: '10px',
						bgcolor: 'rgba(0, 184, 148, 0.1)',
						display: 'flex', alignItems: 'center', justifyContent: 'center',
						flexShrink: 0, mt: 0.3,
					}}
				>
					<NotificationsActiveOutlinedIcon sx={{ fontSize: 18, color: '#00b894' }} />
				</Box>

				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Typography
						sx={{ fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.3, color: '#1e293b', mb: 0.3 }}
					>
						{notification.title}
					</Typography>
					<Typography
						sx={{
							fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4,
							overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
						}}
					>
						{notification.body}
					</Typography>
				</Box>

				<IconButton
					size="small"
					onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
					sx={{
						color: '#94a3b8', p: 0.5, mt: -0.3, mr: -0.5,
						'&:hover': { color: '#64748b', bgcolor: '#f1f5f9' },
					}}
				>
					<CloseIcon sx={{ fontSize: 16 }} />
				</IconButton>
			</Box>
		</Box>
	);
}
