import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
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

import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import CampaignIcon from '@mui/icons-material/Campaign';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import LaunchIcon from '@mui/icons-material/Launch';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TuneIcon from '@mui/icons-material/Tune';

import { useToastify } from '../../components/Toastify';
import { serpService } from './serpService';

// Helper function to extract main domain from URL
const getDomainFromUrl = (urlStr: string) => {
  if (!urlStr) return '';
  try {
    const urlObj = new URL(urlStr);
    return urlObj.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    const match = urlStr.match(/^(?:https?:\/\/)?(?:www\.)?([^:\/\s]+)/i);
    return match ? match[1].toLowerCase() : '';
  }
};

interface SerpState {
  keywordsInput: string;
  domain: string;
  competitorsInput: string;
  scanDepth: string;
  location: string;
  language: string;
  mode: 'fast' | 'slow' | 'apify';
  loading: boolean;
  result: any;
  cookieFresh: boolean | null;
  isRefreshingCookie: boolean;
  listeners: Set<() => void>;
}

const serpSharedState: SerpState = {
  keywordsInput: '',
  domain: '',
  competitorsInput: '',
  scanDepth: '10',
  location: 'VN',
  language: 'vi',
  mode: 'fast',
  loading: false,
  result: null,
  cookieFresh: null,
  isRefreshingCookie: false,
  listeners: new Set()
};

const notifyListeners = () => {
  serpSharedState.listeners.forEach(listener => listener());
};

const updateSerpSharedState = (updates: Partial<Omit<SerpState, 'listeners'>>) => {
  Object.assign(serpSharedState, updates);
  notifyListeners();
};

