import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Select,
  MenuItem,
  Checkbox,
  CircularProgress,
  LinearProgress,
  Tooltip,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoIcon from '@mui/icons-material/Info';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HistoryIcon from '@mui/icons-material/History';
import StopIcon from '@mui/icons-material/Stop';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';

import { useToastify } from '../../../../components/Toastify';
import { format, isValid } from 'date-fns';
import { vbplSuggestionsService } from '../../vbplSuggestionsService';
import { TrendLineChart } from '../../../keywords/components/TrendLineChart';
import type { 
  PublicTrendSuggestionsResponse,
  PublicTrendSuggestionItem,
  PublicTrendDatesResponse,
  PublicTrendDateItem
} from '../../vbplSuggestions.types';

// Helper CSV Downloader
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

const STANDARD_CATEGORIES = [
  { code: 'laws_gov', label: 'Chính phủ & Luật pháp' },
  { code: 'business', label: 'Kinh doanh & Công nghiệp' },
  { code: 'finance', label: 'Tài chính' },
  { code: 'news', label: 'Tin tức & Thời sự' },
  { code: 'social', label: 'Xã hội & Đời sống' }
];

interface PublicTrendStreamLog {
  step: string;
  message?: string;
  timestamp: string;
  data?: any;
}

interface PublicTrendState {
  loading: boolean;
  result: PublicTrendSuggestionsResponse | null;
  logs: PublicTrendStreamLog[];
  currentStep: string;
  currentProgressItem: string;
  currentProgressIndex: number;
  totalProgressItems: number;
  listeners: Set<() => void>;
}

const publicTrendSharedState: PublicTrendState = {
  loading: false,
  result: null,
  logs: [],
  currentStep: 'idle',
  currentProgressItem: '',
  currentProgressIndex: 0,
  totalProgressItems: 0,
  listeners: new Set()
};

let activeAbortController: AbortController | null = null;

const notifyPublicTrendListeners = () => {
  publicTrendSharedState.listeners.forEach(listener => listener());
};

const updatePublicTrendSharedState = (updates: Partial<Omit<PublicTrendState, 'listeners'>>) => {
  Object.assign(publicTrendSharedState, updates);
  notifyPublicTrendListeners();
};

const getPublicLogMessage = (step: string, data?: any, defaultMessage?: string): string => {
  if (step === 'start') return 'Bắt đầu kết nối máy chủ phân tích chủ đề SEO từ Google Trends...';
  if (step === 'fetch_hot_keywords') return 'Đang cào các từ khóa tìm kiếm hot nhất thuộc danh mục Chính phủ & Luật pháp...';
  if (step === 'fetched_hot_keywords') return `Cào thành công ${data?.count || 0} từ khóa hot nhất.`;
  if (step === 'filter_history') return 'Đang đối chiếu lịch sử phân tích của 7 ngày trước để lọc trùng lặp...';
  if (step === 'filtered_history') return `Lọc xong. Còn lại ${data?.count || 0} từ khóa xu hướng mới độc nhất.`;
  if (step === 'llm_start') return 'Trí tuệ nhân tạo (AI) đang lập danh sách 20 ý tưởng chủ đề SEO từ các từ khóa hot...';
  if (step === 'llm_done') return 'AI đã tạo xong 20 đề xuất tiêu đề chủ đề SEO!';
  if (step === 'scrape_start') return 'Bắt đầu khởi chạy Puppeteer quét chỉ số Google Trends thực tế cho các đề xuất...';
  if (step === 'scrape_item_start') return `[Quét #${data?.index}/${data?.total}] Đang đo lường xu hướng chủ đề: "${data?.name}"`;
  if (step === 'browser_launch') return `Khởi tạo Chrome ảo cho chủ đề: "${data?.name}"...`;
  if (step === 'warmup') return `Thiết lập môi trường an toàn cho chủ đề: "${data?.name}"...`;
  if (step === 'navigate') return `Đang kết nối Google Trends cho: "${data?.name}"...`;
  if (step === 'captcha_solving') return `⚠️ Phát hiện Captcha bảo mật! Đang tự động giải mã captcha...`;
  if (step === 'captcha_solved') return `Giải mã Captcha thành công, tiếp tục cào...`;
  if (step === 'captcha_pass') return `Truy cập an toàn không có captcha.`;
  if (step === 'success') return `Đã trích xuất Trends thành công cho "${data?.name}".`;
  if (step === 'no_data') return `Không có dữ liệu xu hướng cho "${data?.name}".`;
  if (step === 'retry_wait') return `⚠️ Bị giới hạn tần suất quét, đang chờ để thử lại...`;
  if (step === 'scrape_item_done') return `Đo lường thành công: "${data?.name}" (Trends hiện tại: ${data?.currentScore || 0})`;
  if (step === 'saved') return 'Đã lưu trữ kết quả phân tích thành công vào cơ sở dữ liệu.';
  if (step === 'save_failed') return `❌ Lỗi lưu dữ liệu: ${data?.message || 'Lỗi DB'}`;
  return defaultMessage || '';
};

