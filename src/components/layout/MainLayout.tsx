import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Header from './Header';
import NotificationToast from '../NotificationToast';
import { useNotifications } from '../../hooks/useNotifications';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchRolePermissions } from '../../features/auth/authSlice';

export default function MainLayout() {
	useNotifications();
	const dispatch = useAppDispatch();
	const { isAuthenticated, user, allowedPages } = useAppSelector((state) => state.auth);

	useEffect(() => {
		if (isAuthenticated && user) {
			dispatch(fetchRolePermissions());
		}
	}, [isAuthenticated, user, dispatch]);

	// Block render until permissions are resolved to prevent flash of unauthorized content
	if (allowedPages === undefined) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
			<Header onMenuToggle={() => { }} />
			<Box
				component="main"
				sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, pb: { xs: 12, md: 14 }, overflowX: 'hidden', overflowY: 'auto' }}
			>
				<Outlet />
			</Box>
			<NotificationToast />
		</Box>
	);
}
