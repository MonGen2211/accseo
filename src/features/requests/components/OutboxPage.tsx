import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchOutbox, cancelRequest, reassignRequest } from '../requestSlice';
import { TypeBadge, PriorityBadge, StatusBadge, getDueDateInfo, STATUS_CONFIG } from './RequestBadges';
import { useToastify } from '../../../components/Toastify';
import { userService } from '../../users/userService';
import type { Request } from '../types';
import type { UserProfile } from '../../../types/user.types';

const REQUEST_TYPES = ['KEYWORD_APPROVAL', 'CONTENT_TASK', 'REVIEW', 'DOMAIN_TASK', 'GENERAL'];
const REQUEST_STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE', 'REJECTED', 'CANCELLED'];
const REQUEST_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const TYPE_LABEL: Record<string, string> = {
	KEYWORD_APPROVAL: 'Duyệt từ khoá', CONTENT_TASK: 'Nội dung', REVIEW: 'Review', DOMAIN_TASK: 'Tên miền', GENERAL: 'Chung',
};
const STATUS_LABEL: Record<string, string> = {
	PENDING: 'Chờ xử lý', IN_PROGRESS: 'Đang xử lý', DONE: 'Hoàn thành', REJECTED: 'Từ chối', CANCELLED: 'Đã huỷ',
};
const PRIORITY_LABEL: Record<string, string> = {
	LOW: 'Thấp', NORMAL: 'Bình thường', HIGH: 'Cao', URGENT: 'Khẩn cấp',
};

