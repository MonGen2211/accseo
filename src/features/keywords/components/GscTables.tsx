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
	{ id: 'stt', name: 'stt', label: 'STT', type: 'text', width: 60, align: 'center' },
	{ id: 'query', name: 'query', label: 'Từ khóa', type: 'text', width: 180, ellipsis: true },
	{ id: 'clicks', name: 'clicks', label: 'Clicks', type: 'text', width: 100, align: 'center', sortable: true },
	{ id: 'impressions', name: 'impressions', label: 'Impressions', type: 'text', width: 180, align: 'center', sortable: true },
	{
		id: 'ctr',
		name: 'ctr',
		label: 'CTR',
		type: 'custom',
		width: 130,
		align: 'center',
		sortable: true,
		renderCell: (row: TableRowData) => `${((row.ctr as number) * 100).toFixed(2)}%`,
	},
	{
		id: 'position',
		name: 'position',
		label: 'Position',
		type: 'custom',
		width: 150,
		align: 'center',
		sortable: true,
		renderCell: (row: TableRowData) => (row.position as number).toFixed(1),
	},
];

export function GscKeywordsTable({ items, loading, page, limit, total, sortBy, sortOrder, onPageChange, onRowsPerPageChange, onSort }: GscKeywordsTableProps) {
	const data: TableRowData[] = items.map((item, index) => ({
		...item,
		id: item.query,
		stt: (page - 1) * limit + index + 1,
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

// ─── GSC Pages Table ───────────────────────────────────────────────────────

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
	{ id: 'stt', name: 'stt', label: 'STT', type: 'text', width: 60, align: 'center' },
	{
		id: 'page',
		name: 'page',
		label: 'Trang',
		type: 'custom',
		width: 220,
		ellipsis: true,
		renderCell: (row: TableRowData) => extractPath(row.page as string),
	},
	{ id: 'clicks', name: 'clicks', label: 'Clicks', type: 'text', width: 80, align: 'right', sortable: true },
	{ id: 'impressions', name: 'impressions', label: 'Impressions', type: 'text', width: 100, align: 'right', sortable: true },
	{
		id: 'ctr',
		name: 'ctr',
		label: 'CTR',
		type: 'custom',
		width: 80,
		align: 'right',
		sortable: true,
		renderCell: (row: TableRowData) => `${((row.ctr as number) * 100).toFixed(2)}%`,
	},
	{
		id: 'position',
		name: 'position',
		label: 'Position',
		type: 'custom',
		width: 80,
		align: 'right',
		sortable: true,
		renderCell: (row: TableRowData) => (row.position as number).toFixed(1),
	},
];

export function GscPagesTable({ items, loading, page, limit, total, sortBy, sortOrder, onPageChange, onRowsPerPageChange, onSort }: GscPagesTableProps) {
	const data: TableRowData[] = items.map((item, index) => ({
		...item,
		id: item.page,
		stt: (page - 1) * limit + index + 1,
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
