import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import SyncIcon from '@mui/icons-material/Sync';
import { gscService } from '../../keywords/gscService';
import { ga4Service } from '../../keywords/ga4Service';
import { domainService } from '../../domains/domainService';
import { useToastify } from '../../../components/Toastify';

import type { Domain } from '../../../types/domain.types';

export function MetaSetupSection({ domain, onUpdate }: { domain?: Domain, onUpdate?: () => void }) {
  const { showToast } = useToastify();
  const [metaEnabled, setMetaEnabled] = useState(false);
  const [metaHour, setMetaHour] = useState(8);
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    if (domain?.scanSchedule) {
      setMetaEnabled(domain.scanSchedule.enabled);
      setMetaHour(domain.scanSchedule.hour);
    }
  }, [domain]);

  const handleSaveSchedule = async () => {
    const domainId = domain?._id;
    if (!domainId) return;
    setSavingSchedule(true);
    try {
      await domainService.updateSchedule(domainId, { enabled: metaEnabled, hour: metaHour });
      showToast('Cập nhật lịch scan meta tự động thành công!', 'success');
      onUpdate?.();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi cập nhật lịch scan meta', 'danger');
    } finally {
      setSavingSchedule(false);
    }
  };

  if (!domain) return null;

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
      <Typography sx={{ fontWeight: 600, mb: 1 }}>Lịch Scan Tự Động Meta Description</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Mỗi ngày hệ thống sẽ tự động thu thập lại meta description, title, h1 của domain này nếu được bật.
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <FormControlLabel
          control={<Switch checked={metaEnabled} onChange={(e) => setMetaEnabled(e.target.checked)} />}
          label="Bật tự động scan meta"
        />
        <FormControl size="small" sx={{ width: 150 }} disabled={!metaEnabled}>
          <InputLabel>Giờ chạy (UTC+7)</InputLabel>
          <Select value={metaHour} label="Giờ chạy (UTC+7)" onChange={(e) => setMetaHour(Number(e.target.value))}>
            {Array.from({ length: 24 }).map((_, i) => (
              <MenuItem key={i} value={i}>{i}:00</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleSaveSchedule} disabled={savingSchedule}>
          Lưu cấu hình
        </Button>
      </Box>
    </Paper>
  );
}

