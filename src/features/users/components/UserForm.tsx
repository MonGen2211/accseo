import { useCallback, useMemo, useState } from 'react';
import { z } from 'zod';
import type { UserRole } from '../../../types/auth.types';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

// ─── Zod Schema ─────────────────────────────────────────────────────────────

const USER_ROLES = ['ADMIN', 'MAR_SPECIALIST', 'CONTENT_SPECIALIST', 'SEO_COLLABORATOR', 'REVIEWER'] as const;

const baseSchema = z.object({
	name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
	email: z.string().email('Email không hợp lệ'),
	role: z.enum(USER_ROLES),
	password: z.string().optional(),
	status: z.enum(['active', 'inactive']),
});

const createSchema = baseSchema.extend({
	password: z
		.string()
		.min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
		.regex(
			/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/,
			'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt'
		),
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
	password: '',
	status: 'active',
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
	const schema = useMemo(() => (isEdit ? baseSchema : createSchema), [isEdit]);


	const handleChange = useCallback((field: keyof UserFormData, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => {
			if (!prev[field]) return prev;
			return { ...prev, [field]: undefined };
		});
	}, [])



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

			<div className="grid grid-cols-2 gap-4">
				<TextField
					select
					label="Vai trò"
					value={form.role}
					onChange={(e) => handleChange('role', e.target.value as UserRole)}
					fullWidth
					sx={{ mb: 3 }}
				>
					<MenuItem value="ADMIN">Admin</MenuItem>
					<MenuItem value="MAR_SPECIALIST">Marketing Specialist</MenuItem>
					<MenuItem value="CONTENT_SPECIALIST">Content Specialist</MenuItem>
					<MenuItem value="SEO_COLLABORATOR">SEO Collaborator</MenuItem>
					<MenuItem value="REVIEWER">Reviewer</MenuItem>
				</TextField>

			</div>

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
