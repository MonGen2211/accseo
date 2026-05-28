import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { useAppSelector } from '../../app/store';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const navItems = [
	{ label: 'Tổng quan', icon: <DashboardOutlinedIcon />, path: ROUTES.DASHBOARD, end: true, pageKey: 'dashboard' },
	{ label: 'Tên miền', icon: <LanguageOutlinedIcon />, path: ROUTES.DOMAINS, end: false, pageKey: 'domains' },
	{ label: 'Yêu cầu & Nhóm', icon: <AssignmentOutlinedIcon />, path: ROUTES.REQUESTS, end: false, pageKey: 'requests' },
	{ label: 'Người dùng', icon: <PeopleOutlinedIcon />, path: ROUTES.USERS, end: false, pageKey: 'users' },
];

const DockBtn = ({ label, icon, path, end }: { label: string; icon: React.ReactNode; path: string; end: boolean }) => (
	<Tooltip title={label} placement="top" arrow>
		<IconButton
			component={NavLink}
			to={path}
			end={end}
			sx={{
				width: 44,
				height: 44,
				borderRadius: 2,
				color: 'text.disabled',
				transition: 'all 0.15s',
				'&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
				'&.active': {
					bgcolor: 'primary.main',
					color: 'primary.contrastText',
					'& svg': { color: 'primary.contrastText' },
					'&:hover': { bgcolor: 'primary.dark' },
				},
				'& svg': { fontSize: 22 },
			}}
		>
			{icon}
		</IconButton>
	</Tooltip>
);

export default function Sidebar() {
	const [collapsed, setCollapsed] = useState(false);
	const allowedPages = useAppSelector((state) => state.auth.allowedPages);

	// null = admin (all pages); string[] = specific pages; undefined = blocked by MainLayout
	const canView = (pageKey: string) => allowedPages === null || (Array.isArray(allowedPages) && allowedPages.includes(pageKey));
	const visibleItems = navItems.filter((item) => canView(item.pageKey));

	return (
		<Box component="nav" sx={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1200 }}>
			{/* Collapsed pill — show when collapsed */}
			{collapsed && (
				<Box sx={{ display: 'flex', justifyContent: 'center' }}>
					<Tooltip title="Mở menu" placement="top" arrow>
						<Box
							onClick={() => setCollapsed(false)}
							sx={{
								display: 'flex', alignItems: 'center', justifyContent: 'center',
								width: 42, height: 26, borderRadius: 3,
								bgcolor: 'background.paper',
								boxShadow: '0 2px 12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
								cursor: 'pointer',
								'&:hover': { bgcolor: 'action.hover' },
							}}
						>
							<ExpandLessIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
						</Box>
					</Tooltip>
				</Box>
			)}

			{/* Main dock */}
			{!collapsed && (
				<Box sx={{
					display: 'flex', alignItems: 'center', gap: 0.5,
					px: 2, py: 1,
					bgcolor: 'background.paper',
					borderRadius: 4,
					boxShadow: '0 4px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
					backdropFilter: 'blur(12px)',
				}}>
					{/* Collapse button */}
					<Tooltip title="Thu gọn" placement="top" arrow>
						<IconButton
							onClick={() => setCollapsed(true)}
							size="small"
							sx={{ width: 32, height: 32, borderRadius: 2, color: 'text.disabled', '&:hover': { bgcolor: 'action.hover' } }}
						>
							<ExpandMoreIcon sx={{ fontSize: 18 }} />
						</IconButton>
					</Tooltip>

					<Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

					{visibleItems.map((item) => (
						<DockBtn key={item.path} {...item} />
					))}


				</Box>
			)}
		</Box>
	);
}
