import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Switch, 
  IconButton, 
  Tooltip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  CircularProgress, 
  Alert, 
  Chip,
  Grid
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';

import { trendingSyncScheduleService } from '../trendingSyncScheduleService';
import type { TrendingSyncSchedule } from '../trendingSyncSchedule.types';
import { useToastify } from '../../../components/Toastify';
import { format, isValid } from 'date-fns';

const HOURS_SLOTS = [4, 24, 48, 168] as const;

const PRESETS = [
  { label: 'Mỗi 15 phút', expr: '*/15 * * * *' },
  { label: 'Mỗi 30 phút', expr: '*/30 * * * *' },
  { label: 'Mỗi giờ', expr: '0 * * * *' },
  { label: 'Mỗi 3 giờ', expr: '0 */3 * * *' },
  { label: 'Mỗi 6 giờ', expr: '0 */6 * * *' },
  { label: 'Mỗi ngày 6h sáng', expr: '0 6 * * *' }
];

const isCronTooFrequent = (expr: string): boolean => {
  const fields = expr.trim().split(/\s+/);
  if (!fields[0]) return false;
  
  const minField = fields[0];
  if (minField === '*' || minField === '*/1' || minField === '*/2' || minField === '*/3' || minField === '*/4') {
    return true;
  }
  const regex = /^(\*|\*\/[1-4]|[0-4])(,|$)/;
  return regex.test(minField);
};

