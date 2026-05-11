import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import MouseIcon from '@mui/icons-material/Mouse';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PercentIcon from '@mui/icons-material/Percent';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import type { GscOverviewSummary } from '../gscTypes';

interface GscOverviewCardsProps {
	summary: GscOverviewSummary | null;
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

export function GscOverviewCards({ summary, loading }: GscOverviewCardsProps) {
	const cards: MetricCard[] = [
		{
			label: 'Clicks',
			value: summary ? formatNumber(summary.clicks) : '—',
			icon: <MouseIcon />,
			color: '#1e88e5',
			bgColor: '#e3f2fd',
		},
		{
			label: 'Impressions',
			value: summary ? formatNumber(summary.impressions) : '—',
			icon: <VisibilityIcon />,
			color: '#7b1fa2',
			bgColor: '#f3e5f5',
		},
		{
			label: 'CTR',
			value: summary ? `${(summary.ctr * 100).toFixed(2)}%` : '—',
			icon: <PercentIcon />,
			color: '#00897b',
			bgColor: '#e0f2f1',
		},
		{
			label: 'Position',
			value: summary ? summary.position.toFixed(1) : '—',
			icon: <LeaderboardIcon />,
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
