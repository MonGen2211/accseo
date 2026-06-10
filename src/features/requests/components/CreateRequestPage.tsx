import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormLabel from '@mui/material/FormLabel';
import Autocomplete from '@mui/material/Autocomplete';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { createRequest } from '../requestSlice';
import { userService } from '../../users/userService';
import { domainService } from '../../domains/domainService';
import { keywordGroupService } from '../../keywords/keywordGroupService';
import { useToastify } from '../../../components/Toastify';
import type { RequestType, RequestPriority } from '../types';
import type { UserProfile } from '../../../types/user.types';
import type { Domain } from '../../../types/domain.types';
import type { KeywordGroup } from '../../keywords/types';

const TYPE_OPTIONS: { value: RequestType; label: string }[] = [
  { value: 'KEYWORD_APPROVAL', label: 'Duyệt từ khoá' },
  { value: 'CONTENT_TASK', label: 'Nội dung' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'DOMAIN_TASK', label: 'Tên miền' },
  { value: 'GENERAL', label: 'Chung' },
];

const PRIORITY_OPTIONS: { value: RequestPriority; label: string }[] = [
  { value: 'LOW', label: 'Thấp' },
  { value: 'NORMAL', label: 'Bình thường' },
  { value: 'HIGH', label: 'Cao' },
  { value: 'URGENT', label: 'Khẩn cấp' },
];

const DEFAULT_REMINDERS = [{ offsetHours: 72 }, { offsetHours: 24 }, { offsetHours: 2 }];

