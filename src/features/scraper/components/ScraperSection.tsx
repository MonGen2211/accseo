import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import SearchIcon from '@mui/icons-material/Search';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import Collapse from '@mui/material/Collapse';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SettingsIcon from '@mui/icons-material/Settings';
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
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LinkIcon from '@mui/icons-material/Link';
import GavelIcon from '@mui/icons-material/Gavel';
import GridOnIcon from '@mui/icons-material/GridOn';
import { useAppSelector } from '../../../app/store';

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
import type { ScraperArticle, ScraperSummary, ScraperSchedule } from '../types';

const CRON_OPTIONS = [
  { value: '0 * * * *', label: 'Mỗi giờ một lần' },
  { value: '0 */2 * * *', label: 'Mỗi 2 giờ một lần' },
  { value: '0 */6 * * *', label: 'Mỗi 6 giờ một lần' },
  { value: '0 */12 * * *', label: 'Mỗi 12 giờ một lần' },
  { value: '0 0 * * *', label: 'Mỗi ngày lúc 00:00' },
  { value: '0 0 * * 0', label: 'Mỗi tuần vào Chủ Nhật' },
  { value: 'custom', label: 'Tùy chỉnh nâng cao...' }
];

const SITE_SOURCES = [
  { id: 'thuvienphapluat', name: 'Thư viện pháp luật', desc: 'Chuyên trang văn bản & hỏi đáp', color: '#166534', bg: '#dcfce7' },
  { id: 'luatminhkhue', name: 'Luật Minh Khuê', desc: 'Tư vấn luật & tin tức đa ngành', color: '#1e40af', bg: '#dbeafe' },
  { id: 'luatduonggia', name: 'Luật Dương Gia', desc: 'Pháp luật tổng hợp', color: '#0f766e', bg: '#ccfbf1' },
  { id: 'luatvietnam', name: 'Luật Việt Nam', desc: 'Tin văn bản mới', color: '#0e7490', bg: '#cffafe' },
  { id: 'ketoananpha', name: 'Kế Toán An Pha', desc: 'Kế toán - Thuế', color: '#be185d', bg: '#fce7f3' },
  { id: 'vbpl', name: 'CSDL Quốc gia VBPL', desc: 'Văn bản pháp luật Bộ Tư pháp', color: '#b45309', bg: '#fef3c7' },
  { id: 'rss', name: 'Các tờ báo', desc: 'Tin tức báo chí', color: '#4f46e5', bg: '#e0e7ff' },
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
  { code: 'QĐ', label: 'Quyết định (QĐ)' },
  { code: 'NĐ', label: 'Nghị định (NĐ)' },
  { code: 'CV', label: 'Công văn (CV)' },
  { code: 'NQ', label: 'Nghị quyết (NQ)' },
  { code: 'L', label: 'Luật (L)' },
  { code: 'PL', label: 'Pháp lệnh (PL)' },
  { code: 'CH', label: 'Chỉ thị (CH)' }
];

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
  const [date, setDate] = useState('');
  const [q, setQ] = useState('');
  const [onlyNew, setOnlyNew] = useState(false);
  const [scope, setScope] = useState('');
  const [effStatusCode, setEffStatusCode] = useState('');
  const [nganh, setNganh] = useState('');
  const [linhVuc, setLinhVuc] = useState('');
  const [docTypeCode, setDocTypeCode] = useState('');
  const [sheetStatus, setSheetStatus] = useState('all');
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
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
  const [selectedArticleForAi, setSelectedArticleForAi] = useState<ScraperArticle | null>(null);
  const [openAiConfirmDialog, setOpenAiConfirmDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);

  // --- Schedule State ---
  const [schedule, setSchedule] = useState<ScraperSchedule | null>(null);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [cronInput, setCronInput] = useState('0 */6 * * *');
  const [cronPreset, setCronPreset] = useState('0 */6 * * *');
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);

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
    } catch (err: any) {
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
      const data = await scraperService.getSummary({ source: activeSite, date });
      setSummary(data);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi tải thống kê', 'danger');
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadTags = async () => {
    try {
      const k = await scraperService.getTags({ source: activeSite });
      setTagsList(k?.tags || []);
      setCategoriesList(k?.categories || []);
    } catch (err) {
      console.error(err);
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
        sheetStatus: sheetStatus || undefined,
        page: p + 1,
        limit: l
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi tải danh sách', 'danger');
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
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
    loadTags();
    loadSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSite]);

  useEffect(() => {
    loadSummary();
    loadArticles(0, limit);
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSite, section, tag, date, debouncedQ, onlyNew, scope, effStatusCode, nganh, linhVuc, docTypeCode, sheetStatus]);

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

  const handleTriggerScrape = async () => {
    setIsTriggering(true);
    showToast(`Đang cào bài từ ${SITE_SOURCES.find(s => s.id === activeSite)?.name}, vui lòng đợi 1-3 phút...`, 'info');
    try {
      const res = await scraperService.triggerManualScrape(activeSite);
      showToast(res.message || 'Cào bài hoàn thành!', 'success');
      loadSummary();
      loadArticles(0, limit);
      loadTags();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi khi cào bài', 'danger');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleUpdateSchedule = async () => {
    setIsUpdatingSchedule(true);
    try {
      const res = await scraperService.updateSchedule(cronInput);
      showToast(res.message || 'Cập nhật lịch thành công', 'success');
      setOpenScheduleDialog(false);
      loadSchedule();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi cập nhật lịch', 'danger');
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
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi khi thay đổi trạng thái', 'danger');
    } finally {
      setIsUpdatingSchedule(false);
    }
  };

  // --- AI Keyword Generator Handlers ---
  const handleAiError = (err: any) => {
    const errorData = err.response?.data;
    const code = errorData?.code || '';
    const message = errorData?.message || err.message || 'Lỗi không xác định';

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
  };

  const handleAiGenerate = async (article: ScraperArticle, force = false) => {
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
    } catch (err: any) {
      handleAiError(err);
    } finally {
      setAiLoadingId(null);
    }
  };

  const handleResetArticleAiState = async (article: ScraperArticle) => {
    if (!window.confirm('Bạn có chắc chắn muốn reset trạng thái AI/Sheet cho bài viết này về "chưa gen"?')) {
      return;
    }
    setAiLoadingId(article._id);
    try {
      await scraperService.resetAiState(undefined, article._id);
      
      const updatedArticle = {
        ...article,
        sheetUrl: null,
        sheetPushedAt: null,
        sheetLastBatch: 0
      };
      
      setItems(prev => prev.map(item => item._id === article._id ? updatedArticle : item));
      showToast('Đã reset trạng thái AI/Sheet cho bài viết này!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi khi reset trạng thái AI', 'danger');
    } finally {
      setAiLoadingId(null);
    }
  };

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
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi khi reset trạng thái nguồn', 'danger');
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
        } catch (err: any) {
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
    setSelectedIds([]);
  }, [activeSite, page, section, tag, date, q, scope, effStatusCode, nganh, linhVuc, docTypeCode]);

  const handleAiClick = async (article: ScraperArticle) => {
    const id = article._id || article.id;
    setExpandedRowId(prev => prev === id ? null : String(id));
  };

  const handleAiForceConfirm = () => {
    if (!selectedArticleForAi) return;
    setOpenAiConfirmDialog(false);
    handleAiGenerate(selectedArticleForAi, true);
  };

  const renderAiKeywordsCard = (item: ScraperArticle) => {
    const isGenerating = aiLoadingId === item._id;
    const sheetUrl = item.sheetUrl;
    const sheetLastBatch = item.sheetLastBatch;
    const sheetPushedAt = item.sheetPushedAt;

    return (
      <Paper 
        sx={{ 
          p: 2, 
          borderRadius: 2, 
          border: '1px solid', 
          borderColor: 'divider', 
          bgcolor: 'background.paper', 
          boxShadow: 'none', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1.2,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
          <PsychologyIcon sx={{ color: '#a855f7', fontSize: 18 }} />
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            AI Keywords (SEO)
          </Typography>
        </Box>

        {isGenerating ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 2, gap: 1 }}>
            <CircularProgress size={20} sx={{ color: '#a855f7' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Đang gọi AI và push Sheet... (5-15s)
            </Typography>
          </Box>
        ) : sheetUrl ? (
          /* Case 2: Đã generated */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1.5, bgcolor: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <GridOnIcon sx={{ color: '#10b981', fontSize: 20 }} />
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block' }}>
                  Đã push lên Sheet
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary', display: 'block', mt: 0.25 }}>
                  Batch #{sheetLastBatch} · Cập nhật: {sheetPushedAt ? safeFormat(sheetPushedAt, 'dd/MM/yyyy HH:mm') : '-'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => window.open(sheetUrl, '_blank', 'noopener,noreferrer')}
                  startIcon={<GridOnIcon sx={{ fontSize: 14 }} />}
                  fullWidth
                  size="small"
                  sx={{ 
                    borderRadius: 1.5, 
                    textTransform: 'none', 
                    fontWeight: 700, 
                    fontSize: '0.75rem',
                    bgcolor: '#10b981',
                    boxShadow: 'none',
                    '&:hover': { bgcolor: '#059669', boxShadow: 'none' }
                  }}
                >
                  Mở Sheet
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setSelectedArticleForAi(item);
                    setOpenAiConfirmDialog(true);
                  }}
                  startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                  fullWidth
                  size="small"
                  sx={{ 
                    borderRadius: 1.5, 
                    textTransform: 'none', 
                    fontWeight: 700, 
                    fontSize: '0.75rem',
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': { bgcolor: 'action.hover', borderColor: 'text.primary' }
                  }}
                >
                  Gen lại AI
                </Button>
              </Box>

              {isAdmin && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleResetArticleAiState(item)}
                  fullWidth
                  size="small"
                  sx={{ 
                    borderRadius: 1.5, 
                    textTransform: 'none', 
                    fontWeight: 700, 
                    fontSize: '0.75rem',
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    color: '#ef4444',
                    '&:hover': {
                      borderColor: '#ef4444',
                      bgcolor: 'rgba(239, 68, 68, 0.04)',
                    }
                  }}
                >
                  Reset AI State (Admin)
                </Button>
              )}
            </Box>
          </Box>
        ) : (
          /* Case 1: Chưa generated */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, lineHeight: 1.4, display: 'block' }}>
              AI tự sinh keyword + đẩy lên Sheet team chỉnh
            </Typography>

            <Tooltip title="Sẽ block 5-15s, vui lòng đợi">
              <Button
                variant="contained"
                onClick={() => handleAiGenerate(item, false)}
                startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                fullWidth
                size="small"
                sx={{ 
                  borderRadius: 1.5, 
                  textTransform: 'none', 
                  fontWeight: 700, 
                  fontSize: '0.75rem',
                  background: 'linear-gradient(45deg, #a855f7, #7c3aed)',
                  boxShadow: 'none',
                  '&:hover': { 
                    background: 'linear-gradient(45deg, #9333ea, #6d28d9)',
                    boxShadow: 'none'
                  }
                }}
              >
                Gen AI & Push Sheet
              </Button>
            </Tooltip>
          </Box>
        )}
      </Paper>
    );
  };

  const renderInlineAiKeywords = (item: ScraperArticle) => {
    const isGenerating = aiLoadingId === item._id;
    const sheetUrl = item.sheetUrl;
    const sheetLastBatch = item.sheetLastBatch;

    if (isGenerating) {
      return (
        <Tooltip title="Đang gọi AI & push Sheet... (5-15s)">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              borderRadius: '50%',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              bgcolor: 'rgba(168, 85, 247, 0.08)',
            }}
          >
            <CircularProgress size={14} sx={{ color: '#a855f7' }} />
          </Box>
        </Tooltip>
      );
    }

    if (sheetUrl) {
      return (
        <Tooltip title={`Đã push Sheet (Batch #${sheetLastBatch || 1}) · Click để mở Google Sheet`} onClick={(e) => e.stopPropagation()}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              window.open(sheetUrl, '_blank', 'noopener,noreferrer');
            }}
            sx={{
              p: 0.5,
              borderRadius: '50%',
              border: '1px solid #10b981',
              bgcolor: 'rgba(16, 185, 129, 0.08)',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'rgba(16, 185, 129, 0.15)',
                borderColor: '#059669',
                transform: 'scale(1.1)',
              }
            }}
          >
            <GridOnIcon sx={{ fontSize: 14, color: '#10b981' }} />
          </IconButton>
        </Tooltip>
      );
    }

    // Default/Not generated: Purple Brain Icon Button
    return (
      <Tooltip title="Nhấp để tự động Gen AI & Push Sheet" onClick={(e) => e.stopPropagation()}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleAiGenerate(item, false);
          }}
          disabled={aiLoadingId !== null}
          sx={{
            p: 0.5,
            borderRadius: '50%',
            border: '1px solid rgba(168, 85, 247, 0.6)',
            bgcolor: 'rgba(168, 85, 247, 0.08)',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'rgba(168, 85, 247, 0.15)',
              borderColor: '#9333ea',
              transform: 'scale(1.1)',
            },
            '&.Mui-disabled': {
              border: '1px solid rgba(168, 85, 247, 0.2)',
              bgcolor: 'rgba(168, 85, 247, 0.03)',
            }
          }}
        >
          <PsychologyIcon sx={{ fontSize: 16, color: '#4b5563' }} />
        </IconButton>
      </Tooltip>
    );
  };

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
            color: 'rgba(168, 85, 247, 0.4)',
            '&.Mui-checked': { color: '#a855f7' },
            '&.MuiCheckbox-indeterminate': { color: '#a855f7' }
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
              color: 'rgba(168, 85, 247, 0.3)',
              '&.Mui-checked': { color: '#a855f7' }
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

                  {/* AI Google Sheets / Generate Inline Controls */}
                  {renderInlineAiKeywords(item)}
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
                  Ban hành: <strong style={{ color: '#1e293b' }}>{formatVal(issued)}</strong>
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Hiệu lực: <strong style={{ color: '#1e293b' }}>{formatVal(effective)}</strong>
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

                  {/* AI Google Sheets / Generate Inline Controls */}
                  {renderInlineAiKeywords(item)}

                  <Link href={item.url} target="_blank" rel="noopener noreferrer" sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    {item.title}
                  </Link>
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
                {item.category?.map((t, idx) => (
                  <Chip key={`f-${idx}`} label={t} size="small" variant="outlined" color="primary" sx={{ fontSize: 11 }} />
                ))}
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
  }, [activeSite, aiLoadingId, selectedIds, items]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 4 }}>
      {/* SITES */}
      <Box>

        {/* SITE CARDS */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2 }}>
          {SITE_SOURCES.map((site) => {
            const isActive = activeSite === site.id;
            return (
              <Paper
                key={site.id}
                onClick={() => setActiveSite(site.id)}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: isActive ? 'primary.main' : 'transparent',
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
                {/* Background Tint */}
                <Box sx={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '40%', background: `linear-gradient(90deg, transparent, ${site.bg})`, opacity: isActive ? 1 : 0.4, transition: 'opacity 0.3s' }} />
                
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ p: 0.5, borderRadius: 1.5, bgcolor: site.bg, color: site.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, gap: 3, mb: 4 }}>
            {/* Summary Box */}
            <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <AnalyticsOutlinedIcon color="primary" />
                <Typography sx={{ fontWeight: 700 }}>Tổng quan (Hiện có)</Typography>
              </Box>
              {loadingSummary ? (
                <CircularProgress size={24} />
              ) : summary ? (
                <Box>
                  <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: 'primary.main', lineHeight: 1, mb: 1 }}>
                    {summary.total}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {Object.entries(summary.bySection || {}).map(([sec, count]) => (
                      <Box key={sec} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{sec}</Typography>
                        <Chip label={count} size="small" sx={{ height: 20, fontSize: 11 }} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">Chưa có dữ liệu</Typography>
              )}
            </Box>

            {/* Top Keywords Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
              
              <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <FormatListBulletedIcon color="primary" />
                  <Typography sx={{ fontWeight: 700 }}>Danh mục / Loại văn bản</Typography>
                </Box>
                {loadingSummary ? (
                  <CircularProgress size={24} />
                ) : summary?.topCategories?.length ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {summary.topCategories.map((t, idx) => (
                      <Chip
                        key={`f-${idx}`}
                        label={`${t.name} (${t.count})`}
                        onClick={() => setTag(t.name)}
                        sx={{ 
                          bgcolor: tag === t.name ? 'primary.main' : 'background.paper',
                          color: tag === t.name ? 'primary.contrastText' : 'text.primary',
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: tag === t.name ? 'primary.main' : 'divider',
                          '&:hover': { bgcolor: tag === t.name ? 'primary.dark' : 'action.hover' }
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">Không có dữ liệu</Typography>
                )}
              </Box>

              <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <FormatListBulletedIcon color="secondary" />
                  <Typography sx={{ fontWeight: 700 }}>Từ khóa nổi bật</Typography>
                </Box>
                {loadingSummary ? (
                  <CircularProgress size={24} />
                ) : summary?.topTags?.length ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {summary.topTags.map((t, idx) => (
                      <Chip
                        key={`r-${idx}`}
                        label={`${t.name} (${t.count})`}
                        onClick={() => setTag(t.name)}
                        size="small"
                        sx={{ 
                          bgcolor: tag === t.name ? 'secondary.main' : 'background.paper',
                          color: tag === t.name ? 'secondary.contrastText' : 'text.secondary',
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: tag === t.name ? 'secondary.main' : 'divider',
                          '&:hover': { bgcolor: tag === t.name ? 'secondary.dark' : 'action.hover' }
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">Không có dữ liệu</Typography>
                )}
              </Box>

            </Box>
          </Box>

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
            <Select size="small" value={section} onChange={(e) => setSection(e.target.value)} displayEmpty sx={{ minWidth: 150 }}>
              <MenuItem value="">Tất cả Mục</MenuItem>
              {Object.keys(summary?.bySection || {}).map(sec => (
                <MenuItem key={sec} value={sec}>{sec}</MenuItem>
              ))}
            </Select>
            <Select size="small" value={tag} onChange={(e) => setTag(e.target.value)} displayEmpty sx={{ minWidth: 150 }}>
              <MenuItem value="">Tất cả Chủ đề / Từ khóa</MenuItem>
              {[...new Set([...categoriesList, ...tagsList])].map((t, idx) => (
                <MenuItem key={idx} value={t}>{t}</MenuItem>
              ))}
            </Select>
            <TextField
              size="small"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              sx={{ width: 140 }}
            />
            <Select 
              size="small" 
              value={sheetStatus} 
              onChange={(e) => setSheetStatus(e.target.value)} 
              displayEmpty 
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">Tất cả Trạng thái Sheet</MenuItem>
              <MenuItem value="pushed">Đã push Sheet</MenuItem>
              <MenuItem value="notpushed">Chưa push Sheet</MenuItem>
            </Select>
            {activeSite === 'vbpl' && (
              <>
                <Select size="small" value={scope} onChange={(e) => setScope(e.target.value)} displayEmpty sx={{ minWidth: 150 }}>
                  <MenuItem value="">Tất cả Phạm vi</MenuItem>
                  <MenuItem value="TW">Trung ương (TW)</MenuItem>
                  <MenuItem value="DP">Địa phương (DP)</MenuItem>
                </Select>
                <Select size="small" value={effStatusCode} onChange={(e) => setEffStatusCode(e.target.value)} displayEmpty sx={{ minWidth: 160 }}>
                  <MenuItem value="">Tất cả Hiệu lực</MenuItem>
                  <MenuItem value="CHL">Còn hiệu lực</MenuItem>
                  <MenuItem value="CCHL">Sắp có hiệu lực</MenuItem>
                  <MenuItem value="HHL">Hết hiệu lực toàn bộ</MenuItem>
                  <MenuItem value="NHL">Ngưng hiệu lực</MenuItem>
                </Select>
                <Select size="small" value={nganh} onChange={(e) => setNganh(e.target.value)} displayEmpty sx={{ minWidth: 150 }}>
                  <MenuItem value="">Tất cả Ngành</MenuItem>
                  {LEGAL_SECTORS.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </Select>
                <Select size="small" value={linhVuc} onChange={(e) => setLinhVuc(e.target.value)} displayEmpty sx={{ minWidth: 150 }}>
                  <MenuItem value="">Tất cả Lĩnh vực</MenuItem>
                  {LEGAL_DOMAINS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </Select>
                <Select size="small" value={docTypeCode} onChange={(e) => setDocTypeCode(e.target.value)} displayEmpty sx={{ minWidth: 150 }}>
                  <MenuItem value="">Tất cả Loại VB</MenuItem>
                  {DOC_TYPES.map(t => <MenuItem key={t.code} value={t.code}>{t.label}</MenuItem>)}
                </Select>
              </>
            )}
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
            {(section || tag || date || q || onlyNew || scope || effStatusCode || nganh || linhVuc || docTypeCode || sheetStatus !== 'all') && (
              <Button size="small" color="error" onClick={() => { setSection(''); setTag(''); setDate(''); setQ(''); setOnlyNew(false); setScope(''); setEffStatusCode(''); setNganh(''); setLinhVuc(''); setDocTypeCode(''); setSheetStatus('all'); }}>
                Xóa lọc
              </Button>
            )}
          </Box>

          {selectedIds.length > 0 && (
            <Paper
              sx={{
                p: 1.5,
                mb: 2,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'rgba(168, 85, 247, 0.05)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                animation: 'fadeIn 0.3s ease-in-out',
                '@keyframes fadeIn': {
                  '0%': { opacity: 0, transform: 'translateY(-10px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' }
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PsychologyIcon sx={{ color: '#a855f7' }} />
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
                    background: 'linear-gradient(45deg, #a855f7, #7c3aed)',
                    boxShadow: 'none',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #9333ea, #6d28d9)',
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
              data={items}
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
                  disabled={isDownloading}
                >
                  <MenuItem value="">Tất cả chủ đề</MenuItem>
                  {[...new Set([...categoriesList, ...tagsList])].map((t, idx) => (
                    <MenuItem key={idx} value={t}>{t}</MenuItem>
                  ))}
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
                    >
                      <MenuItem value="">Tất cả hiệu lực</MenuItem>
                      <MenuItem value="CHL">Còn hiệu lực</MenuItem>
                      <MenuItem value="CCHL">Sắp có hiệu lực</MenuItem>
                      <MenuItem value="HHL">Hết hiệu lực toàn bộ</MenuItem>
                      <MenuItem value="NHL">Ngưng hiệu lực</MenuItem>
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

      {/* AI Force Regenerate Confirmation Dialog */}
      <Dialog 
        open={openAiConfirmDialog} 
        onClose={() => setOpenAiConfirmDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>⚠️ Xác nhận tạo lại từ khóa</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.5 }}>
            Sẽ gọi AI lại + thêm 1 batch mới xuống cuối Sheet, tốn quota. Tiếp tục?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => setOpenAiConfirmDialog(false)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Hủy
          </Button>
          <Button 
            variant="contained" 
            color="warning" 
            onClick={handleAiForceConfirm}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800 }}
          >
            Đồng ý, tạo lại
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
