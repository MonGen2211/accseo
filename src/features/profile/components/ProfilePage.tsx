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
import CircularProgress from '@mui/material/CircularProgress';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import StoreOutlinedIcon from '@mui/icons-material/StoreOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/store';
import { updateAuthUser, logoutUser } from '../../auth/authSlice';
import { useToastify } from '../../../components/Toastify';
import { userService } from '../../users/userService';
import { ROUTES } from '../../../utils/constants';

const PASSWORD_RULES = [
	{ label: 'Tối thiểu 8 ký tự', test: (v: string) => v.length >= 8 },
	{ label: 'Có chữ hoa (A-Z)', test: (v: string) => /[A-Z]/.test(v) },
	{ label: 'Có chữ thường (a-z)', test: (v: string) => /[a-z]/.test(v) },
	{ label: 'Có chữ số (0-9)', test: (v: string) => /[0-9]/.test(v) },
	{ label: 'Có ký tự đặc biệt (!@#$%^&*...)', test: (v: string) => /[!@#$%^&*()\-_=+[\]{};:'",.<>?/\\|`~]/.test(v) },
];

export default function ProfilePage() {
	const currentUser = useAppSelector(state => state.auth.user);
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { showToast } = useToastify();
	const [loading, setLoading] = useState(false);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string>('');

	// Password change state
	const [showPwSection, setShowPwSection] = useState(false);
	const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
	const [pwLoading, setPwLoading] = useState(false);
	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [pwErrors, setPwErrors] = useState({ currentPassword: '', newPassword: '' });
	const [pwTouched, setPwTouched] = useState({ currentPassword: false, newPassword: false });

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

	const validatePwForm = (form = pwForm) => {
		const errors = { currentPassword: '', newPassword: '' };
		if (!form.currentPassword) errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
		if (!form.newPassword) {
			errors.newPassword = 'Vui lòng nhập mật khẩu mới';
		} else if (PASSWORD_RULES.some(r => !r.test(form.newPassword))) {
			errors.newPassword = 'Mật khẩu mới chưa đủ mạnh';
		} else if (form.newPassword === form.currentPassword) {
			errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
		}
		return errors;
	};

	const handlePwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		const updated = { ...pwForm, [name]: value };
		setPwForm(updated);
		if (pwTouched[name as keyof typeof pwTouched]) {
			setPwErrors(validatePwForm(updated));
		}
	};

	const handlePwBlur = (field: keyof typeof pwTouched) => {
		setPwTouched(prev => ({ ...prev, [field]: true }));
		setPwErrors(validatePwForm());
	};

	const handleChangePassword = async () => {
		setPwTouched({ currentPassword: true, newPassword: true });
		const errors = validatePwForm();
		setPwErrors(errors);
		if (errors.currentPassword || errors.newPassword) return;

		setPwLoading(true);
		try {
			await userService.changePassword(pwForm.currentPassword, pwForm.newPassword);
			showToast('Đổi mật khẩu thành công, vui lòng đăng nhập lại', 'success');
			setPwForm({ currentPassword: '', newPassword: '' });
			setPwTouched({ currentPassword: false, newPassword: false });
			setTimeout(async () => {
				await dispatch(logoutUser());
				navigate(ROUTES.LOGIN);
			}, 1500);
		} catch (err: unknown) {
			const e = err as { response?: { data?: { code?: string; message?: string }; status?: number } };
			const code = e?.response?.data?.code;
			const status = e?.response?.status;
			if (code === 'WRONG_PASSWORD' || status === 401) {
				setPwErrors(prev => ({ ...prev, currentPassword: 'Mật khẩu hiện tại không đúng' }));
			} else {
				showToast(e?.response?.data?.message || 'Đổi mật khẩu thất bại', 'danger');
			}
		} finally {
			setPwLoading(false);
		}
	};

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

			const updated = await userService.updateProfile(payload);

			// Sync lại auth state để header hiển thị ảnh/tên mới ngay lập tức
			dispatch(updateAuthUser({
				name: updated.name,
				imgAvatar: updated.imgAvatar ?? undefined,
			}));

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
		} catch (err: unknown) {
			const e = err as { response?: { data?: { message?: string } }; message?: string };
			showToast(e?.response?.data?.message || e?.message || 'Lỗi khi lưu thông tin', 'danger');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box sx={{ mx: 'auto' }}>
			{/* Banner */}
			<Box sx={{
				height: 180,
				borderRadius: '16px 16px 0 0',
				background: 'linear-gradient(135deg, #00b894 0%, #0984e3 100%)',
				position: 'relative',
			}} />

			<Paper elevation={0} sx={{ borderRadius: '0 0 16px 16px', border: '1px solid', borderColor: 'divider', borderTop: 'none' }}>
				<Box sx={{
					display: 'grid',
					gridTemplateColumns: { xs: '1fr', md: '340px 1fr' },
					gap: 0,
					alignItems: 'start',
				}}>
					{/* ── Cột trái: ảnh + fields có thể sửa ── */}
					<Box sx={{
						borderRight: { md: '1px solid' },
						borderColor: { md: 'divider' },
						px: 4,
						pt: 0,
						pb: 4,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
					}}>
						{/* Avatar nổi lên banner */}
						<Box sx={{ mt: -8, mb: 2, position: 'relative', width: 140, height: 140 }}>
							<Avatar
								src={avatarPreview || profile.avatar}
								sx={{
									width: 140,
									height: 140,
									border: '4px solid #fff',
									boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
									bgcolor: '#f1f5f9',
									fontSize: 48,
								}}
							/>
							<IconButton
								component="label"
								sx={{
									position: 'absolute',
									bottom: 6,
									right: 6,
									backgroundColor: 'primary.main',
									color: '#fff',
									width: 36,
									height: 36,
									boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
									'&:hover': { backgroundColor: 'primary.dark' },
								}}
							>
								<input hidden accept="image/*" type="file" onChange={handleAvatarChange} />
								<PhotoCameraIcon sx={{ fontSize: 18 }} />
							</IconButton>
						</Box>

						<Typography sx={{ fontWeight: 700, fontSize: '1.1rem', textAlign: 'center', mb: 0.5 }}>
							{profile.name || '—'}
						</Typography>
						<Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, mb: 3 }}>
							{profile.role || '—'}
						</Typography>

						<Divider sx={{ width: '100%', mb: 3 }} />

						<Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, mb: 2, alignSelf: 'flex-start' }}>
							Thông tin có thể chỉnh sửa
						</Typography>

						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
							<TextField
								fullWidth
								label="Họ và tên"
								name="name"
								value={profile.name}
								onChange={handleChange}
								size="small"
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<PersonOutlineOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
											</InputAdornment>
										)
									}
								}}
							/>
							<TextField
								fullWidth
								label="Số điện thoại cá nhân"
								name="phone1"
								value={profile.phone1}
								onChange={handleChange}
								size="small"
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
							<TextField
								fullWidth
								label="Số điện thoại công ty"
								name="phone2"
								value={profile.phone2}
								onChange={handleChange}
								placeholder="Không bắt buộc"
								size="small"
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

							<Button
								variant="contained"
								fullWidth
								size="large"
								onClick={handleSave}
								disabled={loading}
								sx={{ mt: 1, borderRadius: 2, fontWeight: 700, py: 1.2 }}
							>
								{loading ? 'Đang lưu...' : 'Lưu thay đổi'}
							</Button>
						</Box>
					</Box>

					{/* ── Cột phải: thông tin chỉ đọc ── */}
					<Box sx={{ px: 4, pt: 4, pb: 4 }}>
						<Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, mb: 3 }}>
							Thông tin tài khoản
						</Typography>

						<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
							<TextField
								fullWidth
								label="Email"
								name="email"
								value={profile.email}
								disabled
								size="small"
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<EmailOutlinedIcon fontSize="small" />
											</InputAdornment>
										)
									}
								}}
							/>
							<TextField
								fullWidth
								label="Mã nhân viên (MSNV)"
								name="msnv"
								value={profile.msnv}
								disabled
								size="small"
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<BadgeOutlinedIcon fontSize="small" />
											</InputAdornment>
										)
									}
								}}
							/>
							<TextField
								fullWidth
								label="Chức vụ"
								name="role"
								value={profile.role}
								disabled
								size="small"
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<WorkOutlineOutlinedIcon fontSize="small" />
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
								disabled
								size="small"
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<StoreOutlinedIcon fontSize="small" />
											</InputAdornment>
										)
									}
								}}
							/>
							<TextField
								fullWidth
								label="Tên công ty"
								name="companyName"
								value={profile.companyName}
								disabled
								size="small"
								sx={{ gridColumn: { sm: 'span 2' } }}
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<BusinessOutlinedIcon fontSize="small" />
											</InputAdornment>
										)
									}
								}}
							/>
						</Box>

						<Box sx={{ mt: 4, p: 2.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid', borderColor: 'divider' }}>
							<Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', lineHeight: 1.6 }}>
								Các thông tin trên được quản lý bởi Admin. Liên hệ Admin để cập nhật.
							</Typography>
						</Box>

						{/* ── Đổi mật khẩu ── */}
						<Box sx={{ mt: 4 }}>
							<Divider sx={{ mb: 3 }} />

							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: showPwSection ? 3 : 0 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<Box sx={{
										width: 36, height: 36, borderRadius: '10px',
										bgcolor: 'primary.main',
										display: 'flex', alignItems: 'center', justifyContent: 'center',
										boxShadow: '0 4px 12px rgba(25,118,210,0.3)',
									}}>
										<LockOutlinedIcon sx={{ color: '#fff', fontSize: 18 }} />
									</Box>
									<Box>
										<Typography sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>
											Đổi mật khẩu
										</Typography>
										<Typography sx={{ fontSize: '0.73rem', color: 'text.secondary' }}>
											Sau khi đổi, bạn sẽ được đăng xuất khỏi tất cả thiết bị
										</Typography>
									</Box>
								</Box>
								<Button
									variant={showPwSection ? 'outlined' : 'contained'}
									color="primary"
									size="small"
									startIcon={<LockOutlinedIcon />}
									onClick={() => {
										setShowPwSection(v => !v);
										if (showPwSection) {
											setPwForm({ currentPassword: '', newPassword: '' });
											setPwTouched({ currentPassword: false, newPassword: false });
											setPwErrors({ currentPassword: '', newPassword: '' });
										}
									}}
									sx={{ borderRadius: 2, fontWeight: 600, whiteSpace: 'nowrap' }}
								>
									{showPwSection ? 'Huỷ' : 'Đổi mật khẩu'}
								</Button>
							</Box>

							{showPwSection && <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
								{/* Mật khẩu hiện tại */}
								<TextField
									fullWidth
									label="Mật khẩu hiện tại"
									name="currentPassword"
									type={showCurrent ? 'text' : 'password'}
									value={pwForm.currentPassword}
									onChange={handlePwChange}
									onBlur={() => handlePwBlur('currentPassword')}
									error={pwTouched.currentPassword && !!pwErrors.currentPassword}
									helperText={pwTouched.currentPassword && pwErrors.currentPassword}
									size="small"
									slotProps={{
										input: {
											startAdornment: (
												<InputAdornment position="start">
													<LockOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
												</InputAdornment>
											),
											endAdornment: (
												<InputAdornment position="end">
													<IconButton size="small" onClick={() => setShowCurrent(v => !v)} edge="end">
														{showCurrent
															? <VisibilityOffOutlinedIcon fontSize="small" />
															: <VisibilityOutlinedIcon fontSize="small" />}
													</IconButton>
												</InputAdornment>
											),
										}
									}}
								/>

								{/* Mật khẩu mới */}
								<TextField
									fullWidth
									label="Mật khẩu mới"
									name="newPassword"
									type={showNew ? 'text' : 'password'}
									value={pwForm.newPassword}
									onChange={handlePwChange}
									onBlur={() => handlePwBlur('newPassword')}
									error={pwTouched.newPassword && !!pwErrors.newPassword}
									helperText={pwTouched.newPassword && pwErrors.newPassword}
									size="small"
									slotProps={{
										input: {
											startAdornment: (
												<InputAdornment position="start">
													<LockOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
												</InputAdornment>
											),
											endAdornment: (
												<InputAdornment position="end">
													<IconButton size="small" onClick={() => setShowNew(v => !v)} edge="end">
														{showNew
															? <VisibilityOffOutlinedIcon fontSize="small" />
															: <VisibilityOutlinedIcon fontSize="small" />}
													</IconButton>
												</InputAdornment>
											),
										}
									}}
								/>

								{/* Password strength checklist */}
								{pwForm.newPassword && (
									<Box sx={{
										p: 2, borderRadius: 2,
										bgcolor: '#f8fafc',
										border: '1px solid', borderColor: 'divider',
										display: 'flex', flexDirection: 'column', gap: 0.75,
									}}>
										{PASSWORD_RULES.map(rule => {
											const passed = rule.test(pwForm.newPassword);
											return (
												<Box key={rule.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													{passed
														? <CheckCircleOutlinedIcon sx={{ fontSize: 15, color: 'success.main' }} />
														: <RadioButtonUncheckedIcon sx={{ fontSize: 15, color: 'text.disabled' }} />}
													<Typography sx={{ fontSize: '0.75rem', color: passed ? 'success.main' : 'text.secondary' }}>
														{rule.label}
													</Typography>
												</Box>
											);
										})}
									</Box>
								)}

								<Button
									variant="contained"
									color="primary"
									size="large"
									onClick={handleChangePassword}
									disabled={pwLoading}
									startIcon={pwLoading ? <CircularProgress size={16} color="inherit" /> : <LockOutlinedIcon />}
									sx={{ borderRadius: 2, fontWeight: 700, py: 1.2, alignSelf: 'flex-start', px: 4 }}
								>
									{pwLoading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
								</Button>
							</Box>}
						</Box>
					</Box>
				</Box>
			</Paper>
		</Box>
	);
}
