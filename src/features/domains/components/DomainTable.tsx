import { CustomTable } from '../../../components/custom-table/CustomTable';
import type { TableField } from '../../../types/tableFields.types';
import type { TableRowData } from '../../../types/tableRows.types';
import type { Domain } from '../../../types/domain.types';
import Typography from '@mui/material/Typography';
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
	onDelete: (id: string) => void;
	headerActions?: React.ReactNode;
	actionLoadingId?: string | null;
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
	onDelete,
	headerActions,
	actionLoadingId
}: DomainTableProps) {
	const fields: TableField[] = [
		{ id: '_id', name: 'id', label: 'ID', type: 'hide' },
		{
			id: 'domain',
			name: 'domain',
			label: 'Tên miền',
			type: 'custom',
			width: 250,
			renderCell: (row) => (
				<Link to={`/domains/${row._id}/keywords`} style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500 }}>
					{row.domain}
				</Link>
			)
		},
		{
			id: 'metaDescription',
			name: 'Thẻ mô tả',
			label: 'Thẻ mô tả',
			type: 'custom',
			width: 350,
			renderCell: (row) => (
				<Typography
					variant="body2"
					sx={{
						display: '-webkit-box',
						WebkitLineClamp: 2,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}
				>
					{row.metaDescription || <span style={{ color: '#94a3b8' }}>N/A</span>}
				</Typography>
			)
		},
		{
			id: 'lastCheckedAt',
			name: 'lastCheckedAt',
			label: 'Kiểm tra lần cuối',
			type: 'date',
			width: 200,
		},
		{
			id: 'actions',
			name: 'actions',
			label: 'Thao tác',
			type: 'actions',
			width: 100,
			align: 'center',
		}
	];

	return (
		<CustomTable
			fields={fields}
			data={domains as unknown as TableRowData[]}
			loading={loading}
			page={page}
			rowsPerPage={rowsPerPage}
			totalCount={totalCount}
			onPageChange={onPageChange}
			onRowsPerPageChange={onRowsPerPageChange}
			onCheck={(row) => onCheck && onCheck(row._id as string)}
			onDelete={(row) => onDelete(row._id as string)}
			headerActions={headerActions}
			actionLoadingId={actionLoadingId}
			minWidth={900}
		/>
	);
}
