import { useState, useEffect, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import MuiSelect from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import SearchIcon from '@mui/icons-material/Search';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import Collapse from '@mui/material/Collapse';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LinkIcon from '@mui/icons-material/Link';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useAppSelector } from '../../../app/store';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import OutlinedInput from '@mui/material/OutlinedInput';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import FormHelperText from '@mui/material/FormHelperText';
import Divider from '@mui/material/Divider';

import CustomTable from '../../../components/custom-table/CustomTable';
import type { TableField } from '../../../types/tableFields.types';
import type { TableRowData } from '../../../types/tableRows.types';
import { useToastify } from '../../../components/Toastify';
import { useDebounce } from '../../../hooks/useDebounce';
import { format, isValid } from 'date-fns';

const safeFormat = (dateStr: string | undefined | null, fmt: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return isValid(d) ? format(d, fmt) : '-';
};

import { scraperService } from '../scraperService';
import type { ScraperArticle, ScraperSummary, ScraperSchedule, VbplAiAutoConfig, VbplAiAutoFilterOptions, VbplAiAutoRunResult } from '../types';

const CRON_OPTIONS = [
  { value: '*/10 * * * *', label: 'Mỗi 10 phút một lần' },
  { value: '0 * * * *', label: 'Mỗi giờ một lần' },
  { value: '0 */2 * * *', label: 'Mỗi 2 giờ một lần' },
  { value: '0 */6 * * *', label: 'Mỗi 6 giờ một lần' },
  { value: '0 */12 * * *', label: 'Mỗi 12 giờ một lần' },
  { value: '0 0 * * *', label: 'Mỗi ngày lúc 00:00' },
  { value: '0 0 * * 0', label: 'Mỗi tuần vào Chủ Nhật' },
  { value: 'custom', label: 'Tùy chỉnh nâng cao...' }
];

const SITE_SOURCES = [
  { id: 'thuvienphapluat', name: 'thuvienphapluat.vn', desc: 'Chuyên trang văn bản & hỏi đáp', color: '#166534', bg: '#dcfce7' },
  { id: 'luatminhkhue', name: 'luatminhkhue.vn', desc: 'Tư vấn luật & tin tức đa ngành', color: '#1e40af', bg: '#dbeafe' },
  { id: 'luatduonggia', name: 'luatduonggia.vn', desc: 'Pháp luật tổng hợp', color: '#0f766e', bg: '#ccfbf1' },
  { id: 'luatvietnam', name: 'luatvietnam.vn', desc: 'Tin văn bản mới', color: '#0e7490', bg: '#cffafe' },
  { id: 'ketoananpha', name: 'ketoananpha.vn', desc: 'Kế toán - Thuế', color: '#be185d', bg: '#fce7f3' },
  { id: 'vbpl', name: 'vbpl.vn', desc: 'Văn bản pháp luật Bộ Tư pháp', color: '#b45309', bg: '#fef3c7' },
  { id: 'rss', name: 'Báo các loại', desc: 'Tin tức báo chí', color: '#4f46e5', bg: '#e0e7ff' },
];

const LEGAL_SECTORS = [
  'Tài chính', 'Tư pháp', 'Nội vụ', 'Thông tin và Truyền thông', 'Công thương', 
  'Y tế', 'Giáo dục và Đào tạo', 'Giao thông vận tải', 'Xây dựng', 
  'Tài nguyên và Môi trường', 'Nông nghiệp và Phát triển nông thôn', 
  'Lao động - Thương binh và Xã hội', 'Văn hóa, Thể thao và Du lịch', 
  'Công an', 'Quốc phòng', 'Ngoại giao'
];

const LEGAL_DOMAINS = [
  'Kế toán', 'Thuế - Phí - Lệ phí', 'Đất đai', 'Doanh nghiệp', 'Lao động - Tiền lương',
  'Hành chính', 'Hình sự', 'Dân sự', 'Bất động sản', 'Đầu tư', 'Thương mại'
];

const DOC_TYPES = [
  { code: 'TT', label: 'Thông tư (TT)' },
  { code: 'QD', label: 'Quyết định (QĐ)' },
  { code: 'ND', label: 'Nghị định (NĐ)' },
  { code: 'CV', label: 'Công văn (CV)' },
  { code: 'NQ', label: 'Nghị quyết (NQ)' },
  { code: 'L', label: 'Luật (L)' },
  { code: 'PL', label: 'Pháp lệnh (PL)' },
  { code: 'CT', label: 'Chỉ thị (CT)' }
];

const filterMenuProps = {
  variant: 'menu' as const,
  disableScrollLock: true,
  disableAutoFocusItem: true,
  anchorOrigin: {
    vertical: 'bottom' as const,
    horizontal: 'left' as const,
  },
  transformOrigin: {
    vertical: 'top' as const,
    horizontal: 'left' as const,
  },
  PaperProps: {
    style: {
      marginTop: 8,
    },
  },
};

function SafeSelect({ MenuProps, onChange, value, ...props }: React.ComponentProps<typeof MuiSelect>) {
  const [open, setOpen] = useState(false);
  const [openTime, setOpenTime] = useState(0);

  const handleOpen = (e: any) => {
    setOpenTime(Date.now());
    setOpen(true);
    if (props.onOpen) props.onOpen(e);
  };

  const handleClose = (e: any, reason?: string) => {
    if (Date.now() - openTime < 300) {
      return;
    }
    setOpen(false);
    if (props.onClose) props.onClose(e);
  };

  const handleChange = (e: any, child: any) => {
    if (Date.now() - openTime < 300) {
      return;
    }
    setOpen(false); // Close the select on valid selection
    if (onChange) onChange(e, child);
  };

  return (
    <MuiSelect
      {...props}
      value={value}
      open={open}
      onOpen={handleOpen}
      onClose={handleClose}
      onChange={handleChange}
      MenuProps={MenuProps}
    />
  );
}

const Select = SafeSelect;

