import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import StoreOutlinedIcon from '@mui/icons-material/StoreOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import { useAppSelector } from '../../../app/store';
import { useToastify } from '../../../components/Toastify';
import { userService } from '../../users/userService';

export default function ProfilePage() {
	const currentUser = useAppSelector(state => state.auth.user);
	const { showToast } = useToastify();
	const [loading, setLoading] = useState(false);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string>('');

	const [profile, setProfile] = useState({
		name: '',
		email: '',
		role: '',
		branch: '',
		msnv: '',
		phone1: '',
		phone2: '',
		avatar: '',
		companyName: '',
	});
	const [originalProfile, setOriginalProfile] = useState(profile);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setProfile((prev) => ({ ...prev, [name]: value }));
	};

	const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const file = e.target.files[0];
			setAvatarFile(file);
			setAvatarPreview(URL.createObjectURL(file));
		}
	};

	useEffect(() => {
		if (currentUser?.id) {
			userService.getById(currentUser.id).then(fullProfile => {
				const fetchedProfile = {
					name: fullProfile.name || '',
					email: fullProfile.email || '',
					role: fullProfile.role || '',
					branch: fullProfile.branch || '',
					msnv: fullProfile.msnv || '',
					phone1: fullProfile.phone1 || '',
					phone2: fullProfile.phone2 || '',
					avatar: fullProfile.imgAvatar || fullProfile.avatar || 'https://i.pravatar.cc/150?img=12',
					companyName: fullProfile.companyName || ''
				};
				setProfile(fetchedProfile);
				setOriginalProfile(fetchedProfile);
			}).catch(err => {
				showToast(err, 'danger');
			});
		}
	}, [currentUser?.id, showToast]);

	const handleSave = async () => {
		if (!currentUser?.id) return;
		setLoading(true);
		try {
			const payload: { name?: string; phone1?: string; phone2?: string; imgAvatar?: File } = {};
			let hasChanges = false;

			if (profile.name !== originalProfile.name) {
				payload.name = profile.name;
				hasChanges = true;
			}
			if (profile.phone1 !== originalProfile.phone1) {
				payload.phone1 = profile.phone1;
				hasChanges = true;
			}
			if (profile.phone2 !== originalProfile.phone2) {
				payload.phone2 = profile.phone2;
				hasChanges = true;
			}
			if (avatarFile) {
				payload.imgAvatar = avatarFile;
				hasChanges = true;
			}

			if (!hasChanges) {
				showToast('Không có thay đổi nào để lưu', 'info');
				setLoading(false);
				return;
			}

			await userService.updateProfile(payload);

			// Cập nhật lại originalProfile sau khi lưu thành công
			setOriginalProfile({
				...originalProfile,
				name: profile.name,
				phone1: profile.phone1,
				phone2: profile.phone2
			});
			if (avatarPreview) {
				setOriginalProfile(prev => ({ ...prev, avatar: avatarPreview }));
			}
			setAvatarFile(null); // Reset file sau khi lưu

			showToast('Lưu thay đổi thành công', 'success');
		} catch (err: any) {
			showToast(err?.response?.data?.message || err.message || 'Lỗi khi lưu thông tin', 'danger');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box sx={{ mx: 'auto' }}>
			<Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
				{/* Banner Gradient */}
				<Box
					sx={{
						height: 160,
						background: 'linear-gradient(135deg, #00b894 0%, #009975 100%)',
						position: 'relative',
					}}
				/>

				<Box sx={{ px: { xs: 3, md: 5 }, pb: 5, position: 'relative' }}>
					{/* Avatar Section overlaying the banner */}
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'flex-end',
							mt: -6,
							mb: 4,
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
							<Box sx={{ position: 'relative', width: 130, height: 130 }}>
								<Avatar
									src={avatarPreview || profile.avatar}
									sx={{
										width: 130,
										height: 130,
										border: '4px solid #fff',
										boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
										bgcolor: '#f5f6fa',
									}}
								/>
								<IconButton
									component="label"
									sx={{
										position: 'absolute',
										bottom: 4,
										right: 4,
										backgroundColor: 'primary.main',
										color: '#fff',
										width: 36,
										height: 36,
										boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
										'&:hover': { backgroundColor: 'primary.dark' },
									}}
								>
									<input hidden accept="image/*" type="file" onChange={handleAvatarChange} />
									<PhotoCameraIcon sx={{ fontSize: 18 }} />
								</IconButton>
							</Box>
							<Box sx={{ pb: 1, display: { xs: 'none', sm: 'block' } }}>
								<Typography variant="h5" color="text.primary" sx={{ fontWeight: 700 }}>
									{profile.name}
								</Typography>
								<Typography variant="body1" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.8rem', mt: 0.5, fontWeight: 600 }}>
									{profile.role}
								</Typography>
							</Box>
						</Box>

						{/* Quick Action Button */}
						<Box sx={{ pb: 1 }}>
							<Button variant="contained" color="primary" size="large" sx={{ borderRadius: 2, px: 3 }} onClick={handleSave} disabled={loading}>
								{loading ? 'Đang lưu...' : 'Lưu thay đổi'}
							</Button>
						</Box>
					</Box>

					<Typography variant="body2" color="text.secondary" sx={{ mb: 4, display: { sm: 'none' } }}>
						Tải lên ảnh định dạng bmp, jpg, jpeg hoặc png. Kích thước tối đa: 5MB
					</Typography>

					{/* Form Section */}
					<Box sx={{ mt: 2 }}>
						<Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
							Thông tin cá nhân
						</Typography>

						<Box sx={{
							display: 'grid',
							gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
							gap: 3,
							mb: 5
						}}>
							<TextField
								fullWidth
								label="Họ và tên"
								name="name"
								value={profile.name}
								onChange={handleChange}
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<PersonOutlineOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
											</InputAdornment>
										)
									}
								}}
								required
							/>

							<TextField
								fullWidth
								label="Mã nhân viên (MSNV)"
								name="msnv"
								value={profile.msnv}
								onChange={handleChange}
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<BadgeOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
											</InputAdornment>
										)
									}
								}}
								required
							/>

							<TextField
								fullWidth
								label="Chức vụ (Role)"
								name="role"
								value={profile.role}
								onChange={handleChange}
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<WorkOutlineOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
											</InputAdornment>
										)
									}
								}}
								required
							/>

							<TextField
								fullWidth
								label="Tên công ty"
								name="companyName"
								value={profile.companyName}
								onChange={handleChange}
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<BusinessOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
											</InputAdornment>
										)
									}
								}}
							/>

							<TextField
								fullWidth
								label="Chi nhánh"
								name="branch"
								value={profile.branch}
								onChange={handleChange}
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<StoreOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
											</InputAdornment>
										)
									}
								}}
							/>
						</Box>

						<Divider sx={{ mb: 4 }} />

						<Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
							Thông tin liên lạc
						</Typography>

						<Box sx={{
							display: 'grid',
							gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
							gap: 3
						}}>
							<TextField
								fullWidth
								label="Email"
								name="email"
								type="email"
								value={profile.email}
								onChange={handleChange}
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<EmailOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
											</InputAdornment>
										)
									}
								}}
								required
							/>



							<TextField
								fullWidth
								label="Số điện thoại cá nhân"
								name="phone1"
								value={profile.phone1}
								onChange={handleChange}
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<PhoneOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
											</InputAdornment>
										)
									}
								}}
								required
							/>

							<TextField
								fullWidth
								label="Số điện thoại công ty"
								name="phone2"
								value={profile.phone2}
								onChange={handleChange}
								placeholder="Không bắt buộc"
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<PhoneOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
											</InputAdornment>
										)
									}
								}}
							/>
						</Box>
					</Box>
				</Box>
			</Paper>
		</Box>
	);
}