const startPublicTrendSuggestionsStream = async (
  showToast: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void,
  onComplete?: (snapshotId: string) => void
) => {
  if (activeAbortController) {
    activeAbortController.abort();
  }

  const controller = new AbortController();
  activeAbortController = controller;

  updatePublicTrendSharedState({
    loading: true,
    result: null,
    logs: [
      {
        step: 'start',
        message: 'Bắt đầu thiết lập stream kết nối...',
        timestamp: new Date().toLocaleTimeString()
      }
    ],
    currentStep: 'Đang kết nối...',
    currentProgressItem: '',
    currentProgressIndex: 0,
    totalProgressItems: 20
  });

  try {
    await vbplSuggestionsService.getPublicTrendSuggestionsStream(
      (event) => {
        const customMsg = getPublicLogMessage(event.step, event.data, event.message);
        const newLog: PublicTrendStreamLog = {
          step: event.step,
          message: customMsg || event.message || '',
          timestamp: new Date().toLocaleTimeString(),
          data: event.data
        };

        let stepText = publicTrendSharedState.currentStep;
        let progressItem = publicTrendSharedState.currentProgressItem;
        let progressIdx = publicTrendSharedState.currentProgressIndex;
        let progressTotal = publicTrendSharedState.totalProgressItems;

        const parsedMsg = getPublicLogMessage(event.step, event.data, event.message);
        if (parsedMsg) stepText = parsedMsg;

        if (event.step === 'scrape_start') {
          progressTotal = event.data?.total || 20;
        } else if (event.step === 'scrape_item_start') {
          progressItem = event.data?.name || '';
          progressIdx = event.data?.index || progressIdx;
        } else if (event.step === 'scrape_item_done') {
          progressItem = event.data?.name || '';
        }

        updatePublicTrendSharedState({
          logs: [...publicTrendSharedState.logs, newLog],
          currentStep: stepText,
          currentProgressItem: progressItem,
          currentProgressIndex: progressIdx,
          totalProgressItems: progressTotal
        });
      },
      (resultData) => {
        updatePublicTrendSharedState({
          result: resultData,
          loading: false,
          currentStep: 'Hoàn thành phân tích xu hướng!'
        });
        activeAbortController = null;
        showToast('Hoàn tất phân tích xu hướng SEO Google Trends thành công!', 'success');
        onComplete?.(resultData.id || resultData._id);
      },
      (errorMsg) => {
        updatePublicTrendSharedState({
          loading: false,
          currentStep: 'Lỗi phân tích.'
        });
        activeAbortController = null;
        showToast(errorMsg || 'Phân tích xu hướng thất bại', 'danger');
      },
      controller.signal
    );
  } catch (err: any) {
    if (err.name === 'AbortError') {
      updatePublicTrendSharedState({
        loading: false,
        currentStep: 'Đã dừng phân tích.'
      });
      showToast('Đã dừng phân tích xu hướng.', 'warning');
    } else {
      updatePublicTrendSharedState({
        loading: false,
        currentStep: 'Gặp lỗi kết nối.'
      });
      showToast(err.message || 'Lỗi stream kết nối', 'danger');
    }
    activeAbortController = null;
  }
};

const stopPublicTrendSuggestionsStream = () => {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
  updatePublicTrendSharedState({
    loading: false,
    currentStep: 'Đã dừng phân tích.'
  });
};

interface VbplSuggestionsSeoTopicsProps {
  cartItems: any[];
  setCartItems: React.Dispatch<React.SetStateAction<any[]>>;
  cartMinimized: boolean;
  setCartMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  handleToggleCart: (itemOrString: any) => void;
}

