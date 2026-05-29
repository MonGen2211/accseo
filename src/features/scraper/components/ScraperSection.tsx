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

export default function ScraperSection() {
  const { showToast } = useToastify();

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
  const [aiLoadingText, setAiLoadingText] = useState('');
  const [selectedArticleForAi, setSelectedArticleForAi] = useState<ScraperArticle | null>(null);
  const [openAiDialog, setOpenAiDialog] = useState(false);
  const [openAiConfirmDialog, setOpenAiConfirmDialog] = useState(false);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [activeTopicIdx, setActiveTopicIdx] = useState(0);

  useEffect(() => {
    if (openAiDialog) {
      setActiveTopicIdx(0);
    }
  }, [openAiDialog]);

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
          'Phạm vi'
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
            item.metadata?.scope === 'TW' ? 'Trung ương' : item.metadata?.scope === 'DP' ? 'Địa phương' : item.metadata?.scope || ''
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
    loadTags();
    loadSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSite]);

  useEffect(() => {
    loadSummary();
    loadArticles(0, limit);
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSite, section, tag, date, debouncedQ, onlyNew, scope, effStatusCode]);

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

    if (code === 'AI_GENERATE_LOCKED') {
      showToast('Đang xử lý, đợi 5s và thử lại', 'warning');
    } else if (code === 'AI_RATE_LIMIT') {
      showToast('Quota AI hết, thử lại sau', 'danger');
    } else if (code === 'AI_INVALID_RESPONSE') {
      showToast('AI lỗi, vui lòng thử lại', 'danger');
    } else if (code === 'AI_GENERATE_FAILED') {
      showToast(message, 'danger');
    } else {
      showToast(message, 'danger');
    }
  };

  const handleAiClick = async (article: ScraperArticle) => {
    setSelectedArticleForAi(article);

    if (!article.aiGenerated) {
      setAiLoadingId(article._id);
      setAiLoadingText('AI đang nghiên cứu từ khóa SEO...');
      try {
        const res = await scraperService.aiGenerate(article._id);
        const updatedArticle = {
          ...article,
          aiGenerated: true,
          aiResult: res.data
        };
        setItems(prev => prev.map(item => item._id === article._id ? updatedArticle : item));
        setSelectedArticleForAi(updatedArticle);
        setOpenAiDialog(true);
      } catch (err: any) {
        handleAiError(err);
      } finally {
        setAiLoadingId(null);
      }
    } else {
      if (!article.aiResult) {
        setAiLoadingId(article._id);
        setAiLoadingText('Đang tải dữ liệu từ cache...');
        try {
          const result = await scraperService.getAiResult(article._id);
          const updatedArticle = {
            ...article,
            aiResult: result
          };
          setItems(prev => prev.map(item => item._id === article._id ? updatedArticle : item));
          setSelectedArticleForAi(updatedArticle);
          setOpenAiDialog(true);
        } catch (err: any) {
          handleAiError(err);
        } finally {
          setAiLoadingId(null);
        }
      } else {
        setOpenAiDialog(true);
      }
    }
  };

  const handleAiForceGenerate = async () => {
    if (!selectedArticleForAi) return;
    setOpenAiConfirmDialog(false);
    
    setAiLoadingId(selectedArticleForAi._id);
    setAiLoadingText('AI đang tạo lại từ khóa SEO...');
    try {
      const res = await scraperService.aiGenerate(selectedArticleForAi._id, true);
      const updatedArticle = {
        ...selectedArticleForAi,
        aiGenerated: true,
        aiResult: res.data
      };
      setItems(prev => prev.map(item => item._id === selectedArticleForAi._id ? updatedArticle : item));
      setSelectedArticleForAi(updatedArticle);
      showToast('Tạo lại từ khóa AI thành công!', 'success');
    } catch (err: any) {
      handleAiError(err);
    } finally {
      setAiLoadingId(null);
    }
  };

  const handleCopyKeyword = (kw: string) => {
    navigator.clipboard.writeText(kw);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  const handleCopyAllKeywords = () => {
    if (!selectedArticleForAi?.aiResult?.topics) return;
    const allKws = selectedArticleForAi.aiResult.topics.flatMap(t => t.keywords).join('\n');
    navigator.clipboard.writeText(allKws);
    setCopiedAll(true);
    showToast('Đã copy toàn bộ từ khóa vào Clipboard!', 'success');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // --- Columns ---
  const columns = useMemo<TableField[]>(() => {
    if (activeSite === 'vbpl') {
      return [
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

                  {/* AI Suggestion Icon Button */}
                  <Tooltip title={item.aiGenerated ? 'Xem từ khóa AI' : 'Tạo từ khóa AI'}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAiClick(item);
                      }}
                      disabled={aiLoadingId !== null}
                      sx={{
                        p: 0.5,
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: item.aiGenerated ? 'rgba(168, 85, 247, 0.4)' : 'rgba(168, 85, 247, 0.15)',
                        bgcolor: item.aiGenerated ? 'rgba(168, 85, 247, 0.08)' : 'rgba(168, 85, 247, 0.03)',
                        transition: 'all 0.2s',
                        opacity: item.aiGenerated ? 1 : 0.4,
                        '&:hover': {
                          opacity: 1,
                          bgcolor: 'rgba(168, 85, 247, 0.15)',
                          borderColor: '#a855f7',
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      {aiLoadingId === item._id ? (
                        <CircularProgress size={16} sx={{ color: '#a855f7' }} />
                      ) : (
                        <PsychologyIcon
                          sx={{
                            fontSize: 16,
                            color: item.aiGenerated ? '#a855f7' : 'text.secondary',
                          }}
                        />
                      )}
                    </IconButton>
                  </Tooltip>
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

                  {/* AI Suggestion Icon Button */}
                  <Tooltip title={item.aiGenerated ? 'Xem từ khóa AI' : 'Tạo từ khóa AI'}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAiClick(item);
                      }}
                      disabled={aiLoadingId !== null}
                      sx={{
                        p: 0.5,
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: item.aiGenerated ? 'rgba(168, 85, 247, 0.4)' : 'rgba(168, 85, 247, 0.15)',
                        bgcolor: item.aiGenerated ? 'rgba(168, 85, 247, 0.08)' : 'rgba(168, 85, 247, 0.03)',
                        transition: 'all 0.2s',
                        opacity: item.aiGenerated ? 1 : 0.4,
                        '&:hover': {
                          opacity: 1,
                          bgcolor: 'rgba(168, 85, 247, 0.15)',
                          borderColor: '#a855f7',
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      {aiLoadingId === item._id ? (
                        <CircularProgress size={16} sx={{ color: '#a855f7' }} />
                      ) : (
                        <PsychologyIcon
                          sx={{
                            fontSize: 16,
                            color: item.aiGenerated ? '#a855f7' : 'text.secondary',
                          }}
                        />
                      )}
                    </IconButton>
                  </Tooltip>

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
  }, [activeSite, aiLoadingId]);

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
            {(section || tag || date || q || onlyNew || scope || effStatusCode) && (
              <Button size="small" color="error" onClick={() => { setSection(''); setTag(''); setDate(''); setQ(''); setOnlyNew(false); setScope(''); setEffStatusCode(''); }}>
                Xóa lọc
              </Button>
            )}
          </Box>

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
                          <Box sx={{ p: 2.5, mt: 1, borderRadius: 2.5, bgcolor: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.08)', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid', borderColor: 'divider', pb: 0.75 }}>
                              Thuộc tính phân loại hệ thống
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Mục:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{item.section || '-'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Chủ đề:</Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                {item.category?.map((c, idx) => (
                                  <Chip key={`exp-cat-${idx}`} label={c} size="small" variant="outlined" color="primary" sx={{ fontSize: 10, height: 18, fontWeight: 600 }} />
                                ))}
                                {!item.category?.length && <Typography variant="body2" sx={{ color: 'text.secondary' }}>-</Typography>}
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Thời gian cào bài:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {safeFormat(item.createdAt, 'dd/MM/yyyy HH:mm')}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </Box>

                      {/* Cột phải: Metadata & Links */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pl: { lg: 3 }, borderLeft: { lg: '1px dashed' }, borderColor: { lg: 'divider' } }}>
                        
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

      {/* AI Keywords Results Dialog */}
      <Dialog 
        open={openAiDialog} 
        onClose={() => setOpenAiDialog(false)} 
        maxWidth="lg" 
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
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          pr: 3, 
          pl: 3.5, 
          py: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxWidth: '70%' }}>
            <Typography sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.2, fontSize: '1.35rem', lineHeight: 1.2, letterSpacing: -0.5 }}>
              <PsychologyIcon sx={{ color: '#a855f7', fontSize: 28 }} />
              Từ khóa & Chủ đề đề xuất bởi AI
            </Typography>
            <Typography color="text.secondary" sx={{ 
              display: '-webkit-box', 
              WebkitLineClamp: 1, 
              WebkitBoxOrient: 'vertical', 
              overflow: 'hidden',
              fontSize: '0.88rem',
              fontWeight: 500
            }}>
              {selectedArticleForAi?.title}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedArticleForAi?.source && (
              <Chip 
                label={SITE_SOURCES.find(s => s.id === selectedArticleForAi.source)?.name || selectedArticleForAi.source.toUpperCase()} 
                color="primary" 
                size="medium" 
                sx={{ 
                  fontWeight: 800, 
                  height: 26, 
                  borderRadius: 1, 
                  fontSize: '0.8rem',
                  px: 0.5,
                  background: 'rgba(56, 189, 248, 0.08)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.2)'
                }} 
              />
            )}
            <Button
              variant="outlined"
              color="warning"
              onClick={() => setOpenAiConfirmDialog(true)}
              startIcon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                fontWeight: 700, 
                fontSize: '0.88rem', 
                px: 2, 
                py: 0.5,
                borderColor: 'rgba(245, 158, 11, 0.4)',
                '&:hover': {
                  borderColor: '#f59e0b',
                  bgcolor: 'rgba(245, 158, 11, 0.04)',
                }
              }}
            >
              Tạo lại
            </Button>
            <IconButton 
              onClick={() => setOpenAiDialog(false)} 
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.02)',
                '&:hover': {
                  bgcolor: 'rgba(239, 68, 68, 0.08)',
                  color: '#f87171'
                }
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent 
          dividers 
          sx={{ 
            p: 0, 
            display: 'flex', 
            height: '72vh', 
            maxHeight: 800,
            minHeight: 550,
            overflow: 'hidden',
            borderColor: 'divider'
          }}
        >
          {/* LEFT SIDEBAR: SLEEK MINIMALIST TABS */}
          <Box 
            sx={{ 
              width: '30%', 
              borderRight: '1px solid', 
              borderColor: 'divider', 
              display: 'flex', 
              flexDirection: 'column', 
              overflowY: 'auto',
              bgcolor: 'background.default',
              p: 2,
              gap: 1
            }}
          >
            <Typography sx={{ 
              fontWeight: 700, 
              color: 'text.secondary', 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              px: 1, 
              mb: 1, 
              fontSize: '0.78rem' 
            }}>
              Danh sách chủ đề ({selectedArticleForAi?.aiResult?.topics?.length || 0})
            </Typography>
            
            {selectedArticleForAi?.aiResult?.topics?.map((topic, idx) => {
              const isActive = activeTopicIdx === idx;
              return (
                <Box
                  key={idx}
                  onClick={() => setActiveTopicIdx(idx)}
                  sx={{
                    py: 1.8,
                    px: 2,
                    borderRadius: 2,
                    cursor: 'pointer',
                    bgcolor: isActive ? 'rgba(168, 85, 247, 0.06)' : 'transparent',
                    color: isActive ? '#c084fc' : 'text.primary',
                    borderLeft: '3px solid',
                    borderColor: isActive ? '#a855f7' : 'transparent',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateX(2px)',
                      bgcolor: isActive ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    }
                  }}
                >
                  <Typography sx={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 700, 
                    color: isActive ? '#c084fc' : 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    mb: 0.5
                  }}>
                    Chủ đề {String(idx + 1).padStart(2, '0')}
                  </Typography>
                  <Typography sx={{ 
                    fontWeight: 600, 
                    fontSize: '0.92rem', 
                    lineHeight: 1.35, 
                    mb: 0.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    color: isActive ? '#ffffff' : 'text.primary'
                  }}>
                    {topic.name}
                  </Typography>
                  <Typography sx={{ 
                    color: 'text.secondary', 
                    fontSize: '0.78rem', 
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontWeight: 500
                  }}>
                    {topic.targetAudience}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* RIGHT VIEW: DETAILED TOPIC CONTENT */}
          <Box 
            sx={{ 
              width: '70%', 
              display: 'flex', 
              flexDirection: 'column', 
              overflowY: 'auto',
              p: 4,
              gap: 3.5,
              bgcolor: 'background.paper'
            }}
          >
            {selectedArticleForAi?.aiResult?.topics?.[activeTopicIdx] ? (() => {
              const topic = selectedArticleForAi.aiResult.topics[activeTopicIdx];
              return (
                <>
                  {/* Topic Title & Audience */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Typography sx={{ 
                      fontWeight: 800, 
                      color: 'text.primary', 
                      lineHeight: 1.3, 
                      fontSize: '1.4rem',
                      letterSpacing: -0.5
                    }}>
                      {topic.name}
                    </Typography>
                    
                    {/* Audience Section (Minimalist Flat Layout) */}
                    <Box sx={{ mt: 0.5 }}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: 1, mb: 0.75 }}>
                        Đối tượng mục tiêu phục vụ Content
                      </Typography>
                      <Typography sx={{ color: 'text.primary', fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.55 }}>
                        {topic.targetAudience}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Insight Section (Minimalist Glass Banner) */}
                  <Box 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2.5, 
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(236, 72, 153, 0.04)' : '#fffafc', 
                      borderLeft: '4px solid #ec4899',
                      borderTop: '1px solid rgba(236, 72, 153, 0.06)',
                      borderRight: '1px solid rgba(236, 72, 153, 0.06)',
                      borderBottom: '1px solid rgba(236, 72, 153, 0.06)',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#ec4899', textTransform: 'uppercase', letterSpacing: 1, mb: 0.75 }}>
                      Nhu cầu & Tâm lý người đọc (Insight)
                    </Typography>
                    <Typography sx={{ fontStyle: 'italic', color: 'text.secondary', lineHeight: 1.5, fontSize: '0.92rem', fontWeight: 500 }}>
                      {topic.insight}
                    </Typography>
                  </Box>

                  {/* Keywords Grid */}
                  <Box>
                    <Typography sx={{ fontWeight: 800, mb: 1.5, display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.78rem' }}>
                      Danh sách từ khóa thực chiến ({topic.keywords.length})
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                      {topic.keywords.map((kw, kwIdx) => (
                        <Paper
                          key={kwIdx}
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            pl: 2,
                            borderRadius: 2.5,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            bgcolor: 'background.default',
                            border: '1px solid',
                            borderColor: 'divider',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': { 
                              borderColor: 'rgba(168, 85, 247, 0.4)',
                              bgcolor: 'rgba(168, 85, 247, 0.02)',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                            }
                          }}
                        >
                          <Typography sx={{ fontWeight: 500, color: 'text.primary', fontSize: '0.92rem', pr: 1.5 }}>
                            {kw}
                          </Typography>
                          <Tooltip title={copiedKeyword === kw ? 'Đã copy!' : 'Copy từ khóa'}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleCopyKeyword(kw)}
                              color={copiedKeyword === kw ? 'success' : 'default'}
                              sx={{
                                bgcolor: copiedKeyword === kw ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  bgcolor: copiedKeyword === kw ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                                  color: copiedKeyword === kw ? '#10b981' : '#a855f7',
                                }
                              }}
                            >
                              {copiedKeyword === kw ? <LibraryAddCheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                </>
              );
            })() : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary" sx={{ fontSize: '1rem' }}>Vui lòng chọn một chủ đề để xem chi tiết.</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 2.5, 
          justifyContent: 'space-between',
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default'
        }}>
          <Typography color="text.secondary" sx={{ fontSize: '0.85rem', pl: 1 }}>
            Mô hình sử dụng: <strong>{selectedArticleForAi?.aiModel || 'Gemini 2.5 Flash'}</strong>
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, pr: 1 }}>
            <Button 
              variant="outlined" 
              onClick={() => setOpenAiDialog(false)}
              sx={{ 
                borderRadius: 2, 
                px: 3.5, 
                py: 0.75, 
                textTransform: 'none', 
                fontWeight: 600, 
                fontSize: '0.9rem',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'text.secondary'
                }
              }}
            >
              Đóng
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCopyAllKeywords}
              startIcon={copiedAll ? <LibraryAddCheckIcon sx={{ fontSize: 18 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
              sx={{ 
                borderRadius: 2, 
                px: 3.5, 
                py: 0.75,
                textTransform: 'none', 
                fontWeight: 700,
                fontSize: '0.9rem',
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                transition: 'all 0.2s',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                  boxShadow: '0 6px 16px rgba(124, 58, 237, 0.35)',
                }
              }}
            >
              {copiedAll ? 'Đã copy tất cả!' : 'Copy tất cả keyword'}
            </Button>
          </Box>
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
            Việc tạo lại từ khóa mới sẽ tốn thêm hạn ngạch (quota) của AI. Bạn có chắc chắn muốn tiến hành nghiên cứu lại cho văn bản này không?
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
            onClick={handleAiForceGenerate}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800 }}
          >
            Đồng ý, tạo lại
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
