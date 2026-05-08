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
}

const STEP_ICON: Record<string, string> = {
	llm_start: '🤖',
	llm_done: '🤖',
	serp_start: '🔍',
	candidate_pass: '✅',
	candidate_fail: '❌',
	enrich_start: '📊',
};

const STEP_COLOR: Record<string, string> = {
	candidate_pass: '#4ade80',
	candidate_fail: '#f87171',
};

function LogLine({ log }: { log: StreamLogEvent }) {
	const icon = STEP_ICON[log.step] ?? '•';
	const color = STEP_COLOR[log.step];

	return (
		<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', py: 0.5 }}>
			<span style={{ fontSize: 14, lineHeight: '20px', flexShrink: 0 }}>{icon}</span>
			<Typography
				variant="body2"
				sx={{ fontSize: 13, lineHeight: '20px', color: color ?? '#e2e8f0', fontFamily: 'monospace' }}
			>
				{log.message}
			</Typography>
		</Box>
	);
}

export function KeywordGroupsStreamDialog({ open, logs, onCancel }: KeywordGroupsStreamDialogProps) {
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [logs]);

	return (
		<Dialog open={open} maxWidth="sm" fullWidth onClose={() => {}}>
			<DialogTitle sx={{ fontWeight: 600, pb: 1, bgcolor: '#ffffff', color: '#000000' }}>
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
						<Typography variant="caption" sx={{ color: '#94a3b8' }}>
							Đang kết nối...
						</Typography>
					)}
					{logs.map((log, i) => (
						<LogLine key={i} log={log} />
					))}
					<div ref={bottomRef} />
				</Box>
			</DialogContent>

			<DialogActions sx={{ px: 3, py: 2 }}>
				<Button onClick={onCancel} color="error" variant="outlined">
					Huỷ
				</Button>
			</DialogActions>
		</Dialog>
	);
}
