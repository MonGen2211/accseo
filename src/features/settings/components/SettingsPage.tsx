import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

export default function SettingsPage() {
	const [form, setForm] = useState({
		siteName: 'Hệ Sinh Thái ACCSEO',
		adminEmail: 'admin@cms.dev',
		driveApiKey: '',
		analyticsTrackingId: '',
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Fake save action
		alert('Đã lưu cấu hình thành công!');
	};

	return (
		<Box sx={{ width: '100%' }}>

			<Paper variant="outlined" sx={{ borderRadius: 3, p: 4 }}>
				<Box sx={{ mb: 4 }}>
					<Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: 'text.primary' }}>
						Cài Đặt Hệ Thống
					</Typography>
					<Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mt: 0.5 }}>
						Quản lý các cấu hình chung và biến môi trường của hệ thống
					</Typography>
				</Box>
				<form onSubmit={handleSubmit}>
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
						<Box>
							<TextField
								fullWidth
								label="Tên Website / Hệ thống"
								name="siteName"
								value={form.siteName}
								onChange={handleChange}
								size="small"
								variant="outlined"
							/>
						</Box>
						<Box>
							<TextField
								fullWidth
								label="Email Quản trị viên"
								name="adminEmail"
								type="email"
								value={form.adminEmail}
								onChange={handleChange}
								size="small"
								variant="outlined"
							/>
						</Box>
						<Box sx={{ gridColumn: '1 / -1' }}>
							<TextField
								fullWidth
								label="Google Drive API Key"
								name="driveApiKey"
								value={form.driveApiKey}
								onChange={handleChange}
								size="small"
								variant="outlined"
								placeholder="Nhập API key kết nối Google Drive..."
								type="password"
							/>
						</Box>
						<Box sx={{ gridColumn: '1 / -1' }}>
							<TextField
								fullWidth
								label="Google Analytics Tracking ID"
								name="analyticsTrackingId"
								value={form.analyticsTrackingId}
								onChange={handleChange}
								size="small"
								variant="outlined"
								placeholder="Ví dụ: G-XXXXXXXXXX"
							/>
						</Box>

						<Box sx={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
							<Button
								type="submit"
								variant="contained"
								startIcon={<SaveOutlinedIcon />}
								disableElevation
								sx={{ borderRadius: 2, px: 3, py: 1 }}
							>
								Lưu thay đổi
							</Button>
						</Box>
					</Box>
				</form>
			</Paper>
		</Box>
	);
}
