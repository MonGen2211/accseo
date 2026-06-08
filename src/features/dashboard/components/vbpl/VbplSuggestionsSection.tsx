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
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Tabs,
  Tab,
  CircularProgress,
  LinearProgress,
  Tooltip,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
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
  Switch
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import InfoIcon from '@mui/icons-material/Info';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HistoryIcon from '@mui/icons-material/History';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TuneIcon from '@mui/icons-material/Tune';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StopIcon from '@mui/icons-material/Stop';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { domainService } from '../../../domains/domainService';
import { keywordGroupService } from '../../../keywords/keywordGroupService';
import type { Domain } from '../../../../types/domain.types';
import type { 
  VbplKeywordsResponse, 
  TrendingKeywordsResponse,
  PublicTrendSuggestionsResponse,
  PublicTrendSuggestionItem,
  PublicTrendDatesResponse,
  PublicTrendDateItem,
  CustomTrendSnapshotResponse,
  CustomTrendPaginationResponse,
  CustomTrendSnapshotSummary,
  CustomTrendSuggestionItem,
  CustomProjectGroup,
  TopicGroup,
  ChildKeyword,
  AiExpandSnapshot,
  AiExpandSnapshotListResponse,
  AiExpandSnapshotDetailResponse
} from '../../vbplSuggestions.types';
import { vbplSuggestionsService } from '../../vbplSuggestionsService';
import { useToastify } from '../../../../components/Toastify';
import { format, isValid } from 'date-fns';
import { TrendLineChart } from '../../../keywords/components/TrendLineChart';
import CustomTable from '../../../../components/custom-table/CustomTable';
const Sparkline = ({ keyword, volumes }: { keyword: string, volumes: { year: number, month: number, volume: number }[] }) => {
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

const STANDARD_CATEGORIES = [
  { id: '14', name: 'Luật pháp' },
  { id: '10', name: 'Chính phủ' },
  { id: '7', name: 'Tài chính' },
  { id: '16', name: 'Tin tức' },
  { id: '45', name: 'Kinh doanh & Công nghiệp' },
  { id: '8', name: 'Sức khỏe' }
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

const startPublicTrendSuggestionsStream = async (
  showToast: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void,
  onComplete?: () => void
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
        message: 'Bắt đầu kết nối đến máy chủ...',
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
      {
        count: 20,
        timeRange: '3-m',
        categoryIds: '10,14'
      },
      (event) => {
        const newLog: PublicTrendStreamLog = {
          step: event.step,
          message: event.message || '',
          timestamp: new Date().toLocaleTimeString(),
          data: event.data
        };
        
        let stepText = publicTrendSharedState.currentStep;
        let progressItem = publicTrendSharedState.currentProgressItem;
        let progressIdx = publicTrendSharedState.currentProgressIndex;
        let progressTotal = publicTrendSharedState.totalProgressItems;

        if (event.step === 'trending_fetch') {
          stepText = 'Đang truy vấn xu hướng từ cơ sở dữ liệu...';
        } else if (event.step === 'trending_done') {
          stepText = `Đã tải xong danh sách xu hướng tìm kiếm (${event.data?.count || 87} từ khóa).`;
        } else if (event.step === 'history_load') {
          stepText = 'Đang lọc các chủ đề đã gợi ý trong 7 ngày qua...';
        } else if (event.step === 'llm_start') {
          stepText = 'Trí tuệ nhân tạo (AI) đang phân tích & lập ý tưởng chủ đề luật...';
        } else if (event.step === 'llm_done') {
          stepText = 'AI đã thiết lập xong 20 tiêu đề chủ đề luật!';
        } else if (event.step === 'scrape_start') {
          stepText = 'Bắt đầu quét chỉ số Google Trends cho các chủ đề...';
          progressTotal = event.data?.total || 20;
        } else if (event.step === 'scrape_item_start') {
          stepText = `Đang phân tích chủ đề: ${event.data?.name || ''}`;
          progressItem = event.data?.name || '';
          progressIdx = event.data?.index || progressIdx;
        } else if (event.step === 'scrape_item_done') {
          stepText = `Đo lường thành công: ${event.data?.name || ''}`;
          progressItem = event.data?.name || '';
        } else if (event.step === 'saved') {
          stepText = 'Đã lưu kết quả phân tích vào lịch sử hệ thống.';
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
          currentStep: 'Hoàn thành phân tích AI!'
        });
        activeAbortController = null;
        showToast('Hoàn tất phân tích AI & Google Trends thành công!', 'success');
        onComplete?.();
      },
      (errorMsg) => {
        updatePublicTrendSharedState({
          loading: false,
          currentStep: 'Có lỗi xảy ra.'
        });
        activeAbortController = null;
        showToast(errorMsg || 'Phân tích AI thất bại', 'danger');
      },
      controller.signal
    );
  } catch (err: any) {
    if (err.name === 'AbortError') {
      updatePublicTrendSharedState({
        loading: false,
        currentStep: 'Đã dừng phân tích AI.'
      });
      showToast('Đã dừng phân tích AI.', 'warning');
    } else {
      updatePublicTrendSharedState({
        loading: false,
        currentStep: 'Gặp lỗi đường truyền.'
      });
      showToast(err.message || 'Lỗi kết nối stream', 'danger');
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

interface CustomTrendStreamLog {
  step: string;
  message?: string;
  timestamp: string;
  data?: any;
}

interface TempCrawlInfo {
  isNewProject: boolean;
  baseName: string;
  keywordsCount: number;
  timeRange: string;
}

interface CustomTrendState {
  loading: boolean;
  result: CustomTrendSnapshotResponse | null;
  logs: CustomTrendStreamLog[];
  currentStep: string;
  currentProgressItem: string;
  currentProgressIndex: number;
  totalProgressItems: number;
  tempCrawlInfo: TempCrawlInfo | null;
  listeners: Set<() => void>;
}

const customTrendSharedState: CustomTrendState = {
  loading: false,
  result: null,
  logs: [],
  currentStep: 'idle',
  currentProgressItem: '',
  currentProgressIndex: 0,
  totalProgressItems: 0,
  tempCrawlInfo: null,
  listeners: new Set()
};

let activeCustomAbortController: AbortController | null = null;

const notifyCustomTrendListeners = () => {
  customTrendSharedState.listeners.forEach(listener => listener());
};

const updateCustomTrendSharedState = (updates: Partial<Omit<CustomTrendState, 'listeners'>>) => {
  Object.assign(customTrendSharedState, updates);
  notifyCustomTrendListeners();
};

const getCustomLogMessage = (step: string, data?: any, defaultMessage?: string): string => {
  if (step === 'regen_load') {
    return `Đã tải snapshot nguồn thành công: "${data?.sourceName || ''}" (ID: ${data?.sourceId || ''})`;
  }
  if (step === 'resolve_name') {
    return 'Đang kiểm tra trùng lặp tên bộ từ khóa...';
  }
  if (step === 'name_suffixed') {
    return `Tên dự án bị trùng! Tự động đổi tên từ "${data?.originalName}" thành "${data?.finalName}"`;
  }
  if (step === 'history_load') {
    return `Đã tải ${data?.count || 0} từ khóa đã gợi ý trước đó của nhóm để tránh trùng lặp...`;
  }
  if (step === 'llm_start') {
    return 'Trí tuệ nhân tạo (AI) đang phân tích danh sách từ khóa gốc và lập ý tưởng chủ đề SEO...';
  }
  if (step === 'llm_done') {
    return 'AI đã lập xong danh sách đề xuất chủ đề!';
  }
  if (step === 'scrape_start') {
    return `Bắt đầu quét chỉ số Google Trends cho các chủ đề (Tổng số: ${data?.total || 20})...`;
  }
  if (step === 'scrape_item_start') {
    return `[Quét #${data?.index}/${data?.total}] Đang đo lường xu hướng chủ đề: "${data?.name || ''}"`;
  }
  if (step === 'browser_launch') {
    return `Đang khởi tạo trình duyệt ảo Puppeteer cho "${data?.name || ''}"...`;
  }
  if (step === 'warmup') {
    return `Đang làm ấm session trình duyệt cho "${data?.name || ''}"...`;
  }
  if (step === 'navigate') {
    return `Đang truy cập Google Trends cho "${data?.name || ''}"...`;
  }
  if (step === 'captcha_solving') {
    return `⚠️ Phát hiện Captcha! Đang tự động giải mã captcha qua Capsolver cho "${data?.name || ''}"...`;
  }
  if (step === 'captcha_solved') {
    return `✅ Giải mã Captcha thành công! Tiếp tục tải dữ liệu cho "${data?.name || ''}"...`;
  }
  if (step === 'captcha_pass') {
    return `Không có captcha, truy cập an toàn cho "${data?.name || ''}"...`;
  }
  if (step === 'success') {
    return `Đã trích xuất dữ liệu Google Trends thành công cho "${data?.name || ''}".`;
  }
  if (step === 'no_data') {
    return `Không có dữ liệu xu hướng cho "${data?.name || ''}".`;
  }
  if (step === 'retry_wait') {
    return `⚠️ Phát hiện chặn truy cập, đang đợi để thử lại cào "${data?.name || ''}"...`;
  }
  if (step === 'scrape_item_done') {
    return `Đo lường thành công: "${data?.name || ''}" (Điểm Trends: ${data?.currentScore ?? 0}, Trung bình: ${data?.avg ?? 0})`;
  }
  if (step === 'saved') {
    return 'Đã lưu kết quả phân tích và cào Google Trends vào cơ sở dữ liệu thành công.';
  }
  if (step === 'save_failed') {
    return `❌ Lưu trữ thất bại: ${data?.message || 'Lỗi DB'}`;
  }
  return defaultMessage || '';
};

const startCustomTrendSuggestionsStream = async (
  payload: { name: string; description?: string; inputKeywords: string[]; count?: number; timeRange?: '3-m' | '1-m' },
  showToast: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void,
  onComplete?: (snapshotId: string, finalName?: string) => void
) => {
  if (activeCustomAbortController) {
    activeCustomAbortController.abort();
  }
  
  const controller = new AbortController();
  activeCustomAbortController = controller;
  
  updateCustomTrendSharedState({
    loading: true,
    result: null,
    tempCrawlInfo: {
      isNewProject: true,
      baseName: payload.name,
      keywordsCount: payload.inputKeywords.length,
      timeRange: payload.timeRange || '3-m'
    },
    logs: [
      {
        step: 'start',
        message: 'Bắt đầu kết nối đến máy chủ...',
        timestamp: new Date().toLocaleTimeString()
      }
    ],
    currentStep: 'Đang kết nối...',
    currentProgressItem: '',
    currentProgressIndex: 0,
    totalProgressItems: payload.count || 20
  });

  let savedFinalName: string | undefined = undefined;

  try {
    await vbplSuggestionsService.getCustomTrendSuggestionsStream(
      payload,
      (event) => {
        const customMsg = getCustomLogMessage(event.step, event.data, event.message);
        if (event.step === 'name_suffixed' && event.data?.finalName) {
          savedFinalName = event.data.finalName;
        }

        const newLog: CustomTrendStreamLog = {
          step: event.step,
          message: customMsg || event.message || '',
          timestamp: new Date().toLocaleTimeString(),
          data: event.data
        };
        
        let stepText = customTrendSharedState.currentStep;
        let progressItem = customTrendSharedState.currentProgressItem;
        let progressIdx = customTrendSharedState.currentProgressIndex;
        let progressTotal = customTrendSharedState.totalProgressItems;

        const parsedMsg = getCustomLogMessage(event.step, event.data, event.message);
        if (parsedMsg) stepText = parsedMsg;

        if (event.step === 'scrape_start') {
          progressTotal = event.data?.total || payload.count || 20;
        } else if (event.step === 'scrape_item_start') {
          progressItem = event.data?.name || '';
          progressIdx = event.data?.index || progressIdx;
        } else if (event.step === 'scrape_item_done') {
          progressItem = event.data?.name || '';
        }

        updateCustomTrendSharedState({
          logs: [...customTrendSharedState.logs, newLog],
          currentStep: stepText,
          currentProgressItem: progressItem,
          currentProgressIndex: progressIdx,
          totalProgressItems: progressTotal
        });
      },
      (resultData) => {
        updateCustomTrendSharedState({
          result: resultData,
          loading: false,
          tempCrawlInfo: null,
          currentStep: 'Hoàn thành phân tích AI!'
        });
        activeCustomAbortController = null;
        showToast('Hoàn tất phân tích AI & Google Trends thành công!', 'success');
        onComplete?.(resultData.id || resultData._id, savedFinalName || resultData.name);
      },
      (errorMsg) => {
        updateCustomTrendSharedState({
          loading: false,
          tempCrawlInfo: null,
          currentStep: 'Có lỗi xảy ra.'
        });
        activeCustomAbortController = null;
        showToast(errorMsg || 'Phân tích AI thất bại', 'danger');
      },
      controller.signal
    );
  } catch (err: any) {
    if (err.name === 'AbortError') {
      updateCustomTrendSharedState({
        loading: false,
        tempCrawlInfo: null,
        currentStep: 'Đã dừng phân tích AI.'
      });
      showToast('Đã dừng phân tích AI.', 'warning');
    } else {
      updateCustomTrendSharedState({
        loading: false,
        tempCrawlInfo: null,
        currentStep: 'Gặp lỗi đường truyền.'
      });
      showToast(err.message || 'Lỗi kết nối stream', 'danger');
    }
    activeCustomAbortController = null;
  }
};

const startCustomTrendRegenStream = async (
  id: string,
  parentBaseName: string,
  payload: { count?: number; timeRange?: '3-m' | '1-m' },
  showToast: (msg: string, type: 'success' | 'danger' | 'warning' | 'info') => void,
  onComplete?: (snapshotId: string) => void
) => {
  if (activeCustomAbortController) {
    activeCustomAbortController.abort();
  }
  
  const controller = new AbortController();
  activeCustomAbortController = controller;
  
  updateCustomTrendSharedState({
    loading: true,
    result: null,
    tempCrawlInfo: {
      isNewProject: false,
      baseName: parentBaseName,
      keywordsCount: payload.count || 20,
      timeRange: payload.timeRange || '3-m'
    },
    logs: [
      {
        step: 'start',
        message: 'Bắt đầu kết nối tạo thêm snapshot (Regen) đến máy chủ...',
        timestamp: new Date().toLocaleTimeString()
      }
    ],
    currentStep: 'Đang kết nối tạo thêm...',
    currentProgressItem: '',
    currentProgressIndex: 0,
    totalProgressItems: payload.count || 20
  });

  try {
    await vbplSuggestionsService.getCustomTrendRegenStream(
      id,
      payload,
      (event) => {
        const customMsg = getCustomLogMessage(event.step, event.data, event.message);
        const newLog: CustomTrendStreamLog = {
          step: event.step,
          message: customMsg || event.message || '',
          timestamp: new Date().toLocaleTimeString(),
          data: event.data
        };
        
        let stepText = customTrendSharedState.currentStep;
        let progressItem = customTrendSharedState.currentProgressItem;
        let progressIdx = customTrendSharedState.currentProgressIndex;
        let progressTotal = customTrendSharedState.totalProgressItems;

        const parsedMsg = getCustomLogMessage(event.step, event.data, event.message);
        if (parsedMsg) stepText = parsedMsg;

        if (event.step === 'scrape_start') {
          progressTotal = event.data?.total || payload.count || 20;
        } else if (event.step === 'scrape_item_start') {
          progressItem = event.data?.name || '';
          progressIdx = event.data?.index || progressIdx;
        } else if (event.step === 'scrape_item_done') {
          progressItem = event.data?.name || '';
        }

        updateCustomTrendSharedState({
          logs: [...customTrendSharedState.logs, newLog],
          currentStep: stepText,
          currentProgressItem: progressItem,
          currentProgressIndex: progressIdx,
          totalProgressItems: progressTotal
        });
      },
      (resultData) => {
        updateCustomTrendSharedState({
          result: resultData,
          loading: false,
          tempCrawlInfo: null,
          currentStep: 'Hoàn thành cào snapshot mới!'
        });
        activeCustomAbortController = null;
        showToast('Hoàn tất tạo thêm snapshot mới thành công!', 'success');
        onComplete?.(resultData.id || resultData._id);
      },
      (errorMsg) => {
        updateCustomTrendSharedState({
          loading: false,
          tempCrawlInfo: null,
          currentStep: 'Có lỗi xảy ra khi tạo thêm.'
        });
        activeCustomAbortController = null;
        showToast(errorMsg || 'Tạo thêm snapshot thất bại', 'danger');
      },
      controller.signal
    );
  } catch (err: any) {
    if (err.name === 'AbortError') {
      updateCustomTrendSharedState({
        loading: false,
        tempCrawlInfo: null,
        currentStep: 'Đã dừng cào snapshot mới.'
      });
      showToast('Đã dừng cào snapshot mới.', 'warning');
    } else {
      updateCustomTrendSharedState({
        loading: false,
        tempCrawlInfo: null,
        currentStep: 'Gặp lỗi đường truyền.'
      });
      showToast(err.message || 'Lỗi kết nối stream', 'danger');
    }
    activeCustomAbortController = null;
  }
};

const stopCustomTrendSuggestionsStream = () => {
  if (activeCustomAbortController) {
    activeCustomAbortController.abort();
    activeCustomAbortController = null;
  }
  updateCustomTrendSharedState({
    loading: false,
    currentStep: 'Đã dừng phân tích.'
  });
};

const downloadCSV = (headers: string[], rows: string[][], filename: string) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => {
      const escaped = String(val ?? '').replace(/"/g, '""');
      if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') || escaped.includes('\r')) {
        return `"${escaped}"`;
      }
      return escaped;
    }).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function VbplSuggestionsSection() {
  const { showToast } = useToastify();

  // ================= Keyword Cart States =================
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [domainsList, setDomainsList] = useState<Domain[]>([]);
  const [selectedCartDomainId, setSelectedCartDomainId] = useState<string>('');
  const [isAddingToDomain, setIsAddingToDomain] = useState<boolean>(false);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const result = await domainService.getAll(1, 100);
        setDomainsList(result.items || []);
        if (result.items && result.items.length > 0) {
          setSelectedCartDomainId(result.items[0]._id);
        }
      } catch (error) {
        console.error('Lỗi tải danh sách tên miền:', error);
      }
    };
    fetchDomains();
  }, []);

  const handleToggleCart = (itemOrString: any) => {
    const name = typeof itemOrString === 'string' ? itemOrString : itemOrString.name;
    const exists = cartItems.some(k => k.name === name);
    if (exists) {
      setCartItems(prev => prev.filter(k => k.name !== name));
      showToast(`Đã xóa khỏi giỏ hàng: ${name}`, 'info');
    } else {
      const newItem = typeof itemOrString === 'string' 
        ? { name: itemOrString }
        : {
            name: itemOrString.name,
            reason: itemOrString.reason || '',
            currentScore: itemOrString.scrape?.success && itemOrString.scrape?.currentScore !== undefined ? itemOrString.scrape.currentScore : itemOrString.currentScore,
            avg: itemOrString.scrape?.success && itemOrString.scrape?.avg !== undefined ? itemOrString.scrape.avg : itemOrString.avg,
            slope: itemOrString.scrape?.success && itemOrString.scrape?.slope !== undefined ? itemOrString.scrape.slope : itemOrString.slope,
            isSpike: itemOrString.scrape?.success && itemOrString.scrape?.isSpike !== undefined ? itemOrString.scrape.isSpike : itemOrString.isSpike,
            trendTimeline: itemOrString.scrape?.success && itemOrString.scrape?.trendTimeline ? itemOrString.scrape.trendTimeline : itemOrString.trendTimeline,
            relatedQueries: itemOrString.scrape?.success && itemOrString.scrape?.relatedQueries ? itemOrString.scrape.relatedQueries : itemOrString.relatedQueries,
            relatedTopics: itemOrString.scrape?.success && itemOrString.scrape?.relatedTopics ? itemOrString.scrape.relatedTopics : itemOrString.relatedTopics,
          };
      setCartItems(prev => [...prev, newItem]);
      showToast(`Đã thêm vào giỏ hàng: ${name}`, 'success');
    }
  };

  const handleAddCartToDomain = async () => {
    if (!selectedCartDomainId) {
      showToast('Vui lòng chọn tên miền!', 'warning');
      return;
    }
    setIsAddingToDomain(true);
    try {
      const items = cartItems.map(item => ({
        name: item.name,
        reason: item.reason || null,
        status: 'pending_approval' as const,
        currentScore: item.currentScore,
        avg: item.avg,
        slope: item.slope,
        isSpike: item.isSpike,
        trendTimeline: item.trendTimeline,
        relatedQueries: item.relatedQueries,
        relatedTopics: item.relatedTopics,
      }));

      await keywordGroupService.createGroupItems({
        domainId: selectedCartDomainId,
        items,
        aiGen: true
      });

      showToast(`Đã thêm thành công ${cartItems.length} từ khóa vào tên miền!`, 'success');
      setCartItems([]);
    } catch (error: any) {
      console.error('Lỗi khi thêm bộ từ khóa:', error);
      showToast(error?.response?.data?.message || 'Có lỗi xảy ra khi thêm từ khóa vào tên miền!', 'danger');
    } finally {
      setIsAddingToDomain(false);
    }
  };

  // ================= Custom AI Suggestions States & State Machine =================
  const [ctState, setCtState] = useState({
    loading: customTrendSharedState.loading,
    result: customTrendSharedState.result,
    logs: customTrendSharedState.logs,
    currentStep: customTrendSharedState.currentStep,
    currentProgressItem: customTrendSharedState.currentProgressItem,
    currentProgressIndex: customTrendSharedState.currentProgressIndex,
    totalProgressItems: customTrendSharedState.totalProgressItems,
    tempCrawlInfo: customTrendSharedState.tempCrawlInfo
  });

  // State Machine view modes
  const [customViewMode, setCustomViewMode] = useState<'list' | 'detail'>('list');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Modals management
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [regenModalOpen, setRegenModalOpen] = useState<boolean>(false);
  const [progressModalOpen, setProgressModalOpen] = useState<boolean>(false);

  // Modal Create Form State
  const [inputName, setInputName] = useState<string>('');
  const [inputDescription, setInputDescription] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string[]>([]);
  const [tagsText, setTagsText] = useState<string>('');
  const [inputCount, setInputCount] = useState<number>(20);
  const [inputTimeRange, setInputTimeRange] = useState<'3-m' | '1-m'>('3-m');

  // Modal Regen Form State
  const [regenSourceId, setRegenSourceId] = useState<string>('');
  const [regenSourceName, setRegenSourceName] = useState<string>('');
  const [regenSourceKeywords, setRegenSourceKeywords] = useState<string[]>([]);
  const [regenCount, setRegenCount] = useState<number>(20);
  const [regenTimeRange, setRegenTimeRange] = useState<'3-m' | '1-m'>('3-m');

  // Snapshots History & Details
  const [ctSnapshots, setCtSnapshots] = useState<CustomTrendSnapshotSummary[]>([]);
  const [ctSnapshotsLoading, setCtSnapshotsLoading] = useState<boolean>(true);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
  const [ctPage, setCtPage] = useState<number>(1);
  const [ctTotal, setCtTotal] = useState<number>(0);
  const [ctSnapshotLoading, setCtSnapshotLoading] = useState<boolean>(false);
  const [ctSnapshotDetail, setCtSnapshotDetail] = useState<CustomTrendSnapshotResponse | null>(null);

  // inline / quick edit snapshot dialog
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [editingSnapshotId, setEditingSnapshotId] = useState<string>('');
  const [editingName, setEditingName] = useState<string>('');
  const [editingDescription, setEditingDescription] = useState<string>('');
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [isLogsExpanded, setIsLogsExpanded] = useState<boolean>(true);

  // Search and expand within list
  const [customSearchQuery, setCustomSearchQuery] = useState<string>('');
  const [customExpandedIndex, setCustomExpandedIndex] = useState<number | null>(null);

  const progressModalOpenRef = React.useRef(progressModalOpen);
  useEffect(() => {
    progressModalOpenRef.current = progressModalOpen;
  }, [progressModalOpen]);

  const customLogContainerRef = React.useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    if (customLogContainerRef.current) {
      customLogContainerRef.current.scrollTop = customLogContainerRef.current.scrollHeight;
    }
  }, [ctState.logs]);

  useEffect(() => {
    let prevLoading = false;
    const handleCtChange = () => {
      const isCurrentlyLoading = customTrendSharedState.loading;
      setCtState({
        loading: isCurrentlyLoading,
        result: customTrendSharedState.result,
        logs: customTrendSharedState.logs,
        currentStep: customTrendSharedState.currentStep,
        currentProgressItem: customTrendSharedState.currentProgressItem,
        currentProgressIndex: customTrendSharedState.currentProgressIndex,
        totalProgressItems: customTrendSharedState.totalProgressItems,
        tempCrawlInfo: customTrendSharedState.tempCrawlInfo
      });

      // Tự động mở Progress Modal khi SSE bắt đầu cào (chỉ mở khi chuyển từ false sang true)
      if (isCurrentlyLoading && !prevLoading) {
        setProgressModalOpen(true);
      }
      prevLoading = isCurrentlyLoading;
    };
    customTrendSharedState.listeners.add(handleCtChange);
    return () => {
      customTrendSharedState.listeners.delete(handleCtChange);
    };
  }, []);

  // Client-side grouping by baseName
  const projectGroups = useMemo((): CustomProjectGroup[] => {
    const groupsMap = new Map<string, CustomTrendSnapshotSummary[]>();
    ctSnapshots.forEach((s) => {
      const key = s.baseName || s.name || 'Dự án khác';
      const existing = groupsMap.get(key) || [];
      existing.push(s);
      groupsMap.set(key, existing);
    });

    // Inject temporary cào loading snapshot if active
    if (ctState.loading && ctState.tempCrawlInfo) {
      const { baseName, keywordsCount, timeRange } = ctState.tempCrawlInfo;
      const key = baseName || 'Dự án khác';
      const existing = groupsMap.get(key) || [];
      
      const stepText = ctState.logs[ctState.logs.length - 1]?.message || ctState.currentStep || 'Đang cào dữ liệu...';
      const tempSnapshot: CustomTrendSnapshotSummary = {
        id: 'temp-loading-id',
        name: `Đang tạo bản cào mới... (${ctState.currentProgressIndex}/${ctState.totalProgressItems} từ khóa)`,
        baseName: key,
        fetchedAt: new Date().toISOString(),
        suggestionsCount: keywordsCount,
        timeRange: timeRange as any,
        isLoadingPlaceholder: true, // custom flag
        stepMessage: stepText
      } as any;

      // Push to the top of existing snapshots list
      groupsMap.set(key, [tempSnapshot, ...existing]);
    }
    
    const groups: CustomProjectGroup[] = [];
    groupsMap.forEach((snapshotsList, baseName) => {
      const sortedSnapshots = [...snapshotsList].sort((a, b) => {
        // Keep loading placeholder ALWAYS at the absolute top of the folder list
        if ((a as any).isLoadingPlaceholder) return -1;
        if ((b as any).isLoadingPlaceholder) return 1;
        return new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime();
      });
      groups.push({
        baseName,
        snapshots: sortedSnapshots,
        latestId: sortedSnapshots[0]?.id || ''
      });
    });

    return groups.sort((a, b) => {
      const aTime = a.snapshots[0] ? new Date(a.snapshots[0].fetchedAt).getTime() : 0;
      const bTime = b.snapshots[0] ? new Date(b.snapshots[0].fetchedAt).getTime() : 0;
      // Keep loading placeholder folders at the absolute top of the projects list
      const aIsLoading = a.snapshots.some(s => (s as any).isLoadingPlaceholder);
      const bIsLoading = b.snapshots.some(s => (s as any).isLoadingPlaceholder);
      if (aIsLoading && !bIsLoading) return -1;
      if (!aIsLoading && bIsLoading) return 1;
      return bTime - aTime;
    });
  }, [ctSnapshots, ctState.loading, ctState.tempCrawlInfo, ctState.logs, ctState.currentProgressIndex, ctState.totalProgressItems, ctState.currentStep]);

  // Load snapshots list (paginated)
  const fetchCustomSnapshots = async (targetPage = 1) => {
    setCtSnapshotsLoading(true);
    try {
      const res = await vbplSuggestionsService.getCustomTrendSuggestions(targetPage, 10);
      const snapshotItems = res.items || [];
      setCtSnapshots(snapshotItems);
      setCtTotal(res.total);
      setCtPage(res.page);
      
      // Tự động expand các thư mục gom nhóm có snapshot con
      const defaultExpanded: Record<string, boolean> = {};
      snapshotItems.forEach(item => {
        const key = item.baseName || item.name || 'Dự án khác';
        defaultExpanded[key] = true;
      });
      setExpandedGroups(prev => ({ ...defaultExpanded, ...prev }));
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Lỗi khi tải danh sách dự án gợi ý', 'danger');
    } finally {
      setCtSnapshotsLoading(false);
    }
  };

  // Load a single custom snapshot detail
  const fetchCustomSnapshotDetail = async (id: string) => {
    setCtSnapshotLoading(true);
    setCustomExpandedIndex(null); // Reset expanded details
    try {
      const res = await vbplSuggestionsService.getCustomTrendSnapshot(id);
      setCtSnapshotDetail(res);
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Không thể lấy thông tin chi tiết dự án', 'danger');
    } finally {
      setCtSnapshotLoading(false);
    }
  };
  
  // ================= Left Column (VBPL) States =================
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VbplKeywordsResponse | null>(null);
  const [days, setDays] = useState<number>(7);
  const [linhVuc, setLinhVuc] = useState<string>('');
  const [agency, setAgency] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ================= Right Column (Trending) States =================
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingData, setTrendingData] = useState<TrendingKeywordsResponse | null>(null);
  const [trendingHours, setTrendingHours] = useState<number>(168);
  const [trendingCategories, setTrendingCategories] = useState<string[]>(['10', '14']);
  const [trendingSearchQuery, setTrendingSearchQuery] = useState<string>('');

  // ================= AI Suggestions Dates & History States =================
  const [ptDatesData, setPtDatesData] = useState<PublicTrendDatesResponse | null>(null);
  const [ptDatesLoading, setPtDatesLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [ptDetailLoading, setPtDetailLoading] = useState<boolean>(false);

  // ================= AI Suggestions States =================
  const [ptState, setPtState] = useState({
    loading: publicTrendSharedState.loading,
    result: publicTrendSharedState.result,
    logs: publicTrendSharedState.logs,
    currentStep: publicTrendSharedState.currentStep,
    currentProgressItem: publicTrendSharedState.currentProgressItem,
    currentProgressIndex: publicTrendSharedState.currentProgressIndex,
    totalProgressItems: publicTrendSharedState.totalProgressItems
  });

  const [publicTrendSearchQuery, setPublicTrendSearchQuery] = useState<string>('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const logContainerRef = React.useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [ptState.logs]);

  useEffect(() => {
    const handlePtChange = () => {
      setPtState({
        loading: publicTrendSharedState.loading,
        result: publicTrendSharedState.result,
        logs: publicTrendSharedState.logs,
        currentStep: publicTrendSharedState.currentStep,
        currentProgressItem: publicTrendSharedState.currentProgressItem,
        currentProgressIndex: publicTrendSharedState.currentProgressIndex,
        totalProgressItems: publicTrendSharedState.totalProgressItems
      });
    };
    publicTrendSharedState.listeners.add(handlePtChange);
    return () => {
      publicTrendSharedState.listeners.delete(handlePtChange);
    };
  }, []);

  // ================= Active Tab State =================
  const [activeTab, setActiveTab] = useState<number>(0);

  // ================= AI Keyword Expansion Tab States =================
  const [seedKeywords, setSeedKeywords] = useState<string[]>([]);
  const [seedInputText, setSeedInputText] = useState<string>('');
  const [outputCount, setOutputCount] = useState<number>(20);
  const [perSeed, setPerSeed] = useState<number>(10);
  const [context, setContext] = useState<string>('');
  const [includeZeroVolume, setIncludeZeroVolume] = useState<boolean>(false);
  const [locationCode, setLocationCode] = useState<string>('VN');
  const [languageCode, setLanguageCode] = useState<string>('vi');
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

  const fetchSnapshotsList = async (targetPage = 1) => {
    setSnapshotsLoading(true);
    try {
      const res = await vbplSuggestionsService.getAiExpandSnapshots(targetPage, 20);
      setSnapshots(res.items || []);
      setSnapshotsTotal(res.total || 0);
      setSnapshotsPage(res.page || 1);
      setSnapshotsTotalPages(res.totalPages || 1);
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Lỗi tải lịch sử từ khóa AI', 'danger');
    } finally {
      setSnapshotsLoading(false);
    }
  };

  const fetchSnapshotDetail = async (id: string, targetPage = 1) => {
    setExpansionLoading(true);
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
      setExpansionView('scan'); // switch view back to scan form & result table
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

    const seen = new Set<string>();
    const uniqueKeywords: string[] = [];
    activeKeywords.forEach(k => {
      const lower = k.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueKeywords.push(k);
      }
    });

    if (uniqueKeywords.length === 0) {
      setValidationError('Vui lòng nhập ít nhất 1 từ khóa hạt giống.');
      showToast('Vui lòng nhập từ khóa hạt giống!', 'warning');
      return;
    }

    if (uniqueKeywords.length > 30) {
      setValidationError('Số lượng từ khóa hạt giống vượt quá giới hạn (tối đa 30 từ).');
      showToast('Tối đa 30 từ khóa hạt giống!', 'warning');
      return;
    }

    const invalidKeyword = uniqueKeywords.find(k => k.length > 200);
    if (invalidKeyword) {
      setValidationError('Từ khóa hạt giống không được vượt quá 200 ký tự.');
      showToast('Từ khóa quá dài (tối đa 200 ký tự)!', 'warning');
      return;
    }

    if (context.length > 300) {
      setValidationError('Lĩnh vực ưu tiên không được vượt quá 300 ký tự.');
      showToast('Context quá dài (tối đa 300 ký tự)!', 'warning');
      return;
    }

    setValidationError('');
    setExpansionLoading(true);

    const activeLimit = customLimit !== undefined ? customLimit : expansionLimit;

    try {
      const payload: any = {
        keywords: uniqueKeywords,
        outputCount,
        perSeed,
        page: targetPage,
        limit: activeLimit,
        location: locationCode,
        language: languageCode,
        sortOrder,
        refresh: forceRefresh,
        includeZeroVolume
      };

      if (context.trim()) payload.context = context.trim();
      if (minVolume !== '') payload.minVolume = Number(minVolume);
      if (maxVolume !== '') payload.maxVolume = Number(maxVolume);
      if (competitionFilters.length > 0) payload.competition = competitionFilters;

      const res = await vbplSuggestionsService.aiExpandKeywords(payload);
      
      setExpandedTopics(res.topics || []);
      setExpandedTotal(res.total || 0);
      setExpandedGenerated(res.generated || 0);
      setExpandedTotalPages(res.totalPages || 1);
      setExpansionPage(res.page || 1);
      setHasSearchedKeywords(true);
      
      if (res.id) {
        setCurrentSnapshotId(res.id);
        fetchSnapshotsList(1);
      }

      if (forceRefresh) {
        showToast('Sinh lại danh sách từ khóa AI thành công!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      const statusCode = err.response?.status;
      const responseData = err.response?.data;
      const code = responseData?.code || responseData?.message;
      const msg = responseData?.message || err.message;

      if (statusCode === 401) {
        showToast('Phiên làm việc hết hạn. Vui lòng đăng nhập lại.', 'danger');
        window.location.href = '/login';
      } else if (statusCode === 400) {
        setValidationError(msg || 'Tham số không hợp lệ.');
        showToast('Lỗi tham số: ' + (msg || 'vui lòng kiểm tra lại đầu vào'), 'danger');
      } else if (code === 'AI_GENERATE_FAILED') {
        showToast('AI sinh từ khoá thất bại, thử lại.', 'danger');
      } else if (code === 'GOOGLE_ADS_QUOTA_EXCEEDED') {
        showToast('Hết quota Google Ads, thử lại sau.', 'danger');
      } else if (['GEMINI_NOT_CONFIGURED', 'GOOGLE_ADS_NOT_CONFIGURED', 'GOOGLE_ADS_AUTH_ERROR'].includes(code)) {
        showToast('Lỗi cấu hình Google Ads, liên hệ admin.', 'danger');
      } else if (code === 'GOOGLE_ADS_ERROR') {
        showToast(msg || 'Lỗi Google Ads khác', 'danger');
      } else {
        showToast(msg || 'Có lỗi xảy ra khi kết nối máy chủ.', 'danger');
      }
    } finally {
      setExpansionLoading(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['Chủ đề cha', 'Từ khóa con', 'Intent', 'Volume trung bình', 'Độ cạnh tranh', 'Chỉ số cạnh tranh', 'Giá thầu thấp', 'Giá thầu cao'];
    const rows: string[][] = [];
    processedTopics.forEach(topicGroup => {
      topicGroup.keywords.forEach(row => {
        rows.push([
          topicGroup.topic,
          row.keyword,
          row.intent || '—',
          String(row.avgMonthlySearches),
          row.competition,
          String(row.competitionIndex),
          row.bidLow !== null && row.bidLow !== undefined ? String(row.bidLow) : '',
          row.bidHigh !== null && row.bidHigh !== undefined ? String(row.bidHigh) : ''
        ]);
      });
    });
    downloadCSV(headers, rows, 'AI-Keyword-Topic-Expansion');
    showToast('Tải CSV thành công', 'success');
  };

  const handleAddAllToCart = () => {
    const allChildKeywords: ChildKeyword[] = [];
    processedTopics.forEach(topicGroup => {
      allChildKeywords.push(...topicGroup.keywords);
    });

    const toAdd = allChildKeywords.filter(row => !cartItems.some(k => k.name === row.keyword));
    if (toAdd.length === 0) {
      setCartItems(prev => prev.filter(k => !allChildKeywords.some(row => row.keyword === k.name)));
      showToast('Đã bỏ chọn tất cả từ khóa trang này khỏi giỏ hàng!', 'info');
    } else {
      const newItems = toAdd.map(row => ({
        name: row.keyword,
        currentScore: 0,
        avg: row.avgMonthlySearches,
        slope: 0,
        isSpike: false,
        trendTimeline: row.monthlySearchVolumes?.map((v: any) => ({ date: `Tháng ${v.month}/${v.year}`, value: v.volume })) || [],
        relatedQueries: [],
        relatedTopics: []
      }));
      setCartItems(prev => [...prev, ...newItems]);
      showToast(`Đã thêm ${toAdd.length} từ khóa vào giỏ hàng!`, 'success');
    }
  };

  const isTopicAllSelected = (topicGroup: TopicGroup) => {
    if (!topicGroup.keywords || topicGroup.keywords.length === 0) return false;
    return topicGroup.keywords.every(k => cartItems.some(c => c.name === k.keyword));
  };

  const handleToggleTopicGroup = (topicGroup: TopicGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    const allSelected = isTopicAllSelected(topicGroup);
    if (allSelected) {
      setCartItems(prev => prev.filter(c => !topicGroup.keywords.some(k => k.keyword === c.name)));
      showToast(`Đã bỏ chọn cụm từ khóa: ${topicGroup.topic}`, 'info');
    } else {
      const toAdd = topicGroup.keywords.filter(k => !cartItems.some(c => c.name === k.keyword));
      const newItems = toAdd.map(row => ({
        name: row.keyword,
        currentScore: 0,
        avg: row.avgMonthlySearches,
        slope: 0,
        isSpike: false,
        trendTimeline: row.monthlySearchVolumes?.map((v: any) => ({ date: `Tháng ${v.month}/${v.year}`, value: v.volume })) || [],
        relatedQueries: [],
        relatedTopics: []
      }));
      setCartItems(prev => [...prev, ...newItems]);
      showToast(`Đã thêm cụm từ khóa: ${topicGroup.topic}`, 'success');
    }
  };

  const handleCopySelected = () => {
    const currentSessionKeywords = processedTopics.flatMap(t => t.keywords.map(k => k.keyword));
    const selectedInSession = cartItems.filter(c => currentSessionKeywords.includes(c.name)).map(c => c.name);
    
    if (selectedInSession.length === 0) {
      showToast('Vui lòng chọn từ khóa để sao chép!', 'warning');
      return;
    }
    
    navigator.clipboard.writeText(selectedInSession.join('\n'));
    showToast(`Đã sao chép ${selectedInSession.length} từ khóa vào clipboard!`, 'success');
  };

  const formatCurrency = (val: number | null) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatBidRange = (low: number | null, high: number | null) => {
    if ((low === null || low === undefined) && (high === null || high === undefined)) {
      return '—';
    }
    const lowStr = low !== null && low !== undefined ? formatCurrency(low) : '—';
    const highStr = high !== null && high !== undefined ? formatCurrency(high) : '—';
    return `${lowStr} – ${highStr}`;
  };

  const maxSearchVolume = useMemo(() => {
    let maxVal = 1;
    processedTopics.forEach(t => {
      t.keywords?.forEach(k => {
        if (k.avgMonthlySearches > maxVal) {
          maxVal = k.avgMonthlySearches;
        }
      });
    });
    return maxVal;
  }, [processedTopics]);

  // Debounced/automatic search when local filters change (caching ensures this is cheap)
  useEffect(() => {
    if (hasSearchedKeywords) {
      const timer = setTimeout(() => {
        handleExpandKeywords(1, false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [minVolume, maxVolume, competitionFilters, sortOrder, locationCode, languageCode, includeZeroVolume]);


  // ================= Left Panel Data Fetching =================
  const fetchKeywords = async (targetDays: number, targetLinhVuc?: string, targetAgency?: string) => {
    setLoading(true);
    try {
      const res = await vbplSuggestionsService.getSuggestions({
        days: targetDays,
        linhVuc: targetLinhVuc || undefined,
        agency: targetAgency || undefined
      });

      // Adaptive parser supporting both flat list and old grouped shapes
      let flatKeywords: string[] = [];
      if (res.keywords && Array.isArray(res.keywords)) {
        flatKeywords = res.keywords;
      } else {
        const seen = new Set<string>();
        const addKeyword = (kw: string) => {
          if (!kw) return;
          const trimmed = kw.trim();
          if (trimmed && !seen.has(trimmed.toLowerCase())) {
            seen.add(trimmed.toLowerCase());
            flatKeywords.push(trimmed);
          }
        };

        if (res.clusters && Array.isArray(res.clusters)) {
          res.clusters.forEach(cluster => {
            if (cluster.articles && Array.isArray(cluster.articles)) {
              cluster.articles.forEach(article => {
                if (article.keywords && Array.isArray(article.keywords)) {
                  article.keywords.forEach(kwSet => {
                    if (kwSet.base) addKeyword(kwSet.base);
                    if (kwSet.variations && Array.isArray(kwSet.variations)) {
                      kwSet.variations.forEach(v => addKeyword(v));
                    }
                  });
                }
              });
            }
          });
        }

        if (res.uncategorized && Array.isArray(res.uncategorized)) {
          res.uncategorized.forEach(article => {
            if (article.keywords && Array.isArray(article.keywords)) {
              article.keywords.forEach(kwSet => {
                if (kwSet.base) addKeyword(kwSet.base);
                if (kwSet.variations && Array.isArray(kwSet.variations)) {
                  kwSet.variations.forEach(v => addKeyword(v));
                }
              });
            }
          });
        }
      }

      setData({
        fromDate: res.fromDate,
        toDate: res.toDate,
        totalArticles: res.totalArticles,
        keywords: flatKeywords
      });
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Lỗi tải gợi ý keyword VBPL';
      showToast(errMsg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ================= Right Panel Data Fetching =================
  const fetchTrending = async (hours: number, categories: string[]) => {
    if (categories.length === 0) {
      setTrendingData({
        geo: 'VN',
        hours,
        fetchedDate: '',
        fetchedAt: '',
        categoryIds: [],
        total: 0,
        keywords: []
      });
      setTrendingLoading(false);
      return;
    }

    setTrendingLoading(true);
    try {
      const res = await vbplSuggestionsService.getTrendingKeywords({
        geo: 'VN',
        hours,
        categoryIds: categories.join(',')
      });
      setTrendingData(res);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Lỗi tải xu hướng tìm kiếm Google Trends';
      showToast(errMsg, 'danger');
    } finally {
      setTrendingLoading(false);
    }
  };

  // ================= AI Suggestions Dates & History Fetching =================
  const fetchByDate = async (dateStr: string) => {
    setPtDetailLoading(true);
    try {
      const res = await vbplSuggestionsService.getPublicTrendByDate(dateStr);
      updatePublicTrendSharedState({
        result: res,
        loading: false,
        currentStep: 'idle'
      });
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || `Lỗi tải dữ liệu cho ngày ${dateStr}`;
      showToast(errMsg, 'danger');
    } finally {
      setPtDetailLoading(false);
    }
  };

  const fetchDates = async (autoLoadToday = false) => {
    setPtDatesLoading(true);
    try {
      const datesRes = await vbplSuggestionsService.getPublicTrendDates();
      setPtDatesData(datesRes);

      if (autoLoadToday) {
        if (datesRes.hasToday && datesRes.today) {
          setSelectedDate(datesRes.today);
          await fetchByDate(datesRes.today);
        } else {
          setSelectedDate('');
          updatePublicTrendSharedState({ result: null });
        }
      } else {
        if (datesRes.today) {
          setSelectedDate(datesRes.today);
        }
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Lỗi tải danh sách ngày lịch sử';
      showToast(errMsg, 'danger');
    } finally {
      setPtDatesLoading(false);
    }
  };

  // Fetch all lists initially on mount
  useEffect(() => {
    fetchDates(true);
    fetchCustomSnapshots(1);
    fetchSnapshotsList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================= Left Panel Actions =================
  const handleApplyFilter = () => {
    if (days < 1 || days > 90) {
      showToast('Số ngày phải nằm trong khoảng từ 1 đến 90', 'warning');
      return;
    }
    fetchKeywords(days, linhVuc, agency);
  };

  const handleExpandDays = () => {
    setDays(30);
    fetchKeywords(30, linhVuc, agency);
  };

  const handleCopySingle = (kw: string) => {
    navigator.clipboard.writeText(kw);
    showToast(`Đã copy: ${kw}`, 'success');
  };

  const filteredKeywords = useMemo(() => {
    if (!data?.keywords) return [];
    if (!searchQuery.trim()) return data.keywords;
    
    const query = searchQuery.toLowerCase().trim();
    return data.keywords.filter(kw => kw.toLowerCase().includes(query));
  }, [data, searchQuery]);

  const handleCopyAll = () => {
    if (filteredKeywords.length === 0) {
      showToast('Không có từ khoá nào để copy', 'warning');
      return;
    }
    const allText = filteredKeywords.join('\n');
    navigator.clipboard.writeText(allText);
    showToast(`Đã copy toàn bộ ${filteredKeywords.length} từ khoá`, 'success');
  };

  // ================= Right Panel Actions =================
  const handleHoursChange = (h: number) => {
    setTrendingHours(h);
    fetchTrending(h, trendingCategories);
  };

  const handleCategoriesChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const cats = typeof value === 'string' ? value.split(',') : value;
    setTrendingCategories(cats);
    fetchTrending(trendingHours, cats);
  };

  const filteredTrendingKeywords = useMemo(() => {
    if (!trendingData?.keywords) return [];
    if (!trendingSearchQuery.trim()) return trendingData.keywords;
    
    const query = trendingSearchQuery.toLowerCase().trim();
    return trendingData.keywords.filter(kw => kw.toLowerCase().includes(query));
  }, [trendingData, trendingSearchQuery]);

  const handleCopyAllTrending = () => {
    if (filteredTrendingKeywords.length === 0) {
      showToast('Không có từ khoá trending nào để copy', 'warning');
      return;
    }
    const allText = filteredTrendingKeywords.join('\n');
    navigator.clipboard.writeText(allText);
    showToast(`Đã copy toàn bộ ${filteredTrendingKeywords.length} xu hướng tìm kiếm`, 'success');
  };

  // ================= AI Suggestions Actions =================
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

  const handleExportCustomTrendsExcel = () => {
    if (!ctSnapshotDetail?.suggestions || ctSnapshotDetail.suggestions.length === 0) {
      showToast('Không có dữ liệu đề xuất để tải xuống!', 'warning');
      return;
    }

    const query = customSearchQuery.toLowerCase().trim();
    const filtered = ctSnapshotDetail.suggestions.filter(s => 
      !query ||
      s.name.toLowerCase().includes(query) || 
      s.sourceKeyword.toLowerCase().includes(query) ||
      s.reason.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      showToast('Không có dữ liệu đề xuất khớp để tải xuống!', 'warning');
      return;
    }

    const headers = [
      'STT',
      'Tiêu đề chủ đề SEO đề xuất',
      'Từ khóa hạt giống đầu vào',
      'Lý do gợi ý của AI',
      'Điểm Trends hiện tại',
      'Điểm trung bình',
      'Tốc độ tăng trưởng',
      'Đột biến'
    ];

    const rows = filtered.map((item, idx) => [
      String(idx + 1),
      item.name,
      item.sourceKeyword,
      item.reason,
      item.scrape?.success && item.scrape?.currentScore !== undefined ? String(item.scrape.currentScore) : '-',
      item.scrape?.success && item.scrape?.avg !== undefined ? String(item.scrape.avg) : '-',
      item.scrape?.success && item.scrape?.slope !== undefined ? `${Math.round(item.scrape.slope * 100)}%` : '-',
      item.scrape?.success ? (item.scrape.isSpike ? 'Có đột biến' : 'Bình thường') : '-'
    ]);

    const filename = `AI_Goi_Y_Tu_Chon_${ctSnapshotDetail.name.replace(/\s+/g, '_')}`;
    downloadCSV(headers, rows, filename);
  };

  // Helper date formatter
  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isValid(d) ? format(d, 'dd/MM/yyyy') : '-';
  };

  // Custom premium loading skeletons for vertical rows
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
              borderRadius: 2, 
              border: '1px solid', 
              borderColor: 'divider' 
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <Skeleton variant="rectangular" width={24} height={20} sx={{ borderRadius: 0.5 }} />
              <Skeleton variant="rectangular" width="60%" height={18} sx={{ borderRadius: 1 }} />
            </Box>
            <Skeleton variant="rectangular" width={16} height={16} sx={{ borderRadius: 0.5 }} />
          </Box>
        ))}
      </Box>
    );
  };

  // Premium, Interactive, Theme-aware Vertical Keyword List Row
  const KeywordRow = ({ keyword, index, type }: { keyword: string; index: number; type: 'vbpl' | 'trends' }) => {
    const isVbpl = type === 'vbpl';
    const displayIndex = String(index).padStart(2, '0');
    
    return (
      <Box
        onClick={() => handleCopySingle(keyword)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          '&:hover': {
            transform: 'translateX(3px)',
            borderColor: (theme) => isVbpl 
              ? (theme.palette.mode === 'dark' ? 'rgba(0, 184, 148, 0.5)' : 'rgba(0, 184, 148, 0.3)')
              : (theme.palette.mode === 'dark' ? 'rgba(236, 72, 153, 0.5)' : 'rgba(236, 72, 153, 0.3)'),
            bgcolor: (theme) => isVbpl
              ? (theme.palette.mode === 'dark' ? 'rgba(0, 184, 148, 0.08)' : 'rgba(0, 184, 148, 0.03)')
              : (theme.palette.mode === 'dark' ? 'rgba(236, 72, 153, 0.08)' : 'rgba(236, 72, 153, 0.03)'),
          },
          '&:active': {
            transform: 'translateX(0)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1, mr: 2 }}>
          {/* Monospace index badge */}
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 800, 
              color: (theme) => isVbpl
                ? (theme.palette.mode === 'dark' ? '#55efc4' : '#009975')
                : (theme.palette.mode === 'dark' ? '#fbcfe8' : '#db2777'),
              bgcolor: (theme) => isVbpl
                ? (theme.palette.mode === 'dark' ? 'rgba(0, 184, 148, 0.15)' : 'rgba(0, 184, 148, 0.06)')
                : (theme.palette.mode === 'dark' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.06)'),
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontSize: '0.72rem',
              fontFamily: 'monospace'
            }}
          >
            {displayIndex}
          </Typography>

          {/* Keyword text with ellipsis */}
          <Typography 
            variant="body2" 
            noWrap
            sx={{ 
              fontWeight: 700, 
              color: 'text.primary',
              fontSize: '0.88rem'
            }}
          >
            {keyword}
          </Typography>
        </Box>

        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleCart(keyword);
          }}
          sx={{
            p: 0.5,
            color: cartItems.some(k => k.name === keyword) ? '#10b981' : 'text.secondary',
            opacity: cartItems.some(k => k.name === keyword) ? 1 : 0.4,
            transition: 'all 0.2s',
            '&:hover': {
              opacity: 1,
              color: cartItems.some(k => k.name === keyword) ? '#059669' : '#f59e0b',
              transform: 'scale(1.1)'
            }
          }}
        >
          {cartItems.some(k => k.name === keyword) ? <CheckIcon sx={{ fontSize: 16 }} /> : <AddIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Box>
    );
  };

  // Premium, Interactive, Theme-aware AI Suggestion Row
  const AISuggestionRow = ({ 
    item, 
    index 
  }: { 
    item: PublicTrendSuggestionItem; 
    index: number; 
  }) => {
    const displayIndex = String(index).padStart(2, '0');
    const isExpanded = expandedIndex === index;
    
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          boxSizing: 'border-box',
          px: 2.5,
          py: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: isExpanded
            ? (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(245, 158, 11, 0.4)'
            : 'divider',
          bgcolor: (theme) => {
            if (isExpanded) {
              return theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.03)' : 'rgba(245, 158, 11, 0.01)';
            }
            return theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.008)';
          },
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          gap: isExpanded ? 0 : 2,
          '&:hover': {
            transform: isExpanded ? 'none' : 'translateY(-2px)',
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(245, 158, 11, 0.3)',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.04)' : 'rgba(245, 158, 11, 0.015)',
            boxShadow: '0 4px 20px -4px rgba(0,0,0,0.12)'
          }
        }}
        onClick={() => {
          setExpandedIndex(isExpanded ? null : index);
        }}
      >
        {/* Top Header Row (Main row content) */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            width: '100%'
          }}
        >
          {/* Left Block: Basic Details */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, minWidth: 0, flex: 1 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 800, 
                color: '#f59e0b',
                bgcolor: 'rgba(245, 158, 11, 0.12)',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                mt: 0.25
              }}
            >
              {displayIndex}
            </Typography>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.75 }}>
                <a
                  href={`https://trends.google.com/trends/explore?date=today%203-m&geo=VN&q=${encodeURIComponent(item.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 800, 
                      color: 'text.primary',
                      fontSize: '0.95rem',
                      '&:hover': {
                        color: '#f59e0b',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {item.name}
                  </Typography>
                </a>

                <Tooltip title="Phân tích volume trong Keyword Research Tool" arrow>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(new CustomEvent('search-keyword-planner', { detail: { keyword: item.name } }));
                    }}
                    sx={{
                      p: 0.5,
                      color: 'primary.main',
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.05)',
                      borderRadius: 1.5,
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s',
                      ml: 0.5
                    }}
                  >
                    <SearchIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Tooltip>
                
                <a
                  href={`https://trends.google.com/trends/explore?date=today%203-m&geo=VN&q=${encodeURIComponent(item.hotKeyword)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex' }}
                >
                  <Box 
                    sx={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      px: 1.2,
                      py: 0.25,
                      borderRadius: 5,
                      border: '1px solid',
                      borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)',
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.03)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: '#a78bfa',
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.08)'
                      }
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#a78bfa', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Trend: {item.hotKeyword} ↗
                    </Typography>
                  </Box>
                </a>
              </Box>

              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.82rem',
                  lineHeight: 1.5
                }}
              >
                {item.reason}
              </Typography>
            </Box>
          </Box>

          {/* Right Block: Stats Summaries */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3.5, ml: { xs: 5, md: 0 }, flexWrap: 'wrap' }}>
            {item.position !== null && item.position !== undefined && (
              <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: 50 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>
                  Hạng Trend
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: 'monospace' }}>
                  #{item.position}
                </Typography>
              </Box>
            )}

            {item.searchVolume !== null && item.searchVolume !== undefined && item.searchVolume > 0 && (
              <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: 60 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>
                  Volume
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981', fontFamily: 'monospace' }}>
                  {item.searchVolume.toLocaleString()}
                </Typography>
              </Box>
            )}

            {item.increasePercentage !== null && item.increasePercentage !== undefined && item.increasePercentage > 0 && (
              <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: 70 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>
                  Tăng trưởng
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#ef4444', fontFamily: 'monospace' }}>
                  +{item.increasePercentage.toLocaleString()}%
                </Typography>
              </Box>
            )}

            {item.scrape && (
              <>
                {item.scrape.success ? (
                  <>
                    <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: 50 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>
                        Điểm Trends
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#f59e0b', fontFamily: 'monospace' }}>
                        {item.scrape.currentScore ?? 0}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: 50 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>
                        Trung bình
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontFamily: 'monospace' }}>
                        {item.scrape.avg ?? 0}
                      </Typography>
                    </Box>
                    {item.scrape.isSpike && (
                      <Box 
                        sx={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          bgcolor: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          px: 1,
                          py: 0.25,
                          borderRadius: 1
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#ef4444', fontSize: '0.68rem' }}>
                          🔥 ĐỘT BIẾN
                        </Typography>
                      </Box>
                    )}
                  </>
                ) : (
                  <Tooltip title={item.scrape.failReasons?.join(', ') || 'Lỗi cào dữ liệu Google Trends'}>
                    <Box sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', px: 1, py: 0.5, borderRadius: 1.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#ef4444', fontSize: '0.68rem' }}>
                        ⚠️ Lỗi quét
                      </Typography>
                    </Box>
                  </Tooltip>
                )}
              </>
            )}

            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleCart(item);
              }}
              sx={{ 
                color: cartItems.some(k => k.name === item.name) ? '#10b981' : 'text.secondary',
                opacity: cartItems.some(k => k.name === item.name) ? 1 : 0.5,
                '&:hover': {
                  opacity: 1,
                  color: cartItems.some(k => k.name === item.name) ? '#059669' : '#10b981',
                  bgcolor: 'action.hover'
                }
              }} 
            >
              {cartItems.some(k => k.name === item.name) ? <CheckIcon sx={{ fontSize: 16 }} /> : <AddIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Box>
        </Box>

        {/* BOTTOM EXPANDED CHART AREA (ONLY WHEN IS_EXPANDED) */}
        {isExpanded && (
          <Box onClick={(e) => e.stopPropagation()} sx={{ width: '100%', alignSelf: 'stretch', cursor: 'default', mt: 1 }}>
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' }, 
              gap: 3.5, 
              width: '100%', 
              boxSizing: 'border-box',
              mt: 2
            }}>
              {/* Left Column: Recharts Chart (68%) */}
              <Box sx={{ width: { xs: '100%', md: '68%' }, minWidth: 0, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, mb: 1.5, display: 'block', color: 'text.secondary' }}>
                  BIỂU ĐỒ XU HƯỚNG TÌM KIẾM CHI TIẾT (GOOGLE TRENDS):
                </Typography>
 
                {item.scrape ? (
                  item.scrape.success && item.scrape.trendTimeline && item.scrape.trendTimeline.length > 0 ? (
                    <Box sx={{ width: '100%', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.01)', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', position: 'relative', boxSizing: 'border-box' }}>
                      <TrendLineChart 
                        data={item.scrape.trendTimeline} 
                        currentScore={item.scrape.currentScore ?? undefined}
                        height={200}
                        showAxes={true}
                        color={item.scrape.slope !== undefined && item.scrape.slope >= 0 ? '#10b981' : '#ef4444'}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2, width: '100%', boxSizing: 'border-box' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Không có dữ liệu dòng thời gian xu hướng (Timeline).
                      </Typography>
                    </Box>
                  )
                ) : (
                  <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2, width: '100%', boxSizing: 'border-box' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Chủ đề chưa được quét chỉ số Google Trends.
                    </Typography>
                  </Box>
                )}
              </Box>
 
              {/* Right Column: Key Stats & Timeline Panel (32%) */}
              <Box sx={{ width: { xs: '100%', md: '32%' }, minWidth: 0, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, mb: 1.5, display: 'block', color: 'text.secondary' }}>
                  CHỈ SỐ PHÂN TÍCH XU HƯỚNG:
                </Typography>
                
                {item.scrape ? (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 1.8,
                    p: 2.5,
                    borderRadius: 2.5,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    border: '1px solid',
                    borderColor: 'divider',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {/* Current Score */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Điểm Trends hiện tại:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: item.scrape.success ? '#f59e0b' : '#ef4444' }}>
                        {item.scrape.success ? `${item.scrape.currentScore}/100` : 'Lỗi quét'}
                      </Typography>
                    </Box>
 
                    {/* Avg Score */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Điểm trung bình:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: 'monospace' }}>
                        {item.scrape.success && item.scrape.avg !== undefined ? `${item.scrape.avg.toFixed(1)}/100` : '—'}
                      </Typography>
                    </Box>
 
                    {/* Slope Growth Trend */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Tốc độ tăng trưởng:</Typography>
                      {item.scrape.success && item.scrape.slope !== undefined ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 800, 
                              color: item.scrape.slope > 0.02 ? '#10b981' : (item.scrape.slope < -0.02 ? '#ef4444' : 'text.secondary'),
                              fontFamily: 'monospace' 
                            }}
                          >
                            {item.scrape.slope > 0.02 ? '↑' : (item.scrape.slope < -0.02 ? '↓' : '→')} {Math.round(item.scrape.slope * 100)}%
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </Box>
 
                    {/* Spike Status */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Đột biến:</Typography>
                      {item.scrape.success ? (
                        item.scrape.isSpike ? (
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#ef4444' }}>
                            🔥 Có đột biến
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                            Bình thường
                          </Typography>
                        )
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </Box>
 
                    {/* Timeline Range Info */}
                    {item.scrape.success && item.scrape.trendTimeline && item.scrape.trendTimeline.length > 0 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">Khoảng thời gian ghi nhận:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {item.scrape.trendTimeline[0]?.date} → {item.scrape.trendTimeline[item.scrape.trendTimeline.length - 1]?.date}
                        </Typography>
                      </Box>
                    )}
 
                    {/* Fail reasons if any */}
                    {!item.scrape.success && item.scrape.failReasons && item.scrape.failReasons.length > 0 && (
                      <Box sx={{ p: 1.5, bgcolor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#ef4444', display: 'block', mb: 0.5 }}>
                          CHI TIẾT LỖI CÀO DỮ LIỆU:
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.4 }}>
                          {item.scrape.failReasons.join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: '1px solid', borderColor: 'divider', borderRadius: 2.5, width: '100%', boxSizing: 'border-box' }}>
                    <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                      Chưa có dữ liệu cào
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  // Custom suggestion item row
  const CustomSuggestionRow = ({ 
    item, 
    index 
  }: { 
    item: CustomTrendSuggestionItem; 
    index: number; 
  }) => {
    const displayIndex = String(index).padStart(2, '0');
    const isExpanded = customExpandedIndex === index;
    
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          boxSizing: 'border-box',
          px: 2.5,
          py: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: isExpanded
            ? (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(245, 158, 11, 0.4)'
            : 'divider',
          bgcolor: (theme) => {
            if (isExpanded) {
              return theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.03)' : 'rgba(245, 158, 11, 0.01)';
            }
            return theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.008)';
          },
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          gap: isExpanded ? 0 : 2,
          '&:hover': {
            transform: isExpanded ? 'none' : 'translateY(-2px)',
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(245, 158, 11, 0.3)',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.04)' : 'rgba(245, 158, 11, 0.015)',
            boxShadow: '0 4px 20px -4px rgba(0,0,0,0.12)'
          }
        }}
        onClick={() => {
          setCustomExpandedIndex(isExpanded ? null : index);
        }}
      >
        {/* Top Header Row */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            width: '100%'
          }}
        >
          {/* Left Block: Basic Details */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, minWidth: 0, flex: 1 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 800, 
                color: '#f59e0b',
                bgcolor: 'rgba(245, 158, 11, 0.12)',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                mt: 0.25
              }}
            >
              {displayIndex}
            </Typography>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.75 }}>
                <a
                  href={`https://trends.google.com/trends/explore?date=today%203-m&geo=VN&q=${encodeURIComponent(item.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 800, 
                      color: 'text.primary',
                      fontSize: '0.95rem',
                      '&:hover': {
                        color: '#f59e0b',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {item.name}
                  </Typography>
                </a>

                <Tooltip title="Phân tích volume trong Keyword Research Tool" arrow>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.dispatchEvent(new CustomEvent('search-keyword-planner', { detail: { keyword: item.name } }));
                    }}
                    sx={{
                      p: 0.5,
                      color: 'primary.main',
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.05)',
                      borderRadius: 1.5,
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s',
                      ml: 0.5
                    }}
                  >
                    <SearchIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Tooltip>
                
                <a
                  href={`https://trends.google.com/trends/explore?date=today%203-m&geo=VN&q=${encodeURIComponent(item.sourceKeyword)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex' }}
                >
                  <Box 
                    sx={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      px: 1.2,
                      py: 0.25,
                      borderRadius: 5,
                      border: '1px solid',
                      borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(14, 165, 233, 0.2)',
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(14, 165, 233, 0.03)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: '#38bdf8',
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(14, 165, 233, 0.08)'
                      }
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Từ khóa: {item.sourceKeyword} ↗
                    </Typography>
                  </Box>
                </a>
              </Box>

              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.82rem',
                  lineHeight: 1.5
                }}
              >
                {item.reason}
              </Typography>
            </Box>
          </Box>

          {/* Right Block: Stats Summaries */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3.5, ml: { xs: 5, md: 0 }, flexWrap: 'wrap' }}>
            {item.scrape && (
              <>
                {item.scrape.success ? (
                  <>
                    <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: 50 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>
                        Điểm Trends
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#f59e0b', fontFamily: 'monospace' }}>
                        {item.scrape.currentScore ?? 0}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: 50 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>
                        Trung bình
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontFamily: 'monospace' }}>
                        {item.scrape.avg ?? 0}
                      </Typography>
                    </Box>
                    {item.scrape.isSpike && (
                      <Box 
                        sx={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          bgcolor: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          px: 1,
                          py: 0.25,
                          borderRadius: 1
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#ef4444', fontSize: '0.68rem' }}>
                          🔥 ĐỘT BIẾN
                        </Typography>
                      </Box>
                    )}
                  </>
                ) : (
                  <Tooltip title={item.scrape.failReasons?.join(', ') || 'Lỗi cào dữ liệu Google Trends'}>
                    <Box sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', px: 1, py: 0.5, borderRadius: 1.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#ef4444', fontSize: '0.68rem' }}>
                        ⚠️ Lỗi quét
                      </Typography>
                    </Box>
                  </Tooltip>
                )}
              </>
            )}

            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleCart(item);
              }}
              sx={{ 
                color: cartItems.some(k => k.name === item.name) ? '#10b981' : 'text.secondary',
                opacity: cartItems.some(k => k.name === item.name) ? 1 : 0.5,
                '&:hover': {
                  opacity: 1,
                  color: cartItems.some(k => k.name === item.name) ? '#059669' : '#10b981',
                  bgcolor: 'action.hover'
                }
              }} 
            >
              {cartItems.some(k => k.name === item.name) ? <CheckIcon sx={{ fontSize: 16 }} /> : <AddIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Box>
        </Box>

        {/* BOTTOM EXPANDED CHART AREA (ONLY WHEN IS_EXPANDED) */}
        {isExpanded && (
          <Box onClick={(e) => e.stopPropagation()} sx={{ width: '100%', alignSelf: 'stretch', cursor: 'default', mt: 1 }}>
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' }, 
              gap: 3.5, 
              width: '100%', 
              boxSizing: 'border-box',
              mt: 2
            }}>
              {/* Left Column: Recharts Chart (68%) */}
              <Box sx={{ width: { xs: '100%', md: '68%' }, minWidth: 0, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, mb: 1.5, display: 'block', color: 'text.secondary' }}>
                  BIỂU ĐỒ XU HƯỚNG TÌM KIẾM CHI TIẾT (GOOGLE TRENDS):
                </Typography>
 
                {item.scrape ? (
                  item.scrape.success && item.scrape.trendTimeline && item.scrape.trendTimeline.length > 0 ? (
                    <Box sx={{ width: '100%', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.01)', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', position: 'relative', boxSizing: 'border-box' }}>
                      <TrendLineChart 
                        data={item.scrape.trendTimeline} 
                        currentScore={item.scrape.currentScore ?? undefined}
                        height={200}
                        showAxes={true}
                        color={item.scrape.slope !== undefined && item.scrape.slope >= 0 ? '#10b981' : '#ef4444'}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2, width: '100%', boxSizing: 'border-box' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Không có dữ liệu dòng thời gian xu hướng (Timeline).
                      </Typography>
                    </Box>
                  )
                ) : (
                  <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2, width: '100%', boxSizing: 'border-box' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Chủ đề chưa được quét chỉ số Google Trends.
                    </Typography>
                  </Box>
                )}
              </Box>
 
              {/* Right Column: Key Stats & Timeline Panel (32%) */}
              <Box sx={{ width: { xs: '100%', md: '32%' }, minWidth: 0, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, mb: 1.5, display: 'block', color: 'text.secondary' }}>
                  CHỈ SỐ PHÂN TÍCH XU HƯỚNG:
                </Typography>
                
                {item.scrape ? (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 1.8,
                    p: 2.5,
                    borderRadius: 2.5,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    border: '1px solid',
                    borderColor: 'divider',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {/* Current Score */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Điểm Trends hiện tại:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: item.scrape.success ? '#f59e0b' : '#ef4444' }}>
                        {item.scrape.success ? `${item.scrape.currentScore}/100` : 'Lỗi quét'}
                      </Typography>
                    </Box>
 
                    {/* Avg Score */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Điểm trung bình:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: 'monospace' }}>
                        {item.scrape.success && item.scrape.avg !== undefined ? `${item.scrape.avg.toFixed(1)}/100` : '—'}
                      </Typography>
                    </Box>
 
                    {/* Slope Growth Trend */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Tốc độ tăng trưởng:</Typography>
                      {item.scrape.success && item.scrape.slope !== undefined ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 800, 
                              color: item.scrape.slope > 0.02 ? '#10b981' : (item.scrape.slope < -0.02 ? '#ef4444' : 'text.secondary'),
                              fontFamily: 'monospace' 
                            }}
                          >
                            {item.scrape.slope > 0.02 ? '↑' : (item.scrape.slope < -0.02 ? '↓' : '→')} {Math.round(item.scrape.slope * 100)}%
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </Box>
 
                    {/* Spike Status */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Đột biến:</Typography>
                      {item.scrape.success ? (
                        item.scrape.isSpike ? (
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#ef4444' }}>
                            🔥 Có đột biến
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                            Bình thường
                          </Typography>
                        )
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </Box>
 
                    {/* Timeline Range Info */}
                    {item.scrape.success && item.scrape.trendTimeline && item.scrape.trendTimeline.length > 0 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">Khoảng thời gian ghi nhận:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {item.scrape.trendTimeline[0]?.date} → {item.scrape.trendTimeline[item.scrape.trendTimeline.length - 1]?.date}
                        </Typography>
                      </Box>
                    )}
 
                    {/* Fail reasons if any */}
                    {!item.scrape.success && item.scrape.failReasons && item.scrape.failReasons.length > 0 && (
                      <Box sx={{ p: 1.5, bgcolor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#ef4444', display: 'block', mb: 0.5 }}>
                          CHI TIẾT LỖI CÀO DỮ LIỆU:
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.4 }}>
                          {item.scrape.failReasons.join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: '1px solid', borderColor: 'divider', borderRadius: 2.5, width: '100%', boxSizing: 'border-box' }}>
                    <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                      Chưa có dữ liệu cào
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Title */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: '#f59e0b' }} /> Gợi ý từ khóa
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Duyệt danh sách từ khoá và chủ đề gợi ý bởi AI giúp tối ưu hoá nội dung SEO
        </Typography>
      </Box>


      {/* Unified Suggestions Panel with Tabs */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 4, 
          border: '1px solid', 
          borderColor: 'divider', 
          bgcolor: 'background.paper',
          minHeight: 580,
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
      >
        {/* Sleek Modern Tabs Header */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, val) => setActiveTab(val)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.98rem',
                minHeight: 48,
                px: 3,
                gap: 1
              }
            }}
          >
            <Tab 
              icon={<AutoAwesomeIcon sx={{ fontSize: 18 }} />} 
              iconPosition="start" 
              label="AI Gợi ý Chủ đề SEO" 
              id="suggestions-tab-0"
            />
            <Tab 
              icon={
                ctState.loading ? (
                  <CircularProgress size={16} sx={{ color: '#f59e0b' }} />
                ) : (
                  <PsychologyIcon sx={{ fontSize: 18 }} />
                )
              } 
              iconPosition="start" 
              label="Gợi ý từ khóa (GG Trends)" 
              id="suggestions-tab-1"
            />
            <Tab 
              icon={
                expansionLoading ? (
                  <CircularProgress size={16} sx={{ color: '#10b981' }} />
                ) : (
                  <AutoAwesomeIcon sx={{ fontSize: 18 }} />
                )
              } 
              iconPosition="start" 
              label="AI Gợi ý Từ khóa (Volume)" 
              id="suggestions-tab-2"
            />
          </Tabs>
        </Box>

        {/* TAB CONTENTS */}
        {activeTab === 1 ? (
          /* ================= AI Gợi ý Tự Chọn (Custom suggestions) ================= */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, width: '100%', boxSizing: 'border-box' }}>
            
            {customViewMode === 'list' ? (
              /* ================= MODE: LIST VIEW (GROUP VIEW TREE) ================= */
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                
                {/* Background Running Banner */}
                {ctState.loading && !progressModalOpen && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3.5,
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      background: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 2,
                      mb: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CircularProgress size={20} sx={{ color: '#f59e0b' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          ⚡ Đang phân tích AI chạy ẩn ở nền...
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tiến độ: {ctState.currentProgressIndex} / {ctState.totalProgressItems} cào ({Math.round((ctState.currentProgressIndex / ctState.totalProgressItems) * 100)}%)
                          {ctState.currentProgressItem && ` · Đang cào: "${ctState.currentProgressItem}"`}
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      onClick={() => setProgressModalOpen(true)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 800,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)'
                      }}
                    >
                      Xem tiến trình
                    </Button>
                  </Paper>
                )}

                {/* Header intro & Create Button */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 850, display: 'flex', alignItems: 'center', gap: 1.2, color: 'text.primary' }}>
                      <PsychologyIcon sx={{ color: '#f59e0b', fontSize: 26 }} /> AI Gợi ý Chủ đề SEO Tự Chọn
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Phân tích thị trường bằng danh sách từ khóa của bạn. Hệ thống sẽ cào Google Trends thời gian thực và tự động mở rộng chủ đề SEO.
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    onClick={() => {
                      setInputName('');
                      setInputDescription('');
                      setTagsInput([]);
                      setTagsText('');
                      setInputCount(20);
                      setInputTimeRange('3-m');
                      setCreateModalOpen(true);
                    }}
                    startIcon={<AddIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      fontWeight: 800,
                      borderRadius: 3,
                      textTransform: 'none',
                      px: 3.5,
                      py: 1.2,
                      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.25)',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                        boxShadow: '0 6px 20px rgba(245, 158, 11, 0.35)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    Tạo dự án mới
                  </Button>
                </Box>

                {/* Filter and pagination header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)', p: 1.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                  <TextField
                    placeholder="Tìm nhanh dự án hoặc bản cào..."
                    value={customSearchQuery}
                    onChange={(e) => setCustomSearchQuery(e.target.value)}
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      maxWidth: 350,
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'background.paper'
                      }
                    }}
                  />

                  {/* Tiny pagination for custom snapshots */}
                  {ctTotal > 10 && (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        disabled={ctPage <= 1 || ctSnapshotsLoading}
                        onClick={() => fetchCustomSnapshots(ctPage - 1)}
                        sx={{ minWidth: 0, px: 2, py: 0.5, textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                      >
                        Trước
                      </Button>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, px: 1 }}>
                        Trang {ctPage} / {Math.ceil(ctTotal / 10)} ({ctTotal} snapshots)
                      </Typography>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        disabled={ctPage >= Math.ceil(ctTotal / 10) || ctSnapshotsLoading}
                        onClick={() => fetchCustomSnapshots(ctPage + 1)}
                        sx={{ minWidth: 0, px: 2, py: 0.5, textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                      >
                        Sau
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Main Hierarchical Tree View */}
                {ctSnapshotsLoading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} variant="rectangular" height={90} sx={{ borderRadius: 3 }} />
                    ))}
                  </Box>
                ) : projectGroups.length === 0 ? (
                  <Box sx={{ p: 7, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 4, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)' }}>
                    <PsychologyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
                    <Typography variant="body1" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                      Chưa có dự án gợi ý tự chọn nào
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
                      Hãy bắt đầu bằng cách click nút "Tạo dự án mới" để cào AI theo bộ từ khóa của riêng bạn!
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(() => {
                      const q = customSearchQuery.toLowerCase().trim();
                      const filteredGroups = projectGroups.filter(g => 
                        !q || 
                        g.baseName.toLowerCase().includes(q) || 
                        g.snapshots.some(s => s.name.toLowerCase().includes(q))
                      );

                      if (filteredGroups.length === 0) {
                        return (
                          <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Không tìm thấy dự án hoặc snapshot nào khớp với từ khóa tìm kiếm.
                            </Typography>
                          </Box>
                        );
                      }

                      return filteredGroups.map((group) => {
                        const isExpanded = expandedGroups[group.baseName] !== false;
                        
                        return (
                          <Paper
                            key={group.baseName}
                            elevation={0}
                            sx={{
                              borderRadius: 3.5,
                              border: '1px solid',
                              borderColor: isExpanded ? 'rgba(245, 158, 11, 0.25)' : 'divider',
                              overflow: 'hidden',
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.002)',
                              transition: 'all 0.2s ease-in-out',
                              boxShadow: isExpanded ? '0 4px 15px -4px rgba(0,0,0,0.05)' : 'none',
                              '&:hover': {
                                borderColor: 'rgba(245, 158, 11, 0.35)',
                                boxShadow: '0 6px 20px -6px rgba(0,0,0,0.08)'
                              }
                            }}
                          >
                            {/* Folder Header Row */}
                            <Box
                              onClick={() => {
                                setExpandedGroups(prev => ({
                                  ...prev,
                                  [group.baseName]: !isExpanded
                                }));
                              }}
                              sx={{
                                p: 2.2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                bgcolor: (theme) => {
                                  if (isExpanded) {
                                    return theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(245, 158, 11, 0.015)';
                                  }
                                  return theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.005)';
                                },
                                borderBottom: isExpanded ? '1px solid' : 'none',
                                borderColor: 'divider',
                                userSelect: 'none',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {isExpanded ? (
                                  <FolderOpenIcon sx={{ color: '#f59e0b', fontSize: 24 }} />
                                ) : (
                                  <FolderIcon sx={{ color: '#d97706', fontSize: 24 }} />
                                )}
                                <Box>
                                  <Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.96rem' }}>
                                    📁 {group.baseName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    Có {group.snapshots.length} bản cào (snapshots) đã lưu
                                  </Typography>
                                </Box>
                              </Box>

                              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                {/* Regen snapshot button */}
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  startIcon={<RefreshIcon sx={{ fontSize: 13 }} />}
                                  onClick={() => {
                                    const latest = group.snapshots[0];
                                    if (latest) {
                                      const latestId = latest.id || (latest as any)._id;
                                      setRegenSourceId(latestId);
                                      setRegenSourceName(group.baseName);
                                      setRegenSourceKeywords([]);
                                      setRegenCount(20);
                                      setRegenTimeRange('3-m');
                                      setRegenModalOpen(true);
                                      
                                      // Lazy load original keywords inside dialog
                                      vbplSuggestionsService.getCustomTrendSnapshot(latestId)
                                        .then(detail => {
                                          if (detail && detail.inputKeywords) {
                                            setRegenSourceKeywords(detail.inputKeywords);
                                          }
                                        })
                                        .catch(err => {
                                          console.error("Lỗi khi tải keywords gốc", err);
                                        });
                                    }
                                  }}
                                  sx={{
                                    borderRadius: 2.2,
                                    textTransform: 'none',
                                    fontWeight: 750,
                                    px: 2,
                                    py: 0.5,
                                    fontSize: '0.78rem',
                                    borderWidth: 1.5,
                                    '&:hover': {
                                      borderWidth: 1.5
                                    }
                                  }}
                                >
                                  Tạo thêm
                                </Button>
                                
                                <IconButton 
                                  size="small" 
                                  sx={{ 
                                    color: 'text.secondary',
                                    transition: 'transform 0.2s',
                                    transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)'
                                  }}
                                >
                                  <ExpandLessIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                              </Box>
                            </Box>

                            {/* Folder Snapshots Sub-tree */}
                            {isExpanded && (
                              <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.8, bgcolor: 'background.paper' }}>
                                {group.snapshots.map((snapshot) => {
                                  const isLoading = (snapshot as any).isLoadingPlaceholder;
                                  
                                  return (
                                    <Box
                                      key={snapshot.id}
                                      sx={{
                                        pl: 4.5,
                                        pr: 2,
                                        py: 1.2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: isLoading ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                                        bgcolor: isLoading 
                                          ? ((theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.04)' : 'rgba(245, 158, 11, 0.01)')
                                          : 'transparent',
                                        transition: 'all 0.15s ease',
                                        position: 'relative',
                                        animation: isLoading ? 'pulseBorder 2s infinite ease-in-out' : 'none',
                                        '@keyframes pulseBorder': {
                                          '0%, 100%': { borderColor: 'rgba(245, 158, 11, 0.15)' },
                                          '50%': { borderColor: 'rgba(245, 158, 11, 0.35)' }
                                        },
                                        '&:hover': {
                                          bgcolor: (theme) => theme.palette.mode === 'dark' 
                                            ? (isLoading ? 'rgba(245, 158, 11, 0.06)' : 'rgba(255,255,255,0.02)') 
                                            : (isLoading ? 'rgba(245, 158, 11, 0.02)' : 'rgba(0,0,0,0.01)'),
                                          borderColor: isLoading ? 'rgba(245, 158, 11, 0.35)' : 'divider'
                                        },
                                        // Custom Premium Tree Lines
                                        '&::before': {
                                          content: '""',
                                          position: 'absolute',
                                          left: 24,
                                          top: 0,
                                          bottom: 0,
                                          width: 1.5,
                                          bgcolor: 'divider'
                                        },
                                        '&::after': {
                                          content: '""',
                                          position: 'absolute',
                                          left: 24,
                                          top: '50%',
                                          width: 14,
                                          height: 1.5,
                                          bgcolor: 'divider'
                                        }
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8, minWidth: 0 }}>
                                        {isLoading ? (
                                          <CircularProgress size={14} thickness={5} sx={{ color: '#f59e0b', flexShrink: 0 }} />
                                        ) : (
                                          <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: 14 }} />
                                        )}
                                        <Box sx={{ minWidth: 0 }}>
                                          <Typography variant="body2" sx={{ fontWeight: 800, color: isLoading ? '#f59e0b' : 'text.primary', fontSize: '0.84rem' }}>
                                            {snapshot.name}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: '0.74rem' }}>
                                            {isLoading ? (
                                              <>
                                                Trạng thái: <strong>{(snapshot as any).stepMessage}</strong> · Gợi ý: {snapshot.suggestionsCount} từ khóa · Dòng Trends: {snapshot.timeRange === '3-m' ? '3 tháng' : '1 tháng'}
                                              </>
                                            ) : (
                                              <>
                                                Quét ngày: {formatDateStr(snapshot.fetchedAt)} · Gợi ý: {snapshot.suggestionsCount} từ khóa · Dòng Trends: {snapshot.timeRange === '3-m' ? '3 tháng' : '1 tháng'}
                                              </>
                                            )}
                                          </Typography>
                                        </Box>
                                      </Box>

                                      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                                        <Button
                                          size="small"
                                          variant="contained"
                                          onClick={() => {
                                            if (isLoading) {
                                              setProgressModalOpen(true);
                                            } else {
                                              const snapshotId = snapshot.id || (snapshot as any)._id;
                                              setSelectedSnapshotId(snapshotId);
                                              fetchCustomSnapshotDetail(snapshotId);
                                              setCustomViewMode('detail');
                                            }
                                          }}
                                          sx={{ 
                                            textTransform: 'none', 
                                            fontWeight: 800, 
                                            fontSize: '0.75rem',
                                            borderRadius: 1.8,
                                            px: 2,
                                            py: 0.4,
                                            boxShadow: 'none',
                                            background: isLoading 
                                              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                                              : 'action.selected',
                                            color: isLoading ? 'white' : 'text.primary',
                                            '&:hover': {
                                              background: isLoading 
                                                ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' 
                                                : 'action.focus',
                                              boxShadow: 'none'
                                            }
                                          }}
                                        >
                                          {isLoading ? 'Xem tiến trình' : 'Xem chi tiết'}
                                        </Button>
                                        {!isLoading && (
                                          <IconButton
                                            size="small"
                                            color="error"
                                            onClick={async () => {
                                              if (window.confirm(`Bạn có chắc chắn muốn xóa bản cào "${snapshot.name}" này?`)) {
                                                try {
                                                  const snapshotId = snapshot.id || (snapshot as any)._id;
                                                  await vbplSuggestionsService.deleteCustomTrendSnapshot(snapshotId);
                                                  showToast(`Đã xóa bản cào: ${snapshot.name}`, 'success');
                                                  
                                                  if (selectedSnapshotId === snapshotId) {
                                                    setSelectedSnapshotId('');
                                                    setCtSnapshotDetail(null);
                                                  }
                                                  fetchCustomSnapshots(ctPage);
                                                } catch (err: any) {
                                                  showToast(err.response?.data?.message || err.message || 'Lỗi khi xóa bản cào', 'danger');
                                                }
                                              }
                                            }}
                                            sx={{ 
                                              opacity: 0.5, 
                                              borderRadius: 2,
                                              '&:hover': { 
                                                opacity: 1, 
                                                bgcolor: 'error.lighter', 
                                                color: 'error.main' 
                                              } 
                                            }}
                                          >
                                            <DeleteIcon sx={{ fontSize: 16 }} />
                                          </IconButton>
                                        )}
                                      </Box>
                                    </Box>
                                  );
                                })}
                              </Box>
                            )}
                          </Paper>
                        );
                      });
                    })()}
                  </Box>
                )}
              </Box>
            ) : (
              /* ================= MODE: DETAIL VIEW (SNAPSHOT DETAILS) ================= */
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', boxSizing: 'border-box' }}>
                
                {/* Back Button */}
                <Box>
                  <Button
                    variant="text"
                    color="primary"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => {
                      setCustomViewMode('list');
                      fetchCustomSnapshots(ctPage);
                    }}
                    sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, px: 2, py: 0.8 }}
                  >
                    Quay lại danh sách dự án
                  </Button>
                </Box>

                {ctSnapshotLoading ? (
                  <SkeletonLoading />
                ) : !ctSnapshotDetail ? (
                  <Box sx={{ py: 8, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Không thể tải thông tin chi tiết của snapshot này. Vui lòng quay lại danh sách và thử lại.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, width: '100%', boxSizing: 'border-box' }}>
                    
                    {/* Snapshot Banner & Inline Rename Name Field */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.005)',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
                        
                        {/* Title Row with Click-to-Edit */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                          {isEditingName ? (
                            <TextField
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={async () => {
                                const valTrimmed = editingName.trim();
                                if (!valTrimmed) {
                                  showToast('Tên dự án không được để trống!', 'warning');
                                  setIsEditingName(false);
                                  return;
                                }
                                try {
                                  const res = await vbplSuggestionsService.patchCustomTrendSnapshot(ctSnapshotDetail.id, {
                                    name: valTrimmed
                                  });
                                  if (res.name !== valTrimmed) {
                                    showToast(`Tên dự án bị trùng, tự động đổi thành: ${res.name}`, 'warning');
                                  } else {
                                    showToast('Cập nhật tên dự án thành công!', 'success');
                                  }
                                  fetchCustomSnapshotDetail(ctSnapshotDetail.id);
                                } catch (err: any) {
                                  showToast(err.response?.data?.message || err.message || 'Lỗi khi sửa tên', 'danger');
                                } finally {
                                  setIsEditingName(false);
                                }
                              }}
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const valTrimmed = editingName.trim();
                                  if (!valTrimmed) {
                                    showToast('Tên dự án không được để trống!', 'warning');
                                    setIsEditingName(false);
                                    return;
                                  }
                                  try {
                                    const res = await vbplSuggestionsService.patchCustomTrendSnapshot(ctSnapshotDetail.id, {
                                      name: valTrimmed
                                    });
                                    if (res.name !== valTrimmed) {
                                      showToast(`Tên dự án bị trùng, tự động đổi thành: ${res.name}`, 'warning');
                                    } else {
                                      showToast('Cập nhật tên dự án thành công!', 'success');
                                    }
                                    fetchCustomSnapshotDetail(ctSnapshotDetail.id);
                                  } catch (err: any) {
                                    showToast(err.response?.data?.message || err.message || 'Lỗi khi sửa tên', 'danger');
                                  } finally {
                                    setIsEditingName(false);
                                  }
                                }
                              }}
                              autoFocus
                              size="small"
                              sx={{
                                maxWidth: 450,
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  fontWeight: 800,
                                  fontSize: '1.25rem'
                                }
                              }}
                            />
                          ) : (
                            <Box 
                              onClick={() => {
                                setEditingName(ctSnapshotDetail.name);
                                setIsEditingName(true);
                              }}
                              sx={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                cursor: 'pointer',
                                p: 0.5,
                                borderRadius: 1.5,
                                '&:hover': {
                                  bgcolor: 'action.hover'
                                }
                              }}
                            >
                              <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
                                {ctSnapshotDetail.name}
                              </Typography>
                              <EditIcon sx={{ color: 'text.secondary', fontSize: 16, opacity: 0.6 }} />
                            </Box>
                          )}

                          <Chip
                            label={ctSnapshotDetail.timeRange === '3-m' ? 'Dữ liệu 3 tháng qua' : 'Dữ liệu 1 tháng qua'}
                            color="warning"
                            size="small"
                            sx={{ fontWeight: 800, borderRadius: 1.8, bgcolor: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
                          />
                        </Box>

                        {/* Description & metadata details */}
                        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2.2 }}>
                          {ctSnapshotDetail.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic', pl: 1, borderLeft: '3px solid', borderColor: '#f59e0b' }}>
                              Mô tả: {ctSnapshotDetail.description}
                            </Typography>
                          )}
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary" display="block">Thời điểm cào AI:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }}>
                                📅 {formatDateStr(ctSnapshotDetail.fetchedAt)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary" display="block">Gợi ý mở rộng thành công:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }}>
                                💡 {ctSnapshotDetail.suggestions?.length || 0} từ khóa SEO
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary" display="block">Từ khóa gốc đầu vào:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }}>
                                🔑 {ctSnapshotDetail.inputKeywords?.length || 0} từ khóa
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary" display="block">Hành động nhanh:</Typography>
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="warning"
                                  startIcon={<RefreshIcon sx={{ fontSize: 13 }} />}
                                  onClick={() => {
                                    setRegenSourceId(ctSnapshotDetail.id);
                                    setRegenSourceName(ctSnapshotDetail.name);
                                    setRegenSourceKeywords(ctSnapshotDetail.inputKeywords || []);
                                    setRegenCount(20);
                                    setRegenTimeRange('3-m');
                                    setRegenModalOpen(true);
                                  }}
                                  sx={{ textTransform: 'none', fontWeight: 800, py: 0.3, borderRadius: 2 }}
                                >
                                  Cào mới (Regen)
                                </Button>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>

                        {/* Input Keywords Badges Chips */}
                        {ctSnapshotDetail.inputKeywords && ctSnapshotDetail.inputKeywords.length > 0 && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                              DANH SÁCH TỪ KHÓA ĐẦU VÀO GỐC (READ-ONLY):
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {ctSnapshotDetail.inputKeywords.map((kw, i) => (
                                <Chip
                                  key={i}
                                  label={kw}
                                  size="small"
                                  sx={{ 
                                    fontWeight: 700, 
                                    borderRadius: 1.5,
                                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(14, 165, 233, 0.05)',
                                    color: '#38bdf8',
                                    border: '1px solid',
                                    borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 165, 233, 0.15)'
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Paper>

                    {/* Filter and Copy actions row */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                      <TextField
                        placeholder="Lọc trong bộ gợi ý này..."
                        value={customSearchQuery}
                        onChange={(e) => setCustomSearchQuery(e.target.value)}
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          maxWidth: 300,
                          width: '100%',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2.2,
                            bgcolor: 'background.paper'
                          }
                        }}
                      />

                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          startIcon={<FileCopyIcon sx={{ fontSize: 13 }} />}
                          onClick={() => {
                            const allNames = ctSnapshotDetail.suggestions.map(s => s.name).join('\n');
                            navigator.clipboard.writeText(allNames);
                            showToast(`Đã copy tất cả ${ctSnapshotDetail.suggestions.length} đề xuất chủ đề vào clipboard!`, 'success');
                          }}
                          sx={{ 
                            borderRadius: 2.5, 
                            fontWeight: 800, 
                            textTransform: 'none',
                            height: 38,
                            px: 2.5
                          }}
                        >
                          Copy tất cả gợi ý ({ctSnapshotDetail.suggestions?.length || 0})
                        </Button>

                        <Button
                          variant="outlined"
                          color="success"
                          size="small"
                          startIcon={<FileDownloadIcon sx={{ fontSize: 13 }} />}
                          onClick={handleExportCustomTrendsExcel}
                          sx={{ 
                            borderRadius: 2.5, 
                            fontWeight: 800, 
                            textTransform: 'none',
                            height: 38,
                            px: 2.5,
                            color: '#10b981',
                            borderColor: 'rgba(16, 185, 129, 0.4)',
                            '&:hover': {
                              borderColor: '#10b981',
                              bgcolor: 'rgba(16, 185, 129, 0.04)'
                            }
                          }}
                        >
                          Tải Excel
                        </Button>

                        <Button
                          variant="outlined"
                          color="info"
                          size="small"
                          startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                          onClick={() => {
                            const q = customSearchQuery.toLowerCase().trim();
                            const filtered = ctSnapshotDetail.suggestions.filter(s => 
                              !q ||
                              s.name.toLowerCase().includes(q) || 
                              s.sourceKeyword.toLowerCase().includes(q) ||
                              s.reason.toLowerCase().includes(q)
                            );
                            
                            const toAdd = filtered.filter(item => !cartItems.some(k => k.name === item.name));
                            if (toAdd.length === 0) {
                              setCartItems(prev => prev.filter(k => !filtered.some(item => item.name === k.name)));
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
                              showToast(`Đã thêm ${toAdd.length} đề xuất vào giỏ hàng!`, 'success');
                            }
                          }}
                          sx={{ 
                            borderRadius: 2.5, 
                            fontWeight: 800, 
                            textTransform: 'none',
                            height: 38,
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
                            const q = customSearchQuery.toLowerCase().trim();
                            const filtered = ctSnapshotDetail.suggestions.filter(s => 
                              !q ||
                              s.name.toLowerCase().includes(q) || 
                              s.sourceKeyword.toLowerCase().includes(q) ||
                              s.reason.toLowerCase().includes(q)
                            );
                            return filtered.every(item => cartItems.some(k => k.name === item.name))
                              ? "Bỏ chọn cả bộ" 
                              : `Chọn cả bộ (${filtered.length})`;
                          })()}
                        </Button>
                      </Box>
                    </Box>

                    {/* Suggestions list mapping */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8, width: '100%', boxSizing: 'border-box' }}>
                      {(() => {
                        const q = customSearchQuery.toLowerCase().trim();
                        const filtered = ctSnapshotDetail.suggestions.filter(s => 
                          !q ||
                          s.name.toLowerCase().includes(q) || 
                          s.sourceKeyword.toLowerCase().includes(q) ||
                          s.reason.toLowerCase().includes(q)
                        );

                        if (filtered.length === 0) {
                          return (
                            <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                Không tìm thấy gợi ý nào khớp với "{customSearchQuery}"
                              </Typography>
                            </Box>
                          );
                        }

                        return filtered.map((item, idx) => (
                          <CustomSuggestionRow key={idx} item={item} index={idx + 1} />
                        ));
                      })()}
                    </Box>

                  </Box>
                )}

              </Box>
            )}

            {/* ========================================================================= */}
            {/* MODAL 1: TẠO DỰ ÁN MỚI (With Smart tags pasting input) */}
            {/* ========================================================================= */}
            <Dialog 
              open={createModalOpen} 
              onClose={() => {
                if (!ctState.loading) setCreateModalOpen(false);
              }}
              PaperProps={{ sx: { borderRadius: 4, width: '100%', maxWidth: 580, p: 1 } }}
            >
              <DialogTitle sx={{ fontWeight: 900, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PsychologyIcon sx={{ color: '#f59e0b' }} /> Cấu hình cào AI gợi ý tự chọn
              </DialogTitle>
              
              <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -1 }}>
                  Cung cấp các từ khóa hạt giống để AI phân tích và tự động quét Google Trends.
                </Typography>
                
                <TextField
                  label="Tên dự án chủ đề"
                  placeholder="Ví dụ: Hôn nhân & Gia đình, Kê khai Thuế..."
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                
                <TextField
                  label="Mô tả dự án (tùy chọn)"
                  placeholder="Mục đích hoặc thông tin dự án..."
                  value={inputDescription}
                  onChange={(e) => setInputDescription(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />

                {/* Smart tags chip input component container */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                    🔑 Bộ từ khóa gốc đầu vào ({tagsInput.length} từ đã thêm)
                  </Typography>
                  
                  {/* Visual list of tags chips */}
                  {tagsInput.length > 0 && (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 0.8, 
                        p: 1.5, 
                        borderRadius: 2, 
                        bgcolor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider',
                        maxHeight: 120,
                        overflowY: 'auto'
                      }}
                    >
                      {tagsInput.map((tag, idx) => (
                        <Chip
                          key={idx}
                          label={tag}
                          size="small"
                          onDelete={() => {
                            setTagsInput(prev => prev.filter((_, i) => i !== idx));
                          }}
                          sx={{ 
                            fontWeight: 700, 
                            borderRadius: 1.5,
                            bgcolor: 'action.selected',
                            color: 'text.primary'
                          }}
                        />
                      ))}
                    </Box>
                  )}

                  {/* Input field supporting Enter, Comma, and smart pasting text splitting */}
                  <TextField
                    label="Nhập từ khóa hạt giống (Nhấn Enter/dấu phẩy để tạo chip hoặc paste văn bản)"
                    placeholder="Ví dụ: chia tài sản, ly hôn tự nguyện..."
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const val = tagsText.trim().replace(/,$/, '');
                        if (val && !tagsInput.includes(val)) {
                          setTagsInput(prev => [...prev, val]);
                        }
                        setTagsText('');
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData('text');
                      // Splitting by newlines, commas, semicolons
                      const items = text
                        .split(/\r?\n|,|;/)
                        .map(item => item.trim())
                        .filter(Boolean);
                      
                      if (items.length > 0) {
                        setTagsInput(prev => {
                          const merged = [...prev];
                          items.forEach(item => {
                            if (!merged.includes(item)) merged.push(item);
                          });
                          return merged;
                        });
                        setTagsText('');
                        showToast(`Đã tự động tách và thêm ${items.length} từ khóa gốc!`, 'info');
                      }
                    }}
                    fullWidth
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', pl: 0.5 }}>
                    💡 Hỗ trợ copy/paste cả danh sách từ Excel, notepad (cách nhau bởi phẩy hoặc xuống dòng).
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  {/* Select count */}
                  <Grid item xs={12} sm={6}>
                    <FormControl size="small" fullWidth>
                      <InputLabel id="input-count-label">Số lượng ý tưởng AI gợi ý</InputLabel>
                      <Select
                        labelId="input-count-label"
                        value={inputCount}
                        label="Số lượng ý tưởng AI gợi ý"
                        onChange={(e) => setInputCount(Number(e.target.value))}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value={5}>5 ý tưởng</MenuItem>
                        <MenuItem value={10}>10 ý tưởng</MenuItem>
                        <MenuItem value={15}>15 ý tưởng</MenuItem>
                        <MenuItem value={20}>20 ý tưởng (Mặc định)</MenuItem>
                        <MenuItem value={30}>30 ý tưởng</MenuItem>
                        <MenuItem value={50}>50 ý tưởng</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Select timerange */}
                  <Grid item xs={12} sm={6}>
                    <FormControl size="small" fullWidth>
                      <InputLabel id="input-timerange-label">Dòng thời gian Google Trends</InputLabel>
                      <Select
                        labelId="input-timerange-label"
                        value={inputTimeRange}
                        label="Dòng thời gian Google Trends"
                        onChange={(e) => setInputTimeRange(e.target.value as '3-m' | '1-m')}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="3-m">3 tháng qua (Khuyên dùng)</MenuItem>
                        <MenuItem value="1-m">1 tháng qua</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button 
                  onClick={() => setCreateModalOpen(false)} 
                  variant="outlined"
                  sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={() => {
                    const nameTrimmed = inputName.trim();
                    if (!nameTrimmed) {
                      showToast('Vui lòng cung cấp tên dự án!', 'warning');
                      return;
                    }

                    // Flush any currently typed tagsText
                    let finalTags = [...tagsInput];
                    const left = tagsText.trim().replace(/,$/, '');
                    if (left && !finalTags.includes(left)) {
                      finalTags.push(left);
                    }

                    if (finalTags.length === 0) {
                      showToast('Hãy nhập ít nhất 1 từ khóa hạt giống!', 'warning');
                      return;
                    }
                    if (finalTags.length > 50) {
                      showToast('Chấp nhận tối đa 50 từ khóa hạt giống!', 'warning');
                      return;
                    }

                    // Close setup and fire stream
                    setCreateModalOpen(false);
                    setCustomViewMode('list');
                    setExpandedGroups(prev => ({ ...prev, [nameTrimmed]: true }));
                    startCustomTrendSuggestionsStream(
                      {
                        name: nameTrimmed,
                        description: inputDescription.trim() || undefined,
                        inputKeywords: finalTags,
                        count: inputCount,
                        timeRange: inputTimeRange
                      },
                      showToast,
                      (newId) => {
                        fetchCustomSnapshots(1);
                        if (progressModalOpenRef.current) {
                          setSelectedSnapshotId(newId);
                          fetchCustomSnapshotDetail(newId);
                          setCustomViewMode('detail');
                        } else {
                          showToast('Dự án gợi ý tự chọn đã cào xong ở nền! Click xem trong danh sách.', 'success');
                        }
                      }
                    );
                  }}
                  variant="contained"
                  sx={{ 
                    textTransform: 'none', 
                    borderRadius: 2, 
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                    }
                  }}
                >
                  Bắt đầu cào AI
                </Button>
              </DialogActions>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL 2: TẠO THÊM SNAPSHOT (Regen) */}
            {/* ========================================================================= */}
            <Dialog
              open={regenModalOpen}
              onClose={() => {
                if (!ctState.loading) setRegenModalOpen(false);
              }}
              PaperProps={{ sx: { borderRadius: 4, width: '100%', maxWidth: 500, p: 1 } }}
            >
              <DialogTitle sx={{ fontWeight: 900, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <RefreshIcon sx={{ color: '#f59e0b' }} /> Phục hồi & Tạo snapshot cào mới
              </DialogTitle>
              
              <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Dự án gốc:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    📁 {regenSourceName}
                  </Typography>
                </Box>

                {/* Read-only chip tag display of original seed keywords */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                    Từ khóa hạt giống kế thừa (Read-only):
                  </Typography>
                  {regenSourceKeywords.length === 0 ? (
                    <CircularProgress size={16} sx={{ color: '#f59e0b' }} />
                  ) : (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 0.8, 
                        p: 1.5, 
                        borderRadius: 2, 
                        bgcolor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider',
                        maxHeight: 120,
                        overflowY: 'auto'
                      }}
                    >
                      {regenSourceKeywords.map((kw, i) => (
                        <Chip
                          key={i}
                          label={kw}
                          size="small"
                          sx={{ fontWeight: 700, borderRadius: 1.2 }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl size="small" fullWidth>
                      <InputLabel id="regen-count-label">Số lượng ý tưởng</InputLabel>
                      <Select
                        labelId="regen-count-label"
                        value={regenCount}
                        label="Số lượng ý tưởng"
                        onChange={(e) => setRegenCount(Number(e.target.value))}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value={5}>5 ý tưởng</MenuItem>
                        <MenuItem value={10}>10 ý tưởng</MenuItem>
                        <MenuItem value={15}>15 ý tưởng</MenuItem>
                        <MenuItem value={20}>20 ý tưởng (Mặc định)</MenuItem>
                        <MenuItem value={30}>30 ý tưởng</MenuItem>
                        <MenuItem value={50}>50 ý tưởng</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl size="small" fullWidth>
                      <InputLabel id="regen-timerange-label">Google Trends</InputLabel>
                      <Select
                        labelId="regen-timerange-label"
                        value={regenTimeRange}
                        label="Google Trends"
                        onChange={(e) => setRegenTimeRange(e.target.value as '3-m' | '1-m')}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="3-m">3 tháng qua</MenuItem>
                        <MenuItem value="1-m">1 tháng qua</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button 
                  onClick={() => setRegenModalOpen(false)} 
                  variant="outlined"
                  sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={() => {
                    setRegenModalOpen(false);
                    setCustomViewMode('list');
                    setExpandedGroups(prev => ({ ...prev, [regenSourceName]: true }));
                    startCustomTrendRegenStream(
                      regenSourceId,
                      regenSourceName,
                      {
                        count: regenCount,
                        timeRange: regenTimeRange
                      },
                      showToast,
                      (newId) => {
                        fetchCustomSnapshots(1);
                        if (progressModalOpenRef.current) {
                          setSelectedSnapshotId(newId);
                          fetchCustomSnapshotDetail(newId);
                          setCustomViewMode('detail');
                        } else {
                          showToast('Snapshot mới đã cào xong ở nền! Click xem trong danh sách.', 'success');
                        }
                      }
                    );
                    setProgressModalOpen(true);
                  }}
                  variant="contained"
                  sx={{ 
                    textTransform: 'none', 
                    borderRadius: 2, 
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                    }
                  }}
                >
                  Tiến hành cào
                </Button>
              </DialogActions>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL 3: PROGRESS MODAL (Real-time SSE cào indicator) */}
            {/* ========================================================================= */}
            <Dialog
              open={progressModalOpen}
              onClose={() => setProgressModalOpen(false)}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 4.5,
                  p: 1.5,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#111827' : 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider'
                }
              }}
            >
              <DialogTitle sx={{ fontWeight: 900, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <CircularProgress size={18} sx={{ color: '#f59e0b' }} />
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>Tiến trình Phân tích AI</Typography>
                </Box>
                
                <IconButton 
                  size="small" 
                  onClick={() => setProgressModalOpen(false)}
                  sx={{ color: 'text.secondary' }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>

              <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3.2, pt: 2 }}>
                
                {/* Step checklist indicators */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2, 
                    p: 2.2, 
                    borderRadius: 3.5, 
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  {(() => {
                    const logs = ctState.logs;
                    const latestStep = logs[logs.length - 1]?.step || 'start';

                    const steps = [
                      {
                        key: 'resolve',
                        label: 'Xác minh thông tin & Tên dự án',
                        completed: logs.some(l => ['resolving_name', 'name_suffixed', 'ai_gen_start', 'ai_gen_done', 'scrape_start'].includes(l.step)) && latestStep !== 'resolving_name',
                        active: latestStep === 'resolving_name' || latestStep === 'start'
                      },
                      {
                        key: 'ai_gen',
                        label: 'AI gợi ý mở rộng chủ đề SEO',
                        completed: logs.some(l => ['ai_gen_done', 'scrape_start', 'scrape_item_start', 'scrape_item_done', 'saved'].includes(l.step)),
                        active: latestStep === 'ai_gen_start'
                      },
                      {
                        key: 'scrape',
                        label: 'Cào chỉ số Trends & Volume Google',
                        completed: logs.some(l => ['saved', 'result', 'saving'].includes(l.step)),
                        active: ['scrape_start', 'scrape_item_start', 'scrape_item_done', 'captcha_warmup', 'captcha_solving', 'captcha_solved', 'captcha_pass'].includes(latestStep)
                      },
                      {
                        key: 'save',
                        label: 'Lưu trữ kết quả vào cơ sở dữ liệu',
                        completed: logs.some(l => ['saved', 'result'].includes(l.step)),
                        active: latestStep === 'saving'
                      }
                    ];

                    return steps.map((st, i) => {
                      let icon = <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid', borderColor: 'text.disabled', flexShrink: 0 }} />;
                      let color = 'text.secondary';
                      let fontWeight = 500;

                      if (st.completed) {
                        icon = <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', bgcolor: '#10b981', color: 'white', flexShrink: 0, fontSize: 11, fontWeight: 900 }}>✓</Box>;
                        color = 'text.primary';
                        fontWeight = 700;
                      } else if (st.active) {
                        icon = <CircularProgress size={16} sx={{ color: '#f59e0b', flexShrink: 0 }} />;
                        color = '#f59e0b';
                        fontWeight = 800;
                      }

                      return (
                        <Box key={st.key} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {icon}
                          <Typography variant="body2" sx={{ color, fontWeight, fontSize: '0.88rem' }}>
                            {st.label}
                          </Typography>
                        </Box>
                      );
                    });
                  })()}
                </Box>

                {/* Scrape Progress Bar */}
                {ctState.totalProgressItems > 0 && ['scrape_start', 'scrape_item_start', 'scrape_item_done', 'captcha_warmup', 'captcha_solving', 'captcha_solved', 'captcha_pass'].includes(ctState.logs[ctState.logs.length - 1]?.step || '') && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        {ctState.currentProgressItem ? `⚡ Đang quét: "${ctState.currentProgressItem}"` : 'Đang khởi chạy trình cào...'}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 850, color: '#f59e0b' }}>
                        {ctState.currentProgressIndex} / {ctState.totalProgressItems} cào ({Math.round((ctState.currentProgressIndex / ctState.totalProgressItems) * 100)}%)
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={Math.round((ctState.currentProgressIndex / ctState.totalProgressItems) * 100)}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 5,
                          background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                        }
                      }}
                    />
                  </Box>
                )}

                {/* Captcha indicators warning neon pulse card */}
                {(() => {
                  const latest = ctState.logs[ctState.logs.length - 1]?.step;
                  const hasCaptchaWarmup = ctState.logs.some(l => l.step === 'captcha_warmup' || l.step === 'captcha_solving');
                  const solvedCaptcha = ctState.logs.some(l => l.step === 'captcha_solved' || l.step === 'captcha_pass');
                  
                  if (['captcha_warmup', 'captcha_solving'].includes(latest || '')) {
                    return (
                      <Box 
                        sx={{ 
                          p: 2, 
                          borderRadius: 3, 
                          bgcolor: 'rgba(245, 158, 11, 0.1)', 
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          // pulse animation
                          animation: 'pulse 1.8s infinite ease-in-out',
                          '@keyframes pulse': {
                            '0%': { opacity: 0.8, boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.2)' },
                            '50%': { opacity: 1, boxShadow: '0 0 10px 2px rgba(245, 158, 11, 0.4)' },
                            '100%': { opacity: 0.8, boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.2)' }
                          }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                          ⚠️ CẢNH BÁO CAPTCHA: Google Trends chặn robot! Trình cào đang tự động giải mã Bypass Captcha. Vui lòng đợi trong giây lát...
                        </Typography>
                      </Box>
                    );
                  }
                  
                  if (solvedCaptcha && ['scrape_item_start', 'scrape_item_done', 'captcha_solved', 'captcha_pass'].includes(latest || '')) {
                    return (
                      <Box sx={{ p: 1.8, borderRadius: 3, bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981', fontSize: '0.82rem' }}>
                          ✅ GIẢI MÃ THÀNH CÔNG: Đã vượt qua tường lửa kiểm duyệt của Google. Tiếp tục cào dữ liệu!
                        </Typography>
                      </Box>
                    );
                  }

                  return null;
                })()}

                {/* Collapsible live neon logs console */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box 
                    onClick={() => setIsLogsExpanded(!isLogsExpanded)}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      px: 1,
                      '&:hover': { opacity: 0.8 }
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 850, color: 'text.secondary', letterSpacing: '0.05em' }}>
                      NHẬT KÝ HỆ THỐNG (LIVE LOGS)
                    </Typography>
                    <IconButton size="small" sx={{ p: 0.2 }}>
                      {isLogsExpanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </Box>

                  {isLogsExpanded && (
                    <Box 
                      ref={customLogContainerRef}
                      sx={{
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.55)' : '#0f172a',
                        color: '#38bdf8',
                        p: 2.2,
                        borderRadius: 3.5,
                        fontFamily: 'monospace',
                        fontSize: '0.81rem',
                        height: 180,
                        overflowY: 'auto',
                        border: '1px solid',
                        borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)',
                        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
                        lineHeight: 1.6,
                        '&::-webkit-scrollbar': { width: '4px' },
                        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }
                      }}
                    >
                      {ctState.logs.map((log, idx) => (
                        <Box key={idx} sx={{ mb: 0.6, display: 'flex', gap: 1.2, alignItems: 'flex-start' }}>
                          <Typography component="span" sx={{ color: 'text.disabled', fontFamily: 'monospace', fontSize: 'inherit', flexShrink: 0 }}>
                            [{log.timestamp}]
                          </Typography>
                          <Typography 
                            component="span" 
                            sx={{ 
                              color: log.step === 'error' ? '#f87171' : (log.step === 'saved' || log.step === 'result' ? '#34d399' : (log.step?.includes('captcha') ? '#fbbf24' : '#38bdf8')), 
                              fontWeight: ['saved', 'result', 'captcha_solved'].includes(log.step || '') ? 800 : 400, 
                              fontFamily: 'monospace', 
                              fontSize: 'inherit',
                              wordBreak: 'break-all'
                            }}
                          >
                            {log.message}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'center', gap: 2 }}>
                {ctState.loading ? (
                  <>
                    <Button
                      variant="outlined"
                      onClick={() => setProgressModalOpen(false)}
                      sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 700, px: 3 }}
                    >
                      Chạy ẩn (Chạy nền)
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={stopCustomTrendSuggestionsStream}
                      startIcon={<StopIcon />}
                      sx={{ 
                        fontWeight: 850, 
                        borderRadius: 2.5, 
                        textTransform: 'none',
                        px: 3,
                        py: 1
                      }}
                    >
                      Hủy & Dừng cào
                    </Button>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      onClick={() => setProgressModalOpen(false)}
                      sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 700, px: 3 }}
                    >
                      Đóng cửa sổ
                    </Button>
                    
                    {ctState.result && (
                      <Button
                        variant="contained"
                        onClick={() => {
                          if (ctState.result) {
                            setSelectedSnapshotId(ctState.result.id || ctState.result._id);
                            fetchCustomSnapshotDetail(ctState.result.id || ctState.result._id);
                            setCustomViewMode('detail');
                          }
                          setProgressModalOpen(false);
                        }}
                        sx={{ 
                          textTransform: 'none', 
                          borderRadius: 2.5, 
                          fontWeight: 800,
                          px: 4,
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                          }
                        }}
                      >
                        Xem kết quả cào AI
                      </Button>
                    )}
                  </Box>
                )}
              </DialogActions>
            </Dialog>

          </Box>
        ) : activeTab === 2 ? (
          /* ================= AI Keyword Expansion (Volume suggestions) ================= */
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
                borderRadius: 3.5, 
                border: '1px solid', 
                borderColor: 'divider',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.002)'
              }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AutoAwesomeIcon sx={{ color: '#10b981', fontSize: 18 }} /> Từ khóa hạt giống (Seed keywords - 1 đến 30 từ, tối đa 200 ký tự mỗi từ)
                    </Typography>
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
                        borderRadius: 2, 
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
                          size="small"
                          onDelete={() => {
                            setSeedKeywords(prev => prev.filter((_, i) => i !== idx));
                          }}
                          sx={{ 
                            fontWeight: 700, 
                            borderRadius: 1.5,
                            bgcolor: 'action.selected',
                            color: 'text.primary'
                          }}
                        />
                      ))}
                    </Box>
                  )}

                  <TextField
                    fullWidth
                    placeholder="Nhập từ khóa hạt giống (Nhấn Enter hoặc Dấu phẩy để thêm, tối đa 30 từ)"
                    value={seedInputText}
                    onChange={(e) => {
                      setSeedInputText(e.target.value);
                      setValidationError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const val = seedInputText.trim().replace(/,$/, '');
                        if (val) {
                          if (val.length > 200) {
                            setValidationError('Từ khóa hạt giống không được vượt quá 200 ký tự.');
                            showToast('Từ khóa quá dài (tối đa 200 ký tự)!', 'warning');
                            return;
                          }
                          if (seedKeywords.length >= 30) {
                            setValidationError('Chỉ được nhập tối đa 30 từ khóa hạt giống.');
                            showToast('Tối đa 30 từ khóa hạt giống!', 'warning');
                            return;
                          }
                          if (!seedKeywords.includes(val)) {
                            setSeedKeywords(prev => [...prev, val]);
                          }
                          setSeedInputText('');
                        }
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData('text');
                      const items = text
                        .split(/\r?\n|,|;/)
                        .map(item => item.trim())
                        .filter(Boolean);
                      
                      if (items.length > 0) {
                        const longItem = items.find(item => item.length > 200);
                        if (longItem) {
                          setValidationError('Từ khóa hạt giống không được vượt quá 200 ký tự.');
                          showToast('Có từ khóa quá dài (tối đa 200 ký tự)!', 'warning');
                          return;
                        }

                        setSeedKeywords(prev => {
                          const merged = [...prev];
                          items.forEach(item => {
                            if (merged.length < 30 && !merged.includes(item)) {
                              merged.push(item);
                            }
                          });
                          if (prev.length + items.length > 30) {
                            showToast('Đã dừng thêm khi đạt giới hạn 30 từ khóa hạt giống!', 'warning');
                          } else {
                            showToast(`Đã tự động tách và thêm ${items.length} từ khóa gốc!`, 'info');
                          }
                          return merged;
                        });
                        setSeedInputText('');
                      }
                    }}
                    error={!!validationError}
                    helperText={validationError || `${seedKeywords.length}/30 từ khóa đã thêm`}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.default' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={12} md={6}>
                  <FormControl fullWidth size="small">
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Lĩnh vực ưu tiên (context - Tối đa 300 ký tự)
                    </Typography>
                    <TextField
                      size="small"
                      placeholder="Ví dụ: đất đai, lao động, hôn nhân gia đình..."
                      value={context}
                      onChange={(e) => setContext(e.target.value.substring(0, 300))}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                    />
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Số topic AI sinh (outputCount)
                    </Typography>
                    <Select
                      value={outputCount}
                      onChange={(e) => setOutputCount(Number(e.target.value))}
                      sx={{ borderRadius: 2, bgcolor: 'background.default' }}
                    >
                      {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((num) => (
                        <MenuItem key={num} value={num}>{num} topic</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Mở rộng mỗi seed (perSeed)
                    </Typography>
                    <TextField
                      type="number"
                      size="small"
                      value={perSeed}
                      onChange={(e) => setPerSeed(Math.min(50, Math.max(1, Number(e.target.value))))}
                      slotProps={{ htmlInput: { min: 1, max: 50 } }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                    />
                  </FormControl>
                </Grid>

                {/* Collapsible Advanced Filters Accordion */}
                <Grid item xs={12}>
                  <Accordion 
                    elevation={0}
                    sx={{ 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '10px !important',
                      bgcolor: 'background.default',
                      '&:before': { display: 'none' }
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                        borderRadius: '10px !important',
                        px: 2,
                        minHeight: 40,
                        '&.Mui-expanded': { minHeight: 40 },
                        '& .MuiAccordionSummary-content': {
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          my: 0.8
                        }
                      }}
                    >
                      <FilterAltIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Bộ lọc nâng cao (Volume, Quốc gia, Ngôn ngữ...)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth size="small">
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quốc gia</Typography>
                            <Select value={locationCode} onChange={(e) => setLocationCode(e.target.value)} sx={{ borderRadius: 2, bgcolor: 'background.default' }}>
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
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth size="small">
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ngôn ngữ</Typography>
                            <Select value={languageCode} onChange={(e) => setLanguageCode(e.target.value)} sx={{ borderRadius: 2, bgcolor: 'background.default' }}>
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
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth size="small">
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sắp xếp Volume con</Typography>
                            <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')} sx={{ borderRadius: 2, bgcolor: 'background.default' }}>
                              <MenuItem value="desc">Giảm dần (Volume cao &rarr; thấp)</MenuItem>
                              <MenuItem value="asc">Tăng dần (Volume thấp &rarr; cao)</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center', pt: 3 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={includeZeroVolume}
                                onChange={(e) => setIncludeZeroVolume(e.target.checked)}
                                color="primary"
                              />
                            }
                            label={
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                Hiện cả volume 0
                              </Typography>
                            }
                          />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth size="small">
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Volume con tối thiểu</Typography>
                            <TextField
                              type="number"
                              size="small"
                              placeholder="Ví dụ: 100"
                              value={minVolume}
                              onChange={(e) => setMinVolume(e.target.value === '' ? '' : Number(e.target.value))}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                            />
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth size="small">
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Volume con tối đa</Typography>
                            <TextField
                              type="number"
                              size="small"
                              placeholder="Ví dụ: 50000"
                              value={maxVolume}
                              onChange={(e) => setMaxVolume(e.target.value === '' ? '' : Number(e.target.value))}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                            />
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={12} md={6}>
                          <FormControl fullWidth size="small">
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Độ cạnh tranh con</Typography>
                            <Select
                              multiple
                              displayEmpty
                              value={competitionFilters}
                              onChange={(e) => setCompetitionFilters(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                              renderValue={(selected) => selected.length === 0 ? 'Tất cả độ cạnh tranh' : selected.join(', ')}
                              sx={{ borderRadius: 2, bgcolor: 'background.default' }}
                            >
                              {['LOW', 'MEDIUM', 'HIGH'].map((comp) => (
                                <MenuItem key={comp} value={comp}>
                                  <Checkbox checked={competitionFilters.indexOf(comp) > -1} size="small" />
                                  <ListItemText primary={comp} />
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start', alignItems: 'center', mt: 1 }}>
                  <Button 
                    variant="contained" 
                    onClick={() => handleExpandKeywords(1, false)} 
                    disabled={expansionLoading}
                    startIcon={expansionLoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                    sx={{ 
                      borderRadius: 2.5, px: 4, py: 1.2, fontWeight: 800, fontSize: '0.95rem',
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
                      sx={{ borderRadius: 2.5, px: 3, py: 1.2, fontWeight: 700, fontSize: '0.95rem', height: 43, textTransform: 'none' }}
                    >
                      Sinh lại (Bỏ cache)
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Paper>

            {/* Loading Display */}
            {expansionLoading && (
              <Paper
                elevation={0}
                sx={{
                  p: 6,
                  borderRadius: 4,
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
                    ⚡ AI đang sinh từ khoá và kiểm tra volume, có thể mất tới 1 phút...
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', fontStyle: 'italic' }}>
                    Hệ thống đang gọi AI và kiểm tra volume thực tế từ Google Ads. Lần gọi đầu (chưa có cache) có thể chậm vì backend gọi Google Ads nhiều lần. Vui lòng giữ kết nối và không đóng trình duyệt!
                  </Typography>
                </Box>
              </Paper>
            )}

            {/* Results Section */}
            {!expansionLoading && hasSearchedKeywords && (
              expandedTopics.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    borderRadius: 4,
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
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 4, 
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
                      <Typography sx={{ fontWeight: 850, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AutoAwesomeIcon sx={{ color: '#10b981', fontSize: 20 }} /> Danh sách nhóm chủ đề từ khóa AI
                      </Typography>
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
                          borderRadius: 2, 
                          fontWeight: 800, 
                          textTransform: 'none',
                          color: 'primary.main',
                          borderColor: 'primary.main',
                          px: 2
                        }}
                      >
                        {(() => {
                          const allChildKeywords = processedTopics.flatMap(t => t.keywords);
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
                        sx={{ borderRadius: 2, fontWeight: 800, textTransform: 'none', px: 2 }}
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
                          borderRadius: 2, 
                          fontWeight: 800, 
                          textTransform: 'none',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          boxShadow: 'none',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
                            boxShadow: 'none'
                          },
                          px: 2.5
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
                      borderRadius: 4, 
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
                          sx={{ fontWeight: 800, px: 0.5, borderRadius: 2 }}
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
                          sx={{ fontWeight: 800, px: 0.5, borderRadius: 2 }}
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
                                                  borderRadius: 1
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
                                                border: `1px solid ${intentColor}25`
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
                                          <Sparkline keyword={k.keyword} volumes={k.monthlySearchVolumes} />
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
                                              <CircularProgress variant="determinate" value={k.competitionIndex} size={22} thickness={4} sx={{ color: childCompColor, position: 'absolute', left: 0 }} />
                                            </Box>
                                            <Chip 
                                              label={childCompLabel} 
                                              size="small" 
                                              sx={{ fontWeight: 700, fontSize: 10, height: 18, bgcolor: `${childCompColor}10`, color: childCompColor, border: `1px solid ${childCompColor}20` }}
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
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
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
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                      >
                        Trang sau
                      </Button>
                    </Box>
                  )}
                </Box>
              )
            )}
              </>
            ) : (
              /* History view */
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 3.5, 
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
                      <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
                    ))}
                  </Box>
                ) : snapshots.length === 0 ? (
                  <Box sx={{ p: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 4 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Chưa có lịch sử mở rộng từ khóa nào. Hãy tạo từ khóa mới!
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden', mb: 2 }}>
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
                                    <Chip key={idx} label={seed} size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
                                  ))}
                                  {s.seeds && s.seeds.length > 3 && (
                                    <Tooltip title={s.seeds.join(', ')} arrow>
                                      <Chip label={`+${s.seeds.length - 3}`} size="small" sx={{ fontWeight: 700, borderRadius: 1, bgcolor: 'action.selected' }} />
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
                                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
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
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
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
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                        >
                          Trang sau
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        ) : (
          /* ================= AI suggestions by Categories (Horizontal Timeline Layout) ================= */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', boxSizing: 'border-box' }}>
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
                          px: 2.2,
                          py: 1.2,
                          borderRadius: 2.5,
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
                                  borderRadius: 0.5,
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
                  <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 3 }} />
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
                        borderRadius: 4, 
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
                          <Grid item xs={12} sm={6} key={i}>
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
                          borderRadius: 3, 
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

                  {/* STATE 2: LOADING / STREAM RUNNING */}
                  {ptState.loading && (
                    <Box 
                      sx={{ 
                        py: 4, 
                        px: 3, 
                        borderRadius: 4, 
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.005)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3.5,
                        width: '100%'
                      }}
                    >
                      {/* Header Progress indicator */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                        <CircularProgress size={30} color="warning" thickness={5} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', gap: 1, alignItems: 'center' }}>
                            {ptState.currentStep}
                          </Typography>
                          {ptState.currentProgressItem && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Đang phân tích chủ đề: <strong>{ptState.currentProgressItem}</strong>
                            </Typography>
                          )}
                        </Box>
                        {ptState.totalProgressItems > 0 && ptState.currentProgressIndex > 0 && (
                          <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace', color: '#f59e0b' }}>
                            {ptState.currentProgressIndex}/{ptState.totalProgressItems}
                          </Typography>
                        )}
                      </Box>

                      {/* Progress bar */}
                      {ptState.totalProgressItems > 0 && ptState.currentProgressIndex > 0 && (
                        <Box sx={{ width: '100%' }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={(ptState.currentProgressIndex / ptState.totalProgressItems) * 100} 
                            color="warning"
                            sx={{ height: 6, borderRadius: 3, bgcolor: 'divider' }}
                          />
                        </Box>
                      )}

                      {/* Live Console Terminal Log View */}
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block', color: 'text.secondary' }}>
                          LIVE SYSTEM CONSOLE LOGS:
                        </Typography>
                        <Box 
                          ref={logContainerRef}
                          sx={{ 
                            height: 220, 
                            overflowY: 'auto', 
                            bgcolor: 'black', 
                            borderRadius: 3, 
                            p: 2.5,
                            border: '1px solid',
                            borderColor: 'grey.800',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            '&::-webkit-scrollbar': { width: '4px' },
                            '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.800', borderRadius: '4px' }
                          }}
                        >
                          {ptState.logs.length === 0 ? (
                            <Typography variant="caption" sx={{ color: 'grey.700', fontFamily: 'monospace' }}>
                              Đang kết nối luồng sự kiện...
                            </Typography>
                          ) : (
                            ptState.logs.map((log, idx) => (
                              <Box key={idx} sx={{ display: 'flex', gap: 1.5, fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: 1.4 }}>
                                <Typography variant="caption" sx={{ color: 'grey.600', select: 'none', shrink: 0 }}>
                                  [{log.timestamp}]
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: log.step.includes('error') ? '#f87171' : (log.step.includes('done') || log.step === 'saved' ? '#34d399' : '#38bdf8'),
                                    fontWeight: log.step === 'saved' || log.step === 'result' ? 800 : 400
                                  }}
                                >
                                  &gt; {log.message || `Bước ${log.step} đang thực thi...`}
                                </Typography>
                              </Box>
                            ))
                          )}
                        </Box>
                      </Box>

                      {/* Stop button */}
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          onClick={stopPublicTrendSuggestionsStream}
                          sx={{ 
                            borderRadius: 2.5, 
                            textTransform: 'none', 
                            fontWeight: 700,
                            px: 3,
                            borderColor: 'rgba(239, 68, 68, 0.4)',
                            '&:hover': {
                              borderColor: '#ef4444',
                              bgcolor: 'rgba(239, 68, 68, 0.05)'
                            }
                          }}
                        >
                          Dừng phân tích (Cancel)
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* STATE 3: RESULTS RENDER */}
                  {!ptState.loading && ptState.result !== null && (
                    <>
                      {/* Stats Summary Bar & Actions */}
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'column', lg: 'row' }, 
                          justifyContent: 'space-between', 
                          alignItems: { xs: 'stretch', lg: 'center' }, 
                          gap: 2,
                          p: 2,
                          borderRadius: 3,
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>
                              Ngày phân tích
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                              {formatDateStr(ptState.result.fetchedDate)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>
                              Tổng xu hướng
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                              {ptState.result.trendingKeywordsCount}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>
                              Lịch sử DB
                            </Typography>
                            {ptState.result.savedId ? (
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981', display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                ✓ Đã lưu ({ptState.result.savedId.substring(0, 8)}...)
                              </Typography>
                            ) : (
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                Chưa lưu
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                          <TextField
                            placeholder="Lọc kết quả đề xuất..."
                            value={publicTrendSearchQuery}
                            onChange={(e) => setPublicTrendSearchQuery(e.target.value)}
                            size="small"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              maxWidth: 180,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: 'background.default'
                              }
                            }}
                          />

                          <Button
                            variant="outlined"
                            color="warning"
                            size="small"
                            startIcon={<AutoAwesomeIcon sx={{ fontSize: 13 }} />}
                            onClick={() => startPublicTrendSuggestionsStream(showToast, () => fetchDates(false))}
                            disabled={ptDatesData?.hasToday && selectedDate === ptDatesData.today}
                            sx={{ 
                              borderRadius: 2, 
                              fontWeight: 700, 
                              textTransform: 'none',
                              height: 38
                            }}
                          >
                            Phân tích mới hôm nay
                          </Button>

                          <Button
                            variant="contained"
                            color="warning"
                            size="small"
                            startIcon={<FileCopyIcon sx={{ fontSize: 13 }} />}
                            onClick={handleCopyAllPublicTrends}
                            sx={{ 
                              borderRadius: 2, 
                              fontWeight: 800, 
                              textTransform: 'none',
                              height: 38,
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              color: 'white',
                              boxShadow: 'none',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                                boxShadow: 'none'
                              }
                            }}
                          >
                            Copy ({filteredPublicTrendSuggestions.length})
                          </Button>

                          <Button
                            variant="outlined"
                            color="success"
                            size="small"
                            startIcon={<FileDownloadIcon sx={{ fontSize: 13 }} />}
                            onClick={handleExportPublicTrendsExcel}
                            sx={{ 
                              borderRadius: 2, 
                              fontWeight: 800, 
                              textTransform: 'none',
                              height: 38,
                              color: '#10b981',
                              borderColor: 'rgba(16, 185, 129, 0.4)',
                              '&:hover': {
                                borderColor: '#10b981',
                                bgcolor: 'rgba(16, 185, 129, 0.04)'
                              }
                            }}
                          >
                            Tải Excel
                          </Button>

                          <Button
                            variant="outlined"
                            color="info"
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
                                showToast(`Đã thêm ${toAdd.length} đề xuất vào giỏ hàng!`, 'success');
                              }
                            }}
                            sx={{ 
                              borderRadius: 2, 
                              fontWeight: 800, 
                              textTransform: 'none',
                              height: 38,
                              color: '#38bdf8',
                              borderColor: 'rgba(56, 189, 248, 0.4)',
                              '&:hover': {
                                borderColor: '#38bdf8',
                                bgcolor: 'rgba(56, 189, 248, 0.04)'
                              }
                            }}
                          >
                            {filteredPublicTrendSuggestions.every(item => cartItems.some(k => k.name === item.name))
                              ? "Bỏ chọn cả bộ" 
                              : `Chọn cả bộ (${filteredPublicTrendSuggestions.length})`}
                          </Button>
                        </Box>
                      </Box>

                      {/* Suggestions List */}
                      {filteredPublicTrendSuggestions.length === 0 ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Không có đề xuất nào khớp với "{publicTrendSearchQuery}"
                          </Typography>
                        </Box>
                      ) : (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: 1.5, 
                            maxHeight: 520, 
                            overflowY: 'auto', 
                            pr: 0.5,
                            width: '100%',
                            boxSizing: 'border-box',
                            '&::-webkit-scrollbar': { width: '4px' },
                            '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: '4px' }
                          }}
                        >
                          {filteredPublicTrendSuggestions.map((item, idx) => (
                            <AISuggestionRow key={idx} item={item} index={idx + 1} />
                          ))}
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Floating cart bar */}
      {cartItems.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1100,
            width: '90%',
            maxWidth: 800,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 4,
            border: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(14, 165, 233, 0.15)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            p: 2,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            '@keyframes slideUp': {
              '0%': { transform: 'translate(-50%, 100px)', opacity: 0 },
              '100%': { transform: 'translate(-50%, 0)', opacity: 1 }
            }
          }}
        >
          {/* Left part: summary */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box 
              sx={{ 
                bgcolor: 'rgba(56, 189, 248, 0.15)', 
                color: '#38bdf8', 
                p: 1, 
                borderRadius: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                Giỏ hàng từ khóa ({cartItems.length} từ khóa đã chọn)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: { xs: 250, sm: 300 }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {cartItems.map(k => k.name).join(', ')}
              </Typography>
            </Box>
          </Box>

          {/* Right part: action and domain selection */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button
              variant="text"
              color="error"
              size="small"
              onClick={() => {
                setCartItems([]);
                showToast('Đã xóa toàn bộ giỏ hàng!', 'info');
              }}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Dọn dẹp
            </Button>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={selectedCartDomainId}
                onChange={(e) => setSelectedCartDomainId(e.target.value)}
                displayEmpty
                sx={{
                  borderRadius: 2,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
                  fontSize: '0.85rem',
                  fontWeight: 700
                }}
              >
                <MenuItem value="" disabled>Chọn Tên miền...</MenuItem>
                {domainsList.map(d => (
                  <MenuItem key={d._id} value={d._id} sx={{ fontWeight: 600 }}>{d.domain}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              size="small"
              onClick={handleAddCartToDomain}
              disabled={isAddingToDomain || !selectedCartDomainId}
              sx={{
                borderRadius: 2.5,
                fontWeight: 800,
                textTransform: 'none',
                height: 38,
                px: 3,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)'
                },
                '&:disabled': {
                  background: 'rgba(255, 255, 255, 0.12)'
                }
              }}
            >
              {isAddingToDomain ? <CircularProgress size={20} color="inherit" /> : "Thêm vào Tên miền"}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
