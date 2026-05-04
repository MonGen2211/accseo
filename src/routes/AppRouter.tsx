import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../app/store';
import { ROUTES } from '../utils/constants';
import { bootstrapAuth } from '../features/auth/authSlice';
import PrivateRoute from './PrivateRoute';
import MainLayout from '../components/layout/MainLayout';
import LoginPage from '../features/auth/components/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import UserPage from '../features/users/components/UserPage';
import DomainPage from '../features/domains/components/DomainPage';
import KeywordPage from '../features/keywords/components/KeywordPage';
import SettingsPage from '../features/settings/components/SettingsPage';

export default function AppRouter() {
	const dispatch = useAppDispatch();
	const { isAuthenticated } = useAppSelector((state) => state.auth);

	useEffect(() => {
		dispatch(bootstrapAuth());
	}, [dispatch]);

	return (
		<BrowserRouter>
			<Routes>
				<Route
					path={ROUTES.LOGIN}
					element={isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : <LoginPage />}
				/>

				<Route
					path="/"
					element={
						<PrivateRoute>
							<MainLayout />
						</PrivateRoute>
					}
				>
					<Route index element={<DashboardPage />} />
					<Route path="settings" element={<SettingsPage />} />
					<Route path="users" element={<UserPage />} />
					<Route path="domains" element={<DomainPage />} />
					<Route path="domains/:domainId/keywords" element={<KeywordPage />} />
				</Route>

				<Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
			</Routes>
		</BrowserRouter>
	);
}
