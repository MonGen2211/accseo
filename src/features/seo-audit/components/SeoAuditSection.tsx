import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
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
  Card,
  CardContent,
  Divider,
  Pagination,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
} from '@mui/material';

// Icons
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BoltIcon from '@mui/icons-material/Bolt';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import PageviewIcon from '@mui/icons-material/Pageview';
import HistoryIcon from '@mui/icons-material/History';
import SpeedIcon from '@mui/icons-material/Speed';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import HelpIcon from '@mui/icons-material/Help';

import { seoAuditService } from '../seoAuditService';
import type { AuditResult, AuditIssue, AuditCategory } from '../types';
import { useToastify } from '../../../components/Toastify';

// Format time GMT+7 DD/MM/YYYY HH:mm
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

const getScoreColor = (score: number) => {
  if (score >= 80) return '#00b894'; // Xanh lá
  if (score >= 50) return '#f1c40f'; // Vàng/Cam
  return '#d63031'; // Đỏ
};

export default function SeoAuditSection() {
  const { showToast } = useToastify();

  // Input states
  const [urlInput, setUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Results State
  const [activeReport, setActiveReport] = useState<AuditResult | null>(null);
  const [issueFilter, setIssueFilter] = useState<string>('all'); // all, critical, high, medium, low

  // History & Pagination states
  const [historyPage, setHistoryPage] = useState(1);
  const historyLimit = 10;

  // SWR for History Fetching
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

  // Trigger submission to run audit
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
      showToast('Đang cào trang và phân tích bằng AI, có thể mất 15–45 giây...', 'info');
      const res = await seoAuditService.runAudit(trimmedUrl);
      setActiveReport(res);
      setUrlInput('');
      mutateHistory();
      showToast('Phân tích SEO Audit hoàn tất!', 'success');
    } catch (err: any) {
      console.error('SEO Audit failed:', err);
      const code = err?.response?.data?.code || err?.code;
      const msg = err?.response?.data?.message || err?.message || 'Gặp lỗi trong quá trình chạy audit';

      if (code === 'INVALID_URL' || code === 'PRIVATE_URL_NOT_ALLOWED') {
        setSubmitError(msg);
      } else if (code === 'AUDIT_IN_PROGRESS') {
        showToast('Đang có phiên audit chạy cho URL này, vui lòng đợi một lát.', 'warning');
      } else if (code === 'AI_RATE_LIMIT') {
        showToast('Hệ thống tạm thời hết hạn ngạch AI, vui lòng thử lại sau vài phút.', 'warning');
      } else if (code === 'SCRAPE_FAILED') {
        showToast('Không cào được nội dung từ trang web này. Vui lòng kiểm tra lại URL.', 'danger');
      } else {
        showToast(msg, 'danger');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load a single old report
  const handleLoadHistoryDetail = async (id: string) => {
    try {
      showToast('Đang tải dữ liệu báo cáo cũ...', 'info');
      const detail = await seoAuditService.getAuditDetail(id);
      setActiveReport(detail);
      showToast('Đã mở báo cáo thành công!', 'success');
    } catch (err: any) {
      console.error('Load detail failed:', err);
      showToast(err?.response?.data?.message || err?.message || 'Không thể mở báo cáo này', 'danger');
    }
  };

  // Calculate counts for Issues Severity
  const issues = activeReport?.issues || [];
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const highCount = issues.filter((i) => i.severity === 'high').length;
  const mediumCount = issues.filter((i) => i.severity === 'medium').length;
  const lowCount = issues.filter((i) => i.severity === 'low').length;

  const filteredIssues = issues.filter((i) => {
    if (issueFilter === 'all') return true;
    return i.severity === issueFilter;
  });

  const getSeverityLabel = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'Nghiêm trọng (Critical)';
      case 'high':
        return 'Cao (High)';
      case 'medium':
        return 'Trung bình (Medium)';
      case 'low':
        return 'Thấp (Low)';
      default:
        return sev;
    }
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'critical':
        return { color: '#d63031', bg: 'rgba(214, 48, 49, 0.1)', border: '1px solid #d63031' };
      case 'high':
        return { color: '#e67e22', bg: 'rgba(230, 126, 34, 0.1)', border: '1px solid #e67e22' };
      case 'medium':
        return { color: '#f1c40f', bg: 'rgba(241, 196, 15, 0.1)', border: '1px solid #f1c40f' };
      case 'low':
      default:
        return { color: '#7f8c8d', bg: 'rgba(127, 140, 141, 0.1)', border: '1px solid #7f8c8d' };
    }
  };

  return (
    <Grid container spacing={3.5}>
      {/* COLUMN A: Main Run & Report Area */}
      <Grid item xs={12} lg={8.5}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          
          {/* 1. Run Audit Input Panel */}
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
              Điền URL bài viết của bạn để AI tiến hành cào nội dung, phân tích các chỉ số SEO On-page và đề xuất cải tiến.
            </Typography>

            <Box component="form" onSubmit={handleRunAudit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <TextField
                  label="Đường dẫn trang web cần kiểm tra (URL)"
                  placeholder="https://example.com/bai-viet-cua-ban"
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
                  {isSubmitting ? 'Đang phân tích...' : 'Chạy audit'}
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
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Đang phân tích trang bằng AI</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Hệ thống đang tiến hành cào nội dung HTML và gọi AI đánh giá 6 danh mục SEO On-page.<br />
                  Quá trình này mất khoảng <strong>15–45 giây</strong>. Vui lòng không đóng trang!
                </Typography>
              </Box>
            </Paper>
          )}

          {/* 3. Audit Report Render (when activeReport exists and not loading) */}
          {activeReport && !isSubmitting && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              
              {/* Report Header: Health score Gauge, Business Guess, and Summary */}
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
                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} sm={4} md={3} sx={{ display: 'flex', justifyContent: 'center' }}>
                    {/* Score Circle/Gauge */}
                    <Box
                      sx={{
                        width: 140,
                        height: 140,
                        borderRadius: '50%',
                        border: `10px solid ${getScoreColor(activeReport.healthScore)}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 0 20px ${getScoreColor(activeReport.healthScore)}25`,
                      }}
                    >
                      <Typography variant="h3" sx={{ fontWeight: 900, color: getScoreColor(activeReport.healthScore), lineHeight: 1 }}>
                        {activeReport.healthScore}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, mt: 0.5, letterSpacing: 1, textTransform: 'uppercase' }}>
                        Health Score
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={8} md={9}>
                    <Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                        <Chip
                          label={`Mô hình: ${activeReport.businessTypeGuess}`}
                          color="primary"
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                        <Chip
                          label={`AI Model: ${activeReport.aiModel}`}
                          variant="outlined"
                          size="small"
                          sx={{ color: 'text.secondary', fontWeight: 600 }}
                        />
                      </Box>
                      
                      <Typography
                        variant="body2"
                        component="a"
                        href={activeReport.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          fontWeight: 700,
                          color: 'primary.main',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontSize: '0.98rem',
                          wordBreak: 'break-all',
                          mb: 1.5,
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {activeReport.url} <OpenInNewIcon sx={{ fontSize: 13 }} />
                      </Typography>

                      <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 550, lineHeight: 1.6 }}>
                        {activeReport.summary}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Categories Grid (6 sections) */}
              <Typography variant="h6" sx={{ fontWeight: 800, mb: -1.5 }}>
                📊 Điểm số theo Danh mục SEO
              </Typography>
              <Grid container spacing={2.5}>
                {activeReport.categories.map((cat) => (
                  <Grid item xs={12} md={6} key={cat.key}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 3.5,
                        borderColor: 'divider',
                        height: '100%',
                        bgcolor: 'background.paper',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                            {cat.label}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                              label={`Trọng số: ${cat.weight}%`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.68rem', color: 'text.secondary' }}
                            />
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 900, color: getScoreColor(cat.score) }}
                            >
                              {cat.score}/100
                            </Typography>
                          </Box>
                        </Box>

                        <LinearProgress
                          variant="determinate"
                          value={cat.score}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'action.hover',
                            mb: 2,
                            '& .MuiLinearProgress-bar': {
                              bgcolor: getScoreColor(cat.score)
                            }
                          }}
                        />

                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: '0.85rem' }}>
                          {cat.findings}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Issues Section with Severity filtering */}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ErrorOutlinedIcon sx={{ color: '#d63031' }} /> Danh sách vấn đề cần sửa
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Lọc độ nghiêm trọng:</Typography>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <Select
                        value={issueFilter}
                        onChange={(e) => setIssueFilter(e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="all">Tất cả ({issues.length})</MenuItem>
                        <MenuItem value="critical" disabled={criticalCount === 0}>Nghiêm trọng ({criticalCount})</MenuItem>
                        <MenuItem value="high" disabled={highCount === 0}>Cao ({highCount})</MenuItem>
                        <MenuItem value="medium" disabled={mediumCount === 0}>Trung bình ({mediumCount})</MenuItem>
                        <MenuItem value="low" disabled={lowCount === 0}>Thấp ({lowCount})</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                {filteredIssues.length === 0 ? (
                  <Alert severity="success" sx={{ borderRadius: 3 }}>
                    Tuyệt vời! Không phát hiện vấn đề nào ở danh mục này.
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {filteredIssues.map((issue, idx) => {
                      const style = getSeverityStyle(issue.severity);
                      return (
                        <Box
                          key={idx}
                          sx={{
                            p: 2.5,
                            borderRadius: 3.5,
                            borderLeft: `5px solid ${style.color}`,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'action.hover',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                              {issue.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip
                                label={issue.category.toUpperCase()}
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                              />
                              <Chip
                                label={getSeverityLabel(issue.severity)}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  bgcolor: style.bg,
                                  color: style.color,
                                  border: style.border
                                }}
                              />
                            </Box>
                          </Box>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                            {issue.detail}
                          </Typography>

                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 2.5,
                              bgcolor: 'background.paper',
                              border: '1px dashed',
                              borderColor: 'divider'
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main', display: 'block', mb: 0.5 }}>
                              🛠️ Khắc phục Đề xuất:
                            </Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.5, fontWeight: 550 }}>
                              {issue.recommendation}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Paper>

              {/* Quick Wins Card */}
              {activeReport.quickWins && activeReport.quickWins.length > 0 && (
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
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentTurnedInIcon sx={{ color: '#00b894' }} /> Việc dễ làm hiệu quả cao (Quick Wins)
                  </Typography>
                  <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {activeReport.quickWins.map((win, idx) => (
                      <ListItem key={idx} sx={{ p: 0, alignItems: 'flex-start', gap: 1.5 }}>
                        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20, mt: 0.2 }} />
                        <Typography variant="body2" sx={{ fontWeight: 550, lineHeight: 1.5 }}>
                          {win}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              {/* Footnote: Not Assessed & Details metadata */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                
                {/* Not Assessed Info */}
                {activeReport.notAssessed && activeReport.notAssessed.length > 0 && (
                  <Box sx={{ flex: 1, minWidth: 280 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <HelpIcon sx={{ fontSize: 13 }} /> Nội dung không được đánh giá trong phiên này:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {activeReport.notAssessed.map((item, idx) => (
                        <Tooltip key={idx} title="Cần tích hợp Google Lighthouse hoặc dữ liệu bên ngoài để kiểm tra phần này" arrow>
                          <Chip
                            label={item}
                            size="small"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.65rem', borderStyle: 'dashed', color: 'text.secondary' }}
                          />
                        </Tooltip>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Metadata details */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' }, gap: 0.5 }}>
                  <Typography variant="caption" color="text.disabled">
                    Phương pháp cào: <strong>{activeReport.scrapeMethod}</strong> | AI: <strong>{activeReport.aiProvider} ({activeReport.aiModel})</strong>
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Thời gian chạy: <strong>{formatVnTime(activeReport.createdAt)}</strong>
                  </Typography>
                </Box>
              </Box>

            </Box>
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
              {[...Array(4)].map((_, i) => (
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
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', wordBreak: 'break-word', flex: 1, mr: 1, fontSize: '0.85rem' }}>
                              {hostname}
                            </Typography>
                          </Tooltip>
                          <Chip
                            label={item.healthScore}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              bgcolor: `${getScoreColor(item.healthScore)}15`,
                              color: getScoreColor(item.healthScore),
                              border: `1px solid ${getScoreColor(item.healthScore)}50`,
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.72rem' }}>
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
