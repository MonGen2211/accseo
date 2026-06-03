import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import TablePagination from '@mui/material/TablePagination';
import Link from '@mui/material/Link';

// Icons
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DoneIcon from '@mui/icons-material/Done';

// Service & Types
import { forceIndexOwnerService } from '../forceIndexOwnerService';
import { serpService } from '../../dashboard/serpService';
import { useToastify } from '../../../components/Toastify';
import type { DirectHistoryItem } from '../types';

export default function ForceIndexOwnerSection() {
  const { showToast } = useToastify();

  // State for domain dropdown
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [domainsLoading, setDomainsLoading] = useState<boolean>(true);

  // State for submitting URLs
  const [urlsInput, setUrlsInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<{
    accepted: number;
    rejected: { url: string; reason: string }[];
    queueSize: number;
    note: string;
  } | null>(null);

  // State for History List
  const [historyData, setHistoryData] = useState<DirectHistoryItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [limit, setLimit] = useState<number>(50);
  const [page, setPage] = useState<number>(0);

  // State for Check Indexing (real-time verification)
  const [checkingIndexUrls, setCheckingIndexUrls] = useState<Record<string, boolean>>({}); // tracking row _id loading status
  const [indexedResults, setIndexedResults] = useState<Record<string, boolean | null>>({}); // row _id -> boolean | null

  // Helpers to parse domain helper from URL
  const getCleanHostname = (urlStr: string): string => {
    try {
      const url = new URL(urlStr);
      return url.hostname.replace(/^www\./i, '');
    } catch {
      return '';
    }
  };

  // Fetch owned domains
  const fetchDomains = async () => {
    setDomainsLoading(true);
    try {
      const doms = await forceIndexOwnerService.getOwnedDomains();
      setDomains(doms);
      if (doms.length > 0) {
        setSelectedDomain(doms[0]);
      }
    } catch (err: unknown) {
      showToast((err as any).response?.data?.message || (err as Error).message || 'Lỗi lấy danh sách domain sở hữu', 'danger');
    } finally {
      setDomainsLoading(false);
    }
  };

  // Fetch History List
  const fetchHistory = async (showSilently = false) => {
    if (!showSilently) setHistoryLoading(true);
    try {
      // In the real system, pagination is handled by skip/limit.
      // Endpoint 3: `/force-index/direct/list?limit=50`
      // We will fetch up to our current limit.
      const res = await forceIndexOwnerService.getDirectHistory(limit);
      setHistoryData(res.items || []);
      setTotalItems(res.total || 0);
    } catch (err: unknown) {
      showToast((err as any).response?.data?.message || (err as Error).message || 'Lỗi tải lịch sử Ép Index Direct', 'danger');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDomains();
      fetchHistory();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling history every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchHistory(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [limit]);

  // Client side validation parsing
  const parsedUrls = useMemo(() => {
    const rawLines = urlsInput.split('\n');
    const urls: string[] = [];
    const invalidFormat: string[] = [];
    const domainMismatch: string[] = [];
    const seen = new Set<string>();

    rawLines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        invalidFormat.push(trimmed);
        return;
      }

      // Check domain match
      const urlHost = getCleanHostname(trimmed);
      const cleanTarget = selectedDomain.replace(/^www\./i, '');
      if (urlHost !== cleanTarget) {
        domainMismatch.push(trimmed);
        return;
      }

      if (!seen.has(trimmed)) {
        seen.add(trimmed);
        urls.push(trimmed);
      }
    });

    return {
      validUrls: urls,
      invalidFormat,
      domainMismatch,
      totalCount: rawLines.filter(l => l.trim()).length
    };
  }, [urlsInput, selectedDomain]);

  // Handler for form submit
  const handleSubmitDirect = async () => {
    if (!selectedDomain) {
      showToast('Vui lòng chọn một domain sở hữu trước khi gửi', 'warning');
      return;
    }

    const { validUrls } = parsedUrls;
    if (validUrls.length === 0) {
      showToast('Không có URL nào hợp lệ để gửi ép index', 'warning');
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await forceIndexOwnerService.submitDirect(selectedDomain, validUrls);
      setSubmitResult(res);
      showToast(`Đã gửi thành công ${res.accepted} URL vào hàng đợi`, 'success');
      setUrlsInput(''); // clear text area
      fetchHistory(true); // refresh history list
    } catch (err: unknown) {
      showToast((err as any).response?.data?.message || (err as Error).message || 'Lỗi gửi yêu cầu ép index', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to trigger checking index status via SERP check-index api
  const handleCheckIndex = async (rowId: string, url: string) => {
    setCheckingIndexUrls(prev => ({ ...prev, [rowId]: true }));
    try {
      const res = await serpService.checkIndex({
        urls: [url],
        engine: 'apify' // default apify as requested
      });

      const matchedResult = res.data?.results?.[0];
      if (matchedResult) {
        const indexedVal = matchedResult.indexed; // true | false | null
        setIndexedResults(prev => ({ ...prev, [rowId]: indexedVal }));
        if (indexedVal === true) {
          showToast(`URL đã lập chỉ mục (index thành công)`, 'success');
        } else if (indexedVal === false) {
          showToast(`URL chưa được lập chỉ mục`, 'warning');
        } else {
          showToast(`Không xác định được trạng thái index`, 'info');
        }
      } else {
        showToast('Không lấy được kết quả kiểm tra index từ Apify', 'warning');
      }
    } catch (err: unknown) {
      showToast((err as any).response?.data?.message || (err as Error).message || 'Kiểm tra index thất bại', 'danger');
    } finally {
      setCheckingIndexUrls(prev => ({ ...prev, [rowId]: false }));
    }
  };

  // Format status badge
  const getStatusBadge = (status: string, apiResponse?: string) => {
    switch (status) {
      case 'submitted':
        return (
          <Tooltip title={apiResponse || 'Đã gửi qua Google Indexing API'} arrow>
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: 13, color: '#fff !important' }} />}
              label="Success"
              size="small"
              sx={{ bgcolor: '#10b981', color: '#fff', fontWeight: 700, borderRadius: 2 }}
            />
          </Tooltip>
        );
      case 'failed':
        return (
          <Tooltip title={apiResponse || 'Gọi Indexing API lỗi'} arrow>
            <Chip
              icon={<ErrorOutlinedIcon sx={{ fontSize: 13, color: '#fff !important' }} />}
              label="Failed"
              size="small"
              sx={{ bgcolor: '#ef4444', color: '#fff', fontWeight: 700, borderRadius: 2 }}
            />
          </Tooltip>
        );
      case 'pending':
      default:
        return (
          <Chip
            label="Pending"
            size="small"
            sx={{ bgcolor: 'action.selected', color: 'text.secondary', fontWeight: 700, borderRadius: 2 }}
          />
        );
    }
  };

  // Format real-time indexed status badge
  const getIndexedBadge = (rowId: string, url: string) => {
    const status = indexedResults[rowId];
    const isLoading = checkingIndexUrls[rowId];

    if (isLoading) {
      return <CircularProgress size={16} sx={{ color: '#00b894' }} />;
    }

    if (status === undefined) {
      return (
        <Button
          size="small"
          variant="outlined"
          onClick={() => handleCheckIndex(rowId, url)}
          sx={{ textTransform: 'none', py: 0.2, px: 1, fontSize: '0.75rem', borderRadius: 1.5, borderColor: 'divider' }}
        >
          Check index
        </Button>
      );
    }

    if (status === true) {
      return <Chip label="Indexed" size="small" color="success" sx={{ fontWeight: 700, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }} />;
    }

    if (status === false) {
      return <Chip label="Not Indexed" size="small" color="warning" sx={{ fontWeight: 700, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }} />;
    }

    // null value
    return <Chip label="Unknown" size="small" sx={{ fontWeight: 700, borderRadius: 2, bgcolor: 'action.hover', color: 'text.disabled' }} />;
  };

  // Format time Vietnamese
  const formatTime = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    } catch {
      return '—';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Khối Submit (trên) */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUploadIcon sx={{ color: '#00b894' }} /> Gửi Yêu Cầu Ép Index (Direct Google API)
        </Typography>

        {domainsLoading ? (
          <Box sx={{ py: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">Đang tải danh sách domain sở hữu...</Typography>
          </Box>
        ) : domains.length === 0 ? (
          <Alert severity="warning" variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
            Chưa cấu hình domain sở hữu, vui lòng liên hệ admin.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'flex-start' }}>
              <FormControl fullWidth sx={{ maxWidth: { md: 320 } }}>
                <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.75, color: 'text.secondary' }}>
                  Domain Sở Hữu *
                </Typography>
                <Select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  size="small"
                  sx={{ borderRadius: 2 }}
                >
                  {domains.map((dom) => (
                    <MenuItem key={dom} value={dom}>
                      {dom}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Lựa chọn tên miền thuộc quyền sở hữu Google Search Console của bạn</FormHelperText>
              </FormControl>

              <Box sx={{ flex: 1, width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    Danh Sách URL cần check/ép index (Mỗi URL một dòng, tối đa 50 link) *
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: parsedUrls.validUrls.length > 50 ? 'error.main' : 'text.secondary' }}>
                    ({parsedUrls.validUrls.length} / 50 URL hợp lệ)
                  </Typography>
                </Box>
                <TextField
                  multiline
                  rows={6}
                  placeholder={`Dán danh sách URL cùng domain ở đây, ví dụ:\nhttps://${selectedDomain || 'yourdomain.com'}/tin-tuc-1\nhttps://${selectedDomain || 'yourdomain.com'}/tin-tuc-2`}
                  value={urlsInput}
                  onChange={(e) => setUrlsInput(e.target.value)}
                  fullWidth
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      fontFamily: 'monospace',
                      fontSize: '0.85rem'
                    }
                  }}
                />
              </Box>
            </Box>

            {/* Validation Alerts Area */}
            {parsedUrls.invalidFormat.length > 0 && (
              <Alert severity="warning" variant="outlined" sx={{ borderRadius: 3, py: 0.5 }}>
                Phát hiện {parsedUrls.invalidFormat.length} URL thiếu định dạng giao thức (phải có http:// hoặc https://). Các URL này sẽ bị bỏ qua khi gửi.
              </Alert>
            )}

            {parsedUrls.domainMismatch.length > 0 && (
              <Alert severity="error" variant="outlined" sx={{ borderRadius: 3, py: 0.5 }}>
                Phát hiện {parsedUrls.domainMismatch.length} URL không khớp với domain sở hữu đã chọn (<b>{selectedDomain}</b>). Các URL này sẽ tự động bị loại bỏ.
              </Alert>
            )}

            {parsedUrls.validUrls.length > 50 && (
              <Alert severity="error" variant="outlined" sx={{ borderRadius: 3, py: 0.5 }}>
                Số lượng URL hợp lệ ({parsedUrls.validUrls.length}) vượt quá giới hạn tối đa cho phép là 50 URL cùng lúc. Vui lòng cắt bớt.
              </Alert>
            )}

            {/* Response metadata results */}
            {submitResult && (
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'success.main', bgcolor: 'rgba(16, 185, 129, 0.05)', borderRadius: 3 }}>
                <Typography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DoneIcon sx={{ fontSize: 18 }} /> Kết quả gửi ép index Direct thành công!
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                  • Số URL được đưa vào hàng đợi xử lý: <b>{submitResult.accepted} URL</b> <br />
                  • Kích thước hàng đợi hiện tại: <b>{submitResult.queueSize}</b> <br />
                  • Lưu ý: {submitResult.note}
                </Typography>
                {submitResult.rejected.length > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 800 }}>
                      ⚠️ Có {submitResult.rejected.length} URL bị từ chối từ API Backend:
                    </Typography>
                    <Box sx={{ maxHeight: 120, overflowY: 'auto', mt: 0.5, bgcolor: 'background.default', p: 1, borderRadius: 2 }}>
                      {submitResult.rejected.map((item, idx) => (
                        <Typography key={idx} variant="caption" display="block" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                          - <b>{item.url}</b>: {item.reason}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSubmitDirect}
                disabled={isSubmitting || parsedUrls.validUrls.length === 0 || parsedUrls.validUrls.length > 50}
                sx={{
                  borderRadius: 2.5,
                  fontWeight: 800,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  background: 'linear-gradient(135deg, #00b894 0%, #009975 100%)',
                  boxShadow: '0 4px 15px rgba(0, 184, 148, 0.2)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #3dd6a0 0%, #009975 100%)',
                  },
                  '&:disabled': {
                    background: 'rgba(255,255,255,0.12)',
                    boxShadow: 'none'
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} /> Đang gửi queue...
                  </>
                ) : (
                  'Gửi ép index Direct'
                )}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Khối Lịch sử (dưới) */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              Lịch Sử Ép Index Direct
            </Typography>
            <Typography variant="caption" color="text.secondary">
              * Backend hàng đợi xử lý tuần tự (delay 30-90s/URL). Vui lòng tải lại trang hoặc đợi cập nhật tự động sau vài phút.
            </Typography>
          </Box>

          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchHistory(false)}
            disabled={historyLoading}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, height: 34 }}
          >
            Làm mới
          </Button>
        </Box>

        {historyLoading ? (
          <Box sx={{ p: 4 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={40} sx={{ my: 1.5, borderRadius: 1.5 }} />
            ))}
          </Box>
        ) : historyData.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled' }}>
            <ErrorOutlinedIcon sx={{ fontSize: 44, opacity: 0.3, mb: 1.5 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Chưa có dữ liệu lịch sử ép index Direct.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Target URL</TableCell>
                    <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Domain</TableCell>
                    <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Crawl/Index Real-Time</TableCell>
                    <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Thời gian gọi API</TableCell>
                    <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Response</TableCell>
                    <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Google Account</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyData.map((item) => (
                    <TableRow key={item._id} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      {/* Target URL */}
                      <TableCell sx={{ py: 1.2, maxWidth: 280 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Tooltip title={item.targetUrl} arrow>
                            <Link
                              href={item.targetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                color: '#00b894',
                                textDecoration: 'underline',
                                fontWeight: 650,
                                wordBreak: 'break-all',
                                cursor: 'pointer'
                              }}
                            >
                              {item.targetUrl}
                            </Link>
                          </Tooltip>
                          <IconButton
                            size="small"
                            component="a"
                            href={item.targetUrl}
                            target="_blank"
                            rel="noopener"
                            sx={{ p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                          >
                            <OpenInNewIcon sx={{ fontSize: 10 }} />
                          </IconButton>
                        </Box>
                      </TableCell>

                      {/* Domain */}
                      <TableCell sx={{ py: 1.2, fontWeight: 500 }}>
                        {item.domain}
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ py: 1.2 }}>
                        {getStatusBadge(item.status, item.indexingApiResponse)}
                      </TableCell>

                      {/* Verify Index Status badge */}
                      <TableCell sx={{ py: 1.2 }}>
                        {getIndexedBadge(item._id, item.targetUrl)}
                      </TableCell>

                      {/* Time called API */}
                      <TableCell sx={{ py: 1.2, fontSize: '0.8rem', color: 'text.secondary' }}>
                        {formatTime(item.indexingApiCalledAt || item.createdAt)}
                      </TableCell>

                      {/* Response Message */}
                      <TableCell sx={{ py: 1.2, fontSize: '0.8rem', maxWidth: 150 }}>
                        <Tooltip title={item.indexingApiResponse || 'No response'} arrow>
                          <Typography variant="caption" noWrap display="block" sx={{ fontFamily: 'monospace', color: item.status === 'failed' ? 'error.main' : 'text.primary' }}>
                            {item.indexingApiResponse || '—'}
                          </Typography>
                        </Tooltip>
                      </TableCell>

                      {/* Google Account */}
                      <TableCell sx={{ py: 1.2, fontSize: '0.78rem', color: 'text.secondary', maxWidth: 180 }} noWrap>
                        <Tooltip title={item.indexingApiAccount || ''} arrow>
                          <span>{item.indexingApiAccount || '—'}</span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Custom Simple Pagination aligned with theme */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <TablePagination
                component="div"
                count={totalItems}
                page={page}
                onPageChange={(_, newPage) => {
                  setPage(newPage);
                  // The backend getDirectHistory takes a single limit parameter.
                  // For UI simplicity, we can fetch all or handle page.
                }}
                rowsPerPage={limit}
                onRowsPerPageChange={(e) => {
                  const newLimit = parseInt(e.target.value, 10);
                  setLimit(newLimit);
                  setPage(0);
                }}
                rowsPerPageOptions={[20, 50, 100, 200]}
                labelRowsPerPage="Số dòng mỗi trang:"
                sx={{ border: 'none' }}
              />
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
