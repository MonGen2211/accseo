import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Chip,
  Checkbox,
  FormControlLabel,
  Menu,
  MenuItem,
  Collapse,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import LinkIcon from '@mui/icons-material/Link';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import { urlScraperService } from '../urlScraperService';
import type { ScrapeResult, UrlScrapeResponse } from '../types';
import { useToastify } from '../../../components/Toastify';

const LOCAL_STORAGE_KEY = 'scraper-history';

// Format bytes
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format duration
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

// Format date
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return dateStr;
  }
};

export default function UrlScraperSection() {
  const { showToast } = useToastify();

  // Scraper inputs
  const [urlsText, setUrlsText] = useState('');
  const [includeFullText, setIncludeFullText] = useState(true);
  const [forcePuppeteer, setForcePuppeteer] = useState(false);
  const [skipAxios, setSkipAxios] = useState(false);

  // States
  const [isScraping, setIsScraping] = useState(false);
  const [resultsData, setResultsData] = useState<UrlScrapeResponse | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [selectedUrls, setSelectedUrls] = useState<Record<string, boolean>>({});

  // History state
  const [historyList, setHistoryList] = useState<string[][]>([]);
  const [historyAnchorEl, setHistoryAnchorEl] = useState<null | HTMLElement>(null);

  // Load history from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setHistoryList(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load scraper history:', err);
    }
  }, []);

  // Save history helper
  const saveToHistory = (urls: string[]) => {
    try {
      // Remove duplicate list from history
      const freshHistory = [
        urls,
        ...historyList.filter((item) => JSON.stringify(item) !== JSON.stringify(urls)),
      ].slice(0, 10); // keep last 10 entries

      setHistoryList(freshHistory);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(freshHistory));
    } catch (err) {
      console.error('Failed to save scraper history:', err);
    }
  };

  const getCleanUrls = (): string[] => {
    return urlsText
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
  };

  const cleanUrlsList = getCleanUrls();
  const urlsCount = cleanUrlsList.length;

  const handleInsertDemo = (demoType: 'vnexpress' | 'tvpl' | 'vbpl') => {
    if (demoType === 'vnexpress') {
      setUrlsText('https://vnexpress.net/rss/phap-luat.rss');
    } else if (demoType === 'tvpl') {
      setUrlsText('https://thuvienphapluat.vn/van-ban-moi');
    } else if (demoType === 'vbpl') {
      setUrlsText('https://vbpl.vn/BoTuPhap/Pages/vbpq-toanvan.aspx?ItemID=130000');
    }
    showToast('Đã điền URL chạy thử!', 'info');
  };

  const handleRestoreHistory = (urls: string[]) => {
    setUrlsText(urls.join('\n'));
    setHistoryAnchorEl(null);
    showToast('Đã khôi phục danh sách URL từ lịch sử!', 'success');
  };

  const handleClearAll = () => {
    setUrlsText('');
    setSubmitError('');
  };

  const [submitError, setSubmitError] = useState('');

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isScraping) return;

    const urls = getCleanUrls();
    if (urls.length === 0) {
      showToast('Vui lòng nhập ít nhất 1 URL', 'warning');
      return;
    }

    // Deduplicate
    const uniqueUrls = [...new Set(urls)];
    const dupsCount = urls.length - uniqueUrls.length;
    if (dupsCount > 0) {
      showToast(`Đã bỏ qua ${dupsCount} URL trùng lặp`, 'info');
    }

    if (uniqueUrls.length > 20) {
      setSubmitError('Tối đa 20 URL trong một lần cào');
      return;
    }
    setSubmitError('');

    // Prepend https:// if missing
    let warnedMissingProtocol = false;
    const finalUrls = uniqueUrls.map((url) => {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        warnedMissingProtocol = true;
        return `https://${url}`;
      }
      return url;
    });

    if (warnedMissingProtocol) {
      showToast('Một số URL thiếu giao thức đã tự động thêm https://', 'warning');
    }

    setIsScraping(true);
    setResultsData(null);
    setExpandedCards({});
    setSelectedUrls({});
    showToast('Đang gửi yêu cầu cào dữ liệu...', 'info');

    try {
      const res = await urlScraperService.scrapeUrls({
        urls: finalUrls,
        includeFullText,
        forcePuppeteer,
        skipAxios,
      });

      setResultsData(res);
      saveToHistory(finalUrls);
      showToast(`Cào hoàn tất! Thành công: ${res.okCount}, Thất bại: ${res.failCount}`, 'success');
    } catch (err: any) {
      console.error('URL Scraper submit error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Không kết nối được server';
      showToast(errMsg, 'danger');
      setSubmitError(errMsg);
    } finally {
      setIsScraping(false);
    }
  };

  // Bulk Actions
  const handleToggleSelectAll = () => {
    if (!resultsData) return;
    const allSelected = resultsData.results.every((r) => selectedUrls[r.url]);
    const nextSelected: Record<string, boolean> = {};
    if (!allSelected) {
      resultsData.results.forEach((r) => {
        nextSelected[r.url] = true;
      });
    }
    setSelectedUrls(nextSelected);
  };

  const handleBulkExportJson = () => {
    if (!resultsData) return;
    const selectedResults = resultsData.results.filter((r) => selectedUrls[r.url]);
    if (selectedResults.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 dòng để xuất JSON', 'warning');
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(selectedResults, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `scraper_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Đã xuất JSON cho ${selectedResults.length} kết quả!`, 'success');
  };

  const handleBulkCopyUrls = () => {
    if (!resultsData) return;
    const selectedResults = resultsData.results.filter((r) => selectedUrls[r.url]);
    if (selectedResults.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 dòng để sao chép', 'warning');
      return;
    }

    const urls = selectedResults.map((r) => r.url).join('\n');
    navigator.clipboard.writeText(urls);
    showToast(`Đã sao chép ${selectedResults.length} URL vào bộ nhớ tạm!`, 'success');
  };

  // Re-run single URL with Puppeteer
  const handleSingleRetry = async (url: string) => {
    if (!resultsData) return;

    showToast(`Đang chạy lại URL với Puppeteer...`, 'info');
    try {
      const res = await urlScraperService.scrapeUrls({
        urls: [url],
        includeFullText,
        forcePuppeteer: true,
      });

      if (res.results && res.results.length > 0) {
        const singleResult = res.results[0];
        setResultsData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            okCount: prev.okCount + (singleResult.ok ? 1 : 0) - (prev.results.find(r => r.url === url)?.ok ? 1 : 0),
            failCount: prev.failCount + (!singleResult.ok ? 1 : 0) - (!prev.results.find(r => r.url === url)?.ok ? 1 : 0),
            results: prev.results.map((r) => (r.url === url ? singleResult : r)),
          };
        });
        showToast(singleResult.ok ? 'Cào lại bằng Puppeteer thành công!' : 'Vẫn thất bại khi dùng Puppeteer', singleResult.ok ? 'success' : 'danger');
      }
    } catch (err: any) {
      console.error('Retry single URL error:', err);
      showToast(err?.message || 'Lỗi khi chạy lại URL', 'danger');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <LinkIcon sx={{ color: 'primary.main' }} />
            Công cụ Cào URL Đa năng (URL Scraper)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Tự động trích xuất Metadata, JSON-LD, thẻ headings và toàn bộ nội dung Full Text từ bất kỳ đường dẫn nào.
          </Typography>
        </Box>
      </Box>

      {/* Main Form Box */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: 'text.primary' }}>
            Nhập danh sách URL cần cào
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => setHistoryAnchorEl(e.currentTarget)}
              startIcon={<HistoryIcon />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Lịch sử ({historyList.length})
            </Button>
            <Menu
              anchorEl={historyAnchorEl}
              open={Boolean(historyAnchorEl)}
              onClose={() => setHistoryAnchorEl(null)}
            >
              {historyList.length === 0 ? (
                <MenuItem disabled>Chưa có lịch sử</MenuItem>
              ) : (
                historyList.map((urls, idx) => (
                  <MenuItem key={idx} onClick={() => handleRestoreHistory(urls)}>
                    Lần {idx + 1} ({urls.length} URLs)
                  </MenuItem>
                ))
              )}
            </Menu>
          </Box>
        </Box>

        <Box component="form" onSubmit={handleScrape} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Danh sách URL (mỗi dòng 1 URL, tối đa 20 URL)"
            placeholder="https://vnexpress.net/rss/phap-luat.rss&#10;https://thuvienphapluat.vn/van-ban-moi"
            multiline
            rows={5}
            fullWidth
            value={urlsText}
            onChange={(e) => {
              setUrlsText(e.target.value);
              if (submitError) setSubmitError('');
            }}
            error={!!submitError || urlsCount > 20}
            helperText={submitError || (urlsCount > 20 ? 'Vượt quá giới hạn tối đa 20 URL' : `Đã nhập: ${urlsCount}/20 URL`)}
            disabled={isScraping}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                fontFamily: 'monospace',
              },
            }}
          />

          {/* Quick test buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              CHẠY THỬ NHANH:
            </Typography>
            <Button size="small" variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', py: 0.25 }} onClick={() => handleInsertDemo('vnexpress')}>
              VNExpress Feed (RSS)
            </Button>
            <Button size="small" variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', py: 0.25 }} onClick={() => handleInsertDemo('tvpl')}>
              Thư viện Pháp luật (HTML)
            </Button>
            <Button size="small" variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', py: 0.25 }} onClick={() => handleInsertDemo('vbpl')}>
              VBPL chi tiết (API)
            </Button>
          </Box>

          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={<Checkbox checked={includeFullText} onChange={(e) => setIncludeFullText(e.target.checked)} disabled={isScraping} />}
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Lấy toàn bộ nội dung Full Text</Typography>
                  <Typography variant="caption" color="text.secondary">Lấy đầy đủ nội dung bài viết chính (dữ liệu có thể &gt; 60K kí tự)</Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={<Checkbox checked={forcePuppeteer} onChange={(e) => setForcePuppeteer(e.target.checked)} disabled={isScraping} />}
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Ép sử dụng Puppeteer</Typography>
                  <Typography variant="caption" color="text.secondary">Vượt qua các tường lửa Cloudflare nặng (~10-15s một URL)</Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={<Checkbox checked={skipAxios} onChange={(e) => setSkipAxios(e.target.checked)} disabled={isScraping} />}
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Bỏ qua Axios</Typography>
                  <Typography variant="caption" color="text.secondary">Sử dụng trực tiếp Puppeteer ngay từ đầu để tránh lỗi IP</Typography>
                </Box>
              }
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isScraping || urlsCount === 0 || urlsCount > 20}
              startIcon={isScraping ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              sx={{
                py: 1.5,
                borderRadius: 3,
                fontWeight: 700,
                textTransform: 'none',
                px: 5,
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.25)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #9333ea 0%, #6d28d9 100%)',
                },
              }}
            >
              {isScraping ? 'Đang cào dữ liệu... (Có thể mất 15-45 giây)' : 'Bắt đầu cào ngay'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleClearAll}
              disabled={isScraping}
              sx={{
                borderRadius: 3,
                fontWeight: 700,
                textTransform: 'none',
                px: 3,
                borderColor: 'divider',
                color: 'text.secondary',
              }}
            >
              Xoá toàn bộ
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Skeletons on loading */}
      {isScraping && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[...Array(Math.max(1, urlsCount))].map((_, i) => (
            <Paper key={i} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Skeleton variant="text" width="40%" height={24} />
              <Skeleton variant="text" width="60%" height={18} sx={{ mt: 1 }} />
              <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2, mt: 2 }} />
            </Paper>
          ))}
        </Box>
      )}

      {/* Stats bar + Bulk Actions */}
      {resultsData && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Stats Bar */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', gap: 3.5, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#10b981' }}>
                ✓ {resultsData.okCount} thành công
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#ef4444' }}>
                ✗ {resultsData.failCount} thất bại
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                ⏱ {formatDuration(resultsData.results.reduce((acc, curr) => acc + curr.durationMs, 0))} tổng thời gian
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                PHƯƠNG THỨC SỬ DỤNG:
              </Typography>
              {['axios-lite', 'axios-stealth', 'puppeteer', 'rss', 'vbpl-api'].map((m) => {
                const count = resultsData.results.filter((r) => r.method === m).length;
                if (count === 0) return null;
                return (
                  <Chip
                    key={m}
                    label={`${m} x${count}`}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      bgcolor:
                        m === 'axios-lite'
                          ? '#dcfce7'
                          : m === 'axios-stealth'
                          ? '#dbeafe'
                          : m === 'puppeteer'
                          ? '#f3e8ff'
                          : m === 'rss'
                          ? '#ffedd5'
                          : '#e0e7ff',
                      color:
                        m === 'axios-lite'
                          ? '#15803d'
                          : m === 'axios-stealth'
                          ? '#1e40af'
                          : m === 'puppeteer'
                          ? '#6b21a8'
                          : m === 'rss'
                          ? '#c2410c'
                          : '#3730a3',
                    }}
                  />
                );
              })}
            </Box>
          </Paper>

          {/* Bulk Actions Panel */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleToggleSelectAll}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              {resultsData.results.every((r) => selectedUrls[r.url]) ? 'Bỏ chọn toàn bộ' : 'Chọn toàn bộ'}
            </Button>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CloudDownloadIcon />}
                onClick={handleBulkExportJson}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                Xuất file JSON
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleBulkCopyUrls}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                Sao chép URL đã chọn
              </Button>
            </Box>
          </Box>

          {/* Results List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {resultsData.results.map((result) => (
              <ResultCard
                key={result.url}
                result={result}
                isExpanded={!!expandedCards[result.url]}
                isSelected={!!selectedUrls[result.url]}
                onToggleExpand={() =>
                  setExpandedCards((prev) => ({ ...prev, [result.url]: !prev[result.url] }))
                }
                onToggleSelect={() =>
                  setSelectedUrls((prev) => ({ ...prev, [result.url]: !prev[result.url] }))
                }
                onRetry={handleSingleRetry}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Empty Illustration State */}
      {!resultsData && !isScraping && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 10,
            textAlign: 'center',
            color: 'text.disabled',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 4,
            bgcolor: 'background.paper',
          }}
        >
          <LinkIcon sx={{ fontSize: 64, opacity: 0.25, mb: 2 }} />
          <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Chưa có dữ liệu URL được cào
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 450 }}>
            Hãy dán danh sách URL (mỗi dòng 1 URL) vào khung nhập văn bản ở bên trên, bấm cào dữ liệu để trích xuất metadata và văn bản bài viết ngay.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// -----------------------------------------------------------------------------
