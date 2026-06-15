import Box from '@mui/material/Box';
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
			color: '#00b894',
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
		<Box sx={{
			display: 'grid',
			gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
			gap: 1.5,
			px: 3,
			py: 2,
			borderBottom: '1px solid',
			borderColor: 'divider',
			bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.01)',
		}}>
			{cards.map((card) => (
				<Box
					key={card.label}
					sx={{
						p: 1.5,
						borderRadius: 2,
						border: '1px solid',
						borderColor: 'divider',
						bgcolor: 'background.paper',
						display: 'flex',
						flexDirection: 'column',
						gap: 0.5,
						minWidth: 0,
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
						<Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.5 }}>
							{card.label}
						</Typography>
						<Box sx={{
							width: 22,
							height: 22,
							borderRadius: 1,
							bgcolor: (theme) => theme.palette.mode === 'dark' ? `${card.color}18` : `${card.color}0f`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: card.color,
							flexShrink: 0,
							'& svg': { fontSize: 13 },
						}}>
							{card.icon}
						</Box>
					</Box>
					{loading ? (
						<Skeleton width="50%" height={20} sx={{ mt: 0.5 }} />
					) : (
						<Typography sx={{ fontSize: 16, fontWeight: 800, color: card.color, mt: 0.5, lineHeight: 1 }}>
							{card.value}
						</Typography>
					)}
				</Box>
			))}
		</Box>
	);
}
