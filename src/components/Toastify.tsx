/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import Snackbar from '@mui/material/Snackbar';
import { Box, Typography, IconButton } from '@mui/material';


import ErrorIcon from '@mui/icons-material/Error';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export type ToastStatus = 'danger' | 'warning' | 'success';

interface ToastifyContextType {
	showToast: (message: string, status: ToastStatus) => void;
}

const ToastifyContext = createContext<ToastifyContextType | undefined>(undefined);

export function useToastify() {
	const context = useContext(ToastifyContext);
	if (!context) {
		throw new Error('useToastify phải được bọc bên trong <ToastifyProvider>');
	}
	return context;
}



// ─── Config UI ─────────────────────────────────────────────────────────────
const iconMap = {
	success: (
		<Box sx={{ width: 20, height: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			<CheckIcon sx={{ color: 'white', fontSize: 14 }} />
		</Box>
	),
	danger: (
		<Box sx={{ width: 20, height: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			<ErrorIcon sx={{ color: 'white', fontSize: 14 }} />
		</Box>
	),
	warning: (
		<Box sx={{ width: 20, height: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			<WarningAmberIcon sx={{ color: 'white', fontSize: 14 }} />
		</Box>
	),
};

const colorMap = {
	success: '#10B981',
	danger: '#EF4444',
	warning: '#F59E0B',
};

const titleMap = {
	success: 'Thành công',
	danger: 'Đã có lỗi xảy ra',
	warning: 'Cảnh báo',
};

// ─── Provider Component ─────────────────────────────────────────────────────
export function ToastifyProvider({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false);
	const [message, setMessage] = useState('');
	const [status, setStatus] = useState<ToastStatus>('warning');

	const showToast = useCallback((msg: string, st: ToastStatus) => {
		setMessage(msg);
		setStatus(st);
		setOpen(true);
	}, []);

	const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
		if (reason === 'clickaway') return;
		setOpen(false);
	};

	return (
		<ToastifyContext.Provider value={{ showToast }}>
			{children}
			<Snackbar
				open={open}
				autoHideDuration={4000}
				onClose={handleClose}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<Box
					sx={{
						minWidth: 320,
						maxWidth: 400,
						backgroundColor: colorMap[status as ToastStatus] || colorMap.success,
						borderRadius: '12px',
						padding: '16px',
						boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
						display: 'flex',
						alignItems: 'flex-start',
						gap: '12px',
						position: 'relative',
					}}
				>
					{/* Icon */}
					{iconMap[status as ToastStatus]}

					{/* Content */}
					<Box sx={{ flex: 3, minWidth: 0 }}>
						<Typography
							sx={{
								fontWeight: 600,
								color: '#ffffff',
								fontSize: '14px',
								marginBottom: '4px',
								lineHeight: 1.2,
							}}
						>
							{titleMap[status as ToastStatus]}
						</Typography>
						<Typography
							sx={{
								color: '#ffffff',
								fontSize: '14px',
								opacity: 0.9,
								lineHeight: 1.4,
							}}
						>
							{message}
						</Typography>
					</Box>

					{/* Close Button */}
					<IconButton
						onClick={(e) => handleClose(e)}
						sx={{
							color: 'white',
							padding: '4px',
							'&:hover': {
								backgroundColor: 'rgba(255, 255, 255, 0.2)',
							},
						}}
						size="small"
					>
						<CloseIcon sx={{ fontSize: 16 }} />
					</IconButton>
				</Box>
			</Snackbar>
		</ToastifyContext.Provider>
	);
}
