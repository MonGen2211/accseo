import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
  Alert,
  Divider,
  Pagination,
  Grid,
  Skeleton,
} from '@mui/material';

// Icons
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HistoryIcon from '@mui/icons-material/History';
import SpeedIcon from '@mui/icons-material/Speed';

import { seoAuditService } from '../seoAuditService';
import type { SeoReport } from '../types';
import { useToastify } from '../../../components/Toastify';

// Vietnamese Time Formatter
const formatVnTime = (dateStr: string | undefined | null) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '—';
  }
};

// Threshold-based color generator
const getScoreColor = (score: number) => {
  if (score >= 80) return '#00b894'; // Xanh lá
  if (score >= 50) return '#f1c40f'; // Vàng
  return '#d63031'; // Đỏ
};

// Emojis mapping for 8 mandatory sections
const SECTION_CONFIGS: Record<string, { label: string; icon: string }> = {
  seo_basic: { label: 'SEO Cơ Bản', icon: '🔍' },
  images: { label: 'Tối Ưu Hình Ảnh', icon: '🖼️' },
  performance: { label: 'Tốc Độ & Hiệu Năng', icon: '⚡' },
  core_web_vitals: { label: 'Core Web Vitals', icon: '📈' },
  security: { label: 'Bảo Mật', icon: '🔒' },
  mobile: { label: 'Mobile & UX', icon: '📱' },
  errors: { label: 'Lỗi & Console', icon: '⚠️' },
  url_redirect: { label: 'URL & Redirect', icon: '🔗' },
};

