import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import PublicIcon from '@mui/icons-material/Public';
import GroupIcon from '@mui/icons-material/Group';
import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import { useState, useEffect } from 'react';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import { domainService } from '../domains/domainService';
import { userService } from '../users/userService';
import { keywordGroupService } from '../keywords/keywordGroupService';
import { ga4Service } from '../keywords/ga4Service';
import type { Ga4OverviewData } from '../keywords/ga4Types';
import type { Domain } from '../../types/domain.types';
import { useToastify } from '../../components/Toastify';
import { useAppSelector } from '../../app/store';

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
				borderRadius: 4,
				bgcolor: '#fff',
				display: 'flex',
				flexDirection: 'column',
				gap: 2,
				minHeight: 150,
				height: '100%',
				position: 'relative',
				overflow: 'hidden',
				boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
				border: '1px solid',
				borderColor: 'divider',
				transition: 'all 0.3s ease-in-out',
				'&:hover': {
					transform: 'translateY(-6px)',
					boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
					borderColor: 'transparent',
				}
			}}
		>
			{/* Decorative background circle */}
			<Box
				sx={{
					position: 'absolute',
					top: -30,
					right: -30,
					width: 130,
					height: 130,
					borderRadius: '50%',
					background: `linear-gradient(135deg, ${bgColor} 0%, rgba(255,255,255,0) 100%)`,
					opacity: 0.7,
					zIndex: 0,
					transition: 'transform 0.4s ease',
					'.MuiPaper-root:hover &': {
						transform: 'scale(1.2)',
					}
				}}
			/>

			<Box
				sx={{
					width: 52,
					height: 52,
					borderRadius: '14px',
					bgcolor: iconBgColor,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 1,
				}}
			>
				{icon}
			</Box>
			<Box sx={{ zIndex: 1, mt: 1 }}>
				<Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 0.5, fontWeight: 600, letterSpacing: 0.5 }}>
					{title}
				</Typography>
				<Typography sx={{ fontSize: '2.2rem', fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
					{value}
				</Typography>
			</Box>
		</Paper>
	);
}

