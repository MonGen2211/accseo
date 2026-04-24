import React, { useState, useMemo } from 'react';
import {
	Box,
	Table,
	Paper,
	Dialog,
	TableRow,
	TableBody,
	TableCell,
	TableHead,
	Pagination,
	PaginationItem,
	Select,
	MenuItem,
	IconButton,
	Typography,
	TableContainer,
	Button,
	TextField,
	InputAdornment,
	CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SelectStatus from '../custom-status/SelectStatus';
import { Loading } from '../Loading/loading';
import type { TableField } from '../../types/tableFields.types';
import type { TableRowData } from '../../types/tableRows.types';

export interface CustomTableProps {
	fields: TableField[];
	data: TableRowData[];
	onEdit?: (row: TableRowData) => void;
	onDelete?: (row: TableRowData) => void;
	onCheck?: (row: TableRowData) => void;
	onStatusChange?: (row: TableRowData, newStatus: string) => void;
	minWidth?: number | string;
	enablePagination?: boolean;
	loading?: boolean;
	actionLoadingId?: string | null;

	// Server-side pagination support
	page?: number;
	rowsPerPage?: number;
	totalCount?: number;
	onPageChange?: (newPage: number) => void;
	onRowsPerPageChange?: (newLimit: number) => void;

	// Sort support
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	onSort?: (field: string) => void;

	// Bổ sung phần Toolbar Search & Actions
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	searchPlaceholder?: string;
	extraFilters?: React.ReactNode;
	headerActions?: React.ReactNode;
}

export function CustomTable({
	fields,
	data,
	onEdit,
	onCheck,
	onDelete,
	onStatusChange,
	minWidth,
	enablePagination = true,
	loading = false,
	actionLoadingId = null,
	page: externalPage,
	rowsPerPage: externalRowsPerPage,
	totalCount: externalTotalCount,
	onPageChange,
	onRowsPerPageChange,
	sortBy,
	sortOrder = 'desc',
	onSort,
	searchValue,
	onSearchChange,
	searchPlaceholder,
	extraFilters,
	headerActions,
}: CustomTableProps) {
	const [localPage, setLocalPage] = useState(0);
	const [localRowsPerPage, setLocalRowsPerPage] = useState(10);

	const page = externalPage !== undefined ? externalPage : localPage;
	const rowsPerPage = externalRowsPerPage !== undefined ? externalRowsPerPage : localRowsPerPage;
	const totalCount = externalTotalCount !== undefined ? externalTotalCount : data.length;

	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<TableRowData | null>(null);

	const visibleFields = useMemo(() => fields.filter((f) => f.type !== 'hide'), [fields]);

	const calculatedMinWidth = useMemo(() => {
		return visibleFields.reduce((sum, field) => {
			const w = typeof field.width === 'number' ? field.width : parseInt(String(field.width)) || 150;
			return sum + w;
		}, 0);
	}, [visibleFields]);

	const tableMinWidth = minWidth ?? calculatedMinWidth;

	const handlePaginationChange = (_event: React.ChangeEvent<unknown>, value: number) => {
		if (onPageChange) {
			onPageChange(value - 1);
		} else {
			setLocalPage(value - 1);
		}
	};

	const handleChangeRowsPerPage = (event: { target: { value: unknown } }) => {
		const newLimit = parseInt(String(event.target.value), 10);
		if (onRowsPerPageChange) {
			onRowsPerPageChange(newLimit);
		} else {
			setLocalRowsPerPage(newLimit);
			setLocalPage(0);
		}
	};

	const displayedData = enablePagination && externalTotalCount === undefined
		? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
		: data;

	const handleDeleteClick = (row: TableRowData) => {
		setItemToDelete(row);
		setDeleteModalOpen(true);
	};

	const handleDeleteConfirm = () => {
		if (itemToDelete && onDelete) {
			onDelete(itemToDelete);
		}
		setDeleteModalOpen(false);
		setItemToDelete(null);
	};

	const handleDeleteCancel = () => {
		setDeleteModalOpen(false);
		setItemToDelete(null);
	};

	const renderCellContent = (field: TableField, row: TableRowData) => {
		if (field.renderCell) {
			return field.renderCell(row);
		}

		const value = row[field.id];
		const id = row.id || row._id || '';
		const isRowLoading = actionLoadingId === id;

		switch (field.type) {
			case 'status':
				return (
					<SelectStatus
						type={field.statusType || 'user'}
						value={String(value)}
						disabled={field.statusReadonly}
						onChange={(newStatus) => onStatusChange && onStatusChange(row, newStatus)}
					/>
				);

			case 'actions':
				return (
					<Box
						sx={{
							display: 'flex',
							gap: 1,
							justifyContent:
								field.align === 'center'
									? 'center'
									: field.align === 'right'
										? 'flex-end'
										: 'flex-start',
							alignItems: 'center',
						}}
					>
						{onCheck && (
							<IconButton size="small" color="success" onClick={() => onCheck(row)} title="Kiểm tra" disabled={isRowLoading}>
								{isRowLoading ? <CircularProgress size={16} color="inherit" /> : <CheckIcon fontSize="small" />}
							</IconButton>
						)}
						{onEdit && (
							<IconButton size="small" color="primary" onClick={() => onEdit(row)} title="Chỉnh sửa" disabled={isRowLoading}>
								{isRowLoading ? <CircularProgress size={16} color="inherit" /> : <EditIcon fontSize="small" />}
							</IconButton>
						)}
						{onDelete && (
							<IconButton size="small" color="error" onClick={() => handleDeleteClick(row)} title="Xóa" disabled={isRowLoading}>
								{isRowLoading ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon fontSize="small" />}
							</IconButton>
						)}
					</Box>
				);

			case 'date':
				if (!value) return '-';
				try {
					return new Date(value).toLocaleDateString('vi-VN', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
						hour: '2-digit',
						minute: '2-digit',
					});
				} catch {
					return String(value);
				}

			case 'text':
			default:
				return value ?? '-';
		}
	};

	return (
		<Paper sx={{ mx: 3, mb: 3, minWidth: 0, overflow: 'hidden' }} variant="outlined">
			{(onSearchChange || extraFilters || headerActions) && (
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #f1f5f9', gap: 2, flexWrap: 'wrap' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, flexWrap: 'wrap' }}>
						{onSearchChange && (
							<TextField
								size="small"
								placeholder={searchPlaceholder || 'Tìm kiếm...'}
								value={searchValue || ''}
								onChange={(e) => onSearchChange(e.target.value)}
								sx={{
									minWidth: 260,
									'& .MuiOutlinedInput-root': {
										borderRadius: 2,
										bgcolor: '#fff',
										height: 40,
										'& fieldset': { borderColor: '#e2e8f0' },
										'&:hover fieldset': { borderColor: '#cbd5e1' },
									}
								}}
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
											</InputAdornment>
										),
									}
								}}
							/>
						)}
						{extraFilters}
					</Box>
					{headerActions && <Box>{headerActions}</Box>}
				</Box>
			)}
			<TableContainer
				sx={{
					maxHeight: 600,
					overflowX: 'auto',
					'&::-webkit-scrollbar': { height: 8 },
					'&::-webkit-scrollbar-track': { backgroundColor: '#f1f5f9', borderRadius: 4 },
					'&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: 4 },
					'&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#94a3b8' }
				}}
			>
				<Table stickyHeader size="small" sx={{ minWidth: tableMinWidth, tableLayout: 'fixed' }}>
					<TableHead>
						<TableRow>
							{visibleFields.map((field) => {
								const isSortable = field.sortable && onSort;
								const isActiveSort = sortBy === field.name;
								return (
									<TableCell
										key={field.id}
										align={field.align || 'left'}
										sx={{
											width: field.width,
											minWidth: field.width,
											maxWidth: field.width,
											fontWeight: 600,
											backgroundColor: '#f8fafc',
											color: '#334155',
											whiteSpace: 'normal',
											wordBreak: 'break-word',
											borderBottom: '2px solid #e2e8f0',
											cursor: isSortable ? 'pointer' : 'default',
											userSelect: isSortable ? 'none' : undefined,
											'&:hover': isSortable ? { backgroundColor: '#eef2f7' } : {},
										}}
										onClick={isSortable ? () => onSort(field.name) : undefined}
									>
										<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
											{field.label}
											{isSortable && isActiveSort && (
												sortOrder === 'asc'
													? <ArrowUpwardIcon sx={{ fontSize: 14, color: 'primary.main' }} />
													: <ArrowDownwardIcon sx={{ fontSize: 14, color: 'primary.main' }} />
											)}
										</Box>
									</TableCell>
								);
							})}
						</TableRow>
					</TableHead>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={visibleFields.length} align="center" padding="none">
									<Loading />
								</TableCell>
							</TableRow>
						) : displayedData.length === 0 ? (
							<TableRow>
								<TableCell colSpan={visibleFields.length} align="center" sx={{ py: 6 }}>
									<Typography variant="body1" color="text.secondary">
										Chưa có dữ liệu
									</Typography>
								</TableCell>
							</TableRow>
						) : (
							displayedData.map((row, rowIndex) => (
								<TableRow hover key={row.id || rowIndex}>
									{visibleFields.map((field) => (
										<TableCell
											key={field.id}
											align={field.align || 'left'}
											sx={{
												width: field.width,
												minWidth: field.width,
												maxWidth: field.width,
												whiteSpace: field.type === 'actions' || field.type === 'status' ? 'normal' : 'nowrap',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												verticalAlign: 'middle',
											}}
											title={field.type === 'text' && typeof row[field.id] === 'string' ? row[field.id] : undefined}
										>
											{renderCellContent(field, row)}
										</TableCell>
									))}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</TableContainer>
			{enablePagination && totalCount > 0 && (
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, flexWrap: 'wrap', gap: 2 }}>
					<Typography sx={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
						Showing {displayedData.length} data out of {totalCount}
					</Typography>

					<Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
							<Typography sx={{ color: '#64748b', fontSize: '14px' }}>Display:</Typography>
							<Select
								size="small"
								value={rowsPerPage}
								onChange={handleChangeRowsPerPage}
								sx={{
									height: 36,
									borderRadius: 2,
									bgcolor: '#fff',
									color: '#334155',
									'& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
									'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
									fontSize: '14px'
								}}
							>
								{[5, 10, 20, 25, 50].map(size => (
									<MenuItem key={size} value={size}>{size}</MenuItem>
								))}
							</Select>
						</Box>

						<Pagination
							count={Math.ceil(totalCount / rowsPerPage)}
							page={page + 1}
							onChange={handlePaginationChange}
							shape="circular"
							renderItem={(item) => (
								<PaginationItem
									{...item}
									sx={{
										margin: '0 2px',
										color: '#64748b',
										borderColor: '#e2e8f0',
										border: '1px solid',
										backgroundColor: '#fff',
										width: 36,
										height: 36,
										fontWeight: 500,
										display: (item.type === 'previous' || item.type === 'next') ? 'flex' : 'inline-flex',
										'&.Mui-selected': {
											backgroundColor: '#f0fdfa !important',
											color: '#0d9488',
											borderColor: '#14b8a6',
											fontWeight: 600,
										},
										'&:hover': {
											backgroundColor: '#f8fafc',
										}
									}}
								/>
							)}
						/>
					</Box>
				</Box>
			)}
			{/* Delete Confirmation Modal */}
			<Dialog
				open={deleteModalOpen}
				onClose={handleDeleteCancel}
				sx={{ '& .MuiDialog-paper': { width: 400, maxWidth: '90%', borderRadius: 2, p: 2 } }}
			>
				<Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
					Xác nhận xóa
				</Typography>
				<Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
					Bạn có chắc chắn muốn xóa dữ liệu này? Hành động này không thể hoàn tác.
				</Typography>
				<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
					<Button onClick={handleDeleteCancel} variant="outlined" color="inherit">
						Hủy
					</Button>
					<Button onClick={handleDeleteConfirm} variant="contained" color="error">
						Xóa
					</Button>
				</Box>
			</Dialog>
		</Paper>
	);
}

export default CustomTable;
