import React, { useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	Box,
	Typography,
} from '@mui/material';

interface KeywordAiDialogProps {
	open: boolean;
	loading: boolean;
	onClose: () => void;
	onConfirm: (days: number, top: number, keywords: string[]) => void;
}

export function KeywordAiDialog({ open, loading, onClose, onConfirm }: KeywordAiDialogProps) {
	const [days, setDays] = useState(30);
	const [top, setTop] = useState(100);
	const [keywordsText, setKeywordsText] = useState('');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (days <= 0 || top <= 0) return;

		const keywords = keywordsText
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		onConfirm(days, top, keywords);
	};

	return (
		<Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="sm" fullWidth>
			<DialogTitle sx={{ fontWeight: 600 }}>Cấu hình AI Suggestion</DialogTitle>
			<form onSubmit={handleSubmit}>
				<DialogContent dividers>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
						<Typography variant="body2" color="text.secondary">
							Vui lòng nhập các thông số để AI có thể phân tích và tạo bộ keywords.
						</Typography>
						<TextField
							label="Số ngày (Days)"
							type="number"
							variant="outlined"
							fullWidth
							size="small"
							value={days}
							onChange={(e) => setDays(Number(e.target.value))}
							required
							slotProps={{ htmlInput: { min: 1 } }}
						/>
						<TextField
							label="Số lượng (Top)"
							type="number"
							variant="outlined"
							fullWidth
							size="small"
							value={top}
							onChange={(e) => setTop(Number(e.target.value))}
							required
							slotProps={{ htmlInput: { min: 1 } }}
						/>
						<TextField
							label="Danh sách keywords (mỗi dòng 1 keyword)"
							placeholder={"keyword 1\nkeyword 2\nkeyword 3"}
							multiline
							minRows={4}
							maxRows={10}
							variant="outlined"
							fullWidth
							value={keywordsText}
							onChange={(e) => setKeywordsText(e.target.value)}
						// helperText="Nhập mỗi keyword trên một dòng. Để trống nếu muốn AI tự gợi ý."
						/>
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={onClose} disabled={loading} color="inherit">
						Hủy
					</Button>
					<Button type="submit" variant="contained" disabled={loading || days <= 0 || top <= 0}>
						{loading ? 'Đang tạo...' : 'Xác nhận tạo'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
