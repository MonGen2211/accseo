import { Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAppSelector } from '../app/store';
import { ROUTES } from '../utils/constants';

interface PrivateRouteProps {
	children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
	const { isAuthenticated, initializing } = useAppSelector((state) => state.auth);

	if (initializing) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
				<CircularProgress />
			</Box>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to={ROUTES.LOGIN} replace />;
	}

	return <>{children}</>;
}
