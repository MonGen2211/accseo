import { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

interface DomainFormProps {
	onSubmit: (domain: string) => void;
	onCancel: () => void;
	loading?: boolean;
	apiError?: string | null;
	onClearError?: () => void;
}

export default function DomainForm({ onSubmit, onCancel, loading, apiError, onClearError }: DomainFormProps) {
	const [domain, setDomain] = useState('');
	const [error, setError] = useState('');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = domain.trim();
		if (!trimmed) {
			setError('Tên miền không được để trống');
			return;
		}

		if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
			setError('Tên miền phải bắt đầu bằng http:// hoặc https://');
			return;
		}

		setError('');
		onSubmit(trimmed);
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2" noValidate>
			{apiError && (
				<Alert severity="error" sx={{ mb: 1 }}>
					{typeof apiError === 'string' ? apiError : JSON.stringify(apiError)}
				</Alert>
			)}

			<TextField
				label="Tên miền (URL)"
				value={domain}
				onChange={(e) => {
					setDomain(e.target.value);
					if (error) setError('');
					if (apiError) onClearError?.();
				}}
				placeholder="https://example.com/"
				error={Boolean(error)}
				helperText={error}
				fullWidth
				sx={{ mb: 3 }}
				autoFocus
			/>

			<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
				<Button variant="text" color="inherit" onClick={onCancel} disabled={loading}>
					Hủy
				</Button>
				<Button type="submit" variant="contained" disabled={loading}>
					{loading ? 'Đang lưu...' : 'Thêm mới'}
				</Button>
			</Box>
		</form>
	);
}
