import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../app/store';
import { ROUTES, ROLES } from '../utils/constants';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import BlockIcon from '@mui/icons-material/Block';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (user?.role !== ROLES.ADMIN) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4 p-8">
        <BlockIcon sx={{ fontSize: 56, color: 'error.main', opacity: 0.6 }} />
        <Typography variant="h5" className="font-semibold text-gray-800">
          Truy cập bị từ chối
        </Typography>
        <Typography className="text-gray-400 max-w-sm">
          Bạn không có quyền truy cập trang này. Chỉ Admin mới được phép.
        </Typography>
        <Button variant="contained" href={ROUTES.ARTICLES}>
          Về trang bài viết
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
}
