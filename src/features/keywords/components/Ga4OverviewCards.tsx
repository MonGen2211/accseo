import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import GroupIcon from '@mui/icons-material/Group';
import BarChartIcon from '@mui/icons-material/BarChart';
import PageviewIcon from '@mui/icons-material/Pageview';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { Ga4OverviewSummary } from '../ga4Types';

interface Ga4OverviewCardsProps {
	summary: Ga4OverviewSummary | null;
	loading: boolean;
}

interface MetricCard {
	label: string;
	value: string | number;
	icon: React.ReactNode;
	color: string;
	bgColor: string;
}

function formatNumber(num: number): string {
	if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
	if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
	return num.toLocaleString();
}

export function Ga4OverviewCards({ summary, loading }: Ga4OverviewCardsProps) {
	const cards: MetricCard[] = [
		{
			label: 'Sessions',
			value: summary ? formatNumber(summary.sessions) : '—',
			icon: <BarChartIcon />,
			color: '#1e88e5',
			bgColor: '#e3f2fd',
		},
		{
			label: 'Users',
			value: summary ? formatNumber(summary.activeUsers) : '—',
			icon: <GroupIcon />,
			color: '#43a047',
			bgColor: '#e8f5e9',
		},
		{
			label: 'Pageviews',
			value: summary ? formatNumber(summary.screenPageViews) : '—',
			icon: <PageviewIcon />,
			color: '#7b1fa2',
			bgColor: '#f3e5f5',
		},
		{
			label: 'Bounce Rate',
			value: summary
				? summary.sessions > 0
					? `${(((summary.sessions - summary.conversions) / summary.sessions) * 100).toFixed(1)}%`
					: '0%'
				: '—',
			icon: <TrendingDownIcon />,
			color: '#e53935',
			bgColor: '#ffebee',
		},
		{
			label: 'Tổng trang',
			value: summary ? formatNumber(summary.totalPages) : '—',
			icon: <AccessTimeIcon />,
			color: '#ef6c00',
			bgColor: '#fff3e0',
		},
	];

	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 2 }}>
			{cards.map((card) => (
				<Card
					key={card.label}
					variant="outlined"
					sx={{
						p: 2,
						borderRadius: 2.5,
						display: 'flex',
						alignItems: 'center',
						gap: 1.5,
						transition: 'box-shadow 0.2s',
						'&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
					}}
				>
					<Box
						sx={{
							width: 40,
							height: 40,
							borderRadius: 2,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: card.bgColor,
							color: card.color,
							flexShrink: 0,
						}}
					>
						{card.icon}
					</Box>
					<Box sx={{ minWidth: 0 }}>
						<Typography sx={{ fontSize: '11px', fontWeight: 500, color: 'text.secondary', mb: 0.25 }}>
							{card.label}
						</Typography>
						{loading ? (
							<Skeleton width={50} height={24} />
						) : (
							<Typography sx={{ fontSize: '18px', fontWeight: 700, color: card.color, lineHeight: 1.2 }}>
								{card.value}
							</Typography>
						)}
					</Box>
				</Card>
			))}
		</Box>
	);
}