export default function TrendingSchedulesPage() {
  const { showToast } = useToastify();
  const [schedules, setSchedules] = useState<TrendingSyncSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(true);

  // Modal Dialog states
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedSchedule, setSelectedSchedule] = useState<TrendingSyncSchedule | null>(null);
  
  // Form fields
  const [formHours, setFormHours] = useState<number>(4);
  const [formCronExpr, setFormCronExpr] = useState<string>('*/15 * * * *');
  const [formEnabled, setFormEnabled] = useState<boolean>(true);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  // Polling intervals refs
  const pollIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollDelayMs = useRef<number>(60000); // Default slow polling (60s)

  // Fetch all schedules
  const fetchSchedules = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    setError(null);
    try {
      const res = await trendingSyncScheduleService.getAll();
      if (res.success && res.data) {
        setSchedules(res.data.items || []);
        setHasPermission(true);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải lịch đồng bộ:', err);
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        setHasPermission(false);
        setError('Bạn không có quyền truy cập vào tính năng này (Yêu cầu quyền ADMIN).');
      } else {
        setError(err.response?.data?.message || err.message || 'Lỗi không xác định khi kết nối máy chủ.');
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, []);

  // Poll individual items that are running (or fallback to full refresh)
  const refreshRunningSchedules = useCallback(async () => {
    try {
      const res = await trendingSyncScheduleService.getAll();
      if (res.success && res.data) {
        setSchedules(res.data.items || []);
      }
    } catch (err: any) {
      console.error('Lỗi khi poll lịch đồng bộ:', err);
    }
  }, []);

  // Setup dynamic polling based on isRunning state
  useEffect(() => {
    // Check if any schedule is running
    const anyRunning = schedules.some(s => s.isRunning);
    const targetDelay = anyRunning ? 5000 : 60000; // 5s if running, 60s if not

    if (pollIntervalRef.current && pollDelayMs.current === targetDelay) {
      // Already running at the correct interval
      return;
    }

    // Clear old interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollDelayMs.current = targetDelay;
    pollIntervalRef.current = setInterval(() => {
      refreshRunningSchedules();
    }, targetDelay);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [schedules, refreshRunningSchedules]);

  // Initial fetch on mount
  useEffect(() => {
    fetchSchedules();
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [fetchSchedules]);

  // Handle Switch Enable / Disable
  const handleToggleEnable = async (schedule: TrendingSyncSchedule, nextState: boolean) => {
    try {
      const res = await trendingSyncScheduleService.update(schedule.id, { enabled: nextState });
      if (res.success) {
        showToast(`Đã ${nextState ? 'kích hoạt' : 'tạm dừng'} lịch sync ${schedule.hours}h thành công!`, 'success');
        fetchSchedules(true);
      }
    } catch (err: any) {
      console.error('Lỗi khi thay đổi trạng thái lịch:', err);
      showToast(err.response?.data?.message || err.message || 'Lỗi khi cập nhật lịch.', 'danger');
    }
  };

  // Handle Run Now Trigger
  const handleRunNow = async (schedule: TrendingSyncSchedule) => {
    if (schedule.isRunning) return;
    try {
      showToast(`Đã kích hoạt quét đồng bộ ${schedule.hours}h chạy ngầm, vui lòng đợi...`, 'info');
      
      // Update UI state immediately to indicate running
      setSchedules(prev => prev.map(s => s.id === schedule.id ? { ...s, isRunning: true } : s));

      const res = await trendingSyncScheduleService.runNow(schedule.id);
      if (res.success) {
        // Refresh immediately to verify status
        fetchSchedules(true);
      }
    } catch (err: any) {
      console.error('Lỗi khi trigger run-now:', err);
      showToast(err.response?.data?.message || err.message || 'Lỗi khi kích hoạt chạy ngay.', 'danger');
      fetchSchedules(true);
    }
  };

  // Handle Delete
  const handleDelete = async (schedule: TrendingSyncSchedule) => {
    if (schedule.isRunning) {
      showToast('Không thể xóa lịch đang trong tiến trình chạy quét!', 'warning');
      return;
    }
    const ok = window.confirm(`Bạn có chắc chắn muốn xóa cấu hình lịch sync cho mốc ${schedule.hours}h?`);
    if (!ok) return;

    try {
      const res = await trendingSyncScheduleService.delete(schedule.id);
      if (res.success) {
        showToast(`Đã xóa cấu hình lịch sync ${schedule.hours}h thành công!`, 'success');
        fetchSchedules(false);
      }
    } catch (err: any) {
      console.error('Lỗi khi xóa lịch:', err);
      showToast(err.response?.data?.message || err.message || 'Lỗi khi xóa cấu hình lịch.', 'danger');
    }
  };

  // Open Dialog for Create
  const handleOpenCreate = (hoursSlot: number) => {
    setDialogMode('create');
    setSelectedSchedule(null);
    setFormHours(hoursSlot);
    setFormCronExpr('*/15 * * * *');
    setFormEnabled(true);
    setDialogOpen(true);
  };

  // Open Dialog for Edit
  const handleOpenEdit = (schedule: TrendingSyncSchedule) => {
    setDialogMode('edit');
    setSelectedSchedule(schedule);
    setFormHours(schedule.hours);
    setFormCronExpr(schedule.cronExpr);
    setFormEnabled(schedule.enabled);
    setDialogOpen(true);
  };

  // Form Submission
  const handleFormSubmit = async () => {
    const cronTrimmed = formCronExpr.trim();
    if (!cronTrimmed) {
      showToast('Vui lòng nhập cấu hình Cron Expression!', 'warning');
      return;
    }

    setFormLoading(true);
    try {
      if (dialogMode === 'create') {
        const res = await trendingSyncScheduleService.create({
          hours: formHours,
          cronExpr: cronTrimmed,
          enabled: formEnabled
        });
        if (res.success) {
          showToast(`Tạo lịch sync trending mốc ${formHours}h thành công!`, 'success');
          setDialogOpen(false);
          fetchSchedules(false);
        }
      } else {
        if (!selectedSchedule) return;
        const res = await trendingSyncScheduleService.update(selectedSchedule.id, {
          cronExpr: cronTrimmed,
          enabled: formEnabled
        });
        if (res.success) {
          showToast(`Cập nhật lịch sync trending mốc ${formHours}h thành công!`, 'success');
          setDialogOpen(false);
          fetchSchedules(false);
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi lưu cấu hình lịch:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu dữ liệu.';
      showToast(Array.isArray(msg) ? msg.join(', ') : String(msg), 'danger');
    } finally {
      setFormLoading(false);
    }
  };

  // Format Date String helper
  const formatDateStr = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isValid(d) ? format(d, 'HH:mm dd/MM/yyyy') : '—';
  };

  // Status Badge Component
  const StatusBadge = ({ schedule }: { schedule: TrendingSyncSchedule }) => {
    if (schedule.isRunning) {
      return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={14} thickness={5} sx={{ color: '#f59e0b' }} />
          <Chip 
            label="Đang chạy" 
            size="small" 
            sx={{ 
              fontWeight: 800, 
              bgcolor: 'rgba(245, 158, 11, 0.15)', 
              color: '#d97706',
              animation: 'pulseText 1.5s infinite ease-in-out',
              '@keyframes pulseText': {
                '0%, 100%': { opacity: 0.7 },
                '50%': { opacity: 1 }
              }
            }} 
          />
        </Box>
      );
    }

    switch (schedule.lastStatus) {
      case 'success':
        return (
          <Chip
            icon={<CheckCircleOutlinedIcon style={{ color: '#10b981', fontSize: 16 }} />}
            label="Thành công"
            size="small"
            sx={{
              fontWeight: 700,
              bgcolor: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              '& .MuiChip-icon': { ml: 0.5 }
            }}
          />
        );
      case 'error':
        return (
          <Tooltip title={schedule.lastError || 'Lỗi không xác định'} placement="top" arrow>
            <Chip
              icon={<ErrorOutlinedIcon style={{ color: '#ef4444', fontSize: 16 }} />}
              label="Bị lỗi"
              size="small"
              sx={{
                fontWeight: 700,
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                cursor: 'pointer',
                '& .MuiChip-icon': { ml: 0.5 }
              }}
            />
          </Tooltip>
        );
      case 'skipped':
        return (
          <Tooltip title="Lần đồng bộ trước đó vẫn đang chạy dở hoặc chưa kết thúc hoàn tất." placement="top" arrow>
            <Chip
              icon={<WarningAmberIcon style={{ color: '#eab308', fontSize: 16 }} />}
              label="Bỏ qua"
              size="small"
              sx={{
                fontWeight: 700,
                bgcolor: 'rgba(234, 179, 8, 0.1)',
                color: '#d97706',
                border: '1px solid rgba(234, 179, 8, 0.2)',
                cursor: 'pointer',
                '& .MuiChip-icon': { ml: 0.5 }
              }}
            />
          </Tooltip>
        );
      default:
        return (
          <Chip
            label="Chưa chạy"
            size="small"
            sx={{
              fontWeight: 600,
              bgcolor: 'action.selected',
              color: 'text.secondary'
            }}
          />
        );
    }
  };

  if (!hasPermission) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 3, fontWeight: 700 }}>
          {error || 'Bạn không có quyền truy cập vào mục cấu hình quản trị này.'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3.5, boxSizing: 'border-box' }}>
      
      {/* Title Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1.2, color: 'text.primary', letterSpacing: '-0.02em' }}>
            <ScheduleIcon sx={{ color: '#f59e0b', fontSize: 28 }} /> Lịch đồng bộ Google Trending tự động
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Cấu hình thời gian chạy tự động (Cron job) để đồng bộ hóa các từ khóa xu hướng của Google vào cơ sở dữ liệu hệ thống theo các mốc giờ.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<RefreshIcon />}
          onClick={() => fetchSchedules(false)}
          disabled={loading}
          sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 750, borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } }}
        >
          Làm mới dữ liệu
        </Button>
      </Box>

      {/* Main Content Layout */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
          <CircularProgress size={32} sx={{ color: '#f59e0b' }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            Đang tải dữ liệu cấu hình đồng bộ...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 3, fontWeight: 700 }}>
          {error}
        </Alert>
      ) : (
        <TableContainer 
          component={Paper} 
          elevation={0}
          sx={{ 
            borderRadius: 4, 
            border: '1px solid', 
            borderColor: 'divider',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.015)' : 'background.paper',
            boxShadow: '0 4px 20px -8px rgba(0,0,0,0.05)'
          }}
        >
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: 'text.primary', py: 2 }}>Mốc giờ</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.primary', py: 2 }}>Cron Expression</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.primary', py: 2 }}>Lịch chạy kế tiếp</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.primary', py: 2 }}>Lần chạy gần nhất</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.primary', py: 2 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.primary', py: 2, textAlign: 'center' }}>Bật</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'text.primary', py: 2, textAlign: 'right', pr: 3 }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {HOURS_SLOTS.map((hour) => {
                const schedule = schedules.find(s => s.hours === hour);

                if (!schedule) {
                  // Slot not created yet row
                  return (
                    <TableRow 
                      key={hour}
                      sx={{ 
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <TableCell sx={{ py: 2.2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.94rem', color: 'text.disabled' }}>
                          ⚡ {hour} giờ
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.85rem' }}>—</TableCell>
                      <TableCell sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.85rem' }}>—</TableCell>
                      <TableCell sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.85rem' }}>—</TableCell>
                      <TableCell>
                        <Chip
                          label="Chưa tạo lịch"
                          size="small"
                          sx={{
                            fontWeight: 650,
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            color: 'text.disabled',
                            border: '1px dashed',
                            borderColor: 'divider'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', color: 'text.disabled' }}>—</TableCell>
                      <TableCell sx={{ textAlign: 'right', pr: 3, py: 1.8 }}>
                        <Button
                          variant="contained"
                          color="warning"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenCreate(hour)}
                          sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            px: 2,
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: 'white',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                            }
                          }}
                        >
                          Thêm lịch {hour}h
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }

                // Active schedule row
                return (
                  <TableRow 
                    key={schedule.id}
                    sx={{ 
                      '&:hover': { bgcolor: 'action.hover' },
                      bgcolor: schedule.isRunning 
                        ? ((theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.04)' : 'rgba(245, 158, 11, 0.01)')
                        : 'transparent',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <TableCell sx={{ py: 2.2 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.96rem', color: 'text.primary' }}>
                        ⚡ {schedule.hours} giờ
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={schedule.cronExpr}
                        size="small"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          border: '1px solid',
                          borderColor: 'divider',
                          color: 'text.primary'
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ fontSize: '0.84rem', fontWeight: 650 }}>
                      {schedule.enabled ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <ScheduleIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                          {formatDateStr(schedule.nextRunAt)}
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, bgcolor: 'action.disabledBackground', px: 1, py: 0.25, borderRadius: 1.2 }}>
                          Đã dừng lịch
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ fontSize: '0.84rem' }}>
                      {schedule.lastRunAt ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {formatDateStr(schedule.lastRunAt)}
                          </Typography>
                          {schedule.lastStatus === 'success' && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: '0.72rem', fontWeight: 600 }}>
                              ⏱️ {schedule.lastDurationMs ? `${(schedule.lastDurationMs / 1000).toFixed(1)}s` : '—'} · 🔑 {schedule.lastSyncedCount ?? 0} kw
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.85rem' }}>Chưa chạy lần nào</Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <StatusBadge schedule={schedule} />
                    </TableCell>

                    <TableCell sx={{ textAlign: 'center' }}>
                      <Switch
                        checked={schedule.enabled}
                        onChange={(e) => handleToggleEnable(schedule, e.target.checked)}
                        color="warning"
                        disabled={schedule.isRunning}
                        size="small"
                      />
                    </TableCell>

                    <TableCell sx={{ textAlign: 'right', pr: 3 }}>
                      <Box sx={{ display: 'inline-flex', gap: 1.2, alignItems: 'center' }}>
                        
                        {/* Run Now Trigger Button */}
                        <Tooltip title={schedule.isRunning ? 'Đang trong tiến trình chạy đồng bộ' : (!schedule.enabled ? 'Cần bật lịch trước khi cào thủ công' : 'Chạy thử đồng bộ ngay lập tức')} arrow>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleRunNow(schedule)}
                            disabled={schedule.isRunning || !schedule.enabled}
                            sx={{
                              bgcolor: 'success.lighter',
                              color: 'success.main',
                              '&:hover': { bgcolor: 'success.light' },
                              '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'text.disabled' },
                              transition: 'all 0.2s',
                              borderRadius: 2
                            }}
                          >
                            <PlayArrowIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>

                        {/* Edit Button */}
                        <Tooltip title="Chỉnh sửa cấu hình cron" arrow>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEdit(schedule)}
                            disabled={schedule.isRunning}
                            sx={{
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(14, 165, 233, 0.05)',
                              color: '#38bdf8',
                              '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(14, 165, 233, 0.1)' },
                              borderRadius: 2
                            }}
                          >
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>

                        {/* Delete Button */}
                        <Tooltip title="Xóa lịch cấu hình này" arrow>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(schedule)}
                            disabled={schedule.isRunning}
                            sx={{
                              bgcolor: 'error.lighter',
                              color: 'error.main',
                              '&:hover': { bgcolor: 'error.light' },
                              borderRadius: 2
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ========================================================================= */}
      {/* DIALOG: TẠO / SỬA LỊCH SYNC */}
      {/* ========================================================================= */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (!formLoading) setDialogOpen(false);
        }}
        slotProps={{ paper: { sx: { borderRadius: 4, width: '100%', maxWidth: 520, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 900, pb: 1, display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <ScheduleIcon sx={{ color: '#f59e0b' }} /> {dialogMode === 'create' ? `Thêm lịch sync mốc ${formHours}h mới` : `Chỉnh sửa lịch sync mốc ${formHours}h`}
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.8 }}>
          
          {/* Read-only Hours select info */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Cửa sổ mốc giờ (Hours)"
                value={`${formHours} giờ`}
                slotProps={{ input: { readOnly: true } }}
                fullWidth
                size="small"
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontWeight: 700 } }}
              />
            </Grid>

            {/* Toggle switch for enabled status in modal */}
            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center', pl: 1 }}>
              <Switch
                checked={formEnabled}
                onChange={(e) => setFormEnabled(e.target.checked)}
                color="warning"
                size="small"
              />
              <Typography variant="body2" sx={{ fontWeight: 750, color: formEnabled ? 'warning.main' : 'text.secondary', ml: 1 }}>
                {formEnabled ? 'Đang kích hoạt' : 'Đang tạm dừng'}
              </Typography>
            </Grid>
          </Grid>

          {/* Cron Expression input */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              label="Cấu hình Cron Expression (POSIX)"
              value={formCronExpr}
              onChange={(e) => setFormCronExpr(e.target.value)}
              fullWidth
              size="small"
              required
              variant="outlined"
              placeholder="VD: */15 * * * *"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontFamily: 'monospace', fontWeight: 800 } }}
              helperText="Cấu hình lịch chạy tự động gồm 5 trường cách nhau bởi dấu cách."
            />
          </Box>

          {/* Presets suggestions selection */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <HelpOutlinedIcon sx={{ fontSize: 13 }} /> GỢI Ý CHỌN NHANH PRESET CRON:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              {PRESETS.map((preset) => (
                <Chip
                  key={preset.label}
                  label={preset.label}
                  onClick={() => setFormCronExpr(preset.expr)}
                  variant={formCronExpr === preset.expr ? 'filled' : 'outlined'}
                  color={formCronExpr === preset.expr ? 'warning' : 'default'}
                  size="small"
                  sx={{ 
                    borderRadius: 1.8, 
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Warning Banner logic for frequent sync schedules (< 5 min) */}
          {isCronTooFrequent(formCronExpr) && (
            <Alert 
              severity="warning" 
              icon={<WarningAmberIcon style={{ color: '#d97706' }} />}
              sx={{ 
                borderRadius: 3, 
                bgcolor: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                color: '#b45309',
                fontWeight: 700,
                fontSize: '0.78rem'
              }}
            >
              Cảnh báo: Tần suất cào quá dày (&lt; 5 phút) cực kỳ dễ bị Google Trends block địa chỉ IP hoặc dính captcha cứng của server. Khuyên dùng tần suất từ 15 phút trở lên.
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            variant="outlined"
            disabled={formLoading}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            disabled={formLoading}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: 800,
              px: 3,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
              }
            }}
          >
            {formLoading ? 'Đang lưu...' : (dialogMode === 'create' ? 'Tạo cấu hình' : 'Lưu cập nhật')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
