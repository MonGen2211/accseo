import { Box, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CustomTable from '../../../components/custom-table/CustomTable';
import type { TableField } from '../../../types/tableFields.types';
import type { KeywordGroup } from '../types';

interface KeywordGroupTableProps {
	data: KeywordGroup[];
	loading: boolean;
	total: number;
	page: number;
	limit: number;
	generateAiLoading?: boolean;
	deleteLoadingId?: string | null;
	statusLoadingId?: string | null;
	onPageChange: (newPage: number) => void;
	onRowsPerPageChange: (newLimit: number) => void;
	onOpenCreate: () => void;
	onAiGenerate?: () => void;
	onDelete?: (row: import('../../../types/tableRows.types').TableRowData) => void;
	onStatusChange?: (row: import('../../../types/tableRows.types').TableRowData, newStatus: string) => void;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	onSort?: (field: string) => void;
	statusFilter?: string;
	onStatusFilterChange?: (status: string) => void;
}

export function KeywordGroupTable({
	data,
	loading,
	total,
	page,
	limit,
	generateAiLoading = false,
	onPageChange,
	onRowsPerPageChange,
	onOpenCreate,
	onAiGenerate,
	deleteLoadingId = null,
	statusLoadingId = null,
	onDelete,
	onStatusChange,
	sortBy,
	sortOrder,
	onSort,
	statusFilter,
	onStatusFilterChange,
}: KeywordGroupTableProps) {
	const fields: TableField[] = [
		{ id: 'stt', name: 'stt', label: 'STT', type: 'text', width: 80, align: 'center' },
		{ id: 'name', name: 'name', label: 'Tên Bộ Keywords', type: 'text', width: 350, sortable: true },
		{
			id: 'status',
			name: 'status',
			label: 'Trạng thái',
			type: 'status',
			width: 150,
			statusType: 'keyword',
			sortable: true,
		},
		{
			id: 'createdAt',
			name: 'createdAt',
			label: 'Ngày tạo',
			type: 'date',
			width: 200,
			sortable: true,
		},
		{
			id: 'actions',
			name: 'actions',
			label: 'Thao tác',
			type: 'actions',
			width: 120,
			align: 'center',
		},
	];

	const displayData = data.map((item, index) => ({
		...item,
		stt: page * limit + index + 1
	}));

	const statusOptions = [
		{ value: '', label: 'Tất cả trạng thái' },
		{ value: 'pending_approval', label: 'Chờ phê duyệt' },
		{ value: 'not_started', label: 'Chưa triển khai' },
		{ value: 'in_progress', label: 'Đang triển khai' },
		{ value: 'deployed', label: 'Đã triển khai' },
	];

	const extraFilters = onStatusFilterChange ? (
		<FormControl size="small" sx={{ minWidth: 200 }}>
			<InputLabel id="status-filter-label" sx={{ fontSize: '14px', top: '-1px' }}>Trạng thái</InputLabel>
			<Select
				labelId="status-filter-label"
				label="Trạng thái"
				value={statusFilter || ''}
				onChange={(e) => onStatusFilterChange(e.target.value)}
				sx={{
					bgcolor: '#fff',
					borderRadius: 2,
					height: 40,
					'& .MuiSelect-select': { py: 1, fontSize: '14px' }
				}}
			>
				{statusOptions.map((opt) => (
					<MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '14px' }}>
						{opt.label}
					</MenuItem>
				))}
			</Select>
		</FormControl>
	) : undefined;

	const headerActions = (
		<Box sx={{ display: 'flex', gap: 2 }}>
			{onAiGenerate && (
				<Button
					variant="contained"
					color="secondary"
					disabled={generateAiLoading}
					onClick={onAiGenerate}
					sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
				>
					{generateAiLoading ? 'Đang tạo bằng AI...' : 'Tạo bằng AI'}
				</Button>
			)}
			<Button
				variant="contained"
				color="primary"
				startIcon={<AddIcon />}
				onClick={onOpenCreate}
				sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
			>
				Tạo mới
			</Button>
		</Box>
	);

	return (
		<Box>
			<CustomTable
				fields={fields}
				data={displayData as import('../../../types/tableRows.types').TableRowData[]}
				loading={loading}
				actionLoadingId={deleteLoadingId || statusLoadingId}
				onDelete={onDelete}
				onStatusChange={onStatusChange}
				page={page}
				rowsPerPage={limit}
				totalCount={total}
				onPageChange={onPageChange}
				onRowsPerPageChange={onRowsPerPageChange}
				enablePagination
				extraFilters={extraFilters}
				headerActions={headerActions}
				sortBy={sortBy}
				sortOrder={sortOrder}
				onSort={onSort}
			/>
		</Box>
	);
}
