import { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../app/store';
import { logoutUser } from '../../features/auth/authSlice';
import { ROUTES } from '../../utils/constants';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Divider from '@mui/material/Divider';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationPanel from './NotificationPanel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import { ThemeContext } from '../../contexts/ThemeContext';
interface HeaderProps {
	onMenuToggle: () => void;
}

const PAGE_META: Record<string, { title: string; breadcrumb: string[] }> = {
	'/': { title: 'Tổng quan', breadcrumb: ['Trang chủ', 'Tổng quan'] },
	'/articles': { title: 'Quản lý Bài viết', breadcrumb: ['Trang chủ', 'Bài viết'] },
	'/users': { title: 'Quản lý Người dùng', breadcrumb: ['Trang chủ', 'Người dùng'] },
	'/settings': { title: 'Set up', breadcrumb: ['Trang chủ', 'Set up'] },
	'/domains': { title: 'Quản lý Tên miền', breadcrumb: ['Trang chủ', 'Tên miền'] },
	'/profile': { title: 'Hồ sơ cá nhân', breadcrumb: ['Trang chủ', 'Hồ sơ cá nhân'] },
	'/requests': { title: 'Quản lý Yêu cầu', breadcrumb: ['Trang chủ', 'Yêu cầu'] },
	'/requests/create': { title: 'Tạo yêu cầu', breadcrumb: ['Trang chủ', 'Yêu cầu', 'Tạo mới'] },
};

const BREADCRUMB_LINKS: Record<string, string> = {
	'Trang chủ': '/',
	'Tên miền': '/domains',
	'Người dùng': '/users',
	'Bài viết': '/articles',
	'Set up': '/settings',
	'Yêu cầu': '/requests',
};

export default function Header({ onMenuToggle }: HeaderProps) {
	const location = useLocation();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { user } = useAppSelector((state) => state.auth);
	const { mode, toggleColorMode } = useContext(ThemeContext);

	const getPageMeta = (pathname: string) => {
		if (PAGE_META[pathname]) return PAGE_META[pathname];
		if (pathname.startsWith('/domains/') && pathname.endsWith('/keywords')) {
			return { title: 'Chi tiết trang web', breadcrumb: ['Trang chủ', 'Tên miền', 'Chi tiết trang web'] };
		}
		if (pathname.startsWith('/requests/') && pathname !== '/requests/create') {
			return { title: 'Chi tiết yêu cầu', breadcrumb: ['Trang chủ', 'Yêu cầu', 'Chi tiết'] };
		}
		return { title: 'Hệ thống', breadcrumb: ['Trang chủ', 'Chi tiết'] };
	};

	const meta = getPageMeta(location.pathname);

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const isAdmin = user?.roles?.includes('ADMIN');

	const handleLogout = async () => {
		handleMenuClose();
		await dispatch(logoutUser());
		navigate(ROUTES.LOGIN);
	};

	const handleNavigate = (path: string) => {
		handleMenuClose();
		navigate(path);
	};

	const isDashboard = ['/', '/domains', '/requests', '/users'].includes(location.pathname);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
		return sessionStorage.getItem('sidebar_collapsed') === 'true';
	});

	useEffect(() => {
		const handleToggle = (e: Event) => {
			const detail = (e as CustomEvent).detail;
			setSidebarCollapsed(detail);
		};
		window.addEventListener('sidebar_toggle', handleToggle);
		return () => {
			window.removeEventListener('sidebar_toggle', handleToggle);
		};
	}, []);

	// Nhân với 0.8 vì DashboardPage sử dụng zoom: 0.8
	const rawSidebarWidth = sidebarCollapsed ? 76 : 260;
	const sidebarWidth = isDashboard ? rawSidebarWidth * 0.8 : rawSidebarWidth;

	// Căn lề padding bằng đúng padding của DashboardPage (32px) nhân 0.8 = 25.6px
	const plDashboard = 32 * 0.8;
	const prDashboard = 32 * 0.8;

	return (
		<Box 
			sx={{ 
				position: 'sticky',
				top: 0, 
				zIndex: 50, 
				pl: isDashboard ? `${plDashboard}px` : { xs: 2, md: 3 },
				pr: isDashboard ? `${prDashboard}px` : { xs: 2, md: 3 },
				pt: 2, 
				pb: 1.5,
				ml: isDashboard ? { xs: 0, md: `${sidebarWidth}px` } : 0,
				transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
				bgcolor: 'background.default',
			}}
		>
			{/* Gradient banner bar */}
			<Box
				sx={{
					height: 56,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'flex-end',
					px: 3,
					gap: 2,
					bgcolor: 'background.paper',
					borderRadius: '16px',
					border: '1px solid',
					borderColor: 'divider',
					boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
				}}
			>
				{/* Breadcrumbs */}
				<Box sx={{ mr: 'auto' }}>
					<Breadcrumbs sx={{ fontSize: '0.85rem' }}>
						{meta.breadcrumb.map((crumb, i) => {
							const isLast = i === meta.breadcrumb.length - 1;
							const linkPath = BREADCRUMB_LINKS[crumb];

							if (!isLast && linkPath) {
								return (
									<Link
										key={crumb}
										to={linkPath}
										style={{
											textDecoration: 'none',
											color: 'inherit',
										}}
									>
										<Typography
											component="span"
											sx={{
												fontSize: '0.85rem',
												color: 'text.secondary',
												transition: 'color 0.2s',
												'&:hover': {
													color: 'primary.main',
												}
											}}
										>
											{crumb}
										</Typography>
									</Link>
								);
							}

							return (
								<Typography
									key={crumb}
									sx={{
										fontSize: '0.85rem',
										color: isLast ? 'text.primary' : 'text.secondary',
										fontWeight: isLast ? 600 : 400,
									}}
								>
									{crumb}
								</Typography>
							);
						})}
					</Breadcrumbs>
				</Box>

				{/* Mobile menu button */}
				<IconButton
					onClick={onMenuToggle}
					size="small"
					sx={{
						display: 'none',
						color: 'text.primary',
						position: 'absolute',
						left: 12,
					}}
				>
					<MenuIcon />
				</IconButton>

				{/* Theme Toggle */}
				<IconButton onClick={toggleColorMode} size="small" sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}>
					{mode === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
				</IconButton>

				{/* Right side: notification + user */}
				<NotificationPanel />

				<Box
					onClick={handleMenuOpen}
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 1,
						cursor: 'pointer',
						px: 1,
						py: 0.5,
						borderRadius: '10px',
						'&:hover': { bgcolor: 'action.hover' },
					}}
				>
					<Avatar
						src={user?.imgAvatar || user?.avatar}
						sx={{
							width: 34,
							height: 34,
							fontSize: '0.85rem',
							fontWeight: 700,
							bgcolor: 'primary.main',
						}}
					>
						{user?.name?.charAt(0) || 'U'}
					</Avatar>
					<Box sx={{ display: { xs: 'none', sm: 'block' } }}>
						<Typography sx={{ color: 'text.primary', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.2 }}>
							{user?.name}
						</Typography>
						<Typography sx={{ color: 'text.secondary', fontSize: '0.68rem', textTransform: 'capitalize' }}>
							{user?.roles?.join(', ')}
						</Typography>
					</Box>
					<ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary', display: { xs: 'none', sm: 'block' }, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
				</Box>

				<Menu
					anchorEl={anchorEl}
					open={open}
					onClose={handleMenuClose}
					slotProps={{
						paper: {
							elevation: 0,
							sx: {
								overflow: 'visible',
								filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
								mt: 1.5,
								minWidth: 160,
								'& .MuiAvatar-root': {
									width: 32,
									height: 32,
									ml: -0.5,
									mr: 1,
								},
								'&:before': {
									content: '""',
									display: 'block',
									position: 'absolute',
									top: 0,
									right: 14,
									width: 10,
									height: 10,
									bgcolor: 'background.paper',
									transform: 'translateY(-50%) rotate(45deg)',
									zIndex: 0,
								},
							},
						}
					}}
					transformOrigin={{ horizontal: 'right', vertical: 'top' }}
					anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
				>
					{/* Profile header */}
					<Box sx={{ px: 2, py: 1.5, pointerEvents: 'none' }}>
						<Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.primary' }}>
							{user?.name}
						</Typography>
						<Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textTransform: 'capitalize' }}>
							{user?.roles?.join(', ')}
						</Typography>
					</Box>
					<Divider />

					<MenuItem onClick={() => handleNavigate(ROUTES.PROFILE)} sx={{ gap: 1.5, py: 1 }}>
						<PersonOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
						Profile
					</MenuItem>

					{isAdmin && (
						<MenuItem onClick={() => handleNavigate(ROUTES.SETTINGS)} sx={{ gap: 1.5, py: 1 }}>
							<SettingsOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
							Set up
						</MenuItem>
					)}

					{isAdmin && (
						<MenuItem onClick={() => handleNavigate(ROUTES.USERS)} sx={{ gap: 1.5, py: 1 }}>
							<PersonAddOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
							Tạo tài khoản user
						</MenuItem>
					)}

					<Divider />

					<MenuItem onClick={handleLogout} sx={{ color: 'error.main', gap: 1.5, py: 1 }}>
						<LogoutIcon fontSize="small" sx={{ color: 'inherit' }} />
						Đăng xuất
					</MenuItem>
				</Menu>
			</Box>


		</Box>
	);
}
