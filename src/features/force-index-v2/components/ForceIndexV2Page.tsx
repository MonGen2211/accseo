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
  Card,
  CardContent,
  Grid,
  Chip,
  Select,
  MenuItem,
  FormControl,
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
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import HubIcon from '@mui/icons-material/Hub';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';

import { forceIndexV2Service } from '../forceIndexV2Service';
import type { LinkHubItem, LinkHubVisit } from '../types';
import { useToastify } from '../../../components/Toastify';

// format time GMT+7 DD/MM/YYYY HH:mm
const formatVnTime = (dateStr: string | undefined | null) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '—';
  }
};

const getHostname = (urlStr: string): string => {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return urlStr;
  }
};

export default function ForceIndexV2Page() {
  const { showToast } = useToastify();

  // Input states
  const [urlsInput, setUrlsInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Table & Engine states
  const [engine, setEngine] = useState<'local' | 'apify'>('local');
  const [limit, setLimit] = useState(50);
  const [searchText, setSearchText] = useState('');
  const [isCheckingIndex, setIsCheckingIndex] = useState(false);
  const [checkProgress, setCheckProgress] = useState('');

  // Detail Modal states
  const [selectedLink, setSelectedLink] = useState<LinkHubItem | null>(null);
  const [visitsList, setVisitsList] = useState<LinkHubVisit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  // SWR fetching for Stats
  const {
    data: stats,
    error: statsError,
    mutate: mutateStats,
  } = useSWR('/api/v1/link-hub/stats', () => forceIndexV2Service.getStats(), {
    revalidateOnFocus: false,
  });

  // SWR fetching for List
  const {
    data: listData,
    error: listError,
    mutate: mutateList,
  } = useSWR(
    ['/api/v1/link-hub/list', limit],
    () => forceIndexV2Service.getList(limit),
    {
      revalidateOnFocus: false,
    }
  );

  // Auto-refresh stats and list every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        mutateStats();
        mutateList();
      }
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        mutateStats();
        mutateList();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [mutateStats, mutateList]);

  // Handler for Submit Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Parse URLs
    const urls = urlsInput
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (urls.length === 0) {
      setSubmitError('Vui lòng nhập ít nhất 1 URL');
      return;
    }

    if (urls.length > 50) {
      setSubmitError('Bạn chỉ được submit tối đa 50 URL cùng lúc');
      return;
    }

    // Validate URL protocol
    for (const url of urls) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        setSubmitError(`URL không hợp lệ: "${url}". Phải bắt đầu bằng http:// hoặc https://`);
        return;
      }
      try {
        new URL(url);
      } catch {
        setSubmitError(`Định dạng URL sai: "${url}"`);
        return;
      }
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const res = await forceIndexV2Service.submitUrls(urls, topicInput.trim() || undefined);
      showToast(`Đã xếp hàng (queue) ${res.count} URL thành công!`, 'success');
      setUrlsInput('');
      setTopicInput('');
      // Trigger update
      mutateStats();
      mutateList();
    } catch (err: any) {
      console.error('Submit links failed:', err);
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi yêu cầu';
      showToast(msg, 'danger');
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for Check Index (Check all links where indexed !== true)
  const handleCheckIndex = async () => {
    if (isCheckingIndex) return;

    setIsCheckingIndex(true);
    setCheckProgress('Đang quét và kiểm tra index trên Google SERP (có thể mất 10-30s)...');
    try {
      const res = await forceIndexV2Service.checkIndex({
        engine,
        limit: 50,
      });
      showToast(
        `Đã kiểm tra xong! Tổng cộng: ${res.summary.total} link. Đã index: ${res.summary.indexed}/${res.summary.total}`,
        res.summary.indexed > 0 ? 'success' : 'info'
      );
      // Trigger update
      mutateStats();
      mutateList();
    } catch (err: any) {
      console.error('Check index failed:', err);
      const msg = err?.response?.data?.message || err?.message || 'Gặp lỗi khi kiểm tra index';
      showToast(msg, 'danger');
    } finally {
      setIsCheckingIndex(false);
      setCheckProgress('');
    }
  };

  // Handler for checking detail modal
  const handleOpenDetails = async (link: LinkHubItem) => {
    setSelectedLink(link);
    setVisitsList([]);
    setLoadingVisits(true);
    try {
      const res = await forceIndexV2Service.getStatus(link.slug);
      if (res) {
        setVisitsList(res.visits);
      }
    } catch (err: any) {
      console.error('Fetch visits history failed:', err);
      const msg = err?.response?.data?.message || err?.message || 'Không tìm thấy thông tin chi tiết';
      showToast(msg, 'danger');
    } finally {
      setLoadingVisits(false);
    }
  };

  const handleRefreshManual = () => {
    mutateStats();
    mutateList();
    showToast('Đã làm mới dữ liệu!', 'success');
  };

  // Calculation of Stats
  const totals = stats?.totals || { links: 0, submitted: 0, crawled: 0, indexed: 0, visits: 0, googlebotVisits: 0 };
  const indexingRate = totals.links > 0 ? ((totals.indexed / totals.links) * 100).toFixed(1) : '0.0';

  // Filter list data locally
  const filteredItems = (listData?.items || []).filter((item) => {
    const query = searchText.toLowerCase().trim();
    if (!query) return true;
    return (
      item.targetUrl.toLowerCase().includes(query) ||
      item.anchorText.toLowerCase().includes(query) ||
      (item.topic && item.topic.toLowerCase().includes(query)) ||
      item.slug.toLowerCase().includes(query)
    );
  });

  // Render Helpers for status and index badges
  const getStatusBadge = (status: LinkHubItem['status'], apiResponse?: string | null) => {
    switch (status) {
      case 'pending':
        return <Chip label="Đang chờ" size="small" sx={{ bgcolor: 'action.disabledBackground', color: 'text.secondary', fontWeight: 700, borderRadius: 2 }} />;
      case 'submitted':
        return <Chip label="Đã gửi API" size="small" sx={{ bgcolor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', fontWeight: 700, borderRadius: 2 }} />;
      case 'crawled':
        return <Chip label="Googlebot đã crawl" size="small" sx={{ bgcolor: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', fontWeight: 700, borderRadius: 2 }} />;
      case 'failed':
        return (
          <Tooltip title={apiResponse || 'Lỗi không xác định'} arrow>
            <Chip label="Lỗi" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 700, borderRadius: 2, cursor: 'help' }} />
          </Tooltip>
        );
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getIndexedBadge = (indexed: LinkHubItem['indexed'], indexedAt?: string | null) => {
    if (indexed === true) {
      const timeStr = indexedAt ? ` vào lúc ${formatVnTime(indexedAt)}` : '';
      return (
        <Tooltip title={`Đã lập chỉ mục thật trên Google${timeStr}`} arrow>
          <Chip label="Đã index" size="small" sx={{ bgcolor: 'rgba(0, 184, 148, 0.15)', color: '#009975', fontWeight: 800, borderRadius: 2 }} />
        </Tooltip>
      );
    }
    if (indexed === false) {
      return (
        <Tooltip title="Chưa tìm thấy URL này hiển thị trên Google SERP (site:)" arrow>
          <Chip label="Chưa index" size="small" sx={{ bgcolor: 'rgba(249, 115, 22, 0.1)', color: '#f97316', fontWeight: 800, borderRadius: 2 }} />
        </Tooltip>
      );
    }
    return <Chip label="Chưa kiểm tra" size="small" sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 700, borderRadius: 2 }} />;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Header section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.5, letterSpacing: '-0.5px' }}>
            <HubIcon sx={{ fontSize: 32, color: '#00b894' }} />
            Force Index Googlebot V2 (Link Hub Network)
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Ép lập chỉ mục cực mạnh bằng cách tạo trang vệ tinh (Link Hub) thực tế 200 OK kết hợp gọi API Indexing.
          </Typography>
        </Box>
      </Box>

      {/* Row 1: Submit Panel */}
      <Paper
        elevation={0}
        sx={{
          p: 3.5,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          🚀 Tạo chiến dịch ép Index V2 mới
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
          Nhập các liên kết bạn muốn lập chỉ mục. Hệ thống tự động tạo mã anchors, Slug ngẫu nhiên và phân phối dofollow link trên hệ thống V2.
        </Typography>

        <Box component="form" onSubmit={handleFormSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8.5}>
              <TextField
                label="Danh sách URL cần ép index (Mỗi dòng 1 URL, tối đa 50 URL)"
                placeholder="https://luatvietnam.vn/abc.html&#10;https://luatvietnam.vn/xyz.html"
                multiline
                rows={5}
                fullWidth
                variant="outlined"
                value={urlsInput}
                onChange={(e) => {
                  setUrlsInput(e.target.value);
                  if (submitError) setSubmitError('');
                }}
                disabled={isSubmitting}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3.5,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={3.5} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 2.5 }}>
              <TextField
                label="Chủ đề / Nhóm (Topic - tùy chọn)"
                placeholder="luat-doanh-nghiep"
                fullWidth
                variant="outlined"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                disabled={isSubmitting}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3.5,
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isSubmitting || !urlsInput.trim()}
                startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ transform: 'rotate(-45deg)' }} />}
                sx={{
                  py: 1.8,
                  borderRadius: 3.5,
                  fontWeight: 750,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #00b894 0%, #009975 100%)',
                  boxShadow: '0 4px 15px rgba(0, 184, 148, 0.25)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #3dd6a0 0%, #009975 100%)',
                  },
                }}
              >
                {isSubmitting ? 'Đang khởi tạo Link Hub...' : 'Kích hoạt ép Index ngay'}
              </Button>
            </Grid>
          </Grid>

          {submitError && (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {submitError}
            </Alert>
          )}
        </Box>
      </Paper>

      {/* Row 2: Stats cards */}
      {statsError ? (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          Không lấy được thông tin thống kê chung từ API.
        </Alert>
      ) : !stats ? (
        <Grid container spacing={2.5}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={108} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2.5}>
          {/* Card 1: Total Links */}
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%', bgcolor: 'background.paper' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  Tổng số link V2
                </Typography>
                <Typography sx={{ fontSize: '2.1rem', fontWeight: 900, color: 'text.primary', mt: 0.5, lineHeight: 1 }}>
                  {totals.links.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 2: Submitted API */}
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%', bgcolor: 'background.paper' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  Đã gửi Google API
                </Typography>
                <Typography sx={{ fontSize: '2.1rem', fontWeight: 900, color: '#2563eb', mt: 0.5, lineHeight: 1 }}>
                  {totals.submitted.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 3: Googlebot visits */}
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%', bgcolor: 'background.paper' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  Googlebot đã crawl
                </Typography>
                <Typography sx={{ fontSize: '2.1rem', fontWeight: 900, color: '#7c3aed', mt: 0.5, lineHeight: 1 }}>
                  {totals.crawled.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 4: Indexed (PREMIUM GRADIENT HIGHLIGHT) */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                border: '1.5px solid #00b894',
                borderRadius: 4,
                height: '100%',
                background: 'linear-gradient(135deg, rgba(0, 184, 148, 0.04) 0%, rgba(0, 206, 201, 0.04) 100%)',
                boxShadow: '0 4px 20px rgba(0, 184, 148, 0.05)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography sx={{ fontSize: '0.72rem', color: '#009975', fontWeight: 900, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    Đã Index thực tế (SERP)
                  </Typography>
                  <Chip
                    label={`${indexingRate}%`}
                    size="small"
                    sx={{ bgcolor: '#00b894', color: '#fff', fontWeight: 900, fontSize: '0.68rem', height: 18 }}
                  />
                </Box>
                <Typography sx={{ fontSize: '2.1rem', fontWeight: 900, color: '#00b894', mt: 0.5, lineHeight: 1 }}>
                  {totals.indexed.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Row 3: List Table Area */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        {/* Table Toolbar */}
        <Box
          sx={{
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Left search */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 260, maxWidth: 450 }}>
            <TextField
              placeholder="Tìm kiếm URL, Anchor, Slug, Topic..."
              size="small"
              fullWidth
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                },
              }}
            />
          </Box>

          {/* Right actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Limit Selector */}
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                sx={{ borderRadius: 2.5 }}
              >
                <MenuItem value={20}>20 dòng</MenuItem>
                <MenuItem value={50}>50 dòng</MenuItem>
                <MenuItem value={100}>100 dòng</MenuItem>
                <MenuItem value={200}>200 dòng</MenuItem>
              </Select>
            </FormControl>

            {/* Engine Selector */}
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <Select
                value={engine}
                onChange={(e) => setEngine(e.target.value as 'local' | 'apify')}
                sx={{ borderRadius: 2.5 }}
              >
                <MenuItem value="local">Local (Bot)</MenuItem>
                <MenuItem value="apify">Apify SERP</MenuItem>
              </Select>
            </FormControl>

            {/* Check Index Button */}
            <Button
              variant="contained"
              disabled={isCheckingIndex}
              onClick={handleCheckIndex}
              startIcon={isCheckingIndex ? <CircularProgress size={16} color="inherit" /> : <DoneAllIcon sx={{ fontSize: 16 }} />}
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 750,
                bgcolor: 'text.primary',
                color: 'background.paper',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: 'text.secondary',
                  boxShadow: 'none',
                },
              }}
            >
              {isCheckingIndex ? 'Đang check...' : 'Kiểm tra index Google'}
            </Button>

            {/* Manual Refresh Button */}
            <IconButton onClick={handleRefreshManual} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
              <RefreshIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Progress Overlay during check index */}
        {isCheckingIndex && (
          <Box sx={{ bgcolor: 'rgba(0, 184, 148, 0.04)', p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} sx={{ color: '#00b894' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#009975' }}>
              {checkProgress}
            </Typography>
          </Box>
        )}

        {/* Main List Table */}
        {listError ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>
            Không tải được danh sách liên kết từ máy chủ. Vui lòng kiểm tra kết nối mạng.
          </Box>
        ) : !listData ? (
          <Box sx={{ p: 4 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={44} sx={{ my: 1.5, borderRadius: 2 }} />
            ))}
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.disabled' }}>
            <ErrorOutlineIcon sx={{ fontSize: 44, opacity: 0.3, mb: 1.5 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Không tìm thấy URL nào khớp với điều kiện lọc.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Target URL</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Anchor Text</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Chủ đề (Topic)</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Indexed Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.5, textAlign: 'center' }}>Crawl Visits</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Lần crawl cuối</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Ngày tạo</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.5, textAlign: 'center' }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item._id} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    {/* Target URL */}
                    <TableCell sx={{ py: 1.2, maxWidth: 220 }}>
                      <Tooltip title={item.targetUrl} arrow>
                        <a
                          href={item.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#00b894',
                            textDecoration: 'underline',
                            fontWeight: 650,
                            wordBreak: 'break-all',
                            display: 'inline-block'
                          }}
                        >
                          {getHostname(item.targetUrl)}
                        </a>
                      </Tooltip>
                    </TableCell>

                    {/* Anchor Text */}
                    <TableCell sx={{ py: 1.2, fontWeight: 500 }}>
                      {item.anchorText || '—'}
                    </TableCell>

                    {/* Topic */}
                    <TableCell sx={{ py: 1.2 }}>
                      {item.topic ? (
                        <Chip
                          label={item.topic}
                          size="small"
                          sx={{ fontWeight: 700, bgcolor: 'action.hover', color: 'text.primary', borderRadius: 2 }}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                      )}
                    </TableCell>

                    {/* Status badge */}
                    <TableCell sx={{ py: 1.2 }}>
                      {getStatusBadge(item.status, item.indexingApiResponse)}
                    </TableCell>

                    {/* Indexed status badge */}
                    <TableCell sx={{ py: 1.2 }}>
                      {getIndexedBadge(item.indexed, item.indexedAt)}
                    </TableCell>

                    {/* Crawl visits */}
                    <TableCell sx={{ py: 1.2, textAlign: 'center', fontWeight: 800, color: item.crawlVisits > 0 ? 'primary.main' : 'text.disabled' }}>
                      {item.crawlVisits}
                    </TableCell>

                    {/* Last Crawl At */}
                    <TableCell sx={{ py: 1.2, fontSize: '0.8rem', color: 'text.secondary' }}>
                      {formatVnTime(item.lastCrawlAt)}
                    </TableCell>

                    {/* Created Date */}
                    <TableCell sx={{ py: 1.2, fontSize: '0.8rem', color: 'text.secondary' }}>
                      {formatVnTime(item.createdAt)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell sx={{ py: 1.2, textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenDetails(item)}
                          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, py: 0.4 }}
                        >
                          Chi tiết
                        </Button>
                        <Tooltip title="Mở public Hub Page để Googlebot bò qua" arrow>
                          <IconButton
                            size="small"
                            component="a"
                            href={item.hubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                          >
                            <OpenInNewIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Crawl Details Modal */}
      <Dialog
        open={!!selectedLink}
        onClose={() => setSelectedLink(null)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { borderRadius: 4, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 850, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <span>🔍 Chi tiết link & Lịch sử Googlebot crawl</span>
          <IconButton onClick={() => setSelectedLink(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, py: 3.5 }}>
          {selectedLink && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Detailed specs */}
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>
                      TARGET URL (ĐƯỜNG DẪN CẦN INDEX)
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 750, color: 'text.primary', wordBreak: 'break-all' }}>
                      {selectedLink.targetUrl}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>
                      PUBLIC HUB URL (ĐƯỜNG DẪN DECÔY VỆ TINH)
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 750, color: 'primary.main', wordBreak: 'break-all' }}>
                      {selectedLink.hubUrl}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>
                      SLUG ĐỊNH DANH
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 750, fontFamily: 'monospace' }}>
                      {selectedLink.slug}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>
                      API ACCOUNT GỬI GOOGLE
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', wordBreak: 'break-all' }}>
                      {selectedLink.indexingApiAccount || '—'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>
                      THỜI GIAN GỬI API
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatVnTime(selectedLink.indexingApiCalledAt)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Crawl Visits History Table */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 850, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon sx={{ fontSize: 18, color: '#7c3aed' }} />
                  Nhật ký lượt cào quét của Googlebot / Crawlers ({visitsList.length})
                </Typography>

                {loadingVisits ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                    <CircularProgress size={24} sx={{ mr: 1.5 }} />
                    <Typography variant="body2" color="text.secondary">Đang tải lịch sử visits...</Typography>
                  </Box>
                ) : visitsList.length === 0 ? (
                  <Paper elevation={0} sx={{ p: 4, border: '1px dashed', borderColor: 'divider', bgcolor: 'action.hover', textAlign: 'center', borderRadius: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Chưa ghi nhận lượt crawl nào của Googlebot hay các crawler khác đến Decoy Hub URL này.
                    </Typography>
                  </Paper>
                ) : (
                  <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, py: 1.25 }}>Địa chỉ IP</TableCell>
                          <TableCell sx={{ fontWeight: 800, py: 1.25 }}>Googlebot</TableCell>
                          <TableCell sx={{ fontWeight: 800, py: 1.25 }}>Reverse DNS Host</TableCell>
                          <TableCell sx={{ fontWeight: 800, py: 1.25 }}>Thời gian truy cập</TableCell>
                          <TableCell sx={{ fontWeight: 800, py: 1.25 }}>User Agent</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {visitsList.map((visit) => (
                          <TableRow key={visit._id}>
                            {/* IP */}
                            <TableCell sx={{ py: 1, fontWeight: 600 }}>{visit.ip}</TableCell>
                            {/* Is Googlebot */}
                            <TableCell sx={{ py: 1 }}>
                              {visit.isGooglebot ? (
                                <Tooltip title="Xác minh Googlebot thật (DNS đối chiếu chính xác)" arrow>
                                  <CheckCircleIcon sx={{ color: '#10b981', fontSize: 18 }} />
                                </Tooltip>
                              ) : (
                                <CancelIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                              )}
                            </TableCell>
                            {/* Reverse DNS */}
                            <TableCell sx={{ py: 1, fontSize: '0.8rem', color: 'text.secondary' }}>
                              {visit.reverseDnsHost || '—'}
                            </TableCell>
                            {/* Time */}
                            <TableCell sx={{ py: 1, fontSize: '0.8rem', color: 'text.secondary' }}>
                              {formatVnTime(visit.createdAt)}
                            </TableCell>
                            {/* User Agent */}
                            <TableCell sx={{ py: 1, maxWidth: 180 }}>
                              <Tooltip title={visit.userAgent} arrow>
                                <Typography variant="caption" sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block', color: 'text.secondary' }}>
                                  {visit.userAgent}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setSelectedLink(null)}
            sx={{ borderRadius: 2.5, px: 3, textTransform: 'none', fontWeight: 750 }}
          >
            Đóng cửa sổ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
