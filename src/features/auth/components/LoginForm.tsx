import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { loginUser, clearError } from '../authSlice';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
export default function LoginForm() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const dispatch = useAppDispatch();
	const { loading } = useAppSelector((state) => state.auth);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		dispatch(clearError());
		dispatch(loginUser({ email, password }));
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">

			<TextField
				label="Email"
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				placeholder="admin@cms.dev"
				required
				fullWidth
			/>

			<TextField
				label="Mật khẩu"
				type="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				placeholder="••••••••"
				required
				fullWidth
			/>

			<Button
				type="submit"
				variant="contained"
				size="large"
				fullWidth
				disabled={loading}
			>
				{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
			</Button>
		</form>
	);
}
