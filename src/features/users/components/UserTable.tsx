import type { UserProfile } from '../../../types/user.types';
import { CustomTable } from '../../../components/custom-table';
import type { TableField } from '../../../types/tableFields.types';
import type { TableRowData } from '../../../types/tableRows.types';

interface UserTableProps {
	users: UserProfile[];
	loading?: boolean;
	page?: number;
	rowsPerPage?: number;
	totalCount?: number;
	onPageChange?: (newPage: number) => void;
	onRowsPerPageChange?: (newLimit: number) => void;
	onEdit: (user: UserProfile) => void;
	onDelete: (id: string) => void;
	onStatusChange?: (user: UserProfile, newStatus: string) => void;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	headerActions?: React.ReactNode;
}

export default function UserTable({ users, loading, page, rowsPerPage, totalCount, onPageChange, onRowsPerPageChange, onEdit, onDelete, onStatusChange, searchValue, onSearchChange, headerActions }: UserTableProps) {
	const fields: TableField[] = [
		{ id: 'stt', name: 'stt', label: 'STT', type: 'text', width: 80, align: 'center' },
		{ id: 'name', name: 'name', label: 'Người dùng', type: 'text', width: 200 },
		{ id: 'email', name: 'email', label: 'Email', type: 'text', width: 200 },
		{ id: 'role', name: 'role', label: 'Vai trò', type: 'text', width: 120 },
		{ id: 'status', name: 'status', label: 'Trạng thái', type: 'status', width: 150, statusType: 'user' },
		{ id: 'createdAt', name: 'createdAt', label: 'Ngày tạo', type: 'date', width: 150 },
		{ id: 'actions', name: 'actions', label: 'Thao tác', type: 'actions', width: 100, align: 'center' },
	];

	const tableData: TableRowData[] = users.map((user, index) => ({
		stt: (page !== undefined && rowsPerPage !== undefined) ? (page * rowsPerPage) + index + 1 : index + 1,
		...user,
	}));

	return (
		<CustomTable
			fields={fields as TableField[]}
			data={tableData}
			loading={loading}
			minWidth={890}
			searchValue={searchValue}
			onSearchChange={onSearchChange}
			searchPlaceholder="Tìm kiếm người dùng..."
			headerActions={headerActions}
			page={page}
			rowsPerPage={rowsPerPage}
			totalCount={totalCount}
			onPageChange={onPageChange}
			onRowsPerPageChange={onRowsPerPageChange}
			onEdit={(row) => onEdit(row as UserProfile)}
			onDelete={(row) => onDelete(row.id as string)}
			onStatusChange={(row, newStatus) => onStatusChange && onStatusChange(row as UserProfile, newStatus)}
		/>
	);
}
