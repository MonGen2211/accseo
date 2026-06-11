import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Skeleton, 
  Grid, 
  InputAdornment,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  OutlinedInput,
  ListItemText,
  Tooltip,
  IconButton,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  CircularProgress
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import { useToastify } from '../../../../components/Toastify';
import { format, isValid } from 'date-fns';
import { vbplSuggestionsService } from '../../vbplSuggestionsService';
import type { 
  TopicGroup, 
  ChildKeyword, 
  AiExpandSnapshot 
} from '../../vbplSuggestions.types';

// CSV helper method
const downloadCSV = (headers: string[], rows: string[][], filename: string) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => {
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Sparkline helper component
const Sparkline = ({ keyword, volumes }: { keyword: string, volumes: { year: number, month: number, volume: number }[] }) => {
  if (!volumes || volumes.length === 0) return null;
  const width = 120;
  const height = 30;
  const max = Math.max(...volumes.map(v => v.volume));
  const min = Math.min(...volumes.map(v => v.volume));
  const getX = (i: number) => i * (width / 11);
  const getY = (v: number) => {
    if (max === min) return height / 2;
    return height - 5 - ((v - min) / (max - min)) * (height - 10);
  };
  const points = volumes.map((v, i) => `${getX(i)},${getY(v.volume)}`).join(' ');
  return (
    <Box sx={{ width, height, display: 'flex', alignItems: 'center' }}>
      <svg width={width} height={height}>
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          points={points}
        />
      </svg>
    </Box>
  );
};

interface VbplSuggestionsVolumeProps {
  cartItems: any[];
  setCartItems: React.Dispatch<React.SetStateAction<any[]>>;
  cartMinimized: boolean;
  setCartMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  handleToggleCart: (itemOrString: any) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export default function VbplSuggestionsVolume({
  cartItems,
  setCartItems,
  cartMinimized,
  setCartMinimized,
  handleToggleCart,
  onLoadingChange
}: VbplSuggestionsVolumeProps) {
  const { showToast } = useToastify();

  // ================= AI Keyword Expansion (Volume suggestions) =================
  const [seedKeywords, setSeedKeywords] = useState<string[]>([]);
  const [seedInputText, setSeedInputText] = useState<string>('');
  const [outputCount, setOutputCount] = useState<number>(20);
  const [perSeed, setPerSeed] = useState<number>(10);
  const [context, setContext] = useState<string>('');
  const [locationCode, setLocationCode] = useState<string>('VN');
  const [languageCode, setLanguageCode] = useState<string>('vi');
  const [includeZeroVolume, setIncludeZeroVolume] = useState<boolean>(false);
  const [minVolume, setMinVolume] = useState<number | ''>('');
  const [maxVolume, setMaxVolume] = useState<number | ''>('');
  const [competitionFilters, setCompetitionFilters] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedTopics, setExpandedTopics] = useState<TopicGroup[]>([]);
  const [clientSortBy, setClientSortBy] = useState<'opportunity' | 'volume'>('opportunity');
  const [intentFilter, setIntentFilter] = useState<'all' | 'commercial' | 'local' | 'info'>('all');
  
  // ================= AI Keyword Expansion Snapshots States =================
  const [expansionView, setExpansionView] = useState<'scan' | 'history'>('scan');
  const [currentSnapshotId, setCurrentSnapshotId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<AiExpandSnapshot[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState<boolean>(false);
  const [snapshotsTotal, setSnapshotsTotal] = useState<number>(0);
  const [snapshotsPage, setSnapshotsPage] = useState<number>(1);
  const [snapshotsTotalPages, setSnapshotsTotalPages] = useState<number>(1);

  const processedTopics = useMemo(() => {
    let result = expandedTopics.map(tg => {
      let filteredKeywords = tg.keywords || [];
      if (intentFilter !== 'all') {
        filteredKeywords = filteredKeywords.filter(k => k.intent === intentFilter);
      }
      return {
        ...tg,
        keywords: filteredKeywords,
        keywordCount: filteredKeywords.length
      };
    });

    if (clientSortBy === 'volume') {
      result = [...result].sort((a, b) => {
        const volA = a.topicTotalVolume ?? a.topicVolume ?? 0;
        const volB = b.topicTotalVolume ?? b.topicVolume ?? 0;
        return sortOrder === 'asc' ? volA - volB : volB - volA;
      });
      result = result.map(tg => {
        const sortedKeywords = [...tg.keywords].sort((a, b) => {
          return sortOrder === 'asc' 
            ? a.avgMonthlySearches - b.avgMonthlySearches 
            : b.avgMonthlySearches - a.avgMonthlySearches;
        });
        return { ...tg, keywords: sortedKeywords };
      });
    }
    return result;
  }, [expandedTopics, clientSortBy, intentFilter, sortOrder]);

  const [expandedTotal, setExpandedTotal] = useState<number>(0);
  const [expandedGenerated, setExpandedGenerated] = useState<number>(0);
  const [expandedTotalPages, setExpandedTotalPages] = useState<number>(1);
  const [expansionPage, setExpansionPage] = useState<number>(1);
  const [expansionLimit, setExpansionLimit] = useState<number>(50);
  const [expansionLoading, setExpansionLoading] = useState<boolean>(false);
  const [hasSearchedKeywords, setHasSearchedKeywords] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  // Report loading state to parent tab header
  useEffect(() => {
    onLoadingChange?.(expansionLoading);
  }, [expansionLoading, onLoadingChange]);

  const fetchSnapshotsList = async (targetPage = 1) => {
    setSnapshotsLoading(true);
    if (targetPage > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    try {
      const res = await vbplSuggestionsService.getAiExpandSnapshots(targetPage, 20);
      setSnapshots(res.items || []);
      setSnapshotsTotal(res.total || 0);
      setSnapshotsPage(res.page || 1);
      setSnapshotsTotalPages(res.totalPages || 1);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || 'Lỗi tải lịch sử từ khóa AI', 'danger');
    } finally {
      setSnapshotsLoading(false);
    }
  };

  const fetchSnapshotDetail = async (id: string, targetPage = 1) => {
    setExpansionLoading(true);
    if (targetPage > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    try {
      const res = await vbplSuggestionsService.getAiExpandSnapshotDetail(id, targetPage, expansionLimit);
      
      // Update form parameters from snapshot settings
      if (res.seeds && res.seeds.length > 0) {
        setSeedKeywords(res.seeds);
      }
      if (res.outputCount !== undefined) setOutputCount(res.outputCount);
      if (res.perSeed !== undefined) setPerSeed(res.perSeed);
      if (res.location) setLocationCode(res.location);
      if (res.language) setLanguageCode(res.language);
      setContext(res.context || '');

      // Set results
      const mappedTopics = (res.topics || []).map(topicGroup => ({
        ...topicGroup,
        keywordCount: topicGroup.keywordCount !== undefined ? topicGroup.keywordCount : (topicGroup.keywords ? topicGroup.keywords.length : 0)
      }));
      setExpandedTopics(mappedTopics);
      setExpandedTotal(res.total || 0);
      setExpandedGenerated(res.generated || 0);
      setExpandedTotalPages(res.totalPages || 1);
      setExpansionPage(res.page || 1);
      
      setCurrentSnapshotId(id);
      setHasSearchedKeywords(true);
      // NOTE: Removed setExpansionView('scan') so it stays in the history tab!
    } catch (err: any) {
      console.error(err);
      const statusCode = err.response?.status;
      const responseData = err.response?.data;
      const msg = responseData?.message || err.message;
      if (statusCode === 400 && responseData?.code === 'INVALID_ID') {
        showToast('ID bản cào không hợp lệ.', 'danger');
      } else if (statusCode === 404 && responseData?.code === 'AI_EXPAND_SNAPSHOT_NOT_FOUND') {
        showToast('Không tìm thấy bản cào từ khóa AI.', 'danger');
      } else {
        showToast(msg || 'Lỗi khi tải chi tiết bản cào', 'danger');
      }
    } finally {
      setExpansionLoading(false);
    }
  };

  const handleExpandKeywords = async (targetPage: number, forceRefresh: boolean, customLimit?: number) => {
    if (forceRefresh) {
      setCurrentSnapshotId(null);
    }

    if (currentSnapshotId && !forceRefresh) {
      await fetchSnapshotDetail(currentSnapshotId, targetPage);
      return;
    }

    let activeKeywords = [...seedKeywords];
    const trimmedInput = seedInputText.trim().replace(/,$/, '');
    if (trimmedInput) {
      if (!activeKeywords.includes(trimmedInput)) {
        activeKeywords.push(trimmedInput);
        setSeedKeywords(activeKeywords);
      }
      setSeedInputText('');
    }

    if (activeKeywords.length === 0) {
      setValidationError('Vui lòng thêm ít nhất 1 từ khóa hạt giống.');
      return;
    }
    setValidationError('');
    setExpansionLoading(true);
    setHasSearchedKeywords(true);

    if (targetPage > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    try {
      const res = await vbplSuggestionsService.aiExpandKeywords({
        seeds: activeKeywords,
        outputCount,
        perSeed,
        context: context.trim() || undefined,
        location: locationCode,
        language: languageCode,
        page: targetPage,
        limit: customLimit || expansionLimit,
        minVolume: minVolume !== '' ? minVolume : undefined,
        maxVolume: maxVolume !== '' ? maxVolume : undefined,
        competition: competitionFilters.length > 0 ? competitionFilters : undefined,
        includeZeroVolume
      });

      const mappedTopics = (res.topics || []).map(topicGroup => ({
        ...topicGroup,
        keywordCount: topicGroup.keywordCount !== undefined ? topicGroup.keywordCount : (topicGroup.keywords ? topicGroup.keywords.length : 0)
      }));

      setExpandedTopics(mappedTopics);
      setExpandedTotal(res.total || 0);
      setExpandedGenerated(res.generated || 0);
      setExpandedTotalPages(res.totalPages || 1);
      setExpansionPage(res.page || 1);
      if (res.snapshotId) {
        setCurrentSnapshotId(res.snapshotId);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || 'Lỗi khi gợi ý từ khóa', 'danger');
    } finally {
      setExpansionLoading(false);
    }
  };

  // Trigger keywords expansion when filters change dynamically
  useEffect(() => {
    if (hasSearchedKeywords) {
      const timer = setTimeout(() => {
        handleExpandKeywords(1, false);
      }, 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minVolume, maxVolume, competitionFilters, sortOrder, locationCode, languageCode, includeZeroVolume]);

  const handleAddAllToCart = () => {
    const allKeywordsToSelect = processedTopics.flatMap(t => {
      const items: any[] = [];
      (t.keywords || []).forEach(k => {
        items.push({
          name: k.keyword,
          currentScore: 0,
          avg: k.avgMonthlySearches,
          slope: 0,
          isSpike: false,
          trendTimeline: k.monthlySearchVolumes?.map((v: any) => ({ date: `Tháng ${v.month}/${v.year}`, value: v.volume })) || [],
          relatedQueries: [],
          relatedTopics: []
        });
      });
      return items;
    });

    const toAdd = allKeywordsToSelect.filter(row => !cartItems.some(k => k.name === row.name));
    if (toAdd.length === 0) {
      const namesOnPage = allKeywordsToSelect.map(k => k.name);
      setCartItems(prev => prev.filter(k => !namesOnPage.includes(k.name)));
      showToast('Đã bỏ chọn tất cả từ khóa trang này khỏi giỏ hàng!', 'info');
    } else {
      setCartItems(prev => [...prev, ...toAdd]);
      setCartMinimized(false);
      showToast(`Đã thêm ${toAdd.length} từ khóa vào giỏ hàng!`, 'success');
    }
  };

  const isTopicAllSelected = (topicGroup: TopicGroup) => {
    const childKeywords = topicGroup.keywords || [];
    if (childKeywords.length === 0) return false;
    return childKeywords.every(row => cartItems.some(k => k.name === row.keyword));
  };

  const handleToggleTopicGroup = (topicGroup: TopicGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    const childKeywords = topicGroup.keywords || [];
    const allSelected = isTopicAllSelected(topicGroup);
    
    if (allSelected) {
      // Remove all child keywords of this topic from cart
      const childNames = childKeywords.map(k => k.keyword);
      setCartItems(prev => prev.filter(k => !childNames.includes(k.name)));
      showToast(`Đã bỏ chọn chủ đề: ${topicGroup.topic}`, 'info');
    } else {
      // Add all missing child keywords of this topic to cart
      const toAdd = childKeywords
        .filter(k => !cartItems.some(c => c.name === k.keyword))
        .map(k => ({
          name: k.keyword,
          currentScore: 0,
          avg: k.avgMonthlySearches,
          slope: 0,
          isSpike: false,
          trendTimeline: k.monthlySearchVolumes?.map((v: any) => ({ date: `Tháng ${v.month}/${v.year}`, value: v.volume })) || [],
          relatedQueries: [],
          relatedTopics: []
        }));
      setCartItems(prev => [...prev, ...toAdd]);
      setCartMinimized(false);
      showToast(`Đã thêm toàn bộ từ khóa chủ đề: ${topicGroup.topic}`, 'success');
    }
  };

  const maxSearchVolume = useMemo(() => {
    let maxVal = 1;
    expandedTopics.forEach(t => {
      (t.keywords || []).forEach(k => {
        if (k.avgMonthlySearches && k.avgMonthlySearches > maxVal) {
          maxVal = k.avgMonthlySearches;
        }
      });
    });
    return maxVal;
  }, [expandedTopics]);

  const handleExportCsv = () => {
    if (processedTopics.length === 0) {
      showToast('Không có dữ liệu đề xuất để xuất tải!', 'warning');
      return;
    }
    const headers = [
      'Chủ đề cha',
      'Độ cạnh tranh chủ đề',
      'Tổng Volume con',
      'Từ khóa con',
      'Intent',
      'Volume',
      'Cạnh tranh (0-100)',
      'Giá thầu tối thiểu (USD)',
      'Giá thầu tối đa (USD)'
    ];
    const rows: string[][] = [];
    processedTopics.forEach(t => {
      const compVal = t.topicCompetition || 'UNKNOWN';
      const totalVol = t.topicTotalVolume ?? t.topicVolume ?? 0;
      (t.keywords || []).forEach(k => {
        rows.push([
          t.topic,
          compVal,
          String(totalVol),
          k.keyword,
          k.intent || '',
          String(k.avgMonthlySearches || 0),
          String(k.competitionIndex || 0),
          k.bidLow !== null && k.bidLow !== undefined ? String(k.bidLow) : '',
          k.bidHigh !== null && k.bidHigh !== undefined ? String(k.bidHigh) : ''
        ]);
      });
    });

    const filename = `AI_Mo_Rong_Tu_Khoa_${currentSnapshotId || 'Volume'}`;
    downloadCSV(headers, rows, filename);
  };

  const handleCopySelected = () => {
    const allKeywords = processedTopics.flatMap(t => (t.keywords || []).map(k => k.keyword));
    if (allKeywords.length === 0) {
      showToast('Không có từ khóa nào để sao chép!', 'warning');
      return;
    }
    navigator.clipboard.writeText(allKeywords.join('\n'));
    showToast(`Đã sao chép ${allKeywords.length} từ khóa!`, 'success');
  };

  // Helper date formatter
  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isValid(d) ? format(d, 'dd/MM/yyyy') : '-';
  };

  const formatBidRange = (low?: number | null, high?: number | null) => {
    if ((low === undefined || low === null) && (high === undefined || high === null)) return '—';
    const lStr = low !== undefined && low !== null ? `$${low.toFixed(2)}` : '—';
    const hStr = high !== undefined && high !== null ? `$${high.toFixed(2)}` : '—';
    return `${lStr} - ${hStr}`;
  };

  // Helper to render the results section
  const renderResultsSection = () => {
    if (expandedTopics.length === 0) {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: '16px', // Premium bo góc
            border: '1px dashed',
            borderColor: 'divider',
            textAlign: 'center',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.01)'
          }}
        >
          <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic', fontWeight: 600 }}>
            AI chưa sinh được chủ đề phù hợp, thử seed khác hoặc thêm context.
          </Typography>
        </Paper>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: '16px', // Premium bo góc
            border: '1px solid', 
            borderColor: 'divider', 
            boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: 2,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.002)'
          }}
        >
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <AutoAwesomeIcon sx={{ color: '#10b981', fontSize: '1.25rem' }} />
              <Typography sx={{ fontWeight: 850, fontSize: '1.15rem' }}>
                Danh sách nhóm chủ đề từ khóa AI
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Tổng từ khóa con AI sinh được: <strong style={{ color: '#10b981' }}>{expandedGenerated}</strong> · Hiển thị {processedTopics.length} chủ đề cha sau lọc
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 13 }} />}
              onClick={handleAddAllToCart}
              sx={{ 
                borderRadius: '100px', // M3 Pill shape
                height: 40,
                fontWeight: 800, 
                textTransform: 'none',
                color: 'primary.main',
                borderColor: 'primary.main',
                px: 2.5
              }}
            >
              {(() => {
                const allChildKeywords = processedTopics.flatMap(t => t.keywords || []);
                const isAllSelected = allChildKeywords.length > 0 && allChildKeywords.every(row => cartItems.some(k => k.name === row.keyword));
                return isAllSelected ? "Bỏ chọn cả trang" : `Chọn cả trang (${allChildKeywords.length})`;
              })()}
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="primary"
              startIcon={<ContentCopyIcon sx={{ fontSize: 13 }} />}
              onClick={handleCopySelected}
              sx={{ 
                borderRadius: '100px', // M3 Pill shape
                height: 40,
                fontWeight: 800, 
                textTransform: 'none', 
                px: 2.5 
              }}
            >
              Copy đã chọn
            </Button>
            <Button
              variant="contained"
              size="small"
              color="success"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportCsv}
              sx={{ 
                borderRadius: '100px', // M3 Pill shape
                height: 40,
                fontWeight: 800, 
                textTransform: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
                  boxShadow: 'none'
                },
                px: 3
              }}
            >
              Tải CSV
            </Button>
          </Box>
        </Paper>

        {/* Quick Client Filters & Sorting Bar */}
        <Box 
          sx={{ 
            p: 2.5, 
            borderRadius: '16px', // Premium bo góc
            border: '1px solid', 
            borderColor: 'divider', 
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.002)',
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2.5
          }}
        >
          {/* Intent Filter Chips */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lọc theo Intent:
            </Typography>
            {([
              { value: 'all', label: 'Tất cả' },
              { value: 'commercial', label: 'Thương mại (Commercial)' },
              { value: 'local', label: 'Địa phương (Local)' },
              { value: 'info', label: 'Thông tin (Info)' }
            ] as const).map(opt => (
              <Chip
                key={opt.value}
                label={opt.label}
                size="small"
                clickable
                color={intentFilter === opt.value ? 'primary' : 'default'}
                variant={intentFilter === opt.value ? 'default' : 'outlined'}
                onClick={() => setIntentFilter(opt.value)}
                sx={{ 
                  fontWeight: 800, 
                  px: 1, 
                  borderRadius: '100px', // M3 Pill chip
                  transition: 'all 0.2s ease-in-out'
                }}
              />
            ))}
          </Box>

          {/* Sort Toggle Chips */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sắp xếp kết quả:
            </Typography>
            {([
              { value: 'opportunity', label: 'Mặc định hệ thống' },
              { value: 'volume', label: 'Volume lượng tìm kiếm' }
            ] as const).map(opt => (
              <Chip
                key={opt.value}
                label={opt.label}
                size="small"
                clickable
                color={clientSortBy === opt.value ? 'secondary' : 'default'}
                variant={clientSortBy === opt.value ? 'default' : 'outlined'}
                onClick={() => setClientSortBy(opt.value)}
                sx={{ 
                  fontWeight: 800, 
                  px: 1, 
                  borderRadius: '100px', // M3 Pill chip
                  transition: 'all 0.2s ease-in-out'
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Accordion 2-level rendering */}
        <Box>
          {processedTopics.map((topicGroup, tIdx) => {
            const allSelected = isTopicAllSelected(topicGroup);
            const compColor = topicGroup.topicCompetition === 'LOW' ? '#10b981' : topicGroup.topicCompetition === 'MEDIUM' ? '#f59e0b' : topicGroup.topicCompetition === 'HIGH' ? '#ef4444' : '#6b7280';
            const compLabel = topicGroup.topicCompetition === 'LOW' ? 'Low' : topicGroup.topicCompetition === 'MEDIUM' ? 'Medium' : topicGroup.topicCompetition === 'HIGH' ? 'High' : 'Unknown';

            return (
              <Accordion 
                key={tIdx} 
                disableGutters
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '8px !important',
                  mb: 2,
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)',
                    px: 2,
                    '& .MuiAccordionSummary-content': {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 2,
                      width: '100%',
                      minWidth: 0
                    }
                  }}
                >
                  {/* Left details */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                    <Checkbox
                      size="small"
                      checked={allSelected}
                      onClick={(e) => handleToggleTopicGroup(topicGroup, e)}
                      sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' }, p: 0.5 }}
                    />
                    <Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {topicGroup.topic}
                    </Typography>
                    <Chip 
                      label={compLabel} 
                      size="small" 
                      sx={{ fontWeight: 700, fontSize: 10, height: 20, bgcolor: `${compColor}15`, color: compColor, border: `1px solid ${compColor}30` }}
                    />
                  </Box>

                  {/* Right details */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mr: 1, flexShrink: 0 }}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 650, fontSize: '0.65rem' }}>
                        TỔNG VOLUME CON
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 850, color: 'text.primary' }}>
                        {topicGroup.topicTotalVolume !== undefined && topicGroup.topicTotalVolume !== null
                          ? topicGroup.topicTotalVolume.toLocaleString('vi-VN') 
                          : (topicGroup.topicVolume ? topicGroup.topicVolume.toLocaleString('vi-VN') : '—')}
                      </Typography>
                    </Box>
                    {topicGroup.topicTotalVolume !== undefined && topicGroup.topicTotalVolume !== null && topicGroup.topicVolume !== undefined && (
                      <Box sx={{ textAlign: 'right', opacity: 0.7 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 650, fontSize: '0.65rem' }}>
                          VOLUME GỐC
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem' }}>
                          {topicGroup.topicVolume.toLocaleString('vi-VN')}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 650, fontSize: '0.65rem' }}>
                        SỐ TỪ CON
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 850, color: '#10b981' }}>
                        {topicGroup.keywordCount} từ khóa
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.002)' }}>
                          <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 60 }}></TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 50 }}>#</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>TỪ KHÓA CON</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 110 }}>INTENT</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'text.secondary', align: 'right', width: 110 }}>VOLUME</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 120 }}>XU HƯỚNG (12T)</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 100 }}>TREND 3T</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 150 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              CẠNH TRANH
                              <Tooltip title="Đây là độ cạnh tranh QUẢNG CÁO Google Ads, KHÔNG phải độ khó SEO" arrow>
                                <InfoIcon sx={{ fontSize: 13, cursor: 'help', color: 'text.secondary' }} />
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 180 }}>GIÁ THẦU</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topicGroup.keywords && topicGroup.keywords.map((k, kIdx) => {
                          const inCart = cartItems.some(c => c.name === k.keyword);
                          const childCompColor = k.competition === 'LOW' ? '#10b981' : k.competition === 'MEDIUM' ? '#f59e0b' : k.competition === 'HIGH' ? '#ef4444' : '#6b7280';
                          const childCompLabel = k.competition === 'LOW' ? 'Low' : k.competition === 'MEDIUM' ? 'Medium' : k.competition === 'HIGH' ? 'High' : 'Unknown';

                          let intentLabel = '';
                          let intentBg = '';
                          let intentColor = '';
                          if (k.intent === 'commercial') {
                            intentLabel = 'Thương mại';
                            intentBg = '#ffedd5';
                            intentColor = '#ea580c';
                          } else if (k.intent === 'local') {
                            intentLabel = 'Địa phương';
                            intentBg = '#dcfce7';
                            intentColor = '#16a34a';
                          } else if (k.intent === 'info') {
                            intentLabel = 'Thông tin';
                            intentBg = '#f3f4f6';
                            intentColor = '#4b5563';
                          }

                          let trendText = '—';
                          let trendColor = 'text.secondary';
                          if (k.trend !== undefined && k.trend !== null) {
                            if (k.trend > 1.05) {
                              trendText = `↑ ${k.trend.toFixed(2)}x`;
                              trendColor = '#10b981';
                            } else if (k.trend < 0.95) {
                              trendText = `↓ ${k.trend.toFixed(2)}x`;
                              trendColor = '#ef4444';
                            } else {
                              trendText = `→ ${k.trend.toFixed(2)}x`;
                              trendColor = 'text.secondary';
                            }
                          }

                          return (
                            <TableRow 
                              key={kIdx} 
                              hover
                              sx={{ 
                                '&:last-child td, &:last-child th': { border: 0 },
                                ...(kIdx === 0 && {
                                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.04)',
                                  '&:hover': {
                                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.12) !important' : 'rgba(16, 185, 129, 0.07) !important'
                                  }
                                })
                              }}
                            >
                              <TableCell>
                                <Checkbox
                                  size="small"
                                  checked={inCart}
                                  onChange={() => handleToggleCart({
                                    name: k.keyword,
                                    currentScore: 0,
                                    avg: k.avgMonthlySearches,
                                    slope: 0,
                                    isSpike: false,
                                    trendTimeline: k.monthlySearchVolumes?.map((v: any) => ({ date: `Tháng ${v.month}/${v.year}`, value: v.volume })) || [],
                                    relatedQueries: [],
                                    relatedTopics: []
                                  })}
                                  sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' }, p: 0.5 }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                {kIdx + 1}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography 
                                    variant="body2"
                                    sx={{ 
                                      fontWeight: 700, 
                                      color: 'primary.main',
                                      cursor: 'pointer',
                                      '&:hover': { textDecoration: 'underline' } 
                                    }}
                                    onClick={() => {
                                      window.open(`https://trends.google.com/trends/explore?date=today%203-m&geo=VN&q=${encodeURIComponent(k.keyword)}`, '_blank');
                                    }}
                                  >
                                    {k.keyword}
                                  </Typography>
                                  {kIdx === 0 && (
                                    <Chip 
                                      label="AI" 
                                      size="small" 
                                      sx={{ 
                                        height: 16, 
                                        fontSize: 9, 
                                        fontWeight: 800, 
                                        bgcolor: '#10b981', 
                                        color: 'white',
                                        px: 0.5,
                                        borderRadius: '100px'
                                      }} 
                                    />
                                  )}
                                  <Tooltip title="Sao chép từ khóa này" arrow>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => {
                                        navigator.clipboard.writeText(k.keyword);
                                        showToast('Đã sao chép từ khóa!', 'success');
                                      }}
                                    >
                                      <ContentCopyIcon sx={{ fontSize: 13 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                              <TableCell>
                                {intentLabel ? (
                                  <Chip 
                                    label={intentLabel} 
                                    size="small" 
                                    sx={{ 
                                      fontWeight: 800, 
                                      fontSize: 10, 
                                      height: 20, 
                                      bgcolor: intentBg, 
                                      color: intentColor,
                                      border: `1px solid ${intentColor}25`,
                                      borderRadius: '100px'
                                    }}
                                  />
                                ) : '—'}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ width: 100 }}>
                                  <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: 'text.primary', mb: 0.5 }}>
                                    {k.avgMonthlySearches ? k.avgMonthlySearches.toLocaleString('vi-VN') : '0'}
                                  </Typography>
                                  <Box sx={{ width: '100%', height: 3, bgcolor: 'action.hover', borderRadius: 2, overflow: 'hidden' }}>
                                    <Box sx={{ height: '100%', width: `${(k.avgMonthlySearches / maxSearchVolume) * 100}%`, bgcolor: '#10b981', borderRadius: 2 }} />
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Sparkline keyword={k.keyword} volumes={k.monthlySearchVolumes || []} />
                              </TableCell>
                              <TableCell>
                                {k.trend !== undefined && k.trend !== null ? (
                                  <Tooltip title="Xu hướng 3 tháng gần so với 3 tháng trước" arrow>
                                    <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: trendColor, display: 'inline-flex', alignItems: 'center', cursor: 'help' }}>
                                      {trendText}
                                    </Typography>
                                  </Tooltip>
                                ) : '—'}
                              </TableCell>

                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                    <CircularProgress variant="determinate" value={100} size={22} thickness={4} sx={{ color: 'action.hover' }} />
                                    <CircularProgress variant="determinate" value={k.competitionIndex || 0} size={22} thickness={4} sx={{ color: childCompColor, position: 'absolute', left: 0 }} />
                                  </Box>
                                  <Chip 
                                    label={childCompLabel} 
                                    size="small" 
                                    sx={{ fontWeight: 700, fontSize: 10, height: 18, bgcolor: `${childCompColor}10`, color: childCompColor, border: `1px solid ${childCompColor}20`, borderRadius: '100px' }}
                                  />
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem' }}>
                                {formatBidRange(k.bidLow, k.bidHigh)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>

        {/* Clean custom styled footer pagination */}
        {expandedTotalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, pt: 3, pb: 1 }}>
            <Button
              variant="outlined"
              size="small"
              disabled={expansionPage === 1}
              onClick={() => handleExpandKeywords(expansionPage - 1, false)}
              sx={{ borderRadius: '100px', height: 36, px: 2.5, textTransform: 'none', fontWeight: 700 }}
            >
              Trang trước
            </Button>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              Trang {expansionPage} / {expandedTotalPages} (Tổng {expandedTotal} chủ đề)
            </Typography>
            <Button
              variant="outlined"
              size="small"
              disabled={expansionPage >= expandedTotalPages}
              onClick={() => handleExpandKeywords(expansionPage + 1, false)}
              sx={{ borderRadius: '100px', height: 36, px: 2.5, textTransform: 'none', fontWeight: 700 }}
            >
              Trang sau
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, width: '100%', boxSizing: 'border-box' }}>
      {/* View navigation sub-toggle */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Button
          variant="text"
          onClick={() => setExpansionView('scan')}
          sx={{
            fontWeight: 800,
            fontSize: '0.95rem',
            textTransform: 'none',
            color: expansionView === 'scan' ? 'primary.main' : 'text.secondary',
            borderBottom: '2px solid',
            borderColor: expansionView === 'scan' ? 'primary.main' : 'transparent',
            borderRadius: 0,
            px: 2,
            pb: 1,
            '&:hover': { bgcolor: 'transparent', color: 'primary.main' }
          }}
          startIcon={<AutoAwesomeIcon sx={{ fontSize: 18 }} />}
        >
          Tạo từ khóa mới
        </Button>
        <Button
          variant="text"
          onClick={() => {
            setExpansionView('history');
            setCurrentSnapshotId(null);
            setExpandedTopics([]);
            setHasSearchedKeywords(false);
            fetchSnapshotsList(1);
          }}
          sx={{
            fontWeight: 800,
            fontSize: '0.95rem',
            textTransform: 'none',
            color: expansionView === 'history' ? 'primary.main' : 'text.secondary',
            borderBottom: '2px solid',
            borderColor: expansionView === 'history' ? 'primary.main' : 'transparent',
            borderRadius: 0,
            px: 2,
            pb: 1,
            '&:hover': { bgcolor: 'transparent', color: 'primary.main' }
          }}
          startIcon={<HistoryIcon sx={{ fontSize: 18 }} />}
        >
          Bản cào đã lưu ({snapshotsTotal})
        </Button>
      </Box>

      {expansionView === 'scan' ? (
        <>
          {/* Form controls paper */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: '24px', 
              border: '1px solid', 
              borderColor: 'divider',
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.002)'
            }}
          >
            <Grid container spacing={3}>
              <Grid xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <AutoAwesomeIcon sx={{ color: '#10b981', fontSize: '1.25rem' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Từ khóa hạt giống (Seed keywords - 1 đến 30 từ, tối đa 200 ký tự mỗi từ)
                    </Typography>
                  </Stack>
                  <Tooltip title="Nhập danh sách từ khóa gốc của bạn để AI phân tích và tìm các từ khóa mở rộng liên quan để viết bài." arrow>
                    <IconButton size="small"><InfoIcon sx={{ fontSize: 16 }} /></IconButton>
                  </Tooltip>
                </Box>

                {/* Visual list of seed chips */}
                {seedKeywords.length > 0 && (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 0.8, 
                      p: 1.5, 
                      mb: 1.5,
                      borderRadius: '12px', 
                      bgcolor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider',
                      maxHeight: 120,
                      overflowY: 'auto'
                    }}
                  >
                    {seedKeywords.map((tag, idx) => (
                      <Chip
                        key={idx}
                        label={tag}
                        onDelete={() => {
                          const updated = seedKeywords.filter((_, i) => i !== idx);
                          setSeedKeywords(updated);
                        }}
                        disabled={expansionLoading}
                        sx={{ fontWeight: 700, borderRadius: '100px' }}
                      />
                    ))}
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder={
                      seedKeywords.length >= 30 
                        ? "Đã đạt giới hạn tối đa 30 từ khóa" 
                        : "Nhập từ khóa hạt giống (Nhấn Enter hoặc Dấu phẩy để thêm, tối đa 30 từ khóa)"
                    }
                    value={seedInputText}
                    disabled={expansionLoading || seedKeywords.length >= 30}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.includes(',')) {
                        const parts = val.split(',').map(s => s.trim()).filter(Boolean);
                        const newSeeds = [...seedKeywords];
                        parts.forEach(p => {
                          if (newSeeds.length < 30 && !newSeeds.includes(p)) {
                            newSeeds.push(p);
                          }
                        });
                        setSeedKeywords(newSeeds);
                        setSeedInputText('');
                      } else {
                        setSeedInputText(val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = seedInputText.trim();
                        if (trimmed && seedKeywords.length < 30) {
                          if (!seedKeywords.includes(trimmed)) {
                            setSeedKeywords([...seedKeywords, trimmed]);
                          }
                          setSeedInputText('');
                        }
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        bgcolor: 'background.paper'
                      }
                    }}
                  />
                  {seedKeywords.length > 0 && (
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={() => {
                        setSeedKeywords([]);
                        setSeedInputText('');
                      }}
                      disabled={expansionLoading}
                      sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 2, minWidth: 100 }}
                    >
                      Xóa hết
                    </Button>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.8, ml: 0.5, fontWeight: 600 }}>
                  {seedKeywords.length}/30 từ khóa đã thêm
                </Typography>
              </Grid>

              <Grid xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  LĨNH VỰC ƯU TIÊN (CONTEXT - TỐI ĐA 300 KÝ TỰ)
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Ví dụ: đất đai, lao động, hôn nhân gia đình..."
                  value={context}
                  onChange={(e) => setContext(e.target.value.slice(0, 300))}
                  disabled={expansionLoading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: 'background.paper'
                    }
                  }}
                />
              </Grid>

              <Grid xs={6} md={4}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  SỐ TOPIC AI SINH (OUTPUTCOUNT)
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={outputCount}
                    onChange={(e) => setOutputCount(Number(e.target.value))}
                    disabled={expansionLoading}
                    sx={{ borderRadius: '12px', bgcolor: 'background.paper' }}
                  >
                    {[5, 10, 20, 30, 40, 50].map(val => (
                      <MenuItem key={val} value={val}>{val} topic</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid xs={6} md={4}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  MỞ RỘNG MỖI SEED (PERSEED)
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={perSeed}
                    onChange={(e) => setPerSeed(Number(e.target.value))}
                    disabled={expansionLoading}
                    sx={{ borderRadius: '12px', bgcolor: 'background.paper' }}
                  >
                    {[5, 10, 15, 20, 30].map(val => (
                      <MenuItem key={val} value={val}>{val}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Advanced search parameters (Accordion) */}
              <Grid xs={12}>
                <Accordion 
                  elevation={0}
                  sx={{ 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: '16px !important', 
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.002)',
                    overflow: 'hidden'
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RefreshIcon sx={{ fontSize: 16 }} /> BỘ LỌC NÂNG CAO (VOLUME, QUỐC GIA, NGÔN NGỮ...)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', p: 3 }}>
                    <Grid container spacing={3}>
                      <Grid xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                          QUỐC GIA NHẮM MỤC TIÊU
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            value={locationCode}
                            onChange={(e) => setLocationCode(e.target.value)}
                            disabled={expansionLoading}
                            sx={{ borderRadius: '12px', bgcolor: 'background.paper' }}
                          >
                            <MenuItem value="VN">Việt Nam (VN)</MenuItem>
                            <MenuItem value="US">Mỹ (US)</MenuItem>
                            <MenuItem value="JP">Nhật Bản (JP)</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                          NGÔN NGỮ NHẮM MỤC TIÊU
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            value={languageCode}
                            onChange={(e) => setLanguageCode(e.target.value)}
                            disabled={expansionLoading}
                            sx={{ borderRadius: '12px', bgcolor: 'background.paper' }}
                          >
                            <MenuItem value="vi">Tiếng Việt (vi)</MenuItem>
                            <MenuItem value="en">Tiếng Anh (en)</MenuItem>
                            <MenuItem value="ja">Tiếng Nhật (ja)</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                          VOLUME TÌM KIẾM TỐI THIỂU
                        </Typography>
                        <TextField
                          fullWidth
                          variant="outlined"
                          size="small"
                          type="number"
                          placeholder="Không giới hạn"
                          value={minVolume}
                          onChange={(e) => setMinVolume(e.target.value === '' ? '' : Number(e.target.value))}
                          disabled={expansionLoading}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'background.paper' } }}
                        />
                      </Grid>

                      <Grid xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                          VOLUME TÌM KIẾM TỐI ĐA
                        </Typography>
                        <TextField
                          fullWidth
                          variant="outlined"
                          size="small"
                          type="number"
                          placeholder="Không giới hạn"
                          value={maxVolume}
                          onChange={(e) => setMaxVolume(e.target.value === '' ? '' : Number(e.target.value))}
                          disabled={expansionLoading}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'background.paper' } }}
                        />
                      </Grid>

                      <Grid xs={12} sm={6}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                          ĐỘ CẠNH TRANH QUẢNG CÁO (CHỌN NHIỀU)
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            multiple
                            value={competitionFilters}
                            onChange={(e) => setCompetitionFilters(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                            disabled={expansionLoading}
                            input={<OutlinedInput label="Độ cạnh tranh" sx={{ borderRadius: '12px', bgcolor: 'background.paper' }} />}
                            renderValue={(selected) => selected.length === 0 ? 'Tất cả độ cạnh tranh' : selected.join(', ')}
                          >
                            <MenuItem value="LOW"><Checkbox checked={competitionFilters.indexOf('LOW') > -1} /> <ListItemText primary="Thấp (LOW)" /></MenuItem>
                            <MenuItem value="MEDIUM"><Checkbox checked={competitionFilters.indexOf('MEDIUM') > -1} /> <ListItemText primary="Trung bình (MEDIUM)" /></MenuItem>
                            <MenuItem value="HIGH"><Checkbox checked={competitionFilters.indexOf('HIGH') > -1} /> <ListItemText primary="Cao (HIGH)" /></MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                          control={
                            <Checkbox 
                              checked={includeZeroVolume} 
                              onChange={(e) => setIncludeZeroVolume(e.target.checked)}
                              disabled={expansionLoading}
                              color="primary"
                            />
                          }
                          label="Bao gồm từ khóa có Volume tìm kiếm bằng 0"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {validationError && (
                <Grid xs={12}>
                  <Typography variant="body2" color="error" sx={{ fontWeight: 700 }}>
                    ⚠️ {validationError}
                  </Typography>
                </Grid>
              )}

              <Grid xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start', alignItems: 'center', mt: 1 }}>
                <Button 
                  variant="contained" 
                  onClick={() => handleExpandKeywords(1, false)} 
                  disabled={expansionLoading}
                  startIcon={expansionLoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                  sx={{ 
                    borderRadius: '100px', px: 4, py: 1.2, fontWeight: 800, fontSize: '0.95rem',
                    background: 'linear-gradient(90deg, #10b981, #059669)',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
                    textTransform: 'none',
                    '&:hover': { background: 'linear-gradient(90deg, #059669, #047857)', boxShadow: '0 12px 32px rgba(16, 185, 129, 0.35)' }
                  }}
                >
                  {expansionLoading ? 'Đang mở rộng...' : 'Mở rộng từ khóa AI'}
                </Button>

                {hasSearchedKeywords && (
                  <Button 
                    variant="outlined" 
                    color="warning"
                    onClick={() => handleExpandKeywords(1, true)} 
                    disabled={expansionLoading}
                    startIcon={expansionLoading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                    sx={{ borderRadius: '100px', px: 3, py: 1.2, fontWeight: 700, fontSize: '0.95rem', height: 43, textTransform: 'none' }}
                  >
                    Tạo lại từ khóa
                  </Button>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* Loading Display */}
          {expansionLoading && !currentSnapshotId && (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.03)' : 'rgba(16, 185, 129, 0.01)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
              }}
            >
              <CircularProgress size={45} sx={{ color: '#10b981' }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                  ⚡ Hệ thống đang phân tích và tìm kiếm từ khóa, có thể mất khoảng 1 phút...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', fontStyle: 'italic' }}>
                  Chúng tôi đang kết nối với AI và thu thập lượt tìm kiếm thực tế từ Google. Quá trình kiểm tra ban đầu có thể cần thêm thời gian để phân tích chuyên sâu. Vui lòng giữ kết nối và không đóng trình duyệt!
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Results Section */}
          {!expansionLoading && hasSearchedKeywords && renderResultsSection()}
        </>
      ) : (
        /* History view */
        currentSnapshotId ? (
          /* Detail view inside History tab */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, width: '100%', boxSizing: 'border-box' }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '24px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.002)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="text"
                  color="primary"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => {
                    setCurrentSnapshotId(null);
                    setExpandedTopics([]);
                    setHasSearchedKeywords(false);
                    fetchSnapshotsList(snapshotsPage);
                  }}
                  sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '100px', px: 2, py: 0.8 }}
                >
                  Quay lại danh sách bản cào
                </Button>
                <Typography variant="subtitle1" sx={{ fontWeight: 850, color: 'text.primary' }}>
                  Chi tiết bản cào: {seedKeywords.join(', ')}
                </Typography>
              </Box>
            </Paper>
            
            {/* Unified wrapper for results */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

              {expansionLoading ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.03)' : 'rgba(16, 185, 129, 0.01)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                  }}
                >
                  <CircularProgress size={45} sx={{ color: '#10b981' }} />
                  <Typography variant="body1" sx={{ mt: 2, fontWeight: 800 }}>
                    Đang tải chi tiết bản cào...
                  </Typography>
                </Paper>
              ) : (
                renderResultsSection()
              )}
            </Box>
          </Box>
        ) : (
          /* List of snapshots */
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: '24px', 
              border: '1px solid', 
              borderColor: 'divider',
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.002)'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
              Lịch sử mở rộng từ khóa bằng AI
            </Typography>
            {snapshotsLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 3 }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: '12px' }} />
                ))}
              </Box>
            ) : snapshots.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: '16px' }}>
                <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Chưa có lịch sử mở rộng từ khóa nào. Hãy tạo từ khóa mới!
                </Typography>
              </Box>
            ) : (
              <Box>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', overflow: 'hidden', mb: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Từ khóa hạt giống</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 140 }}>Ngôn ngữ / Vùng</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 160 }}>Lĩnh vực ưu tiên</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 110, textAlign: 'center' }}>Số Topic</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 130, textAlign: 'center' }}>Tổng từ khóa</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 180 }}>Ngày thực hiện</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 130, textAlign: 'center' }}>Hành động</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {snapshots.map((s) => (
                        <TableRow key={s.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 400 }}>
                              {s.seeds && s.seeds.slice(0, 3).map((seed, idx) => (
                                <Chip key={idx} label={seed} size="small" sx={{ fontWeight: 600, borderRadius: '100px' }} />
                              ))}
                              {s.seeds && s.seeds.length > 3 && (
                                <Tooltip title={s.seeds.join(', ')} arrow>
                                  <Chip label={`+${s.seeds.length - 3}`} size="small" sx={{ fontWeight: 700, borderRadius: '100px', bgcolor: 'action.selected' }} />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {s.language?.toUpperCase()} / {s.location?.toUpperCase()}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                            {s.context ? (
                              <Tooltip title={s.context} arrow>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                  {s.context}
                                </Typography>
                              </Tooltip>
                            ) : (
                              <span style={{ opacity: 0.5 }}>—</span>
                            )}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>
                            {s.topicCount ?? s.outputCount}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: 'primary.main' }}>
                            {s.generated}
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                            {s.createdAt ? format(new Date(s.createdAt), 'dd/MM/yyyy HH:mm') : '—'}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => fetchSnapshotDetail(s.id, 1)}
                              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '100px', px: 2 }}
                            >
                              Xem chi tiết
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {snapshotsTotalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, pt: 1, pb: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={snapshotsPage === 1}
                      onClick={() => fetchSnapshotsList(snapshotsPage - 1)}
                      sx={{ borderRadius: '100px', height: 36, px: 2.5, textTransform: 'none', fontWeight: 700 }}
                    >
                      Trang trước
                    </Button>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      Trang {snapshotsPage} / {snapshotsTotalPages} (Tổng {snapshotsTotal} bản cào)
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={snapshotsPage >= snapshotsTotalPages}
                      onClick={() => fetchSnapshotsList(snapshotsPage + 1)}
                      sx={{ borderRadius: '100px', height: 36, px: 2.5, textTransform: 'none', fontWeight: 700 }}
                    >
                      Trang sau
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        )
      )}
    </Box>
  );
}
