import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../app/store';
import { logoutUser } from '../../features/auth/authSlice';
import { ROUTES } from '../../utils/constants';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationPanel from './NotificationPanel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import LogoutIcon from '@mui/icons-material/Logout';

interface HeaderProps {
	onMenuToggle: () => void;
}

const PAGE_META: Record<string, { title: string; breadcrumb: string[] }> = {
	'/': { title: 'Tổng quan', breadcrumb: ['Trang chủ', 'Tổng quan'] },
	'/articles': { title: 'Quản lý Bài viết', breadcrumb: ['Trang chủ', 'Bài viết'] },
	'/users': { title: 'Quản lý Người dùng', breadcrumb: ['Trang chủ', 'Người dùng'] },
	'/settings': { title: 'Cài đặt hệ thống', breadcrumb: ['Trang chủ', 'Cài đặt hệ thống'] },
	'/domains': { title: 'Quản lý Tên miền', breadcrumb: ['Trang chủ', 'Tên miền'] },
};

const BREADCRUMB_LINKS: Record<string, string> = {
	'Trang chủ': '/',
	'Tên miền': '/domains',
	'Người dùng': '/users',
	'Bài viết': '/articles',
	'Cài đặt hệ thống': '/settings',
};

export default function Header({ onMenuToggle }: HeaderProps) {
	const location = useLocation();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { user } = useAppSelector((state) => state.auth);

	const getPageMeta = (pathname: string) => {
		if (PAGE_META[pathname]) return PAGE_META[pathname];
		if (pathname.startsWith('/domains/') && pathname.endsWith('/keywords')) {
			return { title: 'Chi tiết trang web', breadcrumb: ['Trang chủ', 'Tên miền', 'Chi tiết trang web'] };
		}
		return { title: 'Hệ thống', breadcrumb: ['Trang chủ'] };
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

	const handleLogout = async () => {
		handleMenuClose();
		await dispatch(logoutUser());
		navigate(ROUTES.LOGIN);
	};

	return (
		<Box sx={{ top: 0, zIndex: 50, px: { xs: 2, md: 3 }, pt: 2, pb: 0 }}>
			{/* Gradient banner bar */}
			<Box
				sx={{
					height: 56,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'flex-end',
					px: 3,
					gap: 2,
					background: 'linear-gradient(135deg, #00b894 0%, #00cec9 50%, #0984e3 100%)',
					borderRadius: '16px',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				{/* Decorative circles */}
				<Box
					sx={{
						position: 'absolute',
						top: -20,
						left: -10,
						width: 80,
						height: 80,
						borderRadius: '50%',
						bgcolor: 'rgba(255,255,255,0.08)',
					}}
				/>
				<Box
					sx={{
						position: 'absolute',
						top: 10,
						left: 40,
						width: 50,
						height: 50,
						borderRadius: '50%',
						bgcolor: 'rgba(255,255,255,0.06)',
					}}
				/>

				{/* Mobile menu button */}
				<IconButton
					onClick={onMenuToggle}
					size="small"
					sx={{
						display: 'none',
						color: 'rgba(255,255,255,0.85)',
						position: 'absolute',
						left: 12,
					}}
				>
					<MenuIcon />
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
						'&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
					}}
				>
					<Avatar
						sx={{
							width: 34,
							height: 34,
							fontSize: '0.85rem',
							fontWeight: 700,
							bgcolor: 'rgba(255,255,255,0.2)',
							border: '2px solid rgba(255,255,255,0.4)',
						}}
					>
						{user?.name?.charAt(0) || 'U'}
					</Avatar>
					<Box sx={{ display: { xs: 'none', sm: 'block' } }}>
						<Typography sx={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.2 }}>
							{user?.name}
						</Typography>
						<Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.68rem', textTransform: 'capitalize' }}>
							{user?.role}
						</Typography>
					</Box>
					<ExpandMoreIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', display: { xs: 'none', sm: 'block' }, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
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
					<MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
						<LogoutIcon fontSize="small" sx={{ mr: 1.5, color: 'inherit' }} />
						Đăng xuất
					</MenuItem>
				</Menu>
			</Box>

			{/* Breadcrumb bar (separate) */}
			<Box sx={{ px: 1, pt: 1.5, pb: 0.5 }}>
				<Breadcrumbs sx={{ fontSize: '0.82rem' }}>
					{meta.breadcrumb.map((crumb, i) => {
						const isLast = i === meta.breadcrumb.length - 1;
						const linkPath = BREADCRUMB_LINKS[crumb];

						if (!isLast && linkPath) {
							return (
								<Link
									key={crumb}
									to={linkPath}
									style={{
										fontSize: '0.82rem',
										color: '#94a3b8',
										textDecoration: 'none',
									}}
								>
									{crumb}
								</Link>
							);
						}

						return (
							<Typography
								key={crumb}
								sx={{
									fontSize: '0.82rem',
									color: isLast ? 'text.primary' : 'text.disabled',
									fontWeight: isLast ? 600 : 400,
								}}
							>
								{crumb}
							</Typography>
						);
					})}
				</Breadcrumbs>
			</Box>
		</Box>
	);
}
