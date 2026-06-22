import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import Grid from '@mui/material/Grid';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HistoryIcon from '@mui/icons-material/History';
import TableRowsIcon from '@mui/icons-material/TableRows';
import GridViewIcon from '@mui/icons-material/GridView';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import { scraperService } from '../scraperService';
import type { ScraperHealthResponse, ScraperHealthSource } from '../types';
import { useToastify } from '../../../components/Toastify';
import { formatDistanceToNow, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import ScraperHealthDebugDetails from './ScraperHealthDebugDetails';
import ScraperHealthHistoryDrawer from './ScraperHealthHistoryDrawer';

const ANOMALY_MAP: Record<string, { label: string; color: 'error' | 'warning' }> = {
  BREAKAGE: { label: 'Scraper ném lỗi (gãy)', color: 'error' },
  ZERO_OUTPUT: { label: 'Không ra bài nào dù trước đó vẫn có', color: 'error' },
  LOW_OUTPUT: { label: 'Sản lượng tụt mạnh so với mức thường ngày', color: 'warning' },
  NO_NEW: { label: 'Không có bài mới trong nhiều lượt liên tiếp', color: 'warning' },
  DRIFT_TITLE: { label: 'Tỷ lệ bài có tiêu đề tụt — có thể đổi layout', color: 'warning' },
  DRIFT_PUBLISHEDAT: { label: 'Tỷ lệ bài có ngày đăng tụt — có thể đổi layout', color: 'warning' },
  DRIFT_TAGS: { label: 'Tỷ lệ bài có tags tụt — có thể đổi layout', color: 'warning' },
  DRIFT_METADATA: { label: 'Tỷ lệ metadata tụt — có thể đổi parser chi tiết', color: 'warning' },
  COVERAGE_GAP: { label: 'Có chuyên mục mới chưa có parser', color: 'warning' }
};

export default function ScraperHealthSection() {
  const { showToast } = useToastify();
  const location = useLocation();

  const [healthData, setHealthData] = useState<ScraperHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(() => {
    return localStorage.getItem('scraper_health_auto_refresh') === 'true';
  });
  const [expandedCard, setExpandedCard] = useState<Record<string, boolean>>({});
  const [historySource, setHistorySource] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
    return (localStorage.getItem('scraper_health_view_mode') as 'table' | 'grid') || 'table';
  });

  const handleChangeViewMode = (mode: 'table' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('scraper_health_view_mode', mode);
  };

  const handleOpenHistory = (source: string) => {
    setHistorySource(source);
    setHistoryOpen(true);
  };

  const [debugDialogSource, setDebugDialogSource] = useState<ScraperHealthSource | null>(null);

  const handleResetBaseline = async (source?: string) => {
    const confirmMessage = source 
      ? `Bạn có chắc chắn muốn reset baseline và lịch sử của nguồn cào "${source}"? Hành động này sẽ xóa các lượt chạy cũ và thu thập lại baseline mới.`
      : 'Bạn có chắc chắn muốn reset baseline và lịch sử của TẤT CẢ các nguồn cào?';
    
    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    try {
      const res = await scraperService.deleteHealth(source);
      showToast(
        `Đã reset thành công! Đã xóa ${res.deletedRuns} lượt chạy và xóa toàn bộ baseline.`,
        'success'
      );
      loadHealth();
    } catch (err: any) {
      console.error('Lỗi khi reset baseline:', err);
      showToast(err.response?.data?.message || 'Không thể reset baseline', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Highlight state
  const [highlightedSource, setHighlightedSource] = useState<string | null>(null);
  const sourceRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const loadHealth = async (showNotification = false) => {
    setLoading(true);
    try {
      const data = await scraperService.getHealth();
      setHealthData(data);
      if (showNotification) {
        showToast('Cập nhật tình trạng scraper thành công!', 'success');
      }
    } catch (err: any) {
      console.error('Lỗi tải scraper health:', err);
      showToast(err.response?.data?.message || 'Không thể tải tình trạng scraper', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadHealth();
  }, []);

  // Handle auto-polling
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadHealth();
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Handle scroll & highlight from navigation state
  useEffect(() => {
    const highlight = (location.state as any)?.highlightSource;
    if (highlight && healthData) {
      setHighlightedSource(highlight);
      
      // Clear location state so highlight doesn't trigger again on manual refresh
      window.history.replaceState({}, document.title);

      // Timeout to ensure DOM is rendered
      setTimeout(() => {
        const ref = sourceRefs.current[highlight];
        if (ref) {
          ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);

      // Remove highlight after 4 seconds
      const timer = setTimeout(() => {
        setHighlightedSource(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [location.state, healthData]);

  const toggleExpand = (source: string) => {
    setExpandedCard(prev => ({ ...prev, [source]: !prev[source] }));
  };

  const getStatusColor = (status: ScraperHealthSource['status']) => {
    switch (status) {
      case 'healthy': return { main: '#00b894', text: '#fff', bg: 'rgba(0, 184, 148, 0.1)', border: '#00b894' };
      case 'warn': return { main: '#f1c40f', text: '#000', bg: 'rgba(241, 196, 15, 0.1)', border: '#f1c40f' };
      case 'critical': return { main: '#d63031', text: '#fff', bg: 'rgba(214, 48, 49, 0.1)', border: '#d63031' };
      case 'gathering': return { main: '#95a5a6', text: '#fff', bg: 'rgba(149, 165, 166, 0.1)', border: '#95a5a6' };
      default: return { main: '#7f8c8d', text: '#fff', bg: 'rgba(127, 140, 141, 0.1)', border: '#7f8c8d' };
    }
  };

  const getStatusLabel = (status: ScraperHealthSource['status']) => {
    switch (status) {
      case 'healthy': return 'Bình thường';
      case 'warn': return 'Cảnh báo';
      case 'critical': return 'Nghiêm trọng';
      case 'gathering': return 'Đang thu thập baseline';
      default: return status;
    }
  };

  const getStatusIcon = (status: ScraperHealthSource['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon sx={{ color: '#00b894' }} />;
      case 'warn': return <WarningAmberIcon sx={{ color: '#f1c40f' }} />;
      case 'critical': return <ErrorIcon sx={{ color: '#d63031' }} />;
      case 'gathering': return <HelpCenterIcon sx={{ color: '#95a5a6' }} />;
      default: return null;
    }
  };

  const safeFormatDistance = (dateStr: string | null) => {
    if (!dateStr) return 'Chưa chạy lần nào';
    const d = new Date(dateStr);
    return isValid(d) ? formatDistanceToNow(d, { addSuffix: true, locale: vi }) : 'Không rõ';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* CSS Keyframe Animation for pulse glow */}
      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0px rgba(241, 196, 15, 0.7); border-color: #f1c40f; }
          50% { box-shadow: 0 0 0 12px rgba(241, 196, 15, 0); border-color: #f1c40f; }
          100% { box-shadow: 0 0 0 0px rgba(241, 196, 15, 0); border-color: transparent; }
        }
        .glowing-card {
          animation: pulseGlow 1.8s infinite ease-in-out;
          border: 2px solid #f1c40f !important;
        }
      `}</style>

      {/* Header Panel */}
      <Paper sx={{ p: 2.5, borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            Tình trạng Scraper
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Giám sát sức khỏe, chất lượng dữ liệu cào và các phát hiện bất thường của hệ thống.
          </Typography>
          {healthData && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Lần cập nhật cuối: {new Date(healthData.generatedAt).toLocaleString('vi-VN')}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAutoRefresh(checked);
                  localStorage.setItem('scraper_health_auto_refresh', String(checked));
                }}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Tự động cập nhật (60s)
              </Typography>
            }
          />

          <Button
            variant="outlined"
            onClick={() => loadHealth(true)}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}
          >
            Làm mới
          </Button>

          <Button
            variant="outlined"
            color="warning"
            onClick={() => handleResetBaseline()}
            disabled={loading}
            startIcon={<RestartAltIcon />}
            sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}
          >
            Reset tất cả baseline
          </Button>

          <ToggleButtonGroup
            size="small"
            value={viewMode}
            exclusive
            onChange={(_, mode) => mode && handleChangeViewMode(mode)}
            sx={{ height: 36, ml: 1 }}
          >
            <ToggleButton value="table" title="Dạng bảng" sx={{ px: 1.5 }}>
              <TableRowsIcon sx={{ fontSize: 18 }} />
            </ToggleButton>
            <ToggleButton value="grid" title="Dạng lưới" sx={{ px: 1.5 }}>
              <GridViewIcon sx={{ fontSize: 18 }} />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* Table or Cards List */}
      {!healthData && loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : healthData?.sources.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '16px' }}>
          <Typography variant="body1" color="text.secondary">
            Không có nguồn dữ liệu scraper nào được giám sát.
          </Typography>
        </Paper>
      ) : viewMode === 'table' ? (
        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: '12px', 
            overflow: 'hidden', 
            border: '1px solid', 
            borderColor: 'divider', 
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)' 
          }}
        >
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 40, py: 1 }} />
                <TableCell sx={{ fontWeight: 700, py: 1 }}>Nguồn</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1 }}>Lượt cuối</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1 }}>Kết quả</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1, textAlign: 'right' }}>Sản lượng / Baseline</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1, textAlign: 'right' }}>Mới</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1, pl: 3 }}>Fill Rates</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1 }}>Bất thường</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 1, textAlign: 'right' }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const sortedSources = healthData?.sources ? [...healthData.sources].sort((a, b) => {
                  const getScore = (status: string) => {
                    if (status === 'critical') return 3;
                    if (status === 'warn') return 2;
                    return 1;
                  };
                  const scoreA = getScore(a.status);
                  const scoreB = getScore(b.status);
                  if (scoreA !== scoreB) return scoreB - scoreA;
                  return a.source.localeCompare(b.source);
                }) : [];
                
                return sortedSources.map((item) => {
                  const colors = getStatusColor(item.status);
                  const isHighlighted = highlightedSource === item.source;
                  const hasDebug = item.anomalies.length > 0 || !!item.errorMessage;

                  return (
                    <React.Fragment key={item.source}>
                      <TableRow
                        ref={(el) => { sourceRefs.current[item.source] = el; }}
                        className={isHighlighted ? 'glowing-card' : ''}
                        sx={{
                          bgcolor: isHighlighted ? colors.bg : 'transparent',
                          '&:hover': { bgcolor: 'action.hover' },
                          '& > td': { py: 0.75, borderBottom: '1px solid', borderBottomColor: 'divider' }
                        }}
                      >
                        <TableCell>
                          {hasDebug && (
                            <IconButton
                              size="small"
                              onClick={() => toggleExpand(item.source)}
                              sx={{ p: 0.5 }}
                              color="error"
                            >
                              {expandedCard[item.source] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            </IconButton>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.primary', fontSize: '0.85rem' }}>
                          {item.source}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(item.status) || undefined}
                            label={getStatusLabel(item.status)}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              bgcolor: colors.bg,
                              color: colors.main,
                              border: `1px solid ${colors.main}30`,
                              height: '20px',
                              fontSize: '0.72rem',
                              '& .MuiChip-icon': { mr: 0.2, fontSize: '0.9rem' }
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.78rem' }}>
                          {safeFormatDistance(item.lastRunAt)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box 
                              sx={{ 
                                width: 6, 
                                height: 6, 
                                borderRadius: '50%', 
                                bgcolor: item.lastRunOk ? 'success.main' : 'error.main' 
                              }} 
                            />
                            <Typography variant="caption" sx={{ fontWeight: 700, color: item.lastRunOk ? 'success.main' : 'error.main', fontSize: '0.75rem' }}>
                              {item.lastRunOk ? 'OK' : 'Lỗi'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              ({(item.durationMs / 1000).toFixed(1)}s)
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 600 }}>
                          {item.total} {item.baselineTotal !== null ? `/ ~${item.baselineTotal}` : ''}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: item.inserted > 0 ? 'success.main' : 'text.secondary' }}>
                          +{item.inserted}
                        </TableCell>
                        <TableCell sx={{ pl: 3 }}>
                          {item.fillRates ? (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {Object.entries(item.fillRates).map(([field, val]) => {
                                if (val === undefined || val === null) return null;
                                const percentage = Math.round(val * 100);
                                const isLow = percentage < 50;
                                return (
                                  <Tooltip key={field} title={`${field}: ${percentage}%`} arrow placement="top">
                                    <Box
                                      sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        bgcolor: isLow ? 'error.main' : 'success.main',
                                        cursor: 'help',
                                        border: '1px solid transparent',
                                        '&:hover': { transform: 'scale(1.2)' },
                                        transition: 'transform 0.1s'
                                      }}
                                    />
                                  </Tooltip>
                                );
                              })}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.7rem' }}>
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {item.anomalies.map((code) => {
                              const config = ANOMALY_MAP[code] || { label: code, color: 'warning' };
                              return (
                                <Chip
                                  key={code}
                                  label={config.label}
                                  size="small"
                                  color={config.color}
                                  variant="outlined"
                                  sx={{ borderRadius: '4px', fontWeight: 600, fontSize: '0.65rem', height: '18px' }}
                                />
                              );
                            })}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenHistory(item.source)}
                            title="Xem lịch sử chạy"
                            color="primary"
                            sx={{ p: 0.5, mr: 0.5 }}
                          >
                            <HistoryIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleResetBaseline(item.source)}
                            title="Reset baseline"
                            color="warning"
                            sx={{ p: 0.5 }}
                          >
                            <RestartAltIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      {hasDebug && (
                        <TableRow sx={{ bgcolor: isHighlighted ? colors.bg : 'transparent' }}>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0, borderBottom: expandedCard[item.source] ? undefined : 'none' }} colSpan={10}>
                            <Collapse in={expandedCard[item.source]} timeout="auto" unmountOnExit>
                              <Box sx={{ py: 1.5, px: 2 }}>
                                <ScraperHealthDebugDetails data={item} />
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                });
              })()}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Grid container spacing={2}>
          {(() => {
            const sortedSources = healthData?.sources ? [...healthData.sources].sort((a, b) => {
              const getScore = (status: string) => {
                if (status === 'critical') return 3;
                if (status === 'warn') return 2;
                return 1;
              };
              const scoreA = getScore(a.status);
              const scoreB = getScore(b.status);
              if (scoreA !== scoreB) {
                return scoreB - scoreA;
              }
              return a.source.localeCompare(b.source);
            }) : [];
            return sortedSources.map((item) => {
            const colors = getStatusColor(item.status);
            const isHighlighted = highlightedSource === item.source;

            return (
              <Grid 
                size={{ xs: 12, sm: 6, md: 6, lg: 4 }}
                key={item.source}
                ref={(el) => { sourceRefs.current[item.source] = el; }}
              >
                <Card 
                  className={isHighlighted ? 'glowing-card' : ''}
                  sx={{ 
                    borderRadius: '12px', 
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.06)'
                    }
                  }}
                >
                  {/* Status Bar Indicator */}
                  <Box sx={{ height: '5px', bgcolor: colors.main, borderRadius: '12px 12px 0 0' }} />

                  <CardContent sx={{ p: 1.5, pb: '12px !important' }}>
                    {/* Header: Source and Status Badge */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.primary' }}>
                        {item.source}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(item.status) || undefined}
                        label={getStatusLabel(item.status)}
                        size="small"
                        sx={{ 
                          fontWeight: 700, 
                          bgcolor: colors.bg, 
                          color: colors.main,
                          border: `1px solid ${colors.main}30`,
                          height: '20px',
                          fontSize: '0.7rem',
                          '& .MuiChip-icon': {
                            mr: 0.3,
                            fontSize: '0.85rem'
                          }
                        }}
                      />
                    </Box>

                    {/* Stats Section */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, justifyContent: 'space-between', bgcolor: 'action.hover', p: 0.75, borderRadius: '6px', border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem', fontWeight: 700 }}>
                          SẢN LƯỢNG / BASELINE
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.1, fontSize: '0.8rem' }}>
                          {item.total} {item.baselineTotal !== null ? `/ ~${item.baselineTotal}` : ''}
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem', fontWeight: 700 }}>
                          SỐ BÀI MỚI
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: item.inserted > 0 ? 'success.main' : 'text.primary', mt: 0.1, fontSize: '0.8rem' }}>
                          +{item.inserted} bài
                        </Typography>
                      </Box>
                    </Box>

                    {/* Run Stats Info */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Lượt chạy cuối:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                          {safeFormatDistance(item.lastRunAt)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Trạng thái kết quả:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: item.lastRunOk ? 'success.main' : 'error.main', fontSize: '0.7rem' }}>
                          {item.lastRunOk ? 'Thành công' : 'Lỗi'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Thời gian chạy:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                          {(item.durationMs / 1000).toFixed(1)}s
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 1 }} />

                    {/* Fill Rates */}
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                        Độ đầy dữ liệu (Fill Rates):
                      </Typography>
                      {item.fillRates ? (
                        <Grid container spacing={0.5}>
                          {Object.entries(item.fillRates).map(([field, val]) => {
                            if (val === undefined || val === null) return null;
                            const percentage = Math.round(val * 100);
                            const isLow = percentage < 50;
                            return (
                              <Grid size={{ xs: 6 }} key={field}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: isLow ? 'error.main' : 'success.main', flexShrink: 0 }} />
                                  <Typography variant="caption" sx={{ textTransform: 'capitalize', fontWeight: 600, color: isLow ? 'error.main' : 'text.secondary', fontSize: '0.68rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {field}: <strong>{percentage}%</strong>
                                  </Typography>
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic', fontSize: '0.68rem' }}>
                          Không có dữ liệu tỷ lệ.
                        </Typography>
                      )}
                    </Box>

                    {/* Anomalies warnings */}
                    {item.anomalies.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.7rem' }}>
                          Phát hiện bất thường:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {item.anomalies.map((code) => {
                            const config = ANOMALY_MAP[code] || { label: code, color: 'warning' };
                            return (
                              <Chip 
                                key={code}
                                label={config.label}
                                size="small"
                                color={config.color}
                                variant="outlined"
                                sx={{ borderRadius: '4px', fontWeight: 600, fontSize: '0.65rem', height: '18px' }}
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    )}

                    {/* Expandable Debug / Error Details */}
                    {(item.anomalies.length > 0 || item.errorMessage) && (
                       <Box sx={{ mt: 1 }}>
                          <Button
                            size="small"
                            onClick={() => setDebugDialogSource(item)}
                            startIcon={<TroubleshootIcon sx={{ fontSize: 13 }} />}
                            sx={{ textTransform: 'none', p: 0, fontSize: '0.7rem', minWidth: 0, fontWeight: 700 }}
                            color="error"
                          >
                            Xem chi tiết gỡ lỗi (Debug)
                          </Button>
                       </Box>
                    )}

                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Button
                        size="small"
                        variant="text"
                        color="warning"
                        startIcon={<RestartAltIcon sx={{ fontSize: 14 }} />}
                        onClick={() => handleResetBaseline(item.source)}
                        sx={{ textTransform: 'none', fontSize: '0.7rem', fontWeight: 700 }}
                      >
                        Reset baseline
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<HistoryIcon sx={{ fontSize: 14 }} />}
                        onClick={() => handleOpenHistory(item.source)}
                        sx={{ textTransform: 'none', fontSize: '0.7rem', fontWeight: 700 }}
                      >
                        Xem lịch sử chạy
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })})()}
        </Grid>
      )}

      {/* Debug Details Dialog for Grid View */}
      <Dialog 
        open={!!debugDialogSource} 
        onClose={() => setDebugDialogSource(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Chi tiết gỡ lỗi (Debug): {debugDialogSource?.source.toUpperCase()}
          <Button onClick={() => setDebugDialogSource(null)} size="small" sx={{ minWidth: 0, fontWeight: 700 }}>Đóng</Button>
        </DialogTitle>
        <DialogContent sx={{ pt: '10px !important' }}>
          {debugDialogSource && <ScraperHealthDebugDetails data={debugDialogSource} />}
        </DialogContent>
      </Dialog>

      {/* History Runs Drawer */}
      <ScraperHealthHistoryDrawer
        source={historySource}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </Box>
  );
}
