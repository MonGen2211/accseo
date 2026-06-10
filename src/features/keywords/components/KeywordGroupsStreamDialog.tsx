import { useEffect, useRef } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
} from '@mui/material';
import type { StreamLogEvent } from '../types';

interface KeywordGroupsStreamDialogProps {
	open: boolean;
	logs: StreamLogEvent[];
	onCancel: () => void;
	onHide?: () => void;
}

const STEP_ICON: Record<string, string> = {
	llm_start: '🤖',
	llm_done: '🤖',
	serp_start: '🔍',
	candidate_pass: '✅',
	candidate_fail: '❌',
	enrich_start: '📊',
	trending_fetch: '📈',
	trending_done: '🔥',
	trending_skip: '⏭️',
};

const STEP_COLOR: Record<string, string> = {
	candidate_pass: '#4ade80',
	candidate_fail: '#f87171',
	trending_done: '#f59e0b',
	trending_skip: '#64748b',
	trending_fetch: '#38bdf8',
};

function LogLine({ log }: { log: StreamLogEvent }) {
	const icon = STEP_ICON[log.step] ?? '•';
	const color = STEP_COLOR[log.step];

	return (
		<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', py: 0.5 }}>
			<span style={{ fontSize: 14, lineHeight: '20px', flexShrink: 0 }}>{icon}</span>
			<Box>
				<Typography
					variant="body2"
					sx={{ fontSize: 13, lineHeight: '20px', color: color ?? '#e2e8f0', fontFamily: 'monospace' }}
				>
					{log.message}
				</Typography>
				{log.step === 'trending_done' && log.keywords && log.keywords.length > 0 && (
					<Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block', wordBreak: 'break-word', fontFamily: 'monospace' }}>
						Keywords: {log.keywords.join(', ')}
					</Typography>
				)}
			</Box>
		</Box>
	);
}

export function KeywordGroupsStreamDialog({ open, logs, onCancel, onHide }: KeywordGroupsStreamDialogProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.scrollTop = containerRef.current.scrollHeight;
		}
	}, [logs]);

	return (
		<Dialog open={open} maxWidth="sm" fullWidth onClose={() => { }} PaperProps={{ sx: { borderRadius: '28px' } }}>
			<DialogTitle sx={{ fontWeight: 600, pb: 1, bgcolor: 'background.paper', color: 'text.primary' }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Box
						sx={{
							width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e',
							animation: 'pulse 1.2s ease-in-out infinite',
							'@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
						}}
					/>
					AI đang tạo từ khoá...
				</Box>
			</DialogTitle>

			<DialogContent dividers sx={{ p: 0 }}>
				<Box
					ref={containerRef}
					sx={{
						height: 340,
						overflowY: 'auto',
						px: 2.5,
						py: 1.5,
						bgcolor: '#0f172a',
						fontFamily: 'monospace',
					}}
				>
					{logs.length === 0 && (
						<Typography variant="caption" sx={{ color: 'text.secondary' }}>
							Đang kết nối...
						</Typography>
					)}
					{logs.map((log, i) => (
						<LogLine key={i} log={log} />
					))}
				</Box>
			</DialogContent>

			<DialogActions sx={{ px: 3, py: 2 }}>
				{onHide && (
					<Button onClick={onHide} color="primary" variant="outlined" sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700 }}>
						Chạy nền
					</Button>
				)}
				<Button onClick={onCancel} color="error" variant="outlined" sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700 }}>
					Huỷ
				</Button>
			</DialogActions>
		</Dialog>
	);
}
