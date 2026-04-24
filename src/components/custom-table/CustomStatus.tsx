import { Box } from '@mui/material';

export type StatusType = 'user' | 'article' | 'order' | 'payment' | string;
export type StatusValue = string;

interface CustomStatusProps {
	type: StatusType;
	value: StatusValue;
}

export function CustomStatus({ type, value }: CustomStatusProps) {
	let label = String(value || '');
	let color = '#475569';
	let bgColor = '#f1f5f9';

	if (type === 'user') {
		switch (value) {
			case 'active':
				label = 'Hoạt động';
				color = '#059669'; // Green
				bgColor = '#d1fae5';
				break;
			case 'inactive':
				label = 'Tạm khóa';
				color = '#dc2626'; // Red
				bgColor = '#fee2e2';
				break;
			case 'pending':
				label = 'Chờ duyệt';
				color = '#d97706'; // Yellow/Orange
				bgColor = '#fef3c7';
				break;
			default:
				label = value || 'Không rõ';
				break;
		}
	} else if (type === 'article') {
		switch (value) {
			case 'published':
				label = 'Hoạt động';
				color = '#059669';
				bgColor = '#d1fae5';
				break;
			case 'draft':
				label = 'Tạm dừng / Nháp';
				color = '#475569';
				bgColor = '#f1f5f9';
				break;
			case 'archived':
				label = 'Lưu trữ';
				color = '#475569';
				bgColor = '#f1f5f9';
				break;
			default:
				label = value || 'Không rõ';
				break;
		}
	} else {
		// Có thể bổ sung thêm các type khác sau này như bài viết, đơn hàng...
		if (value === 'active' || value === 'published') {
			label = 'Hoạt động';
			color = '#059669';
			bgColor = '#d1fae5';
		} else if (value === 'inactive' || value === 'draft') {
			label = 'Tạm dừng / Nháp';
			color = '#475569';
			bgColor = '#f1f5f9';
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
				color,
				backgroundColor: bgColor,
				whiteSpace: 'nowrap',
				minWidth: '80px'
			}}
		>
			{label}
		</Box>
	);
}