// CHILD COMPONENT: ResultCard
// -----------------------------------------------------------------------------
interface ResultCardProps {
  result: ScrapeResult;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onRetry: (url: string) => void;
}

function ResultCard({ result, isExpanded, isSelected, onToggleExpand, onToggleSelect, onRetry }: ResultCardProps) {
  const [activeSubTab, setActiveSubTab] = useState(0);
  const { showToast } = useToastify();

  const getMethodBadgeColor = (method: ScrapeResult['method']) => {
    switch (method) {
      case 'axios-lite':
        return { bg: '#dcfce7', color: '#15803d' };
      case 'axios-stealth':
        return { bg: '#dbeafe', color: '#1e40af' };
      case 'puppeteer':
        return { bg: '#f3e8ff', color: '#6b21a8' };
      case 'rss':
        return { bg: '#ffedd5', color: '#c2410c' };
      case 'vbpl-api':
        return { bg: '#e0e7ff', color: '#3730a3' };
      default:
        return { bg: '#fee2e2', color: '#b91c1c' };
    }
  };

  const badgeStyles = getMethodBadgeColor(result.method);
  const data = result.data;

  // Headings counter text
  const getHeadingsCounter = () => {
    if (!data?.headings) return '';
    const h1 = data.headings.h1?.length ?? 0;
    const h2 = data.headings.h2?.length ?? 0;
    const h3 = data.headings.h3?.length ?? 0;
    return `h1×${h1} · h2×${h2} · h3×${h3}`;
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownloadTxt = (filename: string, text: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    element.remove();
  };

  // State inside Structured Data tab (JSON-LD nodes)
  const [expandedJsonNode, setExpandedJsonNode] = useState<Record<number, boolean>>({});

  // RSS items search inside RSS tab
  const [rssSearch, setRssSearch] = useState('');
  const filteredRssItems = (data?.rssItems ?? []).filter((item) =>
    item.title.toLowerCase().includes(rssSearch.toLowerCase()) ||
    (item.description ?? '').toLowerCase().includes(rssSearch.toLowerCase())
  );

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: result.ok ? 'divider' : '#fca5a5',
        bgcolor: result.ok ? 'background.paper' : '#fff5f5',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.01)',
      }}
    >
      {/* CARD HEADER */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, gap: 2, flexWrap: 'wrap', cursor: 'pointer' }} onClick={onToggleExpand}>
        <Checkbox
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          onClick={(e) => e.stopPropagation()}
        />

        {result.ok ? (
          <CheckCircleIcon sx={{ color: '#10b981', fontSize: 22 }} />
        ) : (
          <CancelIcon sx={{ color: '#ef4444', fontSize: 22 }} />
        )}

        {result.ok && data?.thumbnailUrl && (
          <Box
            component="img"
            src={data.thumbnailUrl}
            alt="thumb"
            sx={{ width: 44, height: 44, borderRadius: 2, objectFit: 'cover', flexShrink: 0, border: '1px solid', borderColor: 'divider' }}
          />
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }} noWrap>
            {result.ok ? data?.title || 'Không tìm thấy tiêu đề' : `Lỗi cào URL`}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'primary.main',
              fontWeight: 500,
              textDecoration: 'underline',
              cursor: 'pointer',
              display: 'inline-block',
              wordBreak: 'break-all',
              mr: 1,
            }}
            onClick={(e) => {
              e.stopPropagation();
              window.open(result.url, '_blank');
            }}
          >
            {result.url}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip
            label={result.method}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              bgcolor: badgeStyles.bg,
              color: badgeStyles.color,
              border: `1px solid ${badgeStyles.color}30`,
            }}
          />
          {result.ok && (
            <>
              <Chip label={formatDuration(result.durationMs)} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.72rem', height: 20 }} />
              <Chip label={formatBytes(result.contentLength)} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.72rem', height: 20 }} />
            </>
          )}
        </Box>

        <IconButton size="small">
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* CARD BODY */}
      <Collapse in={isExpanded} unmountOnExit>
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 3, bgcolor: 'background.default' }}>
          {result.ok && data ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              {/* Internal Tabs control */}
              <Tabs
                value={activeSubTab}
                onChange={(_, v) => setActiveSubTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  minHeight: 38,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    py: 1,
                    minHeight: 38,
                  },
                }}
              >
                <Tab label="Tổng quan" />
                <Tab label={`Văn bản bài viết (${data.fullText ? data.fullText.length : 0})`} />
                <Tab label={`Thẻ Headings (${getHeadingsCounter()})`} />
                <Tab label="Structured Data (SEO)" />
                <Tab label="Liên kết & RSS" />
              </Tabs>

              {/* Subtab 1: Overview */}
              {activeSubTab === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {data.excerpt && (
                    <Box sx={{ p: 2, borderLeft: '4px solid', borderColor: 'primary.main', bgcolor: 'action.hover', fontStyle: 'italic', borderRadius: '0 8px 8px 0' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                        &ldquo;{data.excerpt}&rdquo;
                      </Typography>
                    </Box>
                  )}

                  {data.description && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        META DESCRIPTION
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                        {data.description}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>TÊN WEBSITE</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }}>{data.siteName || '-'}</Typography>
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>TÁC GIẢ</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }}>{data.author || '-'}</Typography>
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>NGÔN NGỮ</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25, textTransform: 'uppercase' }}>{data.language || '-'}</Typography>
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>ẢNH ĐẠI DIỆN</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }} noWrap>
                        {data.thumbnailUrl ? (
                          <Typography
                            component="a"
                            href={data.thumbnailUrl}
                            target="_blank"
                            variant="body2"
                            sx={{ color: 'primary.main', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 0.5 }}
                          >
                            Mở ảnh đại diện <OpenInNewIcon sx={{ fontSize: 12 }} />
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2.5 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>NGÀY PHÁT HÀNH (PUBLISHED)</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }}>{formatDate(data.publishedAt)}</Typography>
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>NGÀY CẬP NHẬT (MODIFIED)</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }}>{formatDate(data.modifiedAt)}</Typography>
                    </Box>
                  </Box>

                  {data.canonical && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                        CANONICAL URL
                      </Typography>
                      <Typography
                        variant="body2"
                        component="a"
                        href={data.canonical}
                        target="_blank"
                        sx={{ color: 'primary.main', textDecoration: 'underline', fontWeight: 600, wordBreak: 'break-all' }}
                      >
                        {data.canonical}
                      </Typography>
                    </Box>
                  )}

                  {result.finalUrl && result.finalUrl !== result.url && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="Redirected" color="warning" size="small" sx={{ fontWeight: 700 }} />
                      <Typography variant="caption" color="text.secondary">
                        URL đích thực tế: <strong style={{ color: '#2563eb', wordBreak: 'break-all' }}>{result.finalUrl}</strong>
                      </Typography>
                    </Box>
                  )}

                  {data.breadcrumb && data.breadcrumb.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        BREADCRUMB PATH
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.8 }}>
                        {data.breadcrumb.map((crumb, idx) => (
                          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{crumb}</Typography>
                            {idx < data.breadcrumb.length - 1 && (
                              <Typography variant="body2" color="text.disabled">›</Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {((data.tags && data.tags.length > 0) || (data.metaKeywords && data.metaKeywords.length > 0)) && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {data.tags && data.tags.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                            TAGS
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                            {data.tags.map((tag) => (
                              <Chip key={tag} label={tag} size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, border: '1px solid #c8e6c9' }} />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {data.metaKeywords && data.metaKeywords.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                            META KEYWORDS
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                            {data.metaKeywords.map((kw) => (
                              <Chip key={kw} label={kw} size="small" sx={{ bgcolor: '#f5f5f5', color: '#616161', fontWeight: 600, border: '1px solid #e0e0e0' }} />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              )}

              {/* Subtab 2: Full Text */}
              {activeSubTab === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {!data.fullText ? (
                    <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ borderRadius: 3 }}>
                      Chưa fetch full text — Hãy chắc chắn bật tuỳ chọn <strong>"Lấy toàn bộ nội dung Full Text"</strong> khi cào.
                    </Alert>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, position: 'relative' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          TỔNG SỐ KÝ TỰ: {data.fullText.length.toLocaleString()} ký tự
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ContentCopyIcon />}
                            onClick={() => {
                              handleCopyText(data.fullText!);
                              showToast('Đã sao chép nội dung văn bản!', 'success');
                            }}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                          >
                            Sao chép
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CloudDownloadIcon />}
                            onClick={() => handleDownloadTxt(`scrape_text_${Date.now()}.txt`, data.fullText!)}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                          >
                            Tải file .txt
                          </Button>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          p: 2,
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fafafa',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 3,
                          maxHeight: 450,
                          overflowY: 'auto',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            color: 'text.primary',
                            lineHeight: 1.6,
                          }}
                        >
                          {data.fullText}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {/* Subtab 3: Headings */}
              {activeSubTab === 2 && (
                <Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                    {/* H1 Column */}
                    <Box sx={{ minWidth: 0 }}>
                      <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fafafa', borderRadius: 3, height: '100%' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: 'primary.main', borderBottom: '2px solid', borderColor: 'divider', pb: 1, mb: 1.5 }}>
                          THẺ H1 ({data.headings?.h1?.length ?? 0})
                        </Typography>
                        {(!data.headings?.h1 || data.headings.h1.length === 0) ? (
                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>Không có thẻ H1</Typography>
                        ) : (
                          <List dense disablePadding>
                            {data.headings.h1.map((val, idx) => (
                              <ListItem key={idx} disableGutters sx={{ py: 0.5, alignItems: 'flex-start' }}>
                                <ListItemIcon sx={{ minWidth: 20, mt: 0.25 }}><Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>•</Typography></ListItemIcon>
                                <ListItemText primary={<Typography variant="body2" sx={{ fontWeight: 700 }}>{val}</Typography>} />
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </Paper>
                    </Box>

                    {/* H2 Column */}
                    <Box sx={{ minWidth: 0 }}>
                      <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fafafa', borderRadius: 3, height: '100%' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: 'secondary.main', borderBottom: '2px solid', borderColor: 'divider', pb: 1, mb: 1.5 }}>
                          THẺ H2 ({data.headings?.h2?.length ?? 0})
                        </Typography>
                        {(!data.headings?.h2 || data.headings.h2.length === 0) ? (
                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>Không có thẻ H2</Typography>
                        ) : (
                          <List dense disablePadding>
                            {data.headings.h2.map((val, idx) => (
                              <ListItem key={idx} disableGutters sx={{ py: 0.5, alignItems: 'flex-start' }}>
                                <ListItemIcon sx={{ minWidth: 20, mt: 0.25 }}><Typography variant="body2" color="secondary" sx={{ fontWeight: 700 }}>•</Typography></ListItemIcon>
                                <ListItemText primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{val}</Typography>} />
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </Paper>
                    </Box>

                    {/* H3 Column */}
                    <Box sx={{ minWidth: 0 }}>
                      <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fafafa', borderRadius: 3, height: '100%' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#16a34a', borderBottom: '2px solid', borderColor: 'divider', pb: 1, mb: 1.5 }}>
                          THẺ H3 ({data.headings?.h3?.length ?? 0})
                        </Typography>
                        {(!data.headings?.h3 || data.headings.h3.length === 0) ? (
                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>Không có thẻ H3</Typography>
                        ) : (
                          <List dense disablePadding>
                            {data.headings.h3.map((val, idx) => (
                              <ListItem key={idx} disableGutters sx={{ py: 0.5, alignItems: 'flex-start' }}>
                                <ListItemIcon sx={{ minWidth: 20, mt: 0.25 }}><Typography variant="body2" color="success" sx={{ fontWeight: 700 }}>•</Typography></ListItemIcon>
                                <ListItemText primary={<Typography variant="body2" sx={{ color: 'text.secondary' }}>{val}</Typography>} />
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </Paper>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Subtab 4: Structured Data */}
              {activeSubTab === 3 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                  {/* Open Graph */}
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', mb: 1.5, color: 'text.primary' }}>
                      ▼ Open Graph Meta Tags
                    </Typography>
                    {(!data.openGraph || Object.keys(data.openGraph).length === 0) ? (
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled', pl: 1 }}>Không phát hiện cấu trúc Open Graph</Typography>
                    ) : (
                      <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Property / Tag</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Content Value</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(data.openGraph).map(([key, val]) => (
                              <TableRow key={key} hover>
                                <TableCell sx={{ fontWeight: 600, py: 0.75, width: '25%' }}>{key}</TableCell>
                                <TableCell sx={{ py: 0.75, color: 'text.secondary', wordBreak: 'break-all' }}>{val}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>

                  {/* Twitter Card */}
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', mb: 1.5, color: 'text.primary' }}>
                      ▼ Twitter Card Meta Tags
                    </Typography>
                    {(!data.twitterCard || Object.keys(data.twitterCard).length === 0) ? (
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled', pl: 1 }}>Không phát hiện cấu trúc Twitter Card</Typography>
                    ) : (
                      <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Property / Name</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Content Value</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(data.twitterCard).map(([key, val]) => (
                              <TableRow key={key} hover>
                                <TableCell sx={{ fontWeight: 600, py: 0.75, width: '25%' }}>{key}</TableCell>
                                <TableCell sx={{ py: 0.75, color: 'text.secondary', wordBreak: 'break-all' }}>{val}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>

                  {/* JSON-LD collapsible logs */}
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', mb: 1.5, color: 'text.primary' }}>
                      ▼ Cấu trúc Schema JSON-LD ({data.jsonLd?.length ?? 0} node)
                    </Typography>
                    {(!data.jsonLd || data.jsonLd.length === 0) ? (
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled', pl: 1 }}>Không tìm thấy mã cấu trúc JSON-LD</Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {data.jsonLd.map((node, idx) => {
                          const nodeType = node['@type'] || node['@context'] || 'Schema node';
                          const isNodeOpen = !!expandedJsonNode[idx];
                          const formattedJson = JSON.stringify(node, null, 2);

                          return (
                            <Box
                              key={idx}
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2.5,
                                overflow: 'hidden',
                              }}
                            >
                              <Box
                                onClick={() => setExpandedJsonNode(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                sx={{
                                  p: 1.5,
                                  bgcolor: 'action.hover',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                }}
                              >
                                <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', fontFamily: 'monospace', color: 'primary.main' }}>
                                  {`[Node ${idx + 1}]`} {nodeType}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Sao chép JSON" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyText(formattedJson);
                                        showToast('Đã sao chép chuỗi Schema JSON-LD!', 'success');
                                      }}
                                    >
                                      <ContentCopyIcon sx={{ fontSize: 13 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <IconButton size="small">
                                    {isNodeOpen ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                                  </IconButton>
                                </Box>
                              </Box>
                              <Collapse in={isNodeOpen} unmountOnExit>
                                <Box sx={{ p: 2, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
                                  <Box
                                    component="pre"
                                    sx={{
                                      p: 1.5,
                                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fafafa',
                                      borderRadius: 2,
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      overflowX: 'auto',
                                      fontSize: '0.8rem',
                                      fontFamily: 'monospace',
                                      color: '#2e7d32',
                                      maxHeight: 250,
                                    }}
                                  >
                                    {formattedJson}
                                  </Box>
                                </Box>
                              </Collapse>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {/* Subtab 5: Links & RSS Items */}
              {activeSubTab === 4 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                  {/* Related Links list */}
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', mb: 1.5, color: 'text.primary' }}>
                      ▼ Các liên kết liên quan (Related URLs)
                    </Typography>
                    {(!data.relatedUrls || data.relatedUrls.length === 0) ? (
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled', pl: 1 }}>Không phát hiện liên kết liên quan</Typography>
                    ) : (
                      <List dense disablePadding sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fafafa', maxH: 220, overflowY: 'auto' }}>
                        {data.relatedUrls.map((linkUrl, idx) => (
                          <ListItem
                            key={idx}
                            divider={idx < data.relatedUrls.length - 1}
                            sx={{
                              py: 1,
                              display: 'flex',
                              justifyContent: 'space-between',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'text.primary',
                                fontWeight: 500,
                                wordBreak: 'break-all',
                                pr: 2,
                              }}
                            >
                              {linkUrl}
                            </Typography>
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
                              component="a"
                              href={linkUrl}
                              target="_blank"
                              sx={{ textTransform: 'none', flexShrink: 0, fontWeight: 700 }}
                            >
                              Tru cập
                            </Button>
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>

                  {/* RSS Items feed table */}
                  {result.method === 'rss' && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1.5 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'text.primary' }}>
                          ▼ Bài viết trong RSS Feed ({filteredRssItems.length} dòng)
                        </Typography>
                        <TextField
                          placeholder="Lọc tin theo tựa đề hoặc mô tả..."
                          size="small"
                          value={rssSearch}
                          onChange={(e) => setRssSearch(e.target.value)}
                          slotProps={{
                            input: {
                              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
                            }
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, minWidth: 260 }}
                        />
                      </Box>

                      {filteredRssItems.length === 0 ? (
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled', pl: 1 }}>Không có bài viết khớp tìm kiếm</Typography>
                      ) : (
                        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, maxHeight: 300 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                 <TableCell sx={{ fontWeight: 700, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : '#fafafa', py: 1 }}>Ngày đăng</TableCell>
                                 <TableCell sx={{ fontWeight: 700, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : '#fafafa', py: 1 }}>Tiêu đề / Link</TableCell>
                                 <TableCell sx={{ fontWeight: 700, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : '#fafafa', py: 1 }}>Danh mục</TableCell>
                                 <TableCell sx={{ fontWeight: 700, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : '#fafafa', py: 1 }}>Tóm tắt (Description)</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filteredRssItems.map((item, idx) => (
                                <TableRow key={idx} hover>
                                  <TableCell sx={{ py: 0.8, color: 'text.secondary', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                    {formatDate(item.pubDate)}
                                  </TableCell>
                                  <TableCell sx={{ py: 0.8, fontWeight: 700 }}>
                                    <Typography
                                      component="a"
                                      href={item.link}
                                      target="_blank"
                                      variant="body2"
                                      sx={{ color: 'primary.main', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 0.5 }}
                                    >
                                      {item.title} <OpenInNewIcon sx={{ fontSize: 12 }} />
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ py: 0.8 }}>
                                    {item.category && item.category.length > 0 ? (
                                      <Chip label={item.category[0]} size="small" sx={{ fontSize: '0.72rem', height: 18 }} />
                                    ) : (
                                      '-'
                                    )}
                                  </TableCell>
                                  <TableCell sx={{ py: 0.8, color: 'text.secondary', fontSize: '0.8rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.description || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          ) : (
            /* FAILED STATUS */
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Alert
                severity="error"
                icon={<CancelIcon sx={{ color: '#ef4444' }} />}
                sx={{
                  borderRadius: 3,
                  bgcolor: '#fef2f2',
                  color: '#b91c1c',
                  border: '1px solid #fee2e2',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Không cào được dữ liệu đường dẫn này!
                </Typography>
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block', opacity: 0.9 }}>
                  Chi tiết lỗi: {result.error || 'Lỗi mạng không phản hồi (Connection timeout / Blocked).'}
                </Typography>
              </Alert>

              <Box>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => onRetry(result.url)}
                  startIcon={<RefreshIcon />}
                  sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none', borderWidth: '1.5px', '&:hover': { borderWidth: '1.5px' } }}
                >
                  Thử lại ngay với Puppeteer (Stealth Mode)
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
