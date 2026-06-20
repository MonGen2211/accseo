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
  InputLabel,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
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
  Stack
} from '@mui/material';
import Select from '../../../../components/SafeSelect';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import HistoryIcon from '@mui/icons-material/History';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TuneIcon from '@mui/icons-material/Tune';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StopIcon from '@mui/icons-material/Stop';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import { useToastify } from '../../../../components/Toastify';
import { format, isValid } from 'date-fns';
import { vbplSuggestionsService } from '../../vbplSuggestionsService';
import { TrendLineChart } from '../../../keywords/components/TrendLineChart';
import type { 
  CustomTrendSnapshotSummary, 
  CustomTrendSnapshotResponse, 
  CustomProjectGroup,
  CustomTrendSuggestionItem
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
      parentBaseName,
      baseName: parentBaseName,
      keywordsCount: payload.count || 20,
      timeRange: payload.timeRange || '3-m'
    } as any,
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

interface VbplSuggestionsGgTrendsProps {
  cartItems: any[];
  setCartItems: React.Dispatch<React.SetStateAction<any[]>>;
  cartMinimized: boolean;
  setCartMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  handleToggleCart: (itemOrString: any) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export default function VbplSuggestionsGgTrends({
  cartItems,
  setCartItems,
  cartMinimized,
  setCartMinimized,
  handleToggleCart,
  onLoadingChange
}: VbplSuggestionsGgTrendsProps) {
  const { showToast } = useToastify();

  // Custom AI Suggestions States & State Machine
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

  const progressModalOpenRef = useRef(progressModalOpen);
  useEffect(() => {
    progressModalOpenRef.current = progressModalOpen;
  }, [progressModalOpen]);

  // Report loading state to parent
  useEffect(() => {
    onLoadingChange?.(ctState.loading);
  }, [ctState.loading, onLoadingChange]);

  const customLogContainerRef = useRef<HTMLDivElement | null>(null);
  
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
      const result = await vbplSuggestionsService.getCustomTrendSuggestions(targetPage, 10);
      setCtSnapshots(result.items || []);
      setCtTotal(result.total || 0);
      setCtPage(result.page || 1);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || 'Lỗi khi tải danh sách dự án gợi ý', 'danger');
    } finally {
      setCtSnapshotsLoading(false);
    }
  };

  const fetchCustomSnapshotDetail = async (id: string) => {
    setCtSnapshotLoading(true);
    setCustomViewMode('detail');
    setSelectedSnapshotId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const detail = await vbplSuggestionsService.getCustomTrendSnapshot(id);
      setCtSnapshotDetail(detail);
      setEditingName(detail.name || '');
      setEditingDescription(detail.description || '');
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || 'Lỗi khi tải chi tiết dự án', 'danger');
    } finally {
      setCtSnapshotLoading(false);
    }
  };

  const handleDeleteCustomSnapshot = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản cào này không? Hành động này không thể hoàn tác.')) {
      return;
    }
    try {
      await vbplSuggestionsService.deleteCustomTrendSnapshot(id);
      showToast('Đã xóa bản cào thành công!', 'success');
      fetchCustomSnapshots(ctPage);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || 'Lỗi khi xóa bản cào', 'danger');
    }
  };

  const handleUpdateCustomSnapshot = async () => {
    const valName = editingName.trim();
    if (!valName) {
      showToast('Tên dự án không được để trống!', 'warning');
      return;
    }
    setEditLoading(true);
    try {
      await vbplSuggestionsService.patchCustomTrendSnapshot(editingSnapshotId, {
        name: valName,
        description: editingDescription.trim() || undefined
      });
      showToast('Cập nhật thông tin bản cào thành công!', 'success');
      setEditDialogOpen(false);
      fetchCustomSnapshots(ctPage);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || 'Lỗi khi cập nhật bản cào', 'danger');
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomSnapshots(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      
      {customViewMode === 'list' ? (
        /* ================= MODE: LIST VIEW (GROUP VIEW TREE) ================= */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
          
          {/* Background Running Banner */}
          {ctState.loading && !progressModalOpen && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '16px',
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
                  borderRadius: '100px',
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
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <PsychologyIcon sx={{ color: '#f59e0b', fontSize: '1.5rem' }} />
                <Typography variant="h6" sx={{ fontWeight: 850, color: 'text.primary' }}>
                  AI Gợi ý Chủ đề SEO Tự Chọn
                </Typography>
              </Stack>
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
                borderRadius: '100px', // M3 Pill Button
                textTransform: 'none',
                px: 3.5,
                py: 1,
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)', p: 1.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <TextField
              placeholder="Tìm nhanh dự án hoặc bản cào..."
              value={customSearchQuery}
              onChange={(e) => setCustomSearchQuery(e.target.value)}
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }
              }}
              sx={{
                maxWidth: 350,
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '28px', // M3 Search Input Radius
                  bgcolor: 'background.paper',
                  px: 2
                }
              }}
            />

            {/* Tiny pagination for custom snapshots */}
            {ctTotal > 10 && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button 
                  size="small" 
                  variant="outlined" 
                  disabled={ctPage <= 1}
                  onClick={() => fetchCustomSnapshots(ctPage - 1)}
                  sx={{ minWidth: 0, px: 2, py: 0.5, textTransform: 'none', borderRadius: '100px', fontWeight: 700, height: 32 }}
                >
                  Trước
                </Button>
                <Typography variant="caption" sx={{ fontWeight: 800 }}>
                  Trang {ctPage} / {Math.ceil(ctTotal / 10)}
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  disabled={ctPage >= Math.ceil(ctTotal / 10)}
                  onClick={() => fetchCustomSnapshots(ctPage + 1)}
                  sx={{ minWidth: 0, px: 2, py: 0.5, textTransform: 'none', borderRadius: '100px', fontWeight: 700, height: 32 }}
                >
                  Sau
                </Button>
              </Box>
            )}
          </Box>

          {/* Folder project list */}
          {ctSnapshotsLoading ? (
            <Box sx={{ py: 3 }}>
              {[1, 2].map((i) => (
                <Skeleton key={i} variant="rectangular" height={90} sx={{ borderRadius: '16px', mb: 2 }} />
              ))}
            </Box>
          ) : projectGroups.length === 0 ? (
            <Box sx={{ p: 7, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: '16px', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)' }}>
              <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic', fontWeight: 600 }}>
                {customSearchQuery ? 'Không tìm thấy dự án nào trùng khớp.' : 'Chưa có dự án gợi ý tự chọn nào. Hãy tạo dự án đầu tiên!'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
              {(() => {
                const query = customSearchQuery.toLowerCase().trim();
                const filteredGroups = projectGroups.filter((g) => {
                  if (!query) return true;
                  return g.baseName.toLowerCase().includes(query) || 
                         g.snapshots.some(s => s.name.toLowerCase().includes(query));
                });

                if (filteredGroups.length === 0) {
                  return (
                    <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: '16px', bgcolor: 'background.paper' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Không có kết quả khớp với tìm kiếm của bạn.
                      </Typography>
                      <Button 
                        size="small" 
                        onClick={() => setCustomSearchQuery('')} 
                        sx={{ borderRadius: '100px', textTransform: 'none', fontWeight: 600, mt: 1.5 }}
                      >
                        Xóa tìm kiếm
                      </Button>
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
                        borderRadius: '16px',
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
                        onClick={() => setExpandedGroups(prev => ({ ...prev, [group.baseName]: !isExpanded }))}
                        sx={{
                          p: 2.2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 2,
                          cursor: 'pointer',
                          bgcolor: (theme) => {
                            const isDark = theme.palette.mode === 'dark';
                            if (isExpanded) {
                              return isDark ? 'rgba(245, 158, 11, 0.04)' : 'rgba(245, 158, 11, 0.01)';
                            }
                            return 'transparent';
                          },
                          borderBottom: isExpanded ? '1px solid' : 'none',
                          borderColor: 'divider',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                          <Box sx={{ color: '#f59e0b', display: 'flex', alignItems: 'center' }}>
                            {isExpanded ? <FolderOpenIcon sx={{ fontSize: 26 }} /> : <FolderIcon sx={{ fontSize: 26 }} />}
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body1" sx={{ fontWeight: 850, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {group.baseName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Tổng số: {group.snapshots.length} bản cào phân tích
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }} onClick={(e) => e.stopPropagation()}>
                          {/* Run more details / Regen */}
                          {group.latestId && group.latestId !== 'temp-loading-id' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              startIcon={<RefreshIcon sx={{ fontSize: 13 }} />}
                              onClick={() => {
                                const latest = group.snapshots[0];
                                setRegenSourceId(group.latestId);
                                setRegenSourceName(group.baseName);
                                setRegenCount(20);
                                setRegenTimeRange(latest?.timeRange || '3-m');
                                setRegenModalOpen(true);
                              }}
                              sx={{ 
                                borderRadius: '100px', 
                                fontWeight: 800, 
                                textTransform: 'none',
                                height: 32,
                                px: 2,
                                borderColor: 'rgba(245, 158, 11, 0.4)',
                                color: '#f59e0b',
                                '&:hover': {
                                  borderColor: '#f59e0b',
                                  bgcolor: 'rgba(245, 158, 11, 0.04)'
                                }
                              }}
                            >
                              Cào mới (Regen)
                            </Button>
                          )}

                          <IconButton size="small" onClick={() => setExpandedGroups(prev => ({ ...prev, [group.baseName]: !isExpanded }))}>
                            {isExpanded ? <ExpandMoreIcon /> : <ExpandMoreIcon sx={{ transform: 'rotate(-90deg)' }} />}
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Snapshots Table list (Expanded view) */}
                      {isExpanded && (
                        <Box sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.005)' }}>
                          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)' }}>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Tên bản cào</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 130, textAlign: 'center' }}>Thời gian cào</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 130, textAlign: 'center' }}>Số đề xuất</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 140, textAlign: 'center' }}>Ngày tạo</TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 220, textAlign: 'center' }}>Thao tác</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {group.snapshots.map((s) => {
                                  const isTempLoading = s.isLoadingPlaceholder;
                                  
                                  return (
                                    <TableRow key={s.id} hover sx={{ ...(isTempLoading && { bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(245, 158, 11, 0.02)' }) }}>
                                      <TableCell>
                                        {isTempLoading ? (
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <CircularProgress size={16} sx={{ color: '#f59e0b' }} />
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#f59e0b' }}>
                                              {s.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontStyle: 'italic', opacity: 0.7, ml: 1 }}>
                                              ({s.stepMessage})
                                            </Typography>
                                          </Box>
                                        ) : (
                                          <Box>
                                            <Typography 
                                              variant="body2" 
                                              onClick={() => fetchCustomSnapshotDetail(s.id)}
                                              sx={{ fontWeight: 700, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                            >
                                              {s.name}
                                            </Typography>
                                            {s.description && (
                                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                {s.description}
                                              </Typography>
                                            )}
                                          </Box>
                                        )}
                                      </TableCell>
                                      <TableCell sx={{ textAlign: 'center', fontWeight: 600 }}>
                                        <Chip label={s.timeRange === '3-m' ? '3 tháng' : '1 tháng'} size="small" sx={{ fontWeight: 800, height: 20, bgcolor: 'action.selected', fontSize: '0.72rem' }} />
                                      </TableCell>
                                      <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: 'warning.main' }}>
                                        {isTempLoading ? '—' : s.suggestionsCount}
                                      </TableCell>
                                      <TableCell sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.82rem' }}>
                                        {s.fetchedAt ? formatDateStr(s.fetchedAt) : '—'}
                                      </TableCell>
                                      <TableCell sx={{ textAlign: 'center' }}>
                                        {isTempLoading ? (
                                          <Button
                                            size="small"
                                            variant="text"
                                            color="error"
                                            startIcon={<StopIcon />}
                                            onClick={stopCustomTrendSuggestionsStream}
                                            sx={{ fontWeight: 800, textTransform: 'none' }}
                                          >
                                            Dừng cào
                                          </Button>
                                        ) : (
                                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              onClick={() => fetchCustomSnapshotDetail(s.id)}
                                              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '100px', height: 28 }}
                                            >
                                              Chi tiết
                                            </Button>
                                            <IconButton 
                                              size="small" 
                                              color="info"
                                              onClick={() => {
                                                setEditingSnapshotId(s.id);
                                                setEditingName(s.name);
                                                setEditingDescription(s.description || '');
                                                setEditDialogOpen(true);
                                              }}
                                            >
                                              <EditIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={(e) => handleDeleteCustomSnapshot(s.id, e)}>
                                              <DeleteIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                          </Box>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
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
              sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '100px', px: 2, py: 0.8 }}
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
                  borderRadius: '16px', // M3 Card Radius
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
                            setEditingName(res.name);
                            setCtSnapshotDetail(prev => prev ? { ...prev, name: res.name } : null);
                          } catch (err: any) {
                            showToast(err.message || 'Lỗi cập nhật tên', 'danger');
                          } finally {
                            setIsEditingName(false);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            (e.target as any).blur();
                          }
                        }}
                        autoFocus
                        size="small"
                        sx={{ minWidth: 300 }}
                      />
                    ) : (
                      <>
                        <Typography variant="h5" sx={{ fontWeight: 850, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                          🚀 {ctSnapshotDetail.name}
                        </Typography>
                        <IconButton size="small" onClick={() => { setEditingName(ctSnapshotDetail.name); setIsEditingName(true); }}>
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </>
                    )}

                    <Chip 
                      label={ctSnapshotDetail.timeRange === '3-m' ? 'Google Trends 3 tháng' : 'Google Trends 1 tháng'} 
                      color="warning" 
                      variant="outlined" 
                      sx={{ fontWeight: 800, borderRadius: '100px' }} 
                    />
                  </Box>

                  {/* Sub-info summary */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)', p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700 }}>TỪ KHÓA GỐC ĐẦU VÀO</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.5, color: '#f59e0b' }}>
                        {ctSnapshotDetail.keywords?.join(', ') || 'Không có từ khóa gốc'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700 }}>NGÀY HOÀN THÀNH CÀO</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.5 }}>
                        {formatDateStr(ctSnapshotDetail.fetchedAt)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700 }}>TỔNG CHỦ ĐỀ SINH ĐƯỢC</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.5, color: 'primary.main' }}>
                        {ctSnapshotDetail.suggestions?.length || 0} chủ đề SEO
                      </Typography>
                    </Box>
                  </Box>

                  {ctSnapshotDetail.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', px: 0.5 }}>
                      Mô tả: {ctSnapshotDetail.description}
                    </Typography>
                  )}
                </Box>
              </Paper>

              {/* Action and detail results list */}
              {ctSnapshotDetail.suggestions && ctSnapshotDetail.suggestions.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  
                  {/* Results Sub-header with export actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.005)' : 'rgba(0,0,0,0.002)', p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        color="info"
                        size="small"
                        startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                        onClick={() => {
                          const query = customSearchQuery.toLowerCase().trim();
                          const filtered = ctSnapshotDetail.suggestions.filter(s => 
                            !query ||
                            s.name.toLowerCase().includes(query) || 
                            s.sourceKeyword.toLowerCase().includes(query) ||
                            s.reason.toLowerCase().includes(query)
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
                          const query = customSearchQuery.toLowerCase().trim();
                          const filtered = ctSnapshotDetail.suggestions.filter(s => 
                            !query ||
                            s.name.toLowerCase().includes(query) || 
                            s.sourceKeyword.toLowerCase().includes(query) ||
                            s.reason.toLowerCase().includes(query)
                          );
                          const isAllSelected = filtered.length > 0 && filtered.every(item => cartItems.some(k => k.name === item.name));
                          return isAllSelected ? "Bỏ chọn tất cả" : `Chọn cả trang (${filtered.length})`;
                        })()}
                      </Button>
                      <Button
                        variant="outlined"
                        color="success"
                        size="small"
                        startIcon={<ContentCopyIcon sx={{ fontSize: 13 }} />}
                        onClick={handleExportCustomTrendsExcel}
                        sx={{ borderRadius: '100px', fontWeight: 800, textTransform: 'none', height: 40, px: 2.5 }}
                      >
                        Xuất file CSV
                      </Button>
                    </Box>

                    {/* Inline search within suggestion detail */}
                    <TextField
                      placeholder="Lọc nhanh kết quả..."
                      value={customSearchQuery}
                      onChange={(e) => setCustomSearchQuery(e.target.value)}
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
                        maxWidth: 250,
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '28px',
                          bgcolor: 'background.paper',
                          px: 1.5
                        }
                      }}
                    />
                  </Box>

                  {/* Suggestion list display */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(() => {
                      const query = customSearchQuery.toLowerCase().trim();
                      const filtered = ctSnapshotDetail.suggestions.filter(s => 
                        !query ||
                        s.name.toLowerCase().includes(query) || 
                        s.sourceKeyword.toLowerCase().includes(query) ||
                        s.reason.toLowerCase().includes(query)
                      );

                      if (filtered.length === 0) {
                        return (
                          <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Không tìm thấy đề xuất chủ đề nào khớp với từ khóa lọc của bạn.
                            </Typography>
                          </Box>
                        );
                      }

                      return filtered.map((item, idx) => {
                        const isExpanded = customExpandedIndex === idx;
                        const inCart = cartItems.some(c => c.name === item.name);
                        
                        return (
                          <Paper
                            key={idx}
                            elevation={0}
                            sx={{
                              p: 2.5,
                              borderRadius: '16px',
                              border: '1px solid',
                              borderColor: isExpanded ? 'primary.main' : 'divider',
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
                                      label={`Seed: ${item.sourceKeyword}`} 
                                      size="small" 
                                      sx={{ fontWeight: 800, height: 20, bgcolor: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '100px' }} 
                                    />
                                    
                                    {item.scrape?.success ? (
                                      <>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                          Trends trung bình: <strong style={{ color: '#10b981' }}>{Math.round(item.scrape.avg ?? 0)}</strong>
                                        </Typography>
                                        
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                          Tốc độ tăng trưởng: <strong style={{ color: item.scrape.slope >= 0 ? '#10b981' : '#ef4444' }}>{item.scrape.slope >= 0 ? `+${Math.round(item.scrape.slope * 100)}%` : `${Math.round(item.scrape.slope * 100)}%`}</strong>
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
                                  onClick={() => setCustomExpandedIndex(isExpanded ? null : idx)}
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
                                          lastDate={ctSnapshotDetail?.fetchedAt ? formatDateStr(ctSnapshotDetail.fetchedAt) : undefined}
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
                      });
                    })()}
                  </Box>

                </Box>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Không có đề xuất nào trong bản cào này.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

        </Box>
      )}

      {/* ================= MODALS & DIALOGS ================= */}
      
      {/* Dialog: Quick inline rename snapshot */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Chỉnh sửa thông tin bản cào</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, minWidth: 350 }}>
            <TextField
              label="Tên dự án / bản cào"
              fullWidth
              size="small"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <TextField
              label="Mô tả dự án"
              fullWidth
              multiline
              rows={3}
              size="small"
              value={editingDescription}
              onChange={(e) => setEditingDescription(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ borderRadius: '100px', textTransform: 'none', fontWeight: 700 }}>Hủy</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleUpdateCustomSnapshot}
            disabled={editLoading}
            sx={{ borderRadius: '100px', textTransform: 'none', fontWeight: 800, px: 3 }}
          >
            {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Create New project form */}
      <Dialog 
        open={createModalOpen} 
        onClose={() => !ctState.loading && setCreateModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px' } }}
      >
        <DialogTitle sx={{ fontWeight: 850, borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
          🚀 Khởi Tạo Dự Án Gợi Ý Chủ Đề SEO Mới
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
            <TextField
              label="Tên nhóm / dự án (Ví dụ: Luật Đất Đai 2026)"
              placeholder="Dùng để nhóm các bản cào của cùng chủ đề"
              fullWidth
              size="small"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              label="Mô tả ngắn dự án"
              placeholder="Nhập ghi chú hoặc mục tiêu SEO của nhóm này"
              fullWidth
              size="small"
              value={inputDescription}
              onChange={(e) => setInputDescription(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                DANH SÁCH TỪ KHÓA HẠT GIỐNG (SEED KEYWORDS - TỐI ĐA 10 TỪ KHÓA)
              </Typography>
              
              {tagsInput.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                  {tagsInput.map((tag, idx) => (
                    <Chip
                      key={idx}
                      label={tag}
                      onDelete={() => setTagsInput(prev => prev.filter((_, i) => i !== idx))}
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
                  placeholder="Nhập từ khóa và nhấn Enter hoặc Dấu phẩy để thêm"
                  value={tagsText}
                  disabled={tagsInput.length >= 10}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.includes(',')) {
                      const parts = val.split(',').map(s => s.trim()).filter(Boolean);
                      const newTags = [...tagsInput];
                      parts.forEach(p => {
                        if (newTags.length < 10 && !newTags.includes(p)) {
                          newTags.push(p);
                        }
                      });
                      setTagsInput(newTags);
                      setTagsText('');
                    } else {
                      setTagsText(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = tagsText.trim();
                      if (trimmed && tagsInput.length < 10) {
                        if (!tagsInput.includes(trimmed)) {
                          setTagsInput([...tagsInput, trimmed]);
                        }
                        setTagsText('');
                      }
                    }
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const trimmed = tagsText.trim();
                    if (trimmed && tagsInput.length < 10 && !tagsInput.includes(trimmed)) {
                      setTagsInput([...tagsInput, trimmed]);
                    }
                    setTagsText('');
                  }}
                  disabled={!tagsText.trim() || tagsInput.length >= 10}
                  sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none', px: 2 }}
                >
                  Thêm
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.6, ml: 0.5 }}>
                Đã thêm: {tagsInput.length}/10 từ khóa hạt giống
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  SỐ ĐỀ XUẤT CẦN SINH (COUNT)
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={inputCount}
                    onChange={(e) => setInputCount(Number(e.target.value))}
                    sx={{ borderRadius: '12px' }}
                  >
                    {[5, 10, 20, 30, 40, 50].map(val => (
                      <MenuItem key={val} value={val}>{val} tiêu đề SEO</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  KHOẢNG THỜI GIAN TRENDS
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={inputTimeRange}
                    onChange={(e) => setInputTimeRange(e.target.value as any)}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="3-m">3 tháng qua (Gợi ý)</MenuItem>
                    <MenuItem value="1-m">1 tháng qua (Mới nhất)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setCreateModalOpen(false)} sx={{ borderRadius: '100px', textTransform: 'none', fontWeight: 700 }}>Hủy</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={async () => {
              const nameTrimmed = inputName.trim();
              let activeKeywords = [...tagsInput];
              const singleText = tagsText.trim().replace(/,$/, '');
              if (singleText) {
                if (!activeKeywords.includes(singleText) && activeKeywords.length < 10) {
                  activeKeywords.push(singleText);
                }
              }

              if (!nameTrimmed) {
                showToast('Vui lòng nhập tên dự án/nhóm!', 'warning');
                return;
              }
              if (activeKeywords.length === 0) {
                showToast('Vui lòng nhập ít nhất 1 từ khóa hạt giống!', 'warning');
                return;
              }

              setCreateModalOpen(false);
              // Bắt đầu SSE Stream cào dữ liệu
              await startCustomTrendSuggestionsStream(
                {
                  name: nameTrimmed,
                  description: inputDescription.trim() || undefined,
                  inputKeywords: activeKeywords,
                  count: inputCount,
                  timeRange: inputTimeRange
                },
                showToast,
                (snapshotId) => {
                  fetchCustomSnapshots(1);
                  fetchCustomSnapshotDetail(snapshotId);
                }
              );
            }}
            sx={{
              borderRadius: '100px',
              textTransform: 'none',
              fontWeight: 800,
              px: 3.5,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white'
            }}
          >
            Bắt đầu phân tích AI
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Regen Snapshot within project */}
      <Dialog 
        open={regenModalOpen} 
        onClose={() => !ctState.loading && setRegenModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px' } }}
      >
        <DialogTitle sx={{ fontWeight: 850, borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
          🔄 Cào Thêm Snapshot Gợi Ý Mới
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Tạo thêm 1 bản cào mới (snapshot) cho dự án <strong>"{regenSourceName}"</strong>. AI sẽ tham chiếu các đề xuất cũ để sinh ra bộ tiêu đề chủ đề mới tránh trùng lặp.
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  SỐ ĐỀ XUẤT CẦN SINH (COUNT)
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={regenCount}
                    onChange={(e) => setRegenCount(Number(e.target.value))}
                    sx={{ borderRadius: '12px' }}
                  >
                    {[5, 10, 20, 30, 40, 50].map(val => (
                      <MenuItem key={val} value={val}>{val} tiêu đề SEO</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  KHOẢNG THỜI GIAN TRENDS
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={regenTimeRange}
                    onChange={(e) => setRegenTimeRange(e.target.value as any)}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="3-m">3 tháng qua (Gợi ý)</MenuItem>
                    <MenuItem value="1-m">1 tháng qua (Mới nhất)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setRegenModalOpen(false)} sx={{ borderRadius: '100px', textTransform: 'none', fontWeight: 700 }}>Hủy</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={async () => {
              setRegenModalOpen(false);
              await startCustomTrendRegenStream(
                regenSourceId,
                regenSourceName,
                {
                  count: regenCount,
                  timeRange: regenTimeRange
                },
                showToast,
                (snapshotId) => {
                  fetchCustomSnapshots(1);
                  fetchCustomSnapshotDetail(snapshotId);
                }
              );
            }}
            sx={{
              borderRadius: '100px',
              textTransform: 'none',
              fontWeight: 800,
              px: 3.5,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white'
            }}
          >
            Tạo thêm (Regen)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Realtime Stream Progress Log */}
      <Dialog 
        open={progressModalOpen} 
        onClose={() => {
          // Chỉ cho đóng khi đã hoàn thành hoặc lỗi (loading = false)
          if (!ctState.loading) {
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
              Tiến Trình Phân Tích AI & Quét Google Trends
            </Typography>
          </Box>
          {!ctState.loading && (
            <IconButton onClick={() => setProgressModalOpen(false)}>
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1.5 }}>
            
            {/* Top overview status */}
            <Paper elevation={0} sx={{ p: 2.2, borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.002)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {ctState.loading ? '⚡ Hệ thống đang phân tích...' : '✅ Hoàn tất phân tích!'}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#f59e0b' }}>
                  Tiến độ: {ctState.currentProgressIndex} / {ctState.totalProgressItems} từ khóa
                </Typography>
              </Box>

              <LinearProgress 
                variant="determinate" 
                value={Math.round((ctState.currentProgressIndex / (ctState.totalProgressItems || 1)) * 100)} 
                color="warning" 
                sx={{ height: 8, borderRadius: 4, mb: 1.5 }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  <strong>Trạng thái:</strong> {ctState.currentStep}
                </Typography>
                {ctState.currentProgressItem && (
                  <Typography variant="caption" color="warning.main" sx={{ fontWeight: 700 }}>
                    Đang cào: "{ctState.currentProgressItem}"
                  </Typography>
                )}
              </Box>
            </Paper>

            {/* SSE Logs Output Section */}
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
                  ref={customLogContainerRef}
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
                  {ctState.logs.map((log, idx) => (
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

            {/* Note text during analysis */}
            {ctState.loading && (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', px: 1, textAlign: 'center', display: 'block' }}>
                ⚠️ Quá trình phân tích bao gồm việc khởi chạy Puppeteer để cào Trends trực tiếp từ Google, có thể mất từ 1 đến 3 phút tùy số lượng từ khóa. Bạn có thể ẩn cửa sổ này để làm việc khác, cào sẽ tiếp tục chạy ẩn ở nền.
              </Typography>
            )}

          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          {ctState.loading ? (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<StopIcon />}
                onClick={() => {
                  if (window.confirm('Bạn có thực sự muốn dừng tiến trình cào này lại không? Dữ liệu chưa quét xong sẽ không được lưu.')) {
                    stopCustomTrendSuggestionsStream();
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
                if (ctState.result) {
                  fetchCustomSnapshotDetail(ctState.result.id || ctState.result._id);
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
