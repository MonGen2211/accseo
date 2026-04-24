import { Box, Button } from '@mui/material';
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
}: KeywordGroupTableProps) {
	const fields: TableField[] = [
		{ id: 'stt', name: 'stt', label: 'STT', type: 'text', width: 80, align: 'center' },
		{ id: 'name', name: 'name', label: 'Tên Bộ Keywords', type: 'text', width: 350 },
		{
			id: 'status',
			name: 'status',
			label: 'Trạng thái',
			type: 'status',
			width: 150,
			statusType: 'keyword',
		},
		{
			id: 'createdAt',
			name: 'createdAt',
			label: 'Ngày tạo',
			type: 'date',
			width: 200,
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
				headerActions={headerActions}
			/>
		</Box>
	);
}