export default function OutboxPage({ tabsNode }: { tabsNode?: React.ReactNode }) {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { showToast } = useToastify();
	const { outbox, loading, actionLoading, outboxPages } = useAppSelector((s) => s.requests);

	const [page, setPage] = useState(1);
	const [filterType, setFilterType] = useState('');
	const [filterStatus, setFilterStatus] = useState('');
	const [filterPriority, setFilterPriority] = useState('');

	const [cancelTarget, setCancelTarget] = useState<Request | null>(null);
	const [reassignTarget, setReassignTarget] = useState<Request | null>(null);
	const [reassignUser, setReassignUser] = useState<UserProfile | null>(null);
	const [reassignNote, setReassignNote] = useState('');
	const [userOptions, setUserOptions] = useState<UserProfile[]>([]);
	const [userSearch, setUserSearch] = useState('');

	const hasFilter = !!(filterType || filterStatus || filterPriority);

	useEffect(() => {
		dispatch(fetchOutbox({
			page,
			limit: 12,
			type: filterType || undefined,
			status: filterStatus || undefined,
			priority: filterPriority || undefined,
		}));
	}, [dispatch, page, filterType, filterStatus, filterPriority]);

	useEffect(() => {
		if (!reassignTarget) return;
		userService.getAssignable(userSearch).then(setUserOptions);
	}, [userSearch, reassignTarget]);

	const handleCancel = async () => {
		if (!cancelTarget) return;
		const result = await dispatch(cancelRequest(cancelTarget.id));
		if (!result.type.endsWith('/rejected')) {
			showToast('Đã huỷ yêu cầu', 'success');
			setCancelTarget(null);
			dispatch(fetchOutbox({ page, limit: 12 }));
		} else {
			showToast(String((result as { payload?: unknown }).payload ?? 'Lỗi'), 'danger');
		}
	};

	const handleReassign = async () => {
		if (!reassignTarget || !reassignUser) return;
		const result = await dispatch(reassignRequest({ id: reassignTarget.id, data: { toUserId: reassignUser.id, note: reassignNote || undefined } }));
		if (!result.type.endsWith('/rejected')) {
			showToast('Đã chuyển người xử lý', 'success');
			setReassignTarget(null);
			setReassignUser(null);
			setReassignNote('');
			dispatch(fetchOutbox({ page, limit: 12 }));
		} else {
			showToast(String((result as { payload?: unknown }).payload ?? 'Lỗi'), 'danger');
		}
	};

	return (
		<Box sx={{ px: 3, pb: 10 }}>
			{/* Header Row: Tabs & Filter */}
			<Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
				<Box sx={{ flexShrink: 0 }}>
					{tabsNode}
				</Box>

				{/* Filter Right */}
				<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
					<FormControl size="small" sx={{ minWidth: 120 }}>
						<InputLabel sx={{ fontSize: '0.85rem' }}>Loại yêu cầu</InputLabel>
						<Select value={filterType} label="Loại yêu cầu"
							onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
							sx={{ borderRadius: 2, bgcolor: 'background.paper', height: 36, fontSize: '0.85rem' }}>
							<MenuItem value="" sx={{ fontSize: '0.85rem' }}>Tất cả</MenuItem>
							{REQUEST_TYPES.map((t) => <MenuItem key={t} value={t} sx={{ fontSize: '0.85rem' }}>{TYPE_LABEL[t] ?? t}</MenuItem>)}
						</Select>
					</FormControl>
					<FormControl size="small" sx={{ minWidth: 120 }}>
						<InputLabel sx={{ fontSize: '0.85rem' }}>Trạng thái</InputLabel>
						<Select value={filterStatus} label="Trạng thái"
							onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
							sx={{ borderRadius: 2, bgcolor: 'background.paper', height: 36, fontSize: '0.85rem' }}>
							<MenuItem value="" sx={{ fontSize: '0.85rem' }}>Tất cả</MenuItem>
							{REQUEST_STATUSES.map((s) => <MenuItem key={s} value={s} sx={{ fontSize: '0.85rem' }}>{STATUS_LABEL[s] ?? s}</MenuItem>)}
						</Select>
					</FormControl>
					<FormControl size="small" sx={{ minWidth: 120 }}>
						<InputLabel sx={{ fontSize: '0.85rem' }}>Độ ưu tiên</InputLabel>
						<Select value={filterPriority} label="Độ ưu tiên"
							onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
							sx={{ borderRadius: 2, bgcolor: 'background.paper', height: 36, fontSize: '0.85rem' }}>
							<MenuItem value="" sx={{ fontSize: '0.85rem' }}>Tất cả</MenuItem>
							{REQUEST_PRIORITIES.map((p) => <MenuItem key={p} value={p} sx={{ fontSize: '0.85rem' }}>{PRIORITY_LABEL[p] ?? p}</MenuItem>)}
						</Select>
					</FormControl>
					{hasFilter && (
						<Button size="small" onClick={() => { setFilterType(''); setFilterStatus(''); setFilterPriority(''); setPage(1); }}
							sx={{ borderRadius: 2, color: 'text.secondary', fontSize: '0.78rem', minWidth: 'auto' }}>
							Xoá lọc
						</Button>
					)}
					<Button
						variant="contained"
						startIcon={<AddOutlinedIcon />}
						onClick={() => navigate('/requests/create')}
						sx={{
							borderRadius: '100px', height: 36, px: 2.5, fontWeight: 700, ml: 1, textTransform: 'none',
							boxShadow: 'none',
							transition: 'all 0.2s',
							'&:hover': { boxShadow: 'none', transform: 'scale(1.02)' },
						}}
					>
						Tạo yêu cầu
					</Button>
				</Box>
			</Box>

			{/* Loading */}
			{loading && (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
					<CircularProgress size={36} sx={{ color: '#2563eb' }} />
				</Box>
			)}

			{/* Empty */}
			{!loading && outbox.length === 0 && (
				<Box sx={{ textAlign: 'center', py: 12 }}>
					<Box sx={{
						width: 80, height: 80, borderRadius: '50%',
						bgcolor: 'primary.light',
						display: 'flex', alignItems: 'center', justifyContent: 'center',
						mx: 'auto', mb: 2,
					}}>
						<SendOutlinedIcon sx={{ fontSize: 36, color: '#2563eb' }} />
					</Box>
					<Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>Chưa có yêu cầu nào</Typography>
					<Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 2.5 }}>
						{hasFilter ? 'Không có yêu cầu nào khớp với bộ lọc' : 'Tạo yêu cầu mới để giao việc cho người khác'}
					</Typography>
					{!hasFilter && (
						<Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => navigate('/requests/create')}
							sx={{ borderRadius: '100px', height: 40, px: 3, fontWeight: 700, textTransform: 'none', transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
							Tạo yêu cầu đầu tiên
						</Button>
					)}
				</Box>
			)}

			{/* Request list */}
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
				{outbox.map((req) => {
					const due = getDueDateInfo(req.dueDate);
					const doneCount = req.participants.filter((p) => p.status === 'DONE').length;
					const canCancel = !['DONE', 'CANCELLED', 'REJECTED'].includes(req.status);
					const statusColor = STATUS_CONFIG[req.status]?.color ?? '#94a3b8';

					return (
						<Paper
							key={req.id}
							elevation={0}
							onClick={() => navigate(`/requests/${req.id}`)}
							sx={{
								borderRadius: 2.5,
								border: '1px solid',
								borderColor: 'divider',
								borderLeft: `4px solid ${statusColor}`,
								cursor: 'pointer',
								overflow: 'hidden',
								transition: 'all 0.15s',
								position: 'relative',
								'&:hover': {
									boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
									bgcolor: 'action.hover',
									transform: 'translateX(2px)',
								},
							}}
						>
							<Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'stretch' }}>
								{/* Main content */}
								<Box sx={{ flex: 1, minWidth: 0 }}>
									{/* Badges */}
									<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
										<StatusBadge status={req.status} />
										{due && (
											<Chip
												icon={<AccessTimeOutlinedIcon sx={{ fontSize: '12px !important' }} />}
												label={due.label}
												size="small"
												color={due.color}
												variant="outlined"
												sx={{ fontSize: 11, height: 22 }}
											/>
										)}
									</Box>

									{/* Title */}
									<Typography sx={{
										fontWeight: 700,
										fontSize: '0.92rem',
										lineHeight: 1.4,
										mb: 1,
										display: '-webkit-box',
										WebkitLineClamp: 2,
										WebkitBoxOrient: 'vertical',
										overflow: 'hidden',
									}}>
										{req.title}
									</Typography>

									{/* Bottom row: Attributes & Assignee/Group */}
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
										<Box sx={{ display: 'flex', gap: 0.5 }}>
											<TypeBadge type={req.type} />
											<PriorityBadge priority={req.priority} />
										</Box>
										
										{req.splitMode && req.participants.length > 0 ? (
											<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25, ml: 'auto' }}>
												<Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
													{new Date(req.updatedAt || req.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
												</Typography>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
														{doneCount}/{req.participants.length}
													</Typography>
													<AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: 10, border: (theme) => `2px solid ${theme.palette.background.paper}` } }}>
														{req.participants.map((p) => (
															<Avatar key={p.user.id} src={p.user.imgAvatar}>{p.user.name?.[0]}</Avatar>
														))}
													</AvatarGroup>
												</Box>
											</Box>
										) : req.claimedBy ? (
											<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25, ml: 'auto' }}>
												<Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
													{new Date(req.updatedAt || req.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
												</Typography>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
													<PersonOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
													<Avatar src={req.claimedBy.imgAvatar} sx={{ width: 18, height: 18, fontSize: 10 }}>
														{req.claimedBy.name?.[0]}
													</Avatar>
													<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
														{['DONE', 'REJECTED', 'CANCELLED'].includes(req.status) ? 'Người phụ trách: ' : 'Đang xử lý: '} {req.claimedBy.name}
													</Typography>
												</Box>
											</Box>
										) : (
											<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25, ml: 'auto' }}>
												<Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
													{new Date(req.updatedAt || req.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
												</Typography>
												<Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
													Chưa có người nhận
												</Typography>
											</Box>
										)}
									</Box>
								</Box>

								{/* Actions */}
								<Box
									onClick={(e) => e.stopPropagation()}
									sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0, alignItems: 'flex-end', alignSelf: 'stretch' }}
								>
									<Box sx={{ flexGrow: 1 }} />

									{/* Buttons */}
									{canCancel && (
										<Box sx={{ display: 'flex', gap: 0.75, mt: 'auto' }}>
											<Button
												size="small"
												variant="outlined"
												onClick={() => { setReassignTarget(req); setReassignUser(null); setReassignNote(''); }}
												sx={{
													borderRadius: '100px', fontWeight: 700, fontSize: '0.72rem', px: 2, py: 0.5, minWidth: 0, textTransform: 'none',
													color: 'primary.main', borderColor: 'rgba(0, 184, 148, 0.3)', bgcolor: 'rgba(0, 184, 148, 0.1)',
													transition: 'all 0.2s',
													'&:hover': { bgcolor: 'rgba(0, 184, 148, 0.2)', borderColor: 'primary.main', transform: 'scale(1.02)' }
												}}
											>
												Chuyển người
											</Button>
											<Button
												size="small"
												variant="outlined"
												color="error"
												onClick={() => setCancelTarget(req)}
												sx={{
													borderRadius: '100px', fontWeight: 700, fontSize: '0.72rem', px: 2, py: 0.5, minWidth: 0, textTransform: 'none',
													color: 'error.main', borderColor: 'rgba(231, 76, 60, 0.2)', bgcolor: 'rgba(231, 76, 60, 0.08)',
													transition: 'all 0.2s',
													'&:hover': { bgcolor: 'rgba(231, 76, 60, 0.15)', borderColor: 'error.main', transform: 'scale(1.02)' }
												}}
											>
												Huỷ
											</Button>
										</Box>
									)}
								</Box>
							</Box>
							
							{/* Absolute Progress (split mode) */}
							{req.splitMode && req.participants.length > 0 && (
								<LinearProgress
									variant="determinate"
									value={(doneCount / req.participants.length) * 100}
									sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: '#cbd5e1' } }}
								/>
							)}
						</Paper>
					);
				})}
			</Box>

			{/* Pagination */}
			{outboxPages > 1 && (
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
					<Pagination
						count={outboxPages} page={page}
						onChange={(_, v) => setPage(v)}
						color="primary" shape="rounded"
						sx={{ '& .MuiPaginationItem-root': { borderRadius: 1.5 } }}
					/>
				</Box>
			)}

			{/* Cancel Dialog */}
			<Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} PaperProps={{ sx: { borderRadius: '28px' } }}>
				<DialogTitle sx={{ fontWeight: 800 }}>Huỷ yêu cầu</DialogTitle>
				<Divider />
				<DialogContent sx={{ pt: 2, maxHeight: '70vh', overflowY: 'auto' }}>
					<Typography>Bạn có chắc muốn huỷ yêu cầu <strong>"{cancelTarget?.title}"</strong>?</Typography>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
					<Button onClick={() => setCancelTarget(null)} sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>Không</Button>
					<Button variant="contained" color="error" onClick={handleCancel} disabled={actionLoading}
						sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>Huỷ yêu cầu</Button>
				</DialogActions>
			</Dialog>

			{/* Reassign Dialog */}
			<Dialog open={!!reassignTarget} onClose={() => setReassignTarget(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '28px' } }}>
				<DialogTitle sx={{ fontWeight: 800 }}>Chuyển người xử lý</DialogTitle>
				<Divider />
				<DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2.5, maxHeight: '70vh', overflowY: 'auto' }}>
					<Autocomplete
						options={userOptions}
						getOptionLabel={(u) => `${u.name} (${u.email})`}
						value={reassignUser}
						onChange={(_, v) => setReassignUser(v)}
						onInputChange={(_, v) => setUserSearch(v)}
						renderInput={(params) => (
							<TextField {...params} label="Chọn người xử lý mới" size="small"
								sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
						)}
					/>
					<TextField multiline rows={2} label="Ghi chú (tuỳ chọn)" value={reassignNote}
						onChange={(e) => setReassignNote(e.target.value)} size="small"
						sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
					<Button onClick={() => setReassignTarget(null)} sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>Huỷ</Button>
					<Button variant="contained" onClick={handleReassign} disabled={!reassignUser || actionLoading}
						sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
						Xác nhận chuyển
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
