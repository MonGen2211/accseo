import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f0f2f5' }}>
			<Header onMenuToggle={() => { }} />
			<Box
				component="main"
				sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, pb: { xs: 12, md: 14 }, overflow: 'auto' }}
			>
				<Outlet />
			</Box>
			<Sidebar />
		</Box>
	);
}
