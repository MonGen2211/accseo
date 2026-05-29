import TrendingKeywordsSection from './TrendingKeywordsSection';
import ActivitySection from './ActivitySection';
import QuickSerpChecker from './QuickSerpChecker';
import GoogleIndexChecker from './GoogleIndexChecker';
import KeywordPlannerSection from './KeywordPlannerSection';
import VbplSuggestionsSection from './components/vbpl/VbplSuggestionsSection';
import ScraperSection from '../scraper/components/ScraperSection';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import PublicIcon from '@mui/icons-material/Public';
import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CallSplitOutlinedIcon from '@mui/icons-material/CallSplitOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SearchIcon from '@mui/icons-material/Search';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import { domainService } from '../domains/domainService';
import { keywordGroupService } from '../keywords/keywordGroupService';
import { ga4Service } from '../keywords/ga4Service';
import { requestService } from '../requests/requestService';
import type { Ga4OverviewData } from '../keywords/ga4Types';
import type { Domain } from '../../types/domain.types';
import type { KeywordGroup } from '../keywords/types';
import type { Request } from '../requests/types';
import { useToastify } from '../../components/Toastify';
import { useAppSelector } from '../../app/store';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { StatusBadge, TypeBadge, getDueDateInfo } from '../requests/components/RequestBadges';

type ActivePanel = 'ga4' | 'deployed' | 'pending' | 'requests';

// ─── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  iconBgColor: string;
  activeColor?: string;
  active?: boolean;
  onClick?: () => void;
}

function StatCard({ title, value, icon, bgColor, iconBgColor, activeColor = '#2563EB', active, onClick }: StatCardProps) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 1.75, borderRadius: 3, bgcolor: 'background.paper',
        display: 'flex', flexDirection: 'column', gap: 1.25,
        minHeight: 100, height: '100%',
        position: 'relative', overflow: 'hidden',
        boxShadow: active ? `0 6px 18px ${activeColor}30` : '0 2px 12px rgba(0,0,0,0.04)',
        border: active ? '2px solid' : '1px solid',
        borderColor: active ? activeColor : 'divider',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-3px)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.09)',
        } : {},
      }}
    >
      <Box sx={{
        position: 'absolute', top: -20, right: -20,
        width: 90, height: 90, borderRadius: '50%',
        background: (theme) => `linear-gradient(135deg, ${bgColor} 0%, ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)'} 100%)`,
        opacity: 0.7, zIndex: 0,
        transition: 'transform 0.4s ease',
        '.MuiPaper-root:hover &': { transform: 'scale(1.2)' },
      }} />
      <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: iconBgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
        {icon}
      </Box>
      <Box sx={{ zIndex: 1 }}>
        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mb: 0.25, fontWeight: 600, letterSpacing: 0.4, lineHeight: 1.3 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}

// ─── Keyword Panel ─────────────────────────────────────────────────────────────
function KeywordPanel({ groups, loading, title, domains, selectedDomainId, onDomainChange, navigate }: {
  groups: KeywordGroup[];
  loading: boolean;
  title: string;
  domains: Domain[];
  selectedDomainId: string;
  onDomainChange: (id: string) => void;
  navigate: (path: string) => void;
}) {
  const STATUS_COLORS: Record<string, string> = {
    deployed:         '#059669',
    pending_approval: '#D97706',
    not_started:      '#6B7280',
    in_progress:      '#2563EB',
    rejected:         '#DC2626',
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: 'text.primary', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentOutlinedIcon color="primary" />
            {title}
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
            Chọn domain để xem danh sách
          </Typography>
        </Box>
        <FormControl size="small">
          <Select
            value={selectedDomainId}
            onChange={(e) => onDomainChange(e.target.value)}
            displayEmpty
            sx={{ fontSize: '0.85rem', minWidth: 160, borderRadius: 2, bgcolor: 'background.default' }}
          >
            <MenuItem value="" disabled>Chọn Domain</MenuItem>
            {domains.map(d => <MenuItem key={d._id} value={d._id}>{d.domain}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
        ) : groups.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
            <AssignmentOutlinedIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
            <Typography sx={{ fontSize: '0.9rem' }}>Không có dữ liệu</Typography>
          </Box>
        ) : (
          groups.map((g) => {
            const id = (g as { _id?: string })._id || g.id;
            const status = (g as { status?: string }).status ?? '';
            const color = STATUS_COLORS[status] ?? '#6B7280';
            const domainId = g.domainId || selectedDomainId;
            const target = `/domains/${domainId}/keywords?search=${encodeURIComponent(g.name)}`;
            return (
              <Box
                key={id}
                onClick={() => navigate(target)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.2, borderBottom: '1px solid', borderColor: 'divider', cursor: 'pointer', mx: -0.5, px: 0.5, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }} noWrap>{g.name.charAt(0).toUpperCase() + g.name.slice(1)}</Typography>
                <Chip
                  label={status === 'deployed' ? 'Đã triển khai' : 'Chờ duyệt'}
                  size="small"
                  sx={{ bgcolor: `${color}1A`, color, fontWeight: 600, fontSize: 11, border: `1px solid ${color}40`, flexShrink: 0 }}
                />
              </Box>
            );
          })
        )}
      </Box>
    </>
  );
}

