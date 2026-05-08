import React from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
	LinearProgress,
	TextField,
} from '@mui/material';
import { useAiProgress } from '../hooks/useAiProgress';

const TIME_RANGE_OPTIONS = [
	{ value: '1-m', label: '1 tháng' },
	{ value: '3-m', label: '3 tháng' },
];

interface KeywordGroupsAiDialogProps {
	open: boolean;
	loading: boolean;
	onClose: () => void;
	onConfirm: (timeRange: string, minScore: number, count: number) => void;
}

export function KeywordGroupsAiDialog({ open, loading, onClose, onConfirm }: KeywordGroupsAiDialogProps) {
	const [timeRange, setTimeRange] = React.useState('3-m');
	const [minScore, setMinScore] = React.useState(60);
	const [minScoreError, setMinScoreError] = React.useState<string | null>(null);
	const [count, setCount] = React.useState(2);
	const [countError, setCountError] = React.useState<string | null>(null);
	const progress = useAiProgress(loading);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (minScore < 0 || minScore > 100) {
			setMinScoreError('Điểm yêu cầu phải từ 0 đến 100');
			return;
		}
		if (!Number.isInteger(count) || count < 1) {
			setCountError('Số lượng phải là số nguyên >= 1');
			return;
		}
		setMinScoreError(null);
		setCountError(null);
		onConfirm(timeRange, minScore, count);
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle sx={{ fontWeight: 600, pb: loading ? 0 : undefined }}>Cấu hình AI Gợi ý theo nhóm</DialogTitle>
			{loading && (
				<Box sx={{ px: 3, pt: 1.5, pb: 0.5 }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
						<Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
							✨ AI đang phân tích và tạo keywords, bạn có thể đóng hộp thoại này...
						</Typography>
						<Typography variant="caption" color="primary" sx={{ fontWeight: 700, ml: 1, whiteSpace: 'nowrap' }}>
							{Math.round(progress)}%
						</Typography>
					</Box>
					<LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 2, height: 6 }} />
				</Box>
			)}
			<form onSubmit={handleSubmit}>
				<DialogContent dividers>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
						<Typography variant="body2" color="text.secondary">
							Chọn khoảng thời gian và điểm yêu cầu để AI phân tích xu hướng tìm kiếm và gợi ý bộ keywords phù hợp.
						</Typography>
						<FormControl fullWidth size="small">
							<InputLabel id="time-range-label">Khoảng thời gian</InputLabel>
							<Select
								labelId="time-range-label"
								label="Khoảng thời gian"
								value={timeRange}
								onChange={(e) => setTimeRange(e.target.value)}
							>
								{TIME_RANGE_OPTIONS.map((opt) => (
									<MenuItem key={opt.value} value={opt.value}>
										{opt.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<TextField
							label="Điểm yêu cầu tối thiểu (minScore)"
							type="number"
							size="small"
							fullWidth
							value={minScore}
							onChange={(e) => {
								const val = Number(e.target.value);
								setMinScore(val);
								setMinScoreError(val < 0 || val > 100 ? 'Điểm yêu cầu phải từ 0 đến 100' : null);
							}}
							error={!!minScoreError}
							helperText={minScoreError ?? 'Chỉ lấy keywords có điểm xu hướng >= giá trị này (0–100)'}
							slotProps={{ htmlInput: { min: 0, max: 100 } }}
						/>
						<TextField
							label="Số lượng keywords mong muốn"
							type="number"
							size="small"
							fullWidth
							value={count}
							onChange={(e) => {
								const val = parseInt(e.target.value, 10);
								setCount(isNaN(val) ? 2 : val);
								setCountError(!Number.isInteger(val) || val < 1 ? 'Số lượng phải là số nguyên >= 1' : null);
							}}
							error={!!countError}
							helperText={countError ?? 'Số lượng từ khóa AI sẽ gợi ý (mặc định: 2)'}
							slotProps={{ htmlInput: { min: 1 } }}
						/>
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={onClose} color="inherit">
						{loading ? 'Đóng (vẫn xử lý nền)' : 'Hủy'}
					</Button>
					<Button type="submit" variant="contained" disabled={loading}>
						{loading ? 'Đang tạo...' : 'Xác nhận tạo'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
