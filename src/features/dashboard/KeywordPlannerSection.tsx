import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import SearchIcon from '@mui/icons-material/Search';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import FormControl from '@mui/material/FormControl';
import CustomTable from '../../components/custom-table/CustomTable';
import { keywordGroupService } from '../keywords/keywordGroupService';
import type { GoogleAdsKeyword, GoogleAdsMonthlyVolume, KeywordFilters } from '../keywords/types';
import { useToastify } from '../../components/Toastify';
import GoogleTrendsModal from '../keywords/components/GoogleTrendsModal';
import type { TrendCacheEntry } from '../keywords/components/GoogleTrendsModal';
import axios from 'axios';
import api from '../../utils/api';
import { API_BASE_URL } from '../../utils/constants';
import { authService } from '../auth/authService';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const Sparkline = ({ keyword, volumes }: { keyword: string, volumes: GoogleAdsMonthlyVolume[] }) => {
  if (!volumes || volumes.length === 0) return null;
  const width = 120;
  const height = 30;
  const max = Math.max(...volumes.map(v => v.volume));
  const min = Math.min(...volumes.map(v => v.volume));
  const getX = (i: number) => i * (width / 11);
  const getY = (v: number) => {
    if (max === min) return height / 2;
    const padding = 4;
    const usableHeight = height - padding * 2;
    return padding + usableHeight - ((v - min) / (max - min)) * usableHeight;
  };

  const points = volumes.map((v, i) => `${getX(i)},${getY(v.volume)}`).join(' ');

  return (
    <Box sx={{ position: 'relative', width, height, display: 'inline-block' }}>
      <svg width={width} height={height} style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0 }}>
        <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex' }}>
        {volumes.map((v, i) => (
          <Tooltip key={i} title={`${keyword} — Tháng ${v.month}/${v.year}: ${new Intl.NumberFormat('vi-VN').format(v.volume)} lượt`} placement="top" arrow>
            <Box sx={{ flex: 1, height: '100%', cursor: 'crosshair' }} />
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
};

const TrendSparkline = ({ dataPoints }: { dataPoints: { date: string, value: number }[] }) => {
  if (!dataPoints || dataPoints.length === 0) return null;
  const width = 100;
  const height = 30;
  const max = 100; // Trends max is always 100
  const min = 0;
  const getX = (i: number) => i * (width / (dataPoints.length - 1 || 1));
  const getY = (v: number) => {
    const padding = 2;
    const usableHeight = height - padding * 2;
    return padding + usableHeight - ((v - min) / (max - min)) * usableHeight;
  };

  const points = dataPoints.map((dp, i) => `${getX(i)},${getY(dp.value)}`).join(' ');

  return (
    <Box sx={{ position: 'relative', width, height, display: 'inline-block' }}>
      <svg width={width} height={height} style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0 }}>
        <polyline points={points} fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Box>
  );
};

