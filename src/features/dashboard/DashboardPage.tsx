import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import PublicIcon from '@mui/icons-material/Public';
import GroupIcon from '@mui/icons-material/Group';
import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
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

			// Handle Domains (for GA4 Dropdown)
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

			// Handle Stats (New API)
			if (statsResult.status === 'fulfilled') {
				const statsRes = statsResult.value;
				domainsTotal = statsRes?.domainTotal ?? 0;
				deployedTotal = statsRes?.group?.deployed ?? 0;
				pendingTotal = statsRes?.group?.pendingApproval ?? 0;
			} else {
				const err = statsResult.reason;
				showToast(`Lỗi thống kê: ${err?.response?.data?.message || err?.message || 'Không xác định'}`, 'danger');
			}

			// Handle Users
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
					{isAdmin && (
						<StatCard
							title="User đang hoạt động"
							value={stats.activeUsers}
							icon={<GroupIcon sx={{ color: '#059669', fontSize: 26 }} />}
							bgColor="#d1fae5"
							iconBgColor="rgba(5, 150, 105, 0.15)"
						/>
					)}
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

				{/* Chart (50%) */}
				<Paper variant="outlined" sx={{ borderRadius: 3, p: 3, display: 'flex', flexDirection: 'column' }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
						<Box>
							<Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'text.primary' }}>
								Lượt truy cập {selectedDays} ngày qua
							</Typography>
							<Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
								<FormControl size="small">
									<Select
										value={selectedDomainId}
										onChange={(e) => setSelectedDomainId(e.target.value)}
										displayEmpty
										sx={{ fontSize: '0.8rem', minWidth: 140, height: 32 }}
									>
										<MenuItem value="" disabled>Chọn Domain</MenuItem>
										{domains.map(d => <MenuItem key={d._id} value={d._id}>{d.domain}</MenuItem>)}
									</Select>
								</FormControl>
								<FormControl size="small">
									<Select
										value={selectedDays}
										onChange={(e) => setSelectedDays(Number(e.target.value))}
										sx={{ fontSize: '0.8rem', height: 32 }}
									>
										<MenuItem value={7}>7 ngày</MenuItem>
										<MenuItem value={28}>28 ngày</MenuItem>
										<MenuItem value={90}>90 ngày</MenuItem>
									</Select>
								</FormControl>
							</Box>
						</Box>
						<Box sx={{ textAlign: 'right' }}>
							<Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>
								{ga4Data ? new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(ga4Data.summary.screenPageViews) : '0'}
							</Typography>
							<Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
								Views
							</Typography>
						</Box>
					</Box>

					{/* Real Bar Chart */}
					<Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 1, height: 180, pt: 2, overflowX: 'hidden' }}>
						{loadingGa4 ? (
							<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<CircularProgress size={30} />
							</Box>
						) : (!ga4Data || !ga4Data.trend || ga4Data.trend.length === 0) ? (
							<Typography sx={{ color: 'text.secondary', m: 'auto' }}>Không có dữ liệu</Typography>
						) : (
							(() => {
								let chartData = [];
								if (selectedDays === 90) {
									// Nhóm 90 ngày thành các khoảng 15 ngày (nửa tháng)
									for (let i = 0; i < ga4Data.trend.length; i += 15) {
										const chunk = ga4Data.trend.slice(i, i + 15);
										const sumViews = chunk.reduce((acc, curr) => acc + curr.screenPageViews, 0);
										const sd = new Date(chunk[0].date);
										const ed = new Date(chunk[chunk.length - 1].date);
										chartData.push({
											label: `${sd.getDate()}/${sd.getMonth() + 1}-${ed.getDate()}/${ed.getMonth() + 1}`,
											value: sumViews,
											id: i,
										});
									}
								} else if (selectedDays === 28) {
									// Nhóm 28 ngày thành các khoảng 7 ngày (1 tuần)
									for (let i = 0; i < ga4Data.trend.length; i += 7) {
										const chunk = ga4Data.trend.slice(i, i + 7);
										const sumViews = chunk.reduce((acc, curr) => acc + curr.screenPageViews, 0);
										const sd = new Date(chunk[0].date);
										const ed = new Date(chunk[chunk.length - 1].date);
										chartData.push({
											label: `${sd.getDate()}/${sd.getMonth() + 1}-${ed.getDate()}/${ed.getMonth() + 1}`,
											value: sumViews,
											id: i,
										});
									}
								} else {
									// 7 ngày: giữ nguyên
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
									const height = Math.max((item.value / maxViews) * 100, 2); // min height 2%
									const formatCompact = (val: number) => {
										if (val === 0) return '';
										return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(val);
									};

									return (
										<Box key={item.id} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, height: '100%', minWidth: 0 }}>
											<Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', position: 'relative' }}>
												<Typography sx={{
													fontSize: selectedDays === 28 ? '0.55rem' : '0.65rem',
													fontWeight: 700,
													color: '#64748b',
													mb: 0.5,
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
														maxWidth: (selectedDays === 90 || selectedDays === 28) ? 60 : 40,
														height: `${height}%`,
														bgcolor: '#eff6ff',
														borderRadius: '4px 4px 2px 2px',
														transition: 'all 0.2s',
														'&:hover': { bgcolor: '#2563eb' },
														cursor: 'pointer'
													}}
													title={`${item.label}: ${item.value} views`}
												/>
											</Box>
											<Typography sx={{
												fontSize: selectedDays === 7 ? '0.65rem' : '0.55rem',
												color: 'text.disabled',
												fontWeight: 600,
												display: 'block',
												whiteSpace: 'nowrap',
												mt: 0.5
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
