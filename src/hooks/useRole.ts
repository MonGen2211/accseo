import { useAppSelector } from '../app/store';
import type { UserRole } from '../types/auth.types';

export const useRole = (allowedRoles: UserRole[]): boolean => {
	const user = useAppSelector((state) => state.auth.user);

	if (!user) return false;

	if (user.role === 'ADMIN') return true;

	return allowedRoles.includes(user.role);
};
