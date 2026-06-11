import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import OutlinedInput from '@mui/material/OutlinedInput';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';

// MUI Icons
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import LaunchIcon from '@mui/icons-material/Launch';
import CloseIcon from '@mui/icons-material/Close';

// Category Icons
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import ArticleIcon from '@mui/icons-material/Article';
import LinkIcon from '@mui/icons-material/Link';
import AndroidIcon from '@mui/icons-material/Android';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PublicIcon from '@mui/icons-material/Public';

import { useTheme } from '@mui/material/styles';
import usageService from './usageService';
import type { 
  ActionsResponse, 
  FlexibleStatsResponse
} from './usageService';

// ─── Visual Helpers ────────────────────────────────────────────────────────────
const getTodayString = () => {
  const d = new Date();
  const offset = 7 * 60; // Vietnam is UTC+7
  const localTime = new Date(d.getTime() + (offset + d.getTimezoneOffset()) * 60000);
  const yyyy = localTime.getFullYear();
  const mm = String(localTime.getMonth() + 1).padStart(2, '0');
  const dd = String(localTime.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const fmtDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    const dd = d.getDate().toString().padStart(2, '0');
    const mo = (d.getMonth() + 1).toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${dd}/${mo}/${yyyy} ${hh}:${mm}`;
  } catch {
    return String(iso);
  }
};

const formatDefensiveNumber = (num: number): string => {
  if (isNaN(num) || num === null || num === undefined) return '-';
  if (num >= 1e9) {
    return num.toExponential(2); // Tránh bug tràn số
  }
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
};

const getRoleLabel = (role: string): string => {
  if (role === 'ADMIN') return 'Quản trị viên';
  if (role === 'SEO_COLLABORATOR') return 'Cộng tác viên';
  return role;
};

const getInitials = (name?: string, email?: string): string => {
  const target = name || email || 'User';
  const cleanName = target.split('@')[0];
  const parts = cleanName.split(/[\s._-]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleanName.slice(0, 2).toUpperCase();
};

const stringToColor = (string: string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    const pastelValue = Math.floor((value + 160) / 2); // Pastel colors
    color += `00${pastelValue.toString(16)}`.slice(-2);
  }
  return color;
};

// Category Icon mapping with beautiful matched background gradients
const getCategoryConfig = (catKey: string) => {
  const iconSx = { fontSize: 22 };
  switch (catKey.toLowerCase()) {
    case 'serp': 
      return {
        icon: <EmojiEventsIcon sx={{ ...iconSx, color: '#f59e0b' }} />,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.08)'
      };
    case 'index-checker': 
    case 'index_check': 
      return {
        icon: <CloudDoneIcon sx={{ ...iconSx, color: '#06b6d4' }} />,
        color: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.08)'
      };
    case 'press_scraper':
    case 'scraper': 
      return {
        icon: <ArticleIcon sx={{ ...iconSx, color: '#2563eb' }} />,
        color: '#2563eb',
        bg: 'rgba(37, 99, 235, 0.08)'
      };
    case 'url_scraper':
    case 'scraper-url': 
      return {
        icon: <LinkIcon sx={{ ...iconSx, color: '#8b5cf6' }} />,
        color: '#8b5cf6',
        bg: 'rgba(139, 92, 246, 0.08)'
      };
    case 'content-analysis': 
    case 'content_analysis': 
      return {
        icon: <PsychologyIcon sx={{ ...iconSx, color: '#10b981' }} />,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.08)'
      };
    case 'index-booster':
    case 'index_booster': 
    case 'indexed': 
      return {
        icon: <AndroidIcon sx={{ ...iconSx, color: '#0d9488' }} />,
        color: '#0d9488',
        bg: 'rgba(13, 148, 136, 0.08)'
      };
    case 'seo-audit': 
    case 'seo_audit': 
      return {
        icon: <AssessmentIcon sx={{ ...iconSx, color: '#e11d48' }} />,
        color: '#e11d48',
        bg: 'rgba(225, 29, 72, 0.08)'
      };
    case 'domains': 
      return {
        icon: <PublicIcon sx={{ ...iconSx, color: '#3b82f6' }} />,
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.08)'
      };
    case 'vbpl': 
      return {
        icon: <AutoAwesomeIcon sx={{ ...iconSx, color: '#f59e0b' }} />,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.08)'
      };
    case 'planner': 
      return {
        icon: <SearchIcon sx={{ ...iconSx, color: '#10b981' }} />,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.08)'
      };
    default: 
      return {
        icon: <SpaceDashboardIcon sx={{ ...iconSx, color: '#94a3b8' }} />,
        color: '#94a3b8',
        bg: 'rgba(148, 163, 184, 0.08)'
      };
  }
};

// ─── Sub-Component: Expandable Category Card ──────────────────────────────────
interface CategoryCardProps {
  categoryKey: string;
  label: string;
  runs: number;
  failed: number;
  usersCount: number;
  lastAt: string;
  actionsList: Array<{
    actionKey: string;
    label: string;
    runs: number;
    failed: number;
    lastAt: string | null;
  }>;
  from: string;
  to: string;
}

function CategoryCard({
  categoryKey,
  label,
  runs,
  failed,
  usersCount,
  lastAt,
  actionsList,
  from,
  to
}: CategoryCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [expanded, setExpanded] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  const success = runs - failed;
  const errorRate = runs > 0 ? (failed / runs) * 100 : 0;
  const config = getCategoryConfig(categoryKey);

  // Load details (users who ran this category) when card is expanded
  useEffect(() => {
    if (!expanded || runs === 0) return;
    
    const fetchDetails = async () => {
      setLoadingUsers(true);
      setErrorUsers(null);
      try {
        const res = await usageService.getStats({
          from,
          to,
          category: categoryKey,
          groupBy: 'user',
          limit: 100
        });
        setUsers(res.groups);
      } catch (err: any) {
        setErrorUsers(err.response?.data?.message || 'Không thể tải danh sách người dùng.');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchDetails();
  }, [expanded, categoryKey, from, to, runs]);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: expanded ? config.color : 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: config.color,
          transform: 'translateY(-2px)',
          boxShadow: isDark 
            ? '0 4px 12px rgba(0,0,0,0.5)' 
            : '0 4px 12px rgba(0,0,0,0.05)',
        }
      }}
    >
      {/* Visual Left Accent Border */}
      <Box sx={{ 
        position: 'absolute', 
        left: 0, 
        top: 0, 
        bottom: 0, 
        width: 5, 
        bgcolor: runs > 0 ? config.color : 'divider',
        zIndex: 2
      }} />

      {/* Card Header Content */}
      <Box
        onClick={() => setExpanded(prev => !prev)}
        sx={{
          p: 3,
          cursor: 'pointer',
          bgcolor: expanded ? 'action.hover' : 'transparent',
          transition: 'background-color 0.2s',
          '&:active': { bgcolor: 'action.selected' }
        }}
      >
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
            {/* Category Icon */}
            <Box sx={{ 
              width: 44, 
              height: 44, 
              borderRadius: 1.5, 
              bgcolor: config.bg, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: `1px solid rgba(${config.color === '#10b981' ? '16, 185, 129' : '245, 158, 11'}, 0.2)`,
              flexShrink: 0
            }}>
              {config.icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.96rem', color: 'text.primary', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
                {label}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 500, bgcolor: 'background.default', px: 1, py: 0.2, borderRadius: 0.5 }}>
                  {categoryKey}
                </Typography>
                {runs > 0 && (
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Box sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      bgcolor: 'success.main', 
                      animation: 'pulse 1.8s infinite ease-in-out',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(0.8)', opacity: 0.4 },
                        '50%': { transform: 'scale(1.2)', opacity: 1 },
                        '100%': { transform: 'scale(0.8)', opacity: 0.4 },
                      }
                    }} />
                    <Typography sx={{ fontSize: '0.66rem', color: 'success.main', fontWeight: 700 }}>
                      Hoạt động
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Stack>
          <Box sx={{ 
            width: 28, 
            height: 28, 
            borderRadius: '50%', 
            bgcolor: 'background.default', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'text.secondary', 
            flexShrink: 0,
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: config.bg,
              color: config.color,
              transform: 'scale(1.05)'
            }
          }}>
            <LaunchIcon sx={{ fontSize: 13 }} />
          </Box>
        </Stack>

        {/* Small Numeric Stats Sub-boxes */}
        <Grid container spacing={2}>
          {/* Total Runs */}
          <Grid xs={4}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 3.5, 
              bgcolor: isDark ? 'rgba(255,255,255,0.015)' : '#f8fafc', 
              border: '1px solid', 
              borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', 
              textAlign: 'center',
              minWidth: 80,
              maxWidth: '100%',
              overflow: 'hidden'
            }}>
              <Typography sx={{ fontSize: '0.64rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Chạy
              </Typography>
              <Tooltip title={runs.toLocaleString('en-US')} arrow placement="top">
                <Typography sx={{ 
                  fontSize: '1.3rem', 
                  fontWeight: 900, 
                  color: runs > 0 ? 'text.primary' : 'text.disabled', 
                  mt: 0.5, 
                  cursor: 'help',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                  textAlign: 'center'
                }}>
                  {formatDefensiveNumber(runs)}
                </Typography>
              </Tooltip>
            </Box>
          </Grid>
          {/* Success */}
          <Grid xs={4}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 3.5, 
              bgcolor: success > 0 ? (isDark ? 'rgba(16, 185, 129, 0.05)' : '#ecfdf5') : (isDark ? 'rgba(255,255,255,0.015)' : '#f8fafc'), 
              border: '1px solid', 
              borderColor: success > 0 ? (isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.15)') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
              textAlign: 'center',
              minWidth: 80,
              maxWidth: '100%',
              overflow: 'hidden'
            }}>
              <Typography sx={{ fontSize: '0.64rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                OK
              </Typography>
              <Tooltip title={success.toLocaleString('en-US')} arrow placement="top">
                <Typography sx={{ 
                  fontSize: '1.3rem', 
                  fontWeight: 900, 
                  color: success > 0 ? 'success.main' : 'text.disabled', 
                  mt: 0.5, 
                  cursor: 'help',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                  textAlign: 'center'
                }}>
                  {formatDefensiveNumber(success)}
                </Typography>
              </Tooltip>
            </Box>
          </Grid>
          {/* Failed */}
          <Grid xs={4}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 3.5, 
              bgcolor: failed > 0 ? (isDark ? 'rgba(239, 68, 68, 0.05)' : '#fef2f2') : (isDark ? 'rgba(255,255,255,0.015)' : '#f8fafc'), 
              border: '1px solid', 
              borderColor: failed > 0 ? (isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.15)') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
              textAlign: 'center',
              position: 'relative',
              minWidth: 80,
              maxWidth: '100%',
              overflow: 'hidden'
            }}>
              {failed > 0 && (
                <Box sx={{ 
                  position: 'absolute', 
                  top: 4, 
                  right: 4, 
                  width: 5, 
                  height: 5, 
                  borderRadius: '50%', 
                  bgcolor: 'error.main',
                  boxShadow: '0 0 4px #ef4444'
                }} />
              )}
              <Typography sx={{ fontSize: '0.64rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Lỗi
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5, maxWidth: '100%', overflow: 'hidden' }}>
                <Tooltip title={failed.toLocaleString('en-US')} arrow placement="top">
                  <Typography sx={{ 
                    fontSize: '1.3rem', 
                    fontWeight: 900, 
                    color: failed > 0 ? 'error.main' : 'text.disabled', 
                    cursor: 'help',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    textAlign: 'center'
                  }}>
                    {formatDefensiveNumber(failed)}
                  </Typography>
                </Tooltip>
                {failed > 0 && (
                  <Chip
                    label={`${errorRate.toFixed(0)}%`}
                    size="small"
                    color="error"
                    sx={{ height: 16, fontSize: '0.6rem', px: 0.2, fontWeight: 900, borderRadius: 0.5, flexShrink: 0 }}
                  />
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Expanded Sub-details in Modal Dialog */}
      <Dialog 
        open={expanded} 
        onClose={() => setExpanded(false)} 
        maxWidth="md" 
        fullWidth
        disableScrollLock
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(8px)',
              backgroundColor: isDark ? 'rgba(10, 10, 12, 0.45)' : 'rgba(15, 23, 42, 0.3)',
            }
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: '28px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }
        }}
      >
        {/* Dialog Header */}
        <DialogTitle sx={{ 
          m: 0, 
          p: 3, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 38, 
              height: 38, 
              borderRadius: '10px', 
              bgcolor: config.bg, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: `1px solid rgba(${config.color === '#10b981' ? '16, 185, 129' : config.color === '#f59e0b' ? '245, 158, 11' : '37, 99, 235'}, 0.2)`,
              flexShrink: 0
            }}>
              {config.icon}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', color: 'text.primary', lineHeight: 1.2 }}>
                {label}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', fontWeight: 600, mt: 0.2 }}>
                Danh mục: {categoryKey}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setExpanded(false)}
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'text.primary', bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent sx={{ p: 3, mt: 1, maxHeight: '65vh', overflowY: 'auto' }}>
          {/* Metadata Banner */}
          <Box sx={{ 
            display: 'flex', 
            gap: 4, 
            mb: 3.5, 
            p: 2, 
            borderRadius: 3.5,
            bgcolor: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            flexWrap: 'wrap'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonOutlineIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 600 }}>
                Tổng tài khoản sử dụng:{' '}
                <span style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: 800 }}>
                  {usersCount}
                </span>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 600 }}>
                Lần cuối vận hành:{' '}
                <span style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: 800 }}>
                  {fmtDateTime(lastAt)}
                </span>
              </Typography>
            </Box>
          </Box>

          {/* Two column Grid for Tables */}
          <Grid container spacing={3.5}>
            {/* Left: Actions List Table */}
            <Grid xs={12} md={runs > 0 ? 6 : 12}>
              <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, mb: 2, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SpeedIcon sx={{ fontSize: 16, color: config.color }} />
                Chi tiết tác vụ trong nhóm
              </Typography>
              
              <TableContainer component={Paper} sx={{ 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 2, 
                bgcolor: 'background.paper', 
                overflowX: 'auto',
                width: '100%'
              }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8fafc', fontSize: '0.68rem', fontWeight: 800, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', py: 1.5 } }}>
                      <TableCell>Tác vụ cụ thể</TableCell>
                      <TableCell align="right" sx={{ width: 80 }}>Lượt chạy</TableCell>
                      <TableCell align="right" sx={{ width: 80 }}>Lỗi</TableCell>
                      <TableCell sx={{ width: 110 }} align="center">Hiệu suất</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {actionsList.map((act) => {
                      const rate = act.runs > 0 ? ((act.runs - act.failed) / act.runs) * 100 : 100;
                      return (
                        <TableRow 
                          key={act.actionKey} 
                          sx={{ 
                            '& td': { fontSize: '0.76rem', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' },
                            '&:last-child td': { borderBottom: 'none' },
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{act.label}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>{act.runs}</TableCell>
                          <TableCell align="right" sx={{ color: act.failed > 0 ? 'error.main' : 'text.disabled', fontWeight: 800 }}>
                            {act.failed}
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: 'text.secondary' }}>
                                  Thành công
                                </Typography>
                                <Typography sx={{ fontSize: '0.64rem', fontWeight: 800, color: rate > 90 ? 'success.main' : rate > 60 ? 'warning.main' : 'error.main' }}>
                                  {rate.toFixed(0)}%
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', width: '100%', height: 5, borderRadius: 2.5, overflow: 'hidden', bgcolor: 'action.hover' }}>
                                {act.runs > 0 ? (
                                  <>
                                    <Box sx={{ width: `${rate}%`, bgcolor: config.color, height: '100%' }} />
                                    <Box sx={{ width: `${100 - rate}%`, bgcolor: 'error.main', height: '100%' }} />
                                  </>
                                ) : (
                                  <Box sx={{ width: '100%', bgcolor: 'text.disabled', height: '100%', opacity: 0.2 }} />
                                )}
                              </Box>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* Right: Users Breakdown Section */}
            {runs > 0 && (
              <Grid xs={12} md={6}>
                <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, mb: 2, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonOutlineIcon sx={{ fontSize: 16, color: config.color }} />
                  Tài khoản vận hành hôm nay
                </Typography>
                
                {loadingUsers && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4, gap: 1.5 }}>
                    <CircularProgress size={18} sx={{ color: config.color }} />
                    <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', fontWeight: 500 }}>Đang tải thông tin tài khoản...</Typography>
                  </Box>
                )}

                {errorUsers && (
                  <Alert severity="error" sx={{ py: 0.5, fontSize: '0.74rem', borderRadius: 2.5 }}>{errorUsers}</Alert>
                )}

                {!loadingUsers && !errorUsers && (
                  <>
                    {users.length === 0 ? (
                      <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', fontStyle: 'italic' }}>
                        Không có thông tin chi tiết người dùng
                      </Typography>
                    ) : (
                      <TableContainer component={Paper} sx={{ 
                        border: '1px solid', 
                        borderColor: 'divider', 
                        borderRadius: 2, 
                        bgcolor: 'background.paper', 
                        maxHeight: 320,
                        overflowX: 'auto',
                        width: '100%',
                        '&::-webkit-scrollbar': { width: '5px', height: '5px' },
                        '&::-webkit-scrollbar-track': { background: 'transparent' },
                        '&::-webkit-scrollbar-thumb': { background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '2.5px' }
                      }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow sx={{ '& th': { bgcolor: 'background.default', fontSize: '0.68rem', fontWeight: 800, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', py: 1.5 } }}>
                              <TableCell>Tên tài khoản</TableCell>
                              <TableCell align="right" sx={{ width: 90 }}>Lượt chạy</TableCell>
                              <TableCell align="right" sx={{ width: 90 }}>Lỗi</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {users.map((u, i) => {
                              const name = u.name || u.key || 'User';
                              const initial = getInitials(u.name, u.email);
                              const avatarColor = stringToColor(name);
                              return (
                                <TableRow 
                                  key={i} 
                                  sx={{ 
                                    '& td': { fontSize: '0.76rem', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' },
                                    '&:last-child td': { borderBottom: 'none' },
                                    '&:hover': { bgcolor: 'action.hover' }
                                  }}
                                >
                                  <TableCell>
                                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                      <Avatar sx={{ 
                                        width: 24, 
                                        height: 24, 
                                        fontSize: '0.68rem', 
                                        fontWeight: 800, 
                                        bgcolor: avatarColor, 
                                        color: '#ffffff',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                      }}>
                                        {initial}
                                      </Avatar>
                                      <Tooltip title={u.email || ''} arrow placement="top">
                                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                          <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: 'text.primary' }}>
                                            {name}
                                          </Typography>
                                          {u.role === 'ADMIN' && (
                                            <Tooltip title="Quản trị viên">
                                              <ShieldIcon sx={{ fontSize: 12, color: 'primary.main' }} />
                                            </Tooltip>
                                          )}
                                        </Stack>
                                      </Tooltip>
                                    </Stack>
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 800 }}>{u.runs}</TableCell>
                                  <TableCell align="right" sx={{ color: u.failed > 0 ? 'error.main' : 'text.disabled', fontWeight: 800 }}>
                                    {u.failed}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </>
                )}
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }}>
          <Button 
            onClick={() => setExpanded(false)} 
            variant="outlined"
            sx={{ 
              textTransform: 'none', 
              borderRadius: 2.5, 
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)', 
              color: 'text.secondary', 
              fontWeight: 700,
              px: 3.5,
              '&:hover': { bgcolor: 'action.hover', borderColor: 'text.secondary' } 
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UsageStatsSection() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // State for metadata lists (filters)
  const [meta, setMeta] = useState<ActionsResponse | null>(null);
  
  // Stats data
  const [statsData, setStatsData] = useState<FlexibleStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const todayStr = useMemo(() => getTodayString(), []);
  const [from, setFrom] = useState<string>(todayStr);
  const [to, setTo] = useState<string>(todayStr);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<'all' | 'success' | 'failed'>('all');

  // Fetch metadata lists (actions & categories)
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const data = await usageService.getActions();
        setMeta(data);
      } catch (err: any) {
        console.error('Lỗi khi tải danh mục filter:', err);
      }
    };
    fetchMeta();
  }, []);

  // Fetch Usage Stats grouped by action so we can aggregate them locally
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usageService.getStats({
        from,
        to,
        role: selectedRoles.length > 0 ? selectedRoles.join(',') : undefined,
        outcome,
        groupBy: 'action', // Group by action to get fine-grained counts
        sort: 'runs',
        order: 'desc',
        limit: 200
      });
      setStatsData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải thống kê sử dụng.');
    } finally {
      setLoading(false);
    }
  }, [from, to, selectedRoles, outcome]);

  // Initial and trigger fetches
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset filters
  const handleResetFilters = () => {
    setFrom(todayStr);
    setTo(todayStr);
    setSelectedCategories([]);
    setSelectedRoles([]);
    setOutcome('all');
  };

  // Resolve category label lookup from meta
  const getCategoryLabelFromKey = (catKey: string): string => {
    if (!meta) return catKey;
    const cat = meta.categories.find(c => c.category === catKey);
    return cat ? cat.categoryLabel : catKey;
  };

  // Dropdown options height
  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 6 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
    disableScrollLock: true
  };

  // Aggregate Category metrics locally
  const categoryCardsData = useMemo(() => {
    if (!meta || !statsData) return [];

    const activeStats = statsData.groups;

    return meta.categories
      .filter(cat => selectedCategories.length === 0 || selectedCategories.indexOf(cat.category) > -1)
      .map((cat) => {
        const catActions = cat.actions;

        // Find stats of actions in this category
        const matchingStats = activeStats.filter(item => catActions.includes(item.key));

        // Sum runs & failed
        const runs = matchingStats.reduce((sum, item) => sum + item.runs, 0);
        const failed = matchingStats.reduce((sum, item) => sum + item.failed, 0);

        // Find latest timestamp
        let lastAt = '';
        matchingStats.forEach(item => {
          if (item.lastAt && (!lastAt || new Date(item.lastAt) > new Date(lastAt))) {
            lastAt = item.lastAt;
          }
        });

        // Approximate unique users using max users for actions in this category
        const usersCount = matchingStats.reduce((max, item) => Math.max(max, item.users || 0), 0);

        // Build list of sub-actions details
        const actionsList = cat.actions.map(actKey => {
          const actMeta = meta.actions.find(a => a.action === actKey);
          const actStat = matchingStats.find(item => item.key === actKey);
          return {
            actionKey: actKey,
            label: actMeta ? actMeta.label : actKey,
            runs: actStat ? actStat.runs : 0,
            failed: actStat ? actStat.failed : 0,
            lastAt: actStat ? actStat.lastAt : null
          };
        });

        return {
          categoryKey: cat.category,
          label: cat.categoryLabel,
          runs,
          failed,
          usersCount,
          lastAt,
          actionsList
        };
      });
  }, [meta, statsData, selectedCategories]);

  // Overall statistics summaries
  const summaryMetrics = useMemo(() => {
    if (statsData) {
      return {
        totalRuns: statsData.totalRuns,
        totalFailed: statsData.totalFailed,
        distinctUsers: statsData.distinctUsers,
        errorRate: statsData.totalRuns > 0 ? (statsData.totalFailed / statsData.totalRuns) * 100 : 0
      };
    }
    return { totalRuns: 0, totalFailed: 0, distinctUsers: 0, errorRate: 0 };
  }, [statsData]);

  const handleCategoryChange = (event: any) => {
    const value = event.target.value;
    setSelectedCategories(typeof value === 'string' ? value.split(',') : value);
  };

  const handleRoleChange = (event: any) => {
    const value = event.target.value;
    setSelectedRoles(typeof value === 'string' ? value.split(',') : value);
  };

  return (
    <Box sx={{ width: '100%', mt: 3, mb: 4 }}>

      {/* ─── 2. Premium Overview Metrics Cards ─── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Runs Card */}
        <Grid xs={12} sm={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              bgcolor: 'background.paper',
              minHeight: 110, 
              height: '100%',
              position: 'relative', 
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                borderColor: '#2563eb',
                boxShadow: (theme) => theme.palette.mode === 'dark' 
                  ? '0 4px 12px rgba(0,0,0,0.5)' 
                  : '0 4px 12px rgba(0,0,0,0.05)',
              }
            }}
          >
            <Box sx={{
              position: 'absolute', 
              right: -12, 
              bottom: -12, 
              opacity: isDark ? 0.04 : 0.06, 
              color: '#2563eb',
              zIndex: 0,
              '& svg': { fontSize: 70 },
              transition: 'transform 0.4s ease',
              '.MuiPaper-root:hover &': { transform: 'scale(1.1)' },
            }}>
              <QueryStatsIcon />
            </Box>
            <Stack spacing={1} sx={{ zIndex: 1 }}>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.3, textTransform: 'uppercase' }}>
                Tổng lượt chạy
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                <Tooltip title={summaryMetrics.totalRuns.toLocaleString('en-US')} arrow placement="top">
                  <Typography sx={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 900, 
                    color: 'text.primary', 
                    lineHeight: 1, 
                    cursor: 'help',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}>
                    {formatDefensiveNumber(summaryMetrics.totalRuns)}
                  </Typography>
                </Tooltip>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.secondary' }}>lượt</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* Failed Runs Card */}
        <Grid xs={12} sm={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              bgcolor: 'background.paper',
              minHeight: 110, 
              height: '100%',
              position: 'relative', 
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                borderColor: '#dc2626',
                boxShadow: (theme) => theme.palette.mode === 'dark' 
                  ? '0 4px 12px rgba(0,0,0,0.5)' 
                  : '0 4px 12px rgba(0,0,0,0.05)',
              }
            }}
          >
            <Box sx={{
              position: 'absolute', 
              right: -12, 
              bottom: -12, 
              opacity: isDark ? 0.04 : 0.06, 
              color: '#dc2626',
              zIndex: 0,
              '& svg': { fontSize: 70 },
              transition: 'transform 0.4s ease',
              '.MuiPaper-root:hover &': { transform: 'scale(1.1)' },
            }}>
              <ErrorOutlinedIcon />
            </Box>
            <Stack spacing={1} sx={{ zIndex: 1 }}>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.3, textTransform: 'uppercase' }}>
                Lượt lỗi hệ thống
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Tooltip title={summaryMetrics.totalFailed.toLocaleString('en-US')} arrow placement="top">
                  <Typography sx={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 900, 
                    color: summaryMetrics.totalFailed > 0 ? 'error.main' : 'text.primary', 
                    lineHeight: 1, 
                    cursor: 'help',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}>
                    {formatDefensiveNumber(summaryMetrics.totalFailed)}
                  </Typography>
                </Tooltip>
                {summaryMetrics.totalRuns > 0 && (
                  <Chip
                    label={`Lỗi: ${summaryMetrics.errorRate.toFixed(1)}%`}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      borderRadius: 0.5,
                      px: 0.5,
                      bgcolor: summaryMetrics.totalFailed > 0 ? 'error.main' : 'action.hover',
                      color: summaryMetrics.totalFailed > 0 ? 'white' : 'text.secondary'
                    }}
                  />
                )}
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* Distinct Users Card */}
        <Grid xs={12} sm={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              bgcolor: 'background.paper',
              minHeight: 110, 
              height: '100%',
              position: 'relative', 
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                borderColor: '#10b981',
                boxShadow: (theme) => theme.palette.mode === 'dark' 
                  ? '0 4px 12px rgba(0,0,0,0.5)' 
                  : '0 4px 12px rgba(0,0,0,0.05)',
              }
            }}
          >
            <Box sx={{
              position: 'absolute', 
              right: -12, 
              bottom: -12, 
              opacity: isDark ? 0.04 : 0.06, 
              color: '#10b981',
              zIndex: 0,
              '& svg': { fontSize: 70 },
              transition: 'transform 0.4s ease',
              '.MuiPaper-root:hover &': { transform: 'scale(1.1)' },
            }}>
              <PersonOutlineIcon />
            </Box>
            <Stack spacing={1} sx={{ zIndex: 1 }}>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.3, textTransform: 'uppercase' }}>
                Người dùng hoạt động
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Tooltip title={summaryMetrics.distinctUsers.toLocaleString('en-US')} arrow placement="top">
                  <Typography sx={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 900, 
                    color: 'text.primary', 
                    lineHeight: 1, 
                    cursor: 'help',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}>
                    {formatDefensiveNumber(summaryMetrics.distinctUsers)}
                  </Typography>
                </Tooltip>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.secondary' }}>tài khoản</Typography>
                {summaryMetrics.distinctUsers > 0 && (
                  <Box sx={{ 
                    ml: 1,
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: 'success.main', 
                    display: 'inline-block',
                    animation: 'pulse 2s infinite ease-in-out'
                  }} />
                )}
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* ─── 3. Filter Toolbar ─── */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 4, 
          borderRadius: 2, 
          border: '1px solid', 
          borderColor: 'divider', 
          bgcolor: 'background.paper', 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mr: 1 }}>
            <FilterListIcon sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Lọc theo ngày:
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Từ ngày"
              type="date"
              size="small"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ 
                width: 170,
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 1,
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
                } 
              }}
            />
            <TextField
              label="Đến ngày"
              type="date"
              size="small"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ 
                width: 170,
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 1,
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
                } 
              }}
            />
          </Box>
        </Box>
 
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleResetFilters}
            sx={{ 
              textTransform: 'none', 
              borderRadius: '100px', 
              borderColor: 'divider', 
              color: 'text.secondary', 
              fontWeight: 700,
              fontSize: '0.78rem',
              px: 2,
              py: 0.8,
              '&:hover': { bgcolor: 'action.hover', borderColor: 'text.primary' } 
            }}
          >
            Hôm nay
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={fetchStats}
            startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
            sx={{ 
              textTransform: 'none', 
              borderRadius: '100px', 
              bgcolor: 'primary.main', 
              color: '#ffffff', 
              fontWeight: 800,
              fontSize: '0.78rem',
              px: 2.5,
              py: 0.8,
              boxShadow: 'none',
              '&:hover': { 
                bgcolor: 'primary.dark',
                boxShadow: 'none'
              } 
            }}
          >
            Tải lại
          </Button>
        </Box>
      </Paper>
 
      {/* ─── 4. Card Grid Display ─── */}
      <Box sx={{ position: 'relative', minHeight: 200 }}>
        {/* Loading Spinner */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10, gap: 2 }}>
            <CircularProgress size={32} />
            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', fontWeight: 700 }}>Đang phân tích số liệu...</Typography>
          </Box>
        )}

        {/* Error Alert */}
        {!loading && error && (
          <Alert severity="error" sx={{ borderRadius: 1, mb: 4, fontWeight: 600 }}>{error}</Alert>
        )}
 
        {/* Action Cards Grid */}
        {!loading && !error && statsData && (
          <Box>
            {categoryCardsData.length === 0 ? (
              <Box sx={{ 
                py: 8, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                border: '2px dashed', 
                borderColor: 'divider', 
                borderRadius: 2,
                bgcolor: 'background.paper'
              }}>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem', fontWeight: 700 }}>
                  Không tìm thấy dữ liệu thống kê
                </Typography>
                <Typography sx={{ color: 'text.disabled', fontSize: '0.78rem', mt: 0.8 }}>
                  Không tìm thấy lượt chạy nào cho khoảng thời gian hoặc danh mục này.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: 'repeat(2, 1fr)', 
                  md: 'repeat(3, 1fr)' 
                }, 
                gap: 3.5 
              }}>
                {categoryCardsData.map((cat) => (
                  <CategoryCard
                    key={cat.categoryKey}
                    categoryKey={cat.categoryKey}
                    label={cat.label}
                    runs={cat.runs}
                    failed={cat.failed}
                    usersCount={cat.usersCount}
                    lastAt={cat.lastAt}
                    actionsList={cat.actionsList}
                    from={from}
                    to={to}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
