import { useState, useEffect } from 'react';
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

  // --- Schedule State ---
  const [schedule, setSchedule] = useState<ScraperSchedule | null>(null);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [cronInput, setCronInput] = useState('0 */6 * * *');
  const [cronPreset, setCronPreset] = useState('0 */6 * * *');
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);

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

  // --- Columns ---
  const columns: TableField[] = [
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

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' }, gap: 3, mb: 4 }}>
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
                        {(item.description || item.excerpt) && (
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
    </Box>
  );
}
