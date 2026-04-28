import { CustomTable } from '../../../components/custom-table/CustomTable';
import type { TableField } from '../../../types/tableFields.types';
import type { TableRowData } from '../../../types/tableRows.types';
import type { Domain, DomainOwner } from '../../../types/domain.types';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import { Link } from 'react-router-dom';

interface DomainTableProps {
	domains: Domain[];
	loading?: boolean;
	page?: number;
	rowsPerPage?: number;
	totalCount?: number;
	onPageChange?: (newPage: number) => void;
	onRowsPerPageChange?: (newLimit: number) => void;
	onCheck?: (id: string) => void;
	onEdit?: (domain: Domain) => void;
	onDelete?: (id: string) => void;
	headerActions?: React.ReactNode;
	actionLoadingId?: string | null;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	onSort?: (field: string) => void;
}

export default function DomainTable({
	domains,
	loading,
	page,
	rowsPerPage,
	totalCount,
	onPageChange,
	onRowsPerPageChange,
	onCheck,
	onEdit,
	onDelete,
	headerActions,
	actionLoadingId,
	sortBy,
	sortOrder,
	onSort,
}: DomainTableProps) {
	const hasActions = !!(onEdit || onDelete);
	const fields: TableField[] = [
		{ id: 'stt', name: 'stt', label: 'STT', type: 'text', width: 80, align: 'center' },
		{ id: '_id', name: 'id', label: 'ID', type: 'hide' },
		{
			id: 'domain',
			name: 'domain',
			label: 'Tên miền',
			type: 'custom',
			width: 250,
			sortable: true,
			renderCell: (row) => (
				<Link to={`/domains/${row._id}/keywords`} style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500 }}>
					{row.domain}
				</Link>
			)
		},
		{
			id: 'metaDescription',
			name: 'metaDescription',
			label: 'Thẻ mô tả',
			type: 'custom',
			width: 350,
			sortable: true,
			wrapText: true,
			renderCell: (row) => (
				<Typography variant="body2">
					{row.metaDescription == null
						? <span style={{ color: '#94a3b8' }}>N/A</span>
						: row.metaDescription === ''
							? <span style={{ color: '#e17055' }}>Không lấy được dữ liệu</span>
							: row.metaDescription}
				</Typography>
			)
		},
		{
			id: 'lastCheckedAt',
			name: 'lastCheckedAt',
			label: 'Kiểm tra lần cuối',
			type: 'date',
			width: 180,
			sortable: true,
		},
		{
			id: 'owners',
			name: 'owners',
			label: 'Người quản lý',
			type: 'custom',
			width: 200,
			renderCell: (row) => {
				const owners = (row.owners as unknown as DomainOwner[]) || [];
				if (owners.length === 0) return <span style={{ color: '#94a3b8' }}>Chưa gán</span>;
				return (
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
						{owners.map((o) => (
							<Chip key={o._id} label={o.name} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: '12px' }} />
						))}
					</Box>
				);
			},
		},
		...(hasActions ? [{
			id: 'actions',
			name: 'actions',
			label: 'Thao tác',
			type: 'actions' as const,
			width: 130,
			align: 'center' as const,
		}] : []),
	];

	const tableData: TableRowData[] = domains.map((domain, index) => ({
		stt: (page !== undefined && rowsPerPage !== undefined) ? (page * rowsPerPage) + index + 1 : index + 1,
		...domain as unknown as TableRowData,
	}));

	return (
		<CustomTable
			fields={fields}
			data={tableData}
			loading={loading}
			page={page}
			rowsPerPage={rowsPerPage}
			totalCount={totalCount}
			onPageChange={onPageChange}
			onRowsPerPageChange={onRowsPerPageChange}
			onCheck={(row) => onCheck && onCheck(row._id as string)}
			onEdit={onEdit ? (row) => onEdit(row as unknown as Domain) : undefined}
			onDelete={onDelete ? (row) => onDelete(row._id as string) : undefined}
			headerActions={headerActions}
			actionLoadingId={actionLoadingId}
			minWidth={900}
			sortBy={sortBy}
			sortOrder={sortOrder}
			onSort={onSort}
		/>
	);
}
