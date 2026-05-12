import { useCallback, useMemo, useState, useEffect } from 'react';
import { z } from 'zod';
import api from '../../../utils/api';
import { roleService } from '../roleService';
import type { Role } from '../roleService';
import type { UserRole } from '../../../types/auth.types';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';

// ─── Zod Schema ─────────────────────────────────────────────────────────────

const USER_ROLES = ['ADMIN', 'MAR_SPECIALIST', 'CONTENT_SPECIALIST', 'SEO_COLLABORATOR', 'REVIEWER'] as const;

const baseSchema = z.object({
	name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
	email: z.string().email('Email không hợp lệ'),
	role: z.enum(USER_ROLES).optional(),
	roles: z.array(z.string()).optional(),
	password: z.string().optional(),
	status: z.enum(['active', 'inactive']),
	companyName: z.string().optional(),
	branch: z.string().optional(),
});

const createSchema = baseSchema.extend({
	role: z.enum(USER_ROLES),
	password: z
		.string()
		.min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
		.regex(
			/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/,
			'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt'
		),
});

const editSchema = baseSchema.extend({
	roles: z.array(z.string()).min(1, 'Phải chọn ít nhất 1 vai trò').max(20, 'Tối đa 20 vai trò'),
});

export type UserFormData = z.infer<typeof baseSchema>;

type FormErrors = Partial<Record<keyof UserFormData, string>>;

interface UserFormProps {
	initialData?: Partial<UserFormData>;
	onSubmit: (data: UserFormData) => void;
	onCancel: () => void;
	loading?: boolean;
	apiError?: string | null;
}

const EMPTY_FORM: UserFormData = {
	email: '',
	name: '',
	role: 'SEO_COLLABORATOR',
	roles: [],
	password: '',
	status: 'active',
	companyName: '',
	branch: '',
};

export default function UserForm({
	initialData,
	onSubmit,
	onCancel,
	loading,
	apiError,
}: UserFormProps) {
	const isEdit = Boolean(initialData);
	const [form, setForm] = useState<UserFormData>({ ...EMPTY_FORM, ...initialData });
	const [errors, setErrors] = useState<FormErrors>({});
	const schema = useMemo(() => (isEdit ? editSchema : createSchema), [isEdit]);
	const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
	const [loadingBranches, setLoadingBranches] = useState(false);
	const [roles, setRoles] = useState<Role[]>([]);

	useEffect(() => {
		const fetchBranches = async () => {
			setLoadingBranches(true);
			try {
				const response = await api.get('/branches');
				const branchData = response.data?.data?.items || response.data?.data || response.data || [];
				if (Array.isArray(branchData)) {
					setBranches(branchData.map((b: { id?: string; _id?: string; name?: string; branchName?: string }) => ({
						id: b.id || b._id || b.name || '',
						name: b.name || b.branchName || ''
					})));
				}
			} catch (error) {
				console.error('Failed to fetch branches', error);
			} finally {
				setLoadingBranches(false);
			}
		};
		const fetchRoles = async () => {
			try {
				const data = await roleService.getAll();
				setRoles(data);
			} catch {
				// fallback: roles stay empty, form still usable
			}
		};
		fetchBranches();
		fetchRoles();
	}, []);
	const handleChange = useCallback((field: keyof UserFormData, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => {
			if (!prev[field]) return prev;
			return { ...prev, [field]: undefined };
		});
	}, []);

	const handleRoleToggle = useCallback((roleName: string) => {
		setForm((prev) => {
			const current = prev.roles || [];
			const next = current.includes(roleName)
				? current.filter((r) => r !== roleName)
				: [...current, roleName];
			return { ...prev, roles: next };
		});
		setErrors((prev) => ({ ...prev, roles: undefined }));
	}, []);



	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const result = schema.safeParse(form);

		if (!result.success) {
			const flat = result.error.flatten().fieldErrors;
			const fieldErrors: FormErrors = Object.fromEntries(
				Object.entries(flat).map(([k, v]) => [k, v?.[0]])
			) as FormErrors;
			setErrors(fieldErrors);
			return;
		}

		setErrors({});
		onSubmit(result.data);
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2" noValidate>
			{apiError && (
				<Alert severity="error" sx={{ mb: 1 }}>
					{apiError}
				</Alert>
			)}

			<TextField
				label="Tên"
				value={form.name}
				onChange={(e) => handleChange('name', e.target.value)}
				placeholder="Nguyễn Văn A"
				error={Boolean(errors.name)}
				helperText={errors.name}
				fullWidth
				sx={{ mb: 3 }}
			/>

			<TextField
				label="Email"
				type="email"
				value={form.email}
				onChange={(e) => handleChange('email', e.target.value)}
				placeholder="user@example.com"
				error={Boolean(errors.email)}
				helperText={errors.email}
				disabled={isEdit}
				fullWidth
				sx={{ mb: 3 }}
			/>

			{!isEdit && (
				<TextField
					label="Mật khẩu"
					type="password"
					value={form.password || ''}
					onChange={(e) => handleChange('password', e.target.value)}
					placeholder="Tối thiểu 6 ký tự"
					error={Boolean(errors.password)}
					helperText={errors.password}
					fullWidth
					sx={{ mb: 3 }}
				/>
			)}

			<TextField
				label="Tên công ty"
				value={form.companyName || ''}
				onChange={(e) => handleChange('companyName', e.target.value)}
				placeholder="Công ty ABC"
				error={Boolean(errors.companyName)}
				helperText={errors.companyName}
				fullWidth
				sx={{ mb: 3 }}
			/>

			<div className="grid grid-cols-2 gap-4 mb-3">
				<TextField
					select
					label="Chi nhánh"
					value={form.branch || ''}
					onChange={(e) => handleChange('branch', e.target.value)}
					error={Boolean(errors.branch)}
					helperText={errors.branch}
					fullWidth
					disabled={loadingBranches}
					sx={{ mb: 3 }}
				>
					{branches.map((branch) => (
						<MenuItem key={branch.id} value={branch.name}>
							{branch.name}
						</MenuItem>
					))}
				</TextField>
			</div>

			{!isEdit && (
				<TextField
					select
					label="Vai trò"
					value={form.role || 'SEO_COLLABORATOR'}
					onChange={(e) => handleChange('role', e.target.value as UserRole)}
					fullWidth
					sx={{ mb: 3 }}
				>
					{roles.map((r) => (
						<MenuItem key={r._id} value={r.name}>
							{r.label || r.name}
						</MenuItem>
					))}
				</TextField>
			)}

			{isEdit && (
				<Box sx={{ mb: 3 }}>
					<Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary', mb: 1 }}>
						Vai trò
					</Typography>
					{errors.roles && (
						<Alert severity="error" sx={{ mb: 1, py: 0 }}>{errors.roles}</Alert>
					)}
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
						{roles.map((r) => (
							<FormControlLabel
								key={r._id}
								control={
									<Checkbox
										checked={(form.roles || []).includes(r.name)}
										onChange={() => handleRoleToggle(r.name)}
										size="small"
									/>
								}
								label={
									<Box>
										<Typography sx={{ fontSize: 14, fontWeight: 500 }}>{r.label}</Typography>
										{r.description && (
											<Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{r.description}</Typography>
										)}
									</Box>
								}
								sx={{ alignItems: 'center', py: 0.25 }}
							/>
						))}
					</Box>
				</Box>
			)}

			<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
				<Button variant="text" color="inherit" onClick={onCancel}>
					Hủy
				</Button>
				<Button type="submit" variant="contained" disabled={loading}>
					{loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
				</Button>
			</Box>
		</form>
	);
}
