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
		<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
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
							width: 44,
							height: 44,
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
						<Typography sx={{ fontSize: '12px', fontWeight: 500, color: 'text.secondary', mb: 0.25 }}>
							{card.label}
						</Typography>
						{loading ? (
							<Skeleton width={60} height={28} />
						) : (
							<Typography sx={{ fontSize: '20px', fontWeight: 700, color: card.color, lineHeight: 1.2 }}>
								{card.value}
							</Typography>
						)}
					</Box>
				</Card>
			))}
		</Box>
	);
}
