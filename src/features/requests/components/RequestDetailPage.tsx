import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Autocomplete from '@mui/material/Autocomplete';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchRequestById, fetchAuditLogs, claimRequest, resolveRequest, cancelRequest, reassignRequest, clearCurrent } from '../requestSlice';
import { TypeBadge, PriorityBadge, StatusBadge, getDueDateInfo } from './RequestBadges';
import { useToastify } from '../../../components/Toastify';
import { userService } from '../../users/userService';
import KeywordGroupReviewPanel from './KeywordGroupReviewPanel';
import type { UserProfile } from '../../../types/user.types';

export default function RequestDetailPage() {
	const { id } = useParams<{ id: string }>();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { showToast } = useToastify();
	const { current, auditLogs, loading, actionLoading, error } = useAppSelector((s) => s.requests);
	const currentUser = useAppSelector((s) => s.auth.user);

	const [resolveOpen, setResolveOpen] = useState(false);
	const [resolveAction, setResolveAction] = useState<'DONE' | 'REJECTED'>('DONE');
	const [resolveNote, setResolveNote] = useState('');

	const [reassignOpen, setReassignOpen] = useState(false);
	const [reassignUser, setReassignUser] = useState<UserProfile | null>(null);
	const [reassignNote, setReassignNote] = useState('');
	const [userOptions, setUserOptions] = useState<UserProfile[]>([]);
	const [userSearch, setUserSearch] = useState('');
	const [userInputValue, setUserInputValue] = useState('');

	const [cancelOpen, setCancelOpen] = useState(false);

	useEffect(() => {
		if (!id) return;
		dispatch(fetchRequestById(id));
		dispatch(fetchAuditLogs(id));
		return () => { dispatch(clearCurrent()); };
	}, [dispatch, id]);

	useEffect(() => {
		if (!reassignOpen) return;
		userService.getAssignable(userSearch, false, 'REVIEWER').then(setUserOptions);
	}, [userSearch, reassignOpen]);

	if (loading) {
		return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
	}

	if (!current) {
		return (
			<Box sx={{ p: 3, textAlign: 'center' }}>
				<Typography sx={{ color: 'text.secondary', mb: 2 }}>
					{error ?? 'Không tìm thấy yêu cầu hoặc bạn không có quyền xem.'}
				</Typography>
				<Button variant="outlined" onClick={() => navigate(-1)} sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>Quay lại</Button>
			</Box>
		);
	}

	const isOwner = currentUser?.id === current.fromUser?.id;
	const isAdmin = currentUser?.role === 'ADMIN';
	const canClaim = current.status === 'PENDING' && !current.splitMode && (
		current.assignmentType !== 'user' || currentUser?.id === current.toUser?.id
	);
	const canResolve = current.status === 'IN_PROGRESS' && (
		current.splitMode
			? current.participants.some((p) => p.user.id === currentUser?.id && p.status !== 'DONE' && p.status !== 'REJECTED')
			: current.claimedBy?.id === currentUser?.id
	);
	const canCancel = isOwner || isAdmin;
	const canReassign = (isOwner || isAdmin) && !['DONE', 'CANCELLED', 'REJECTED'].includes(current.status);

	const due = getDueDateInfo(current.dueDate);
	const doneCount = current.participants.filter((p) => p.status === 'DONE').length;

	const reload = () => {
		if (id) { dispatch(fetchRequestById(id)); dispatch(fetchAuditLogs(id)); }
	};

	const handleClaim = async () => {
		const result = await dispatch(claimRequest(current.id));
		if (!result.type.endsWith('/rejected')) { showToast('Nhận việc thành công', 'success'); reload(); }
		else showToast(String((result as { payload?: unknown }).payload ?? 'Lỗi'), 'danger');
	};

	const handleResolve = async () => {
		const result = await dispatch(resolveRequest({ id: current.id, data: { action: resolveAction, note: resolveNote || undefined } }));
		if (!result.type.endsWith('/rejected')) {
			showToast(resolveAction === 'DONE' ? 'Hoàn thành' : 'Đã từ chối', 'success');
			setResolveOpen(false);
			reload();
		} else showToast(String((result as { payload?: unknown }).payload ?? 'Lỗi'), 'danger');
	};

	const handleCancel = async () => {
		const result = await dispatch(cancelRequest(current.id));
		if (!result.type.endsWith('/rejected')) { showToast('Đã huỷ yêu cầu', 'success'); setCancelOpen(false); reload(); }
		else showToast(String((result as { payload?: unknown }).payload ?? 'Lỗi'), 'danger');
	};

	const handleReassign = async () => {
		if (!reassignUser) return;
		const result = await dispatch(reassignRequest({ id: current.id, data: { toUserId: reassignUser.id, note: reassignNote || undefined } }));
		if (!result.type.endsWith('/rejected')) {
			showToast('Đã chuyển người xử lý', 'success');
			setReassignOpen(false); setReassignUser(null); setReassignNote('');
			setUserSearch(''); setUserInputValue('');
			reload();
		} else showToast(String((result as { payload?: unknown }).payload ?? 'Lỗi'), 'danger');
	};

	return (
		<Box sx={{ p: 3, pb: 10, zoom: 0.8 }}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
				<IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
				<Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>{current.title}</Typography>
			</Box>

			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					{/* Header badges */}
					<Paper sx={{ p: 2 }}>
						<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
							<TypeBadge type={current.type} />
							<PriorityBadge priority={current.priority} />
							<StatusBadge status={current.status} />
						</Box>

						{due && (
							<Chip icon={<AccessTimeIcon />} label={due.label} size="small" color={due.color} variant="outlined" sx={{ mb: 2 }} />
						)}

						{/* Info grid */}
						<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
							<Box>
								<Typography variant="caption" sx={{ color: 'text.secondary' }}>Người gửi</Typography>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
									<Avatar src={current.fromUser?.imgAvatar} sx={{ width: 28, height: 28, fontSize: 12 }}>{current.fromUser?.name?.[0]}</Avatar>
									<Typography variant="body2" sx={{ fontWeight: 500 }}>{current.fromUser?.name}</Typography>
								</Box>
							</Box>

							{current.claimedBy && (
								<Box>
									<Typography variant="caption" sx={{ color: 'text.secondary' }}>
										{current.status === 'DONE' || current.status === 'REJECTED' ? 'Đã xử lý' : 'Đang xử lý'}
									</Typography>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
										<Avatar src={current.claimedBy.imgAvatar} sx={{ width: 28, height: 28, fontSize: 12 }}>{current.claimedBy.name?.[0]}</Avatar>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>{current.claimedBy.name}</Typography>
									</Box>
								</Box>
							)}

							{current.toUser && !current.claimedBy && (
								<Box>
									<Typography variant="caption" sx={{ color: 'text.secondary' }}>Người nhận</Typography>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
										<Avatar src={current.toUser.imgAvatar} sx={{ width: 28, height: 28, fontSize: 12 }}>{current.toUser.name?.[0]}</Avatar>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>{current.toUser.name}</Typography>
									</Box>
								</Box>
							)}

							{current.toRole && (
								<Box>
									<Typography variant="caption" sx={{ color: 'text.secondary' }}>Vai trò nhận</Typography>
									<Chip label={current.toRole} size="small" icon={<PersonIcon />} sx={{ mt: 0.5 }} />
								</Box>
							)}

							{current.toGroup && (
								<Box>
									<Typography variant="caption" sx={{ color: 'text.secondary' }}>Nhóm nhận</Typography>
									<Typography variant="body2" sx={{ fontWeight: 500 }}>{current.toGroup.name}</Typography>
								</Box>
							)}

							{current.dueDate && (
								<Box>
									<Typography variant="caption" sx={{ color: 'text.secondary' }}>Hạn chót</Typography>
									<Typography variant="body2">{new Date(current.dueDate).toLocaleString('vi-VN')}</Typography>
								</Box>
							)}
						</Box>

						{current.description && (
							<>
								<Divider sx={{ mb: 1.5 }} />
								<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>
									Mô tả
								</Typography>
								<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{current.description}</Typography>
							</>
						)}

						{current.completionNote && (
							<Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
								<Typography variant="caption" color="text.secondary">Ghi chú hoàn thành</Typography>
								<Typography variant="body2">{current.completionNote}</Typography>
							</Box>
						)}
					</Paper>

					{/* Keyword group review panel */}
					{current.refType === 'keyword_group' && current.refId && (
						<KeywordGroupReviewPanel
							refId={current.refId}
							requestId={current.id}
							requestStatus={current.status}
							onActionDone={reload}
						/>
					)}

					{/* Participants (splitMode) */}
					{current.splitMode && current.participants.length > 0 && (
						<Paper sx={{ p: 2 }}>
							<Typography sx={{ fontWeight: 600, mb: 1.5 }}>
								Participants — {doneCount}/{current.participants.length} hoàn thành
							</Typography>
							<LinearProgress variant="determinate" value={(doneCount / current.participants.length) * 100} sx={{ mb: 2, borderRadius: 1 }} />
							{current.participants.map((p) => (
								<Box key={p.user.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
									<Avatar src={p.user.imgAvatar} sx={{ width: 32, height: 32, fontSize: 13 }}>{p.user.name?.[0]}</Avatar>
									<Box sx={{ flex: 1 }}>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>{p.user.name}</Typography>
										{p.note && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{p.note}</Typography>}
									</Box>
									<StatusBadge status={p.status} />
								</Box>
							))}
						</Paper>
					)}

				{/* Action buttons */}
				<Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
					{canClaim && (
						<Button variant="contained" onClick={handleClaim} disabled={actionLoading} sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>Nhận việc</Button>
					)}
					{canResolve && current.type !== 'KEYWORD_APPROVAL' && (
						<Button variant="contained" color="success" onClick={() => { setResolveAction('DONE'); setResolveNote(''); setResolveOpen(true); }} sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
							Hoàn thành / Từ chối
						</Button>
					)}
					{canReassign && (
						<Button variant="outlined" onClick={() => { setReassignUser(null); setReassignNote(''); setUserSearch(''); setUserInputValue(''); setReassignOpen(true); }} sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
							Chuyển người
						</Button>
					)}
					{canCancel && !['DONE', 'CANCELLED', 'REJECTED'].includes(current.status) && (
						<Button variant="outlined" color="error" onClick={() => setCancelOpen(true)} sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>Huỷ yêu cầu</Button>
					)}
				</Box>

				{/* Audit log */}
				<Paper sx={{ p: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
						<HistoryIcon fontSize="small" />
						<Typography sx={{ fontWeight: 600 }}>Lịch sử</Typography>
					</Box>
					{auditLogs.length === 0 && (
						<Typography variant="caption" sx={{ color: 'text.secondary' }}>Chưa có hoạt động</Typography>
					)}
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0, columnGap: 4 }}>
						{auditLogs.map((log, i) => (
							<Box key={log.id ?? i} sx={{ display: 'flex', gap: 1.5, mb: 2, position: 'relative', minWidth: 220 }}>
								{i < auditLogs.length - 1 && (
									<Box sx={{ position: 'absolute', left: 12, top: 28, bottom: -8, width: 1, bgcolor: 'divider' }} />
								)}
								<Avatar src={log.performedBy?.imgAvatar} sx={{ width: 24, height: 24, fontSize: 11, flexShrink: 0 }}>
									{log.performedBy?.name?.[0]}
								</Avatar>
								<Box>
									<Typography variant="caption" sx={{ fontWeight: 600 }}>{log.performedBy?.name}</Typography>
									<Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>{log.action}</Typography>
									{log.note && <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontStyle: 'italic' }}>"{log.note}"</Typography>}
									<Typography variant="caption" sx={{ color: 'text.disabled' }}>{new Date(log.createdAt).toLocaleString('vi-VN')}</Typography>
								</Box>
							</Box>
						))}
					</Box>
				</Paper>
			</Box>

			{/* Resolve Dialog */}
			<Dialog open={resolveOpen} onClose={() => setResolveOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '28px' } }}>
				<DialogTitle sx={{ fontWeight: 800 }}>Xử lý yêu cầu</DialogTitle>
				<Divider />
				<DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2.5, maxHeight: '70vh', overflowY: 'auto' }}>
					<RadioGroup value={resolveAction} onChange={(e) => setResolveAction(e.target.value as 'DONE' | 'REJECTED')} row>
						<FormControlLabel value="DONE" control={<Radio color="success" />} label="Hoàn thành" />
						<FormControlLabel value="REJECTED" control={<Radio color="error" />} label="Từ chối" />
					</RadioGroup>
					<TextField fullWidth multiline rows={3} label="Ghi chú (tuỳ chọn)" value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
				</DialogContent>
				<Divider />
				<DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
					<Button onClick={() => setResolveOpen(false)} sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>Huỷ</Button>
					<Button variant="contained" onClick={handleResolve} disabled={actionLoading} color={resolveAction === 'DONE' ? 'success' : 'error'} sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
						{resolveAction === 'DONE' ? 'Xác nhận hoàn thành' : 'Xác nhận từ chối'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Reassign Dialog */}
			<Dialog open={reassignOpen} onClose={() => setReassignOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '28px' } }}>
				<DialogTitle sx={{ fontWeight: 800 }}>Chuyển người xử lý</DialogTitle>
				<Divider />
				<DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2.5, maxHeight: '70vh', overflowY: 'auto' }}>
					<Autocomplete
						options={userOptions}
						getOptionLabel={(u) => `${u.name} (${u.email})`}
						isOptionEqualToValue={(opt, val) => opt.id === val.id}
						value={reassignUser}
						onChange={(_, v) => setReassignUser(v)}
						inputValue={userInputValue}
						onInputChange={(_, v, reason) => {
							if (reason === 'reset') return;
							setUserInputValue(v);
							if (reason === 'input') setUserSearch(v);
						}}
						clearOnBlur={false}
						filterOptions={(x) => x}
						renderInput={(params) => <TextField {...params} label="Tìm người xử lý" size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
					/>

					<TextField multiline rows={2} label="Ghi chú (tuỳ chọn)" value={reassignNote} onChange={(e) => setReassignNote(e.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
				</DialogContent>
				<Divider />
				<DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
					<Button onClick={() => setReassignOpen(false)} sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>Huỷ</Button>
					<Button variant="contained" onClick={handleReassign} disabled={!reassignUser || actionLoading} sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>Xác nhận</Button>
				</DialogActions>
			</Dialog>

			{/* Cancel Dialog */}
			<Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} PaperProps={{ sx: { borderRadius: '28px' } }}>
				<DialogTitle sx={{ fontWeight: 800 }}>Huỷ yêu cầu</DialogTitle>
				<Divider />
				<DialogContent sx={{ pt: 2, maxHeight: '70vh', overflowY: 'auto' }}>
					<Typography>Bạn có chắc muốn huỷ yêu cầu này?</Typography>
				</DialogContent>
				<Divider />
				<DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
					<Button onClick={() => setCancelOpen(false)} sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>Không</Button>
					<Button variant="contained" color="error" onClick={handleCancel} disabled={actionLoading} sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>Huỷ yêu cầu</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