// ─── Requests Panel ───────────────────────────────────────────────────────────
function RequestsPanel({ requests, loading, navigate }: { requests: Request[]; loading: boolean; navigate: (path: string) => void }) {
  return (
    <>
      <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: 'text.primary', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <InboxOutlinedIcon color="primary" />
        Yêu cầu cần xử lý
      </Typography>
      <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 2 }}>
        Các yêu cầu đang chờ hoặc đang xử lý
      </Typography>

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
        ) : requests.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
            <InboxOutlinedIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
            <Typography sx={{ fontSize: '0.9rem' }}>Không có yêu cầu nào</Typography>
          </Box>
        ) : requests.map((req) => {
          const due = getDueDateInfo(req.dueDate);
          return (
            <Box
              key={req.id}
              onClick={() => navigate(`/requests/${req.id}`)}
              sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.2, borderBottom: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, mx: -0.5, px: 0.5, borderRadius: 1 }}
            >
              <Avatar src={req.fromUser?.imgAvatar} sx={{ width: 28, height: 28, fontSize: 12, flexShrink: 0, mt: 0.25 }}>
                {req.fromUser?.name?.[0]}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{req.title}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.4, flexWrap: 'wrap', alignItems: 'center' }}>
                  <TypeBadge type={req.type} />
                  <StatusBadge status={req.status} />
                  {due && (
                    <Chip icon={<AccessTimeIcon />} label={due.label} size="small" color={due.color} variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </>
  );
}

