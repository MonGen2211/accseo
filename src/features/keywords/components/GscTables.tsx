import CustomTable from '../../../components/custom-table/CustomTable';
import type { TableField } from '../../../types/tableFields.types';
import type { TableRowData } from '../../../types/tableRows.types';
import type { GscKeywordItem, GscPageItem } from '../gscTypes';

// ─── GSC Keywords Table ────────────────────────────────────────────────────

interface GscKeywordsTableProps {
	items: GscKeywordItem[];
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

const keywordFields: TableField[] = [
	{ id: 'query', name: 'query', label: 'Từ khóa', type: 'text', width: 100, wrapText: true },
	{ id: 'clicks', name: 'clicks', label: 'Clicks', type: 'text', width: 70, align: 'center', sortable: true },
	{ id: 'impressions', name: 'impressions', label: 'Impr.', type: 'text', width: 72, align: 'center', sortable: true },
	{
		id: 'ctr', name: 'ctr', label: 'CTR', type: 'custom', width: 68, align: 'center', sortable: true,
		renderCell: (row: TableRowData) => `${((row.ctr as number) * 100).toFixed(1)}%`,
	},
	{
		id: 'position', name: 'position', label: 'Pos.', type: 'custom', width: 65, align: 'center', sortable: true,
		renderCell: (row: TableRowData) => (row.position as number).toFixed(1),
	},
];

export function GscKeywordsTable({ items, loading, page, limit, total, sortBy, sortOrder, onPageChange, onRowsPerPageChange, onSort }: GscKeywordsTableProps) {
	const data: TableRowData[] = items.map((item) => ({
		...item,
		id: item.query,
	}));

	return (
		<CustomTable
			fields={keywordFields}
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
		/>
	);
}


interface GscPagesTableProps {
	items: GscPageItem[];
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

function extractPath(url: string): string {
	try {
		return new URL(url).pathname;
	} catch {
		return url;
	}
}

const pageFields: TableField[] = [
	{
		id: 'page', name: 'page', label: 'Trang', type: 'custom', width: 100, wrapText: true,
		renderCell: (row: TableRowData) => extractPath(row.page as string),
	},
	{ id: 'clicks', name: 'clicks', label: 'Clicks', type: 'text', width: 70, align: 'center', sortable: true },
	{ id: 'impressions', name: 'impressions', label: 'Impr.', type: 'text', width: 72, align: 'center', sortable: true },
	{
		id: 'ctr', name: 'ctr', label: 'CTR', type: 'custom', width: 68, align: 'center', sortable: true,
		renderCell: (row: TableRowData) => `${((row.ctr as number) * 100).toFixed(1)}%`,
	},
	{
		id: 'position', name: 'position', label: 'Pos.', type: 'custom', width: 65, align: 'center', sortable: true,
		renderCell: (row: TableRowData) => (row.position as number).toFixed(1),
	},
];

export function GscPagesTable({ items, loading, page, limit, total, sortBy, sortOrder, onPageChange, onRowsPerPageChange, onSort }: GscPagesTableProps) {
	const data: TableRowData[] = items.map((item) => ({
		...item,
		id: item.page,
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
		/>
	);
}
