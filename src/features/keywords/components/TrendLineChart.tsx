import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import type { TrendTimelinePoint } from '../types';
import { Box, Typography } from '@mui/material';

interface TrendLineChartProps {
	data: TrendTimelinePoint[];
	currentScore?: number;
	height?: number;
	showAxes?: boolean;
	color?: string;
}

interface TooltipPayload {
	payload?: { value: number };
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
	if (!active || !payload?.length) return null;
	const value = payload[0]?.payload?.value;
	if (value === undefined) return null;
	return (
		<Box sx={{ bgcolor: 'rgba(30,30,40,0.92)', color: '#fff', px: 1.5, py: 0.75, borderRadius: 1.5, fontSize: 12, lineHeight: 1.6 }}>
			<div style={{ fontWeight: 600 }}>{label}</div>
			<div>Điểm: <strong>{value}</strong></div>
		</Box>
	);
}

function todayLabel(): string {
	const d = new Date();
	return `${d.getDate()} thg ${d.getMonth() + 1}, ${d.getFullYear()}`;
}

function CustomDot(props: { cx?: number; cy?: number; index?: number; dataLength?: number; color?: string }) {
	const { cx, cy, index, dataLength, color } = props;
	if (index !== (dataLength ?? 0) - 1) return null;
	return <circle cx={cx} cy={cy} r={5} fill={color ?? '#6366f1'} stroke="#fff" strokeWidth={2} />;
}

export function TrendLineChart({ data, currentScore, height = 200, showAxes = true, color = '#6366f1' }: TrendLineChartProps) {
	if (!data || data.length === 0) {
		return (
			<Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Typography variant="caption" color="text.disabled">Không có dữ liệu</Typography>
			</Box>
		);
	}

	const base: TrendTimelinePoint[] = currentScore !== undefined
		? [...data, { date: todayLabel(), value: currentScore }]
		: [...data];

	const thinned = base.length > 60
		? base.filter((_, i) => i % Math.ceil(base.length / 60) === 0 || i === base.length - 1)
		: base;

	const tickCount = Math.min(thinned.length, 8);
	const step = Math.floor(thinned.length / (tickCount - 1)) || 1;
	const tickIndices = new Set(
		Array.from({ length: tickCount }, (_, i) => Math.min(i * step, thinned.length - 1))
	);
	tickIndices.add(thinned.length - 1);

	return (
		<ResponsiveContainer width="100%" height={height}>
			<LineChart data={thinned} margin={{ top: 8, right: 12, left: showAxes ? 0 : -28, bottom: showAxes ? 24 : 4 }}>
				{showAxes && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
				{showAxes && (
					<XAxis
						dataKey="date"
						tick={{ fontSize: 11, fill: '#94a3b8' }}
						tickLine={false}
						axisLine={false}
						interval={0}
						tickFormatter={(_, index) => tickIndices.has(index) ? thinned[index]?.date ?? '' : ''}
						angle={-30}
						textAnchor="end"
						height={40}
					/>
				)}
				<YAxis
					domain={[0, 100]}
					ticks={[0, 25, 50, 75, 100]}
					tick={{ fontSize: 11, fill: '#94a3b8' }}
					tickLine={false}
					axisLine={false}
					width={showAxes ? 32 : 28}
				/>
				<Tooltip content={<CustomTooltip />} />
				<ReferenceLine y={50} stroke="#e2e8f0" strokeDasharray="4 4" />
				<Line
					type="linear"
					dataKey="value"
					stroke={color}
					strokeWidth={2}
					dot={<CustomDot dataLength={thinned.length} color={color} />}
					activeDot={{ r: 4, fill: color }}
					isAnimationActive={false}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}