export default function SeoAuditSection() {
  const { showToast } = useToastify();

  // Input states
  const [urlInput, setUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Filtering states
  const [filterStatus, setFilterStatus] = useState<'all' | 'fail' | 'warn'>('all');

  // Detail display state
  const [activeReport, setActiveReport] = useState<SeoReport | null>(null);

  // Pagination states
  const [historyPage, setHistoryPage] = useState(1);
  const historyLimit = 20;

  // Fetch history using SWR
  const {
    data: historyData,
    error: historyError,
    mutate: mutateHistory,
    isValidating: historyValidating,
  } = useSWR(
    ['/api/v1/seo-audit/history', historyPage],
    () => seoAuditService.getHistory(historyPage, historyLimit),
    {
      revalidateOnFocus: false,
    }
  );

  // Run new audit
  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) {
      setSubmitError('Vui lòng nhập URL');
      return;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setSubmitError('URL không hợp lệ. Phải bắt đầu bằng http:// hoặc https://');
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      setSubmitError('Định dạng URL sai cấu trúc');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      showToast('Đang cào trang và đo Core Web Vitals bằng trình duyệt, có thể mất 5–35 giây...', 'info');
      const res = await seoAuditService.runAudit(trimmedUrl);
      setActiveReport(res);
      setUrlInput('');
      mutateHistory();
      showToast('Phân tích SEO Audit hoàn tất!', 'success');
    } catch (err: any) {
      console.error('SEO Audit run failed:', err);
      const code = err?.response?.data?.code || err?.code;
      const msg = err?.response?.data?.message || err?.message || 'Gặp lỗi khi chạy phân tích SEO';

      if (code === 'INVALID_URL' || code === 'PRIVATE_URL_NOT_ALLOWED') {
        setSubmitError(msg);
      } else if (code === 'AUDIT_IN_PROGRESS') {
        showToast('Hệ thống đang tiến hành phân tích URL này. Vui lòng đợi vài giây rồi thử lại.', 'warning');
      } else if (code === 'FETCH_FAILED') {
        showToast('Không tải được trang. Vui lòng thử lại với một URL khác.', 'danger');
      } else if (code === 'AUDIT_NOT_FOUND' || code === 'INVALID_AUDIT_ID') {
        showToast('Không tìm thấy bản ghi phân tích này. Đang tải lại danh sách...', 'warning');
        mutateHistory();
      } else {
        showToast(msg, 'danger');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load old detail record
  const handleLoadHistoryDetail = async (id: string) => {
    try {
      showToast('Đang tải dữ liệu báo cáo cũ...', 'info');
      const detail = await seoAuditService.getAuditDetail(id);
      setActiveReport(detail);
      showToast('Đã mở báo cáo thành công!', 'success');
    } catch (err: any) {
      console.error('Load details failed:', err);
      const code = err?.response?.data?.code || err?.code;
      if (code === 'AUDIT_NOT_FOUND' || code === 'INVALID_AUDIT_ID') {
        showToast('Báo cáo không tồn tại hoặc đã bị xóa. Đang cập nhật lại lịch sử...', 'warning');
        mutateHistory();
      } else {
        showToast(err?.response?.data?.message || err?.message || 'Không thể mở báo cáo này', 'danger');
      }
    }
  };

  // Status Badge Renderer for checklist
  const renderStatusBadge = (status: 'pass' | 'warn' | 'fail') => {
    switch (status) {
      case 'pass':
        return (
          <Chip
            label="Đạt"
            icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#00b894 !important' }} />}
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: 'rgba(0, 184, 148, 0.1)',
              color: '#00b894',
              border: '1px solid rgba(0, 184, 148, 0.3)',
              borderRadius: 2,
            }}
          />
        );
      case 'warn':
        return (
          <Chip
            label="Cảnh báo"
            icon={<WarningAmberIcon sx={{ fontSize: '14px !important', color: '#f1c40f !important' }} />}
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: 'rgba(241, 196, 15, 0.1)',
              color: '#f1c40f',
              border: '1px solid rgba(241, 196, 15, 0.3)',
              borderRadius: 2,
            }}
          />
        );
      case 'fail':
        return (
          <Chip
            label="Không đạt"
            icon={<CancelIcon sx={{ fontSize: '14px !important', color: '#d63031 !important' }} />}
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: 'rgba(214, 48, 49, 0.1)',
              color: '#d63031',
              border: '1px solid rgba(214, 48, 49, 0.3)',
              borderRadius: 2,
            }}
          />
        );
    }
  };

  // Filter sections & criteria based on status filter
  const visibleSections = (activeReport?.sections || [])
    .map((sec) => {
      const filteredCriteria = sec.criteria.filter((c) => {
        if (filterStatus === 'all') return true;
        return c.status === filterStatus;
      });
      return { ...sec, criteria: filteredCriteria };
    })
    .filter((sec) => sec.criteria.length > 0);

  return (
    <Grid container spacing={3.5}>
      {/* COLUMN A: Input form & Detailed Report */}
      <Grid item xs={12} lg={8.5}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          
          {/* 1. URL Input Form Panel */}
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <SpeedIcon sx={{ color: '#00b894', fontSize: 30 }} /> Phân tích SEO Audit & AI On-page
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
              Điền URL bài viết để hệ thống chạy giả lập Chrome kiểm tra các chỉ số Core Web Vitals, HTML On-page và đề xuất tối ưu.
            </Typography>

            <Box component="form" onSubmit={handleRunAudit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <TextField
                  label="Đường dẫn trang web cần kiểm tra (URL)"
                  placeholder="https://example.com/bai-viet"
                  fullWidth
                  variant="outlined"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (submitError) setSubmitError('');
                  }}
                  disabled={isSubmitting}
                  sx={{
                    flex: 1,
                    minWidth: 280,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || !urlInput.trim()}
                  startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ transform: 'rotate(-45deg)' }} />}
                  sx={{
                    py: 1.8,
                    px: 4,
                    borderRadius: 3,
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #00b894 0%, #009975 100%)',
                    boxShadow: '0 4px 15px rgba(0, 184, 148, 0.25)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #3dd6a0 0%, #009975 100%)',
                    },
                  }}
                >
                  {isSubmitting ? 'Đang phân tích...' : 'Phân tích'}
                </Button>
              </Box>

              {submitError && (
                <Alert severity="error" sx={{ borderRadius: 3 }}>
                  {submitError}
                </Alert>
              )}
            </Box>
          </Paper>

          {/* 2. Loading State */}
          {isSubmitting && (
            <Paper
              elevation={0}
              sx={{
                p: 8,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
              }}
            >
              <CircularProgress size={50} thickness={4.5} sx={{ color: '#00b894' }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Đang chạy phân tích SEO Audit</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
                  Đang tải trang và đo Core Web Vitals bằng trình duyệt, có thể mất <strong>5–35 giây</strong>...<br />
                  Vui lòng không tắt trang hoặc bấm gửi lại yêu cầu!
                </Typography>
              </Box>
            </Paper>
          )}

          {/* 3. Detailed Report Render */}
          {activeReport && !isSubmitting && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              
              {/* Report summary overview card */}
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  🔍 SEO Audit Report
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                  <Typography
                    variant="body2"
                    component="a"
                    href={activeReport.finalUrl || activeReport.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      fontWeight: 700,
                      color: 'primary.main',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: '0.92rem',
                      wordBreak: 'break-all',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {activeReport.finalUrl || activeReport.url} <OpenInNewIcon sx={{ fontSize: 13 }} />
                  </Typography>
                  
                  <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />
                  
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Ngày phân tích: {formatVnTime(activeReport.createdAt)}
                  </Typography>
                  {activeReport.responseMs && (
                    <>
                      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Tốc độ phản hồi: {activeReport.responseMs}ms
                      </Typography>
                    </>
                  )}
                </Box>

                <Grid container spacing={4} alignItems="center">
                  {/* Total score gauge circle */}
                  <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Box
                      sx={{
                        width: 150,
                        height: 150,
                        borderRadius: '50%',
                        border: `10px solid ${getScoreColor(activeReport.score)}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 0 24px ${getScoreColor(activeReport.score)}22`,
                      }}
                    >
                      <Typography variant="h3" sx={{ fontWeight: 900, color: getScoreColor(activeReport.score), lineHeight: 1 }}>
                        {activeReport.score}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, mt: 0.5, letterSpacing: 0.5 }}>
                        ĐIỂM SEO
                      </Typography>
                    </Box>
                  </Grid>

                  {/* 3 counter blocks */}
                  <Grid item xs={12} md={8}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            borderColor: 'rgba(0, 184, 148, 0.25)',
                            bgcolor: 'rgba(0, 184, 148, 0.04)',
                            borderRadius: 3.5,
                          }}
                        >
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#00b894' }}>
                            {activeReport.summary.pass}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#00b894', display: 'block', mt: 0.5 }}>
                            🟢 Đạt
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid item xs={4}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            borderColor: 'rgba(241, 196, 15, 0.25)',
                            bgcolor: 'rgba(241, 196, 15, 0.04)',
                            borderRadius: 3.5,
                          }}
                        >
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#f1c40f' }}>
                            {activeReport.summary.warn}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#f1c40f', display: 'block', mt: 0.5 }}>
                            🟡 Cần cải thiện
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid item xs={4}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            borderColor: 'rgba(214, 48, 49, 0.25)',
                            bgcolor: 'rgba(214, 48, 49, 0.04)',
                            borderRadius: 3.5,
                          }}
                        >
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#d63031' }}>
                            {activeReport.summary.fail}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#d63031', display: 'block', mt: 0.5 }}>
                            🔴 Không đạt
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mt: 2, fontWeight: 700, textAlign: 'center' }}>
                      Tổng số: <strong>{activeReport.summary.total}</strong> tiêu chí kiểm tra
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Filtering bar */}
              <Box sx={{ display: 'flex', gap: 1.25, mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', mr: 0.5 }}>
                  Lọc theo kết quả kiểm tra:
                </Typography>
                
                <Chip
                  label="Hiện tất cả"
                  clickable
                  onClick={() => setFilterStatus('all')}
                  variant={filterStatus === 'all' ? 'filled' : 'outlined'}
                  color={filterStatus === 'all' ? 'primary' : 'default'}
                  sx={{ fontWeight: 700, borderRadius: 2.5 }}
                />
                
                <Chip
                  label="Chỉ Không Đạt (🔴)"
                  clickable
                  onClick={() => setFilterStatus('fail')}
                  variant={filterStatus === 'fail' ? 'filled' : 'outlined'}
                  color={filterStatus === 'fail' ? 'error' : 'default'}
                  sx={{ fontWeight: 700, borderRadius: 2.5 }}
                />

                <Chip
                  label="Chỉ Cảnh Báo (🟡)"
                  clickable
                  onClick={() => setFilterStatus('warn')}
                  variant={filterStatus === 'warn' ? 'filled' : 'outlined'}
                  color={filterStatus === 'warn' ? 'warning' : 'default'}
                  sx={{ fontWeight: 700, borderRadius: 2.5 }}
                />
              </Box>

              {/* Sections & Criteria Render */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {visibleSections.map((sec, idx) => {
                  const config = SECTION_CONFIGS[sec.key] || { label: sec.label, icon: '📋' };
                  
                  // Calculate local stats inside section (original criteria before filtering)
                  const originalSec = (activeReport.sections || []).find((s) => s.key === sec.key);
                  const passCount = originalSec ? originalSec.criteria.filter((c) => c.status === 'pass').length : 0;
                  const warnCount = originalSec ? originalSec.criteria.filter((c) => c.status === 'warn').length : 0;
                  const failCount = originalSec ? originalSec.criteria.filter((c) => c.status === 'fail').length : 0;

                  return (
                    <Accordion
                      key={sec.key}
                      defaultExpanded={idx === 0}
                      sx={{
                        borderRadius: 3.5,
                        mb: 0.5,
                        '&:before': { display: 'none' },
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                        boxShadow: 'none',
                        '&.Mui-expanded': {
                          margin: '0 0 4px 0'
                        }
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<KeyboardArrowDownIcon />}
                        sx={{
                          bgcolor: 'action.hover',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1.5, flexWrap: 'wrap', gap: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography sx={{ fontSize: '1.25rem', lineHeight: 1 }}>
                              {config.icon}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                              {config.label}
                            </Typography>
                          </Box>
                          
                          {/* Mini badge counter for status in current section */}
                          <Box sx={{ display: 'flex', gap: 0.75 }}>
                            {passCount > 0 && (
                              <Chip
                                label={`🟢 ${passCount}`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, borderColor: 'rgba(0,184,148,0.2)', color: '#00b894' }}
                              />
                            )}
                            {warnCount > 0 && (
                              <Chip
                                label={`🟡 ${warnCount}`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, borderColor: 'rgba(241,196,15,0.2)', color: '#f1c40f' }}
                              />
                            )}
                            {failCount > 0 && (
                              <Chip
                                label={`🔴 ${failCount}`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, borderColor: 'rgba(214,48,49,0.2)', color: '#d63031' }}
                              />
                            )}
                          </Box>
                        </Box>
                      </AccordionSummary>
                      
                      <AccordionDetails sx={{ p: 0 }}>
                        <TableContainer>
                          <Table size="medium">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'background.default' }}>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.82rem', py: 1.2 }}>Tiêu chí</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.82rem', width: 140, py: 1.2 }}>Kết quả</TableCell>
                              </TableRow>
                            </TableHead>
                            
                            <TableBody>
                              {sec.criteria.map((c) => (
                                <TableRow key={c.key} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                  <TableCell sx={{ py: 1.8 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.25 }}>
                                      {c.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                                      {c.message}
                                    </Typography>
                                  </TableCell>
                                  
                                  <TableCell align="right" sx={{ py: 1.8 }}>
                                    {renderStatusBadge(c.status)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>

            </Box>
          )}

          {/* Empty welcome screen if no report is active */}
          {!activeReport && !isSubmitting && (
            <Paper
              elevation={0}
              sx={{
                p: 8,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                textAlign: 'center'
              }}
            >
              <Box sx={{ fontSize: 50, opacity: 0.8 }}>🔍</Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Chưa có báo cáo phân tích nào</Typography>
              <Typography variant="body2" color="text.secondary">
                Vui lòng nhập URL trang web ở trên để tiến hành cào dữ liệu và phân tích On-page,<br />
                hoặc nhấp chọn một báo cáo có sẵn từ danh sách lịch sử bên phải.
              </Typography>
            </Paper>
          )}

        </Box>
      </Grid>

      {/* COLUMN B: Right Sidebar History Panel */}
      <Grid item xs={12} lg={3.5}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            minHeight: 500,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <HistoryIcon sx={{ fontSize: 18 }} /> Lịch sử SEO Audit
            </Typography>
            <IconButton
              size="small"
              onClick={() => mutateHistory()}
              disabled={historyValidating}
            >
              <RefreshIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          {historyError ? (
            <Alert severity="error" sx={{ borderRadius: 3, py: 1 }}>Lỗi khi tải lịch sử</Alert>
          ) : !historyData ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={68} sx={{ borderRadius: 2.5 }} />
              ))}
            </Box>
          ) : historyData.items.length === 0 ? (
            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', textAlign: 'center', py: 8 }}>
              Chưa có trang web nào được chạy Audit.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, gap: 3.5 }}>
              <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {historyData.items.map((item) => {
                  const isActive = activeReport?.id === item.id;
                  const hostname = item.url.replace('https://', '').replace('http://', '').split('/')[0];
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        border: '1px solid',
                        borderColor: isActive ? 'primary.main' : 'divider',
                        borderRadius: 3,
                        bgcolor: isActive ? 'action.selected' : 'transparent',
                        transition: 'all 0.2s',
                        overflow: 'hidden',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        }
                      }}
                    >
                      <ListItemButton
                        onClick={() => handleLoadHistoryDetail(item.id)}
                        sx={{ p: 1.75, flexDirection: 'column', alignItems: 'stretch' }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start', mb: 1 }}>
                          <Tooltip title={item.url} arrow>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', wordBreak: 'break-all', flex: 1, mr: 1, fontSize: '0.85rem' }}>
                              {hostname}
                            </Typography>
                          </Tooltip>
                          <Chip
                            label={item.score}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              bgcolor: `${getScoreColor(item.score)}15`,
                              color: getScoreColor(item.score),
                              border: `1px solid ${getScoreColor(item.score)}50`,
                            }}
                          />
                        </Box>
                        
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            fontSize: '0.72rem'
                          }}
                        >
                          {item.url}
                        </Typography>
                        
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block', fontSize: '0.7rem' }}>
                          {formatVnTime(item.createdAt)}
                        </Typography>
                      </ListItemButton>
                    </Box>
                  );
                })}
              </List>

              {historyData.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
                  <Pagination
                    count={historyData.totalPages}
                    page={historyPage}
                    onChange={(_, val) => setHistoryPage(val)}
                    size="small"
                  />
                </Box>
              )}
            </Box>
          )}

        </Paper>
      </Grid>
    </Grid>
  );
}