export default function KeywordPlannerSection() {
  const { showToast } = useToastify();
  const [mode, setMode] = useState<'keyword' | 'domain'>('keyword');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GoogleAdsKeyword[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [trendsModalOpen, setTrendsModalOpen] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [trendsCache, setTrendsCache] = useState<Record<string, TrendCacheEntry>>({});
  const trendAbortControllers = useRef<Record<string, AbortController>>({});

  const fetchTrendForKeyword = async (kw: string, force: boolean = false) => {
    if (!kw) return;
    
    // Check if we should skip
    setTrendsCache(prev => {
      const current = prev[kw];
      if (!force && current && (current.data || current.loading)) {
        return prev;
      }
      return {
        ...prev,
        [kw]: { loading: true, data: current?.data || null, error: null }
      };
    });

    if (trendAbortControllers.current[kw]) {
      trendAbortControllers.current[kw].abort();
    }
    const abortController = new AbortController();
    trendAbortControllers.current[kw] = abortController;

    try {
      const response = await api.post('/keywords/trends/scrape', {
        keyword: kw,
        geo: 'VN',
        timeframe: 'today 3-m'
      }, {
        signal: abortController.signal
      });

      if (response.data?.success) {
        setTrendsCache(prev => ({
          ...prev,
          [kw]: { loading: false, data: response.data.data, error: null }
        }));
      } else {
        setTrendsCache(prev => ({
          ...prev,
          [kw]: { loading: false, data: null, error: response.data?.message || 'Lỗi lấy dữ liệu' }
        }));
      }
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.message === 'canceled') {
        // do nothing
      } else {
        setTrendsCache(prev => ({
          ...prev,
          [kw]: { loading: false, data: null, error: err.response?.data?.message || err.message || 'Lỗi' }
        }));
      }
    }
  };

  // Filters
  const [minVolume, setMinVolume] = useState<string>('');
  const [maxVolume, setMaxVolume] = useState<string>('');
  const [competition, setCompetition] = useState<string[]>([]);
  const [location, setLocation] = useState<string>('VN');
  const [language, setLanguage] = useState<string>('vi');

  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (field === 'avgMonthlySearches') {
      if (sortBy !== 'avgMonthlySearches') {
        setSortBy('avgMonthlySearches');
        setSortOrder('desc');
      } else {
        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
      }
    }
  };

  const abortAllTrendsRequests = () => {
    Object.keys(trendAbortControllers.current).forEach(kw => {
      if (trendAbortControllers.current[kw]) {
        trendAbortControllers.current[kw].abort();
        delete trendAbortControllers.current[kw];
      }
    });
    setTrendsCache(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(kw => {
        if (next[kw] && next[kw].loading) {
          delete next[kw];
        }
      });
      return next;
    });
  };

  const fetchPage = async (targetPage: number, searchVal?: string, targetLimit: number = limit) => {
    // Cancel all active trend scraping requests to instantly free up browser connection slots
    abortAllTrendsRequests();

    const query = searchVal || inputValue;
    if (!query.trim()) {
      showToast('Vui lòng nhập từ khóa hoặc tên miền', 'danger');
      return;
    }

    setSearchId(`${mode}-${query.trim()}`);

    setLoading(true);

    const filters: KeywordFilters = {};
    if (minVolume) filters.minVolume = Number(minVolume);
    if (maxVolume) filters.maxVolume = Number(maxVolume);
    if (competition.length > 0) filters.competition = competition;
    if (location) filters.location = location;
    if (language) filters.language = language;
    if (sortBy && sortOrder) filters.sortOrder = sortOrder;

    try {
      const res = mode === 'keyword'
        ? await keywordGroupService.getKeywordIdeas(query.trim(), targetPage, targetLimit, filters)
        : await keywordGroupService.getKeywordIdeasByDomain(query.trim(), targetPage, targetLimit, filters);
      
      setData(res.keywords);
      setTotal(res.total);
      setPage(res.page);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi lấy dữ liệu từ Google Ads';
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setData([]);
    setTotal(0);
    setPage(1);
    setTrendsCache({});
    fetchPage(1, inputValue);
  };

  const handleDownloadCsv = async () => {
    const query = inputValue.trim();
    if (!query) {
      showToast('Vui lòng nhập từ khóa hoặc tên miền trước khi tải', 'warning');
      return;
    }

    setDownloadingCsv(true);
    const endpoint = mode === 'keyword' 
      ? `${API_BASE_URL}/keywords/ideas/export`
      : `${API_BASE_URL}/keywords/domain/export`;

    const params: any = {};
    if (mode === 'keyword') params.keyword = query;
    else params.url = query;

    if (location) params.location = location;
    if (language) params.language = language;

    try {
      const token = authService.getAccessToken();
      const res = await axios.get(endpoint, {
        params,
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      });

      const cd = res.headers['content-disposition'] ?? '';
      const match = cd.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] ?? 'keywords-export.csv';

      const blobUrl = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
      showToast('Tải CSV thành công', 'success');
    } catch (err: any) {
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          showToast(json.message ?? 'Tải CSV thất bại', 'danger');
        } catch {
          showToast('Tải CSV thất bại', 'danger');
        }
      } else {
        showToast(err.message ?? 'Tải CSV thất bại', 'danger');
      }
    } finally {
      setDownloadingCsv(false);
    }
  };

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (searchId) {
      const timer = setTimeout(() => {
        setPage(1);
        fetchPage(1, inputValue);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [minVolume, maxVolume, competition, location, language, sortOrder, sortBy]);

  useEffect(() => {
    const handleSearchEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const kw = customEvent.detail?.keyword;
      if (kw) {
        setMode('keyword');
        setInputValue(kw);
        
        // Scroll to the planner section smoothly
        const element = document.getElementById('section-planner');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Trigger the search automatically
        setData([]);
        setTotal(0);
        setPage(1);
        setTrendsCache({});
        fetchPage(1, kw);
      }
    };
    window.addEventListener('search-keyword-planner', handleSearchEvent);
    return () => {
      window.removeEventListener('search-keyword-planner', handleSearchEvent);
    };
  }, []);

  const formatCurrency = (val: number | null) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const maxSearchVolume = data.length > 0 ? Math.max(...data.map(d => d.avgMonthlySearches)) : 1;

  const columns = [
    {
      id: 'index', name: 'index', label: '#', width: 50,
      renderCell: (row: any) => (
        <Typography sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.85rem' }}>
          {row.index}
        </Typography>
      )
    },
    { 
      id: 'keyword', name: 'keyword', label: 'KEYWORD', width: 220,
      renderCell: (row: any) => (
        <Typography 
          sx={{ 
            fontWeight: 600, 
            fontSize: '0.9rem', 
            color: 'primary.main', 
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' }
          }}
          onClick={() => {
            setSelectedKeyword(row.keyword);
            setTrendsModalOpen(true);
          }}
        >
          {row.keyword}
        </Typography>
      )
    },
    { 
      id: 'avgMonthlySearches', name: 'avgMonthlySearches', label: 'VOLUME', width: 140, sortable: true,
      renderCell: (row: any) => (
        <Box sx={{ width: '100%', maxWidth: 100 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'text.primary', textAlign: 'right', mb: 0.5 }}>
            {new Intl.NumberFormat('en-US').format(row.avgMonthlySearches)}
          </Typography>
          <Box sx={{ width: '100%', height: 4, bgcolor: 'action.hover', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${(row.avgMonthlySearches / maxSearchVolume) * 100}%`, bgcolor: '#10b981', borderRadius: 2 }} />
          </Box>
        </Box>
      )
    },
    {
      id: 'trend', name: 'trend', label: 'VOL 12M', width: 150,
      renderCell: (row: any) => <Sparkline keyword={row.keyword} volumes={row.monthlySearchVolumes} />
    },
    {
      id: 'ggTrend', name: 'ggTrend', label: 'GG TRENDS (3M)', width: 160,
      renderCell: (row: any) => {
        const cache = trendsCache[row.keyword];
        if (!cache) {
          return (
            <Button 
              size="small" 
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                fetchTrendForKeyword(row.keyword);
              }}
              sx={{ textTransform: 'none', borderRadius: '100px', fontSize: '0.7rem', py: 0.3, color: '#ec4899', borderColor: 'rgba(236,72,153,0.3)', '&:hover': { borderColor: '#ec4899', bgcolor: 'rgba(236,72,153,0.05)' } }}
            >
              Phân tích
            </Button>
          );
        }
        if (cache.loading) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', justifyContent: 'center' }}>
              <CircularProgress size={12} sx={{ color: '#ec4899' }} />
              <Typography sx={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#ec4899' }}>Đang lấy...</Typography>
            </Box>
          );
        }
        if (cache.error) {
          return (
            <Tooltip title={cache.error}>
              <Typography sx={{ fontSize: '0.75rem', color: 'error.main', cursor: 'help' }}>Lỗi lấy data</Typography>
            </Tooltip>
          );
        }
        if (cache.data && cache.data.dataPoints) {
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <TrendSparkline dataPoints={cache.data.dataPoints} />
              {cache.data.peak && (
                <Typography sx={{ fontSize: '0.65rem', color: '#ec4899', fontWeight: 600, mt: 0.5 }}>
                  Peak: {cache.data.peak.value}
                </Typography>
              )}
            </Box>
          );
        }
        return <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>Không có data</Typography>;
      }
    },
    {
      id: 'competition', name: 'competition', label: 'COMPETITION', width: 180, sortable: true,
      renderCell: (row: any) => {
        const colorHex = row.competition === 'LOW' ? '#10b981' : row.competition === 'MEDIUM' ? '#f59e0b' : '#ef4444';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress variant="determinate" value={100} size={28} thickness={4} sx={{ color: 'action.hover' }} />
              <CircularProgress variant="determinate" value={row.competitionIndex} size={28} thickness={4} sx={{ color: colorHex, position: 'absolute', left: 0 }} />
              <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: 'text.primary' }}>
                  {row.competitionIndex}
                </Typography>
              </Box>
            </Box>
            <Chip 
              label={row.competition === 'LOW' ? 'Low' : row.competition === 'MEDIUM' ? 'Medium' : 'High'} 
              size="small" 
              sx={{ fontWeight: 700, fontSize: 11, height: 22, bgcolor: `${colorHex}1A`, color: colorHex, border: `1px solid ${colorHex}30` }}
            />
          </Box>
        )
      }
    },
    {
      id: 'bidLow', name: 'bidLow', label: 'BID LOW', width: 100,
      renderCell: (row: any) => (
        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.secondary' }}>
          {formatCurrency(row.bidLow)}
        </Typography>
      )
    },
    {
      id: 'bidHigh', name: 'bidHigh', label: 'BID HIGH', width: 100,
      renderCell: (row: any) => (
        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.secondary' }}>
          {formatCurrency(row.bidHigh)}
        </Typography>
      )
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ 
        pt: 4, pb: 6, px: 2, 
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        bgcolor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography sx={{ 
          fontSize: { xs: '2rem', md: '2.5rem' }, 
          fontWeight: 900, 
          textAlign: 'center',
          color: 'primary.main',
          mb: 1
        }}>
          Keyword Research Tool
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '1rem', textAlign: 'center', mb: 4, maxWidth: 600 }}>
          Tìm kiếm từ khóa, phân tích lượng tìm kiếm, mức cạnh tranh và xu hướng trực tiếp từ Google Ads.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <ToggleButtonGroup
            color="primary"
            value={mode}
            exclusive
            onChange={(_e, val) => { if (val) setMode(val); }}
            size="medium"
            sx={{ 
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', 
              borderRadius: '100px', 
              p: 0.5,
              '& .MuiToggleButton-root': { border: 'none', borderRadius: '100px', px: 3, fontWeight: 600, textTransform: 'none' },
              '& .Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }
            }}
          >
            <ToggleButton value="keyword">Search by Keyword</ToggleButton>
            <ToggleButton value="domain">Search by Domain</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Paper elevation={0} sx={{ 
          width: '100%', maxWidth: 800, p: { xs: 2, md: 4 }, 
          borderRadius: 4, 
          bgcolor: 'background.paper', 
          border: '1px solid', borderColor: 'divider', 
          boxShadow: '0 12px 40px rgba(0,0,0,0.08)' 
        }}>
          <TextField
            fullWidth
            placeholder={mode === 'keyword' ? 'Nhập từ khóa (vd: luật, thiết kế)' : 'Nhập tên miền (vd: accbinhduong.vn)'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            slotProps={{
              input: {
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 24 }} />,
              }
            }}
            sx={{ mb: 3, '& .MuiOutlinedInput-root': { fontSize: '1.1rem', borderRadius: '100px', bgcolor: 'background.default', '& fieldset': { borderColor: 'divider' } } }}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
            <FormControl fullWidth size="small">
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', mb: 0.5, ml: 1.5, textTransform: 'uppercase' }}>Location</Typography>
              <Select value={location} onChange={(e) => setLocation(e.target.value)} sx={{ borderRadius: '100px', bgcolor: 'background.default', '& .MuiOutlinedInput-root': { borderRadius: '100px' } }}>
                <MenuItem value="VN"><span style={{ marginRight: 8 }}>🇻🇳</span> Vietnam</MenuItem>
                <MenuItem value="US"><span style={{ marginRight: 8 }}>🇺🇸</span> United States</MenuItem>
                <MenuItem value="GB"><span style={{ marginRight: 8 }}>🇬🇧</span> United Kingdom</MenuItem>
                <MenuItem value="AU"><span style={{ marginRight: 8 }}>🇦🇺</span> Australia</MenuItem>
                <MenuItem value="CA"><span style={{ marginRight: 8 }}>🇨🇦</span> Canada</MenuItem>
                <MenuItem value="JP"><span style={{ marginRight: 8 }}>🇯🇵</span> Japan</MenuItem>
                <MenuItem value="KR"><span style={{ marginRight: 8 }}>🇰🇷</span> South Korea</MenuItem>
                <MenuItem value="SG"><span style={{ marginRight: 8 }}>🇸🇬</span> Singapore</MenuItem>
                <MenuItem value="TH"><span style={{ marginRight: 8 }}>🇹🇭</span> Thailand</MenuItem>
                <MenuItem value="ID"><span style={{ marginRight: 8 }}>🇮🇩</span> Indonesia</MenuItem>
                <MenuItem value="MY"><span style={{ marginRight: 8 }}>🇲🇾</span> Malaysia</MenuItem>
                <MenuItem value="PH"><span style={{ marginRight: 8 }}>🇵🇭</span> Philippines</MenuItem>
                <MenuItem value="IN"><span style={{ marginRight: 8 }}>🇮🇳</span> India</MenuItem>
                <MenuItem value="FR"><span style={{ marginRight: 8 }}>🇫🇷</span> France</MenuItem>
                <MenuItem value="DE"><span style={{ marginRight: 8 }}>🇩🇪</span> Germany</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', mb: 0.5, ml: 1.5, textTransform: 'uppercase' }}>Language</Typography>
              <Select value={language} onChange={(e) => setLanguage(e.target.value)} sx={{ borderRadius: '100px', bgcolor: 'background.default', '& .MuiOutlinedInput-root': { borderRadius: '100px' } }}>
                <MenuItem value="vi">Vietnamese</MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="ja">Japanese</MenuItem>
                <MenuItem value="zh">Chinese</MenuItem>
                <MenuItem value="ko">Korean</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="pt">Portuguese</MenuItem>
                <MenuItem value="th">Thai</MenuItem>
                <MenuItem value="id">Indonesian</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 4 }}>
            <TextField
              size="small"
              placeholder="Min Vol"
              type="number"
              value={minVolume}
              onChange={(e) => setMinVolume(e.target.value)}
              sx={{ width: 100, '& .MuiOutlinedInput-root': { bgcolor: 'background.default', borderRadius: '100px' } }}
            />
            <TextField
              size="small"
              placeholder="Max Vol"
              type="number"
              value={maxVolume}
              onChange={(e) => setMaxVolume(e.target.value)}
              sx={{ width: 100, '& .MuiOutlinedInput-root': { bgcolor: 'background.default', borderRadius: '100px' } }}
            />
            <FormControl size="small" sx={{ width: 160 }}>
              <Select
                multiple
                displayEmpty
                value={competition}
                onChange={(e) => setCompetition(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                renderValue={(selected) => selected.length === 0 ? 'Competition (All)' : selected.join(', ')}
                sx={{ borderRadius: '100px', bgcolor: 'background.default', '& .MuiOutlinedInput-root': { borderRadius: '100px' } }}
              >
                {['LOW', 'MEDIUM', 'HIGH'].map((comp) => (
                  <MenuItem key={comp} value={comp}>
                    <Checkbox checked={competition.indexOf(comp) > -1} size="small" />
                    <ListItemText primary={comp} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button 
              variant="contained" 
              onClick={handleSearch} 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
              sx={{ 
                borderRadius: '100px', height: 40, px: 4, fontWeight: 700, fontSize: '0.95rem',
                bgcolor: 'primary.main',
                boxShadow: 'none',
                textTransform: 'none',
                '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' }
              }}
            >
              {loading ? 'Analyzing...' : 'Find Keywords'}
            </Button>
            <Button 
              variant="text" 
              color="inherit" 
              onClick={() => { setInputValue(''); setData([]); setTotal(0); }}
              sx={{ color: 'text.secondary', height: 40, borderRadius: '100px', px: 2.5, fontWeight: 600, textTransform: 'none' }}
            >
              Xóa kết quả
            </Button>
          </Box>
        </Paper>
      </Box>

      {data.length > 0 && (
        <Paper elevation={0} sx={{ mx: 3, mb: 3, borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Kết quả tìm kiếm ({new Intl.NumberFormat('vi-VN').format(total)})</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={downloadingCsv ? <CircularProgress size={16} /> : <FileDownloadIcon />}
              onClick={handleDownloadCsv}
              disabled={downloadingCsv || data.length === 0}
              sx={{ borderRadius: '100px', height: 36, px: 2.5, fontWeight: 600, textTransform: 'none' }}
            >
              {downloadingCsv ? 'Đang tải...' : 'Tải CSV'}
            </Button>
          </Box>
          <Box sx={{ minHeight: 300, '& .MuiPaper-root': { border: 'none', mx: 0, mb: 0, boxShadow: 'none' } }}>
            <CustomTable
              fields={columns}
              data={data.map((item, idx) => ({ ...item, index: (page - 1) * limit + idx + 1 }))}
              loading={loading}
              page={page - 1}
              rowsPerPage={limit}
              totalCount={total}
              onPageChange={(p) => fetchPage(p + 1)}
              onRowsPerPageChange={(l) => {
                setLimit(l);
                setPage(1);
                fetchPage(1, undefined, l);
              }}
              onSort={handleSort}
              sortBy={sortBy}
              sortOrder={sortOrder}
              enablePagination={true}
            />
          </Box>
        </Paper>
      )}

      <GoogleTrendsModal 
        key={searchId}
        open={trendsModalOpen} 
        onClose={() => setTrendsModalOpen(false)} 
        keyword={selectedKeyword} 
        activeEntry={selectedKeyword ? (trendsCache[selectedKeyword] || null) : null}
        onRefresh={(kw) => fetchTrendForKeyword(kw, true)}
      />
    </Box>
  );
}
