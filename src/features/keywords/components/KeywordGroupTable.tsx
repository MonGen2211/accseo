import { Box, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CustomTable from '../../../components/custom-table/CustomTable';
import type { TableField } from '../../../types/tableFields.types';
import type { KeywordGroup } from '../types';
import type { TableRowData } from '../../../types/tableRows.types';

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
	onDelete?: (row: TableRowData) => void;
	onStatusChange?: (row: TableRowData, newStatus: string) => void;
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
		{ id: 'stt', name: 'stt', label: 'STT', type: 'text', width: 40, align: 'center' },
		{ id: 'name', name: 'name', label: 'Tên Bộ Keywords', type: 'text', width: 120, sortable: true },
		{ id: 'reason', name: 'reason', label: 'Lý do', type: 'text', width: 300, wrapText: true },
		{
			id: 'status',
			name: 'status',
			label: 'Trạng thái',
			type: 'status',
			width: 100,
			statusType: 'keyword',
			sortable: true,
		},
		// { id: 'actions', name: 'actions', label: 'Thao tác', type: 'actions', width: 100, align: 'center' },
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
		<Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
			{onAiGenerate && (
				<Button
					variant="contained"
					onClick={onAiGenerate}
					startIcon={!generateAiLoading && <AutoAwesomeIcon />}
					sx={{
						borderRadius: 2,
						textTransform: 'none',
						fontWeight: 700,
						position: 'relative',
						overflow: 'hidden',
						background: 'linear-gradient(45deg, #f59e0b 30%, #ea580c 90%)',
						boxShadow: '0 3px 5px 2px rgba(234, 88, 12, .3)',
						color: 'white',
						transition: 'all 0.2s',
						'&:hover': {
							transform: 'scale(1.02)',
							background: 'linear-gradient(45deg, #ea580c 30%, #f59e0b 90%)',
							boxShadow: '0 4px 8px 3px rgba(234, 88, 12, .4)',
						},
						...(generateAiLoading && {
							background: '#94a3b8',
							boxShadow: 'none',
							animation: 'aiPulse 1.5s ease-in-out infinite',
							'@keyframes aiPulse': {
								'0%, 100%': { opacity: 1 },
								'50%': { opacity: 0.6 },
							},
						}),
					}}
				>
					{generateAiLoading ? 'Đang tạo bằng AI... (Xem tiến trình)' : 'Tạo bằng AI'}
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
				data={displayData as TableRowData[]}
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
