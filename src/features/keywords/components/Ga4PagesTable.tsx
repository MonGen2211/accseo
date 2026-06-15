import CustomTable from '../../../components/custom-table/CustomTable';
import type { TableField } from '../../../types/tableFields.types';
import type { TableRowData } from '../../../types/tableRows.types';
import type { Ga4PageItem } from '../ga4Types';

interface Ga4PagesTableProps {
	items: Ga4PageItem[];
	loading: boolean;
	page: number;
	limit: number;
	total: number;
	sortBy: string;
	sortOrder: 'asc' | 'desc';
	onPageChange: (newPage: number) => void;
	onRowsPerPageChange: (newLimit: number) => void;
	onSort: (field: string) => void;
}

const pageFields: TableField[] = [
	{ id: 'pagePath', name: 'pagePath', label: 'Trang', type: 'text', width: 100, wrapText: true },
	{ id: 'sessions', name: 'sessions', label: 'Sessions', type: 'text', width: 75, align: 'center', sortable: true },
	{ id: 'activeUsers', name: 'activeUsers', label: 'Users', type: 'text', width: 68, align: 'center', sortable: true },
	{ id: 'screenPageViews', name: 'screenPageViews', label: 'Views', type: 'text', width: 68, align: 'center', sortable: true },
	{ id: 'conversions', name: 'conversions', label: 'Conv.', type: 'text', width: 65, align: 'center', sortable: true },
	{ id: 'engagedSessions', name: 'engagedSessions', label: 'Engaged', type: 'text', width: 75, align: 'center', sortable: true },
];

export function Ga4PagesTable({
	items,
	loading,
	page,
	limit,
	total,
	sortBy,
	sortOrder,
	onPageChange,
	onRowsPerPageChange,
	onSort,
}: Ga4PagesTableProps) {
	const data: TableRowData[] = items.map((item) => ({
		...item,
		id: item.pagePath,
	}));

	return (
		<CustomTable
			fields={pageFields}
			data={data}
			loading={loading}
			enablePagination
			page={page - 1}
			rowsPerPage={limit}
			totalCount={total}
			sortBy={sortBy}
			sortOrder={sortOrder}
			onPageChange={onPageChange}
			onRowsPerPageChange={onRowsPerPageChange}
			onSort={onSort}
			paperSx={{ mx: 0, mb: 0, border: 'none' }}
			paperVariant="elevation"
		/>
	);
}
