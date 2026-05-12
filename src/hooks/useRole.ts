import { useAppSelector } from '../app/store';
import type { UserRole } from '../types/auth.types';

export const useRole = (allowedRoles: UserRole[]): boolean => {
	const user = useAppSelector((state) => state.auth.user);

	if (!user) return false;

	if (user.roles?.includes('ADMIN')) return true;

	return allowedRoles.some((role) => user.roles?.includes(role));
};