export function IntegrationsContentGSC({ domain, onUpdate }: { domain?: Domain, onUpdate?: () => void }) {
  const { showToast } = useToastify();

  // GSC State
  const [gscEnabled, setGscEnabled] = useState(false);
  const [gscHour, setGscHour] = useState(8);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    if (domain?.gscSyncSchedule) {
      setGscEnabled(domain.gscSyncSchedule.enabled);
      setGscHour(domain.gscSyncSchedule.hour);
    }
  }, [domain]);

  const handleSaveSchedule = async () => {
    const domainId = domain?._id;
    if (!domainId) return;
    setSavingSchedule(true);
    try {
      await gscService.updateSchedule(domainId, { enabled: gscEnabled, hour: gscHour });
      showToast('Cập nhật lịch scan tự động thành công!', 'success');
      onUpdate?.();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi cập nhật lịch scan', 'danger');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSync = async () => {
    const domainId = domain?._id;
    if (!domainId) return;
    setSyncLoading(true);
    try {
      await gscService.syncGsc(domainId);
      setSyncStatus('running');
      setSyncMessage('Đang đồng bộ dữ liệu GSC...');
      
      const intervalId = setInterval(async () => {
        try {
          const res = await gscService.getSyncStatus(domainId);
          if (res.status === 'done') {
            clearInterval(intervalId);
            setSyncStatus('done');
            setSyncMessage('Đồng bộ hoàn tất!');
            setSyncLoading(false);
          } else if (res.status === 'error') {
            clearInterval(intervalId);
            setSyncStatus('error');
            setSyncMessage(res.error || 'Lỗi đồng bộ');
            setSyncLoading(false);
          }
        } catch (e) {
          clearInterval(intervalId);
          setSyncStatus('error');
          setSyncMessage('Lỗi kiểm tra trạng thái');
          setSyncLoading(false);
        }
      }, 3000);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi kích hoạt đồng bộ', 'danger');
      setSyncLoading(false);
    }
  };

  if (!domain) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Vui lòng chọn một Domain ở phía trên để cấu hình GSC.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Typography sx={{ fontWeight: 600, mb: 1 }}>Lịch Sync Tự Động GSC</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Hệ thống sẽ tự động đồng bộ dữ liệu GSC mỗi ngày.
        </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <FormControlLabel
                control={<Switch checked={gscEnabled} onChange={(e) => setGscEnabled(e.target.checked)} />}
                label="Bật tự động scan"
              />
              <FormControl size="small" sx={{ width: 150 }} disabled={!gscEnabled}>
                <InputLabel>Giờ chạy (UTC+7)</InputLabel>
                <Select value={gscHour} label="Giờ chạy (UTC+7)" onChange={(e) => setGscHour(Number(e.target.value))}>
                  {Array.from({ length: 24 }).map((_, i) => (
                    <MenuItem key={i} value={i}>{i}:00</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="contained" onClick={handleSaveSchedule} disabled={savingSchedule}>
                Lưu cấu hình
              </Button>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>Đồng bộ dữ liệu GSC thủ công</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Đồng bộ lại toàn bộ chỉ số Clicks, Impressions, CTR, Position cho các từ khoá và trang. Quá trình này chạy nền và có thể mất vài phút.
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={syncLoading ? <CircularProgress size={16} /> : <SyncIcon />}
                onClick={handleSync}
                disabled={syncLoading}
              >
                {syncLoading ? 'Đang đồng bộ...' : 'Bắt đầu đồng bộ'}
              </Button>
              
              {syncStatus !== 'idle' && (
                <Typography variant="body2" sx={{ color: syncStatus === 'error' ? 'error.main' : syncStatus === 'done' ? 'success.main' : 'primary.main' }}>
                  {syncMessage}
                </Typography>
              )}
            </Box>
          </Paper>
    </Box>
  );
}

export function IntegrationsContentGA4({ domain, onUpdate }: { domain?: Domain, onUpdate?: () => void }) {
  const { showToast } = useToastify();
  
  const [syncStatus, setSyncStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);

  const [ga4Enabled, setGa4Enabled] = useState(false);
  const [ga4Hour, setGa4Hour] = useState(3);
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    if (domain?.ga4SyncSchedule) {
      setGa4Enabled(domain.ga4SyncSchedule.enabled);
      setGa4Hour(domain.ga4SyncSchedule.hour);
    }
  }, [domain]);

  const handleSaveSchedule = async () => {
    const domainId = domain?._id;
    if (!domainId) return;
    setSavingSchedule(true);
    try {
      await ga4Service.updateSchedule(domainId, { enabled: ga4Enabled, hour: ga4Hour });
      showToast('Cập nhật lịch sync GA4 tự động thành công!', 'success');
      onUpdate?.();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi cập nhật lịch sync GA4', 'danger');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSync = async () => {
    const domainId = domain?._id;
    if (!domainId) return;
    setSyncLoading(true);
    try {
      await ga4Service.syncGa4(domainId);
      setSyncStatus('running');
      setSyncMessage('Đang đồng bộ dữ liệu GA4...');
      
      const intervalId = setInterval(async () => {
        try {
          const res = await ga4Service.getSyncStatus(domainId);
          if (res.status === 'done') {
            clearInterval(intervalId);
            setSyncStatus('done');
            setSyncMessage('Đồng bộ hoàn tất!');
            setSyncLoading(false);
          } else if (res.status === 'error') {
            clearInterval(intervalId);
            setSyncStatus('error');
            setSyncMessage(res.error || 'Lỗi đồng bộ');
            setSyncLoading(false);
          }
        } catch (e) {
          clearInterval(intervalId);
          setSyncStatus('error');
          setSyncMessage('Lỗi kiểm tra trạng thái');
          setSyncLoading(false);
        }
      }, 3000);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi kích hoạt đồng bộ', 'danger');
      setSyncLoading(false);
    }
  };

  if (!domain) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Vui lòng chọn một Domain ở phía trên để cấu hình GA4.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Typography sx={{ fontWeight: 600, mb: 1 }}>Lịch Sync Tự Động GA4</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Hệ thống sẽ tự động đồng bộ dữ liệu GA4 mỗi ngày.
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <FormControlLabel
            control={<Switch checked={ga4Enabled} onChange={(e) => setGa4Enabled(e.target.checked)} />}
            label="Bật tự động sync GA4"
          />
          <FormControl size="small" sx={{ width: 150 }} disabled={!ga4Enabled}>
            <InputLabel>Giờ chạy (UTC+7)</InputLabel>
            <Select value={ga4Hour} label="Giờ chạy (UTC+7)" onChange={(e) => setGa4Hour(Number(e.target.value))}>
              {Array.from({ length: 24 }).map((_, i) => (
                <MenuItem key={i} value={i}>{i}:00</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleSaveSchedule} disabled={savingSchedule}>
            Lưu cấu hình
          </Button>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Typography sx={{ fontWeight: 600, mb: 1 }}>Đồng bộ dữ liệu GA4 thủ công</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Đồng bộ lại toàn bộ chỉ số truy cập GA4: Sessions, Active Users, Pageviews... Quá trình này chạy nền và có thể mất vài phút.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={syncLoading ? <CircularProgress size={16} /> : <SyncIcon />}
            onClick={handleSync}
            disabled={syncLoading}
          >
            {syncLoading ? 'Đang đồng bộ...' : 'Bắt đầu đồng bộ'}
          </Button>
          
          {syncStatus !== 'idle' && (
            <Typography variant="body2" sx={{ color: syncStatus === 'error' ? 'error.main' : syncStatus === 'done' ? 'success.main' : 'primary.main' }}>
              {syncMessage}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
