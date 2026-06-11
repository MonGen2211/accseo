import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../app/store';
import { ROUTES } from '../utils/constants';
import { bootstrapAuth } from '../features/auth/authSlice';

function PageRoute({ pageKey, children }: { pageKey: string; children: React.ReactNode }) {
	const allowedPages = useAppSelector((state) => state.auth.allowedPages);
	// null = admin (all access); undefined = blocked by MainLayout (never reaches here)
	if (Array.isArray(allowedPages) && !allowedPages.includes(pageKey)) {
		return <Navigate to={ROUTES.DASHBOARD} replace />;
	}
	return <>{children}</>;
}
import PrivateRoute from './PrivateRoute';
import MainLayout from '../components/layout/MainLayout';
import LoginPage from '../features/auth/components/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import KeywordPage from '../features/keywords/components/KeywordPage';
import SettingsPage from '../features/settings/components/SettingsPage';
import ProfilePage from '../features/profile/components/ProfilePage';
import CreateRequestPage from '../features/requests/components/CreateRequestPage';
import RequestDetailPage from '../features/requests/components/RequestDetailPage';
import GroupFormPage from '../features/requests/components/GroupFormPage';
import ForceIndexPage from '../features/force-index/components/ForceIndexPage';
import UrlScraperSection from '../features/url-scraper/components/UrlScraperSection';

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
					<Route path="profile" element={<ProfilePage />} />
					<Route path="settings" element={<PageRoute pageKey="settings"><SettingsPage /></PageRoute>} />
					<Route path="users" element={<PageRoute pageKey="users"><DashboardPage /></PageRoute>} />
					<Route path="domains" element={<PageRoute pageKey="domains"><DashboardPage /></PageRoute>} />
					<Route path="domains/:domainId/keywords" element={<PageRoute pageKey="keywords"><KeywordPage /></PageRoute>} />
					<Route path="requests" element={<PageRoute pageKey="requests"><DashboardPage /></PageRoute>} />
					<Route path="requests/create" element={<PageRoute pageKey="requests"><CreateRequestPage /></PageRoute>} />
					<Route path="requests/:id" element={<PageRoute pageKey="requests"><RequestDetailPage /></PageRoute>} />
					<Route path="groups/create" element={<PageRoute pageKey="requests"><GroupFormPage /></PageRoute>} />
					<Route path="groups/:id/edit" element={<PageRoute pageKey="requests"><GroupFormPage /></PageRoute>} />
					<Route path="tools/force-index" element={<ForceIndexPage />} />
					<Route path="tools/scraper-url" element={<UrlScraperSection />} />
				</Route>

				<Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
			</Routes>
		</BrowserRouter>
	);
}
