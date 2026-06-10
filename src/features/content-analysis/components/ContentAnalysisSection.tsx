import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Grid,
  Link,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileSearchIcon from '@mui/icons-material/FindInPage';
import DescriptionIcon from '@mui/icons-material/Description';
import LoadingButton from '@mui/lab/LoadingButton';

import { contentAnalysisService } from '../contentAnalysisService';
import type { SessionDetail, SessionListItem, PerArticleStructural } from '../types';
import { useToastify } from '@/components/Toastify';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const STATUS_LABEL: Record<string, string> = {
  queued: 'Đang chờ xử lý',
  scraping_serp: 'Đang cào Top SERP',
  scraping_competitors: 'Đang cào trang đối thủ',
  analyzing: 'Đang phân tích cấu trúc',
  generating_outline: 'Đang sinh outline AI',
  done: 'Hoàn thành',
  failed: 'Lỗi',
};

const STATUS_COLOR: Record<string, 'default' | 'primary' | 'success' | 'error'> = {
  queued: 'default',
  scraping_serp: 'primary',
  scraping_competitors: 'primary',
  analyzing: 'primary',
  generating_outline: 'primary',
  done: 'success',
  failed: 'error',
};

const ERROR_HINTS: Record<string, string> = {
  CONTENT_ANALYSIS_SERP_BLOCKED: 'Google đã chặn IP. Đợi 30-60 phút hoặc reset profile từ Ranking Checker.',
  CONTENT_ANALYSIS_SERP_EMPTY: 'Google không có kết quả cho keyword này.',
  CONTENT_ANALYSIS_NO_COMPETITORS: 'Không scrape được đủ trang đối thủ (Cloudflare block?). Thử keyword khác.',
  CONTENT_ANALYSIS_AI_FAILED: 'AI gặp lỗi khi sinh outline. Thử lại sau.',
  CONTENT_ANALYSIS_AI_INVALID_RESPONSE: 'AI gặp lỗi khi sinh outline. Thử lại sau.',
  CONTENT_ANALYSIS_AI_RATE_LIMIT: 'Hết quota AI tạm thời, đợi vài phút.',
};

const FAILED_REASON_LABEL: Record<string, string> = {
  scrape_failed: 'Bị chặn / fetch fail',
  no_fulltext: 'Không trích được nội dung',
  thin_content: 'Nội dung quá ngắn (<500 ký tự)',
};