// ─── GA4 Chart Panel ──────────────────────────────────────────────────────────
function Ga4Panel({ domains, selectedDomainId, onDomainChange, selectedDays, onDaysChange, ga4Data, loadingGa4 }: {
  domains: Domain[];
  selectedDomainId: string;
  onDomainChange: (id: string) => void;
  selectedDays: number;
  onDaysChange: (days: number) => void;
  ga4Data: Ga4OverviewData | null;
  loadingGa4: boolean;
}) {
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: 'text.primary', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentOutlinedIcon color="primary" />
            Lượt truy cập {selectedDays} ngày qua
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 2 }}>
            Biểu đồ thống kê lượng views từ GA4
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small">
              <Select value={selectedDomainId} onChange={(e) => onDomainChange(e.target.value)} displayEmpty sx={{ fontSize: '0.85rem', minWidth: 160, borderRadius: 2, bgcolor: 'background.default' }}>
                <MenuItem value="" disabled>Chọn Domain</MenuItem>
                {domains.map(d => <MenuItem key={d._id} value={d._id}>{d.domain}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small">
              <Select value={selectedDays} onChange={(e) => onDaysChange(Number(e.target.value))} sx={{ fontSize: '0.85rem', minWidth: 120, borderRadius: 2, bgcolor: 'background.default' }}>
                <MenuItem value={7}>7 ngày</MenuItem>
                <MenuItem value={28}>28 ngày</MenuItem>
                <MenuItem value={90}>90 ngày</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        {ga4Data && ga4Data.trend?.length > 0 && (
          <Box sx={{ textAlign: 'right', bgcolor: '#f0fdf4', p: 2, borderRadius: 3, border: '1px solid #bbf7d0' }}>
            <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: '#166534', lineHeight: 1 }}>
              {new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(ga4Data.summary.screenPageViews)}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600, mt: 0.5 }}>Tổng lượt views</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 200, pt: 2, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 0, pointerEvents: 'none' }}>
          {[...Array(4)].map((_, i) => <Box key={i} sx={{ borderBottom: '1px dashed', borderColor: 'divider', width: '100%' }} />)}
        </Box>

        {loadingGa4 ? (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}><CircularProgress size={30} /></Box>
        ) : (!ga4Data || !ga4Data.trend || ga4Data.trend.length === 0) ? (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, zIndex: 1 }}>
            <AssessmentOutlinedIcon sx={{ fontSize: 40, color: '#94a3b8' }} />
            <Typography sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.9rem' }}>Chưa có dữ liệu truy cập</Typography>
          </Box>
        ) : (() => {
          let chartData: { label: string; value: number; id: number }[] = [];
          if (selectedDays === 90) {
            for (let i = 0; i < ga4Data.trend.length; i += 15) {
              const chunk = ga4Data.trend.slice(i, i + 15);
              const sd = new Date(chunk[0].date);
              chartData.push({ label: `${sd.getDate()}/${sd.getMonth() + 1}`, value: chunk.reduce((a, c) => a + c.screenPageViews, 0), id: i });
            }
          } else if (selectedDays === 28) {
            for (let i = 0; i < ga4Data.trend.length; i += 7) {
              const chunk = ga4Data.trend.slice(i, i + 7);
              const sd = new Date(chunk[0].date);
              chartData.push({ label: `${sd.getDate()}/${sd.getMonth() + 1}`, value: chunk.reduce((a, c) => a + c.screenPageViews, 0), id: i });
            }
          } else {
            chartData = ga4Data.trend.map((t, i) => { const d = new Date(t.date); return { label: `${d.getDate()}/${d.getMonth() + 1}`, value: t.screenPageViews, id: i }; });
          }
          const maxViews = Math.max(...chartData.map(c => c.value), 1);
          const fmt = (v: number) => v === 0 ? '' : new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(v);

          const BAR_MAX_PX = 130;
          return chartData.map((item) => {
            const barH = Math.max((item.value / maxViews) * BAR_MAX_PX, 3);
            return (
              <Box key={item.id} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, minWidth: 0, zIndex: 1, pb: '24px' }}>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', mb: 0.5, visibility: item.value > 0 ? 'visible' : 'hidden', lineHeight: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {fmt(item.value)}
                </Typography>
                <Box
                  sx={{ width: '100%', maxWidth: 36, height: `${barH}px`, background: 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '6px 6px 3px 3px', transition: 'all 0.3s', boxShadow: '0 2px 8px rgba(59,130,246,0.2)', '&:hover': { background: 'linear-gradient(to top, #2563eb, #3b82f6)', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }, cursor: 'pointer' }}
                  title={`${item.label}: ${item.value} views`}
                />
                <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, mt: 0.5, whiteSpace: 'nowrap' }}>{item.label}</Typography>
              </Box>
            );
          });
        })()}
      </Box>
    </>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { showToast } = useToastify();
  const navigate = useNavigate();
  const user = useAppSelector(state => state.auth.user);
  const { items: notifItems } = useAppSelector(state => state.notifications);

  const [stats, setStats] = useState({
    domains: 0,
    deployedKeywords: 0,
    pendingKeywords: 0,
    pendingRequests: 0,
    pendingKeywordSegments: 0,
    pendingArticles: 0,
    pendingOptimizedArticles: 0,
    indexedArticles: 0,
    notIndexedArticles: 0,
  });
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [selectedDays, setSelectedDays] = useState(7);
  const [ga4Data, setGa4Data] = useState<Ga4OverviewData | null>(null);
  const [loadingGa4, setLoadingGa4] = useState(false);

  const [activePanel, setActivePanel] = useState<ActivePanel>('ga4');
  const [panelGroups, setPanelGroups] = useState<KeywordGroup[]>([]);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [panelDomainId, setPanelDomainId] = useState('');

  const [inboxRequests, setInboxRequests] = useState<Request[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);



  // Load dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      const [domainsResult, statsResult, inboxResult] = await Promise.allSettled([
        domainService.getAll(),
        keywordGroupService.getDashboardStatsByCurrentUser(),
        requestService.getInbox({ page: 1, limit: 20 }),
      ]);

      if (domainsResult.status === 'fulfilled') {
        const items = domainsResult.value.items;
        if (items.length > 0) {
          setDomains(items);
          setSelectedDomainId(items[0]._id);
          setPanelDomainId(items[0]._id);
        }
      } else {
        showToast('Lỗi tải Domain', 'danger');
      }

      if (statsResult.status === 'fulfilled') {
        const s = statsResult.value;
        setStats(prev => ({ ...prev, domains: s?.domainTotal ?? 0, deployedKeywords: s?.group?.deployed ?? 0, pendingKeywords: s?.group?.pendingApproval ?? 0 }));
      }

      if (inboxResult.status === 'fulfilled') {
        const active = inboxResult.value.items.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS');
        setInboxRequests(active);
        setStats(prev => ({ ...prev, pendingRequests: active.length }));
      }
    };
    fetchDashboardStats();
  }, [showToast]);

  // Load GA4
  useEffect(() => {
    if (!selectedDomainId || activePanel !== 'ga4') return;
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingGa4(true);
    ga4Service.getOverview(selectedDomainId, selectedDays)
      .then(data => { if (mounted) setGa4Data(data); })
      .catch(() => { if (mounted) setGa4Data(null); })
      .finally(() => { if (mounted) setLoadingGa4(false); });
    return () => { mounted = false; };
  }, [selectedDomainId, selectedDays, activePanel]);

  // Load requests when panel switches to 'requests'
  useEffect(() => {
    if (activePanel !== 'requests') return;
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingRequests(true);
    requestService.getInbox({ page: 1, limit: 20 })
      .then(res => { if (mounted) setInboxRequests(res.items.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS')); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoadingRequests(false); });
    return () => { mounted = false; };
  }, [activePanel]);


  // Load panel keywords
  useEffect(() => {
    if (activePanel === 'ga4' || activePanel === 'requests' || !panelDomainId) return;
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingPanel(true);
    const status = activePanel === 'deployed' ? 'deployed' : 'pending_approval';
    keywordGroupService.getGroups(panelDomainId, 1, 20, '', 'desc', status)
      .then(res => { if (mounted) setPanelGroups(res.items); })
      .catch(() => { if (mounted) setPanelGroups([]); })
      .finally(() => { if (mounted) setLoadingPanel(false); });
    return () => { mounted = false; };
  }, [activePanel, panelDomainId]);

  const handleCardClick = (panel: ActivePanel) => {
    setActivePanel(prev => prev === panel ? 'ga4' : panel);
  };

  const unreadNotifs = notifItems.filter(n => !n.isRead).slice(0, 2);

  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('dashboard_active_tab') || 'overview';
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    sessionStorage.setItem('dashboard_active_tab', tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dockItems = [
    { id: 'overview', label: 'Tổng quan & Báo cáo', icon: <SpaceDashboardIcon sx={{ fontSize: 20 }} /> },
    { id: 'vbpl', label: 'Gợi ý SEO & VBPL', icon: <AutoAwesomeIcon sx={{ fontSize: 20 }} /> },
    { id: 'planner', label: 'Keyword Planner', icon: <SearchIcon sx={{ fontSize: 20 }} /> },
    { id: 'serp', label: 'Thứ hạng SERP', icon: <EmojiEventsIcon sx={{ fontSize: 20 }} /> },
    { id: 'index-checker', label: 'Google Index Checker', icon: <CloudDoneOutlinedIcon sx={{ fontSize: 20 }} /> },
    { id: 'scraper', label: 'Thu thập báo chí', icon: <ArticleOutlinedIcon sx={{ fontSize: 20 }} /> },
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 4, zoom: 0.95, position: 'relative' }}>

      {/* Floating Apple-style Navigation Dock */}
      {isMinimized && !isHovered ? (
        <Paper
          elevation={0}
          onMouseEnter={() => setIsHovered(true)}
          onClick={() => setIsMinimized(false)}
          sx={{
            position: 'fixed',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1100,
            width: 44,
            height: 44,
            borderRadius: '50%',
            display: { xs: 'none', lg: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-50%) scale(1.1)',
              borderColor: 'primary.main',
              boxShadow: '0 6px 20px rgba(37, 99, 235, 0.3)'
            }
          }}
        >
          <ChevronLeftIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        </Paper>
      ) : (
        <Paper
          elevation={0}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          sx={{
            position: 'fixed',
            right: 24,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1100,
            display: { xs: 'none', lg: 'flex' },
            flexDirection: 'column',
            gap: 1.5,
            p: 1.2,
            borderRadius: '24px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
              borderColor: 'action.focus'
            }
          }}
        >
          {dockItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Tooltip key={item.id} title={item.label} placement="left" arrow>
                <IconButton
                  onClick={() => handleTabChange(item.id)}
                  size="medium"
                  sx={{
                    color: isActive ? '#fff' : 'text.secondary',
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'action.hover',
                      transform: 'scale(1.1)'
                    },
                    '&:active': {
                      transform: 'scale(0.95)'
                    }
                  }}
                >
                  {item.icon}
                </IconButton>
              </Tooltip>
            );
          })}
          <Divider sx={{ my: 0.5 }} />
          <Tooltip title={isMinimized ? "Ghim thanh điều hướng" : "Ẩn thanh nhanh"} placement="left" arrow>
            <IconButton
              onClick={() => setIsMinimized(prev => !prev)}
              size="medium"
              sx={{
                color: 'text.secondary',
                transition: 'all 0.2s',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: 'action.hover',
                  transform: 'scale(1.1)'
                }
              }}
            >
              {isMinimized ? <ChevronLeftIcon sx={{ fontSize: 20 }} /> : <ChevronRightIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>
        </Paper>
      )}

      {/* Premium Segmented Tab Control */}
      <Paper
        elevation={0}
        sx={{
          p: 0.75,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.6)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          mb: 1,
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
          '::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {dockItems.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Box
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              sx={{
                flex: { xs: 'none', md: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.25,
                py: 1.5,
                px: 3,
                borderRadius: 3.2,
                cursor: 'pointer',
                color: isActive ? '#ffffff' : 'text.secondary',
                background: isActive ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' : 'transparent',
                boxShadow: isActive ? '0 4px 15px rgba(124, 58, 237, 0.25)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.92rem',
                whiteSpace: 'nowrap',
                '&:hover': {
                  color: isActive ? '#ffffff' : 'text.primary',
                  bgcolor: isActive ? null : 'action.hover',
                  transform: isActive ? 'scale(1.02)' : 'none'
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              {tab.icon}
              <Typography sx={{ fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit' }}>
                {tab.label}
              </Typography>
            </Box>
          );
        })}
      </Paper>

      {/* Tab Content Panels */}
      <Box sx={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h4" sx={{ letterSpacing: '-0.5px', fontWeight: 800, mb: 1 }}>
                Xin chào, {user?.name || 'Admin'}! 👋
              </Typography>

              {unreadNotifs.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  {unreadNotifs.map(n => (
                    <Box key={n._id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NotificationsNoneOutlinedIcon sx={{ fontSize: 16, color: '#00b894' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }} noWrap>{n.title}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled', flexShrink: 0 }}>
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Không có thông báo mới
                </Typography>
              )}
            </Box>
          </Box>

          {/* Cards + Panel */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 4, alignItems: 'start' }}>
            {/* Left: stat cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              <StatCard
                title="DOMAIN QUẢN LÝ"
                value={stats.domains}
                icon={<PublicIcon sx={{ color: '#2563eb', fontSize: 22 }} />}
                bgColor="#bfdbfe" iconBgColor="#dbeafe"
                activeColor="#2563EB"
                active={activePanel === 'ga4'}
                onClick={() => setActivePanel('ga4')}
              />
              <StatCard
                title="YÊU CẦU CẦN XỬ LÝ"
                value={stats.pendingRequests}
                icon={<InboxOutlinedIcon sx={{ color: '#7c3aed', fontSize: 22 }} />}
                bgColor="#ede9fe" iconBgColor="#f5f3ff"
                activeColor="#7C3AED"
                active={activePanel === 'requests'}
                onClick={() => handleCardClick('requests')}
              />
              <StatCard
                title="BÀI VIẾT ĐÃ INDEX"
                value={stats.indexedArticles}
                icon={<CloudDoneOutlinedIcon sx={{ color: '#16A34A', fontSize: 22 }} />}
                bgColor="#bbf7d0" iconBgColor="#dcfce7"
                activeColor="#16A34A"
              />
              <StatCard
                title="BÀI VIẾT CHƯA INDEX"
                value={stats.notIndexedArticles}
                icon={<CloudOffOutlinedIcon sx={{ color: '#6B7280', fontSize: 22 }} />}
                bgColor="#e5e7eb" iconBgColor="#f3f4f6"
                activeColor="#6B7280"
              />
              <StatCard
                title="BÀI VIẾT TỐI ƯU CHỜ DUYỆT"
                value={stats.pendingOptimizedArticles}
                icon={<TuneOutlinedIcon sx={{ color: '#0D9488', fontSize: 22 }} />}
                bgColor="#99f6e4" iconBgColor="#ccfbf1"
                activeColor="#0D9488"
              />
              <StatCard
                title="BÀI VIẾT CHỜ DUYỆT"
                value={stats.pendingArticles}
                icon={<ArticleOutlinedIcon sx={{ color: '#DB2777', fontSize: 22 }} />}
                bgColor="#fbcfe8" iconBgColor="#fce7f3"
                activeColor="#DB2777"
              />
              <StatCard
                title="BỘ TỪ KHOÁ TRIỂN KHAI"
                value={stats.deployedKeywords}
                icon={<DraftsOutlinedIcon sx={{ color: '#059669', fontSize: 22 }} />}
                bgColor="#a7f3d0" iconBgColor="#d1fae5"
                activeColor="#059669"
                active={activePanel === 'deployed'}
                onClick={() => handleCardClick('deployed')}
              />
              <StatCard
                title="BỘ TỪ KHOÁ CHỜ PHÊ DUYỆT"
                value={stats.pendingKeywords}
                icon={<PendingActionsIcon sx={{ color: '#D97706', fontSize: 22 }} />}
                bgColor="#fde68a" iconBgColor="#fef3c7"
                activeColor="#D97706"
                active={activePanel === 'pending'}
                onClick={() => handleCardClick('pending')}
              />
              <StatCard
                title="TỪ KHOÁ PHÂN TÁCH CHỜ DUYỆT"
                value={stats.pendingKeywordSegments}
                icon={<CallSplitOutlinedIcon sx={{ color: '#EA580C', fontSize: 22 }} />}
                bgColor="#fed7aa" iconBgColor="#ffedd5"
                activeColor="#EA580C"
              />
            </Box>

            {/* Right: dynamic panel */}
            <Paper elevation={0} sx={{ borderRadius: 4, p: 3, display: 'flex', flexDirection: 'column', height: 400, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
              {activePanel === 'ga4' && (
                <Ga4Panel
                  domains={domains}
                  selectedDomainId={selectedDomainId}
                  onDomainChange={setSelectedDomainId}
                  selectedDays={selectedDays}
                  onDaysChange={setSelectedDays}
                  ga4Data={ga4Data}
                  loadingGa4={loadingGa4}
                />
              )}
              {activePanel === 'requests' && (
                <RequestsPanel requests={inboxRequests} loading={loadingRequests} navigate={navigate} />
              )}
              {(activePanel === 'deployed' || activePanel === 'pending') && (
                <KeywordPanel
                  groups={panelGroups}
                  loading={loadingPanel}
                  title={activePanel === 'deployed' ? 'Từ khoá đã triển khai' : 'Từ khoá chờ phê duyệt'}
                  domains={domains}
                  selectedDomainId={panelDomainId}
                  onDomainChange={setPanelDomainId}
                  navigate={navigate}
                />
              )}
            </Paper>
          </Box>

          {/* Bottom section: Trending then Activity */}
          <TrendingKeywordsSection />
          <ActivitySection />
        </Box>
      </Box>

      <Box sx={{ display: activeTab === 'vbpl' ? 'block' : 'none', mt: 1 }}>
        <VbplSuggestionsSection />
      </Box>

      <Box sx={{ display: activeTab === 'planner' ? 'block' : 'none', mt: 1 }}>
        <KeywordPlannerSection />
      </Box>

      <Box sx={{ display: activeTab === 'serp' ? 'block' : 'none', mt: 1 }}>
        <QuickSerpChecker />
      </Box>

      <Box sx={{ display: activeTab === 'index-checker' ? 'block' : 'none', mt: 1 }}>
        <GoogleIndexChecker />
      </Box>

      <Box sx={{ display: activeTab === 'scraper' ? 'block' : 'none', mt: 1 }}>
        <ScraperSection />
      </Box>

    </Box>
  );
}