export default function QuickSerpChecker() {
  const { showToast } = useToastify();

  // Subscribe to the shared global singleton store
  const [state, setState] = useState({
    keywordsInput: serpSharedState.keywordsInput,
    domain: serpSharedState.domain,
    competitorsInput: serpSharedState.competitorsInput,
    scanDepth: serpSharedState.scanDepth,
    location: serpSharedState.location,
    language: serpSharedState.language,
    mode: serpSharedState.mode,
    loading: serpSharedState.loading,
    result: serpSharedState.result,
    cookieFresh: serpSharedState.cookieFresh,
    isRefreshingCookie: serpSharedState.isRefreshingCookie
  });

  useEffect(() => {
    const handleChange = () => {
      setState({
        keywordsInput: serpSharedState.keywordsInput,
        domain: serpSharedState.domain,
        competitorsInput: serpSharedState.competitorsInput,
        scanDepth: serpSharedState.scanDepth,
        location: serpSharedState.location,
        language: serpSharedState.language,
        mode: serpSharedState.mode,
        loading: serpSharedState.loading,
        result: serpSharedState.result,
        cookieFresh: serpSharedState.cookieFresh,
        isRefreshingCookie: serpSharedState.isRefreshingCookie
      });
    };
    serpSharedState.listeners.add(handleChange);

    // Initial Cookie status load
    if (serpSharedState.cookieFresh === null) {
      checkCookieStatus();
    }

    return () => {
      serpSharedState.listeners.delete(handleChange);
    };
  }, []);

  // Fetch Google Cookie Status
  const checkCookieStatus = async () => {
    try {
      const res = await serpService.getCookieStatus();
      if (res.success && res.data) {
        updateSerpSharedState({ cookieFresh: res.data.fresh });
      }
    } catch (err) {
      console.error('Lỗi check cookie Google:', err);
    }
  };

  // Refresh Google Cookie
  const handleRefreshCookie = async () => {
    updateSerpSharedState({ isRefreshingCookie: true });
    try {
      const res = await serpService.refreshCookie();
      if (res.success && res.data?.ok) {
        showToast(`Làm mới Cookie thành công! Nhận diện được ${res.data.cookies} cookies.`, 'success');
        updateSerpSharedState({ cookieFresh: true });
      } else {
        showToast(res.data?.error || 'Không làm mới được cookie Google!', 'danger');
        updateSerpSharedState({ cookieFresh: false });
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Lỗi khi kết nối API refresh-cookie', 'danger');
      updateSerpSharedState({ cookieFresh: false });
    } finally {
      updateSerpSharedState({ isRefreshingCookie: false });
    }
  };



  // Results search & filters state
  const [resultsTab, setResultsTab] = useState<'all' | 'found' | 'notfound' | 'error'>('all');
  const [resultsSearch, setResultsSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [rowRecheckLoading, setRowRecheckLoading] = useState<Record<string, boolean>>({});

  // Dynamic values based on keywords input
  const parsedKeywords = useMemo(() => {
    return state.keywordsInput
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);
  }, [state.keywordsInput]);

  const parsedCompetitors = useMemo(() => {
    return state.competitorsInput
      .split('\n')
      .map(c => c.trim().toLowerCase())
      .filter(c => c.length > 0 && c !== state.domain.trim().toLowerCase());
  }, [state.competitorsInput, state.domain]);

  // Main Submit handler (Batch Checker)
  const handleCheck = async () => {
    const trimmedDomain = state.domain.trim().toLowerCase();
    if (!trimmedDomain) {
      showToast('Vui lòng nhập tên miền chính của bạn!', 'warning');
      return;
    }
    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(trimmedDomain)) {
      showToast('Tên miền chính không hợp lệ (vd: accgroup.vn)!', 'warning');
      return;
    }

    if (parsedKeywords.length === 0) {
      showToast('Vui lòng nhập ít nhất 1 từ khóa cần kiểm tra!', 'warning');
      return;
    }

    if (parsedKeywords.length > 50) {
      showToast('Hệ thống hỗ trợ kiểm tra tối đa 50 từ khóa cùng lúc!', 'warning');
      return;
    }

    const invalidKw = parsedKeywords.find(k => k.length > 200);
    if (invalidKw) {
      showToast(`Từ khóa "${invalidKw.substring(0, 15)}..." quá dài! Tối đa 200 ký tự.`, 'warning');
      return;
    }

    // Check competitor limit
    if (parsedCompetitors.length > 10) {
      showToast('Chỉ hỗ trợ tối đa 10 đối thủ cạnh tranh!', 'warning');
      return;
    }

    const invalidComp = parsedCompetitors.find(c => !domainRegex.test(c));
    if (invalidComp) {
      showToast(`Tên miền đối thủ "${invalidComp}" không hợp lệ!`, 'warning');
      return;
    }

    updateSerpSharedState({ loading: true, result: null });
    setExpandedRows({});

    try {
      const res = await serpService.batchCheck({
        keywords: parsedKeywords,
        domain: trimmedDomain,
        competitors: parsedCompetitors.length > 0 ? parsedCompetitors : undefined,
        topN: Number(state.scanDepth),
        mode: state.mode,
        geo: state.location.toLowerCase(),
        hl: state.language.toLowerCase()
      });

      if (res.success && res.data) {
        updateSerpSharedState({ result: res.data, loading: false });
        showToast(`Đã kiểm tra thành công ${res.data.ok}/${parsedKeywords.length} từ khóa!`, 'success');
        // Refresh cookie status
        checkCookieStatus();
      } else {
        showToast(res.message || 'Lỗi quét hàng loạt từ khóa SERP', 'danger');
        updateSerpSharedState({ loading: false });
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ SERP', 'danger');
      updateSerpSharedState({ loading: false });
    }
  };

  // Row-level single recheck handler via Puppeteer `/serp/check` API
  const handleRecheckRow = async (kw: string) => {
    setRowRecheckLoading(prev => ({ ...prev, [kw]: true }));
    try {
      const trimmedDomain = state.domain.trim().toLowerCase();
      const res = await serpService.checkRank({
        keyword: kw,
        domain: trimmedDomain,
        competitors: parsedCompetitors.length > 0 ? parsedCompetitors : undefined,
        geo: state.location.toLowerCase(),
        hl: state.language.toLowerCase()
      });

      const updatedItem = res?.data || res;
      
      // Map correctly to results list inside batch state
      if (state.result && state.result.results) {
        const newResults = state.result.results.map((item: any) => {
          if (item.keyword === kw) {
            return {
              ...item,
              blocked: !!updatedItem.blocked,
              error: updatedItem.error || (updatedItem.blocked ? 'SORRY_PAGE' : null),
              position: updatedItem.position,
              ranks: updatedItem.ranks || {},
              organicResults: updatedItem.organicResults || [],
              comparisons: updatedItem.comparisons || [],
              scrapedAt: updatedItem.scrapedAt || new Date().toISOString()
            };
          }
          return item;
        });

        // Compute new found statistics
        const successfulCount = newResults.filter((r: any) => !r.blocked).length;
        const blockedCount = newResults.filter((r: any) => r.blocked).length;

        updateSerpSharedState({
          result: {
            ...state.result,
            ok: successfulCount,
            blocked: blockedCount,
            results: newResults
          }
        });
        showToast(`Cập nhật thứ hạng từ khóa "${kw}" thành công!`, 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || `Lỗi cập nhật từ khóa "${kw}"`, 'danger');
    } finally {
      setRowRecheckLoading(prev => ({ ...prev, [kw]: false }));
    }
  };

  const handleClear = () => {
    updateSerpSharedState({
      keywordsInput: '',
      domain: '',
      competitorsInput: '',
      mode: 'fast',
      result: null
    });
    setResultsSearch('');
    setExpandedRows({});
  };

  // Filters computed lists
  const filteredResults = useMemo(() => {
    if (!state.result?.results) return [];
    
    return state.result.results.filter((item: any) => {
      // 1. Tab filter
      const isFound = item.position !== null && item.position !== undefined;
      const isError = item.blocked || item.error;
      
      if (resultsTab === 'found' && (!isFound || isError)) return false;
      if (resultsTab === 'notfound' && (isFound || isError)) return false;
      if (resultsTab === 'error' && !isError) return false;

      // 2. Keyword search filter
      if (resultsSearch.trim()) {
        return item.keyword.toLowerCase().includes(resultsSearch.toLowerCase().trim());
      }
      return true;
    });
  }, [state.result, resultsTab, resultsSearch]);

  // Bulk Statistics calculations
  const stats = useMemo(() => {
    if (!state.result?.results) return null;
    const items = state.result.results;
    const total = items.length;
    const found = items.filter((i: any) => i.position !== null && i.position !== undefined && !i.blocked).length;
    const notfound = items.filter((i: any) => (i.position === null || i.position === undefined) && !i.blocked && !i.error).length;
    const error = items.filter((i: any) => i.blocked || i.error).length;
    
    const topAio = items.filter((i: any) => i.position === 1 && !i.blocked).length;
    const top3 = items.filter((i: any) => i.position !== null && i.position <= 3 && !i.blocked).length;
    const top10 = items.filter((i: any) => i.position !== null && i.position <= 10 && !i.blocked).length;
    
    const foundPositions = items
      .map((i: any) => i.position)
      .filter((pos: any) => pos !== null && pos !== undefined) as number[];
    
    const avgPos = foundPositions.length > 0
      ? Number((foundPositions.reduce((a, b) => a + b, 0) / foundPositions.length).toFixed(1))
      : 0;

    return { total, found, notfound, error, topAio, top3, top10, avgPos };
  }, [state.result]);

  // Translate and display English errors in Vietnamese
  const mapErrorMessage = (errorStr: string | null | undefined) => {
    if (!errorStr) return 'Đã xảy ra lỗi';
    switch (errorStr.toUpperCase()) {
      case 'SORRY_PAGE':
        return 'Google chặn tạm thời (Sorry Page)';
      case 'RECAPTCHA':
        return 'Yêu cầu Google ReCAPTCHA';
      case 'CIRCUIT_BREAKER':
        return 'Bị ngắt mạch bảo vệ hệ thống';
      case 'TINY_RESPONSE':
        return 'Phản hồi trống từ Google';
      case 'STATUS_429':
        return 'Yêu cầu quá tải (429 Too Many Requests)';
      case 'HTTP_ERROR':
        return 'Lỗi kết nối mạng HTTP';
      case 'HARD_BLOCK_IP_BURNED':
        return 'Google chặn cứng IP (IP cần nghỉ ngơi 30-60 phút)';
      default:
        return `Lỗi quét thứ hạng (${errorStr})`;
    }
  };

  // Download organic search results as Excel CSV
  const handleDownloadCsv = () => {
    if (!state.result?.results) return;
    const headers = ['Từ khóa', 'Trạng thái', 'Thứ hạng của bạn', 'Ranking URL', 'Đối thủ so sánh'];
    
    const rows = state.result.results.map((item: any) => {
      const isFound = item.position !== null && item.position !== undefined;
      const statusLabel = item.blocked ? mapErrorMessage(item.error) : isFound ? 'Tìm thấy' : 'Không có trong top';
      const rankOurs = isOursPosition(item) ? `#${item.position}` : '-';
      const rankingUrl = getOursUrl(item) || '-';
      
      const compRanks = parsedCompetitors.map(c => {
        const foundComp = item.comparisons?.find((comp: any) => comp.domain === c);
        return `${c}: ${foundComp?.position ? `#${foundComp.position}` : 'Không có'}`;
      }).join('; ');

      return [
        item.keyword,
        statusLabel,
        rankOurs,
        rankingUrl,
        compRanks
      ];
    });

    const csvContent = "\uFEFF" // Add UTF-8 BOM for Vietnamese character support in Excel
      + [headers.join(','), ...rows.map((r: any[]) => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `serp-batch-results-${state.domain}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Tải file CSV thành công!', 'success');
  };

  const isOursPosition = (item: any) => {
    return item.position !== null && item.position !== undefined;
  };

  const getOursUrl = (item: any) => {
    const ours = item.comparisons?.find((c: any) => c.isOurs && c.position !== null);
    return ours?.url || '';
  };

  return (
    <Box sx={{ width: '100%' }}>
      
      {/* HEADER SECTION WITH COOKIE BADGE */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              width: 44, 
              height: 44, 
              borderRadius: 3, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', 
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)', 
              mr: 2 
            }}
          >
            <EmojiEventsIcon sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px', color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              Ranking Checker
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.1, fontWeight: 500, fontSize: '0.85rem' }}>
              Nhập domain và từ khóa để kiểm tra thứ hạng tự động
            </Typography>
          </Box>
        </Box>

        {/* Google Cookie Status Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {state.cookieFresh === true ? (
            <Chip 
              icon={<CheckCircleIcon sx={{ '&&': { color: '#10b981' } }} />}
              label="Google Cookie: OK" 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(16, 185, 129, 0.1)', 
                color: '#10b981', 
                fontWeight: 800, 
                border: '1px solid rgba(16, 185, 129, 0.2)' 
              }} 
            />
          ) : state.cookieFresh === false ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                icon={<WarningAmberIcon sx={{ '&&': { color: '#ef4444' } }} />}
                label="Cookie Google hết hạn" 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(239, 68, 68, 0.1)', 
                  color: '#ef4444', 
                  fontWeight: 800, 
                  border: '1px solid rgba(239, 68, 68, 0.2)' 
                }} 
              />
              <Button
                variant="outlined"
                color="warning"
                size="small"
                disabled={state.isRefreshingCookie}
                onClick={handleRefreshCookie}
                startIcon={state.isRefreshingCookie ? <CircularProgress size={12} color="inherit" /> : <RefreshIcon sx={{ fontSize: 13 }} />}
                sx={{ 
                  textTransform: 'none', 
                  borderRadius: 2, 
                  fontWeight: 700, 
                  fontSize: '0.72rem',
                  py: 0.4,
                  color: '#f59e0b',
                  borderColor: 'rgba(245, 158, 11, 0.4)',
                  '&:hover': {
                    borderColor: '#f59e0b',
                    bgcolor: 'rgba(245, 158, 11, 0.05)'
                  }
                }}
              >
                {state.isRefreshingCookie ? 'Đang làm mới...' : 'Refresh cookie'}
              </Button>
            </Box>
          ) : (
            <CircularProgress size={16} />
          )}
        </Box>
      </Box>

      {/* INPUT PANEL (MOCKUP 1 STYLE) */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
          mb: 4
        }}
      >
        <Grid container spacing={3.5}>
          
          {/* Left Column: Domain, Keywords, Competitors */}
          <Grid size={{ xs: 12, md: 7.5 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Domain / URL <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Nhập domain của bạn (vd: thuvienphapluat.vn)..."
                value={state.domain}
                onChange={(e) => updateSerpSharedState({ domain: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.default' } }}
                slotProps={{
                  input: {
                    startAdornment: <LanguageIcon sx={{ fontSize: 18, color: 'text.disabled', mr: 1 }} />
                  }
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', justifyContent: 'space-between' }}>
                <span>Từ khóa <span style={{ color: '#ef4444' }}>*</span></span>
                <span style={{ color: 'text.disabled', fontWeight: 600 }}>({parsedKeywords.length}/50 từ khóa)</span>
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={5}
                placeholder="Nhập danh sách từ khóa cần check, mỗi dòng một từ khóa..."
                value={state.keywordsInput}
                onChange={(e) => updateSerpSharedState({ keywordsInput: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.default', fontFamily: 'monospace', fontSize: '0.85rem' } }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Website đối thủ <span style={{ color: 'text.disabled', fontWeight: 600 }}>(tối đa 10, mỗi dòng 1 domain)</span>
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Nhập tên miền đối thủ cạnh tranh..."
                value={state.competitorsInput}
                onChange={(e) => updateSerpSharedState({ competitorsInput: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.default', fontFamily: 'monospace', fontSize: '0.85rem' } }}
              />
            </Box>
          </Grid>

          {/* Right Column: Settings, Estimates, Action */}
          <Grid size={{ xs: 12, md: 4.5 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            
            <Box>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Scan Depth (Độ sâu tìm kiếm)
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={state.scanDepth}
                  onChange={(e) => updateSerpSharedState({ scanDepth: String(e.target.value) })}
                  sx={{ borderRadius: 2.5, bgcolor: 'background.default', fontWeight: 700 }}
                >
                  <MenuItem value="10">Top 10 (Mặc định - Siêu nhanh)</MenuItem>
                  <MenuItem value="30">Top 30 (Chậm hơn 3x)</MenuItem>
                  <MenuItem value="50">Top 50 (Chậm hơn 5x)</MenuItem>
                  <MenuItem value="100">Top 100 (Chậm hơn 10x)</MenuItem>
                </Select>
              </FormControl>
              {Number(state.scanDepth) > 10 && (
                <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700, mt: 0.5, display: 'block' }}>
                  ⚠️ Quét sâu &gt; Top 10 sẽ chậm hơn từ 3-5 lần do phải phân trang.
                </Typography>
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Quốc gia
                </Typography>
                <FormControl fullWidth size="small">
                  <Select value={state.location} onChange={(e) => updateSerpSharedState({ location: e.target.value })} sx={{ borderRadius: 2.5, bgcolor: 'background.default', fontWeight: 600 }}>
                    <MenuItem value="VN">🇻🇳 Việt Nam</MenuItem>
                    <MenuItem value="US">🇺🇸 Hoa Kỳ</MenuItem>
                    <MenuItem value="SG">🇸🇬 Singapore</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Ngôn ngữ
                </Typography>
                <FormControl fullWidth size="small">
                  <Select value={state.language} onChange={(e) => updateSerpSharedState({ language: e.target.value })} sx={{ borderRadius: 2.5, bgcolor: 'background.default', fontWeight: 600 }}>
                    <MenuItem value="vi">Tiếng Việt</MenuItem>
                    <MenuItem value="en">Tiếng Anh</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Chế độ quét (Scan Mode)
              </Typography>
              <ToggleButtonGroup
                color="primary"
                value={state.mode}
                exclusive
                onChange={(_e, val) => { if (val) updateSerpSharedState({ mode: val }); }}
                size="small"
                fullWidth
                sx={{ 
                  bgcolor: 'background.default', 
                  borderRadius: 2.5,
                  p: 0.4,
                  border: '1px solid',
                  borderColor: 'divider',
                  '& .MuiToggleButton-root': { border: 'none', borderRadius: 2, py: 0.8, fontWeight: 700, textTransform: 'none', fontSize: '0.78rem' },
                  '& .Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }
                }}
              >
                <ToggleButton value="fast">⚡ Fast (Nhanh)</ToggleButton>
                <ToggleButton value="slow">🐢 Slow (An toàn)</ToggleButton>
                <ToggleButton value="apify">🚀 Apify (Cao cấp)</ToggleButton>
              </ToggleButtonGroup>

              {/* Dynamic comparative help alert */}
              <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'background.default', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                {state.mode === 'fast' ? (
                  <>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      ⚡ CHẾ ĐỘ FAST (SONG SONG LOCAL)
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4, fontSize: '0.72rem' }}>
                      • <strong>Tốc độ:</strong> Nhanh (10-30s cho 10 từ khóa).<br />
                      • <strong>Chi phí:</strong> Miễn phí ($0).<br />
                      • <strong>Lưu ý:</strong> Dễ lỗi đỏ nếu IP server bị Google chặn. Không tự giải Captcha.
                    </Typography>
                  </>
                ) : state.mode === 'slow' ? (
                  <>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: 'warning.main', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      🐢 CHẾ ĐỘ SLOW (AN TOÀN TUẦN TỰ)
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4, fontSize: '0.72rem' }}>
                      • <strong>Tốc độ:</strong> Chậm hơn (1-2 phút cho 10 từ khóa).<br />
                      • <strong>Chi phí:</strong> Miễn phí ($0).<br />
                      • <strong>Giải Captcha:</strong> Tự động giải qua Capsolver.<br />
                      • <strong>Phù hợp:</strong> Khi IP server bị block ở chế độ Fast.
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      🚀 CHẾ ĐỘ APIFY (ĐÁM MÂY CAO CẤP)
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4, fontSize: '0.72rem' }}>
                      • <strong>Tốc độ:</strong> Siêu tốc, chỉ **17s** cho 10 từ khóa (1.7s/kw).<br />
                      • <strong>Độ tin cậy:</strong> 99%+ (Không bao giờ lo 403/captcha).<br />
                      • <strong>Chi phí:</strong> Rất nhỏ (~$0.045/10 kw). Tài khoản free $5 chạy được ~1100 kw!<br />
                      • <strong>Khuyên dùng:</strong> Đảm bảo dữ liệu ổn định và nhanh tuyệt đối.
                    </Typography>
                  </>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 'auto' }}>
              <Button
                variant="contained"
                onClick={handleCheck}
                disabled={state.loading}
                startIcon={state.loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon sx={{ fontSize: 16 }} />}
                sx={{
                  flex: 1,
                  borderRadius: 2.5,
                  py: 1.3,
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.2)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #b55fe6 0%, #6d28d9 100%)',
                    boxShadow: '0 6px 18px rgba(124, 58, 237, 0.3)'
                  }
                }}
              >
                {state.loading ? 'Đang phân tích...' : 'Bắt đầu kiểm tra'}
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleClear}
                disabled={state.loading}
                sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', borderColor: 'divider' }}
              >
                Xóa
              </Button>
            </Box>

          </Grid>
        </Grid>
      </Paper>

      {/* BATCH RESULTS DASHBOARD */}
      {(state.loading || state.result) && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          
          {/* OVERVIEW STATS CARDS (MOCKUP 2 STYLE) */}
          {state.loading ? (
            <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <CircularProgress size={42} thickness={4} sx={{ mb: 2, color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
                {state.mode === 'apify' 
                  ? 'Đang quét xếp hạng siêu tốc qua Apify Cloud...' 
                  : state.mode === 'slow' 
                  ? 'Đang quét xếp hạng chế độ AN TOÀN (Slow mode)...' 
                  : 'Đang cào dữ liệu xếp hạng Google thời gian thực...'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 450, lineHeight: 1.5 }}>
                {state.mode === 'apify'
                  ? `Đang xử lý ${parsedKeywords.length} từ khóa siêu tốc qua máy chủ đám mây của Apify. Độ ổn định 99.9% không lo captcha. Dự kiến hoàn thành chỉ trong 10 - 20 giây. Vui lòng giữ kết nối.`
                  : state.mode === 'slow'
                  ? `Đang xử lý ${parsedKeywords.length} từ khóa tuần tự trên Chrome giả lập. Tự động vượt Captcha qua Capsolver và sleep 5-12s ngẫu nhiên để tránh chặn IP. Dự kiến mất khoảng 1 - 3 phút. Vui lòng giữ kết nối.`
                  : `Đang xử lý ${parsedKeywords.length} từ khóa chéo đối thủ song song. Quá trình cào dự kiến mất khoảng 20s - 45s. Vui lòng giữ kết nối.`}
              </Typography>
            </Paper>
          ) : stats ? (
            <Box>
              {/* Cards Grid */}
              <Grid container spacing={2} sx={{ mb: 3.5 }}>
                {[
                  { label: 'TỔNG KW', val: stats.total, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.25)', icon: 'abc' },
                  { label: 'TÌM THẤY', val: stats.found, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.25)', icon: '✓' },
                  { label: 'KHÔNG TÌM THẤY', val: stats.notfound, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.25)', icon: '✕' },
                  { label: 'LỖI', val: stats.error, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.25)', icon: '⚠️' },
                  { label: 'TOP AIO', val: stats.topAio, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.25)', icon: '★' },
                  { label: 'TOP 3', val: stats.top3, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.25)', icon: '🏆' },
                  { label: 'TOP 10', val: stats.top10, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.25)', icon: '🎯' },
                  { label: 'VỊ TRÍ TB', val: stats.avgPos > 0 ? stats.avgPos : '—', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.25)', icon: '📊' }
                ].map((card, i) => (
                  <Grid size={{ xs: 6, sm: 3 }} key={i}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2.2, 
                        borderRadius: 3.5, 
                        border: '1px solid', 
                        borderColor: card.border, 
                        bgcolor: card.bg, 
                        textAlign: 'center',
                        boxShadow: 'none'
                      }}
                    >
                      <Typography sx={{ color: card.color, fontWeight: 900, fontSize: '1.25rem', fontFamily: 'monospace', mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8 }}>
                        <span style={{ fontSize: '0.88rem' }}>{card.icon}</span> {card.val}
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {card.label}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Capsolver solved Captcha indicator alert banner */}
              {state.result?.captchaSolved > 0 && (
                <Box 
                  sx={{ 
                    mb: 3.5, 
                    p: 2, 
                    borderRadius: 3.5, 
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.04)', 
                    border: '1px solid rgba(16, 185, 129, 0.25)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5 
                  }}
                >
                  <CheckCircleIcon sx={{ color: '#10b981', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 800, fontSize: '0.8rem' }}>
                    🛡️ Capsolver đã tự động nhận diện và vượt qua thành công {state.result.captchaSolved} lần Captcha Google xuất hiện giữa tiến trình quét của chế độ AN TOÀN (Slow mode)!
                  </Typography>
                </Box>
              )}

              {/* TABLE ROW (TABS, SEARCH AND EXCEL EXPORT) */}
              <Paper 
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.01)',
                  mb: 4
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', gap: 2, mb: 2.5 }}>
                  
                  {/* Results Filters Tabs */}
                  <Box sx={{ display: 'flex', bgcolor: 'background.default', p: 0.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 0.5 }}>
                    {[
                      { key: 'all', label: `Tất cả (${stats.total})` },
                      { key: 'found', label: `Tìm thấy (${stats.found})` },
                      { key: 'notfound', label: `Không thấy (${stats.notfound})` },
                      { key: 'error', label: `Lỗi (${stats.error})` }
                    ].map((tab) => (
                      <Button
                        key={tab.key}
                        size="small"
                        onClick={() => setResultsTab(tab.key as any)}
                        sx={{ 
                          borderRadius: 2, 
                          px: 2, 
                          py: 0.6,
                          fontWeight: 700, 
                          fontSize: '0.78rem',
                          textTransform: 'none',
                          color: resultsTab === tab.key ? 'primary.contrastText' : 'text.secondary',
                          bgcolor: resultsTab === tab.key ? 'primary.main' : 'transparent',
                          '&:hover': {
                            bgcolor: resultsTab === tab.key ? 'primary.dark' : 'action.hover'
                          }
                        }}
                      >
                        {tab.label}
                      </Button>
                    ))}
                  </Box>

                  {/* Actions right: search and Excel download */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TextField
                      placeholder="Tìm kiếm keyword..."
                      size="small"
                      value={resultsSearch}
                      onChange={(e) => setResultsSearch(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: <SearchIcon sx={{ color: 'text.disabled', fontSize: 16, mr: 0.5 }} />
                        }
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: 2, 
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
                        borderRadius: 2,
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        height: 38,
                        color: '#10b981',
                        borderColor: 'rgba(16, 185, 129, 0.4)',
                        '&:hover': {
                          borderColor: '#10b981',
                          bgcolor: 'rgba(16, 185, 129, 0.04)'
                        }
                      }}
                    >
                      Export Excel
                    </Button>
                  </Box>

                </Box>

                {/* KEYWORDS RESULTS TABLE */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  
                  {/* Table headers */}
                  <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: '50px 220px 100px 100px 100px 1fr 200px', gap: 1.5, px: 2, py: 1, bgcolor: 'action.hover', borderRadius: 2, fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <Box>#</Box>
                    <Box>Keyword</Box>
                    <Box sx={{ textAlign: 'center' }}>Hạng Cũ</Box>
                    <Box sx={{ textAlign: 'center' }}>Hạng Mới</Box>
                    <Box sx={{ textAlign: 'center' }}>Thay đổi</Box>
                    <Box>Ranking URL</Box>
                    <Box sx={{ textAlign: 'center' }}>Actions</Box>
                  </Box>

                  {/* Empty state */}
                  {filteredResults.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Không có kết quả xếp hạng nào thỏa mãn bộ lọc hiện tại.
                      </Typography>
                    </Box>
                  ) : (
                    filteredResults.map((item: any, idx: number) => {
                      const isRowExpanded = !!expandedRows[item.keyword];
                      const isRechecking = !!rowRecheckLoading[item.keyword];
                      const hasPosition = item.position !== null && item.position !== undefined;
                      const hasError = item.blocked || item.error;

                      const rankColor = item.position === 1 ? '#fbbf24' : item.position === 2 ? '#94a3b8' : item.position === 3 ? '#b45309' : 'primary.main';

                      const rowBg = hasError
                        ? ((theme: any) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)')
                        : isOursPosition(item)
                        ? ((theme: any) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.04)' : 'rgba(16, 185, 129, 0.01)')
                        : 'background.default';

                      return (
                        <Paper
                          key={idx}
                          elevation={0}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            p: 2,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: hasError ? 'error.light' : isRowExpanded ? 'primary.light' : 'divider',
                            bgcolor: rowBg,
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: hasError ? 'error.main' : 'primary.light',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '50px 220px 100px 100px 100px 1fr 200px' }, gap: 1.5, alignItems: 'center' }}>
                            {/* # Index */}
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.8rem' }}>
                                {idx + 1}
                              </Typography>
                            </Box>

                            {/* Keyword Name */}
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: 'text.primary', cursor: 'pointer', '&:hover': { color: 'primary.main' } }} onClick={() => setExpandedRows(prev => ({ ...prev, [item.keyword]: !isRowExpanded }))}>
                                {item.keyword}
                              </Typography>
                              {item.scrapedAt && (
                                <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', fontWeight: 500, display: 'block', mt: 0.25 }}>
                                  🕒 {new Date(item.scrapedAt).toLocaleDateString('vi-VN')} {new Date(item.scrapedAt).toLocaleTimeString('vi-VN')}
                                </Typography>
                              )}
                            </Box>

                            {/* Old rank */}
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Chip label="★ Mới" size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, borderColor: 'divider', color: 'text.secondary' }} />
                            </Box>

                            {/* New rank circle */}
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                              {hasError ? (
                                <Chip label="Lỗi" color="error" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />
                              ) : hasPosition ? (
                                <Box sx={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center', bgcolor: 'rgba(251, 191, 36, 0.15)', border: '1px solid', borderColor: '#fbbf24', color: rankColor, fontWeight: 900, fontSize: '0.82rem', justifyContent: 'center' }}>
                                  #{item.position}
                                </Box>
                              ) : (
                                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.disabled' }}>—</Typography>
                              )}
                            </Box>

                            {/* Changes */}
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Chip label="✦ Mới" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(59, 130, 246, 0.12)', color: 'primary.main', border: '1px solid rgba(59, 130, 246, 0.2)' }} />
                            </Box>

                            {/* Ranking URL Link */}
                            <Box sx={{ minWidth: 0, overflow: 'hidden', pr: 2 }}>
                              {hasPosition && getOursUrl(item) ? (
                                <Tooltip title={getOursUrl(item)} arrow placement="top">
                                  <Link 
                                    href={getOursUrl(item)} 
                                    target="_blank" 
                                    sx={{ 
                                      color: 'primary.main', 
                                      fontSize: '0.8rem', 
                                      fontWeight: 700, 
                                      display: 'inline-flex', 
                                      alignItems: 'center', 
                                      gap: 0.8, 
                                      textDecoration: 'none', 
                                      maxWidth: '100%',
                                      '&:hover': { textDecoration: 'underline' } 
                                    }}
                                  >
                                    <LaunchIcon sx={{ fontSize: 12, flexShrink: 0, color: 'primary.main', opacity: 0.9 }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                      {getOursUrl(item)}
                                    </span>
                                  </Link>
                                </Tooltip>
                              ) : hasError ? (
                                <Typography sx={{ fontSize: '0.78rem', color: 'error.main', fontWeight: 700 }}>
                                  ⚠️ {mapErrorMessage(item.error)}
                                </Typography>
                              ) : (
                                <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                  Không thấy URL xếp hạng
                                </Typography>
                              )}
                            </Box>

                            {/* Row Actions */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, justifyContent: 'center' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => setExpandedRows(prev => ({ ...prev, [item.keyword]: !isRowExpanded }))}
                                sx={{ borderRadius: 2, fontSize: '0.68rem', py: 0.3, textTransform: 'none', fontWeight: 800 }}
                              >
                                {isRowExpanded ? 'Thu gọn' : 'SERP'}
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                disabled={isRechecking}
                                onClick={() => handleRecheckRow(item.keyword)}
                                startIcon={isRechecking ? <CircularProgress size={10} color="inherit" /> : null}
                                sx={{ borderRadius: 2, fontSize: '0.68rem', py: 0.3, textTransform: 'none', fontWeight: 800 }}
                              >
                                {isRechecking ? 'Quét...' : 'Recheck'}
                              </Button>
                            </Box>

                          </Box>

                          {/* EXPANDABLE ORGANIC RESULTS PANEL */}
                          <Collapse in={isRowExpanded} sx={{ mt: 2 }}>
                            <Divider sx={{ my: 1.5, borderColor: 'divider' }} />
                            <Box sx={{ pl: { xs: 0, md: 5 } }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 1.5, letterSpacing: 0.5 }}>
                                📊 Kết quả tự nhiên organic (Top Google)
                              </Typography>
                              
                              {item.organicResults && item.organicResults.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                                  {item.organicResults.map((result: any, index: number) => {
                                    const resDomain = getDomainFromUrl(result.url);
                                    const isOurs = result.isTarget || resDomain === state.domain.trim().toLowerCase();
                                    const isCompetitor = parsedCompetitors.includes(resDomain);

                                    const organicRankColor = isOurs ? '#10b981' : isCompetitor ? '#f59e0b' : 'text.secondary';
                                    const organicRankBg = isOurs ? 'rgba(16, 185, 129, 0.15)' : isCompetitor ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.08)';

                                    return (
                                      <Box 
                                        key={index}
                                        sx={{ 
                                          display: 'flex', 
                                          gap: 2, 
                                          alignItems: 'flex-start',
                                          p: 1.5,
                                          borderRadius: 2,
                                          bgcolor: isOurs ? 'rgba(16, 185, 129, 0.03)' : isCompetitor ? 'rgba(245, 158, 11, 0.03)' : 'transparent',
                                          border: isOurs ? '1px solid rgba(16, 185, 129, 0.15)' : isCompetitor ? '1px solid rgba(245, 158, 11, 0.15)' : 'none'
                                        }}
                                      >
                                        <Box sx={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center', bgcolor: organicRankBg, color: organicRankColor, fontWeight: 900, fontSize: '0.75rem', justifyContent: 'center', flexShrink: 0, mt: 0.2 }}>
                                          #{result.position}
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
                                            <Link href={result.url} target="_blank" sx={{ fontWeight: 800, fontSize: '0.82rem', color: isOurs ? '#10b981' : isCompetitor ? '#f59e0b' : 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                              {result.title}
                                            </Link>
                                            {isOurs ? (
                                              <Chip label="CỦA BẠN" size="small" color="success" sx={{ height: 16, fontSize: '0.58rem', fontWeight: 900 }} />
                                            ) : isCompetitor ? (
                                              <Chip label="ĐỐI THỦ" size="small" color="warning" sx={{ height: 16, fontSize: '0.58rem', fontWeight: 900 }} />
                                            ) : null}
                                          </Box>
                                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', wordBreak: 'break-all', mb: 0.5, fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                            {result.url}
                                          </Typography>
                                          {result.snippet && (
                                            <Typography variant="body2" sx={{ fontSize: '0.78rem', color: 'text.secondary', lineHeight: 1.4 }}>
                                              {result.snippet}
                                            </Typography>
                                          )}
                                        </Box>
                                      </Box>
                                    );
                                  })}
                                </Box>
                              ) : (
                                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled', fontSize: '0.8rem' }}>
                                  Không lấy được kết quả tự nhiên organic (có thể do bị chặn).
                                </Typography>
                              )}
                            </Box>
                          </Collapse>
                        </Paper>
                      );
                    })
                  )}

                </Box>
              </Paper>

              {/* COMPETITOR COMPARISON TABLE (MOCKUP 3 STYLE) */}
              {parsedCompetitors.length > 0 && (
                <Paper 
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3.5 },
                    borderRadius: 5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.02)',
                    mb: 4
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
                    <Box 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        borderRadius: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        boxShadow: '0 4px 10px rgba(245, 158, 11, 0.2)'
                      }}
                    >
                      <CompareArrowsIcon sx={{ color: 'white', fontSize: 18 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>So sánh thứ hạng với đối thủ</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {parsedKeywords.length} từ khóa · {parsedCompetitors.length} đối thủ
                      </Typography>
                    </Box>
                  </Box>

                  {/* Colors Legend */}
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
                    {[
                      { label: 'Top 1-3', color: '#fbbf24' },
                      { label: 'Top 4-10', color: '#10b981' },
                      { label: 'Top 11-30', color: '#f59e0b' },
                      { label: 'Top 31+', color: '#ef4444' },
                      { label: 'Không có', color: 'text.disabled' }
                    ].map((l, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: l.color }} />
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: 'text.secondary' }}>{l.label}</Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Comparison dynamic grid table */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    
                    {/* Header Columns */}
                    <Box 
                      sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: `200px 1fr ${parsedCompetitors.map(() => '1fr').join(' ')}`, 
                        gap: 2, 
                        px: 2, 
                        py: 1, 
                        bgcolor: 'action.hover', 
                        borderRadius: 2,
                        fontWeight: 900,
                        fontSize: '0.72rem',
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        alignItems: 'center'
                      }}
                    >
                      <Box>Từ khóa</Box>
                      <Box sx={{ color: '#10b981' }}>🏠 {state.domain.toUpperCase()}</Box>
                      {parsedCompetitors.map((c, idx) => (
                        <Box key={idx} sx={{ color: '#f59e0b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          🎯 {c.toUpperCase()}
                        </Box>
                      ))}
                    </Box>

                    {/* Table Body rows */}
                    {state.result.results.map((item: any, idx: number) => {
                      return (
                        <Box 
                          key={idx}
                          sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: `200px 1fr ${parsedCompetitors.map(() => '1fr').join(' ')}`, 
                            gap: 2, 
                            px: 2, 
                            py: 1.8, 
                            borderRadius: 2.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.default',
                            alignItems: 'center'
                          }}
                        >
                          {/* Keyword */}
                          <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.primary' }}>
                            {item.keyword}
                          </Typography>

                          {/* Our domain Rank Cell */}
                          {(() => {
                            const hasRank = item.position !== null && item.position !== undefined;
                            const pos = item.position;
                            const badgeColor = pos <= 3 ? '#fbbf24' : pos <= 10 ? '#10b981' : pos <= 30 ? '#f59e0b' : '#ef4444';
                            const barWidth = hasRank ? Math.max(10, ((Number(state.scanDepth) - pos + 1) / Number(state.scanDepth)) * 100) : 0;
                            
                            return (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                {hasRank ? (
                                  <>
                                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center', bgcolor: `${badgeColor}15`, border: '1px solid', borderColor: badgeColor, color: badgeColor, fontWeight: 900, fontSize: '0.78rem', flexShrink: 0, justifyContent: 'center' }}>
                                      #{pos}
                                    </Box>
                                    <Box sx={{ flex: 1, height: 4, bgcolor: 'action.hover', borderRadius: 2, overflow: 'hidden' }}>
                                      <Box sx={{ height: '100%', width: `${barWidth}%`, bgcolor: badgeColor, borderRadius: 2 }} />
                                    </Box>
                                  </>
                                ) : (
                                  <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.disabled' }}>—</Typography>
                                )}
                              </Box>
                            );
                          })()}

                          {/* Competitors Rank Cells */}
                          {parsedCompetitors.map((c, cIdx) => {
                            const compItem = item.comparisons?.find((comp: any) => comp.domain === c);
                            const hasRank = compItem?.position !== null && compItem?.position !== undefined;
                            const pos = compItem?.position;
                            const badgeColor = pos <= 3 ? '#fbbf24' : pos <= 10 ? '#10b981' : pos <= 30 ? '#f59e0b' : '#ef4444';
                            const barWidth = hasRank ? Math.max(10, ((Number(state.scanDepth) - pos + 1) / Number(state.scanDepth)) * 100) : 0;

                            return (
                              <Box key={cIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                {hasRank ? (
                                  <>
                                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center', bgcolor: `${badgeColor}15`, border: '1px solid', borderColor: badgeColor, color: badgeColor, fontWeight: 900, fontSize: '0.78rem', flexShrink: 0, justifyContent: 'center' }}>
                                      #{pos}
                                    </Box>
                                    <Box sx={{ flex: 1, height: 4, bgcolor: 'action.hover', borderRadius: 2, overflow: 'hidden' }}>
                                      <Box sx={{ height: '100%', width: `${barWidth}%`, bgcolor: badgeColor, borderRadius: 2 }} />
                                    </Box>
                                  </>
                                ) : (
                                  <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.disabled' }}>—</Typography>
                                )}
                              </Box>
                            );
                          })}

                        </Box>
                      );
                    })}

                  </Box>
                </Paper>
              )}

            </Box>
          ) : null}

        </Box>
      )}

    </Box>
  );
}