export default function DashboardPage() {
	const { showToast } = useToastify();
	const user = useAppSelector(state => state.auth.user);
	const isAdmin = user?.role === 'ADMIN';

	const [stats, setStats] = useState({
		domains: 0,
		activeUsers: 0,
		deployedKeywords: 0,
		pendingKeywords: 0,
	});

	const [domains, setDomains] = useState<Domain[]>([]);
	const [selectedDomainId, setSelectedDomainId] = useState<string>('');
	const [selectedDays, setSelectedDays] = useState<number>(7);
	const [ga4Data, setGa4Data] = useState<Ga4OverviewData | null>(null);
	const [loadingGa4, setLoadingGa4] = useState<boolean>(false);

	useEffect(() => {
		const fetchDashboardStats = async () => {
			const [domainsResult, statsResult, usersResult] = await Promise.allSettled([
				domainService.getAll(),
				keywordGroupService.getDashboardStatsByCurrentUser(),
				isAdmin ? userService.getAll(1, 100) : Promise.resolve({ items: [] })
			]);

			let domainsTotal = 0;
			let activeUsersCount = 0;
			let deployedTotal = 0;
			let pendingTotal = 0;

			if (domainsResult.status === 'fulfilled') {
				const domainsRes = domainsResult.value;
				if (domainsRes.items && domainsRes.items.length > 0) {
					setDomains(domainsRes.items);
					setSelectedDomainId(domainsRes.items[0]._id);
				}
			} else {
				const err = domainsResult.reason;
				showToast(`Lỗi tải Domain: ${err?.response?.data?.message || err?.message || 'Không xác định'}`, 'danger');
			}

			if (statsResult.status === 'fulfilled') {
				const statsRes = statsResult.value;
				domainsTotal = statsRes?.domainTotal ?? 0;
				deployedTotal = statsRes?.group?.deployed ?? 0;
				pendingTotal = statsRes?.group?.pendingApproval ?? 0;
			} else {
				const err = statsResult.reason;
				showToast(`Lỗi thống kê: ${err?.response?.data?.message || err?.message || 'Không xác định'}`, 'danger');
			}

			if (isAdmin) {
				if (usersResult.status === 'fulfilled') {
					const usersRes = usersResult.value;
					activeUsersCount = usersRes.items?.filter(u => u.status === 'active').length ?? 0;
				} else {
					const err = usersResult.reason;
					showToast(`Lỗi tải User: ${err?.response?.data?.message || err?.message || 'Không xác định'}`, 'danger');
				}
			}

			setStats({
				domains: domainsTotal,
				activeUsers: activeUsersCount,
				deployedKeywords: deployedTotal,
				pendingKeywords: pendingTotal,
			});
		};

		fetchDashboardStats();
	}, [isAdmin, showToast]);

	useEffect(() => {
		if (!selectedDomainId) return;

		let isMounted = true;
		const fetchGa4 = async () => {
			setLoadingGa4(true);
			try {
				const data = await ga4Service.getOverview(selectedDomainId, selectedDays);
				if (isMounted) setGa4Data(data);
			} catch (err: unknown) {
				if (isMounted) {
					setGa4Data(null);
					const errObj = err as { response?: { data?: { message?: string } }; message?: string };
					const errorMsg = errObj?.response?.data?.message || errObj?.message;
					showToast(`Lỗi tải dữ liệu GA4: ${errorMsg}`, 'warning');
				}
			} finally {
				if (isMounted) setLoadingGa4(false);
			}
		};

		fetchGa4();

		return () => { isMounted = false; };
	}, [selectedDomainId, selectedDays, showToast]);

	const today = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

	return (
		<Box sx={{ maxWidth: 1400, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>

			{/* Header Section */}
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Box>
					<Typography variant="h4" color="text.primary" gutterBottom sx={{ letterSpacing: '-0.5px', fontWeight: 800 }}>
						Xin chào, {user?.name || 'Admin'}! 👋
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
						Hôm nay là {today}. Dưới đây là tổng quan hiệu suất của bạn.
					</Typography>
				</Box>
			</Box>

			{/* Top Section: Stats & Chart */}
			<Box sx={{
				display: 'grid',
				gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
				gap: 4,
			}}>
				{/* Stats Grid (50%) */}
				<Box sx={{
					display: 'grid',
					gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
					gap: 3,
					width: '100%',
				}}>
					<StatCard
						title="DOMAIN QUẢN LÝ"
						value={stats.domains}
						icon={<PublicIcon sx={{ color: '#2563eb', fontSize: 28 }} />}
						bgColor="#bfdbfe" // soft blue
						iconBgColor="#dbeafe"
					/>
					{isAdmin && (
						<StatCard
							title="USER HOẠT ĐỘNG"
							value={stats.activeUsers}
							icon={<GroupIcon sx={{ color: '#059669', fontSize: 28 }} />}
							bgColor="#a7f3d0" // soft green
							iconBgColor="#d1fae5"
						/>
					)}
					<StatCard
						title="TỪ KHOÁ TRIỂN KHAI"
						value={stats.deployedKeywords}
						icon={<DraftsOutlinedIcon sx={{ color: '#d97706', fontSize: 28 }} />}
						bgColor="#fde68a" // soft amber
						iconBgColor="#fef3c7"
					/>
					<StatCard
						title="TỪ KHOÁ CHỜ DUYỆT"
						value={stats.pendingKeywords}
						icon={<PendingActionsIcon sx={{ color: '#e11d48', fontSize: 28 }} />}
						bgColor="#fecdd3" // soft rose
						iconBgColor="#ffe4e6"
					/>
				</Box>

				{/* Chart (50%) */}
				<Paper elevation={0} sx={{
					borderRadius: 4,
					p: 4,
					display: 'flex',
					flexDirection: 'column',
					minHeight: 340,
					boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
					border: '1px solid',
					borderColor: 'divider',
				}}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
						<Box>
							<Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: 'text.primary', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
								<AssessmentOutlinedIcon color="primary" />
								Lượt truy cập {selectedDays} ngày qua
							</Typography>
							<Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 2 }}>
								Biểu đồ thống kê lượng views từ GA4
							</Typography>
							<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
								<FormControl size="small">
									<Select
										value={selectedDomainId}
										onChange={(e) => setSelectedDomainId(e.target.value)}
										displayEmpty
										sx={{ fontSize: '0.85rem', minWidth: 160, borderRadius: 2, bgcolor: '#f8fafc' }}
									>
										<MenuItem value="" disabled>Chọn Domain</MenuItem>
										{domains.map(d => <MenuItem key={d._id} value={d._id}>{d.domain}</MenuItem>)}
									</Select>
								</FormControl>
								<FormControl size="small">
									<Select
										value={selectedDays}
										onChange={(e) => setSelectedDays(Number(e.target.value))}
										sx={{ fontSize: '0.85rem', minWidth: 120, borderRadius: 2, bgcolor: '#f8fafc' }}
									>
										<MenuItem value={7}>7 ngày</MenuItem>
										<MenuItem value={28}>28 ngày</MenuItem>
										<MenuItem value={90}>90 ngày</MenuItem>
									</Select>
								</FormControl>
							</Box>
						</Box>
						{ga4Data && ga4Data.trend && ga4Data.trend.length > 0 && (
							<Box sx={{ textAlign: 'right', bgcolor: '#f0fdf4', p: 2, borderRadius: 3, border: '1px solid #bbf7d0' }}>
								<Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: '#166534', lineHeight: 1 }}>
									{new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(ga4Data.summary.screenPageViews)}
								</Typography>
								<Typography sx={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600, mt: 0.5 }}>
									Tổng lượt views
								</Typography>
							</Box>
						)}
					</Box>

					{/* Real Bar Chart */}
					<Box sx={{
						flex: 1,
						display: 'flex',
						alignItems: 'flex-end',
						gap: 1.5,
						height: 220,
						pt: 2,
						overflowX: 'hidden',
						position: 'relative'
					}}>
						{/* Background grid lines */}
						<Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 0, pointerEvents: 'none' }}>
							{[...Array(4)].map((_, i) => (
								<Box key={i} sx={{ borderBottom: '1px dashed', borderColor: 'divider', width: '100%' }} />
							))}
						</Box>

						{loadingGa4 ? (
							<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
								<CircularProgress size={30} />
							</Box>
						) : (!ga4Data || !ga4Data.trend || ga4Data.trend.length === 0) ? (
							<Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, zIndex: 1 }}>
								<Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<AssessmentOutlinedIcon sx={{ fontSize: 32, color: '#94a3b8' }} />
								</Box>
								<Typography sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.95rem' }}>Chưa có dữ liệu truy cập</Typography>
							</Box>
						) : (
							(() => {
								let chartData = [];
								if (selectedDays === 90) {
									for (let i = 0; i < ga4Data.trend.length; i += 15) {
										const chunk = ga4Data.trend.slice(i, i + 15);
										const sumViews = chunk.reduce((acc, curr) => acc + curr.screenPageViews, 0);
										const sd = new Date(chunk[0].date);
										chartData.push({
											label: `${sd.getDate()}/${sd.getMonth() + 1}`,
											value: sumViews,
											id: i,
										});
									}
								} else if (selectedDays === 28) {
									for (let i = 0; i < ga4Data.trend.length; i += 7) {
										const chunk = ga4Data.trend.slice(i, i + 7);
										const sumViews = chunk.reduce((acc, curr) => acc + curr.screenPageViews, 0);
										const sd = new Date(chunk[0].date);
										chartData.push({
											label: `${sd.getDate()}/${sd.getMonth() + 1}`,
											value: sumViews,
											id: i,
										});
									}
								} else {
									chartData = ga4Data.trend.map((t, i) => {
										const d = new Date(t.date);
										return {
											label: `${d.getDate()}/${d.getMonth() + 1}`,
											value: t.screenPageViews,
											id: i,
										};
									});
								}

								const maxViews = Math.max(...chartData.map(c => c.value), 1);

								return chartData.map((item) => {
									const height = Math.max((item.value / maxViews) * 100, 2);
									const formatCompact = (val: number) => {
										if (val === 0) return '';
										return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(val);
									};

									return (
										<Box key={item.id} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, height: '100%', minWidth: 0, zIndex: 1 }}>
											<Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', position: 'relative' }}>
												<Typography sx={{
													fontSize: selectedDays === 28 ? '0.6rem' : '0.7rem',
													fontWeight: 700,
													color: '#475569',
													mb: 1,
													display: item.value > 0 ? 'block' : 'none',
													lineHeight: 1,
													textAlign: 'center',
													whiteSpace: 'nowrap'
												}}>
													{formatCompact(item.value)}
												</Typography>
												<Box
													sx={{
														width: '100%',
														maxWidth: (selectedDays === 90 || selectedDays === 28) ? 50 : 36,
														height: `${height}%`,
														background: 'linear-gradient(to top, #3b82f6 0%, #60a5fa 100%)',
														borderRadius: '6px 6px 3px 3px',
														transition: 'all 0.3s ease',
														boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
														'&:hover': {
															background: 'linear-gradient(to top, #2563eb 0%, #3b82f6 100%)',
															transform: 'scaleY(1.02)',
															boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
														},
														transformOrigin: 'bottom',
														cursor: 'pointer'
													}}
													title={`${item.label}: ${item.value} views`}
												/>
											</Box>
											<Typography sx={{
												fontSize: selectedDays === 7 ? '0.7rem' : '0.6rem',
												color: '#64748b',
												fontWeight: 600,
												display: 'block',
												whiteSpace: 'nowrap',
												mt: 1
											}}>
												{item.label}
											</Typography>
										</Box>
									);
								});
							})()
						)}
					</Box>
				</Paper>
			</Box>

		</Box>
	);
}
