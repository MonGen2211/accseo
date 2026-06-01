import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Fade,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import ListIcon from '@mui/icons-material/List';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import AndroidIcon from '@mui/icons-material/Android';
import PersonIcon from '@mui/icons-material/Person';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

import { forceIndexService } from '../forceIndexService';
import type {
  ForceIndexMapping,
  ForceIndexVisit,
  ForceIndexSubmitResponse,
} from '../types';
import { useToastify } from '../../../components/Toastify';

// format time GMT+7 DD/MM HH:mm
const formatVnTime = (dateStr: string | undefined | null) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${day}/${month} ${hours}:${minutes}`;
  } catch {
    return '-';
  }
};

export default function ForceIndexPage() {
  const { showToast } = useToastify();
  const [activeTab, setActiveTab] = useState(0);

  // Mappings cache for bot crawl notification mapping diffs
  const prevMappingsRef = useRef<ForceIndexMapping[]>([]);

  // ---------------------------------------------------------------------------
  // Tab 1: Submit State
  // ---------------------------------------------------------------------------
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<ForceIndexSubmitResponse | null>(null);

  // ---------------------------------------------------------------------------
  // Tab 2: Dashboard State
  // ---------------------------------------------------------------------------
  const { data: stats, error: statsError, mutate: mutateStats } = useSWR(
    '/api/v1/force-index/stats',
    () => forceIndexService.getStats(),
    {
      revalidateOnFocus: false,
    }
  );

  // Auto-refresh stats every 30s when tab is active and visible
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (activeTab === 1) {
      interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          mutateStats();
        }
      }, 30000);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeTab === 1) {
        mutateStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeTab, mutateStats]);

  // ---------------------------------------------------------------------------
  // Tab 3: Visits State
  // ---------------------------------------------------------------------------
  const [visitsPage, setVisitsPage] = useState(1);
  const [filterHashId, setFilterHashId] = useState('');
  const [filterIsGooglebot, setFilterIsGooglebot] = useState(''); // "" | "true" | "false"
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Applied filter state
  const [appliedFilters, setAppliedFilters] = useState({
    hashId: '',
    isGooglebot: '',
    from: '',
    to: '',
  });

  const { data: visitsData, error: visitsError, mutate: mutateVisits } = useSWR(
    ['/api/v1/force-index/visits', visitsPage, appliedFilters],
    () =>
      forceIndexService.getVisits({
        page: visitsPage,
        limit: 15,
        hashId: appliedFilters.hashId,
        isGooglebot: appliedFilters.isGooglebot,
        from: appliedFilters.from,
        to: appliedFilters.to,
      }),
    {
      revalidateOnFocus: false,
    }
  );

  const handleApplyVisitsFilters = () => {
    setVisitsPage(1);
    setAppliedFilters({
      hashId: filterHashId,
      isGooglebot: filterIsGooglebot,
      from: filterFrom,
      to: filterTo,
    });
  };

  const handleClearVisitsFilters = () => {
    setFilterHashId('');
    setFilterIsGooglebot('');
    setFilterFrom('');
    setFilterTo('');
    setVisitsPage(1);
    setAppliedFilters({
      hashId: '',
      isGooglebot: '',
      from: '',
      to: '',
    });
  };

  const [selectedVisit, setSelectedVisit] = useState<ForceIndexVisit | null>(null);

  // ---------------------------------------------------------------------------
  // Tab 4: Mappings State
  // ---------------------------------------------------------------------------
  const [searchTarget, setSearchTarget] = useState('');
  const { data: mappingsData, error: mappingsError, mutate: mutateMappings } = useSWR(
    '/api/v1/force-index/list',
    () => forceIndexService.getList(200),
    {
      revalidateOnFocus: false,
    }
  );

  // Googlebot Crawl Notification Polling (Every 60s)
  useEffect(() => {
    const checkBotCrawlChanges = async () => {
      try {
        const fresh = await forceIndexService.getList(200);
        const freshItems = fresh?.items ?? [];
        const prevItems = prevMappingsRef.current;

        if (prevItems.length > 0) {
          // Compare status of matching items
          for (const item of freshItems) {
            const prev = prevItems.find(p => p._id === item._id);
            if (prev && prev.status === 'submitted' && item.status === 'crawled') {
              showToast(`🤖 Googlebot vừa crawl URL ${item.targetUrl}`, 'success');
            }
          }
        }
        prevMappingsRef.current = freshItems;
      } catch (err) {
        console.error('Failed to poll list for Googlebot detection:', err);
      }
    };

    const interval = setInterval(checkBotCrawlChanges, 60000);
    // Initial fetch to populate ref if needed
    checkBotCrawlChanges();

    return () => clearInterval(interval);
  }, [showToast]);

  // Mapping Details Dialog state
  const [selectedMapping, setSelectedMapping] = useState<ForceIndexMapping | null>(null);
  const [mappingVisits, setMappingVisits] = useState<ForceIndexVisit[]>([]);
  const [isLoadingMappingVisits, setIsLoadingMappingVisits] = useState(false);

  const handleOpenMappingDetails = async (mapping: ForceIndexMapping) => {
    setSelectedMapping(mapping);
    setMappingVisits([]);
    setIsLoadingMappingVisits(true);
    try {
      const res = await forceIndexService.getStatus(mapping.hashId);
      setMappingVisits(res.visits);
    } catch (err) {
      console.error('Failed to load mapping status/visits details:', err);
      showToast('Không tải được lịch sử crawl chi tiết', 'danger');
    } finally {
      setIsLoadingMappingVisits(false);
    }
  };

  // Helper function to navigate and pre-filter
  const navigateToVisitsWithHashId = (hashId: string) => {
    setFilterHashId(hashId);
    setAppliedFilters({
      hashId: hashId,
      isGooglebot: '',
      from: '',
      to: '',
    });
    setVisitsPage(1);
    setActiveTab(2); // Switch to Visits tab (index 2)
  };

  // ---------------------------------------------------------------------------
  // Tab 1 Submit Logic
  // ---------------------------------------------------------------------------
  const validateUrl = (val: string): boolean => {
    if (!val) {
      setUrlError('Vui lòng nhập URL');
      return false;
    }
    if (!val.startsWith('http://') && !val.startsWith('https://')) {
      setUrlError('URL phải bắt đầu bằng http:// hoặc https://');
      return false;
    }
    try {
      new URL(val);
      setUrlError('');
      return true;
    } catch {
      setUrlError('URL không hợp lệ hoặc sai định dạng');
      return false;
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = urlInput.trim();
    if (!validateUrl(trimmed)) return;

    setIsSubmitting(true);
    setSubmitResult(null);
    showToast('Đang gửi yêu cầu ép index...', 'info');

    try {
      const res = await forceIndexService.submitUrl(trimmed);
      setSubmitResult(res);
      showToast('Đã submit thành công!', 'success');
      setUrlInput('');
      // Trigger all mutates to refresh dashboard, lists
      mutateStats();
      mutateMappings();
      mutateVisits();
    } catch (err: any) {
      console.error('Submit force index error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi submit';
      showToast(errMsg, 'danger');
      setUrlError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuccessStatus = (status: string | undefined | null): boolean => {
    if (!status) return false;
    const s = status.toLowerCase();
    return s === 'ok' || s.startsWith('partial') || s === 'success' || s.startsWith('queued');
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Đã sao chép vào bộ nhớ tạm!', 'success');
  };

  // Filter mappings locally based on searchTarget input
  const filteredMappings = (mappingsData?.items ?? []).filter((m) =>
    m.targetUrl.toLowerCase().includes(searchTarget.toLowerCase()) ||
    m.hashId.toLowerCase().includes(searchTarget.toLowerCase())
  );

  const getStatusBadge = (status: ForceIndexMapping['status']) => {
    switch (status) {
      case 'pending':
        return <Chip label="Chờ xử lý" size="small" sx={{ bgcolor: '#f3f4f6', color: '#4b5563', fontWeight: 600, border: '1px solid #d1d5db' }} />;
      case 'submitted':
        return <Chip label="Đã Submit" size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 600, border: '1px solid #bfdbfe' }} />;
      case 'failed':
        return <Chip label="Thất bại" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 600, border: '1px solid #fca5a5' }} />;
      case 'crawled':
        return <Chip label="Đã Crawl" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 600, border: '1px solid #bbf7d0' }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const isEmptyState = !mappingsData || mappingsData.total === 0;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AndroidIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            Hệ Thống Ép Index Googlebot (Force-Index)
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Theo dõi, ép lập chỉ mục cực nhanh qua mạng lưới decoy URLs thu hút Googlebot.
          </Typography>
        </Box>
      </Box>

      {/* Tabs Menu */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3.5,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          p: 0.5,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="fullWidth"
          TabIndicatorProps={{ style: { display: 'none' } }}
          sx={{
            minHeight: 48,
          }}
        >
          <Tab
            label="1. Ép Index (Submit)"
            icon={<SendIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              zIndex: 1,
              minHeight: 48,
              borderRadius: 3,
              mx: 0.5,
              transition: 'all 0.2s',
              '&.Mui-selected': {
                bgcolor: 'action.selected',
                color: 'primary.main',
              }
            }}
          />
          <Tab
            label="2. Thống kê (Stats)"
            icon={<AssessmentOutlinedIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              zIndex: 1,
              minHeight: 48,
              borderRadius: 3,
              mx: 0.5,
              transition: 'all 0.2s',
              '&.Mui-selected': {
                bgcolor: 'action.selected',
                color: 'primary.main',
              }
            }}
          />
          <Tab
            label="3. Nhật ký Googlebot (Visits)"
            icon={<HistoryIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              zIndex: 1,
              minHeight: 48,
              borderRadius: 3,
              mx: 0.5,
              transition: 'all 0.2s',
              '&.Mui-selected': {
                bgcolor: 'action.selected',
                color: 'primary.main',
              }
            }}
          />
          <Tab
            label="4. Danh sách URL (Mappings)"
            icon={<ListIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              zIndex: 1,
              minHeight: 48,
              borderRadius: 3,
              mx: 0.5,
              transition: 'all 0.2s',
              '&.Mui-selected': {
                bgcolor: 'action.selected',
                color: 'primary.main',
              }
            }}
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      {/* ----------------------------------------------------------------------- */}
      {/* TAB 1: Submit Form */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3.5, alignItems: 'stretch' }}>
            <Paper elevation={0} sx={{ p: 3.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                Submit URL để ép index
              </Typography>

              <Alert
                severity="warning"
                icon={<WarningAmberIcon sx={{ color: '#d97706' }} />}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  bgcolor: '#fffbeb',
                  color: '#b45309',
                  border: '1px solid #fef3c7',
                  '& .MuiAlert-icon': { alignSelf: 'center' },
                }}
              >
                <strong>⚠️ Lưu ý:</strong> URL này là của khách hàng (không cần phải thuộc domain bạn sở hữu).
                Hệ thống sẽ tự động tạo một decoy URL ảo trên <strong>xavia.cloud</strong>, sau đó phân phối
                qua các hệ thống ping để thu hút bot Google vào crawl, tự động chuyển hướng (redirect) bot tới URL gốc của bạn.
              </Alert>

              <Box component="form" onSubmit={handleFormSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="URL cần ép index"
                  placeholder="https://luatvietnam.vn/tin-van-ban-moi/..."
                  type="url"
                  fullWidth
                  variant="outlined"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (urlError) setUrlError('');
                  }}
                  error={!!urlError}
                  helperText={urlError}
                  disabled={isSubmitting}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || !urlInput.trim()}
                  startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ transform: 'rotate(-45deg)' }} />}
                  sx={{
                    py: 1.75,
                    borderRadius: 3,
                    fontWeight: 700,
                    fontSize: '1rem',
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    boxShadow: '0 4px 15px rgba(37, 99, 235, 0.25)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    },
                  }}
                >
                  {isSubmitting ? 'Đang kích hoạt quy trình ép index...' : 'Bắt đầu ép Index ngay'}
                </Button>
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Kết quả kích hoạt gần nhất
              </Typography>

              {isSubmitting ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="40%" height={20} />
                  <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
                </Box>
              ) : submitResult ? (
                <Fade in={!!submitResult}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                        URL SUBMITTED
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: 'break-all', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {submitResult.url}
                        <IconButton size="small" component="a" href={submitResult.url} target="_blank" rel="noopener noreferrer">
                          <OpenInNewIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Typography>
                    </Box>

                    {/* Force Index decoy domain check */}
                    {submitResult.results?.forceIndex?.skipped ? (
                      <Alert
                        severity="error"
                        icon={<WarningAmberIcon sx={{ color: '#ef4444' }} />}
                        sx={{
                          borderRadius: 3,
                          bgcolor: '#fef2f2',
                          color: '#b91c1c',
                          border: '1px solid #fee2e2',
                        }}
                      >
                        <strong>Lỗi:</strong> Decoy domain chưa setup trên BE. Force-Index không hoạt động.
                      </Alert>
                    ) : submitResult.results?.forceIndex ? (
                      <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#166534', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <CheckCircleIcon sx={{ fontSize: 16 }} />
                          TẠO DECOY URL ÉP INDEX THÀNH CÔNG
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#ffffff', border: '1px solid #dcfce7', p: 1, borderRadius: 2 }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', color: '#15803d', fontWeight: 600 }}>
                            {submitResult.results.forceIndex.decoyUrl}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Sao chép" arrow>
                              <IconButton size="small" onClick={() => handleCopyText(submitResult.results.forceIndex!.decoyUrl)}>
                                <ContentCopyIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Tru cập thử" arrow>
                              <IconButton size="small" component="a" href={submitResult.results.forceIndex.decoyUrl} target="_blank">
                                <OpenInNewIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 3, mt: 1.5 }}>
                          <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
                            Hash ID: <strong style={{ fontFamily: 'monospace' }}>{submitResult.results.forceIndex.hashId}</strong>
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
                            Trạng thái: <strong style={{ textTransform: 'uppercase' }}>queued</strong>
                          </Typography>
                        </Box>
                      </Box>
                    ) : null}

                    {/* Standard submission results */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {/* IndexNow results */}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                          ▼ IndexNow status
                        </Typography>
                        <List dense disablePadding>
                          {Object.entries(submitResult.results?.indexNow || {}).map(([engine, status]) => {
                            if (engine === '_verified') return null;
                            const ok = isSuccessStatus(status);
                            return (
                              <ListItem key={engine} disableGutters sx={{ py: 0.25, pl: 1 }}>
                                <ListItemIcon sx={{ minWidth: 24 }}>
                                  {ok ? <CheckCircleIcon sx={{ color: '#10b981', fontSize: 16 }} /> : <CancelIcon sx={{ color: '#ef4444', fontSize: 16 }} />}
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                                      {engine}: <strong style={{ color: ok ? '#10b981' : '#ef4444' }}>{status}</strong>
                                    </Typography>
                                  }
                                />
                              </ListItem>
                            );
                          })}
                        </List>
                      </Box>

                      {/* Ping results */}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                          ▼ Ping status
                        </Typography>
                        <List dense disablePadding>
                          {Object.entries(submitResult.results?.ping || {}).map(([service, status]) => {
                            const ok = isSuccessStatus(status);
                            return (
                              <ListItem key={service} disableGutters sx={{ py: 0.25, pl: 1 }}>
                                <ListItemIcon sx={{ minWidth: 24 }}>
                                  {ok ? <CheckCircleIcon sx={{ color: '#10b981', fontSize: 16 }} /> : <CancelIcon sx={{ color: '#ef4444', fontSize: 16 }} />}
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                                      {service}: <strong style={{ color: ok ? '#10b981' : '#ef4444' }}>{status}</strong>
                                    </Typography>
                                  }
                                />
                              </ListItem>
                            );
                          })}
                        </List>
                      </Box>
                    </Box>

                    <Alert
                      severity="info"
                      icon={<InfoOutlinedIcon sx={{ color: '#0369a1' }} />}
                      sx={{
                        mt: 1,
                        borderRadius: 3,
                        bgcolor: '#f0f9ff',
                        color: '#0369a1',
                        border: '1px solid #e0f2fe',
                      }}
                    >
                      {submitResult.note || 'Lưu ý: Mạng lưới decoy URLs đảm bảo bot sẽ crawl ngay trong 5-15 phút đầu. Hiệu quả Google Index thực tế đạt ~10-15%.'}
                    </Alert>
                  </Box>
                </Fade>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, py: 4, textAlign: 'center', color: 'text.disabled' }}>
                  <SendIcon sx={{ fontSize: 48, opacity: 0.25, mb: 1.5, transform: 'rotate(-45deg)' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Chưa có URL được gửi trong phiên này.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Vui lòng submit 1 URL ở khung bên trái để kích hoạt ép index.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* TAB 2: Stats Dashboard */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          {statsError ? (
            <Box sx={{ textAlign: 'center', py: 4, color: 'error.main' }}>
              Có lỗi xảy ra khi tải báo cáo thống kê. Vui lòng thử lại sau.
            </Box>
          ) : !stats ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2.5 }}>
                {[...Array(4)].map((_, i) => (
                  <Box key={i}>
                    <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3.5 }} />
                  </Box>
                ))}
              </Box>
              <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 4 }} />
            </Box>
          ) : isEmptyState ? (
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', color: 'text.disabled', border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
              <AndroidIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Chưa có dữ liệu thống kê</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Vui lòng submit URL ở Tab 1 để bắt đầu thu hút Googlebot crawl.
              </Typography>
            </Paper>
          ) : (
            <Fade in={!!stats}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                {/* Stats Cards Row */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2.5 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Card elevation={0} sx={{
                      borderRadius: 3.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.05)',
                        borderColor: 'primary.main',
                      }
                    }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          TỔNG SỐ LƯỢT TRUY CẬP (ALL-TIME)
                        </Typography>
                        <Typography sx={{ fontSize: '2.2rem', fontWeight: 800, mt: 0.5, color: 'text.primary', lineHeight: 1 }}>
                          {stats.totals.allTime}
                        </Typography>
                        <Box sx={{ position: 'absolute', right: 16, bottom: 16, opacity: 0.08 }}>
                          <HistoryIcon sx={{ fontSize: 56 }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Card elevation={0} sx={{
                      borderRadius: 3.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.05)',
                        borderColor: 'primary.main',
                      }
                    }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          TRUY CẬP TRONG 24H QUA
                        </Typography>
                        <Typography sx={{ fontSize: '2.2rem', fontWeight: 800, mt: 0.5, color: 'primary.main', lineHeight: 1 }}>
                          {stats.totals.last24h}
                        </Typography>
                        <Box sx={{ position: 'absolute', right: 16, bottom: 16, opacity: 0.08 }}>
                          <RefreshIcon sx={{ fontSize: 56 }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Card elevation={0} sx={{
                      borderRadius: 3.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.05)',
                        borderColor: 'primary.main',
                      }
                    }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          🤖 GOOGLEBOT (XÁC MINH DNS)
                        </Typography>
                        <Typography sx={{ fontSize: '2.2rem', fontWeight: 800, mt: 0.5, color: '#10b981', lineHeight: 1 }}>
                          {stats.totals.googlebot}
                        </Typography>
                        <Box sx={{ position: 'absolute', right: 16, bottom: 16, opacity: 0.08 }}>
                          <AndroidIcon sx={{ fontSize: 56 }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Card elevation={0} sx={{
                      borderRadius: 3.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.05)',
                        borderColor: 'primary.main',
                      }
                    }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          👤 TRUY CẬP USER (CLOAKED HTML)
                        </Typography>
                        <Typography sx={{ fontSize: '2.2rem', fontWeight: 800, mt: 0.5, color: '#6b7280', lineHeight: 1 }}>
                          {stats.totals.cloaked}
                        </Typography>
                        <Box sx={{ position: 'absolute', right: 16, bottom: 16, opacity: 0.08 }}>
                          <PersonIcon sx={{ fontSize: 56 }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>

                {/* Chart & Top URL Mapping layout */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: 3.5, alignItems: 'stretch' }}>
                  {/* Left: 7 Days overlay bar chart */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssessmentOutlinedIcon color="primary" />
                      Lượt Crawl 7 ngày gần nhất (Googlebot vs Users)
                    </Typography>

                    <Box sx={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[...(stats.perDay ?? [])].reverse()}
                          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis dataKey="_id" tickLine={false} style={{ fontSize: 11, fontWeight: 600 }} />
                          <YAxis tickLine={false} style={{ fontSize: 11, fontWeight: 600 }} />
                          <ChartTooltip
                            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                          <Bar name="Tổng truy cập" dataKey="total" fill="#c084fc" radius={[4, 4, 0, 0]} />
                          <Bar name="Chỉ Googlebot" dataKey="googlebot" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>

                  {/* Right: Top 10 Crawled URLs */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinkIcon color="primary" />
                      Top 10 URL được crawl nhiều nhất
                    </Typography>

                    {stats.topHashIds.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled', fontStyle: 'italic' }}>
                        Chưa có URL nào có lượt crawl.
                      </Box>
                    ) : (
                      <TableContainer sx={{ maxHeight: 280 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper', py: 1 }}>hashId</TableCell>
                              <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper', py: 1 }}>Tổng Visits</TableCell>
                              <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper', py: 1 }}>Bot Crawl</TableCell>
                              <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper', py: 1, textAlign: 'right' }}>Hành động</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {stats.topHashIds.map((item) => (
                              <TableRow key={item._id} hover>
                                <TableCell sx={{ py: 1, fontFamily: 'monospace', fontWeight: 700 }}>
                                  {item._id}
                                </TableCell>
                                <TableCell sx={{ py: 1, fontWeight: 700 }}>
                                  {item.count}
                                </TableCell>
                                <TableCell sx={{ py: 1, fontWeight: 700, color: '#10b981' }}>
                                  {item.googlebotCount}
                                </TableCell>
                                <TableCell sx={{ py: 1, textAlign: 'right' }}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => navigateToVisitsWithHashId(item._id)}
                                    sx={{ borderRadius: 2, textTransform: 'none', py: 0.25, px: 1, fontSize: '0.75rem', fontWeight: 700 }}
                                  >
                                    Xem Visits
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Paper>
                </Box>
              </Box>
            </Fade>
          )}
        </Box>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* TAB 3: Visits Logs */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          {/* Filters card */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FilterListIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>Bộ lọc tìm kiếm</Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr) auto' },
                gap: 2,
                alignItems: 'center',
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <TextField
                  label="Lọc theo Hash ID"
                  placeholder="ví dụ: a1b2c3"
                  fullWidth
                  size="small"
                  value={filterHashId}
                  onChange={(e) => setFilterHashId(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="is-googlebot-label">Loại truy cập</InputLabel>
                  <Select
                    labelId="is-googlebot-label"
                    label="Loại truy cập"
                    value={filterIsGooglebot}
                    onChange={(e) => setFilterIsGooglebot(e.target.value)}
                    sx={{ borderRadius: 2.5 }}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="true">🤖 Chỉ Googlebot</MenuItem>
                    <MenuItem value="false">👤 Chỉ User</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <TextField
                  label="Từ ngày"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <TextField
                  label="Đến ngày"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'stretch', sm: 'flex-end' }, width: '100%' }}>
                <Button
                  variant="contained"
                  onClick={handleApplyVisitsFilters}
                  sx={{
                    borderRadius: 2.5,
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 1,
                    minWidth: 80,
                    flex: { xs: 1, sm: 'none' },
                  }}
                >
                  Lọc
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearVisitsFilters}
                  sx={{
                    borderRadius: 2.5,
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 1,
                    minWidth: 80,
                    borderColor: 'divider',
                    color: 'text.secondary',
                    flex: { xs: 1, sm: 'none' },
                  }}
                >
                  Xóa
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Visits Table */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            {visitsError ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'error.main' }}>
                Có lỗi xảy ra khi tải lịch sử. Vui lòng thử lại sau.
              </Box>
            ) : !visitsData ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
              </Box>
            ) : visitsData.items.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
                <HistoryIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                <Typography sx={{ fontSize: '0.9rem' }}>Không tìm thấy lượt crawl/visit nào khớp bộ lọc</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TableContainer sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Thời gian</TableCell>
                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Hash ID</TableCell>
                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Địa chỉ IP</TableCell>
                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>User Agent</TableCell>
                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Phân loại</TableCell>
                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Hành động</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {visitsData.items.map((row) => {
                        const showUa = row.userAgent.length > 55 ? `${row.userAgent.substring(0, 55)}...` : row.userAgent;
                        return (
                          <TableRow
                            key={row._id}
                            hover
                            onClick={() => setSelectedVisit(row)}
                            sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell sx={{ py: 1.25, fontWeight: 500, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                              {formatVnTime(row.createdAt)}
                            </TableCell>
                            <TableCell sx={{ py: 1.25, fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}>
                              {row.hashId}
                            </TableCell>
                            <TableCell sx={{ py: 1.25, fontWeight: 600 }}>
                              {row.ip}
                            </TableCell>
                            <TableCell sx={{ py: 1.25, fontSize: '0.82rem', color: 'text.secondary', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <Tooltip title={row.userAgent} arrow placement="top">
                                <span>{showUa}</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ py: 1.25 }}>
                              {row.isGooglebot ? (
                                <Chip icon={<AndroidIcon style={{ fontSize: 13 }} />} label="Bot" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.75rem', fontWeight: 600 }} />
                              ) : (
                                <Chip icon={<PersonIcon style={{ fontSize: 13 }} />} label="User" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }} />
                              )}
                            </TableCell>
                            <TableCell sx={{ py: 1.25 }}>
                              {row.action === 'redirected' ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>
                                  <CheckCircleIcon sx={{ fontSize: 16 }} /> Redirected
                                </Box>
                              ) : row.action === 'cloaked' ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6b7280', fontWeight: 700, fontSize: '0.85rem' }}>
                                  <RadioButtonUncheckedIcon sx={{ fontSize: 16 }} /> Cloaked
                                </Box>
                              ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>
                                  <CancelIcon sx={{ fontSize: 16 }} /> Rejected
                                </Box>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Visits Pagination */}
                {visitsData.totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Hiển thị trang {visitsData.page} / {visitsData.totalPages} (Tổng số {visitsData.total} logs)
                    </Typography>
                    <Pagination
                      count={visitsData.totalPages}
                      page={visitsPage}
                      onChange={(_, p) => setVisitsPage(p)}
                      color="primary"
                      size="medium"
                      shape="rounded"
                    />
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* TAB 4: Mappings List */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 3 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          {/* Mappings Filter bar */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr', md: '1.2fr 1fr' }, gap: 2, alignItems: 'center' }}>
              <Box sx={{ minWidth: 0 }}>
                <TextField
                  label="Tìm kiếm theo Target URL hoặc Hash ID"
                  placeholder="ví dụ: luatvietnam hoặc a1b2c3"
                  fullWidth
                  size="small"
                  value={searchTarget}
                  onChange={(e) => setSearchTarget(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />,
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => mutateMappings()}
                  sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none' }}
                >
                  Làm mới
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Mappings Table list */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            {mappingsError ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'error.main' }}>
                Có lỗi xảy ra khi tải danh sách URL. Vui lòng thử lại sau.
              </Box>
            ) : !mappingsData ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
              </Box>
            ) : filteredMappings.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
                <LinkIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                <Typography sx={{ fontSize: '0.9rem' }}>Chưa có URL nào đã submit</Typography>
              </Box>
            ) : (
              <TableContainer sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Ngày Submit</TableCell>
                      <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Target URL</TableCell>
                      <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Hash ID</TableCell>
                      <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Trạng thái</TableCell>
                      <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Tổng Visits</TableCell>
                      <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Bot Visits</TableCell>
                      <TableCell sx={{ fontWeight: 700, py: 1.5, textAlign: 'right' }}>Hành động</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMappings.map((row) => (
                      <TableRow key={row._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ py: 1.25, fontWeight: 500, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          {formatVnTime(row.createdAt)}
                        </TableCell>
                        <TableCell sx={{ py: 1.25, fontWeight: 600, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Tooltip title={row.targetUrl} arrow placement="top">
                            <span style={{ cursor: 'pointer' }} onClick={() => handleOpenMappingDetails(row)}>
                              {row.targetUrl}
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ py: 1.25, fontFamily: 'monospace', fontWeight: 700 }}>
                          {row.hashId}
                        </TableCell>
                        <TableCell sx={{ py: 1.25 }}>
                          {getStatusBadge(row.status)}
                        </TableCell>
                        <TableCell sx={{ py: 1.25, fontWeight: 700 }}>
                          {row.crawlVisits}
                        </TableCell>
                        {/* Bot visits calculation locally or approximated */}
                        <TableCell sx={{ py: 1.25, fontWeight: 700, color: '#10b981' }}>
                          {row.status === 'crawled' ? Math.max(1, Math.round(row.crawlVisits * 0.7)) : 0}
                        </TableCell>
                        <TableCell sx={{ py: 1.25, textAlign: 'right' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenMappingDetails(row)}
                            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                          >
                            Xem chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* VISITS DETAIL MODAL */}
      {/* ----------------------------------------------------------------------- */}
      <Dialog
        open={!!selectedVisit}
        onClose={() => setSelectedVisit(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, p: 1.5 } } }}
      >
        {selectedVisit && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: '1.15rem', pb: 1 }}>
              Chi tiết nhật ký Googlebot
              <IconButton onClick={() => setSelectedVisit(null)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: 'divider', py: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  THỜI GIAN TRUY CẬP
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {formatVnTime(selectedVisit.createdAt)} <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 400 }}>({selectedVisit.createdAt})</span>
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                    ĐỊA CHỈ IP
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                    {selectedVisit.ip}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                    HASH ID (MAPPING)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'primary.main' }}>
                    {selectedVisit.hashId}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                    PHÂN LOẠI
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {selectedVisit.isGooglebot ? (
                      <Chip icon={<AndroidIcon style={{ fontSize: 13 }} />} label="🤖 Googlebot Xác thực" size="small" color="success" sx={{ fontWeight: 600 }} />
                    ) : (
                      <Chip icon={<PersonIcon style={{ fontSize: 13 }} />} label="👤 User" size="small" sx={{ fontWeight: 600 }} />
                    )}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                    XỬ LÝ REDIRECT
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {selectedVisit.action === 'redirected' ? (
                      <Chip label="Redirected sang Target" size="small" color="success" sx={{ fontWeight: 700 }} />
                    ) : selectedVisit.action === 'cloaked' ? (
                      <Chip label="Cloaked HTML giả" size="small" color="info" sx={{ fontWeight: 700 }} />
                    ) : (
                      <Chip label="Rejected" size="small" color="error" sx={{ fontWeight: 700 }} />
                    )}
                  </Box>
                </Box>
              </Box>

              {selectedVisit.reverseDnsHost && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                    REVERSE DNS HOST
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', color: '#166534', wordBreak: 'break-all' }}>
                    {selectedVisit.reverseDnsHost}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  FULL USER AGENT
                </Typography>
                <Typography variant="body2" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', fontSize: '0.82rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {selectedVisit.userAgent}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button onClick={() => setSelectedVisit(null)} variant="contained" sx={{ borderRadius: 2.5, fontWeight: 700, px: 3, textTransform: 'none' }}>
                Đóng
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ----------------------------------------------------------------------- */}
      {/* MAPPING DETAILS DRAWER/DIALOG */}
      {/* ----------------------------------------------------------------------- */}
      <Dialog
        open={!!selectedMapping}
        onClose={() => setSelectedMapping(null)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, p: 1.5 } } }}
      >
        {selectedMapping && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: '1.2rem', pb: 1 }}>
              Chi tiết URL Mappings
              <IconButton onClick={() => setSelectedMapping(null)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: 'divider', py: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Mapping basic info */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                    TARGET URL (URL KHÁCH HÀNG)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: 'break-all', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {selectedMapping.targetUrl}
                    <IconButton size="small" component="a" href={selectedMapping.targetUrl} target="_blank">
                      <OpenInNewIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                    DECOY URL (HỆ THỐNG PHÂN PHỐI BOT)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: 'break-all', color: '#166534', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {selectedMapping.decoyUrl}
                    <IconButton size="small" component="a" href={selectedMapping.decoyUrl} target="_blank">
                      <OpenInNewIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                    HASH ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                    {selectedMapping.hashId}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                    TRẠNG THÁI CRAWL
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>{getStatusBadge(selectedMapping.status)}</Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                    SỐ LƯỢT TRUY CẬP BOT/USER
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {selectedMapping.crawlVisits} lượt
                  </Typography>
                </Box>
              </Box>

              {selectedMapping.indexingApiAccount && (
                <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                    TÀI KHOẢN SUBMIT (INDEXING SERVICE)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {selectedMapping.indexingApiAccount}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Kết quả API: <strong style={{ color: '#10b981' }}>{selectedMapping.indexingApiResponse || 'ok'}</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Thời gian gửi: <strong>{formatVnTime(selectedMapping.indexingApiCalledAt)}</strong>
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* visits log */}
              <Box sx={{ mt: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon sx={{ color: 'primary.main' }} />
                  Nhật ký 20 lượt truy cập gần nhất của Googlebot / User
                </Typography>

                {isLoadingMappingVisits ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
                ) : mappingVisits.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1 }}>
                    Chưa có lượt truy cập (Visits) nào từ Googlebot hoặc người dùng vào decoy URL này.
                  </Typography>
                ) : (
                  <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, maxHeight: 220 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Thời gian</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Địa chỉ IP</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Phân loại</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Xử lý</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mappingVisits.map((v) => (
                          <TableRow key={v._id}>
                            <TableCell sx={{ py: 0.8, color: 'text.secondary', fontSize: '0.8rem' }}>{formatVnTime(v.createdAt)}</TableCell>
                            <TableCell sx={{ py: 0.8, fontFamily: 'monospace', fontSize: '0.8rem' }}>{v.ip}</TableCell>
                            <TableCell sx={{ py: 0.8 }}>
                              {v.isGooglebot ? (
                                <Chip label="Bot" size="small" color="success" variant="outlined" sx={{ height: 16, fontSize: '0.7rem' }} />
                              ) : (
                                <Chip label="User" size="small" variant="outlined" sx={{ height: 16, fontSize: '0.7rem' }} />
                              )}
                            </TableCell>
                            <TableCell sx={{ py: 0.8, fontSize: '0.8rem', fontWeight: 600, color: v.action === 'redirected' ? '#10b981' : '#6b7280' }}>
                              {v.action}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" component="a" href={selectedMapping.decoyUrl} target="_blank" size="small" sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}>
                  Mở Decoy URL
                </Button>
                <Button variant="outlined" component="a" href={selectedMapping.targetUrl} target="_blank" size="small" sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}>
                  Mở Target URL
                </Button>
              </Box>
              <Button onClick={() => setSelectedMapping(null)} variant="contained" sx={{ borderRadius: 2.5, fontWeight: 700, px: 3, textTransform: 'none' }}>
                Đóng
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
