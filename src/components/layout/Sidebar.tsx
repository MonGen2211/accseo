import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { useRole } from '../../hooks/useRole';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const navItems = [
	{ label: 'Tổng quan', icon: <DashboardOutlinedIcon />, path: ROUTES.DASHBOARD, end: true },
	{ label: 'Bài viết', icon: <ArticleOutlinedIcon />, path: ROUTES.ARTICLES, end: false },
	{ label: 'Tên miền', icon: <LanguageOutlinedIcon />, path: ROUTES.DOMAINS, end: false },
];

const adminItems = [
	{ label: 'Người dùng', icon: <PeopleOutlinedIcon />, path: ROUTES.USERS, end: false },
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
					color: '#fff',
					'& svg': { color: '#fff' },
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
	const canViewUsers = useRole(['ADMIN', 'MAR_SPECIALIST']);
	const canViewSettings = useRole(['ADMIN']);

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

					{navItems.map((item) => (
						<DockBtn key={item.path} {...item} />
					))}

					{canViewUsers && (
						<>
							<Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
							{adminItems.map((item) => (
								<DockBtn key={item.path} {...item} />
							))}
						</>
					)}

					{canViewSettings && (
						<>
							<Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
							<DockBtn label="Cài đặt" icon={<SettingsOutlinedIcon />} path={ROUTES.SETTINGS} end={false} />
						</>
					)}

				</Box>
			)}
		</Box>
	);
}