export default function VbplSuggestionsSeoTopics({
  cartItems,
  setCartItems,
  cartMinimized,
  setCartMinimized,
  handleToggleCart
}: VbplSuggestionsSeoTopicsProps) {
  const { showToast } = useToastify();

  const [ptState, setPtState] = useState({
    loading: publicTrendSharedState.loading,
    result: publicTrendSharedState.result,
    logs: publicTrendSharedState.logs,
    currentStep: publicTrendSharedState.currentStep,
    currentProgressItem: publicTrendSharedState.currentProgressItem,
    currentProgressIndex: publicTrendSharedState.currentProgressIndex,
    totalProgressItems: publicTrendSharedState.totalProgressItems
  });

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [ptDatesData, setPtDatesData] = useState<PublicTrendDatesResponse | null>(null);
  const [ptDatesLoading, setPtDatesLoading] = useState<boolean>(true);
  const [ptDetailLoading, setPtDetailLoading] = useState<boolean>(false);
  const [ptExpandedItems, setPtExpandedItems] = useState<Record<number, boolean>>({});

  const [publicTrendSearchQuery, setPublicTrendSearchQuery] = useState<string>('');
  const [progressModalOpen, setProgressModalOpen] = useState<boolean>(false);
  const [isLogsExpanded, setIsLogsExpanded] = useState<boolean>(true);

  const progressModalOpenRef = useRef(progressModalOpen);
  useEffect(() => {
    progressModalOpenRef.current = progressModalOpen;
  }, [progressModalOpen]);

  const publicLogContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (publicLogContainerRef.current) {
      publicLogContainerRef.current.scrollTop = publicLogContainerRef.current.scrollHeight;
    }
  }, [ptState.logs]);

  useEffect(() => {
    let prevLoading = false;
    const handlePtChange = () => {
      const isCurrentlyLoading = publicTrendSharedState.loading;
      setPtState({
        loading: isCurrentlyLoading,
        result: publicTrendSharedState.result,
        logs: publicTrendSharedState.logs,
        currentStep: publicTrendSharedState.currentStep,
        currentProgressItem: publicTrendSharedState.currentProgressItem,
        currentProgressIndex: publicTrendSharedState.currentProgressIndex,
        totalProgressItems: publicTrendSharedState.totalProgressItems
      });

      if (isCurrentlyLoading && !prevLoading) {
        setProgressModalOpen(true);
      }
      prevLoading = isCurrentlyLoading;
    };
    publicTrendSharedState.listeners.add(handlePtChange);
    return () => {
      publicTrendSharedState.listeners.delete(handlePtChange);
    };
  }, []);

  const fetchDates = async (shouldSelectLatest = false) => {
    setPtDatesLoading(true);
    try {
      const datesRes = await vbplSuggestionsService.getPublicTrendDates();
      setPtDatesData(datesRes);
      
      if (shouldSelectLatest && datesRes.dates && datesRes.dates.length > 0) {
        const latestDate = datesRes.dates[0].fetchedDate;
        setSelectedDate(latestDate);
        fetchByDate(latestDate);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || 'Lỗi khi tải lịch sử phân tích', 'danger');
    } finally {
      setPtDatesLoading(false);
    }
  };

  const fetchByDate = async (dateStr: string) => {
    setPtDetailLoading(true);
    setPtExpandedItems({});
    try {
      const detail = await vbplSuggestionsService.getPublicTrendByDate(dateStr);
      updatePublicTrendSharedState({ result: detail });
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || 'Lỗi khi tải chi tiết phân tích', 'danger');
    } finally {
      setPtDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchDates(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPublicTrendSuggestions = useMemo(() => {
    if (!ptState.result?.suggestions) return [];
    if (!publicTrendSearchQuery.trim()) return ptState.result.suggestions;
    
    const query = publicTrendSearchQuery.toLowerCase().trim();
    return ptState.result.suggestions.filter(
      item => item.name.toLowerCase().includes(query) || 
              item.hotKeyword.toLowerCase().includes(query) ||
              item.reason.toLowerCase().includes(query)
    );
  }, [ptState.result, publicTrendSearchQuery]);

  const handleCopyAllPublicTrends = () => {
    if (filteredPublicTrendSuggestions.length === 0) {
      showToast('Không có đề xuất nào để copy', 'warning');
      return;
    }
    const allText = filteredPublicTrendSuggestions.map(item => item.name).join('\n');
    navigator.clipboard.writeText(allText);
    showToast(`Đã copy toàn bộ ${filteredPublicTrendSuggestions.length} tiêu đề đề xuất`, 'success');
  };

  const handleExportPublicTrendsExcel = () => {
    if (filteredPublicTrendSuggestions.length === 0) {
      showToast('Không có dữ liệu đề xuất để tải xuống!', 'warning');
      return;
    }

    const headers = [
      'STT',
      'Tiêu đề chủ đề SEO đề xuất',
      'Từ khóa xu hướng (Hot Trend)',
      'Lý do gợi ý của AI',
      'Hạng Trend',
      'Volume tìm kiếm',
      'Tốc độ tăng trưởng (%)',
      'Điểm Trends hiện tại',
      'Điểm trung bình'
    ];

    const rows = filteredPublicTrendSuggestions.map((item, idx) => [
      String(idx + 1),
      item.name,
      item.hotKeyword,
      item.reason,
      item.position !== null && item.position !== undefined ? `#${item.position}` : '-',
      item.searchVolume !== null && item.searchVolume !== undefined && item.searchVolume > 0 ? String(item.searchVolume) : '-',
      item.increasePercentage !== null && item.increasePercentage !== undefined && item.increasePercentage > 0 ? `+${item.increasePercentage}%` : '-',
      item.scrape?.success && item.scrape?.currentScore !== undefined ? String(item.scrape.currentScore) : '-',
      item.scrape?.success && item.scrape?.avg !== undefined ? String(item.scrape.avg) : '-'
    ]);

    const filename = `AI_Goi_Y_Chu_De_SEO_${ptState.result?.fetchedDate || 'Export'}`;
    downloadCSV(headers, rows, filename);
  };

  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isValid(d) ? format(d, 'dd/MM/yyyy') : '-';
  };

  const SkeletonLoading = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Box 
            key={i} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              px: 2,
              py: 1.5,
              borderRadius: '12px', 
              border: '1px solid', 
              borderColor: 'divider' 
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <Skeleton variant="rectangular" width={24} height={20} sx={{ borderRadius: '4px' }} />
              <Skeleton variant="rectangular" width="60%" height={18} sx={{ borderRadius: '4px' }} />
            </Box>
            <Skeleton variant="rectangular" width={16} height={16} sx={{ borderRadius: '4px' }} />
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, width: '100%', boxSizing: 'border-box' }}>
      
      {/* Historical Dates Horizontal List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 1, width: '100%', boxSizing: 'border-box' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon sx={{ color: 'text.secondary', fontSize: 18 }} /> Lịch sử phân tích
        </Typography>
        
        {ptDatesLoading ? (
          <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pt: 1, pb: 1, width: '100%', boxSizing: 'border-box' }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rectangular" width={180} height={52} sx={{ borderRadius: 2, flexShrink: 0 }} />
            ))}
          </Box>
        ) : !ptDatesData?.dates || ptDatesData.dates.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 3, width: '100%', boxSizing: 'border-box' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Chưa có lịch sử phân tích nào
            </Typography>
          </Box>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 1.5,
              overflowX: 'auto',
              pt: 1.2,
              pb: 1.2,
              width: '100%',
              boxSizing: 'border-box',
              '&::-webkit-scrollbar': { height: '6px' },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: '3px' }
            }}
          >
            {ptDatesData.dates.map((dateItem) => {
              const isSelected = selectedDate === dateItem.fetchedDate;
              const isTodayDate = ptDatesData.today === dateItem.fetchedDate;
              
              return (
                <Box
                  key={dateItem.id}
                  onClick={() => {
                    if (ptState.loading) {
                      showToast('Vui lòng đợi quá trình phân tích hiện tại hoàn tất', 'warning');
                      return;
                    }
                    setSelectedDate(dateItem.fetchedDate);
                    fetchByDate(dateItem.fetchedDate);
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2.5,
                    py: 1,
                    borderRadius: '100px', // M3 Pill shape
                    border: '1px solid',
                    borderColor: isSelected ? 'warning.main' : 'divider',
                    bgcolor: (theme) => {
                      if (isSelected) {
                        return theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.03)';
                      }
                      return theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.005)';
                    },
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: 'warning.main',
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(245, 158, 11, 0.015)'
                    }
                  }}
                >
                  <CalendarTodayIcon 
                    sx={{ 
                      color: isSelected ? '#f59e0b' : 'text.secondary', 
                      fontSize: 16,
                      flexShrink: 0
                    }} 
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: isSelected ? 800 : 700,
                        color: isSelected ? '#f59e0b' : 'text.primary',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {formatDateStr(dateItem.fetchedDate)}
                      {isTodayDate && (
                        <Typography 
                          component="span" 
                          variant="caption" 
                          sx={{ 
                            fontSize: '0.62rem', 
                            fontWeight: 800, 
                            px: 0.6, 
                            py: 0.05, 
                            borderRadius: '4px',
                            bgcolor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981'
                          }}
                        >
                          Hôm nay
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mt: 0.25 }}>
                      {dateItem.count} đề xuất
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
      
      <Divider sx={{ my: 1.5 }} />

      {/* Main Content Area (Full width) */}
      <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
        {ptDetailLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', boxSizing: 'border-box' }}>
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: '16px' }} />
            <SkeletonLoading />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', boxSizing: 'border-box' }}>
            
            {/* STATE 1: WELCOME SCREEN */}
            {!ptState.loading && ptState.result === null && (
              <Box 
                sx={{ 
                  py: 6, 
                  px: 4, 
                  textAlign: 'center', 
                  borderRadius: '24px', 
                  border: '1px dashed',
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)',
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.015)' : 'rgba(245, 158, 11, 0.005)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  maxWidth: 700,
                  mx: 'auto'
                }}
              >
                <Box 
                  sx={{ 
                    width: 70, 
                    height: 70, 
                    borderRadius: '50%', 
                    bgcolor: 'rgba(245, 158, 11, 0.12)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    animation: 'pulse 2s infinite ease-in-out',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.4)' },
                      '70%': { transform: 'scale(1)', boxShadow: '0 0 0 10px rgba(245, 158, 11, 0)' },
                      '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(245, 158, 11, 0)' }
                    }
                  }}
                >
                  <AutoAwesomeIcon sx={{ fontSize: 36, color: '#f59e0b' }} />
                </Box>

                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                    Bắt đầu Phân tích AI & Google Trends
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 550, mx: 'auto', lineHeight: 1.6 }}>
                    Hệ thống sẽ quét các từ khóa thịnh hành thuộc danh mục <strong>Chính phủ & Luật pháp</strong> (3 tháng qua), lọc trùng lặp với lịch sử gợi ý 7 ngày trước, sau đó khởi chạy Puppeteer đo lường Google Trends thực tế cho 20 tiêu đề chủ đề pháp lý tiềm năng nhất.
                  </Typography>
                </Box>

                {/* Specs Box */}
                <Grid container spacing={1.5} sx={{ maxWidth: 500, mt: 1, textAlign: 'left' }}>
                  {[
                    { label: 'Danh mục phân tích', val: 'Luật pháp + Chính phủ' },
                    { label: 'Số lượng đề xuất', val: '20 tiêu đề SEO tiềm năng nhất' },
                    { label: 'Tham chiếu lịch sử', val: 'Lọc trùng lặp gợi ý 7 ngày trước' },
                    { label: 'Cơ chế đo lường', val: 'Quét tuần tự Puppeteer tránh quá tải máy chủ' },
                    { label: 'Thời gian hoàn thành', val: 'Khoảng 2 - 4 phút (SSE Stream)' }
                  ].map((spec, i) => (
                    <Grid xs={12} sm={6} key={i}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 800 }}>✓</Typography>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>
                            {spec.label}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.82rem' }}>
                            {spec.val}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                <Button 
                  variant="contained" 
                  color="warning" 
                  onClick={() => startPublicTrendSuggestionsStream(showToast, () => fetchDates(false))}
                  startIcon={<AutoAwesomeIcon />}
                  sx={{ 
                    mt: 1, 
                    borderRadius: '100px', 
                    fontWeight: 800, 
                    textTransform: 'none', 
                    px: 4, 
                    py: 1.2,
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(245, 158, 11, 0.5)',
                      background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)'
                    }
                  }}
                >
                  Bắt đầu phân tích ngay
                </Button>
              </Box>
            )}

            {/* STATE 2: DETAIL DATA PRESENTATION */}
            {ptState.result && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* Details Top Action Bar */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.003)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AutoAwesomeIcon sx={{ color: '#f59e0b', fontSize: 18 }} /> Kết quả đề xuất tiêu đề SEO tự động
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Bản phân tích ngày {formatDateStr(ptState.result.fetchedDate)} · Có tất cả {filteredPublicTrendSuggestions.length} gợi ý
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      color="warning"
                      size="small"
                      startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                      onClick={() => {
                        const toAdd = filteredPublicTrendSuggestions.filter(item => !cartItems.some(k => k.name === item.name));
                        if (toAdd.length === 0) {
                          setCartItems(prev => prev.filter(k => !filteredPublicTrendSuggestions.some(item => item.name === k.name)));
                          showToast('Đã bỏ chọn tất cả đề xuất!', 'info');
                        } else {
                          const newItems = toAdd.map(item => ({
                            name: item.name,
                            reason: item.reason || '',
                            currentScore: item.scrape?.success && item.scrape?.currentScore !== undefined ? item.scrape.currentScore : item.currentScore,
                            avg: item.scrape?.success && item.scrape?.avg !== undefined ? item.scrape.avg : item.avg,
                            slope: item.scrape?.success && item.scrape?.slope !== undefined ? item.scrape.slope : item.slope,
                            isSpike: item.scrape?.success && item.scrape?.isSpike !== undefined ? item.scrape.isSpike : item.isSpike,
                            trendTimeline: item.scrape?.success && item.scrape?.trendTimeline ? item.scrape.trendTimeline : item.trendTimeline,
                            relatedQueries: item.scrape?.success && item.scrape?.relatedQueries ? item.scrape.relatedQueries : item.relatedQueries,
                            relatedTopics: item.scrape?.success && item.scrape?.relatedTopics ? item.scrape.relatedTopics : item.relatedTopics,
                          }));
                          setCartItems(prev => [...prev, ...newItems]);
                          setCartMinimized(false);
                          showToast(`Đã thêm ${toAdd.length} đề xuất vào giỏ hàng!`, 'success');
                        }
                      }}
                      sx={{ 
                        borderRadius: '100px', 
                        fontWeight: 800, 
                        textTransform: 'none',
                        height: 40,
                        px: 2.5,
                        color: '#38bdf8',
                        borderColor: 'rgba(56, 189, 248, 0.4)',
                        '&:hover': {
                          borderColor: '#38bdf8',
                          bgcolor: 'rgba(56, 189, 248, 0.04)'
                        }
                      }}
                    >
                      {(() => {
                        const isAllSelected = filteredPublicTrendSuggestions.length > 0 && filteredPublicTrendSuggestions.every(item => cartItems.some(k => k.name === item.name));
                        return isAllSelected ? "Bỏ chọn tất cả" : `Chọn cả trang (${filteredPublicTrendSuggestions.length})`;
                      })()}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ContentCopyIcon sx={{ fontSize: 13 }} />}
                      onClick={handleCopyAllPublicTrends}
                      sx={{ borderRadius: '100px', textTransform: 'none', fontWeight: 800, height: 40, px: 2.5 }}
                    >
                      Copy tất cả tiêu đề
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      color="success"
                      startIcon={<FileDownloadIcon />}
                      onClick={handleExportPublicTrendsExcel}
                      sx={{ 
                        borderRadius: '100px', 
                        textTransform: 'none', 
                        fontWeight: 800, 
                        height: 40, 
                        px: 3,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: 'none',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      Tải CSV
                    </Button>
                  </Box>
                </Paper>

                {/* Filter and timeline detail items list */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)', p: 1.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                  <TextField
                    placeholder="Lọc nhanh đề xuất..."
                    value={publicTrendSearchQuery}
                    onChange={(e) => setPublicTrendSearchQuery(e.target.value)}
                    size="small"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                          </InputAdornment>
                        ),
                      }
                    }}
                    sx={{
                      maxWidth: 260,
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '28px',
                        bgcolor: 'background.paper',
                        px: 1.5
                      }
                    }}
                  />
                  
                  <Button
                    size="small"
                    variant="text"
                    color="warning"
                    onClick={() => {
                      if (window.confirm('Bạn có muốn cập nhật phân tích Trends mới nhất cho hôm nay không? Quá trình sẽ mất vài phút.')) {
                        startPublicTrendSuggestionsStream(showToast, () => fetchDates(false));
                      }
                    }}
                    startIcon={<RefreshIcon />}
                    sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '100px', height: 32 }}
                  >
                    Quét mới hôm nay
                  </Button>
                </Box>

                {/* Vertical lists for topics */}
                {filteredPublicTrendSuggestions.length === 0 ? (
                  <Box sx={{ p: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Không có đề xuất chủ đề nào khớp với từ lọc.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredPublicTrendSuggestions.map((item, idx) => {
                      const isExpanded = ptExpandedItems[idx] === true;
                      const inCart = cartItems.some(c => c.name === item.name);
                      
                      return (
                        <Paper
                          key={idx}
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: '16px',
                            border: '1px solid',
                            borderColor: isExpanded ? 'warning.main' : 'divider',
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.002)',
                            boxShadow: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 1.5, flex: 1, minWidth: 0 }}>
                              <Checkbox
                                checked={inCart}
                                onChange={() => handleToggleCart({
                                  name: item.name,
                                  reason: item.reason || '',
                                  currentScore: item.scrape?.success && item.scrape?.currentScore !== undefined ? item.scrape.currentScore : item.currentScore,
                                  avg: item.scrape?.success && item.scrape?.avg !== undefined ? item.scrape.avg : item.avg,
                                  slope: item.scrape?.success && item.scrape?.slope !== undefined ? item.scrape.slope : item.slope,
                                  isSpike: item.scrape?.success && item.scrape?.isSpike !== undefined ? item.scrape.isSpike : item.isSpike,
                                  trendTimeline: item.scrape?.success && item.scrape?.trendTimeline ? item.scrape.trendTimeline : item.trendTimeline,
                                  relatedQueries: item.scrape?.success && item.scrape?.relatedQueries ? item.scrape.relatedQueries : item.relatedQueries,
                                  relatedTopics: item.scrape?.success && item.scrape?.relatedTopics ? item.scrape.relatedTopics : item.relatedTopics,
                                })}
                                sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' }, p: 0, mt: 0.25 }}
                              />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body1" sx={{ fontWeight: 850, color: 'text.primary', lineHeight: 1.4, mb: 0.5 }}>
                                  {idx + 1}. {item.name}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, alignItems: 'center' }}>
                                  <Chip 
                                    label={`Trend Hot: ${item.hotKeyword}`} 
                                    size="small" 
                                    sx={{ fontWeight: 800, height: 20, bgcolor: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '100px' }} 
                                  />
                                  
                                  {item.scrape?.success ? (
                                    <>
                                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                        Trends trung bình: <strong style={{ color: '#10b981' }}>{Math.round(item.scrape.avg ?? 0)}</strong>
                                      </Typography>
                                      
                                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                        Tăng trưởng: <strong style={{ color: item.scrape.slope >= 0 ? '#10b981' : '#ef4444' }}>{item.scrape.slope >= 0 ? `+${Math.round(item.scrape.slope * 100)}%` : `${Math.round(item.scrape.slope * 100)}%`}</strong>
                                      </Typography>

                                      {item.scrape.isSpike && (
                                        <Chip label="🔥 ĐỘT BIẾN" size="small" color="error" sx={{ height: 18, fontWeight: 900, fontSize: '0.62rem', px: 0.5, borderRadius: '4px' }} />
                                      )}
                                    </>
                                  ) : (
                                    <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                      (Không quét được Trends - {item.scrape?.failReasons?.join(', ') || 'Lỗi mạng'})
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setPtExpandedItems(prev => ({ ...prev, [idx]: !isExpanded }))}
                                endIcon={isExpanded ? <ExpandMoreIcon sx={{ transform: 'rotate(180deg)' }} /> : <ExpandMoreIcon />}
                                sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '100px', height: 32, px: 2 }}
                              >
                                {isExpanded ? 'Ẩn chi tiết' : 'Xem Trends'}
                              </Button>
                            </Box>
                          </Box>

                          {/* Expanded Details including Chart & Queries */}
                          {isExpanded && (
                            <Box sx={{ mt: 1.5, pl: 4 }}>
                              <Divider sx={{ my: 1.5 }} />
                              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, color: 'text.secondary' }}>
                                LÝ DO AI GỢI Ý CHỦ ĐỀ NÀY:
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 2.2, color: 'text.primary', bgcolor: 'action.hover', p: 1.8, borderRadius: '12px', borderLeft: '3px solid #f59e0b', lineHeight: 1.5 }}>
                                {item.reason}
                              </Typography>

                              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3.5 }}>
                                {/* Left: Recharts Trend Line Chart */}
                                <Box sx={{ width: { xs: '100%', md: '68%' }, minWidth: 0 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 750, mb: 1, display: 'block', color: 'text.secondary' }}>
                                    BIỂU ĐỒ XU HƯỚNG TÌM KIẾM CHI TIẾT (GOOGLE TRENDS 12 THÁNG):
                                  </Typography>
                                  {item.scrape?.success && item.scrape.trendTimeline && item.scrape.trendTimeline.length > 0 ? (
                                    <Box sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.01)', p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                                      <TrendLineChart 
                                        data={item.scrape.trendTimeline} 
                                        currentScore={item.scrape.currentScore ?? undefined}
                                        height={200}
                                        showAxes={true}
                                        color={item.scrape.slope >= 0 ? '#10b981' : '#ef4444'}
                                      />
                                    </Box>
                                  ) : (
                                    <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: '12px' }}>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        Không có biểu đồ xu hướng (Cào dữ liệu thất bại)
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>

                                {/* Right: Related Queries / Topics */}
                                <Box sx={{ width: { xs: '100%', md: '32%' }, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 750, display: 'block', mb: 0.8, color: 'text.secondary' }}>
                                      TỪ KHÓA LIÊN QUAN (QUERIES):
                                    </Typography>
                                    {item.scrape?.success && item.scrape.relatedQueries && item.scrape.relatedQueries.length > 0 ? (
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                                        {item.scrape.relatedQueries.map((q: string, qIdx: number) => (
                                          <Chip 
                                            key={qIdx} 
                                            label={q} 
                                            size="small" 
                                            onClick={() => {
                                              navigator.clipboard.writeText(q);
                                              showToast('Đã sao chép từ khóa liên quan!', 'success');
                                            }}
                                            sx={{ fontWeight: 600, fontSize: '0.72rem', borderRadius: '100px' }} 
                                          />
                                        ))}
                                      </Box>
                                    ) : (
                                      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                        Không có truy vấn liên quan
                                      </Typography>
                                    )}
                                  </Box>

                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 750, display: 'block', mb: 0.8, color: 'text.secondary' }}>
                                      CHỦ ĐỀ LIÊN QUAN (TOPICS):
                                    </Typography>
                                    {item.scrape?.success && item.scrape.relatedTopics && item.scrape.relatedTopics.length > 0 ? (
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                                        {item.scrape.relatedTopics.map((tName: string, tIdx: number) => (
                                          <Chip 
                                            key={tIdx} 
                                            label={tName} 
                                            size="small" 
                                            sx={{ fontWeight: 600, fontSize: '0.72rem', borderRadius: '100px' }} 
                                          />
                                        ))}
                                      </Box>
                                    ) : (
                                      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                        Không có chủ đề liên quan
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                          )}
                        </Paper>
                      );
                    })}
                  </Box>
                )}

              </Box>
            )}
            
          </Box>
        )}
      </Box>

      {/* Realtime stream progress modal for public Trends */}
      <Dialog 
        open={progressModalOpen} 
        onClose={() => {
          if (!ptState.loading) {
            setProgressModalOpen(false);
          }
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} color="warning" />
            <Typography variant="h6" sx={{ fontWeight: 850 }}>
              Tiến trình Phân tích AI & Google Trends
            </Typography>
          </Box>
          {!ptState.loading && (
            <IconButton onClick={() => setProgressModalOpen(false)}>
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1.5 }}>
            
            <Paper elevation={0} sx={{ p: 2.2, borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.002)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {ptState.loading ? '⚡ Hệ thống đang phân tích...' : '✅ Hoàn tất phân tích!'}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#f59e0b' }}>
                  Tiến độ: {ptState.currentProgressIndex} / {ptState.totalProgressItems} chủ đề
                </Typography>
              </Box>

              <LinearProgress 
                variant="determinate" 
                value={Math.round((ptState.currentProgressIndex / (ptState.totalProgressItems || 1)) * 100)} 
                color="warning" 
                sx={{ height: 8, borderRadius: 4, mb: 1.5 }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  <strong>Trạng thái:</strong> {ptState.currentStep}
                </Typography>
                {ptState.currentProgressItem && (
                  <Typography variant="caption" color="warning.main" sx={{ fontWeight: 700 }}>
                    Đang cào: "{ptState.currentProgressItem}"
                  </Typography>
                )}
              </Box>
            </Paper>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  CHI TIẾT LOGS TỪ SERVER (THỜI GIAN THỰC):
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => setIsLogsExpanded(!isLogsExpanded)} 
                  endIcon={isLogsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  {isLogsExpanded ? 'Thu gọn log' : 'Mở rộng log'}
                </Button>
              </Box>

              {isLogsExpanded && (
                <Box 
                  ref={publicLogContainerRef}
                  sx={{
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                    color: (theme) => theme.palette.mode === 'dark' ? '#38bdf8' : '#0369a1',
                    p: 2,
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: 'divider',
                    maxHeight: 280,
                    height: 280,
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.78rem',
                    lineHeight: 1.6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.8
                  }}
                >
                  {ptState.logs.map((log, idx) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 1 }}>
                      <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', width: 75, flexShrink: 0 }}>
                        [{log.timestamp}]
                      </Typography>
                      <Typography component="span" variant="caption" sx={{ fontFamily: 'monospace', color: log.step === 'success' || log.step === 'scrape_item_done' ? '#10b981' : (log.step.includes('fail') ? '#ef4444' : 'inherit') }}>
                        {log.message}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {ptState.loading && (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', px: 1, textAlign: 'center', display: 'block' }}>
                ⚠️ Quá trình phân tích bao gồm việc quét Google Trends trực tiếp, có thể mất từ 2 đến 4 phút. Bạn có thể đóng cửa sổ này, tiến trình cào vẫn sẽ tiếp tục chạy ẩn ở nền.
              </Typography>
            )}

          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          {ptState.loading ? (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<StopIcon />}
                onClick={() => {
                  if (window.confirm('Bạn có thực sự muốn dừng tiến trình cào này lại không?')) {
                    stopPublicTrendSuggestionsStream();
                  }
                }}
                sx={{ borderRadius: '100px', textTransform: 'none', fontWeight: 800, mr: 'auto' }}
              >
                Dừng phân tích
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setProgressModalOpen(false)}
                sx={{ borderRadius: '100px', textTransform: 'none', fontWeight: 800, px: 3 }}
              >
                Chạy ẩn dưới nền
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                setProgressModalOpen(false);
                if (ptState.result) {
                  setSelectedDate(ptState.result.fetchedDate);
                  fetchDates(false);
                  fetchByDate(ptState.result.fetchedDate);
                }
              }}
              sx={{ borderRadius: '100px', textTransform: 'none', fontWeight: 800, px: 4 }}
            >
              Xem kết quả cào AI
            </Button>
          )}
        </DialogActions>
      </Dialog>

    </Box>
  );
}
