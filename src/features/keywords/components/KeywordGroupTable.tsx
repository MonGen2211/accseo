import { Box, Button, Select, MenuItem, FormControl, InputLabel, Link } from '@mui/material';
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
	generateAiGroupsLoading?: boolean;
	deleteLoadingId?: string | null;
	statusLoadingId?: string | null;
	onPageChange: (newPage: number) => void;
	onRowsPerPageChange: (newLimit: number) => void;
	onOpenCreate: () => void;
	onAiGenerateByGroups?: () => void;
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
	generateAiGroupsLoading = false,
	onPageChange,
	onRowsPerPageChange,
	onOpenCreate,
	onAiGenerateByGroups,
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
		{
			id: 'name',
			name: 'name',
			label: 'Tên Bộ Keywords',
			width: 120,
			sortable: true,
			renderCell: (row: TableRowData) => (
				<Link
					href={`https://trends.google.com.vn/trends/explore?date=today%203-m&geo=VN&q=${encodeURIComponent(String(row.name))}&hl=vi`}
					target="_blank"
					rel="noopener noreferrer"
					underline="hover"
				>
					{String(row.name)}
				</Link>
			)
		},
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

	const aiButtonSx = (loading: boolean, gradient: string, hoverGradient: string, shadowColor: string) => ({
		borderRadius: 2,
		textTransform: 'none' as const,
		fontWeight: 700,
		position: 'relative' as const,
		overflow: 'hidden',
		background: gradient,
		boxShadow: `0 3px 5px 2px ${shadowColor}`,
		color: 'white',
		transition: 'all 0.2s',
		'&:hover': {
			transform: 'scale(1.02)',
			background: hoverGradient,
			boxShadow: `0 4px 8px 3px ${shadowColor}`,
		},
		...(loading && {
			background: '#94a3b8',
			boxShadow: 'none',
			animation: 'aiPulse 1.5s ease-in-out infinite',
			'@keyframes aiPulse': {
				'0%, 100%': { opacity: 1 },
				'50%': { opacity: 0.6 },
			},
		}),
	});

	const headerActions = (
		<Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
			{onAiGenerateByGroups && (
				<Button
					variant="contained"
					onClick={onAiGenerateByGroups}
					startIcon={!generateAiGroupsLoading && <AutoAwesomeIcon />}
					sx={aiButtonSx(
						generateAiGroupsLoading,
						'linear-gradient(45deg, #6366f1 30%, #8b5cf6 90%)',
						'linear-gradient(45deg, #8b5cf6 30%, #6366f1 90%)',
						'rgba(99, 102, 241, .3)',
					)}
				>
					{generateAiGroupsLoading ? 'Đang tạo bằng AI... (Xem tiến trình)' : 'Tạo bằng AI'}
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
