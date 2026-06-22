import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Collapse
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import { scraperService } from '../scraperService';
import type { ScraperHealthResponse, ScraperHealthSource } from '../types';
import { useToastify } from '../../../components/Toastify';
import { formatDistanceToNow, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';

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
        </Box>
      </Paper>

      {/* Cards List */}
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
      ) : (
        <Grid container spacing={3}>
          {healthData?.sources.map((item) => {
            const colors = getStatusColor(item.status);
            const isHighlighted = highlightedSource === item.source;

            return (
              <Grid 
                item 
                xs={12} 
                md={6} 
                lg={4} 
                key={item.source}
                ref={(el) => { sourceRefs.current[item.source] = el; }}
              >
                <Card 
                  className={isHighlighted ? 'glowing-card' : ''}
                  sx={{ 
                    borderRadius: '16px', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
                    }
                  }}
                >
                  {/* Status Bar Indicator */}
                  <Box sx={{ height: '6px', bgcolor: colors.main, borderRadius: '16px 16px 0 0' }} />

                  <CardContent sx={{ p: 2.5 }}>
                    {/* Header: Source and Status Badge */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.primary' }}>
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
                          border: `1px solid ${colors.main}50`,
                          '& .MuiChip-icon': {
                            mr: 0.5
                          }
                        }}
                      />
                    </Box>

                    {/* Stats Section */}
                    <Grid container spacing={1.5} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', borderRadius: '8px', bgcolor: 'action.hover' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Sản lượng / Baseline
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {item.total} {item.baselineTotal !== null ? `/ ~${item.baselineTotal}` : ''}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', borderRadius: '8px', bgcolor: 'action.hover' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Số bài mới
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: item.inserted > 0 ? 'success.main' : 'text.primary' }}>
                            +{item.inserted} bài
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Run Stats Info */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Lượt chạy cuối:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {safeFormatDistance(item.lastRunAt)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Trạng thái kết quả:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: item.lastRunOk ? 'success.main' : 'error.main' }}>
                          {item.lastRunOk ? 'Thành công' : 'Lỗi kết nối / parse'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Thời gian chạy:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {(item.durationMs / 1000).toFixed(2)} giây
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Fill Rates */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1.5 }}>
                        Tỷ lệ đầy đủ trường dữ liệu (Fill Rates):
                      </Typography>
                      {item.fillRates ? (
                        <Grid container spacing={1.5}>
                          {Object.entries(item.fillRates).map(([field, val]) => {
                            if (val === undefined || val === null) return null;
                            const percentage = Math.round(val * 100);
                            const isLow = percentage < 50;
                            return (
                              <Grid item xs={6} key={field}>
                                <Box sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption" sx={{ textTransform: 'capitalize', fontWeight: 600, color: isLow ? 'error.main' : 'text.secondary' }}>
                                    {field}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: isLow ? 'error.main' : 'text.primary' }}>
                                    {percentage}%
                                  </Typography>
                                </Box>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={percentage} 
                                  color={isLow ? 'error' : 'primary'}
                                  sx={{ height: 4, borderRadius: 2 }}
                                />
                              </Grid>
                            );
                          })}
                        </Grid>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                          Không có dữ liệu tỷ lệ.
                        </Typography>
                      )}
                    </Box>

                    {/* Anomalies warnings */}
                    {item.anomalies.length > 0 && (
                      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary' }}>
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
                                sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.68rem', height: '22px' }}
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    )}

                    {/* Expandable Error Message */}
                    {item.errorMessage && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          size="small"
                          onClick={() => toggleExpand(item.source)}
                          startIcon={expandedCard[item.source] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          sx={{ textTransform: 'none', p: 0, fontSize: '0.72rem', minWidth: 0, fontWeight: 700 }}
                          color="error"
                        >
                          {expandedCard[item.source] ? 'Ẩn chi tiết lỗi' : 'Xem chi tiết lỗi'}
                        </Button>
                        <Collapse in={expandedCard[item.source]}>
                          <Box 
                            component="pre" 
                            sx={{ 
                              mt: 1, 
                              p: 1.2, 
                              borderRadius: '8px', 
                              bgcolor: 'rgba(214, 48, 49, 0.05)',
                              border: '1px solid rgba(214, 48, 49, 0.15)',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              color: 'error.main',
                              overflowX: 'auto',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                              maxHeight: '150px',
                              overflowY: 'auto'
                            }}
                          >
                            {item.errorMessage}
                          </Box>
                        </Collapse>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
