import { Box, useTheme, alpha } from '@mui/material';

export type StatusType = 'user' | 'article' | 'order' | 'payment' | string;
export type StatusValue = string;

interface CustomStatusProps {
	type: StatusType;
	value: StatusValue;
}

export function CustomStatus({ type, value }: CustomStatusProps) {
	const theme = useTheme();
	let label = String(value || '');
	let baseColor = theme.palette.text.secondary;

	if (type === 'user') {
		switch (value) {
			case 'active':
				label = 'Hoạt động';
				baseColor = theme.palette.success.main;
				break;
			case 'inactive':
				label = 'Tạm khóa';
				baseColor = theme.palette.error.main;
				break;
			case 'pending':
				label = 'Chờ duyệt';
				baseColor = theme.palette.warning.main;
				break;
			default:
				label = value || 'Không rõ';
				break;
		}
	} else if (type === 'article') {
		switch (value) {
			case 'published':
				label = 'Hoạt động';
				baseColor = theme.palette.success.main;
				break;
			case 'draft':
				label = 'Tạm dừng / Nháp';
				baseColor = theme.palette.text.secondary;
				break;
			case 'archived':
				label = 'Lưu trữ';
				baseColor = theme.palette.text.secondary;
				break;
			default:
				label = value || 'Không rõ';
				break;
		}
	} else {
		// Có thể bổ sung thêm các type khác sau này như bài viết, đơn hàng...
		if (value === 'active' || value === 'published') {
			label = 'Hoạt động';
			baseColor = theme.palette.success.main;
		} else if (value === 'inactive' || value === 'draft') {
			label = 'Tạm dừng / Nháp';
			baseColor = theme.palette.text.secondary;
		}
	}

	return (
		<Box
			sx={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '4px 12px',
				borderRadius: '24px',
				fontSize: '13px',
				fontWeight: 600,
				color: baseColor,
				backgroundColor: alpha(baseColor, 0.12),
				whiteSpace: 'nowrap',
				minWidth: '80px'
			}}
		>
			{label}
		</Box>
	);
}