export default function CreateRequestPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToastify();
  const { actionLoading } = useAppSelector((s) => s.requests);
  const currentUser = useAppSelector((s) => s.auth.user);

  const locState = (location.state ?? {}) as {
    title?: string; type?: RequestType; priority?: RequestPriority;
    refType?: string; refId?: string; refDomainId?: string;
  };

  const [title, setTitle] = useState(locState.title ?? '');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<RequestType>(locState.type ?? 'GENERAL');
  const [priority, setPriority] = useState<RequestPriority>(locState.priority ?? 'NORMAL');
  const [toUser, setToUser] = useState<UserProfile | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [reminders, setReminders] = useState(DEFAULT_REMINDERS);

  const [userOptions, setUserOptions] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // ── Keyword group ref ─────────────────────────────────────────────────────
  const [domainOptions, setDomainOptions] = useState<Domain[]>([]);
  const [selectedDomainForKw, setSelectedDomainForKw] = useState<Domain | null>(null);
  const [kwGroupOptions, setKwGroupOptions] = useState<KeywordGroup[]>([]);
  const [selectedKwGroup, setSelectedKwGroup] = useState<KeywordGroup | null>(null);

  // Load domains khi type = KEYWORD_APPROVAL
  useEffect(() => {
    if (type !== 'KEYWORD_APPROVAL') return;
    domainService.getAll(1, 100).then((res) => {
      setDomainOptions(res.items);
      if (locState.refDomainId) {
        const found = res.items.find((d) => d._id === locState.refDomainId);
        if (found) setSelectedDomainForKw(found);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Load groups khi domain thay đổi, chỉ lấy của mình + pending_approval
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!selectedDomainForKw) { setKwGroupOptions([]); setSelectedKwGroup(null); return; }
    keywordGroupService.getGroups(selectedDomainForKw._id, 1, 100, '', 'desc', 'pending_approval').then((res) => {
      const mine = res.items.filter((g) => g.createdBy?._id === currentUser?.id);
      setKwGroupOptions(mine);
      if (locState.refId) {
        const found = mine.find((g) => ((g as { _id?: string })._id || g.id) === locState.refId);
        if (found) setSelectedKwGroup(found);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDomainForKw]);

  useEffect(() => {
    userService.getAssignable(userSearch, true).then(setUserOptions);
  }, [userSearch]);

  const addReminder = () => setReminders([...reminders, { offsetHours: 24 }]);
  const removeReminder = (i: number) => setReminders(reminders.filter((_, idx) => idx !== i));
  const updateReminder = (i: number, val: number) => setReminders(reminders.map((r, idx) => idx === i ? { offsetHours: val } : r));

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      showToast('Vui lòng điền đủ tiêu đề và mô tả', 'warning');
      return;
    }
    if (!toUser) {
      showToast('Vui lòng chọn người nhận', 'warning');
      return;
    }
    if (type === 'KEYWORD_APPROVAL' && !selectedKwGroup) {
      showToast('Vui lòng chọn bộ keyword', 'warning');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      type,
      priority,
      assignmentType: 'user' as const,
      toUser: toUser!.id,
      dueDate: dueDate || undefined,
      reminders: reminders.filter((r) => r.offsetHours > 0),
      ...(type === 'KEYWORD_APPROVAL' && selectedKwGroup
        ? { refType: 'keyword_group', refId: (selectedKwGroup as { _id?: string })._id || selectedKwGroup.id }
        : {}),
    };

    const result = await dispatch(createRequest(payload));
    if (!result.type.endsWith('/rejected')) {
      showToast('Tạo yêu cầu thành công', 'success');
      navigate('/requests?tab=1');
    } else {
      showToast(String((result as { payload?: unknown }).payload ?? 'Lỗi tạo yêu cầu'), 'danger');
    }
  };

  return (
    <Box sx={{ p: 3, pb: 10, maxWidth: 720, mx: 'auto', zoom: 0.8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Tạo yêu cầu mới</Typography>
      </Box>

      <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Title & Description */}
        <TextField
          label="Tiêu đề *"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          label="Mô tả *"
          fullWidth
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Loại yêu cầu</InputLabel>
            <Select value={type} label="Loại yêu cầu" onChange={(e) => setType(e.target.value as RequestType)}>
              {TYPE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Độ ưu tiên</InputLabel>
            <Select value={priority} label="Độ ưu tiên" onChange={(e) => setPriority(e.target.value as RequestPriority)}>
              {PRIORITY_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        <Divider />

        {/* Assignment */}
        <Box>
          {/* MỐT CẦN DÙNG GIAO VIỆC THEO NHÓM / VAI TRÒ THÌ BỎ COMMENT ĐOẠN NÀY
              VÀ THÊM STATE: const [assignmentType, setAssignmentType] = useState<'user'|'role'|'group'>('user');
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Loại người nhận</InputLabel>
            <Select value={assignmentType} label="Loại người nhận" onChange={(e) => setAssignmentType(e.target.value as any)}>
              <MenuItem value="user">Cá nhân (User)</MenuItem>
              <MenuItem value="role">Vai trò (Role)</MenuItem>
              <MenuItem value="group">Nhóm (Group)</MenuItem>
            </Select>
          </FormControl>
          */}

          <FormLabel sx={{ mb: 1, display: 'block', fontWeight: 600 }}>Giao cho *</FormLabel>
          
          {/* Đang mặc định hiển thị chọn User (vì assignmentType fix cứng là 'user') */}
          <Autocomplete
            options={userOptions}
            getOptionLabel={(u) => `${u.name} (${u.email})`}
            value={toUser}
            onChange={(_, v) => setToUser(v)}
            onInputChange={(_, v) => setUserSearch(v)}
            renderInput={(params) => <TextField {...params} label="Tìm và chọn người nhận" size="small" sx={{ mt: 1.5 }} />}
          />

          {/* MỞ COMMENT ĐOẠN NÀY ĐỂ RENDER DROPDOWN CHỌN ROLE / GROUP KHI assignmentType THAY ĐỔI
          {assignmentType === 'role' && (
            <Autocomplete
              options={['CONTENT_CREATOR', 'CONTENT_MANAGER', 'SEO_COLLABORATOR', 'SEO_MANAGER', 'ADMIN']}
              value={toRole}
              onChange={(_, v) => setToRole(v)}
              renderInput={(params) => <TextField {...params} label="Chọn vai trò" size="small" sx={{ mt: 1.5 }} />}
            />
          )}

          {assignmentType === 'group' && (
            <Autocomplete
              options={groupOptions}
              getOptionLabel={(g) => g.name}
              value={toGroup}
              onChange={(_, v) => setToGroup(v)}
              renderInput={(params) => <TextField {...params} label="Chọn nhóm" size="small" sx={{ mt: 1.5 }} />}
            />
          )}
          */}
        </Box>

        <Divider />

        {/* Keyword group reference */}
        {type === 'KEYWORD_APPROVAL' && (
          <Box>
            <FormLabel sx={{ mb: 1, display: 'block', fontWeight: 600 }}>Đính kèm bộ keyword *</FormLabel>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Autocomplete
                options={domainOptions}
                getOptionLabel={(d) => d.domain}
                value={selectedDomainForKw}
                onChange={(_, d) => { setSelectedDomainForKw(d); setSelectedKwGroup(null); }}
                renderInput={(params) => <TextField {...params} label="Chọn domain" size="small" />}
              />
              {selectedDomainForKw && (
                <Autocomplete
                  options={kwGroupOptions}
                  getOptionLabel={(g) => g.name}
                  value={selectedKwGroup}
                  onChange={(_, g) => setSelectedKwGroup(g)}
                  noOptionsText="Không có bộ keyword nào của bạn đang chờ duyệt"
                  renderInput={(params) => <TextField {...params} label="Tìm bộ keyword (của bạn, đang chờ duyệt)" size="small" />}
                />
              )}
            </Box>
          </Box>
        )}

        <Divider />

        {/* Due date */}
        <TextField
          label="Hạn hoàn thành (tuỳ chọn)"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        {/* Reminders */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ fontWeight: 600, flex: 1 }}>Nhắc nhở (giờ trước hạn)</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addReminder}>Thêm</Button>
          </Box>
          {reminders.map((r, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TextField
                type="number"
                size="small"
                label="Số giờ"
                value={r.offsetHours}
                onChange={(e) => updateReminder(i, Number(e.target.value))}
                sx={{ width: 120 }}
                slotProps={{ htmlInput: { min: 1 } }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>giờ trước hạn</Typography>
              <IconButton size="small" onClick={() => removeReminder(i)}><DeleteIcon fontSize="small" /></IconButton>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => navigate(-1)} sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>Huỷ</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={actionLoading} sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
            {actionLoading ? 'Đang gửi...' : 'Tạo yêu cầu'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
