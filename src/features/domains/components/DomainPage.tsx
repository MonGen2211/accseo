import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchDomains, deleteDomain, createDomain, checkDomainMeta, clearDomainError } from '../domainSlice';
import DomainTable from './DomainTable';
import DomainForm from './DomainForm';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useToastify } from '../../../components/Toastify';

export default function DomainPage() {
	const dispatch = useAppDispatch();
	const { domains, loading, createLoading, actionLoadingId, error, pagination } = useAppSelector((state) => state.domains);
	const [showForm, setShowForm] = useState(false);

	const { showToast } = useToastify();


	useEffect(() => {
		dispatch(fetchDomains({ page: pagination.page, limit: pagination.limit }));
	}, [dispatch, pagination.page, pagination.limit]);

	// Listen for unmount to clear errors
	useEffect(() => {
		return () => {
			dispatch(clearDomainError());
		};
	}, [dispatch]);

	const handlePageChange = (newPage: number) => {
		dispatch(fetchDomains({ page: newPage + 1, limit: pagination.limit }));
	};

	const handleRowsPerPageChange = (newLimit: number) => {
		dispatch(fetchDomains({ page: 1, limit: newLimit }));
	};

	const handleDelete = async (id: string) => {
		const response = await dispatch(deleteDomain(id));
		if (!response.type.endsWith('/rejected')) {
			showToast('Xóa tên miền thành công', 'success');
		} else {
			showToast(response.payload as string || 'Có lỗi xảy ra', 'danger');
		}
	};

	const handleCheckMeta = async (id: string) => {
		const response = await dispatch(checkDomainMeta(id));
		if (!response.type.endsWith('/rejected')) {
			showToast('Kiểm tra meta thành công', 'success');
		} else {
			showToast(response.payload as string || 'Có lỗi xảy ra', 'danger');
		}
	};

	const handleCreateDomain = async (domainString: string) => {
		const action = await dispatch(createDomain(domainString));
		if (!action.type.endsWith('/rejected')) {
			setShowForm(false);
		}
	};

	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 3 }}>
			<Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
				<Box sx={{ px: 3, pt: 3, pb: 1.5 }}>
					<Typography sx={{ fontSize: '20px', fontWeight: 700, color: 'text.primary' }}>
						Danh sách Tên miền
					</Typography>
					{error && (
						<Alert severity="error" sx={{ mt: 2 }}>
							{error}
						</Alert>
					)}
				</Box>

				<Box sx={{ p: 2 }}>
					<DomainTable
						domains={domains}
						loading={loading}
						actionLoadingId={actionLoadingId}
						page={pagination.page - 1}
						rowsPerPage={pagination.limit}
						totalCount={pagination.total}
						onPageChange={handlePageChange}
						onRowsPerPageChange={handleRowsPerPageChange}
						onCheck={handleCheckMeta}
						onDelete={handleDelete}
						headerActions={
							<>
								<Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => setShowForm(true)}>
									Thêm Tên Miền
								</Button>
							</>
						}
					/>
				</Box>
			</Paper>

			<Dialog open={showForm} onClose={() => { if (!createLoading) setShowForm(false); }} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					Thêm Tên Miền
					<IconButton size="small" onClick={() => setShowForm(false)} disabled={createLoading}>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent dividers>
					<DomainForm
						onSubmit={handleCreateDomain}
						onCancel={() => setShowForm(false)}
						loading={createLoading}
						apiError={error}
					/>
				</DialogContent>
			</Dialog>
		</Box>
	);
}
