import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { loginUser, clearError } from '../authSlice';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LanguageIcon from '@mui/icons-material/Language';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import LogoImage from '../../../assets/Logo/Logo.png';
import { useToastify } from '../../../components/Toastify';

// ─── Left panel stat card ─────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, subColor }: {
	icon: React.ReactNode;
	label: string;
	value: string;
	sub: string;
	subColor?: string;
}) {
	return (
		<Box sx={{
			flex: 1,
			bgcolor: 'rgba(16, 0, 110, 0.05)',
			border: '1px solid rgba(255,255,255,0.08)',
			borderRadius: 2,
			p: 2,
		}}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
				{icon}
				<Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1 }}>
					{label}
				</Typography>
			</Box>
			<Typography sx={{ fontSize: '1.7rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{value}</Typography>
			<Typography sx={{ fontSize: '0.72rem', color: subColor || '#34d399', mt: 0.4, fontWeight: 500 }}>{sub}</Typography>
		</Box>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
	const dispatch = useAppDispatch();
	const { loading } = useAppSelector((s) => s.auth);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [remember, setRemember] = useState(false);

	const { showToast } = useToastify();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		dispatch(clearError());
		try {
			await dispatch(loginUser({ email, password })).unwrap();
			showToast('Đăng nhập thành công', 'success');
		} catch {
			showToast('Tài khoản hoặc mật khẩu không chính xác', 'danger');
		}
	};

	// Shared dark input styles
	const inputSx = {
		'& .MuiOutlinedInput-root': {
			bgcolor: 'rgba(255,255,255,0.05)',
			borderRadius: 1.5,
			color: '#fff',
			'& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
			'&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
			'&.Mui-focused fieldset': { borderColor: '#3b82f6' },
		},
		'& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' },
		'& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
		'& .MuiInputAdornment-root svg': { color: 'rgba(255,255,255,0.3)', fontSize: 18 },
		'& input': {
			color: '#fff',
			fontSize: '0.9rem',
			'&:-webkit-autofill': {
				WebkitTextFillColor: '#fff',
				transition: 'background-color 9999s ease-in-out 0s',
			}
		},
		'& input::placeholder': { color: 'rgba(255,255,255,0.2)', opacity: 1 },
	};

	return (
		<Box sx={{
			minHeight: '100vh',
			display: 'flex',
			background: 'linear-gradient(60deg, #000000ff 0%, #153d83ff 30%, #031b44ff 70%, #000307ff 100%)',
			fontFamily: '"Inter", system-ui, sans-serif',
		}}>
			{/* ── LEFT PANEL ── */}
			<Box sx={{
				flex: 1,
				display: { xs: 'none', md: 'flex' },
				flexDirection: 'column',
				justifyContent: 'center',
				px: { md: 6, lg: 10 },
				py: 6,
				position: 'relative',
				overflow: 'hidden',
			}}>
				{/* Background radial glow */}
				<Box sx={{
					position: 'absolute', top: '10%', left: '5%',
					width: 500, height: 500, borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
					pointerEvents: 'none',
				}} />

				{/* Tag */}
				<Box sx={{
					display: 'inline-flex', alignItems: 'center', gap: 0.8,
					bgcolor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
					borderRadius: 10, px: 1.5, py: 0.5, mb: 3, width: 'fit-content',
				}}>
					<TrendingUpIcon sx={{ fontSize: 13, color: '#34d399' }} />
					<Typography sx={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>
						Hệ thống SEO tự động
					</Typography>
				</Box>

				{/* Headline */}
				<Typography sx={{ fontSize: { md: '2.5rem', lg: '3rem' }, fontWeight: 800, color: '#fff', lineHeight: 1.15, mb: 2 }}>
					Tối Ưu Hoá<br />Công Việc SEO
				</Typography>
				<Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)', maxWidth: 380, lineHeight: 1.7, mb: 5 }}>
					Hệ sinh thái tự động phân tích dữ liệu, theo dõi thứ hạng từ khoá và phản hồi các chỉ số quản lý SEO nội bộ.
				</Typography>

				{/* Stat cards */}
				<Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
					<StatCard
						icon={<TrendingUpIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }} />}
						label="Organic Traffic"
						value="2.4M"
						sub="+154% lượt truy cập"
					/>
					<StatCard
						icon={<LanguageIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }} />}
						label="Keyword Ranks"
						value="14,205"
						sub="+302 (Top 10)"
						subColor="#60a5fa"
					/>
				</Box>

				{/* Activity row */}
				<Box sx={{
					display: 'flex', alignItems: 'center', justifyContent: 'space-between',
					bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
					borderRadius: 2, px: 2.5, py: 1.8,
				}}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
						<Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
							<SmartToyOutlinedIcon sx={{ fontSize: 18, color: '#34d399' }} />
						</Box>
						<Box>
							<Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>AI Crawler Đang Phân Tích</Typography>
							<Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Quét 3,420 liên kết...</Typography>
						</Box>
					</Box>
					<VerifiedUserOutlinedIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.2)' }} />
				</Box>
			</Box>

			{/* ── RIGHT PANEL / LOGIN CARD ── */}
			<Box sx={{
				width: { xs: '100%', md: 420 },
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				px: 3,
				py: 6,
			}}>
				<Box sx={{
					width: '100%',
					maxWidth: 360,
					bgcolor: 'rgba(255,255,255,0.04)',
					border: '1px solid rgba(255,255,255,0.09)',
					borderRadius: 3,
					p: 4,
				}}>
					{/* Logo */}
					<Box sx={{ textAlign: 'center', mb: 3.5 }}>
						<Box sx={{
							width: 44, height: 44, borderRadius: '50%',
							bgcolor: 'rgba(255,255,255,0.08)',
							border: '1px solid rgba(255,255,255,0.12)',
							display: 'flex', alignItems: 'center', justifyContent: 'center',
							mx: 'auto', mb: 1.5,
						}}>
							<img src={LogoImage} alt="ACCSEO Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
						</Box>
						<Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', mb: 0.5 }}>
							Hệ Sinh Thái ACCSEO
						</Typography>
						<Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
							Dự án thuộc hệ thống Công ty Luật ACC
						</Typography>
					</Box>

					{/* Form */}
					<Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>


						<TextField
							label="Email truy cập"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="admin@congty.com"
							required
							fullWidth
							size="small"
							slotProps={{
								input: { startAdornment: <InputAdornment position="start"><EmailOutlinedIcon /></InputAdornment> },
							}}
							sx={inputSx}
						/>

						<TextField
							label="Mật khẩu bảo mật"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••••"
							required
							fullWidth
							size="small"
							slotProps={{
								input: { startAdornment: <InputAdornment position="start"><LockOutlinedIcon /></InputAdornment> },
							}}
							sx={inputSx}
						/>

						<FormControlLabel
							control={
								<Checkbox
									checked={remember}
									onChange={(e) => setRemember(e.target.checked)}
									size="small"
									sx={{ color: 'rgba(255,255,255,0.25)', '&.Mui-checked': { color: '#3b82f6' }, p: 0.5 }}
								/>
							}
							label={<Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>Ghi nhớ đăng nhập</Typography>}
							sx={{ mx: 0 }}
						/>

						<Button
							type="submit"
							variant="contained"
							fullWidth
							disabled={loading}
							endIcon={!loading && <span style={{ fontSize: 16 }}>→</span>}
							sx={{
								mt: 0.5,
								py: 1.2,
								bgcolor: '#2563eb',
								'&:hover': { bgcolor: '#1d4ed8' },
								borderRadius: 1.5,
								fontWeight: 600,
								fontSize: '0.88rem',
								textTransform: 'none',
								boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
							}}
						>
							{loading ? 'Đang đăng nhập...' : 'Đăng nhập hệ thống'}
						</Button>
					</Box>

				</Box>
			</Box>
		</Box>
	);
}
