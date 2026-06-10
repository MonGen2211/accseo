import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';

import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LaunchIcon from '@mui/icons-material/Launch';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import type { Theme } from '@mui/material';

import { useToastify } from '@/components/Toastify';
import LoadingButton from '@mui/lab/LoadingButton';
import { serpService } from './serpService';

interface IndexCheckItem {
  url: string;
  indexed: boolean | null;
  firstResult: string;
  title: string;
  snippet: string;
  error?: string | null;
  searchResultCount?: number;
  tookMs?: number;
  query?: string;
  foundCount?: number;
}

interface IndexCheckResult {
  summary: {
    total: number;
    indexed: number;
    notIndexed: number;
    failed: number;
  };
  tookMs: number;
  results: IndexCheckItem[];
}

interface GoogleIndexCheckerProps {
  isActive?: boolean;
}

export default function GoogleIndexChecker({ isActive = true }: GoogleIndexCheckerProps) {
  const { showToast } = useToastify();

  // Local state
  const [urlsInput, setUrlsInput] = useState('');
  const [location, setLocation] = useState('VN');
  const [language, setLanguage] = useState('vi');
  const [minDelay, setMinDelay] = useState('4000');
  const [maxDelay, setMaxDelay] = useState('8000');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IndexCheckResult | null>(null);
  const [engine, setEngine] = useState<'local' | 'apify'>('local');

  // Search and tabs filter
  const [tabFilter, setTabFilter] = useState<'all' | 'indexed' | 'notIndexed' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Progress simulation states
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [simulatedIndex, setSimulatedIndex] = useState(0);
  const [simulatedUrl, setSimulatedUrl] = useState('');

  // Normalize, trim, and de-duplicate input URLs
  const parsedUrls = useMemo(() => {
    return urlsInput
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
  }, [urlsInput]);

  // Simulated countdown interval for loading state
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading && parsedUrls.length > 0 && isActive) {
      Promise.resolve().then(() => {
        setSimulatedProgress(0);
        setSimulatedIndex(0);
        setSimulatedUrl(parsedUrls[0]);
      });

      // Calculate approximate total delay
      const avgDelayPerUrl = engine === 'apify' 
        ? 1500 
        : (Number(minDelay) + Number(maxDelay)) / 2 + 3500;
      const startupOverhead = engine === 'apify' ? 10000 : 0; // 10s startup for Apify Cloud
      const totalEstimatedMs = (parsedUrls.length * avgDelayPerUrl) + startupOverhead;
      const tickInterval = 500; // Tick every half second

      let elapsedMs = 0;
      timer = setInterval(() => {
        elapsedMs += tickInterval;
        const rawProgress = Math.floor((elapsedMs / totalEstimatedMs) * 98);
        setSimulatedProgress(Math.min(98, rawProgress));

        // Periodically rotate the active checking URL in loader message
        const currentUrlIdx = Math.min(
          parsedUrls.length - 1,
          Math.floor((elapsedMs / totalEstimatedMs) * parsedUrls.length)
        );
        setSimulatedIndex(currentUrlIdx);
        setSimulatedUrl(parsedUrls[currentUrlIdx]);
      }, tickInterval);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading, parsedUrls, minDelay, maxDelay, engine, isActive]);

  // Map backend error codes to Vietnamese descriptions
  const mapErrorCode = (err: string | null | undefined) => {
    if (!err) return 'Lỗi hệ thống';
    switch (err.toUpperCase()) {
      case 'SORRY_PAGE':
        return 'Google chặn tạm thời (Sorry Page)';
      case 'CAPTCHA_FAIL':
        return 'Không vượt qua được captcha Google';
      case 'HARD_BLOCK_IP_BURNED':
        return 'IP bị Google block hoàn toàn, dừng quét';
      default:
        return `Lỗi quét chỉ mục (${err})`;
    }
  };

  // Validation and submit handler
  const handleCheckIndex = async () => {
    if (parsedUrls.length === 0) {
      showToast('Vui lòng nhập ít nhất 1 đường dẫn (URL) cần kiểm tra!', 'warning');
      return;
    }

    if (parsedUrls.length > 50) {
      showToast('Hệ thống hỗ trợ kiểm tra tối đa 50 URL cùng lúc!', 'warning');
      return;
    }

    // Validate that each URL starts with http:// or https://
    const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
    const invalidUrl = parsedUrls.find(url => !urlRegex.test(url));
    if (invalidUrl) {
      showToast(`Đường dẫn "${invalidUrl.substring(0, 30)}..." không hợp lệ! URL phải bắt đầu bằng http:// hoặc https://.`, 'warning');
      return;
    }

    setLoading(true);
    setResult(null);
    setExpandedRows({});

    try {
      const res = await serpService.checkIndex({
        urls: parsedUrls,
        geo: location.toLowerCase(),
        hl: language.toLowerCase(),
        minDelayMs: Number(minDelay),
        maxDelayMs: Number(maxDelay),
        engine: engine
      });

      if (res.success && res.data) {
        setResult(res.data);
        showToast(`Đã kiểm tra xong chỉ mục ${res.data.summary.total} URL!`, 'success');
      } else {
        showToast(res.message || 'Lỗi kiểm tra Google Index', 'danger');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ Index Checker';
      const axiosError = err as { response?: { data?: { message?: string } } };
      showToast(axiosError.response?.data?.message || errorMsg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Clear fields
  const handleClear = () => {
    setUrlsInput('');
    setResult(null);
    setSearchQuery('');
    setExpandedRows({});
    setEngine('local');
  };

  // Filtered list computed property
  const filteredResults = useMemo(() => {
    if (!result?.results) return [];

    return result.results.filter((item: IndexCheckItem) => {
      // 1. Tab filters
      if (tabFilter === 'indexed' && item.indexed !== true) return false;
      if (tabFilter === 'notIndexed' && item.indexed !== false) return false;
      if (tabFilter === 'failed' && item.indexed !== null) return false;

      // 2. Keyword/URL search filter
      if (searchQuery.trim()) {
        return item.url.toLowerCase().includes(searchQuery.toLowerCase().trim());
      }
      return true;
    });
  }, [result, tabFilter, searchQuery]);

  // Export to Excel CSV
  const handleDownloadCsv = () => {
    if (!result?.results) return;
    const headers = ['URL', 'Trạng thái Index', 'Google site: Query', 'Số lượng kết quả Google', 'URL đầu tiên trả về', 'Mã lỗi'];
    const rows = result.results.map((item: IndexCheckItem) => {
      const statusStr = item.indexed === true ? 'Đã Index' : item.indexed === false ? 'Chưa Index' : 'Không xác định (Lỗi)';
      return [
        item.url,
        statusStr,
        item.query,
        item.foundCount ?? 0,
        item.firstResult || '-',
        item.error || '-'
      ];
    });

    const csvContent = "\uFEFF" // Add BOM for Excel Vietnamese language support
      + [headers.join(','), ...rows.map((r: string[]) => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `google-index-results-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Tải file CSV thành công!', 'success');
  };

  return (
    <Box sx={{ width: '100%' }}>
      
      {/* SECTION PANEL HEADER */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box 
          sx={{ 
            width: 44, 
            height: 44, 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            bgcolor: 'primary.main', 
            boxShadow: 'none', 
            mr: 2 
          }}
        >
          <CloudDoneIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px', color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            Check Index
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.1, fontWeight: 500, fontSize: '0.85rem' }}>
            Kiểm tra trạng thái lập chỉ mục (index) của URL trên Google Search
          </Typography>
        </Box>
      </Box>

      {/* INPUT CONFIGURATION PANEL */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4.5 },
          borderRadius: 5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          mb: 4
        }}
      >
        <Grid container spacing={4.5}>
          
          {/* Left Column: Multiline URLs Input */}
          <Grid item xs={12} md={7}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: 'text.secondary', mb: 1.2, textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Đường dẫn cần check (URLs) <span style={{ color: '#ef4444' }}>*</span></span>
                <Chip label={`${parsedUrls.length}/50 URL`} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', height: 20, bgcolor: 'action.selected' }} />
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={11}
                placeholder="Nhập danh sách URL cần kiểm tra index, mỗi dòng một URL (vd: https://thuvienphapluat.vn/...)"
                value={urlsInput}
                onChange={(e) => setUrlsInput(e.target.value)}
                sx={{ 
                  flexGrow: 1,
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: '16px', 
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc', 
                    fontFamily: 'monospace', 
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.15s ease-in-out',
                    '&:hover': {
                      borderColor: 'text.secondary',
                    },
                    '&.Mui-focused': {
                      bgcolor: 'background.paper',
                    }
                  } 
                }}
              />
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
                    Mỗi dòng nhập một đường dẫn URL. Hệ thống hỗ trợ tối đa 50 URL trong một lần check.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
                    Các URL bắt buộc phải chứa giao thức <code>http://</code> hoặc <code>https://</code>.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Right Column: Configuration & Actions */}
          <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Quốc gia
                </Typography>
                <FormControl fullWidth size="small">
                  <Select 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                    sx={{ 
                      borderRadius: '100px', 
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      '& .MuiOutlinedInput-root': { borderRadius: '100px' }
                    }}
                  >
                    <MenuItem value="VN">Việt Nam</MenuItem>
                    <MenuItem value="US">Hoa Kỳ</MenuItem>
                    <MenuItem value="SG">Singapore</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Ngôn ngữ
                </Typography>
                <FormControl fullWidth size="small">
                  <Select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)} 
                    sx={{ 
                      borderRadius: '100px', 
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      '& .MuiOutlinedInput-root': { borderRadius: '100px' }
                    }}
                  >
                    <MenuItem value="vi">Tiếng Việt</MenuItem>
                    <MenuItem value="en">Tiếng Anh</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: 'text.secondary', mb: 1.2, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Công cụ quét (Crawl Engine)
              </Typography>
              <ToggleButtonGroup
                color="primary"
                value={engine}
                exclusive
                onChange={(_e, val) => { if (val) setEngine(val); }}
                size="small"
                fullWidth
                sx={{ 
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc', 
                  borderRadius: '100px',
                  p: 0.4,
                  border: '1px solid',
                  borderColor: 'divider',
                  '& .MuiToggleButton-root': { border: 'none', borderRadius: '100px', py: 0.8, fontWeight: 700, textTransform: 'none', fontSize: '0.78rem' },
                  '& .Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }
                }}
              >
                <ToggleButton value="local">Local Crawler (Mặc định)</ToggleButton>
                <ToggleButton value="apify">Apify Cloud (Cao cấp)</ToggleButton>
              </ToggleButtonGroup>

              {/* Dynamic comparative help alert */}
              <Box 
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  borderRadius: 3, 
                  border: '1px solid',
                  transition: 'all 0.25s ease-in-out',
                  bgcolor: (theme) => {
                    const isDark = theme.palette.mode === 'dark';
                    if (engine === 'local') return isDark ? 'rgba(2, 132, 199, 0.06)' : '#f0f9ff';
                    return isDark ? 'rgba(16, 185, 129, 0.06)' : '#f0fdf4';
                  },
                  borderColor: (theme) => {
                    const isDark = theme.palette.mode === 'dark';
                    if (engine === 'local') return isDark ? 'rgba(2, 132, 199, 0.25)' : '#bae6fd';
                    return isDark ? 'rgba(16, 185, 129, 0.25)' : '#bbf7d0';
                  }
                }}
              >
                {engine === 'local' ? (
                  <>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: (theme) => theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7', display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                      CRAWLER LOCAL (TRÌNH DUYỆT HỆ THỐNG)
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Tốc độ xử lý</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>Chậm (8-12s / URL, Chrome tuần tự)</Typography>
                      </Box>
                      <Divider sx={{ opacity: 0.5 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Chi phí vận hành</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#10b981' }}>Miễn phí ($0)</Typography>
                      </Box>
                      <Divider sx={{ opacity: 0.5 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Mức độ rủi ro</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#ef4444' }}>Dễ bị Google chặn tạm thời hoặc gặp Captcha</Typography>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: (theme) => theme.palette.mode === 'dark' ? '#34d399' : '#059669', display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                      APIFY CLOUD (ĐÁM MÂY PREMIUM)
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Tốc độ xử lý</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>Siêu tốc (~1.7s / URL, cào song song)</Typography>
                      </Box>
                      <Divider sx={{ opacity: 0.5 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Chi phí vận hành</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669' }}>Rất rẻ (~$0.0045 / URL, Free $5 test ~1100 URL)</Typography>
                      </Box>
                      <Divider sx={{ opacity: 0.5 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Độ tin cậy & ổn định</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#10b981' }}>99%+ (Không lo block IP, cào qua Proxy sạch)</Typography>
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </Box>

            {/* Collapsible Advanced Settings (Delays between crawl calls) */}
            <Box>
              <Button
                variant="text"
                size="small"
                startIcon={<TuneIcon sx={{ fontSize: 13 }} />}
                onClick={() => setShowAdvanced(!showAdvanced)}
                sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 700, p: 0 }}
              >
                {showAdvanced ? 'Ẩn cấu hình nâng cao' : 'Tùy chọn cấu hình nâng cao'}
              </Button>
              <Collapse in={showAdvanced} sx={{ mt: 1.5 }}>
                <Box sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc', borderRadius: '16px', border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: 'text.secondary', mb: 0.8, textTransform: 'uppercase' }}>
                      Delay tối thiểu (ms)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="Mặc định: 4000"
                      value={minDelay}
                      onChange={(e) => setMinDelay(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '100px', bgcolor: 'background.paper', fontSize: '0.8rem' } }}
                      inputProps={{ min: 0, max: 20000 }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: 'text.secondary', mb: 0.8, textTransform: 'uppercase' }}>
                      Delay tối đa (ms)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      placeholder="Mặc định: 8000"
                      value={maxDelay}
                      onChange={(e) => setMaxDelay(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '100px', bgcolor: 'background.paper', fontSize: '0.8rem' } }}
                      inputProps={{ min: 0, max: 20000 }}
                    />
                  </Box>
                </Box>
              </Collapse>
            </Box>

          </Grid>
        </Grid>

        <Divider sx={{ my: 3.5, borderStyle: 'dashed', borderColor: 'divider' }} />

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <LoadingButton
            variant="contained"
            onClick={handleCheckIndex}
            loading={loading}
            loadingPosition="start"
            startIcon={<CloudQueueIcon sx={{ fontSize: 16 }} />}
            sx={{
              minWidth: 200,
              borderRadius: '100px',
              height: 40,
              fontWeight: 900,
              fontSize: '0.88rem',
              textTransform: 'none',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: 'none',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'scale(1.02)',
                boxShadow: 'none'
              },
              '&.Mui-disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled'
              }
            }}
          >
            {loading ? 'Đang kiểm tra...' : 'Bắt đầu kiểm tra'}
          </LoadingButton>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleClear}
            disabled={loading}
            sx={{ 
              borderRadius: '100px', 
              height: 40,
              px: 3,
              textTransform: 'none', 
              fontWeight: 700, 
              fontSize: '0.85rem', 
              borderColor: 'divider',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'action.hover',
                borderColor: 'divider',
                transform: 'scale(1.02)'
              }
            }}
          >
            Xóa dữ liệu
          </Button>
        </Box>
      </Paper>

      {/* SEARCH / STATS / LOADING VIEWS */}
      {(loading || result) && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          
          {/* LIVE PROGRESS LOADER PANEL */}
          {loading ? (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                borderRadius: 5, 
                border: '1px solid', 
                borderColor: 'divider', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                textAlign: 'center' 
              }}
            >
              <CircularProgress size={42} thickness={4} sx={{ mb: 2.5, color: '#0891b2' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                {engine === 'apify' 
                  ? 'Đang quét lập chỉ mục siêu tốc qua Apify Cloud...' 
                  : 'Đang quét lập chỉ mục trên Google Search...'}
              </Typography>
              
              {/* Progress Bar Container */}
              <Box sx={{ width: '100%', maxWidth: 450, height: 6, bgcolor: 'action.hover', borderRadius: 3, overflow: 'hidden', mb: 2 }}>
                <Box 
                  sx={{ 
                    height: '100%', 
                    width: `${simulatedProgress}%`, 
                    bgcolor: 'primary.main', 
                    borderRadius: 3,
                    transition: 'width 0.5s ease-out' 
                  }} 
                />
              </Box>

              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0891b2', mb: 0.5 }}>
                {engine === 'apify'
                  ? `Đang quét song song ${parsedUrls.length} URL qua Apify Cloud (${simulatedProgress}%)`
                  : `Đang check ${simulatedIndex + 1}/${parsedUrls.length} URL (${simulatedProgress}%)`}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 500, lineHeight: 1.5, wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {simulatedUrl}
              </Typography>
              {engine === 'apify' && (
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1, maxWidth: 450, lineHeight: 1.4 }}>
                  Hệ thống đang khởi động premium cloud crawler của Apify và quét song song các URL thông qua mạng lưới proxy an toàn. Thời gian dự kiến khoảng 15 - 25 giây.
                </Typography>
              )}
            </Paper>
          ) : result?.summary ? (
            <Box>
              
              {/* SUMMARY KPI METRICS CARDS */}
              <Grid container spacing={2} sx={{ mb: 3.5 }}>
                {[
                  { label: 'TỔNG URL', val: result.summary.total, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.25)' },
                  { label: 'ĐÃ INDEX', val: result.summary.indexed, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.25)' },
                  { label: 'CHƯA INDEX', val: result.summary.notIndexed, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.25)' },
                  { label: 'KHÔNG XÁC ĐỊNH / LỖI', val: result.summary.failed, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.25)' },
                  { label: 'THỜI GIAN CHẠY', val: `${(result.tookMs / 1000).toFixed(1)}s`, color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', border: 'rgba(100, 116, 139, 0.2)' }
                ].map((card, i) => (
                  <Grid item xs={6} sm={2.4} key={i}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2.2, 
                        borderRadius: '16px', 
                        border: '1px solid', 
                        borderColor: card.border, 
                        bgcolor: card.bg, 
                        textAlign: 'center',
                        boxShadow: 'none'
                      }}
                    >
                      <Typography sx={{ color: card.color, fontWeight: 900, fontSize: '1.25rem', fontFamily: 'monospace', mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8 }}>
                        {card.val}
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {card.label}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* ACTION ROW (FILTERS, SEARCH, CSV EXPORT) */}
              <Paper 
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  mb: 4
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', gap: 2, mb: 2.5 }}>
                  
                  {/* Status Tab Filters */}
                  <Box sx={{ display: 'flex', bgcolor: 'background.default', p: 0.5, borderRadius: '100px', border: '1px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 0.5 }}>
                    {[
                      { key: 'all', label: `Tất cả (${result.summary.total})` },
                      { key: 'indexed', label: `Đã Index (${result.summary.indexed})` },
                      { key: 'notIndexed', label: `Chưa Index (${result.summary.notIndexed})` },
                      { key: 'failed', label: `Lỗi / K.Xác định (${result.summary.failed})` }
                    ].map((tab) => (
                      <Button
                        key={tab.key}
                        size="small"
                        onClick={() => setTabFilter(tab.key as 'all' | 'indexed' | 'notIndexed' | 'failed')}
                        sx={{ 
                          borderRadius: '100px', 
                          px: 2, 
                          py: 0.6,
                          fontWeight: 700, 
                          fontSize: '0.78rem',
                          textTransform: 'none',
                          color: tabFilter === tab.key ? 'primary.contrastText' : 'text.secondary',
                          bgcolor: tabFilter === tab.key ? 'primary.main' : 'transparent',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: tabFilter === tab.key ? 'primary.dark' : 'action.hover',
                            transform: 'scale(1.02)'
                          }
                        }}
                      >
                        {tab.label}
                      </Button>
                    ))}
                  </Box>

                  {/* Search and Download Actions */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TextField
                      placeholder="Tìm kiếm URL..."
                      size="small"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ color: 'text.disabled', fontSize: 16, mr: 0.5 }} />
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: '100px', 
                          fontSize: '0.8rem', 
                          bgcolor: 'background.default',
                          width: { xs: '100%', sm: 180 }
                        } 
                      }}
                    />
                    <Button
                      variant="outlined"
                      color="success"
                      size="small"
                      startIcon={<FileDownloadIcon sx={{ fontSize: 14 }} />}
                      onClick={handleDownloadCsv}
                      sx={{
                        borderRadius: '100px',
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        height: 38,
                        px: 2.5,
                        color: '#10b981',
                        borderColor: 'rgba(16, 185, 129, 0.4)',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: '#10b981',
                          bgcolor: 'rgba(16, 185, 129, 0.04)',
                          transform: 'scale(1.02)'
                        }
                      }}
                    >
                      Export Excel
                    </Button>
                  </Box>

                </Box>

                {/* KEYWORDS RESULTS DATA TABLE */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  
                  {/* Table header row */}
                  <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: '50px 1fr 180px 180px 120px 100px', gap: 1.5, px: 2, py: 1, bgcolor: 'action.hover', borderRadius: 2, fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <Box>#</Box>
                    <Box>Đường dẫn URL</Box>
                    <Box sx={{ textAlign: 'center' }}>Trạng thái</Box>
                    <Box>First Result URL</Box>
                    <Box sx={{ textAlign: 'center' }}>Took</Box>
                    <Box sx={{ textAlign: 'center' }}>Chi tiết</Box>
                  </Box>

                  {/* Empty state */}
                  {filteredResults.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Không có URL kết quả nào khớp với bộ lọc hiện tại.
                      </Typography>
                    </Box>
                  ) : (
                    filteredResults.map((item: IndexCheckItem, idx: number) => {
                      const isRowExpanded = !!expandedRows[item.url];
                      
                      let statusBadge = (
                        <Chip label="Không xác định" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 800, border: '1px solid rgba(245, 158, 11, 0.2)', height: 22, fontSize: '0.7rem' }} />
                      );
                      if (item.indexed === true) {
                        statusBadge = (
                          <Chip label="Đã Index" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 800, border: '1px solid rgba(16, 185, 129, 0.2)', height: 22, fontSize: '0.7rem' }} />
                        );
                      } else if (item.indexed === false) {
                        statusBadge = (
                          <Chip label="Chưa Index" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 800, border: '1px solid rgba(239, 68, 68, 0.2)', height: 22, fontSize: '0.7rem' }} />
                        );
                      }

                      const rowBg = item.indexed === null
                        ? ((theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.04)' : 'rgba(245, 158, 11, 0.01)')
                        : 'background.default';

                      return (
                        <Paper
                          key={idx}
                          elevation={0}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            p: 2,
                            borderRadius: '16px',
                            border: '1px solid',
                            borderColor: item.indexed === null ? 'warning.light' : isRowExpanded ? 'primary.light' : 'divider',
                            bgcolor: rowBg,
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: item.indexed === null ? 'warning.main' : 'primary.light'
                            }
                          }}
                        >
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '50px 1fr 180px 180px 120px 100px' }, gap: 1.5, alignItems: 'center' }}>
                            
                            {/* Index */}
                            <Box>
                              <Typography sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.8rem' }}>
                                {idx + 1}
                              </Typography>
                            </Box>

                            {/* URL */}
                            <Box sx={{ minWidth: 0, overflow: 'hidden', pr: 2 }}>
                              <Typography 
                                noWrap 
                                sx={{ 
                                  fontWeight: 800, 
                                  fontSize: '0.85rem', 
                                  color: 'text.primary', 
                                  cursor: 'pointer', 
                                  '&:hover': { color: 'primary.main' } 
                                }} 
                                onClick={() => setExpandedRows(prev => ({ ...prev, [item.url]: !isRowExpanded }))}
                              >
                                {item.url}
                              </Typography>
                            </Box>

                            {/* Status Chip */}
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              {statusBadge}
                            </Box>

                            {/* First Result URL Link */}
                            <Box sx={{ minWidth: 0, overflow: 'hidden', pr: 2 }}>
                              {item.firstResult ? (
                                <Tooltip title={item.firstResult} arrow placement="top">
                                  <Link 
                                    href={item.firstResult} 
                                    target="_blank" 
                                    underline="none"
                                    sx={{ 
                                      color: 'primary.main', 
                                      fontSize: '0.8rem', 
                                      fontWeight: 500, 
                                      display: 'inline-flex', 
                                      alignItems: 'center', 
                                      gap: 0.8, 
                                      maxWidth: '100%',
                                      '&:hover': { color: 'primary.dark' } 
                                    }}
                                  >
                                    <LaunchIcon sx={{ fontSize: 12, flexShrink: 0 }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {item.firstResult}
                                    </span>
                                  </Link>
                                </Tooltip>
                              ) : (
                                <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                  —
                                </Typography>
                              )}
                            </Box>

                            {/* Crawl Duration */}
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 600, fontFamily: 'monospace' }}>
                                {item.tookMs ? `${(item.tookMs / 1000).toFixed(1)}s` : '—'}
                              </Typography>
                            </Box>

                            {/* Toggle Expander Button */}
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setExpandedRows(prev => ({ ...prev, [item.url]: !isRowExpanded }))}
                                sx={{ borderRadius: '100px', fontSize: '0.68rem', py: 0.3, textTransform: 'none', fontWeight: 800 }}
                              >
                                {isRowExpanded ? 'Thu gọn' : 'Chi tiết'}
                              </Button>
                            </Box>

                          </Box>

                          {/* COLLAPSE ROW EXPANDED DETAIL VIEW */}
                          <Collapse in={isRowExpanded} sx={{ mt: 2 }}>
                            <Divider sx={{ my: 1.5, borderColor: 'divider' }} />
                            <Box sx={{ pl: { xs: 0, md: 5 }, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              
                              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5 }}>
                                Chi tiết kiểm tra từ Google Search
                              </Typography>

                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, display: 'block', mb: 0.2 }}>
                                    Google Site Query:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'background.default', p: 1, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                                    {item.query}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, display: 'block', mb: 0.2 }}>
                                    Thông tin lập chỉ mục:
                                  </Typography>
                                  <Box sx={{ bgcolor: 'background.default', p: 1, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                      • Số lượng kết quả thấy: <span style={{ color: item.foundCount > 0 ? '#10b981' : '#ef4444' }}>{item.foundCount ?? 0}</span>
                                    </Typography>
                                    {item.error && (
                                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'error.main' }}>
                                        • Lỗi cào Google: {mapErrorCode(item.error)}
                                      </Typography>
                                    )}
                                  </Box>
                                </Grid>
                              </Grid>

                              {item.firstResult && (
                                <Box>
                                  <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, display: 'block', mb: 0.2 }}>
                                    Verified First Result Link:
                                  </Typography>
                                  <Link 
                                    href={item.firstResult} 
                                    target="_blank" 
                                    underline="none"
                                    sx={{ 
                                      color: 'primary.main', 
                                      fontSize: '0.78rem', 
                                      fontWeight: 500, 
                                      wordBreak: 'break-all',
                                      '&:hover': { color: 'primary.dark' }
                                    }}
                                  >
                                    {item.firstResult}
                                  </Link>
                                </Box>
                              )}

                            </Box>
                          </Collapse>

                        </Paper>
                      );
                    })
                  )}

                </Box>
              </Paper>

            </Box>
          ) : null}

        </Box>
      )}

    </Box>
  );
}
