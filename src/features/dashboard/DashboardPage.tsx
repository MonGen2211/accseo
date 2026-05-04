import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import PublicIcon from '@mui/icons-material/Public';
import GroupIcon from '@mui/icons-material/Group';
import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { useState, useEffect } from 'react';
import { domainService } from '../domains/domainService';
import { userService } from '../users/userService';
import { keywordGroupService } from '../keywords/keywordGroupService';
import { useToastify } from '../../components/Toastify';

interface StatCardProps {
	title: string;
	value: number;
	icon: React.ReactNode;
	bgColor: string;
	iconBgColor: string;
}

function StatCard({ title, value, icon, bgColor, iconBgColor }: StatCardProps) {
	return (
		<Paper
			elevation={0}
			sx={{
				p: 3,
				borderRadius: 3,
				bgcolor: bgColor,
				display: 'flex',
				flexDirection: 'column',
				gap: 2,
				minHeight: 140,
				height: '100%',
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			<Box
				sx={{
					width: 48,
					height: 48,
					borderRadius: 2,
					bgcolor: iconBgColor,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{icon}
			</Box>
			<Box>
				<Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', mb: 0.5, fontWeight: 500 }}>
					{title}
				</Typography>
				<Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
					{value}
				</Typography>
			</Box>
		</Paper>
	);
}

export default function DashboardPage() {
	const { showToast } = useToastify();

	const [stats, setStats] = useState({
		domains: 0,
		activeUsers: 0,
		deployedKeywords: 0,
		pendingKeywords: 0,
	});

	useEffect(() => {
		const fetchDashboardStats = async () => {
			let domainsTotal = 0;
			let activeUsersCount = 0;
			let deployedTotal = 0;
			let pendingTotal = 0;

			// 1. Fetch Domains
			try {
				const domainsRes = await domainService.getAll();
				domainsTotal = domainsRes.total ?? domainsRes.items?.length ?? 0;
			} catch (err: unknown) {
				const errorMsg = (err as any)?.response?.data?.message || (err as Error)?.message;
				showToast(`Lỗi tải Domain: ${errorMsg || 'Không xác định'}`, 'danger');
			}

			// 2. Fetch Users
			try {
				const usersRes = await userService.getAll(1, 100);
				activeUsersCount = usersRes.items?.filter(u => u.status === 'active').length ?? 0;
			} catch (err: unknown) {
				const errorMsg = (err as any)?.response?.data?.message || (err as Error)?.message;
				showToast(`Lỗi tải User: ${errorMsg || 'Không xác định'}`, 'danger');
			}

			// 3. Fetch Keywords
			try {
				const deployedRes = await keywordGroupService.getGroups('', 1, 1, '', 'desc', 'deployed');
				deployedTotal = deployedRes.total ?? 0;
				const pendingRes = await keywordGroupService.getGroups('', 1, 1, '', 'desc', 'pending_approval');
				pendingTotal = pendingRes.total ?? 0;
			} catch (err: unknown) {
				const errorMsg = (err as any)?.response?.data?.message || (err as Error)?.message || 'Không thể lấy thống kê từ khóa';
				showToast(`Lỗi từ khóa: ${errorMsg}`, 'danger');
			}

			// Cuối cùng luôn gắn giá trị (dù API thành công hay lỗi)
			setStats({
				domains: domainsTotal,
				activeUsers: activeUsersCount,
				deployedKeywords: deployedTotal,
				pendingKeywords: pendingTotal,
			});
		};

		fetchDashboardStats();
	}, []);

	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 3 }}>
			{/* Top Section: Stats & Chart */}
			<Box sx={{
				display: 'grid',
				gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
				gap: 3,
			}}>
				{/* Stats Grid (50%) */}
				<Box sx={{
					display: 'grid',
					gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
					gap: 3,
					width: '100%',
				}}>
					<StatCard
						title="Domain quản lý"
						value={stats.domains}
						icon={<PublicIcon sx={{ color: '#2563eb', fontSize: 26 }} />}
						bgColor="#dbeafe"
						iconBgColor="rgba(37, 99, 235, 0.15)"
					/>
					<StatCard
						title="User đang hoạt động"
						value={stats.activeUsers}
						icon={<GroupIcon sx={{ color: '#059669', fontSize: 26 }} />}
						bgColor="#d1fae5"
						iconBgColor="rgba(5, 150, 105, 0.15)"
					/>
					<StatCard
						title="Bộ từ khoá đã triển khai"
						value={stats.deployedKeywords}
						icon={<DraftsOutlinedIcon sx={{ color: '#d97706', fontSize: 26 }} />}
						bgColor="#fef3c7"
						iconBgColor="rgba(217, 119, 6, 0.15)"
					/>
					<StatCard
						title="Bộ từ khoá cần phê duyệt"
						value={stats.pendingKeywords}
						icon={<PendingActionsIcon sx={{ color: '#7c3aed', fontSize: 26 }} />}
						bgColor="#ede9fe"
						iconBgColor="rgba(124, 58, 237, 0.15)"
					/>
				</Box>

				{/* Chart mock (50%) */}
				<Paper variant="outlined" sx={{ borderRadius: 3, p: 3, display: 'flex', flexDirection: 'column' }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
						<Box>
							<Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'text.primary' }}>
								Lượt truy cập 7 ngày qua
							</Typography>
							<Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.5 }}>
								+154% so với tuần trước
							</Typography>
						</Box>
						<Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>
							2.4M
						</Typography>
					</Box>

					{/* Mock Bar Chart */}
					<Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 180, pt: 2 }}>
						{[30, 45, 60, 40, 85, 100, 70].map((height, i) => (
							<Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, height: '100%' }}>
								<Box sx={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
									<Box
										sx={{
											width: '100%',
											maxWidth: 40,
											height: `${height}%`,
											bgcolor: i === 5 ? '#2563eb' : '#eff6ff',
											borderRadius: '6px 6px 4px 4px',
											transition: 'all 0.2s',
											'&:hover': { bgcolor: i === 5 ? '#1d4ed8' : '#dbeafe' },
											cursor: 'pointer'
										}}
									/>
								</Box>
								<Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 600 }}>
									{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}
								</Typography>
							</Box>
						))}
					</Box>
				</Paper>
			</Box>

		</Box>
	);
}