export default function ScraperSection() {
  const { showToast } = useToastify();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.roles?.includes('ADMIN') || user?.role === 'ADMIN';

  // --- Active Site ---
  const [activeSite, setActiveSite] = useState<string>('thuvienphapluat');

  // --- Summary State ---
  const [summary, setSummary] = useState<ScraperSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // --- Filters State ---
  const [section, setSection] = useState('');
  const [tag, setTag] = useState('');
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [date, setDate] = useState('');
  const [q, setQ] = useState('');
  const [onlyNew, setOnlyNew] = useState(false);
  const [scope, setScope] = useState('');
  const [effStatusCode, setEffStatusCode] = useState('');
  const [nganh, setNganh] = useState('');
  const [linhVuc, setLinhVuc] = useState('');
  const [docTypeCode, setDocTypeCode] = useState('');
  const [sheetStatus, setSheetStatus] = useState('all');
  const [fullInfoStatus, setFullInfoStatus] = useState('all');
  const [showSectionDetails, setShowSectionDetails] = useState(false);
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);
  const [showTagDetails, setShowTagDetails] = useState(false);
  const [articleType, setArticleType] = useState<'all' | 'news' | 'document'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const activeAdvancedCount = useMemo(() => {
    let count = 0;
    if (activeSite !== 'vbpl') {
      if (sheetStatus !== 'all') count++;
    } else {
      if (fullInfoStatus !== 'all') count++;
      if (scope !== '') count++;
      if (effStatusCode !== '') count++;
      if (nganh !== '') count++;
      if (linhVuc !== '') count++;
      if (docTypeCode !== '') count++;
    }
    return count;
  }, [activeSite, sheetStatus, fullInfoStatus, scope, effStatusCode, nganh, linhVuc, docTypeCode]);
  const debouncedQ = useDebounce(q, 500);

  // --- Table State ---
  const [items, setItems] = useState<ScraperArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [loadingTable, setLoadingTable] = useState(false);

  // --- Manual Trigger State ---
  const [isTriggering, setIsTriggering] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // --- AI Keyword Generator State ---
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);

  // --- Schedule State ---
  const [schedule, setSchedule] = useState<ScraperSchedule | null>(null);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [cronInput, setCronInput] = useState('*/10 * * * *');
  const [cronPreset, setCronPreset] = useState('*/10 * * * *');
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);

  // --- VBPL Auto AI Config State ---
  const [autoConfig, setAutoConfig] = useState<VbplAiAutoConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<VbplAiAutoConfig | null>(null);
  const [autoFilterOptions, setAutoFilterOptions] = useState<VbplAiAutoFilterOptions | null>(null);
  const [loadingAutoConfig, setLoadingAutoConfig] = useState(false);
  const [savingAutoConfig, setSavingAutoConfig] = useState(false);
  const [runningAutoNow, setRunningAutoNow] = useState(false);

  // --- Export Excel Dialog State ---
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [downloadAllTime, setDownloadAllTime] = useState(true);
  const [downloadStartDate, setDownloadStartDate] = useState('');
  const [downloadEndDate, setDownloadEndDate] = useState('');
  const [downloadSection, setDownloadSection] = useState('');
  const [downloadTag, setDownloadTag] = useState('');
  const [downloadQ, setDownloadQ] = useState('');
  const [downloadScope, setDownloadScope] = useState('');
  const [downloadEffStatusCode, setDownloadEffStatusCode] = useState('');
  const [downloadNganh, setDownloadNganh] = useState('');
  const [downloadLinhVuc, setDownloadLinhVuc] = useState('');
  const [downloadDocTypeCode, setDownloadDocTypeCode] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleOpenDownloadDialog = () => {
    setDownloadStartDate('');
    setDownloadEndDate('');
    setDownloadAllTime(true);
    setDownloadSection(section);
    setDownloadTag(tag);
    setDownloadQ(q);
    setDownloadScope(scope);
    setDownloadEffStatusCode(effStatusCode);
    setDownloadNganh(nganh);
    setDownloadLinhVuc(linhVuc);
    setDownloadDocTypeCode(docTypeCode);
    setOpenDownloadDialog(true);
  };

  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      showToast('Đang tải dữ liệu và chuẩn bị file Excel, vui lòng đợi...', 'info');
      
      const data = await scraperService.getArticles({
        source: activeSite,
        section: downloadSection || undefined,
        tag: downloadTag || undefined,
        q: downloadQ || undefined,
        startDate: downloadAllTime ? undefined : (downloadStartDate || undefined),
        endDate: downloadAllTime ? undefined : (downloadEndDate || undefined),
        scope: activeSite === 'vbpl' && downloadScope ? downloadScope : undefined,
        effStatusCode: activeSite === 'vbpl' && downloadEffStatusCode ? downloadEffStatusCode : undefined,
        nganh: activeSite === 'vbpl' && downloadNganh ? downloadNganh : undefined,
        linhVuc: activeSite === 'vbpl' && downloadLinhVuc ? downloadLinhVuc : undefined,
        docTypeCode: activeSite === 'vbpl' && downloadDocTypeCode ? downloadDocTypeCode : undefined,
        page: 1,
        limit: 10000
      });

      if (!data.items || data.items.length === 0) {
        showToast('Không tìm thấy dữ liệu phù hợp với bộ lọc đã chọn!', 'warning');
        setIsDownloading(false);
        return;
      }

      const siteName = SITE_SOURCES.find(s => s.id === activeSite)?.name || activeSite;
      const cleanSiteName = siteName.replace(/\s+/g, '_');
      const dateSuffix = downloadAllTime
        ? 'ToanBo'
        : `${downloadStartDate || 'Dau'}_den_${downloadEndDate || 'Cuoi'}`;
      const filename = `${cleanSiteName}_Export_${dateSuffix}.csv`;

      const headers = [
        'Tiêu đề',
        'Đường dẫn',
        'Nguồn',
        'Mục',
        'Chủ đề/Từ khóa',
        'Thời gian',
        'Ảnh đại diện',
        'Mô tả/Tóm tắt',
      ];

      if (activeSite === 'vbpl') {
        headers.push(
          'Số hiệu',
          'Cơ quan ban hành',
          'Ngày ban hành',
          'Ngày hiệu lực',
          'Tình trạng hiệu lực',
          'Lĩnh vực',
          'Phạm vi',
          'Ngành',
          'Loại văn bản',
          'Ngày hết hiệu lực',
          'Ngày công khai',
          'Ngày cập nhật cuối',
          'Người ký',
          'Chức danh người ký',
          'Tổ chức',
          'Lượt xem'
        );
      }

      const rows = data.items.map(item => {
        const row = [
          item.title || '',
          item.url || '',
          SITE_SOURCES.find(s => s.id === item.source)?.name || item.source || '',
          item.section || '',
          item.category?.join(', ') || '',
          item.dateStr || (item.publishedAt ? safeFormat(item.publishedAt, 'dd/MM/yyyy HH:mm') : ''),
          item.thumbnailUrl || '',
          item.description || item.excerpt || '',
        ];

        if (activeSite === 'vbpl') {
          row.push(
            item.metadata?.docNumber || '',
            item.metadata?.issuingAgency || '',
            item.metadata?.issuedDate ? (item.metadata.issuedDate.includes('T') ? safeFormat(item.metadata.issuedDate, 'dd/MM/yyyy') : item.metadata.issuedDate) : '',
            item.metadata?.effectiveDate ? (item.metadata.effectiveDate.includes('T') ? safeFormat(item.metadata.effectiveDate, 'dd/MM/yyyy') : item.metadata.effectiveDate) : '',
            item.metadata?.effStatus || '',
            item.metadata?.linhVuc || '',
            item.metadata?.scope === 'TW' ? 'Trung ương' : item.metadata?.scope === 'DP' ? 'Địa phương' : item.metadata?.scope || '',
            item.metadata?.nganh || '',
            item.metadata?.docType || '',
            item.metadata?.expiredDate ? (item.metadata.expiredDate.includes('T') ? safeFormat(item.metadata.expiredDate, 'dd/MM/yyyy') : item.metadata.expiredDate) : '',
            item.metadata?.publicDate ? (item.metadata.publicDate.includes('T') ? safeFormat(item.metadata.publicDate, 'dd/MM/yyyy') : item.metadata.publicDate) : '',
            item.metadata?.updatedDate ? (item.metadata.updatedDate.includes('T') ? safeFormat(item.metadata.updatedDate, 'dd/MM/yyyy HH:mm') : item.metadata.updatedDate) : '',
            item.metadata?.signer || '',
            item.metadata?.signerTitle || '',
            item.metadata?.organizationName || '',
            item.metadata?.viewCount !== undefined ? String(item.metadata.viewCount) : ''
          );
        }

        return row.map(val => {
          const cleanVal = String(val).replace(/"/g, '""');
          return `"${cleanVal}"`;
        }).join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Đã tải xuống thành công ${data.items.length} dòng dữ liệu!`, 'success');
      setOpenDownloadDialog(false);
    } catch (err: unknown) {
      console.error(err);
      showToast('Đã xảy ra lỗi khi chuẩn bị file tải xuống', 'danger');
    } finally {
      setIsDownloading(false);
    }
  };

  // --- Load Data ---
  const loadSummary = async () => {
    setLoadingSummary(true);
    try {
      const data = await scraperService.getSummary({ 
        source: activeSite, 
        date,
        articleType: activeSite === 'luatvietnam' && articleType !== 'all' ? articleType : undefined
      });
      setSummary(data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast((err as { response?: { data?: { message?: string } } }).response?.data?.message || errMsg || 'Lỗi tải thống kê', 'danger');
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadTagsAndCategories = async () => {
    setLoadingTags(true);
    try {
      const data = await scraperService.getTags({ source: activeSite });
      setCategoriesList(data.categories || []);
      setTagsList(data.tags || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách chủ đề/tags:', err);
    } finally {
      setLoadingTags(false);
    }
  };


  const loadSchedule = async () => {
    try {
      const data = await scraperService.getSchedule();
      setSchedule(data);
      if (data?.cron) {
        setCronInput(data.cron);
        const isPreset = CRON_OPTIONS.some(o => o.value === data.cron);
        setCronPreset(isPreset ? data.cron : 'custom');
      }
    } catch (err) {
      console.error('Không tải được lịch schedule', err);
    }
  };

  const loadArticles = async (p: number, l: number) => {
    setLoadingTable(true);
    try {
      const data = await scraperService.getArticles({
        source: activeSite,
        section,
        tag,
        date,
        q: debouncedQ,
        onlyNew,
        scope: activeSite === 'vbpl' && scope ? scope : undefined,
        effStatusCode: activeSite === 'vbpl' && effStatusCode ? effStatusCode : undefined,
        nganh: activeSite === 'vbpl' && nganh ? nganh : undefined,
        linhVuc: activeSite === 'vbpl' && linhVuc ? linhVuc : undefined,
        docTypeCode: activeSite === 'vbpl' && docTypeCode ? docTypeCode : undefined,
        sheetStatus: activeSite === 'vbpl' ? undefined : (sheetStatus || undefined),
        fullInfoStatus: activeSite === 'vbpl' && fullInfoStatus ? fullInfoStatus : undefined,
        articleType: activeSite === 'luatvietnam' && articleType !== 'all' ? articleType : undefined,
        page: p + 1,
        limit: l
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast((err as { response?: { data?: { message?: string } } }).response?.data?.message || errMsg || 'Lỗi tải danh sách', 'danger');
    } finally {
      setLoadingTable(false);
    }
  };

  const loadVbplAutoConfig = useCallback(async () => {
    if (!isAdmin || activeSite !== 'vbpl') return;
    setLoadingAutoConfig(true);
    try {
      const [config, options] = await Promise.all([
        scraperService.getVbplAiAutoConfig(),
        scraperService.getVbplAiAutoFilterOptions()
      ]);
      setAutoConfig(config);
      setOriginalConfig(config);
      setAutoFilterOptions(options);
    } catch (err: unknown) {
      console.error('Lỗi tải cấu hình tự động VBPL:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      const resMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      showToast(resMsg || errMsg || 'Không thể tải cấu hình tự động VBPL', 'danger');
    } finally {
      setLoadingAutoConfig(false);
    }
  }, [isAdmin, activeSite, showToast]);

  useEffect(() => {
    if (activeSite === 'vbpl' && isAdmin) {
      loadVbplAutoConfig();
    }
  }, [activeSite, isAdmin, loadVbplAutoConfig]);

  const handleSaveVbplAutoConfig = async () => {
    if (!autoConfig || !originalConfig) return;

    // Validate array limits: scopes <= 2, others <= 20
    if (autoConfig.scopes && autoConfig.scopes.length > 2) {
      showToast('Phạm vi chọn tối đa 2 phần tử!', 'warning');
      return;
    }
    if (autoConfig.effStatusCodes && autoConfig.effStatusCodes.length > 20) {
      showToast('Tình trạng hiệu lực chọn tối đa 20 phần tử!', 'warning');
      return;
    }
    if (autoConfig.docTypeCodes && autoConfig.docTypeCodes.length > 20) {
      showToast('Loại văn bản chọn tối đa 20 phần tử!', 'warning');
      return;
    }
    if (autoConfig.nganhs && autoConfig.nganhs.length > 20) {
      showToast('Ngành quản lý chọn tối đa 20 phần tử!', 'warning');
      return;
    }
    if (autoConfig.linhVucs && autoConfig.linhVucs.length > 20) {
      showToast('Lĩnh vực chọn tối đa 20 phần tử!', 'warning');
      return;
    }

    setSavingAutoConfig(true);
    try {
      const payload: Partial<VbplAiAutoConfig> = {};
      
      // Compute diff
      if (autoConfig.enabled !== originalConfig.enabled) {
        payload.enabled = autoConfig.enabled;
      }
      
      const arraysEqual = (a: any[], b: any[]) => {
        if (!a && !b) return true;
        if (!a || !b) return false;
        if (a.length !== b.length) return false;
        return a.every((val, index) => val === b[index]);
      };
      
      if (!arraysEqual(autoConfig.scopes || [], originalConfig.scopes || [])) {
        payload.scopes = autoConfig.scopes;
      }
      if (!arraysEqual(autoConfig.effStatusCodes || [], originalConfig.effStatusCodes || [])) {
        payload.effStatusCodes = autoConfig.effStatusCodes;
      }
      if (!arraysEqual(autoConfig.docTypeCodes || [], originalConfig.docTypeCodes || [])) {
        payload.docTypeCodes = autoConfig.docTypeCodes;
      }
      if (!arraysEqual(autoConfig.nganhs || [], originalConfig.nganhs || [])) {
        payload.nganhs = autoConfig.nganhs;
      }
      if (!arraysEqual(autoConfig.linhVucs || [], originalConfig.linhVucs || [])) {
        payload.linhVucs = autoConfig.linhVucs;
      }

      if (Object.keys(payload).length === 0) {
        showToast('Không có thay đổi nào để lưu!', 'warning');
        setSavingAutoConfig(false);
        return;
      }

      const res = await scraperService.updateVbplAiAutoConfig(payload);
      showToast(res.message || 'Cập nhật cấu hình tự động đẩy thông tin VBPL lên Sheet thành công!', 'success');
      setAutoConfig(res.data);
      setOriginalConfig(res.data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const resMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      showToast(resMsg || errMsg || 'Lỗi khi lưu cấu hình tự động đẩy thông tin VBPL lên Sheet', 'danger');
    } finally {
      setSavingAutoConfig(false);
    }
  };

  const handleRunVbplAutoNow = async () => {
    if (!autoConfig) return;

    // Validate array limits: scopes <= 2, others <= 20
    if (autoConfig.scopes && autoConfig.scopes.length > 2) {
      showToast('Phạm vi chọn tối đa 2 phần tử!', 'warning');
      return;
    }
    if (autoConfig.effStatusCodes && autoConfig.effStatusCodes.length > 20) {
      showToast('Tình trạng hiệu lực chọn tối đa 20 phần tử!', 'warning');
      return;
    }
    if (autoConfig.docTypeCodes && autoConfig.docTypeCodes.length > 20) {
      showToast('Loại văn bản chọn tối đa 20 phần tử!', 'warning');
      return;
    }
    if (autoConfig.nganhs && autoConfig.nganhs.length > 20) {
      showToast('Ngành quản lý chọn tối đa 20 phần tử!', 'warning');
      return;
    }
    if (autoConfig.linhVucs && autoConfig.linhVucs.length > 20) {
      showToast('Lĩnh vực chọn tối đa 20 phần tử!', 'warning');
      return;
    }

    setRunningAutoNow(true);
    try {
      const payload = {
        scopes: autoConfig.scopes,
        effStatusCodes: autoConfig.effStatusCodes,
        docTypeCodes: autoConfig.docTypeCodes,
        nganhs: autoConfig.nganhs,
        linhVucs: autoConfig.linhVucs
      };
      const res = await scraperService.runVbplAiAutoNow(payload);
      if (res.data.started) {
        showToast(res.message || 'Đã bắt đầu kích hoạt chạy thủ công đẩy VBPL lên Sheet! Vui lòng đợi...', 'success');
        setAutoConfig(prev => prev ? { ...prev, isRunning: true } : null);
      } else {
        showToast(res.message || 'Đang có một tiến trình tự động đẩy VBPL lên Sheet khác đang chạy trong nền, vui lòng đợi!', 'warning');
      }
      
      // Reload config immediately to show the isRunning: true status
      const config = await scraperService.getVbplAiAutoConfig();
      setAutoConfig(config);
      setOriginalConfig(config);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const resMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      showToast(resMsg || errMsg || 'Lỗi khi chạy thử tự động đẩy VBPL lên Sheet', 'danger');
    } finally {
      setRunningAutoNow(false);
    }
  };

  useEffect(() => {
    let timer: any = null;
    if (activeSite === 'vbpl' && isAdmin && autoConfig?.isRunning) {
      timer = setInterval(async () => {
        try {
          const config = await scraperService.getVbplAiAutoConfig();
          setAutoConfig(config);
          if (!config.isRunning) {
            setOriginalConfig(config);
            showToast('Tiến trình tự động đẩy VBPL lên Sheet chạy nền đã hoàn tất!', 'success');
          }
        } catch (err) {
          console.error('Lỗi khi poll cấu hình tự động:', err);
        }
      }, 3000); // Poll every 3 seconds
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeSite, isAdmin, autoConfig?.isRunning, showToast]);

  const notifications = useAppSelector((state) => state.notifications.items);
  useEffect(() => {
    if (activeSite === 'vbpl' && isAdmin) {
      const hasAutoDisabledNotif = notifications.some(
        n => n.type === 'VBPL_AUTO_EXPORT_DISABLED' && !n.isRead
      );
      if (hasAutoDisabledNotif) {
        loadVbplAutoConfig();
      }
    }
  }, [notifications, activeSite, isAdmin, loadVbplAutoConfig]);

  useEffect(() => {
    Promise.resolve().then(() => {
      setSection('');
      setTag('');
      setDate('');
      setQ('');
      setOnlyNew(false);
      setScope('');
      setEffStatusCode('');
      setNganh('');
      setLinhVuc('');
      setDocTypeCode('');
      setSheetStatus('all');
      setFullInfoStatus('all');
      setArticleType('all');
      setShowSectionDetails(false);
      setShowCategoryDetails(false);
      setShowTagDetails(false);
      setCategoriesList([]);
      setTagsList([]);
      loadSchedule();
      loadTagsAndCategories();
    });
  }, [activeSite]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadSummary();
      loadArticles(0, limit);
      setPage(0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSite, section, tag, date, debouncedQ, onlyNew, scope, effStatusCode, nganh, linhVuc, docTypeCode, sheetStatus, fullInfoStatus, articleType]);

  // --- Handlers ---
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadArticles(newPage, limit);
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
    loadArticles(0, newLimit);
  };

  const handleTriggerScrape = () => {
    const siteName = SITE_SOURCES.find(s => s.id === activeSite)?.name || 'nguồn này';
    showToast(`Đã chạy cào ngầm dữ liệu từ ${siteName}. Tiến trình cào có thể chạy đến 20 phút.`, 'success');
    
    const startTime = Date.now();
    scraperService.triggerManualScrape(activeSite)
      .then((res) => {
        showToast(res.message || `Cào bài từ ${siteName} hoàn thành!`, 'success');
        loadSummary();
        loadArticles(0, limit);
        loadTagsAndCategories();
      })
      .catch((err: unknown) => {
        console.error(`Lỗi cào ngầm từ ${siteName}:`, err);
        const duration = Date.now() - startTime;
        // Chỉ hiện thông báo lỗi nếu lỗi xảy ra nhanh (dưới 10 giây) để tránh thông báo timeout muộn gây bối rối
        if (duration < 10000) {
          const errMsg = err instanceof Error ? err.message : String(err);
          showToast((err as { response?: { data?: { message?: string } } }).response?.data?.message || errMsg || 'Lỗi khi cào bài', 'danger');
        }
      });
  };

  const handleUpdateSchedule = async () => {
    setIsUpdatingSchedule(true);
    try {
      const res = await scraperService.updateSchedule(cronInput);
      showToast(res.message || 'Cập nhật lịch thành công', 'success');
      setOpenScheduleDialog(false);
      loadSchedule();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast((err as { response?: { data?: { message?: string } } }).response?.data?.message || errMsg || 'Lỗi cập nhật lịch', 'danger');
    } finally {
      setIsUpdatingSchedule(false);
    }
  };

  const handleToggleSchedule = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsUpdatingSchedule(true);
    try {
      if (isChecked) {
        await scraperService.updateSchedule(cronInput);
        showToast('Đã bật lịch tự động', 'success');
      } else {
        await scraperService.deleteSchedule();
        showToast('Đã tắt lịch tự động', 'success');
      }
      loadSchedule();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast((err as { response?: { data?: { message?: string } } }).response?.data?.message || errMsg || 'Lỗi khi thay đổi trạng thái', 'danger');
    } finally {
      setIsUpdatingSchedule(false);
    }
  };

  // --- AI Keyword Generator Handlers ---
  const handleAiError = useCallback((err: unknown) => {
    const errorData = (err as { response?: { data?: { code?: string; message?: string } } }).response?.data;
    const code = errorData?.code || '';
    const message = errorData?.message || (err instanceof Error ? err.message : String(err)) || 'Lỗi không xác định';

    switch (code) {
      case 'INVALID_ARTICLE_ID':
        showToast('ID bài viết không hợp lệ', 'danger');
        break;
      case 'ARTICLE_NOT_FOUND':
        showToast('Không tìm thấy bài viết', 'danger');
        break;
      case 'AI_GENERATE_LOCKED':
        showToast('Đang xử lý bài này, đợi vài giây rồi thử lại', 'warning');
        break;
      case 'AI_RATE_LIMIT':
        showToast('AI hết quota tạm thời, thử lại sau vài phút', 'danger');
        break;
      case 'AI_INVALID_RESPONSE':
        showToast('AI trả về format lỗi, thử lại', 'danger');
        break;
      case 'SHEETS_APPS_SCRIPT_NOT_CONFIGURED':
        showToast('Hệ thống Sheet chưa cấu hình, liên hệ admin', 'danger');
        break;
      case 'SHEETS_PUSH_FAILED':
        showToast('Đẩy Sheet thất bại sau nhiều lần thử, thử lại', 'danger');
        break;
      case 'AI_GENERATE_FAILED':
        showToast(message, 'danger');
        break;
      default:
        showToast(message, 'danger');
    }
  }, [showToast]);

  const handleAiGenerate = useCallback(async (article: ScraperArticle, force = false) => {
    setAiLoadingId(article._id);
    try {
      const res = await scraperService.aiGenerate(article._id, force);
      
      const updatedArticle = {
        ...article,
        sheetUrl: res.data.sheetUrl,
        sheetPushedAt: res.data.sheetPushedAt,
        sheetLastBatch: res.data.batchNumber
      };
      
      setItems(prev => prev.map(item => item._id === article._id ? updatedArticle : item));
      
      if (res.cached) {
        showToast(`Đã push lên Sheet · Batch #${res.data.batchNumber} (Dữ liệu từ cache)`, 'success');
      } else {
        showToast(`Đã tạo ${res.data.keywordCount} từ khóa và push lên Sheet · Batch #${res.data.batchNumber}`, 'success');
      }
    } catch (err: unknown) {
      handleAiError(err);
    } finally {
      setAiLoadingId(null);
    }
  }, [handleAiError, showToast]);


  const handleResetSourceAiState = async (source: string) => {
    const siteName = SITE_SOURCES.find(s => s.id === source)?.name || source;
    if (!window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn reset trạng thái AI/Sheet cho TOÀN BỘ bài viết thuộc nguồn "${siteName}"? Hành động này không thể hoàn tác.`)) {
      return;
    }
    setLoadingTable(true);
    try {
      const res = await scraperService.resetAiState(source);
      showToast(res.message || `Đã reset trạng thái cho toàn bộ bài viết nguồn ${siteName}!`, 'success');
      loadArticles(0, limit);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast((err as { response?: { data?: { message?: string } } }).response?.data?.message || errMsg || 'Lỗi khi reset trạng thái nguồn', 'danger');
    } finally {
      setLoadingTable(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchGenerating(true);
    
    let successCount = 0;
    let failCount = 0;
    const totalCount = selectedIds.length;

    try {
      for (let i = 0; i < totalCount; i++) {
        const id = selectedIds[i];
        const article = items.find(item => item._id === id);
        if (!article) continue;

        // Bỏ qua nếu đã có sheetUrl
        if (article.sheetUrl) {
          successCount++;
          continue;
        }

        showToast(`[Batch AI] Đang xử lý bài ${i + 1}/${totalCount}...`, 'info');
        setAiLoadingId(article._id);
        
        try {
          const res = await scraperService.aiGenerate(article._id, false);
          
          const updatedArticle = {
            ...article,
            sheetUrl: res.data.sheetUrl,
            sheetPushedAt: res.data.sheetPushedAt,
            sheetLastBatch: res.data.batchNumber
          };
          
          setItems(prev => prev.map(item => item._id === article._id ? updatedArticle : item));
          successCount++;
        } catch (err: unknown) {
          console.error(`Error generating AI for ${article._id}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        showToast(`Đã hoàn tất! Thành công: ${successCount}/${totalCount} bài.`, 'success');
      }
      if (failCount > 0) {
        showToast(`Thất bại: ${failCount}/${totalCount} bài. Vui lòng kiểm tra lại.`, 'error');
      }
      
      setSelectedIds([]);
    } catch (err) {
      console.error('Batch generation error:', err);
      showToast('Đã xảy ra lỗi khi tạo hàng loạt.', 'error');
    } finally {
      setAiLoadingId(null);
      setIsBatchGenerating(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      setSelectedIds([]);
    });
  }, [activeSite, page, section, tag, date, q, scope, effStatusCode, nganh, linhVuc, docTypeCode]);


  const renderInlineAiKeywords = useCallback((item: ScraperArticle) => {
    const isGenerating = aiLoadingId === String(item._id);
    const sheetUrl = item.sheetUrl;
    const sheetLastBatch = item.sheetLastBatch;

    if (isGenerating) {
      return (
        <Tooltip title="Đang gọi AI & push Sheet... (5-15s)">
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              py: 0.25,
              px: 1.25,
              borderRadius: 10,
              border: '1px solid rgba(0, 184, 148, 0.4)',
              bgcolor: 'rgba(0, 184, 148, 0.08)',
              color: '#00b894',
              fontSize: '0.725rem',
              fontWeight: 700,
              height: 22,
              whiteSpace: 'nowrap',
              width: 'fit-content'
            }}
          >
            <CircularProgress size={12} sx={{ color: '#00b894' }} />
            Đang tạo từ khóa AI...
          </Box>
        </Tooltip>
      );
    }

    if (sheetUrl) {
      return (
        <Tooltip title={`Đã push Sheet (Batch #${sheetLastBatch || 1}) · Click để mở Google Sheet`} onClick={(e) => e.stopPropagation()}>
          <Button
            size="small"
            startIcon={<LinkIcon sx={{ fontSize: 13 }} />}
            onClick={(e) => {
              e.stopPropagation();
              window.open(sheetUrl, '_blank', 'noopener,noreferrer');
            }}
            sx={{
              py: 0.25,
              px: 1.25,
              borderRadius: 10,
              border: '1px solid rgba(16, 185, 129, 0.5)',
              bgcolor: 'rgba(16, 185, 129, 0.05)',
              color: '#10b981',
              fontWeight: 700,
              fontSize: '0.725rem',
              minWidth: 0,
              height: 22,
              textTransform: 'none',
              opacity: 0.7,
              transition: 'all 0.2s ease-in-out',
              '.MuiTableRow-root:hover &': {
                opacity: 0.95
              },
              '&:hover': {
                opacity: '1 !important',
                bgcolor: 'rgba(16, 185, 129, 0.12)',
                borderColor: '#10b981',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
              }
            }}
          >
            Mở Google Sheet
          </Button>
        </Tooltip>
      );
    }

    // Default/Not generated: Subtle, low-opacity button with sparkle
    return (
      <Tooltip title="Tự động tạo từ khóa SEO & đẩy Google Sheet" onClick={(e) => e.stopPropagation()}>
        <Button
          size="small"
          startIcon={<AutoAwesomeIcon sx={{ fontSize: 13 }} />}
          onClick={(e) => {
            e.stopPropagation();
            handleAiGenerate(item, false);
          }}
          disabled={aiLoadingId !== null}
          sx={{
            py: 0.25,
            px: 1.25,
            borderRadius: 10,
            border: '1px solid rgba(0, 184, 148, 0.5)',
            bgcolor: 'rgba(0, 184, 148, 0.05)',
            color: '#00b894',
            fontWeight: 700,
            fontSize: '0.725rem',
            minWidth: 0,
            height: 22,
            textTransform: 'none',
            whiteSpace: 'nowrap',
            opacity: 0.7,
            transition: 'all 0.2s ease-in-out',
            '.MuiTableRow-root:hover &': {
              opacity: 0.95
            },
            '&:hover': {
              opacity: '1 !important',
              bgcolor: 'rgba(0, 184, 148, 0.12)',
              borderColor: '#00b894',
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 8px rgba(0, 184, 148, 0.25)'
            },
            '&.Mui-disabled': {
              borderColor: 'rgba(0, 184, 148, 0.15)',
              bgcolor: 'rgba(0, 184, 148, 0.01)',
              color: 'rgba(0, 184, 148, 0.3)',
              opacity: 0.2
            }
          }}
        >
          Tạo từ khóa AI
        </Button>
      </Tooltip>
    );
  }, [aiLoadingId, handleAiGenerate]);

  const renderInlineVbplFullInfoStatus = useCallback((item: ScraperArticle) => {
    const pushed = item.fullInfoPushedAt;
    const sheetUrl = item.fullInfoSheetUrl;

    if (pushed) {
      return (
        <Tooltip title={`Đã đẩy đầy đủ thông tin VBPL lên Google Sheet lúc ${safeFormat(pushed, 'dd/MM/yyyy HH:mm:ss')} · Click để xem trên Sheet`} onClick={(e) => e.stopPropagation()}>
          <Button
            size="small"
            startIcon={<CloudDoneIcon sx={{ fontSize: 13 }} />}
            onClick={(e) => {
              e.stopPropagation();
              if (sheetUrl) {
                window.open(sheetUrl, '_blank', 'noopener,noreferrer');
              }
            }}
            sx={{
              py: 0.25,
              px: 1.25,
              borderRadius: 10,
              border: '1px solid rgba(59, 130, 246, 0.5)',
              bgcolor: 'rgba(59, 130, 246, 0.05)',
              color: '#3b82f6',
              fontWeight: 700,
              fontSize: '0.725rem',
              minWidth: 0,
              height: 22,
              textTransform: 'none',
              opacity: 0.7,
              transition: 'all 0.2s ease-in-out',
              '.MuiTableRow-root:hover &': {
                opacity: 0.95
              },
              '&:hover': {
                opacity: '1 !important',
                bgcolor: 'rgba(59, 130, 246, 0.12)',
                borderColor: '#3b82f6',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
              }
            }}
          >
            Đã push (Full VBPL)
          </Button>
        </Tooltip>
      );
    }

    return (
      <Tooltip title="Chưa đẩy đầy đủ thông tin VBPL lên Google Sheet" onClick={(e) => e.stopPropagation()}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            py: 0.25,
            px: 1.25,
            borderRadius: 10,
            border: '1px solid rgba(156, 163, 175, 0.3)',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            color: 'text.secondary',
            fontSize: '0.725rem',
            fontWeight: 700,
            height: 22,
            whiteSpace: 'nowrap',
            width: 'fit-content'
          }}
        >
          <CloudUploadOutlinedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
          Chưa push VBPL
        </Box>
      </Tooltip>
    );
  }, []);

  // --- Columns ---
  const columns = useMemo<TableField[]>(() => {
    const selectionColumn = {
      id: 'selection',
      name: 'selection',
      label: (
        <Checkbox
          size="small"
          checked={
            items.length > 0 && 
            items.filter(item => !item.sheetUrl).length > 0 && 
            selectedIds.length === items.filter(item => !item.sheetUrl).length
          }
          indeterminate={
            selectedIds.length > 0 && 
            selectedIds.length < items.filter(item => !item.sheetUrl).length
          }
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds(items.filter(item => !item.sheetUrl).map(item => String(item._id)));
            } else {
              setSelectedIds([]);
            }
          }}
          sx={{ 
            p: 0, 
            color: 'rgba(0, 184, 148, 0.4)',
            '&.Mui-checked': { color: '#00b894' },
            '&.MuiCheckbox-indeterminate': { color: '#00b894' }
          }}
        />
      ),
      width: 50,
      renderCell: (row: TableRowData) => {
        const item = row as unknown as ScraperArticle;
        
        // Hide checkbox if already generated & pushed to Google Sheet
        if (item.sheetUrl) {
          return null;
        }

        const isChecked = selectedIds.includes(String(item._id));
        return (
          <Checkbox
            size="small"
            checked={isChecked}
            onChange={(e) => {
              e.stopPropagation();
              if (e.target.checked) {
                setSelectedIds(prev => [...prev, String(item._id)]);
              } else {
                setSelectedIds(prev => prev.filter(id => id !== String(item._id)));
              }
            }}
            sx={{ 
              p: 0,
              color: 'rgba(0, 184, 148, 0.3)',
              '&.Mui-checked': { color: '#00b894' }
            }}
          />
        );
      }
    };

    if (activeSite === 'vbpl') {
      return [
        selectionColumn,
        {
          id: 'title',
          name: 'title',
          label: 'Tiêu đề',
          width: '35%',
          wrapText: true,
          renderCell: (row: TableRowData) => {
            const item = row as unknown as ScraperArticle;
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {item.isNew && (
                    <Chip
                      label="MỚI"
                      size="small"
                      color="error"
                      sx={{
                        height: 18,
                        fontSize: '0.675rem',
                        fontWeight: 800,
                        px: 0.5,
                        borderRadius: 1,
                        background: 'linear-gradient(45deg, #ef4444, #f87171)',
                        boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
                        animation: 'pulse 1.8s infinite alternate',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)', boxShadow: '0 0 4px rgba(239, 68, 68, 0.4)' },
                          '100%': { transform: 'scale(1.05)', boxShadow: '0 0 12px rgba(239, 68, 68, 0.8)' }
                        }
                      }}
                    />
                  )}

                  {/* Scope Badge */}
                  {item.metadata?.scope && (
                    <Chip
                      label={item.metadata.scope === 'TW' ? 'Trung ương' : item.metadata.scope === 'DP' ? 'Địa phương' : item.metadata.scope}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.675rem',
                        fontWeight: 700,
                        borderRadius: 1,
                        bgcolor: item.metadata.scope === 'TW' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: item.metadata.scope === 'TW' ? '#3b82f6' : '#10b981',
                        border: '1px solid',
                        borderColor: item.metadata.scope === 'TW' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                      }}
                    />
                  )}

                  {/* Status Badge */}
                  {item.metadata?.effStatus && (
                    <Chip
                      label={item.metadata.effStatus}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.675rem',
                        fontWeight: 700,
                        borderRadius: 1,
                        bgcolor: 
                          item.metadata.effStatusCode === 'CCHL' ? 'rgba(245, 158, 11, 0.15)' : 
                          item.metadata.effStatusCode === 'CHL' ? 'rgba(16, 185, 129, 0.15)' : 
                          item.metadata.effStatusCode === 'HHL' ? 'rgba(107, 114, 128, 0.15)' : 
                          'rgba(107, 114, 128, 0.12)',
                        color: 
                          item.metadata.effStatusCode === 'CCHL' ? '#f59e0b' : 
                          item.metadata.effStatusCode === 'CHL' ? '#10b981' : 
                          item.metadata.effStatusCode === 'HHL' ? '#6b7280' : 
                          '#6b7280',
                        border: '1px solid',
                        borderColor: 
                          item.metadata.effStatusCode === 'CCHL' ? 'rgba(245, 158, 11, 0.3)' : 
                          item.metadata.effStatusCode === 'CHL' ? 'rgba(16, 185, 129, 0.3)' : 
                          item.metadata.effStatusCode === 'HHL' ? 'rgba(107, 114, 128, 0.3)' : 
                          'rgba(107, 114, 128, 0.2)',
                      }}
                    />
                  )}
                </Box>

                <Link 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  sx={{ 
                    color: 'primary.main', 
                    fontWeight: 600, 
                    textDecoration: 'none', 
                    lineHeight: 1.4,
                    fontSize: '0.9rem',
                    '&:hover': { textDecoration: 'underline' } 
                  }}
                >
                  {item.title}
                </Link>
                <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {renderInlineAiKeywords(item)}
                  {renderInlineVbplFullInfoStatus(item)}
                </Box>
              </Box>
            );
          }
        },
        {
          id: 'issuingAgency',
          name: 'issuingAgency',
          label: 'Cơ quan ban hành',
          width: 180,
          renderCell: (row: TableRowData) => {
            const item = row as unknown as ScraperArticle;
            return (
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {item.metadata?.issuingAgency || '-'}
              </Typography>
            );
          }
        },
        {
          id: 'linhVuc',
          name: 'linhVuc',
          label: 'Lĩnh vực',
          width: 160,
          renderCell: (row: TableRowData) => {
            const item = row as unknown as ScraperArticle;
            return (
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                {item.metadata?.linhVuc || '-'}
              </Typography>
            );
          }
        },
        {
          id: 'effStatus',
          name: 'effStatus',
          label: 'Hiệu lực',
          width: 150,
          renderCell: (row: TableRowData) => {
            const item = row as unknown as ScraperArticle;
            const code = item.metadata?.effStatusCode;
            return (
              <Chip
                label={item.metadata?.effStatus || '-'}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  bgcolor: 
                    code === 'CHL' ? 'rgba(16, 185, 129, 0.12)' : 
                    code === 'CCHL' ? 'rgba(245, 158, 11, 0.12)' : 
                    code === 'HHL' ? 'rgba(107, 114, 128, 0.12)' : 
                    'rgba(107, 114, 128, 0.08)',
                  color: 
                    code === 'CHL' ? '#10b981' : 
                    code === 'CCHL' ? '#f59e0b' : 
                    code === 'HHL' ? '#6b7280' : 
                    '#6b7280',
                  border: '1px solid',
                  borderColor: 
                    code === 'CHL' ? 'rgba(16, 185, 129, 0.2)' : 
                    code === 'CCHL' ? 'rgba(245, 158, 11, 0.2)' : 
                    code === 'HHL' ? 'rgba(107, 114, 128, 0.2)' : 
                    'rgba(107, 114, 128, 0.15)',
                }}
              />
            );
          }
        },
        {
          id: 'dates',
          name: 'dates',
          label: 'Ngày ban hành / hiệu lực',
          width: 200,
          renderCell: (row: TableRowData) => {
            const item = row as unknown as ScraperArticle;
            const issued = item.metadata?.issuedDate;
            const effective = item.metadata?.effectiveDate;
            
            const formatVal = (val: string | undefined) => {
              if (!val) return '-';
              return val.includes('T') ? safeFormat(val, 'dd/MM/yyyy') : val;
            };

            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Ban hành: <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{formatVal(issued)}</Box>
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Hiệu lực: <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{formatVal(effective)}</Box>
                </Typography>
              </Box>
            );
          }
        }
      ];
    } else {
      return [
        selectionColumn,
        {
          id: 'title',
          name: 'title',
          label: 'Tiêu đề',
          width: 550,
          renderCell: (row: TableRowData) => {
            const item = row as unknown as ScraperArticle;
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {item.thumbnailUrl && (
                  <Box
                    component="img"
                    src={item.thumbnailUrl}
                    alt={item.title}
                    sx={{
                      width: 64,
                      height: 48,
                      objectFit: 'cover',
                      borderRadius: 1,
                      flexShrink: 0,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default'
                    }}
                  />
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {item.isNew && (
                    <Chip
                      label="MỚI"
                      size="small"
                      color="error"
                      sx={{
                        height: 18,
                        fontSize: '0.675rem',
                        fontWeight: 800,
                        px: 0.5,
                        borderRadius: 1,
                        background: 'linear-gradient(45deg, #ef4444, #f87171)',
                        boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
                        animation: 'pulse 1.8s infinite alternate',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)', boxShadow: '0 0 4px rgba(239, 68, 68, 0.4)' },
                          '100%': { transform: 'scale(1.05)', boxShadow: '0 0 12px rgba(239, 68, 68, 0.8)' }
                        }
                      }}
                    />
                  )}

                  {/* Scope Badge */}
                  {item.metadata?.scope && (
                    <Chip
                      label={item.metadata.scope === 'TW' ? 'Trung ương' : item.metadata.scope === 'DP' ? 'Địa phương' : item.metadata.scope}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.675rem',
                        fontWeight: 700,
                        borderRadius: 1,
                        bgcolor: item.metadata.scope === 'TW' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: item.metadata.scope === 'TW' ? '#3b82f6' : '#10b981',
                        border: '1px solid',
                        borderColor: item.metadata.scope === 'TW' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                      }}
                    />
                  )}

                  {/* Status Badge */}
                  {item.metadata?.effStatus && (
                    <Chip
                      label={item.metadata.effStatus}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.675rem',
                        fontWeight: 700,
                        borderRadius: 1,
                        bgcolor: 
                          item.metadata.effStatusCode === 'CCHL' ? 'rgba(245, 158, 11, 0.15)' : 
                          item.metadata.effStatusCode === 'CHL' ? 'rgba(16, 185, 129, 0.15)' : 
                          item.metadata.effStatusCode === 'HHL' ? 'rgba(107, 114, 128, 0.15)' : 
                          'rgba(107, 114, 128, 0.12)',
                        color: 
                          item.metadata.effStatusCode === 'CCHL' ? '#f59e0b' : 
                          item.metadata.effStatusCode === 'CHL' ? '#10b981' : 
                          item.metadata.effStatusCode === 'HHL' ? '#6b7280' : 
                          '#6b7280',
                        border: '1px solid',
                        borderColor: 
                          item.metadata.effStatusCode === 'CCHL' ? 'rgba(245, 158, 11, 0.3)' : 
                          item.metadata.effStatusCode === 'CHL' ? 'rgba(16, 185, 129, 0.3)' : 
                          item.metadata.effStatusCode === 'HHL' ? 'rgba(107, 114, 128, 0.3)' : 
                          'rgba(107, 114, 128, 0.2)',
                      }}
                    />
                  )}

                  {/* Article Type Badge (News/Document) */}
                  {item.articleType && (
                    <Chip
                      label={item.articleType === 'news' ? 'Tin' : item.articleType === 'document' ? 'Văn bản' : item.articleType}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.675rem',
                        fontWeight: 800,
                        borderRadius: 1,
                        bgcolor: item.articleType === 'news' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: item.articleType === 'news' ? '#3b82f6' : '#10b981',
                        border: '1px solid',
                        borderColor: item.articleType === 'news' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                      }}
                    />
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                  <Link href={item.url} target="_blank" rel="noopener noreferrer" sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    {item.title}
                  </Link>
                  <Box sx={{ mt: 0.5, display: 'flex' }}>
                    {renderInlineAiKeywords(item)}
                  </Box>
                  {item.category && item.category.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.25 }}>
                      {item.category.map((cat, idx) => {
                        const isSelected = tag === cat;
                        return (
                          <Chip 
                            key={idx} 
                            label={cat} 
                            size="small" 
                            variant={isSelected ? 'filled' : 'outlined'} 
                            color={isSelected ? 'primary' : 'default'}
                            sx={{ height: 16, fontSize: '0.65rem', cursor: 'pointer' }} 
                            onClick={(e) => {
                              e.stopPropagation();
                              setTag(isSelected ? '' : cat);
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          }
        },
        {
          id: 'section',
          name: 'section',
          label: 'Mục',
          width: 150,
          renderCell: (row: TableRowData) => {
            const item = row as unknown as ScraperArticle;
            return <Typography variant="body2">{item.section || '-'}</Typography>;
          }
        },
        {
          id: 'category',
          name: 'category',
          label: 'Chủ đề',
          width: 180,
          renderCell: (row: TableRowData) => {
            const item = row as unknown as ScraperArticle;
            return (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {item.category?.map((t, idx) => {
                  const isSelected = tag === t;
                  return (
                    <Chip 
                      key={`f-${idx}`} 
                      label={t} 
                      size="small" 
                      variant={isSelected ? 'filled' : 'outlined'} 
                      color="primary" 
                      sx={{ fontSize: 11, cursor: 'pointer' }} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setTag(isSelected ? '' : t);
                      }}
                    />
                  );
                })}
                {!item.category?.length && <Typography variant="caption" color="text.secondary">-</Typography>}
              </Box>
            );
          }
        },
        {
          id: 'publishedAt',
          name: 'publishedAt',
          label: 'Thời gian',
          width: 130,
          renderCell: (row: TableRowData) => {
            const item = row as unknown as ScraperArticle;
            const d = item.publishedAt || item.createdAt;
            return (
              <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                {item.dateStr || safeFormat(d, 'dd/MM/yyyy HH:mm')}
              </Typography>
            );
          }
        }
      ];
    }
  }, [activeSite, selectedIds, items, renderInlineAiKeywords]);

  const renderVbplAutoConfigPanel = () => {
    if (!isAdmin || activeSite !== 'vbpl') return null;

    const DEFAULT_EFF_STATUSES = [
      { code: 'CHL', name: 'Còn hiệu lực' },
      { code: 'CCHL', name: 'Chưa có hiệu lực' },
      { code: 'HHL', name: 'Hết hiệu lực toàn bộ' },
      { code: 'NHL', name: 'Ngưng hiệu lực' },
      { code: '5', name: 'Chưa xác định' }
    ];

    const DEFAULT_DOC_TYPES = [
      { code: 'TT', name: 'Thông tư' },
      { code: 'QD', name: 'Quyết định' },
      { code: 'ND', name: 'Nghị định' },
      { code: 'CV', name: 'Công văn' },
      { code: 'NQ', name: 'Nghị quyết' },
      { code: 'L', name: 'Luật' },
      { code: 'PL', name: 'Pháp lệnh' },
      { code: 'CT', name: 'Chỉ thị' }
    ];

    // Merge scopes
    const optScopesSet = new Set<string>(['TW', 'DP']);
    if (autoFilterOptions?.scopes) {
      autoFilterOptions.scopes.forEach(s => {
        if (s) optScopesSet.add(s);
      });
    }
    const optScopes = Array.from(optScopesSet);

    // Merge effStatuses (prioritize API values, fallback to default)
    const effStatusMap = new Map<string, { code: string; name: string }>();
    DEFAULT_EFF_STATUSES.forEach(item => effStatusMap.set(item.code, item));
    if (autoFilterOptions?.effStatuses) {
      autoFilterOptions.effStatuses.forEach(item => {
        if (item.code) {
          effStatusMap.set(item.code, {
            code: item.code,
            name: item.name || effStatusMap.get(item.code)?.name || item.code
          });
        }
      });
    }
    const optEffStatuses = Array.from(effStatusMap.values());

    // Merge docTypes (prioritize API values, fallback to default)
    const docTypeMap = new Map<string, { code: string; name: string }>();
    DEFAULT_DOC_TYPES.forEach(item => docTypeMap.set(item.code, item));
    if (autoFilterOptions?.docTypes) {
      autoFilterOptions.docTypes.forEach(item => {
        if (item.code) {
          docTypeMap.set(item.code, {
            code: item.code,
            name: item.name || docTypeMap.get(item.code)?.name || item.code
          });
        }
      });
    }
    const optDocTypes = Array.from(docTypeMap.values());

    const optNganhs = autoFilterOptions?.nganhs || [];
    const optLinhVucs = autoFilterOptions?.linhVucs || [];

    return (
      <Accordion 
        sx={{ 
          mb: 3, 
          borderRadius: '12px !important', 
          border: '1px solid',
          borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          overflow: 'hidden'
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          sx={{
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
            minHeight: 56,
            '&.Mui-expanded': { minHeight: 56 }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
            <CloudUploadOutlinedIcon sx={{ color: '#b45309' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Tự động đẩy thông tin VBPL lên Sheet (Cấu hình Admin)
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Tự động đẩy thông tin đầy đủ và nội dung văn bản pháp luật mới cào lên Google Sheet dựa trên bộ lọc
              </Typography>
            </Box>
            {autoConfig && (
              <Chip 
                label={autoConfig.enabled ? 'ĐANG BẬT' : 'ĐANG TẮT'} 
                color={autoConfig.enabled ? 'success' : 'default'} 
                size="small" 
                sx={{ fontWeight: 800, mr: 1, height: 20, fontSize: '0.675rem' }}
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          {loadingAutoConfig ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={30} />
            </Box>
          ) : !autoConfig || !autoFilterOptions ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              Không thể tải cấu hình tự động. Vui lòng kiểm tra kết nối mạng hoặc thử lại.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              
              {/* Banner Cảnh báo lỗi liên tiếp nghiêm trọng */}
              {autoConfig.consecutiveFailures >= 3 && !autoConfig.enabled && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  <AlertTitle sx={{ fontWeight: 700 }}>Tự động đã bị TẮT do lỗi đẩy Sheet liên tiếp</AlertTitle>
                  Hệ thống đã tự động vô hiệu hóa luồng xuất dữ liệu sau {autoConfig.consecutiveFailures} lần lỗi liên tiếp. Vui lòng kiểm tra lại cấu hình hoặc liên kết Google Sheet, sau đó bật lại nút kích hoạt dưới đây.
                </Alert>
              )}

              {/* Hàng 1: Switch Bật/Tắt & Info Box */}
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoConfig.enabled ?? false}
                        onChange={(e) => setAutoConfig(prev => prev ? { ...prev, enabled: e.target.checked } : null)}
                        color="success"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Kích hoạt Tự động đẩy VBPL lên Sheet</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.3 }}>
                          Áp dụng cho văn bản mới cào về kể từ lúc kích hoạt (các văn bản cũ hơn sẽ không tự động xử lý).
                        </Typography>
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 1.5, px: 2, borderRadius: 2.5, bgcolor: 'action.hover' }}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Kích hoạt lần đầu</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {autoConfig.activatedAt ? safeFormat(autoConfig.activatedAt, 'dd/MM/yyyy HH:mm') : 'Chưa kích hoạt'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Lỗi liên tiếp</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: autoConfig.consecutiveFailures > 0 ? 'error.main' : 'text.primary' }}>
                          {autoConfig.consecutiveFailures > 0 ? `${autoConfig.consecutiveFailures}/3 lần` : '0'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>

              {/* Lỗi gần nhất (nếu có) */}
              {autoConfig.lastError && (
                <Alert severity="warning" sx={{ borderRadius: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 141, 68, 0.08)' : 'rgba(239, 141, 68, 0.04)' }}>
                  <AlertTitle sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    Chi tiết lỗi gần nhất ({autoConfig.lastErrorAt ? safeFormat(autoConfig.lastErrorAt, 'dd/MM/yyyy HH:mm:ss') : '-'})
                  </AlertTitle>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', whiteSpace: 'pre-wrap' }}>
                    {autoConfig.lastError}
                  </Typography>
                </Alert>
              )}

              {/* Trạng thái Chạy nền & Kết quả gần nhất */}
              {(autoConfig.isRunning || autoConfig.lastRunAt) && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, mb: 1, bgcolor: autoConfig.isRunning ? 'rgba(59, 130, 246, 0.05)' : 'background.paper', border: '1px solid', borderColor: autoConfig.isRunning ? 'rgba(59, 130, 246, 0.2)' : 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: autoConfig.lastRunResult ? 1.5 : 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {autoConfig.isRunning ? (
                        <CircularProgress size={16} sx={{ color: 'primary.main' }} />
                      ) : (
                        <CheckCircleOutlinedIcon sx={{ color: 'success.main', fontSize: 18 }} />
                      )}
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: autoConfig.isRunning ? 'primary.main' : 'text.primary' }}>
                        {autoConfig.isRunning ? 'Đang tự động đẩy thông tin VBPL lên Sheet trong nền...' : 'Lần chạy tự động gần nhất'}
                      </Typography>
                    </Box>
                    {autoConfig.lastRunAt && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {safeFormat(autoConfig.lastRunAt, 'dd/MM/yyyy HH:mm:ss')}
                      </Typography>
                    )}
                  </Box>
                  {autoConfig.lastRunResult && (
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                      <Grid item xs={3}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Khớp bộ lọc</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{autoConfig.lastRunResult.matched}</Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Đã xử lý</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{autoConfig.lastRunResult.processed}</Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Batch thành công</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>{autoConfig.lastRunResult.succeeded}</Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Batch thất bại</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: autoConfig.lastRunResult.failed > 0 ? 'error.main' : 'text.primary' }}>{autoConfig.lastRunResult.failed}</Typography>
                      </Grid>
                    </Grid>
                  )}
                </Paper>
              )}

              <Divider />

              {/* Hàng 2: Bộ lọc các Multi-selects */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
                  🎯 Chỉ tự động đẩy lên Sheet đối với văn bản khớp với bộ lọc sau:
                </Typography>
                <Grid container spacing={2}>
                  
                  {/* Phạm vi */}
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel shrink id="auto-scopes-label">Phạm vi</InputLabel>
                      <Select
                        labelId="auto-scopes-label"
                        multiple
                        displayEmpty
                        value={autoConfig.scopes || []}
                        onChange={(e) => setAutoConfig(prev => prev ? { ...prev, scopes: e.target.value as ('TW' | 'DP')[] } : null)}
                        input={<OutlinedInput label="Phạm vi" />}
                        renderValue={(selected) => (selected.length === 0 ? 'Tất cả' : selected.map(s => s === 'TW' ? 'Trung ương' : 'Địa phương').join(', '))}
                      >
                        {optScopes.map((scopeVal) => (
                          <MenuItem key={scopeVal} value={scopeVal}>
                            <Checkbox checked={(autoConfig.scopes || []).indexOf(scopeVal as any) > -1} size="small" />
                            <ListItemText primary={scopeVal === 'TW' ? 'Trung ương (TW)' : 'Địa phương (DP)'} />
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>Rỗng = Chọn tất cả</FormHelperText>
                    </FormControl>
                  </Grid>

                  {/* Tình trạng hiệu lực */}
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel shrink id="auto-eff-label">Tình trạng hiệu lực</InputLabel>
                      <Select
                        labelId="auto-eff-label"
                        multiple
                        displayEmpty
                        value={autoConfig.effStatusCodes || []}
                        onChange={(e) => setAutoConfig(prev => prev ? { ...prev, effStatusCodes: e.target.value as string[] } : null)}
                        input={<OutlinedInput label="Tình trạng hiệu lực" />}
                        renderValue={(selected) => {
                          if (selected.length === 0) return 'Tất cả';
                          return selected.map(code => {
                            const found = optEffStatuses.find(opt => opt.code === code);
                            return found ? found.name : code;
                          }).join(', ');
                        }}
                      >
                        {optEffStatuses.map((opt) => (
                          <MenuItem key={opt.code} value={opt.code}>
                            <Checkbox checked={(autoConfig.effStatusCodes || []).indexOf(opt.code) > -1} size="small" />
                            <ListItemText primary={opt.name} />
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>Rỗng = Chọn tất cả</FormHelperText>
                    </FormControl>
                  </Grid>

                  {/* Loại văn bản */}
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel shrink id="auto-doc-types-label">Loại văn bản</InputLabel>
                      <Select
                        labelId="auto-doc-types-label"
                        multiple
                        displayEmpty
                        value={autoConfig.docTypeCodes || []}
                        onChange={(e) => setAutoConfig(prev => prev ? { ...prev, docTypeCodes: e.target.value as string[] } : null)}
                        input={<OutlinedInput label="Loại văn bản" />}
                        renderValue={(selected) => {
                          if (selected.length === 0) return 'Tất cả';
                          return selected.map(code => {
                            const found = optDocTypes.find(opt => opt.code === code);
                            return found ? found.name : code;
                          }).join(', ');
                        }}
                      >
                        {optDocTypes.map((opt) => (
                          <MenuItem key={opt.code} value={opt.code}>
                            <Checkbox checked={(autoConfig.docTypeCodes || []).indexOf(opt.code) > -1} size="small" />
                            <ListItemText primary={opt.name || opt.code} />
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>Rỗng = Chọn tất cả</FormHelperText>
                    </FormControl>
                  </Grid>

                  {/* Ngành */}
                  {optNganhs.length > 0 && (
                    <Grid item xs={12} sm={6} md={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel shrink id="auto-nganhs-label">Ngành quản lý</InputLabel>
                        <Select
                          labelId="auto-nganhs-label"
                          multiple
                          displayEmpty
                          value={autoConfig.nganhs || []}
                          onChange={(e) => setAutoConfig(prev => prev ? { ...prev, nganhs: e.target.value as string[] } : null)}
                          input={<OutlinedInput label="Ngành quản lý" />}
                          renderValue={(selected) => (selected.length === 0 ? 'Tất cả' : selected.join(', '))}
                        >
                          {optNganhs.map((n) => (
                            <MenuItem key={n} value={n}>
                              <Checkbox checked={(autoConfig.nganhs || []).indexOf(n) > -1} size="small" />
                              <ListItemText primary={n} />
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>Rỗng = Chọn tất cả</FormHelperText>
                      </FormControl>
                    </Grid>
                  )}

                  {/* Lĩnh vực */}
                  {optLinhVucs.length > 0 && (
                    <Grid item xs={12} sm={6} md={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel shrink id="auto-linh-vucs-label">Lĩnh vực</InputLabel>
                        <Select
                          labelId="auto-linh-vucs-label"
                          multiple
                          displayEmpty
                          value={autoConfig.linhVucs || []}
                          onChange={(e) => setAutoConfig(prev => prev ? { ...prev, linhVucs: e.target.value as string[] } : null)}
                          input={<OutlinedInput label="Lĩnh vực" />}
                          renderValue={(selected) => (selected.length === 0 ? 'Tất cả' : selected.join(', '))}
                        >
                          {optLinhVucs.map((l) => (
                            <MenuItem key={l} value={l}>
                              <Checkbox checked={(autoConfig.linhVucs || []).indexOf(l) > -1} size="small" />
                              <ListItemText primary={l} />
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>Rỗng = Chọn tất cả</FormHelperText>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>
              </Box>



              {/* Hàng 4: Các nút hành động */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                <Tooltip title="Đẩy các bài VBPL trong 48h gần nhất khớp bộ lọc hiện tại lên Sheet (bỏ qua bài đã push)">
                  <span>
                    <Button
                      variant="outlined"
                      color="warning"
                      disabled={runningAutoNow || savingAutoConfig || autoConfig.isRunning}
                      onClick={handleRunVbplAutoNow}
                      startIcon={runningAutoNow ? <CircularProgress size={16} color="inherit" /> : <CloudUploadOutlinedIcon />}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      {runningAutoNow ? 'Đang chạy...' : 'Chạy thủ công'}
                    </Button>
                  </span>
                </Tooltip>
                
                <Button
                  variant="contained"
                  color="success"
                  disabled={savingAutoConfig || runningAutoNow}
                  onClick={handleSaveVbplAutoConfig}
                  startIcon={savingAutoConfig ? <CircularProgress size={16} color="inherit" /> : <SettingsIcon />}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  {savingAutoConfig ? 'Đang lưu...' : 'Lưu cấu hình'}
                </Button>
              </Box>

            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  const displayedItems = useMemo(() => {
    if (activeSite !== 'luatvietnam' || articleType === 'all') return items;
    return items.filter(item => item.articleType === articleType);
  }, [items, activeSite, articleType]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 4 }}>
      {/* SITES */}
      <Box>

        {/* SITE CARDS */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2 }}>
          {SITE_SOURCES.map((site) => {
            const isActive = activeSite === site.id;
            
            // Map dark mode colors to look premium and readable
            const getDarkThemeColor = (id: string) => {
              switch (id) {
                case 'thuvienphapluat': return '#4ade80';
                case 'luatminhkhue': return '#60a5fa';
                case 'luatduonggia': return '#2dd4bf';
                case 'luatvietnam': return '#22d3ee';
                case 'ketoananpha': return '#f472b6';
                case 'vbpl': return '#fbbf24';
                default: return '#818cf8';
              }
            };

            return (
              <Paper
                key={site.id}
                onClick={() => setActiveSite(site.id)}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: isActive 
                    ? (theme) => theme.palette.mode === 'dark' ? getDarkThemeColor(site.id) : site.color
                    : 'transparent',
                  bgcolor: 'background.paper',
                  boxShadow: isActive ? '0 4px 20px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                  }
                }}
              >
                {/* Background Tint - Softened in dark mode, hidden when inactive */}
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    right: 0, 
                    bottom: 0, 
                    width: '50%', 
                    background: (theme) => theme.palette.mode === 'dark' 
                      ? `linear-gradient(90deg, transparent, ${site.color}15)` 
                      : `linear-gradient(90deg, transparent, ${site.bg})`, 
                    opacity: isActive ? 1 : 0, 
                    transition: 'opacity 0.3s' 
                  }} 
                />
                
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box 
                      sx={{ 
                        p: 0.5, 
                        borderRadius: 1.5, 
                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                          ? `${site.color}25` 
                          : isActive ? site.bg : `${site.color}12`, 
                        color: (theme) => theme.palette.mode === 'dark' ? getDarkThemeColor(site.id) : site.color, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                    >
                      <LanguageIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }} noWrap>{site.name}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', minHeight: 40 }}>
                    {site.desc}
                  </Typography>
                </Box>
              </Paper>
            );
          })}
        </Box>
      </Box>

      {/* ACTIVE SITE DETAILS */}
      <Collapse in={!!activeSite} mountOnEnter unmountOnExit>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {SITE_SOURCES.find(s => s.id === activeSite)?.name}
              </Typography>
              <Chip label={isTriggering ? 'Đang hoạt động' : 'Sẵn sàng'} color={isTriggering ? 'warning' : 'success'} size="small" />
              {schedule?.enabled && (
                <Chip icon={<ScheduleIcon fontSize="small" />} label={`Tự động: ${schedule.cron}`} color="info" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="info"
                onClick={() => setOpenScheduleDialog(true)}
                startIcon={<SettingsIcon />}
                sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
              >
                Cấu hình lịch
              </Button>
              <Button
                variant="outlined"
                color="success"
                onClick={handleOpenDownloadDialog}
                startIcon={<CloudDownloadOutlinedIcon />}
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                  color: '#10b981',
                  '&:hover': {
                    borderColor: '#10b981',
                    bgcolor: 'rgba(16, 185, 129, 0.04)',
                  }
                }}
              >
                Xuất Excel
              </Button>
              <Button
                variant="contained"
                onClick={handleTriggerScrape}
                disabled={isTriggering}
                startIcon={isTriggering ? <CircularProgress size={16} color="inherit" /> : <CloudDownloadOutlinedIcon />}
                sx={{ borderRadius: 2, px: 3, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
              >
                {isTriggering ? 'Đang chạy...' : 'Cào bài ngay'}
              </Button>
              {isAdmin && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleResetSourceAiState(activeSite)}
                  sx={{ 
                    borderRadius: 2, 
                    fontWeight: 600, 
                    textTransform: 'none',
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    color: '#ef4444',
                    '&:hover': {
                      borderColor: '#ef4444',
                      bgcolor: 'rgba(239, 68, 68, 0.04)',
                    }
                  }}
                >
                  Reset AI Nguồn
                </Button>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
            {/* Summary Box */}
            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', height: 'fit-content' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AnalyticsOutlinedIcon color="primary" />
                <Typography sx={{ fontWeight: 700 }}>Tổng quan (Hiện có)</Typography>
              </Box>
              {loadingSummary ? (
                <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} /></Box>
              ) : summary ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, px: 1.25, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>Tổng số bài viết</Typography>
                    <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: 'primary.main' }}>
                      {summary.total.toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, px: 1.25, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>Số chuyên mục</Typography>
                    <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: 'text.primary' }}>
                      {Object.keys(summary.bySection || {}).length}
                    </Typography>
                  </Box>
                  
                  <Button 
                    size="small" 
                    variant="text" 
                    onClick={() => setShowSectionDetails(!showSectionDetails)}
                    endIcon={<ExpandMoreIcon sx={{ transform: showSectionDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />}
                    sx={{ textTransform: 'none', fontWeight: 700, p: 0, minWidth: 0, color: 'primary.main', mt: 0.5, fontSize: '0.75rem', alignSelf: 'flex-start' }}
                  >
                    {showSectionDetails ? 'Thu gọn chuyên mục' : 'Xem chi tiết chuyên mục'}
                  </Button>

                  <Collapse in={showSectionDetails}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1, maxHeight: 200, overflowY: 'auto', pr: 0.5 }}>
                      {Object.entries(summary.bySection || {}).map(([sec, count]) => (
                        <Box key={sec} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, px: 1, borderRadius: 1.5, '&:hover': { bgcolor: 'action.hover' } }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.825rem' }}>{sec}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.825rem', color: 'text.secondary' }}>{count}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">Chưa có dữ liệu</Typography>
              )}
            </Box>

            {/* Top Categories Card */}
            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', height: 'fit-content' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FormatListBulletedIcon color="primary" />
                <Typography sx={{ fontWeight: 700 }}>Danh mục / Loại văn bản</Typography>
              </Box>
              {loadingSummary ? (
                <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} /></Box>
              ) : summary?.topCategories?.length ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {/* Default preview of first 4 categories */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {summary.topCategories.slice(0, 4).map((t, idx) => {
                      const isSelected = tag === t.name;
                      return (
                        <Box 
                          key={`cat-${idx}`} 
                          onClick={() => setTag(isSelected ? '' : t.name)}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            py: 0.75,
                            px: 1.25,
                            borderRadius: 2,
                            cursor: 'pointer',
                            bgcolor: isSelected ? 'primary.main' : 'background.paper',
                            color: isSelected ? 'primary.contrastText' : 'text.primary',
                            border: '1px solid',
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: isSelected ? 'primary.dark' : 'action.hover' }
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.825rem' }}>{t.name}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.825rem', opacity: 0.8 }}>{t.count}</Typography>
                        </Box>
                      );
                    })}
                  </Box>

                  {summary.topCategories.length > 4 && (
                    <Box>
                      <Collapse in={showCategoryDetails}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1, maxHeight: 200, overflowY: 'auto', pr: 0.5 }}>
                          {summary.topCategories.slice(4).map((t, idx) => {
                            const isSelected = tag === t.name;
                            return (
                              <Box 
                                key={`cat-expand-${idx}`} 
                                onClick={() => setTag(isSelected ? '' : t.name)}
                                sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center', 
                                  py: 0.75,
                                  px: 1.25,
                                  borderRadius: 2,
                                  cursor: 'pointer',
                                  bgcolor: isSelected ? 'primary.main' : 'background.paper',
                                  color: isSelected ? 'primary.contrastText' : 'text.primary',
                                  border: '1px solid',
                                  borderColor: isSelected ? 'primary.main' : 'divider',
                                  transition: 'all 0.2s',
                                  '&:hover': { bgcolor: isSelected ? 'primary.dark' : 'action.hover' }
                                }}
                              >
                                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.825rem' }}>{t.name}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.825rem', opacity: 0.8 }}>{t.count}</Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Collapse>
                      
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => setShowCategoryDetails(!showCategoryDetails)}
                        endIcon={<ExpandMoreIcon sx={{ transform: showCategoryDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />}
                        sx={{ textTransform: 'none', fontWeight: 700, p: 0, minWidth: 0, color: 'primary.main', mt: 1, ml: 1, fontSize: '0.75rem' }}
                      >
                        {showCategoryDetails ? 'Thu gọn danh mục' : `Xem thêm danh mục (${summary.topCategories.length - 4})`}
                      </Button>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">Không có dữ liệu</Typography>
              )}
            </Box>

            {/* Top Tags Card */}
            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', height: 'fit-content' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FormatListBulletedIcon color="secondary" />
                <Typography sx={{ fontWeight: 700 }}>Từ khóa nổi bật</Typography>
              </Box>
              {loadingSummary ? (
                <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} /></Box>
              ) : summary?.topTags?.length ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {/* Default preview of first 4 tags */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {summary.topTags.slice(0, 4).map((t, idx) => {
                      const isSelected = tag === t.name;
                      return (
                        <Box 
                          key={`tag-${idx}`} 
                          onClick={() => setTag(isSelected ? '' : t.name)}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            py: 0.75,
                            px: 1.25,
                            borderRadius: 2,
                            cursor: 'pointer',
                            bgcolor: isSelected ? 'secondary.main' : 'background.paper',
                            color: isSelected ? 'secondary.contrastText' : 'text.primary',
                            border: '1px solid',
                            borderColor: isSelected ? 'secondary.main' : 'divider',
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: isSelected ? 'secondary.dark' : 'action.hover' }
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.825rem' }}>{t.name}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.825rem', opacity: 0.8 }}>{t.count}</Typography>
                        </Box>
                      );
                    })}
                  </Box>

                  {summary.topTags.length > 4 && (
                    <Box>
                      <Collapse in={showTagDetails}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1, maxHeight: 200, overflowY: 'auto', pr: 0.5 }}>
                          {summary.topTags.slice(4).map((t, idx) => {
                            const isSelected = tag === t.name;
                            return (
                              <Box 
                                key={`tag-expand-${idx}`} 
                                onClick={() => setTag(isSelected ? '' : t.name)}
                                sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center', 
                                  py: 0.75,
                                  px: 1.25,
                                  borderRadius: 2,
                                  cursor: 'pointer',
                                  bgcolor: isSelected ? 'secondary.main' : 'background.paper',
                                  color: isSelected ? 'secondary.contrastText' : 'text.primary',
                                  border: '1px solid',
                                  borderColor: isSelected ? 'secondary.main' : 'divider',
                                  transition: 'all 0.2s',
                                  '&:hover': { bgcolor: isSelected ? 'secondary.dark' : 'action.hover' }
                                }}
                              >
                                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.825rem' }}>{t.name}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.825rem', opacity: 0.8 }}>{t.count}</Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Collapse>
                      
                      <Button
                        size="small"
                        variant="text"
                        color="secondary"
                        onClick={() => setShowTagDetails(!showTagDetails)}
                        endIcon={<ExpandMoreIcon sx={{ transform: showTagDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />}
                        sx={{ textTransform: 'none', fontWeight: 700, p: 0, minWidth: 0, mt: 1, ml: 1, fontSize: '0.75rem' }}
                      >
                        {showTagDetails ? 'Thu gọn từ khóa' : `Xem thêm từ khóa (${summary.topTags.length - 4})`}
                      </Button>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">Không có dữ liệu</Typography>
              )}
            </Box>
          </Box>

          {activeSite === 'luatvietnam' && (
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={articleType}
                onChange={(_, newValue) => setArticleType(newValue)}
                indicatorColor="primary"
                textColor="primary"
                sx={{
                  minHeight: 40,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    minHeight: 40,
                    px: 3,
                    py: 1,
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      color: 'primary.main',
                    }
                  }
                }}
              >
                <Tab
                  value="all"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Tất cả
                      <Chip
                        label={summary?.total || 0}
                        size="small"
                        sx={{ 
                          height: 18, 
                          fontSize: '0.675rem', 
                          fontWeight: 700, 
                          bgcolor: articleType === 'all' ? 'primary.main' : 'action.selected', 
                          color: articleType === 'all' ? 'primary.contrastText' : 'text.secondary' 
                        }}
                      />
                    </Box>
                  }
                />
                <Tab
                  value="news"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Tin tức
                      <Chip
                        label={(summary?.total || 0) - (summary?.bySection?.['Văn bản pháp luật'] || 0)}
                        size="small"
                        sx={{ 
                          height: 18, 
                          fontSize: '0.675rem', 
                          fontWeight: 700, 
                          bgcolor: articleType === 'news' ? 'primary.main' : 'action.selected', 
                          color: articleType === 'news' ? 'primary.contrastText' : 'text.secondary' 
                        }}
                      />
                    </Box>
                  }
                />
                <Tab
                  value="document"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Văn bản pháp luật
                      <Chip
                        label={summary?.bySection?.['Văn bản pháp luật'] || 0}
                        size="small"
                        sx={{ 
                          height: 18, 
                          fontSize: '0.675rem', 
                          fontWeight: 700, 
                          bgcolor: articleType === 'document' ? 'primary.main' : 'action.selected', 
                          color: articleType === 'document' ? 'primary.contrastText' : 'text.secondary' 
                        }}
                      />
                    </Box>
                  }
                />
              </Tabs>
            </Box>
          )}

          {/* Filter Bar */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
            <TextField
              size="small"
              placeholder="Tìm kiếm tiêu đề..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              sx={{ minWidth: 200, flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} />
                }
              }}
            />
            <Select
              size="small"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              displayEmpty
              sx={{ minWidth: 150 }}
              MenuProps={filterMenuProps}
            >
              <MenuItem value="">Tất cả Mục</MenuItem>
              {Object.keys(summary?.bySection || {}).map(sec => (
                <MenuItem key={sec} value={sec}>{sec}</MenuItem>
              ))}
            </Select>
            <Select 
              size="small" 
              value={tag} 
              onChange={(e) => setTag(e.target.value)} 
              displayEmpty 
              sx={{ minWidth: 200, maxWidth: 300 }}
              MenuProps={filterMenuProps}
            >
              <MenuItem value="">Tất cả Chủ đề / Từ khóa</MenuItem>
              {loadingTags ? (
                <MenuItem disabled>
                  <CircularProgress size={16} sx={{ mr: 1 }} /> Đang tải...
                </MenuItem>
              ) : (
                [...new Set([...categoriesList, ...tagsList])]
                  .filter(Boolean)
                  .sort((a, b) => a.localeCompare(b, 'vi'))
                  .map((t, idx) => (
                    <MenuItem key={idx} value={t}>{t}</MenuItem>
                  ))
              )}
            </Select>
            <TextField
              size="small"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              sx={{ width: 140 }}
            />
            
            <Button
              size="small"
              variant={showAdvancedFilters || activeAdvancedCount > 0 ? "contained" : "outlined"}
              color={activeAdvancedCount > 0 ? "warning" : "inherit"}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              startIcon={<TuneIcon />}
              endIcon={<ExpandMoreIcon sx={{ transform: showAdvancedFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 700,
                borderColor: 'divider',
                color: (theme) => (showAdvancedFilters || activeAdvancedCount > 0) ? 'primary.contrastText' : 'text.secondary',
                '&:hover': {
                  borderColor: 'text.secondary',
                }
              }}
            >
              Bộ lọc nâng cao {activeAdvancedCount > 0 ? `(${activeAdvancedCount})` : ''}
            </Button>

            <FormControlLabel
              control={
                <Switch
                  checked={onlyNew}
                  onChange={(e) => setOnlyNew(e.target.checked)}
                  color="warning"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Chỉ bài mới</Typography>
                  <Chip label="48h" size="small" color="error" sx={{ height: 16, fontSize: 9, fontWeight: 700 }} />
                </Box>
              }
              sx={{ ml: 1, mr: 0 }}
            />
            
            {(section || tag || date || q || onlyNew || activeAdvancedCount > 0 || articleType !== 'all') && (
              <Button 
                size="small" 
                color="error" 
                variant="text"
                onClick={() => { 
                  setSection(''); 
                  setTag(''); 
                  setDate(''); 
                  setQ(''); 
                  setOnlyNew(false); 
                  setScope(''); 
                  setEffStatusCode(''); 
                  setNganh(''); 
                  setLinhVuc(''); 
                  setDocTypeCode(''); 
                  setSheetStatus('all'); 
                  setFullInfoStatus('all'); 
                  setArticleType('all'); 
                }}
                sx={{ fontWeight: 700, textTransform: 'none' }}
              >
                Xóa lọc
              </Button>
            )}
          </Box>

          {/* Active Advanced Filter Chips */}
          {activeAdvancedCount > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', mr: 0.5 }}>Bộ lọc đang bật:</Typography>
              
              {activeSite !== 'vbpl' ? (
                <>
                  {sheetStatus !== 'all' && (
                    <Chip
                      size="small"
                      label={`Sheet: ${sheetStatus === 'pushed' ? 'Đã push' : 'Chưa push'}`}
                      onDelete={() => setSheetStatus('all')}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </>
              ) : (
                <>
                  {fullInfoStatus !== 'all' && (
                    <Chip
                      size="small"
                      label={`Đẩy VBPL: ${fullInfoStatus === 'pushed' ? 'Đã đẩy' : 'Chưa đẩy'}`}
                      onDelete={() => setFullInfoStatus('all')}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {scope !== '' && (
                    <Chip
                      size="small"
                      label={`Phạm vi: ${scope === 'TW' ? 'Trung ương' : 'Địa phương'}`}
                      onDelete={() => setScope('')}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {effStatusCode !== '' && (
                    <Chip
                      size="small"
                      label={`Hiệu lực: ${
                        effStatusCode === 'CHL' ? 'Còn hiệu lực' :
                        effStatusCode === 'CCHL' ? 'Chưa có hiệu lực' :
                        effStatusCode === 'HHL' ? 'Hết hiệu lực toàn bộ' :
                        effStatusCode === 'NHL' ? 'Ngưng hiệu lực' : 'Chưa xác định'
                      }`}
                      onDelete={() => setEffStatusCode('')}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {nganh !== '' && (
                    <Chip
                      size="small"
                      label={`Ngành: ${nganh}`}
                      onDelete={() => setNganh('')}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {linhVuc !== '' && (
                    <Chip
                      size="small"
                      label={`Lĩnh vực: ${linhVuc}`}
                      onDelete={() => setLinhVuc('')}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {docTypeCode !== '' && (
                    <Chip
                      size="small"
                      label={`Loại VB: ${DOC_TYPES.find(t => t.code === docTypeCode)?.label || docTypeCode}`}
                      onDelete={() => setDocTypeCode('')}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </>
              )}
            </Box>
          )}

          {/* Advanced Filters Panel */}
          <Collapse in={showAdvancedFilters}>
            <Box sx={{ 
              p: 2.5, 
              mb: 2.5, 
              borderRadius: 3, 
              bgcolor: 'background.default', 
              border: '1px solid', 
              borderColor: 'divider',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                <TuneIcon sx={{ fontSize: 18 }} /> Bộ lọc nâng cao
              </Typography>
              
              <Grid container spacing={2}>
                {activeSite !== 'vbpl' ? (
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Trạng thái Sheet</Typography>
                    <Select 
                      fullWidth
                      size="small" 
                      value={sheetStatus} 
                      onChange={(e) => setSheetStatus(e.target.value)} 
                      displayEmpty 
                      MenuProps={filterMenuProps}
                    >
                      <MenuItem value="all">Tất cả Trạng thái Sheet</MenuItem>
                      <MenuItem value="pushed">Đã push Sheet</MenuItem>
                      <MenuItem value="notpushed">Chưa push Sheet</MenuItem>
                    </Select>
                  </Grid>
                ) : (
                  <>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Trạng thái đẩy VBPL</Typography>
                      <Select 
                        fullWidth
                        size="small" 
                        value={fullInfoStatus} 
                        onChange={(e) => setFullInfoStatus(e.target.value)} 
                        displayEmpty 
                        MenuProps={filterMenuProps}
                      >
                        <MenuItem value="all">Trạng thái đẩy VBPL (Tất cả)</MenuItem>
                        <MenuItem value="pushed">Đã đẩy VBPL (Full Info)</MenuItem>
                        <MenuItem value="notpushed">Chưa đẩy VBPL (Full Info)</MenuItem>
                      </Select>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Phạm vi văn bản</Typography>
                      <Select 
                        fullWidth
                        size="small" 
                        value={scope} 
                        onChange={(e) => setScope(e.target.value)} 
                        displayEmpty 
                        MenuProps={filterMenuProps}
                      >
                        <MenuItem value="">Tất cả Phạm vi</MenuItem>
                        <MenuItem value="TW">Trung ương (TW)</MenuItem>
                        <MenuItem value="DP">Địa phương (DP)</MenuItem>
                      </Select>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Tình trạng hiệu lực</Typography>
                      <Select 
                        fullWidth
                        size="small" 
                        value={effStatusCode} 
                        onChange={(e) => setEffStatusCode(e.target.value)} 
                        displayEmpty 
                        MenuProps={filterMenuProps}
                      >
                        <MenuItem value="">Tất cả Hiệu lực</MenuItem>
                        <MenuItem value="CHL">Còn hiệu lực</MenuItem>
                        <MenuItem value="CCHL">Chưa có hiệu lực</MenuItem>
                        <MenuItem value="HHL">Hết hiệu lực toàn bộ</MenuItem>
                        <MenuItem value="NHL">Ngưng hiệu lực</MenuItem>
                        <MenuItem value="5">Chưa xác định</MenuItem>
                      </Select>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Ngành quản lý</Typography>
                      <Select 
                        fullWidth
                        size="small" 
                        value={nganh} 
                        onChange={(e) => setNganh(e.target.value)} 
                        displayEmpty 
                        MenuProps={filterMenuProps}
                      >
                        <MenuItem value="">Tất cả Ngành</MenuItem>
                        {LEGAL_SECTORS.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                      </Select>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Lĩnh vực</Typography>
                      <Select 
                        fullWidth
                        size="small" 
                        value={linhVuc} 
                        onChange={(e) => setLinhVuc(e.target.value)} 
                        displayEmpty 
                        MenuProps={filterMenuProps}
                      >
                        <MenuItem value="">Tất cả Lĩnh vực</MenuItem>
                        {LEGAL_DOMAINS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                      </Select>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Loại văn bản</Typography>
                      <Select 
                        fullWidth
                        size="small" 
                        value={docTypeCode} 
                        onChange={(e) => setDocTypeCode(e.target.value)} 
                        displayEmpty 
                        MenuProps={filterMenuProps}
                      >
                        <MenuItem value="">Tất cả Loại VB</MenuItem>
                        {DOC_TYPES.map(t => <MenuItem key={t.code} value={t.code}>{t.label}</MenuItem>)}
                      </Select>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          </Collapse>

          {renderVbplAutoConfigPanel()}

          {selectedIds.length > 0 && (
            <Paper
              sx={{
                p: 1.5,
                mb: 2,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'rgba(0, 184, 148, 0.05)',
                border: '1px solid rgba(0, 184, 148, 0.2)',
                animation: 'fadeIn 0.3s ease-in-out',
                '@keyframes fadeIn': {
                  '0%': { opacity: 0, transform: 'translateY(-10px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' }
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PsychologyIcon sx={{ color: '#00b894' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Đã chọn <strong>{selectedIds.length}</strong> bài viết để tạo từ khóa SEO hàng loạt
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant="contained"
                  disabled={isBatchGenerating}
                  onClick={handleBatchGenerate}
                  startIcon={isBatchGenerating ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <AutoAwesomeIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #00b894 0%, #009975 100%)',
                    boxShadow: 'none',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #3dd6a0 0%, #009975 100%)',
                      boxShadow: 'none'
                    }
                  }}
                >
                  {isBatchGenerating ? 'Đang xử lý hàng loạt...' : 'Gen AI & Push Sheet'}
                </Button>
                
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setSelectedIds([])}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'action.hover', borderColor: 'text.primary' }
                  }}
                >
                  Hủy chọn
                </Button>
              </Box>
            </Paper>
          )}

          {/* Table */}
          <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <CustomTable
              fields={columns}
              data={displayedItems}
              loading={loadingTable}
              page={page}
              rowsPerPage={limit}
              totalCount={total}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              enablePagination
              expandedRowId={expandedRowId}
              onRowClick={(row) => {
                const id = row._id || row.id;
                setExpandedRowId(prev => prev === id ? null : String(id));
              }}
              renderExpandedRow={(row) => {
                const item = row as unknown as ScraperArticle;

                if (activeSite === 'vbpl') {
                  const meta = item.metadata || {};
                  
                  // Helper function to render a detail row if value exists
                  const renderDetailItem = (label: string, value: React.ReactNode) => {
                    if (value === undefined || value === null || value === '') return null;
                    return (
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, borderBottom: '1px solid', borderColor: 'divider', py: 1, gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 140 }}>
                          {label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', textAlign: { sm: 'right' } }}>
                          {value}
                        </Typography>
                      </Box>
                    );
                  };

                  return (
                    <Box sx={{ p: 3, pl: { xs: 2, md: 5 }, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
                        
                        {/* Block 1: Phân loại & Tổ chức */}
                        <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: 'none', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                            <BusinessIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Phân loại & Tổ chức
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            {renderDetailItem('Số hiệu', meta.docNumber)}
                            {renderDetailItem('Ngành', meta.nganh)}
                            {meta.nganhs && meta.nganhs.length > 1 && renderDetailItem('Các ngành khác', meta.nganhs.slice(1).join(', '))}
                            {renderDetailItem('Loại văn bản', meta.docType ? `${meta.docType} (${meta.docTypeCode || ''})` : null)}
                            {renderDetailItem('Tổ chức', meta.organizationName)}
                            {renderDetailItem('Cấp tổ chức', meta.organizationType === '0' ? 'Trung ương' : meta.organizationType === '1' ? 'Địa phương' : meta.organizationType)}
                            {renderDetailItem('Ngôn ngữ', meta.language === 'VN' ? 'Tiếng Việt' : meta.language)}
                            {renderDetailItem('Mục hệ thống', item.section)}
                            {item.category && item.category.length > 0 && renderDetailItem('Chủ đề', (
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end', mt: 0.5 }}>
                                {item.category.map((c, idx) => (
                                  <Chip key={idx} label={c} size="small" variant="outlined" color="primary" sx={{ fontSize: 9, height: 16, fontWeight: 500 }} />
                                ))}
                              </Box>
                            ))}
                          </Box>
                        </Paper>

                        {/* Block 2: Người ký */}
                        <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: 'none', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                            <PersonIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Người ký văn bản
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            {renderDetailItem('Người ký chính', meta.signer)}
                            {renderDetailItem('Chức danh', meta.signerTitle)}
                            
                            {meta.signers && meta.signers.length > 1 && (
                              <Box sx={{ mt: 1.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                                  Danh sách tất cả người ký ({meta.signers.length}):
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {meta.signers.map((s, idx) => (
                                    <Box key={idx} sx={{ p: 1, borderRadius: 1.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{s.name}</Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        {s.title} {s.agency ? `· ${s.agency}` : ''}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Paper>

                        {/* Block 3: Thời gian & Tài liệu */}
                        <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: 'none', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                            <CalendarTodayIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Thời gian & Tài liệu
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            {renderDetailItem('Ngày công khai', meta.publicDate ? (meta.publicDate.includes('T') ? safeFormat(meta.publicDate, 'dd/MM/yyyy') : meta.publicDate) : null)}
                            {renderDetailItem('Ngày hết hiệu lực', meta.expiredDate ? (meta.expiredDate.includes('T') ? safeFormat(meta.expiredDate, 'dd/MM/yyyy') : meta.expiredDate) : null)}
                            {renderDetailItem('Cập nhật trên nguồn', meta.updatedDate ? (meta.updatedDate.includes('T') ? safeFormat(meta.updatedDate, 'dd/MM/yyyy HH:mm') : meta.updatedDate) : null)}
                            {renderDetailItem('Thời gian cào bài', safeFormat(item.createdAt, 'dd/MM/yyyy HH:mm'))}
                            {renderDetailItem('Trạng thái VBPL', meta.publishStatus)}
                            
                            {meta.pdfFileName ? renderDetailItem('File PDF gốc', (
                              <Link 
                                href={`${window.location.origin}/uploads/pdfs/${meta.pdfFileName}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'error.main', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                              >
                                <PictureAsPdfIcon fontSize="small" />
                                Tải PDF gốc
                              </Link>
                            )) : null}

                            {meta.viewCount !== undefined ? renderDetailItem('Lượt xem VBPL', (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'info.main', fontWeight: 700 }}>
                                <VisibilityIcon fontSize="small" />
                                {meta.viewCount} lượt xem
                              </Box>
                            )) : null}
                          </Box>
                        </Paper>

                        {/* AI Keywords are now managed directly inline in the list row above */}

                        {/* Block 4: Thuộc tính & Liên kết */}
                        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2', lg: 'span 3' }, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
                          
                          {/* Flags Box */}
                          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: 'none', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                              <GavelIcon sx={{ color: 'success.main', fontSize: 20 }} />
                              <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Thuộc tính & Trạng thái xử lý
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', py: 1 }}>
                              {[
                                { label: 'Văn bản hành chính', val: meta.isAdministrative },
                                { label: 'Văn bản hợp nhất', val: meta.isConsolidated },
                                { label: 'Hiến pháp', val: meta.isConstitutional },
                                { label: 'Hiệu lực toàn bộ', val: meta.isEffectAll },
                                { label: 'Văn bản QPPL chính thức', val: meta.isLegalDoc },
                                { label: 'Văn bản cũ', val: meta.isOld },
                                { label: 'Bản dịch', val: meta.isTranslation },
                                { label: 'Có nội dung', val: meta.hasContent },
                                { label: 'Đã xử lý AI', val: meta.hasAIProcessed }
                              ].map((flag, idx) => {
                                if (!flag.val) return null;
                                return (
                                  <Chip
                                    key={idx}
                                    label={flag.label}
                                    color="success"
                                    size="small"
                                    sx={{ 
                                      fontSize: '0.75rem', 
                                      fontWeight: 600, 
                                      height: 24,
                                      bgcolor: 'rgba(16, 185, 129, 0.12)',
                                      color: '#10b981',
                                      border: '1px solid rgba(16, 185, 129, 0.3)'
                                    }}
                                  />
                                );
                              })}
                            </Box>
                          </Paper>

                          {/* Related URLs Box */}
                          <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: 'none', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                              <LinkIcon sx={{ color: 'info.main', fontSize: 20 }} />
                              <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Bài viết liên quan
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {item.relatedUrls && item.relatedUrls.length > 0 ? (
                                <>
                                  {item.relatedUrls.slice(0, 5).map((url, idx) => (
                                    <Link key={idx} href={url} target="_blank" rel="noopener noreferrer" sx={{ fontSize: '0.8rem', color: 'primary.main', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>
                                      {url}
                                    </Link>
                                  ))}
                                  {item.relatedUrls.length > 5 && (
                                    <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                      +{item.relatedUrls.length - 5} liên kết khác...
                                    </Typography>
                                  )}
                                </>
                              ) : (
                                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                  Không có văn bản liên quan.
                                </Typography>
                              )}
                            </Box>
                          </Paper>

                        </Box>

                      </Box>
                    </Box>
                  );
                }

                return (
                  <Box sx={{ p: 3, pl: { xs: 2, md: 5 }, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 4 }}>
                      
                      {/* Cột trái: Thông tin chính */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Breadcrumbs */}
                        {item.breadcrumb && item.breadcrumb.length > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: 'primary.main', textTransform: 'uppercase', fontSize: '0.75rem' }}>Phân loại (Breadcrumbs):</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                              {item.breadcrumb.map((bc, idx) => (
                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>{bc}</Typography>
                                  {idx < item.breadcrumb!.length - 1 && <Typography variant="caption" sx={{ color: 'divider' }}>/</Typography>}
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}

                        {/* Description & Excerpt */}
                        {activeSite !== 'vbpl' && (item.description || item.excerpt) && (
                          <Box>
                            {item.description && (
                              <Typography variant="body2" sx={{ mb: item.excerpt ? 1 : 0, color: 'text.primary', fontWeight: 500, fontStyle: 'italic' }}>
                                {item.description}
                              </Typography>
                            )}
                            {item.excerpt && (
                              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {item.excerpt}
                              </Typography>
                            )}
                          </Box>
                        )}

                        {/* Raw Keywords */}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75, color: 'text.secondary', fontSize: '0.75rem' }}>Từ khóa gốc (Raw Tags):</Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {item.tags?.map((t, idx) => (
                              <Chip key={`r-${idx}`} label={t} size="small" variant="outlined" sx={{ fontSize: 11, bgcolor: 'background.paper', height: 22 }} />
                            ))}
                            {!item.tags?.length && <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>Không có từ khóa nào được gắn từ website.</Typography>}
                          </Box>
                        </Box>

                        {/* Phân loại hệ thống (Bị ẩn khỏi bảng chính của VBPL) */}
                        {activeSite === 'vbpl' && (
                          <>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem' }}>Mục:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>{item.section || '-'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem' }}>Chủ đề:</Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {item.category?.map((c, idx) => (
                                  <Chip key={`exp-cat-${idx}`} label={c} size="small" variant="outlined" color="primary" sx={{ fontSize: 10, height: 18, fontWeight: 500 }} />
                                ))}
                                {!item.category?.length && <Typography variant="body2" sx={{ color: 'text.secondary' }}>-</Typography>}
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem' }}>Thời gian cào bài:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                {safeFormat(item.createdAt, 'dd/MM/yyyy HH:mm')}
                              </Typography>
                            </Box>
                          </>
                        )}
                      </Box>

                      {/* Cột phải: Metadata & Links */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pl: { lg: 3 }, borderLeft: { lg: '1px dashed' }, borderColor: { lg: 'divider' } }}>
                        
                        {/* AI Keywords are now managed directly inline in the list row above */}
                        
                        {/* Metadata Box */}
                        {item.metadata && Object.keys(item.metadata).length > 0 && (
                          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AnalyticsOutlinedIcon fontSize="small" sx={{ color: 'primary.main' }} />
                              Thuộc tính văn bản
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {item.metadata.docNumber && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="caption" color="text.secondary">Số hiệu:</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{item.metadata.docNumber}</Typography></Box>
                              )}
                              {item.metadata.issuingAgency && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="caption" color="text.secondary">Cơ quan ban hành:</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{item.metadata.issuingAgency}</Typography></Box>
                              )}
                              {item.metadata.issuedDate && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption" color="text.secondary">Ngày ban hành:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {item.metadata.issuedDate.includes('T') ? safeFormat(item.metadata.issuedDate, 'dd/MM/yyyy') : item.metadata.issuedDate}
                                  </Typography>
                                </Box>
                              )}
                              {item.metadata.effectiveDate && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption" color="text.secondary">Ngày hiệu lực:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {item.metadata.effectiveDate.includes('T') ? safeFormat(item.metadata.effectiveDate, 'dd/MM/yyyy') : item.metadata.effectiveDate}
                                  </Typography>
                                </Box>
                              )}
                              {item.metadata.linhVuc && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="caption" color="text.secondary">Lĩnh vực:</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{item.metadata.linhVuc}</Typography></Box>
                              )}
                              {item.metadata.scope && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption" color="text.secondary">Phạm vi:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: item.metadata.scope === 'TW' ? 'primary.main' : 'success.main' }}>
                                    {item.metadata.scope === 'TW' ? 'Trung ương (TW)' : 'Địa phương (DP)'}
                                  </Typography>
                                </Box>
                              )}
                              {item.metadata.effStatus && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption" color="text.secondary">Tình trạng hiệu lực:</Typography>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: 600,
                                      color: 
                                        item.metadata.effStatusCode === 'CCHL' ? 'warning.main' : 
                                        item.metadata.effStatusCode === 'CHL' ? 'success.main' : 
                                        'text.secondary'
                                    }}
                                  >
                                    {item.metadata.effStatus}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        )}

                        {/* Related URLs */}
                        {item.relatedUrls && item.relatedUrls.length > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary', fontSize: '0.75rem' }}>Bài viết liên quan ({item.relatedUrls.length}):</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {item.relatedUrls.slice(0, 5).map((url, idx) => (
                                <Link key={idx} href={url} target="_blank" rel="noopener noreferrer" sx={{ fontSize: '0.8rem', color: 'primary.main', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {url}
                                </Link>
                              ))}
                              {item.relatedUrls.length > 5 && (
                                <Typography variant="caption" color="text.disabled">+{item.relatedUrls.length - 5} liên kết khác...</Typography>
                              )}
                            </Box>
                          </Box>
                        )}

                      </Box>
                    </Box>
                  </Box>
                );
              }}
            />
          </Box>

        </Paper>
      </Collapse>

      {/* Schedule Dialog */}
      <Dialog open={openScheduleDialog} onClose={() => setOpenScheduleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Cấu hình cào bài tự động</Typography>
          <IconButton onClick={() => setOpenScheduleDialog(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderRadius: 2, bgcolor: schedule?.enabled ? 'info.light' : 'background.default', border: '1px solid', borderColor: 'divider' }}>
              <Box>
                <Typography sx={{ fontWeight: 700, color: schedule?.enabled ? 'info.dark' : 'text.primary' }}>Trạng thái tự động</Typography>
                <Typography variant="body2" color={schedule?.enabled ? 'info.dark' : 'text.secondary'}>
                  {schedule?.enabled ? 'Hệ thống sẽ tự động quét bài theo lịch' : 'Hiện đang tắt'}
                </Typography>
              </Box>
              <FormControlLabel
                control={<Switch checked={!!schedule?.enabled} onChange={handleToggleSchedule} disabled={isUpdatingSchedule} />}
                label={schedule?.enabled ? 'BẬT' : 'TẮT'}
              />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Tần suất cào bài</Typography>
              <Select
                fullWidth
                size="small"
                value={cronPreset}
                onChange={(e) => {
                  const val = e.target.value;
                  setCronPreset(val);
                  if (val !== 'custom') {
                    setCronInput(val);
                  }
                }}
                disabled={!schedule?.enabled || isUpdatingSchedule}
                sx={{ mb: cronPreset === 'custom' ? 2 : 0 }}
              >
                {CRON_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label} {opt.value !== 'custom' && <Typography component="span" variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>({opt.value})</Typography>}
                  </MenuItem>
                ))}
              </Select>
              
              <Collapse in={cronPreset === 'custom'}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Cú pháp Cron tuỳ chỉnh</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={cronInput}
                  onChange={(e) => setCronInput(e.target.value)}
                  placeholder="0 */6 * * *"
                  disabled={!schedule?.enabled || isUpdatingSchedule}
                  helperText="Ví dụ: '0 */6 * * *' (chạy mỗi 6 tiếng một lần)"
                />
              </Collapse>
            </Box>

            {schedule?.enabled && schedule?.nextRun && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <ScheduleIcon fontSize="small" />
                <Typography variant="body2">Lần chạy tiếp theo: <strong>{safeFormat(schedule.nextRun, 'dd/MM/yyyy HH:mm')}</strong></Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenScheduleDialog(false)} variant="outlined" sx={{ borderRadius: 2 }}>Đóng</Button>
          <Button
            onClick={handleUpdateSchedule}
            variant="contained"
            disabled={!schedule?.enabled || isUpdatingSchedule}
            startIcon={isUpdatingSchedule ? <CircularProgress size={16} /> : null}
            sx={{ borderRadius: 2 }}
          >
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Excel Download Dialog */}
      <Dialog 
        open={openDownloadDialog} 
        onClose={() => !isDownloading && setOpenDownloadDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 4, 
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.06)'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Tải xuống dữ liệu Excel
          </Typography>
          <IconButton 
            onClick={() => setOpenDownloadDialog(false)} 
            disabled={isDownloading} 
            size="small"
            sx={{ '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)', color: '#f87171' } }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* Nguồn cào */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>Nguồn dữ liệu</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {SITE_SOURCES.find(s => s.id === activeSite)?.name || activeSite}
            </Typography>
          </Box>

          {/* Thời gian */}
          <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={downloadAllTime} 
                  onChange={(e) => setDownloadAllTime(e.target.checked)} 
                  disabled={isDownloading}
                  color="primary"
                />
              }
              label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Tải toàn bộ thời gian</Typography>}
              sx={{ mb: downloadAllTime ? 0 : 2 }}
            />
            
            <Collapse in={!downloadAllTime}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Từ ngày</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={downloadStartDate}
                    onChange={(e) => setDownloadStartDate(e.target.value)}
                    disabled={isDownloading}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Đến ngày</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={downloadEndDate}
                    onChange={(e) => setDownloadEndDate(e.target.value)}
                    disabled={isDownloading}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Box>
              </Box>
            </Collapse>
          </Box>

          {/* Bộ lọc động */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 }}>
              Bộ lọc dữ liệu
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              
              <Box sx={{ gridColumn: 'span 2' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Từ khóa tìm kiếm</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Tìm kiếm tiêu đề, từ khóa..."
                  value={downloadQ}
                  onChange={(e) => setDownloadQ(e.target.value)}
                  disabled={isDownloading}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Mục</Typography>
                <Select
                  fullWidth
                  size="small"
                  value={downloadSection}
                  onChange={(e) => setDownloadSection(e.target.value)}
                  displayEmpty
                  disabled={isDownloading}
                  MenuProps={filterMenuProps}
                >
                  <MenuItem value="">Tất cả mục</MenuItem>
                  {Object.keys(summary?.bySection || {}).map(sec => (
                    <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                  ))}
                </Select>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Chủ đề / Từ khóa</Typography>
                <Select
                  fullWidth
                  size="small"
                  value={downloadTag}
                  onChange={(e) => setDownloadTag(e.target.value)}
                  displayEmpty
                  disabled={isDownloading || loadingTags}
                  MenuProps={filterMenuProps}
                >
                  <MenuItem value="">Tất cả chủ đề</MenuItem>
                  {loadingTags ? (
                    <MenuItem disabled>
                      <CircularProgress size={16} sx={{ mr: 1 }} /> Đang tải...
                    </MenuItem>
                  ) : (
                    [...new Set([...categoriesList, ...tagsList])]
                      .filter(Boolean)
                      .sort((a, b) => a.localeCompare(b, 'vi'))
                      .map((t, idx) => (
                        <MenuItem key={idx} value={t}>{t}</MenuItem>
                      ))
                  )}
                </Select>
              </Box>

              {activeSite === 'vbpl' && (
                <>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Phạm vi</Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={downloadScope}
                      onChange={(e) => setDownloadScope(e.target.value)}
                      displayEmpty
                      disabled={isDownloading}
                      MenuProps={filterMenuProps}
                    >
                      <MenuItem value="">Tất cả phạm vi</MenuItem>
                      <MenuItem value="TW">Trung ương (TW)</MenuItem>
                      <MenuItem value="DP">Địa phương (DP)</MenuItem>
                    </Select>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Tình trạng hiệu lực</Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={downloadEffStatusCode}
                      onChange={(e) => setDownloadEffStatusCode(e.target.value)}
                      displayEmpty
                      disabled={isDownloading}
                      MenuProps={filterMenuProps}
                    >
                      <MenuItem value="">Tất cả hiệu lực</MenuItem>
                      <MenuItem value="CHL">Còn hiệu lực</MenuItem>
                      <MenuItem value="CCHL">Chưa có hiệu lực</MenuItem>
                      <MenuItem value="HHL">Hết hiệu lực toàn bộ</MenuItem>
                      <MenuItem value="NHL">Ngưng hiệu lực</MenuItem>
                      <MenuItem value="5">Chưa xác định</MenuItem>
                    </Select>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Ngành</Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={downloadNganh}
                      onChange={(e) => setDownloadNganh(e.target.value)}
                      displayEmpty
                      disabled={isDownloading}
                      MenuProps={filterMenuProps}
                    >
                      <MenuItem value="">Tất cả ngành</MenuItem>
                      {LEGAL_SECTORS.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                    </Select>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Lĩnh vực</Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={downloadLinhVuc}
                      onChange={(e) => setDownloadLinhVuc(e.target.value)}
                      displayEmpty
                      disabled={isDownloading}
                      MenuProps={filterMenuProps}
                    >
                      <MenuItem value="">Tất cả lĩnh vực</MenuItem>
                      {LEGAL_DOMAINS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                    </Select>
                  </Box>

                  <Box sx={{ gridColumn: 'span 2' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Loại văn bản</Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={downloadDocTypeCode}
                      onChange={(e) => setDownloadDocTypeCode(e.target.value)}
                      displayEmpty
                      disabled={isDownloading}
                      MenuProps={filterMenuProps}
                    >
                      <MenuItem value="">Tất cả loại văn bản</MenuItem>
                      {DOC_TYPES.map(t => <MenuItem key={t.code} value={t.code}>{t.label}</MenuItem>)}
                    </Select>
                  </Box>
                </>
              )}
            </Box>
          </Box>

        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
          <Button 
            onClick={() => setOpenDownloadDialog(false)} 
            variant="outlined" 
            disabled={isDownloading}
            sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none', px: 3 }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleDownloadExcel}
            variant="contained"
            color="success"
            disabled={isDownloading}
            startIcon={isDownloading ? <CircularProgress size={18} color="inherit" /> : <CloudDownloadOutlinedIcon />}
            sx={{ 
              borderRadius: 2.5, 
              fontWeight: 700, 
              textTransform: 'none', 
              px: 4,
              boxShadow: 'none',
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669', boxShadow: 'none' }
            }}
          >
            {isDownloading ? 'Đang xuất file...' : 'Xác nhận & Tải xuống'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
