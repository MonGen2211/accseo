import Box from '@mui/material/Box';
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
		<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 0, px: 3, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
			{cards.map((card, i) => (
				<Box key={card.label} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.6, px: 2, borderRight: i < cards.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
					<Typography sx={{ fontSize: 11, color: 'text.secondary', whiteSpace: 'nowrap' }}>
						{card.label}
					</Typography>
					{loading ? (
						<Skeleton width={36} height={18} />
					) : (
						<Typography sx={{ fontSize: 16, fontWeight: 800, color: 'primary.main', whiteSpace: 'nowrap' }}>
							{card.value}
						</Typography>
					)}
				</Box>
			))}
		</Box>
	);
}