const FAILED_REASON_STYLE: Record<string, { bgcolor: string; color: string }> = {
  scrape_failed: { bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' },
  no_fulltext: { bgcolor: 'rgba(249, 115, 22, 0.1)', color: '#f97316' },
  thin_content: { bgcolor: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04' },
};

const getMethodTooltip = (method: string): string => {
  if (method === 'axios-lite' || method === 'axios-stealth') {
    return 'Chặn ở tầng HTTP (UA / IP / Cloudflare)';
  }
  if (method === 'puppeteer') {
    return 'Mở browser được nhưng nội dung không hợp lệ';
  }
  if (method === 'failed') {
    return 'Tất cả phương pháp đều fail (CF / Datadome / Captcha hard block)';
  }
  if (method === 'pdf') {
    return 'File PDF không parse được';
  }
  return method;
};

const getHostname = (urlStr: string): string => {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return urlStr;
  }
};

// Generate markdown structure
const generateMarkdown = (session: SessionDetail): string => {
  if (!session.result) return '';
  const outline = session.result.outline;
  const rec = session.result.structural.recommendation;

  let md = `# ${outline.title || session.keyword}\n`;
  if (outline.metaDescription) {
    md += `> ${outline.metaDescription}\n\n`;
  }

  md += `**Recommended word count:** ${rec.recommendedWordCount.ideal} words (range: ${rec.recommendedWordCount.min} - ${rec.recommendedWordCount.max})\n`;
  md += `**Recommended headings:** H2: ${rec.recommendedH2Count.ideal}+, H3: ${rec.recommendedH3Count.ideal}+\n`;
  md += `**Recommended image count:** ${rec.recommendedImageCount.ideal}+\n`;
  md += `**Recommended keyword density:** ${rec.recommendedKeywordDensity.ideal}% (range: ${rec.recommendedKeywordDensity.min}% - ${rec.recommendedKeywordDensity.max}%)\n\n`;

  if (outline.differentiationStrategy) {
    md += `## Differentiation Strategy\n${outline.differentiationStrategy}\n\n`;
  }

  md += `## Outline Structure\n`;
  outline.outline.forEach((node) => {
    const prefix = '#'.repeat(node.level);
    let badges = '';
    if (node.isCoreIntent) badges += ' [Core/Bắt buộc]';
    if (node.isUniqueValue) badges += ' [Góc nhìn độc đáo]';
    md += `${prefix} ${node.text}${badges}\n`;
    if (node.supportingKeywords && node.supportingKeywords.length > 0) {
      md += `*Supporting keywords: ${node.supportingKeywords.join(', ')}*\n`;
    }
    md += '\n';
  });

  if (outline.faqs && outline.faqs.length > 0) {
    md += `## FAQ\n`;
    outline.faqs.forEach((faq) => {
      md += `**Q: ${faq.question}**\n`;
      md += `A: ${faq.shortAnswer}\n\n`;
    });
  }

  return md;
};

interface ContentAnalysisSectionProps {
  isActive?: boolean;
}

interface SelectedCompetitorState {
  art: PerArticleStructural;
  source: {
    index: number;
    url: string;
    title: string | null;
    displayUrl: string | null;
    snippet: string | null;
    position: number | null;
  } | undefined;
  position: number;
}

export default function ContentAnalysisSection({ isActive = true }: ContentAnalysisSectionProps) {
  const { showToast } = useToastify();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSessionId = searchParams.get('session');

  // Input states
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('vn');
  const [language, setLanguage] = useState('vi');
  const [topN, setTopN] = useState(10);

  // Data states
  const [historyList, setHistoryList] = useState<SessionListItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeSessionDetail, setActiveSessionDetail] = useState<SessionDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompactOutline, setIsCompactOutline] = useState(false);
  const [isExportingDoc, setIsExportingDoc] = useState(false);

  // Competitor details modal state
  const [selectedCompetitor, setSelectedCompetitor] = useState<SelectedCompetitorState | null>(null);

  // History list item refs for scrolling
  const historyItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Load history list
  const fetchHistoryList = useCallback(async (silent = false) => {
    if (!silent) setLoadingHistory(true);
    try {
      const data = await contentAnalysisService.getSessionsList(20);
      setHistoryList(data.items || []);
    } catch (err) {
      console.error('Failed to load history list:', err);
      showToast('Lỗi khi tải lịch sử phân tích', 'danger');
    } finally {
      if (!silent) setLoadingHistory(false);
    }
  }, [showToast]);

  // Initial load
  useEffect(() => {
    Promise.resolve().then(() => {
      fetchHistoryList();
    });
  }, [fetchHistoryList]);

  // Poll active session details
  useEffect(() => {
    if (!activeSessionId || !isActive) {
      if (!activeSessionId) {
        Promise.resolve().then(() => setActiveSessionDetail(null));
      }
      return;
    }

    let active = true;
    let attempt = 0;

    const poll = async () => {
      while (active) {
        try {
          const detail = await contentAnalysisService.getSession(activeSessionId);
          if (!active) return;
          setActiveSessionDetail(detail);

          // Stop polling if done or failed
          if (detail.status === 'done' || detail.status === 'failed') {
            fetchHistoryList(true); // silent refresh history
            break;
          }
        } catch (err) {
          console.error('Polling error:', err);
          const axiosError = err as { response?: { status?: number } };
          // If 404, we might want to stop
          if (axiosError.response?.status === 404) {
            showToast('Không tìm thấy phiên phân tích này', 'danger');
            setSearchParams({});
            break;
          }
        }

        attempt++;
        const delay = Math.min(3000 + attempt * 500, 8000);
        await new Promise((r) => setTimeout(r, delay));
      }
    };

    poll();

    return () => {
      active = false;
    };
  }, [activeSessionId, isActive, fetchHistoryList, setSearchParams, showToast]);

  // Background poll history list if there are active sessions
  useEffect(() => {
    if (!isActive) return;
    const hasActive = historyList.some(item => !['done', 'failed'].includes(item.status));
    if (!hasActive) return;

    const interval = setInterval(() => {
      fetchHistoryList(true);
    }, 7000);

    return () => clearInterval(interval);
  }, [historyList, isActive, fetchHistoryList]);

  // Form submit to start analysis
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKeyword = keyword.trim();
    if (cleanKeyword.length < 2 || cleanKeyword.length > 200) {
      showToast('Từ khoá phải từ 2 đến 200 ký tự', 'warning');
      return;
    }

    setIsSubmitting(true);
    showToast('Đang khởi tạo phiên phân tích...', 'info');

    try {
      const res = await contentAnalysisService.startSession({
        keyword: cleanKeyword,
        location,
        language,
        topN,
      });

      // Clear input on success
      setKeyword('');
      
      // Auto-load session and refresh history
      setSearchParams({ session: res.sessionId });
      await fetchHistoryList(true);

      if (res.status === 'done' || res.cached) {
        showToast('Tải dữ liệu từ bộ nhớ đệm (Cache) thành công!', 'success');
      } else {
        showToast('Phiên phân tích đã được đưa vào hàng đợi thành công!', 'success');
      }
    } catch (err) {
      console.error('Start session error:', err);
      const axiosError = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const statusCode = axiosError.response?.status;
      const errorCode = axiosError.response?.data?.message || axiosError.message;

      if (statusCode === 409 || errorCode?.includes('BUSY') || errorCode?.includes('active')) {
        showToast('Bạn đang có một phiên phân tích đang chạy. Vui lòng đợi!', 'warning');
        
        // Find the active session in history and scroll to it
        const activeItem = historyList.find(item => !['done', 'failed'].includes(item.status));
        if (activeItem) {
          setSearchParams({ session: activeItem._id });
          setTimeout(() => {
            historyItemRefs.current[activeItem._id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
        }
      } else {
        showToast(axiosError.response?.data?.message || axiosError.message || 'Lỗi khởi tạo phiên phân tích', 'danger');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to copy outline as markdown
  const handleCopyOutlineMarkdown = () => {
    if (!activeSessionDetail || !activeSessionDetail.result) return;
    const md = generateMarkdown(activeSessionDetail);
    navigator.clipboard.writeText(md);
    showToast('Đã sao chép outline Markdown vào bộ nhớ tạm!', 'success');
  };

  // Helper to export outline markdown file
  const handleExportMarkdownFile = useCallback(() => {
    if (!activeSessionDetail || !activeSessionDetail.result) return;
    const md = generateMarkdown(activeSessionDetail);
    const element = document.createElement('a');
    const file = new Blob([md], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `outline_${activeSessionDetail.keyword.replace(/\s+/g, '_')}_${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    element.remove();
    showToast('Đã tải xuống file outline Markdown!', 'success');
  }, [activeSessionDetail, showToast]);

  // Helper to re-analyze
  const handleReanalyze = async () => {
    if (!activeSessionDetail) return;
    setIsSubmitting(true);
    showToast('Đang yêu cầu phân tích lại...', 'info');
    try {
      const res = await contentAnalysisService.startSession({
        keyword: activeSessionDetail.keyword,
        location: activeSessionDetail.location,
        language: activeSessionDetail.language,
        topN: activeSessionDetail.topN,
      });
      setSearchParams({ session: res.sessionId });
      await fetchHistoryList(true);
      showToast('Đã bắt đầu phân tích lại!', 'success');
    } catch (err) {
      console.error('Re-analyze error:', err);
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(axiosError.response?.data?.message || axiosError.message || 'Lỗi khi yêu cầu phân tích lại', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to export/open Google Doc
  const handleExportGoogleDoc = async (force = false) => {
    if (!activeSessionDetail) return;

    if (force) {
      const confirmRestart = window.confirm("Bạn có chắc chắn muốn tạo lại Google Doc mới? File cũ sẽ bị ghi đè/tạo file mới.");
      if (!confirmRestart) return;
    }

    setIsExportingDoc(true);
    showToast(force ? 'Đang tạo lại Google Doc mới...' : 'Đang xuất Google Doc (quá trình này mất 2–6 giây)...', 'info');

    try {
      const res = await contentAnalysisService.exportDoc(activeSessionDetail._id, force);

      // Update local state with docUrl and docId
      setActiveSessionDetail(prev => prev ? {
        ...prev,
        docUrl: res.docUrl,
        docId: res.docId
      } : null);

      // Update history list in place if found
      setHistoryList(prev => prev.map(item => 
        item._id === activeSessionDetail._id ? { ...item, docUrl: res.docUrl } : item
      ));

      showToast(force ? 'Đã tạo lại Google Doc mới!' : 'Xuất Google Doc thành công!', 'success');

      // Open the document in a new tab
      if (res.docUrl) {
        window.open(res.docUrl, '_blank');
      }
    } catch (err) {
      console.error('Export Google Doc error:', err);
      const axiosError = err as { response?: { data?: { code?: string; message?: string } }; code?: string; message?: string };
      const code = axiosError.response?.data?.code || axiosError.code;
      const msg = axiosError.response?.data?.message || axiosError.message || 'Lỗi khi xuất Google Doc';

      if (code === 'DOCS_APPS_SCRIPT_NOT_CONFIGURED') {
        showToast('Docs Apps Script chưa được cấu hình. Vui lòng liên hệ Admin.', 'danger');
      } else {
        showToast(msg, 'danger');
      }
    } finally {
      setIsExportingDoc(false);
    }
  };



  // Helper to copy single outline node text
  const handleCopySingleNode = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Đã sao chép dòng outline này!', 'success');
  };

  // Helper to calculate median word count for competitors
  const getCompetitorsMedianWordCount = () => {
    if (!activeSessionDetail?.result?.structural?.aggregate?.wordCount) return 0;
    return activeSessionDetail.result.structural.aggregate.wordCount.median;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Title */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
          Tạo Outline đối thủ (Surfer SEO Analyzer)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Phân tích Top 10 đối thủ hàng đầu trên SERP Google, tính toán cấu trúc thẻ headings, mật độ từ khoá NLP và tự động thiết kế Outline SEO chuẩn.
        </Typography>
      </Box>

      {/* Main Two Column Layout */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'flex-start' }}>
        
        {/* Left Column - Form & History */}
        <Box sx={{ width: { xs: '100%', md: 360 }, display: 'flex', flexDirection: 'column', gap: 3, position: { md: 'sticky' }, top: { md: 24 }, flexShrink: 0 }}>
          
          {/* Analysis Form */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
              Khởi tạo phiên phân tích mới
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
              <TextField
                label="Từ khoá phân tích brief"
                placeholder="Ví dụ: thủ tục ly hôn thuận tình"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                disabled={isSubmitting}
                autoFocus
                required
                slotProps={{
                  htmlInput: { minLength: 2, maxLength: 200 }
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                helperText="Từ 2 đến 200 ký tự"
              />

              <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}>
                <InputLabel>Vị trí địa lý (Google Local)</InputLabel>
                <Select
                  value={location}
                  label="Vị trí địa lý (Google Local)"
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isSubmitting}
                >
                  <MenuItem value="vn">Việt Nam (google.com.vn)</MenuItem>
                  <MenuItem value="us">Mỹ (google.com)</MenuItem>
                  <MenuItem value="jp">Nhật Bản (google.co.jp)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}>
                <InputLabel>Ngôn ngữ tìm kiếm</InputLabel>
                <Select
                  value={language}
                  label="Ngôn ngữ tìm kiếm"
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isSubmitting}
                >
                  <MenuItem value="vi">Tiếng Việt (Vietnamese)</MenuItem>
                  <MenuItem value="en">Tiếng Anh (English)</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ px: 1, mt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Số đối thủ cào quét (Top SERP)</span>
                  <Box component="strong" sx={{ color: 'primary.main' }}>{topN} bài viết</Box>
                </Typography>
                <Slider
                  value={topN}
                  min={5}
                  max={15}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                  onChange={(_, val) => setTopN(val as number)}
                  disabled={isSubmitting}
                  sx={{ color: 'primary.main' }}
                />
              </Box>

              <LoadingButton
                type="submit"
                variant="contained"
                loading={isSubmitting}
                loadingPosition="start"
                disabled={keyword.trim().length < 2 || historyList.some(item => !['done', 'failed'].includes(item.status))}
                startIcon={<SendIcon />}
                sx={{
                  py: 1.4,
                  borderRadius: '100px',
                  fontWeight: 900,
                  textTransform: 'none',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  boxShadow: 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'scale(1.02)',
                    boxShadow: 'none',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled'
                  }
                }}
              >
                Phân tích từ khóa
              </LoadingButton>
            </Box>
          </Paper>

          {/* History Sessions List */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', maxHeight: 420, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <HistoryIcon sx={{ fontSize: 18 }} />
                Lịch sử cào quét
              </Typography>
              <IconButton size="small" onClick={() => fetchHistoryList(false)} disabled={loadingHistory}>
                <RefreshIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>

            {loadingHistory && historyList.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
            ) : historyList.length === 0 ? (
              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', textAlign: 'center', py: 4 }}>
                Chưa có từ khoá nào được phân tích
              </Typography>
            ) : (
              <List sx={{ overflowY: 'auto', p: 0, gap: 1, display: 'flex', flexDirection: 'column' }}>
                {historyList.map((item) => {
                  const isActive = activeSessionId === item._id;
                  const isTerminal = ['done', 'failed'].includes(item.status);
                  
                  return (
                    <Box
                      key={item._id}
                      ref={(el) => { historyItemRefs.current[item._id] = el; }}
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
                        onClick={() => setSearchParams({ session: item._id })}
                        sx={{ p: 1.5, flexDirection: 'column', alignItems: 'stretch' }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'flex-start', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: isActive ? 800 : 700, color: 'text.primary', wordBreak: 'break-word', flex: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {item.keyword}
                            {item.docUrl && (
                              <Tooltip title="Đã có Google Doc" arrow>
                                <DescriptionIcon sx={{ fontSize: 14, color: 'success.main' }} />
                              </Tooltip>
                            )}
                          </Typography>
                          <Chip
                            label={STATUS_LABEL[item.status] || item.status}
                            size="small"
                            color={STATUS_COLOR[item.status] || 'default'}
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }}
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: vi })}
                          </Typography>
                          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
                            {item.progress}%
                          </Typography>
                        </Box>

                        {!isTerminal && (
                          <LinearProgress
                            variant="determinate"
                            value={item.progress}
                            sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }}
                          />
                        )}
                      </ListItemButton>
                    </Box>
                  );
                })}
              </List>
            )}
          </Paper>
        </Box>

        {/* Right Column - Results Details Panel */}
        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          
          {/* STATE 1: Empty state */}
          {!activeSessionId && (
            <Paper
              elevation={0}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 12,
                px: 3,
                textAlign: 'center',
                color: 'text.disabled',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 4,
                bgcolor: 'background.paper',
              }}
            >
              <FileSearchIcon sx={{ fontSize: 64, opacity: 0.25, mb: 2 }} />
              <Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Chọn một từ khoá cần phân tích
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 450 }}>
                Hãy chọn một phiên từ lịch sử cào quét ở cột trái hoặc nhập một từ khoá mới để phân tích cấu trúc đối thủ và tạo dàn bài (brief outline).
              </Typography>
            </Paper>
          )}

          {/* STATE 2: Loading/Processing state */}
          {activeSessionId && activeSessionDetail && !['done', 'failed'].includes(activeSessionDetail.status) && (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 4,
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
              }}
            >
              <CircularProgress size={44} color="primary" />
              
              <Box sx={{ textAlign: 'center', maxWidth: 450, width: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                  Đang phân tích: &ldquo;{activeSessionDetail.keyword}&rdquo;
                </Typography>
                <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700, mb: 2 }}>
                  Bước hiện tại: {activeSessionDetail.currentStep || STATUS_LABEL[activeSessionDetail.status]}
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={activeSessionDetail.progress}
                  sx={{ height: 8, borderRadius: 4, mb: 2, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary', fontSize: '0.8rem', bgcolor: 'action.hover', p: 1.5, borderRadius: 2 }}>
                  <span>Tiến độ: <strong>{activeSessionDetail.progress}%</strong></span>
                  <span>
                    Ước tính: {
                      activeSessionDetail.status === 'queued' ? 'Đang chờ trong queue...' :
                      activeSessionDetail.status === 'scraping_serp' ? 'Đang cào Top SERP Google (~15-30s)' :
                      activeSessionDetail.status === 'scraping_competitors' ? `Đang cào ${activeSessionDetail.topN} trang đối thủ (~10-60s)` :
                      activeSessionDetail.status === 'analyzing' ? 'Đang phân tích cấu trúc (~5s)' :
                      activeSessionDetail.status === 'generating_outline' ? 'Đang gọi AI sinh outline (~10-20s)' :
                      'Đang xử lý...'
                    }
                  </span>
                </Box>
              </Box>
            </Paper>
          )}

          {/* STATE 4: Failed state */}
          {activeSessionId && activeSessionDetail && activeSessionDetail.status === 'failed' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Alert
                severity="error"
                icon={<CancelIcon sx={{ color: '#ef4444' }} />}
                sx={{
                  borderRadius: 4,
                  p: 3,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Không phân tích được từ khoá này!
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                  Lỗi hệ thống: {activeSessionDetail.errorMessage || 'Lỗi không xác định.'}
                </Typography>
                
                {activeSessionDetail.errorCode && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(185, 28, 28, 0.05)', borderRadius: 2, borderLeft: '3px solid #b91c1c' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Gợi ý xử lý:</Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.85rem' }}>
                      {ERROR_HINTS[activeSessionDetail.errorCode] || `Mã lỗi: ${activeSessionDetail.errorCode}. Vui lòng thử lại sau.`}
                    </Typography>
                  </Box>
                )}
              </Alert>

              <Box>
                <LoadingButton
                  variant="outlined"
                  onClick={handleReanalyze}
                  loading={isSubmitting}
                  loadingPosition="start"
                  startIcon={<RefreshIcon />}
                  sx={{
                    borderRadius: '100px',
                    fontWeight: 700,
                    py: 1.2,
                    px: 3,
                    border: '1.5px solid',
                    transition: 'all 0.2s',
                    '&:hover': {
                      border: '1.5px solid',
                      transform: 'scale(1.02)',
                    }
                  }}
                >
                  Thử lại ngay
                </LoadingButton>
              </Box>
            </Box>
          )}

          {/* STATE 3: Done state */}
          {activeSessionId && activeSessionDetail && activeSessionDetail.status === 'done' && activeSessionDetail.result && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              
              {/* 1. Header Section */}
              <Paper elevation={0} sx={{ p: 3.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', position: 'relative' }}>
                {activeSessionDetail.result.structural.scrapedCount < activeSessionDetail.topN && (
                  <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
                    Không scrape được toàn bộ đối thủ (chỉ cào thành công {activeSessionDetail.result.structural.scrapedCount}/{activeSessionDetail.topN} bài). Dữ liệu tính toán dựa trên số bài cào thành công.
                  </Alert>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2.5 }}>
                  <Box sx={{ flex: '1 1 auto', minWidth: { xs: '100%', md: '300px' } }}>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.5px', wordBreak: 'break-word' }}>
                      {activeSessionDetail.keyword}
                    </Typography>

                    {activeSessionDetail.result.scrapeSummary && (
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 700, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        Đã phân tích {activeSessionDetail.result.scrapeSummary.succeeded}/{activeSessionDetail.result.scrapeSummary.attempted} trang Top SERP
                      </Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                      <Chip label={`Local: ${activeSessionDetail.location.toUpperCase()}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      <Chip label={`Ngôn ngữ: ${activeSessionDetail.language.toUpperCase()}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      <Chip label={`Cào quét: Top ${activeSessionDetail.topN}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      {activeSessionDetail.result.outline?.model && (
                        <Chip label={`AI Model: ${activeSessionDetail.result.outline.model}`} size="small" variant="outlined" sx={{ fontWeight: 600, color: 'primary.main', borderColor: 'primary.main' }} />
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', flex: '1 1 auto', justifyContent: { xs: 'flex-start', md: 'flex-end' }, mt: { xs: 2, md: 0 } }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={handleCopyOutlineMarkdown}
                      sx={{
                        borderRadius: '100px',
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 0.8,
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.02)'
                        }
                      }}
                    >
                      Copy Outline
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CloudDownloadIcon />}
                      onClick={handleExportMarkdownFile}
                      sx={{
                        borderRadius: '100px',
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 0.8,
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.02)'
                        }
                      }}
                    >
                      Tải Markdown (.md)
                    </Button>
                    {activeSessionDetail.docUrl ? (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<DescriptionIcon />}
                          onClick={() => window.open(activeSessionDetail.docUrl!, '_blank')}
                          sx={{
                            borderRadius: '100px',
                            textTransform: 'none',
                            fontWeight: 700,
                            py: 0.8,
                            boxShadow: 'none',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'primary.dark',
                              transform: 'scale(1.02)',
                              boxShadow: 'none'
                            }
                          }}
                        >
                          Mở Google Doc
                        </Button>
                        <LoadingButton
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => handleExportGoogleDoc(true)}
                          loading={isExportingDoc}
                          loadingPosition="start"
                          startIcon={<DescriptionIcon />}
                          sx={{
                            borderRadius: '100px',
                            textTransform: 'none',
                            fontWeight: 700,
                            py: 0.8,
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'scale(1.02)'
                            }
                          }}
                        >
                          Tạo lại Doc
                        </LoadingButton>
                      </>
                    ) : (
                      <LoadingButton
                        size="small"
                        variant="contained"
                        color="primary"
                        loading={isExportingDoc}
                        loadingPosition="start"
                        startIcon={<DescriptionIcon />}
                        onClick={() => handleExportGoogleDoc(false)}
                        sx={{
                          borderRadius: '100px',
                          textTransform: 'none',
                          fontWeight: 700,
                          py: 0.8,
                          boxShadow: 'none',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'scale(1.02)',
                            boxShadow: 'none'
                          }
                        }}
                      >
                        Xuất Google Doc
                      </LoadingButton>
                    )}
                    <LoadingButton
                      size="small"
                      variant="outlined"
                      color="primary"
                      loading={isSubmitting}
                      loadingPosition="start"
                      startIcon={<RefreshIcon />}
                      onClick={handleReanalyze}
                      sx={{
                        borderRadius: '100px',
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 0.8,
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.02)'
                        }
                      }}
                    >
                      Cào lại
                    </LoadingButton>
                  </Box>
                </Box>

                {/* Cached Banner */}
                {activeSessionDetail.startedAt && (
                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', color: 'text.secondary', fontSize: '0.8rem' }}>
                    <span>Cào quét lúc: {formatDate(activeSessionDetail.startedAt)}</span>
                    {activeSessionDetail.updatedAt !== activeSessionDetail.createdAt && (
                      <Chip label="Đã lưu đệm (Cached)" size="small" color="info" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                    )}
                  </Box>
                )}
              </Paper>

              {/* 2. Recommendation Cards */}
              {activeSessionDetail.result.structural.recommendation && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', pl: 0.5 }}>
                    Đề xuất cấu trúc chuẩn SEO (Structural Recommendations)
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
                    
                    {/* Word Count */}
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'rgba(0, 184, 148, 0.02)' }}>
                      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>ĐỘ DÀI BÀI VIẾT</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', mt: 1, mb: 0.5 }}>
                          {activeSessionDetail.result.structural.recommendation.recommendedWordCount.ideal.toLocaleString()} từ
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Khung: {activeSessionDetail.result.structural.recommendation.recommendedWordCount.min.toLocaleString()} - {activeSessionDetail.result.structural.recommendation.recommendedWordCount.max.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>

                    {/* H2 Count */}
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'rgba(0, 184, 148, 0.02)' }}>
                      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>SỐ THẺ H2</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', mt: 1, mb: 0.5 }}>
                          {activeSessionDetail.result.structural.recommendation.recommendedH2Count.ideal} thẻ
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Tối thiểu: {activeSessionDetail.result.structural.recommendation.recommendedH2Count.min} thẻ H2
                        </Typography>
                      </CardContent>
                    </Card>

                    {/* Image Count */}
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'rgba(0, 184, 148, 0.02)' }}>
                      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>SỐ LƯỢNG ẢNH</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', mt: 1, mb: 0.5 }}>
                          {activeSessionDetail.result.structural.recommendation.recommendedImageCount.ideal} ảnh
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Tối thiểu: {activeSessionDetail.result.structural.recommendation.recommendedImageCount.min} ảnh
                        </Typography>
                      </CardContent>
                    </Card>

                    {/* Keyword Density */}
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'rgba(0, 184, 148, 0.02)' }}>
                      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>MẬT ĐỘ TỪ KHÓA</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', mt: 1, mb: 0.5 }}>
                          {activeSessionDetail.result.structural.recommendation.recommendedKeywordDensity.ideal}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Khung: {activeSessionDetail.result.structural.recommendation.recommendedKeywordDensity.min}% - {activeSessionDetail.result.structural.recommendation.recommendedKeywordDensity.max}%
                        </Typography>
                      </CardContent>
                    </Card>

                  </Box>

                  {/* Differentiation Strategy */}
                  {activeSessionDetail.result.outline?.differentiationStrategy && (
                    <Box sx={{ p: 2.5, borderLeft: '4px solid #00cec9', bgcolor: 'action.hover', borderRadius: '0 8px 8px 0' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.8 }}>
                        CHIẾN LƯỢC ĐỘC ĐÁO & KHÁC BIỆT CỦA BẠN (DIFFERENTIATION STRATEGY)
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', lineHeight: 1.6 }}>
                        {activeSessionDetail.result.outline.differentiationStrategy}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Warning Banner for failed sources >= 30% */}
              {activeSessionDetail.result.scrapeSummary && 
               (activeSessionDetail.result.scrapeSummary.failed / activeSessionDetail.result.scrapeSummary.attempted >= 0.3) && (
                <Alert 
                  severity="warning" 
                  sx={{ 
                    borderRadius: 3.5, 
                    border: '1px solid', 
                    borderColor: 'warning.light', 
                    bgcolor: 'rgba(237, 108, 2, 0.03)',
                    fontWeight: 600,
                    px: 3,
                    py: 1.75
                  }}
                >
                  {activeSessionDetail.result.scrapeSummary.failed}/{activeSessionDetail.result.scrapeSummary.attempted} trang đối thủ bị chặn (Cloudflare/Captcha). Outline AI chỉ phân tích trên {activeSessionDetail.result.scrapeSummary.succeeded} trang còn lại — kết quả có thể thiếu góc nhìn. Cân nhắc chạy lại keyword này khi IP mát hoặc dùng keyword biến thể.
                </Alert>
              )}

              {/* 3. Outline Tree Section */}
              {activeSessionDetail.result.outline?.outline && (
                <Paper elevation={0} sx={{ p: 3.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      Dàn ý bài viết tối ưu bằng AI (Brief Outline)
                    </Typography>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={isCompactOutline}
                          onChange={(e) => setIsCompactOutline(e.target.checked)}
                          color="primary"
                          size="small"
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>Chế độ tối giản (Compact)</Typography>}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {activeSessionDetail.result.outline.outline.map((node, index) => {
                      const getIndentStyle = () => {
                        if (node.level === 3) return { ml: 4, borderLeft: '2px solid rgba(37, 99, 235, 0.15)', pl: 2 };
                        if (node.level === 4) return { ml: 8, borderLeft: '2px dotted rgba(37, 99, 235, 0.15)', pl: 2 };
                        return { ml: 0 };
                      };

                      const getLevelColor = () => {
                        if (node.level === 2) return { bg: '#dbeafe', text: '#2563eb' };
                        if (node.level === 3) return { bg: '#e0f2fe', text: '#0369a1' };
                        return { bg: '#f1f5f9', text: '#475569' };
                      };

                      const badge = getLevelColor();

                      return (
                        <Box key={index} sx={{ ...getIndentStyle(), display: 'flex', flexDirection: 'column', gap: 0.8, py: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            
                            <Chip
                              label={`H${node.level}`}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                height: 18,
                                fontSize: '0.65rem',
                                bgcolor: badge.bg,
                                color: badge.text,
                                border: `1px solid ${badge.text}25`
                              }}
                            />

                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: node.level === 2 ? 800 : node.level === 3 ? 700 : 500,
                                color: 'text.primary',
                                fontSize: node.level === 2 ? '0.96rem' : '0.88rem'
                              }}
                            >
                              {node.text}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 0.8 }}>
                              {node.isCoreIntent && (
                                <Chip
                                  label="Bắt buộc (Core)"
                                  size="small"
                                  sx={{
                                    height: 16,
                                    fontSize: '0.6rem',
                                    fontWeight: 800,
                                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.15)' : '#dbeafe',
                                    color: 'primary.main',
                                    border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid #bfdbfe'
                                  }}
                                />
                              )}
                              {node.isUniqueValue && (
                                <Chip
                                  label="Góc nhìn độc đáo"
                                  size="small"
                                  sx={{
                                    height: 16,
                                    fontSize: '0.6rem',
                                    fontWeight: 800,
                                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(123, 31, 162, 0.15)' : '#f3e5f5',
                                    color: (theme) => theme.palette.mode === 'dark' ? '#ba68c8' : '#7b1fa2',
                                    border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(186, 104, 200, 0.25)' : '1px solid #e1bee7'
                                  }}
                                />
                              )}
                              {!isCompactOutline && node.appearsInArticles && (
                                <Tooltip title={`Xuất hiện ở các đối thủ vị trí: ${node.appearsInArticles.join(', ')}`} arrow>
                                  <Chip label={`${node.appearsInArticles.length}/${activeSessionDetail.result?.structural.scrapedCount} đối thủ`} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'action.hover' }} />
                                </Tooltip>
                              )}
                            </Box>

                            <Tooltip title="Sao chép tiêu đề" arrow>
                              <IconButton size="small" onClick={() => handleCopySingleNode(node.text)} sx={{ p: 0.25 }}>
                                <ContentCopyIcon sx={{ fontSize: 13 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>

                          {!isCompactOutline && node.supportingKeywords && node.supportingKeywords.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, pl: 5, alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mr: 0.5 }}>NLP Keywords:</Typography>
                              {node.supportingKeywords.map((kw) => (
                                <Chip
                                  key={kw}
                                  label={kw}
                                  size="small"
                                  sx={{
                                    height: 16,
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    bgcolor: 'transparent',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    color: 'text.secondary'
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>
              )}

              {/* 4. FAQ Section */}
              {activeSessionDetail.result.outline?.faqs && activeSessionDetail.result.outline.faqs.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', pl: 0.5 }}>
                    💬 Câu hỏi thường gặp do AI sinh (Suggested FAQs)
                  </Typography>
                  <Box>
                    {activeSessionDetail.result.outline.faqs.map((faq, index) => (
                      <Accordion
                        key={index}
                        elevation={0}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 3.5,
                          mb: 1.5,
                          '&:before': { display: 'none' },
                          overflow: 'hidden'
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="body2" sx={{ fontWeight: 750, color: 'text.primary' }}>
                            {faq.question}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', p: 2.5 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontWeight: 500 }}>
                            {faq.shortAnswer}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                </Box>
              )}

              {/* 6. NLP Terms / Keyword chips */}
              {activeSessionDetail.result.structural.termFrequency && activeSessionDetail.result.structural.termFrequency.length > 0 && (
                <Paper elevation={0} sx={{ p: 3.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 2 }}>
                    Cụm từ NLP cần có trong bài viết (NLP Term Frequency)
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
                    {activeSessionDetail.result.structural.termFrequency.slice(0, 30).map((termItem) => {
                      const totalScraped = activeSessionDetail.result?.structural.scrapedCount || 10;
                      const hasCoverage = termItem.articleCount >= 4; // Appear in 4+ competitors -> Core NLP term
                      return (
                        <Tooltip
                          key={termItem.term}
                          title={`Tổng lượt xuất hiện: ${termItem.totalCount} lần · Xuất hiện ở ${termItem.articleCount}/${totalScraped} đối thủ · Trung bình ${termItem.averageInArticles.toFixed(1)} lần/bài`}
                          arrow
                        >
                          <Chip
                            label={`${termItem.term}`}
                            size="small"
                            avatar={
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: hasCoverage ? '#10b981' : 'rgba(0,0,0,0.06)',
                                  color: hasCoverage ? 'white' : 'text.secondary',
                                  borderRadius: '50%',
                                  width: '20px !important',
                                  height: '20px !important',
                                  fontSize: '0.6rem !important',
                                  fontWeight: 800,
                                }}
                              >
                                {termItem.articleCount}
                              </Box>
                            }
                            sx={{
                              fontWeight: 700,
                              py: 2,
                              px: 0.5,
                              borderRadius: 2.5,
                              bgcolor: hasCoverage ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                              border: '1px solid',
                              borderColor: hasCoverage ? '#10b981' : 'divider',
                              color: 'text.primary',
                            }}
                          />
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Paper>
              )}

              {/* 5. Competitor Table */}
              {activeSessionDetail.result.structural.perArticle && activeSessionDetail.result.structural.perArticle.length > 0 && (
                <Paper elevation={0} sx={{ p: 3.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', overflow: 'hidden' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 2 }}>
                    Phân tích chi tiết từng đối thủ (Competitors Structural Analysis)
                  </Typography>

                  <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, py: 1.25 }}>#</TableCell>
                          <TableCell sx={{ fontWeight: 800, py: 1.25 }}>Tiêu đề / Link</TableCell>
                          <TableCell sx={{ fontWeight: 800, py: 1.25 }}>Độ dài</TableCell>
                          <TableCell sx={{ fontWeight: 800, py: 1.25 }}>H2</TableCell>
                          <TableCell sx={{ fontWeight: 800, py: 1.25 }}>H3</TableCell>
                          <TableCell sx={{ fontWeight: 800, py: 1.25 }}>Ảnh</TableCell>
                          <TableCell sx={{ fontWeight: 800, py: 1.25 }}>Mật độ (%)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activeSessionDetail.result.structural.perArticle.map((art, idx) => {
                          const matchingSource = activeSessionDetail.result?.sources.find(s => s.url === art.url);
                          const position = matchingSource?.position || idx + 1;
                          const isWinning = art.wordCount > getCompetitorsMedianWordCount();
                          
                          return (
                            <TableRow
                              key={idx}
                              hover
                              onClick={() => setSelectedCompetitor({ art, source: matchingSource, position })}
                              sx={{
                                cursor: 'pointer',
                                bgcolor: isWinning ? 'rgba(0, 184, 148, 0.02)' : 'transparent',
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                            >
                              <TableCell sx={{ fontWeight: 700, py: 1.2 }}>{position}</TableCell>
                              <TableCell sx={{ py: 1.2, maxWidth: 280 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }} noWrap>
                                  {art.title || matchingSource?.title || 'Không tìm thấy tiêu đề'}
                                </Typography>
                                <Typography variant="caption" color="primary.main" sx={{ textDecoration: 'underline', wordBreak: 'break-all', display: 'block' }} noWrap>
                                  {art.url}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ py: 1.2, fontWeight: 600 }}>
                                {art.wordCount.toLocaleString()} từ
                                {isWinning && (
                                  <Tooltip title="Độ dài lớn hơn Median - Đáng tham khảo!" arrow>
                                    <Chip label="Winning" size="small" color="success" sx={{ height: 16, fontSize: '0.55rem', ml: 1, fontWeight: 800 }} />
                                  </Tooltip>
                                )}
                              </TableCell>
                              <TableCell sx={{ py: 1.2, color: 'text.secondary', fontWeight: 600 }}>{art.h2Count}</TableCell>
                              <TableCell sx={{ py: 1.2, color: 'text.secondary', fontWeight: 600 }}>{art.h3Count}</TableCell>
                              <TableCell sx={{ py: 1.2, color: 'text.secondary', fontWeight: 600 }}>{art.imageCount}</TableCell>
                              <TableCell sx={{ py: 1.2, color: 'text.secondary', fontWeight: 700 }}>{art.keywordDensity.toFixed(2)}%</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* 5.1. Trang đối thủ KHÔNG scrape được */}
              {activeSessionDetail.result.failedSources && (
                <Accordion
                  key={activeSessionDetail._id + '-failed-sources'}
                  defaultExpanded={activeSessionDetail.result.failedSources.length > 0}
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 4,
                    overflow: 'hidden',
                    '&:before': { display: 'none' },
                    bgcolor: 'background.paper',
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        Trang đối thủ KHÔNG cào được (Failed Competitor Scrapes)
                      </Typography>
                      {activeSessionDetail.result.scrapeSummary && (
                        <Chip
                          label={`${activeSessionDetail.result.scrapeSummary.failed}/${activeSessionDetail.result.scrapeSummary.attempted} trang fail`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            fontWeight: 800,
                          }}
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', p: 3.5 }}>
                    {activeSessionDetail.result.failedSources.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                        Không có trang đối thủ nào bị lỗi cào quét.
                      </Typography>
                    ) : (
                      <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 800, py: 1.25 }}>#</TableCell>
                              <TableCell sx={{ fontWeight: 800, py: 1.25 }}>URL</TableCell>
                              <TableCell sx={{ fontWeight: 800, py: 1.25 }}>Lý do</TableCell>
                              <TableCell sx={{ fontWeight: 800, py: 1.25 }}>Method</TableCell>
                              <TableCell sx={{ fontWeight: 800, py: 1.25 }}>Error</TableCell>
                              <TableCell sx={{ fontWeight: 800, py: 1.25 }}>Thời gian</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {activeSessionDetail.result.failedSources.map((source, idx) => {
                              const style = FAILED_REASON_STYLE[source.reason] || { bgcolor: 'action.selected', color: 'text.secondary' };
                              return (
                                <TableRow key={idx} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                  <TableCell sx={{ fontWeight: 700, py: 1.2 }}>{idx + 1}</TableCell>
                                  <TableCell sx={{ py: 1.2, maxWidth: 280 }}>
                                    <Tooltip title={source.url} arrow>
                                      <Link
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        underline="none"
                                        sx={{
                                          color: 'primary.main',
                                          fontWeight: 500,
                                          wordBreak: 'break-all',
                                          display: 'inline-block',
                                          '&:hover': {
                                            textDecoration: 'underline'
                                          }
                                        }}
                                      >
                                        {getHostname(source.url)}
                                      </Link>
                                    </Tooltip>
                                  </TableCell>
                                  <TableCell sx={{ py: 1.2 }}>
                                    <Chip
                                      label={FAILED_REASON_LABEL[source.reason] || source.reason}
                                      size="small"
                                      sx={{
                                        bgcolor: style.bgcolor,
                                        color: style.color,
                                        fontWeight: 800,
                                        borderRadius: 2
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ py: 1.2 }}>
                                    <Tooltip title={getMethodTooltip(source.method)} arrow>
                                      <Chip
                                        label={source.method}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                          fontWeight: 700,
                                          borderColor: 'divider',
                                          bgcolor: 'action.hover',
                                          color: 'text.secondary',
                                          borderRadius: 2
                                        }}
                                      />
                                    </Tooltip>
                                  </TableCell>
                                  <TableCell sx={{ py: 1.2, maxWidth: 200 }}>
                                    {source.error ? (
                                      <Tooltip title={source.error} arrow>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            fontStyle: 'italic',
                                            color: 'text.secondary',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                          }}
                                        >
                                          {source.error}
                                        </Typography>
                                      </Tooltip>
                                    ) : (
                                      <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                                        —
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell sx={{ py: 1.2, fontWeight: 600, color: 'text.secondary' }}>
                                    {source.durationMs}ms
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </AccordionDetails>
                </Accordion>
              )}


              {/* 7. PAA + Related Searches */}
              {((activeSessionDetail.result.peopleAlsoAsk && activeSessionDetail.result.peopleAlsoAsk.length > 0) ||
                (activeSessionDetail.result.relatedSearches && activeSessionDetail.result.relatedSearches.length > 0)) && (
                <Grid container spacing={3.5}>
                  
                  {/* People Also Ask */}
                  {activeSessionDetail.result.peopleAlsoAsk && activeSessionDetail.result.peopleAlsoAsk.length > 0 && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper elevation={0} sx={{ p: 3.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: '100%' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 2 }}>
                          Người dùng cũng hỏi (People Also Ask)
                        </Typography>
                        <List dense disablePadding>
                          {activeSessionDetail.result.peopleAlsoAsk.map((q, idx) => (
                            <ListItem key={idx} sx={{ py: 0.75, borderBottom: idx < (activeSessionDetail.result?.peopleAlsoAsk.length ?? 0) - 1 ? '1px solid' : 'none', borderColor: 'divider', px: 0 }}>
                              <ListItemText primary={<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{q}</Typography>} />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Grid>
                  )}

                  {/* Related Searches */}
                  {activeSessionDetail.result.relatedSearches && activeSessionDetail.result.relatedSearches.length > 0 && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper elevation={0} sx={{ p: 3.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: '100%' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 2 }}>
                          Tìm kiếm có liên quan (Related Searches)
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {activeSessionDetail.result.relatedSearches.map((kw, idx) => (
                            <Chip
                              key={idx}
                              label={kw}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                py: 1.5,
                                px: 0.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'transparent',
                                color: 'text.primary'
                              }}
                            />
                          ))}
                        </Box>
                      </Paper>
                    </Grid>
                  )}

                </Grid>
              )}

              {/* 8. Featured Snippet */}
              {activeSessionDetail.result.featuredSnippet && (
                <Paper elevation={0} sx={{ p: 3.5, borderRadius: 4, border: '1.5px solid #f59e0b', bgcolor: 'rgba(245, 158, 11, 0.02)' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#b45309', mb: 1.5 }}>
                    Google Featured Snippet (Đoạn trích nổi bật)
                  </Typography>

                  <Typography variant="body2" sx={{ p: 2.5, bgcolor: 'action.hover', borderRadius: 3, borderLeft: '4px solid #f59e0b', fontStyle: 'italic', fontWeight: 550, color: 'text.primary', lineHeight: 1.6, mb: 2 }}>
                    &ldquo;{activeSessionDetail.result.featuredSnippet.text}&rdquo;
                  </Typography>

                  {activeSessionDetail.result.featuredSnippet.source && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Nguồn chiếm vị trí: <strong style={{ color: '#2563eb' }}>{activeSessionDetail.result.featuredSnippet.source}</strong>
                      </Typography>
                      <Link
                        href={activeSessionDetail.result.featuredSnippet.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="none"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          color: 'primary.main',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        <OpenInNewIcon sx={{ fontSize: 13 }} />
                        Nghiên cứu copy
                      </Link>
                    </Box>
                  )}
                </Paper>
              )}

            </Box>
          )}

        </Box>
      </Box>

      {/* Competitor Details Dialog */}
      <Dialog
        open={Boolean(selectedCompetitor)}
        onClose={() => setSelectedCompetitor(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 1.5 }
        }}
      >
        {selectedCompetitor && (
          <>
            <DialogTitle sx={{ fontWeight: 800, pb: 1, wordBreak: 'break-word', pr: 5 }}>
              [Vị trí #{selectedCompetitor.position}] {selectedCompetitor.art.title || selectedCompetitor.source?.title || 'Không tìm thấy tiêu đề'}
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>ĐƯỜNG DẪN CHI TIẾT (URL)</Typography>
                <Link
                  href={selectedCompetitor.art.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="none"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 500,
                    wordBreak: 'break-all',
                    display: 'block',
                    mt: 0.5,
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {selectedCompetitor.art.url}
                </Link>
              </Box>

              {selectedCompetitor.source?.snippet && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>MÔ TẢ TRÊN GOOGLE (GOOGLE SNIPPET)</Typography>
                  <Typography variant="body2" sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 3, borderLeft: '4px solid', borderColor: 'divider', fontWeight: 500, color: 'text.primary', mt: 0.5 }}>
                    {selectedCompetitor.source.snippet}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', py: 2.5 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>ĐỘ DÀI BÀI VIẾT</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>{selectedCompetitor.art.wordCount.toLocaleString()} từ</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>MẬT ĐỘ TỪ KHÓA</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>{selectedCompetitor.art.keywordDensity.toFixed(2)}%</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>TẦN SUẤT TỪ KHÓA</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>{selectedCompetitor.art.keywordOccurrences} lần</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>THẺ H2</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>{selectedCompetitor.art.h2Count}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>THẺ H3</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>{selectedCompetitor.art.h3Count}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>THẺ H4</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>{selectedCompetitor.art.h4Count}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>HÌNH ẢNH / ALT</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>{selectedCompetitor.art.imageCount} / {selectedCompetitor.art.imageWithAltCount}</Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                onClick={() => setSelectedCompetitor(null)}
                variant="outlined"
                sx={{
                  borderRadius: '100px',
                  textTransform: 'none',
                  fontWeight: 700,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)'
                  }
                }}
              >
                Đóng
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

// Helper to format date string to human readable format
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return dateStr;
  }
}
