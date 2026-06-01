import { useState } from 'react';
import useSWR from 'swr';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Fade,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { indexingService } from '../indexingService';
import type { IndexingResult, IndexingHistoryItem } from '../indexingService';
import { useToastify } from '../../../components/Toastify';

// format time GMT+7 DD/MM HH:mm
const formatVnTime = (dateStr: string | undefined | null) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${day}/${month} ${hours}:${minutes}`;
  } catch {
    return '-';
  }
};

export default function IndexingToolSection() {
  const { showToast } = useToastify();
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentResult, setCurrentResult] = useState<IndexingResult | null>(null);

  // History parameters
  const [limit, setLimit] = useState(20);

  // dialog details state
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<IndexingHistoryItem | null>(null);

  // SWR Hook for history cache
  const { data: historyData, error: historyError, mutate } = useSWR(
    ['/indexing/history', limit],
    () => indexingService.getHistory(limit),
    {
      revalidateOnFocus: false,
    }
  );

  const validateUrl = (val: string): boolean => {
    if (!val) {
      setUrlError('Vui lòng nhập URL');
      return false;
    }
    if (!val.startsWith('http://') && !val.startsWith('https://')) {
      setUrlError('URL phải bắt đầu bằng http:// hoặc https://');
      return false;
    }
    try {
      new URL(val);
      setUrlError('');
      return true;
    } catch {
      setUrlError('URL không hợp lệ hoặc sai định dạng');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = urlInput.trim();
    if (!validateUrl(trimmed)) return;

    setIsSubmitting(true);
    setCurrentResult(null);
    showToast('Đang gửi request...', 'info');

    try {
      const res = await indexingService.submitUrl(trimmed);
      setCurrentResult(res);
      showToast('Đã submit, kết quả bên dưới', 'success');
      setUrlInput(''); // clear input on success
      mutate(); // auto refresh history
    } catch (err: any) {
      console.error('Submit indexing error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi submit';
      showToast(errMsg, 'danger');
      setUrlError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuccessStatus = (status: string | undefined | null): boolean => {
    if (!status) return false;
    const s = status.toLowerCase();
    return s === 'ok' || s.startsWith('partial') || s === 'success';
  };

  const renderResultDetails = (results: IndexingResult['results']) => {
    const indexNowItems = results?.indexNow ? Object.entries(results.indexNow) : [];
    const pingItems = results?.ping ? Object.entries(results.ping) : [];

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* IndexNow */}
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 1, display: 'flex', alignItems: 'center', gap: 0.8, color: 'primary.main' }}>
            ▼ IndexNow (Bing + Yandex)
          </Typography>
          {indexNowItems.length === 0 ? (
            <Typography variant="body2" sx={{ pl: 2, color: 'text.secondary', fontStyle: 'italic' }}>
              Không có dữ liệu
            </Typography>
          ) : (
            <List dense disablePadding sx={{ pl: 1 }}>
              {indexNowItems.map(([engine, status]) => {
                const ok = isSuccessStatus(status);
                return (
                  <ListItem key={engine} disableGutters sx={{ py: 0.25 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      {ok ? (
                        <CheckCircleIcon sx={{ color: '#10b981', fontSize: 18 }} />
                      ) : (
                        <Tooltip title={status} arrow placement="top">
                          <CancelIcon sx={{ color: '#ef4444', fontSize: 18, cursor: 'pointer' }} />
                        </Tooltip>
                      )}
                    </ListItemIcon>
                    <Tooltip title={ok ? 'Hoàn thành' : status} arrow placement="top">
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{engine}</Typography>
                            <Typography variant="body2" color={ok ? '#10b981' : '#ef4444'} sx={{ fontSize: '0.8rem', opacity: 0.9 }}>
                              {ok ? 'ok' : status.length > 50 ? `${status.substring(0, 50)}...` : status}
                            </Typography>
                          </Box>
                        }
                      />
                    </Tooltip>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>

        {/* Ping Services */}
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 1, display: 'flex', alignItems: 'center', gap: 0.8, color: 'secondary.main' }}>
            ▼ Ping services
          </Typography>
          {pingItems.length === 0 ? (
            <Typography variant="body2" sx={{ pl: 2, color: 'text.secondary', fontStyle: 'italic' }}>
              Không có dữ liệu
            </Typography>
          ) : (
            <List dense disablePadding sx={{ pl: 1 }}>
              {pingItems.map(([service, status]) => {
                const ok = isSuccessStatus(status);
                return (
                  <ListItem key={service} disableGutters sx={{ py: 0.25 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      {ok ? (
                        <CheckCircleIcon sx={{ color: '#10b981', fontSize: 18 }} />
                      ) : (
                        <Tooltip title={status} arrow placement="top">
                          <CancelIcon sx={{ color: '#ef4444', fontSize: 18, cursor: 'pointer' }} />
                        </Tooltip>
                      )}
                    </ListItemIcon>
                    <Tooltip title={ok ? 'Hoàn thành' : status} arrow placement="top">
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{service}</Typography>
                            <Typography variant="body2" color={ok ? '#10b981' : '#ef4444'} sx={{ fontSize: '0.8rem', opacity: 0.9 }}>
                              {ok ? 'ok' : status.length > 50 ? `${status.substring(0, 50)}...` : status}
                            </Typography>
                          </Box>
                        }
                      />
                    </Tooltip>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Overview/Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <SendIcon sx={{ color: 'primary.main', transform: 'rotate(-45deg)' }} />
            Google / Bing Indexing Tool
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gửi yêu cầu index URL lập tức đến Bing, Yandex (IndexNow) và các dịch vụ Ping quốc tế.
          </Typography>
        </Box>
      </Box>

      {/* Main Grid: Submit Form (Left) & Result View (Right) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: 3.5, alignItems: 'start' }}>
        {/* Section 1: Submit form */}
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
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', mb: 2, color: 'text.primary' }}>
            Submit URL cần Index
          </Typography>

          <Alert
            severity="warning"
            icon={<WarningAmberIcon sx={{ color: '#b45309' }} />}
            sx={{
              mb: 3,
              borderRadius: 3,
              bgcolor: '#fffbeb',
              color: '#92400e',
              border: '1px solid #fef3c7',
              '& .MuiAlert-icon': { alignSelf: 'center' },
            }}
          >
            <strong>Lưu ý:</strong> External URLs (không sở hữu domain) có thể chỉ đạt ~10-15% Google index trong vòng 48h.
          </Alert>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="URL cần index"
              placeholder="https://luatvietnam.vn/tin-van-ban-moi/..."
              type="url"
              fullWidth
              variant="outlined"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (urlError) setUrlError('');
              }}
              error={!!urlError}
              helperText={urlError}
              disabled={isSubmitting}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || !urlInput.trim()}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ transform: 'rotate(-45deg)' }} />}
              sx={{
                py: 1.5,
                borderRadius: 3,
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.25)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #9333ea 0%, #6d28d9 100%)',
                },
              }}
            >
              {isSubmitting ? 'Đang gửi yêu cầu index...' : 'Gửi URL Lập Tức'}
            </Button>
          </Box>
        </Paper>

        {/* Section 2: Result Display */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            minHeight: 280,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', mb: 2, color: 'text.primary' }}>
            Kết quả gửi gần nhất
          </Typography>

          {isSubmitting ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
            </Box>
          ) : currentResult ? (
            <Fade in={!!currentResult}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                    URL SUBMITTED
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: 'break-all', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {currentResult.url}
                    <IconButton size="small" component="a" href={currentResult.url} target="_blank" rel="noopener noreferrer">
                      <OpenInNewIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                      JOB ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                      {currentResult.jobId}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                      TRẠNG THÁI
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      <Box component="span" sx={{ color: '#10b981' }}>{currentResult.okCount} thành công</Box>
                      {' / '}
                      <Box component="span" sx={{ color: '#ef4444' }}>{currentResult.failCount} thất bại</Box>
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 0.5 }} />

                {renderResultDetails(currentResult.results)}

                <Alert
                  severity="info"
                  icon={<InfoOutlinedIcon sx={{ color: '#0369a1' }} />}
                  sx={{
                    mt: 2,
                    borderRadius: 3,
                    bgcolor: '#f0f9ff',
                    color: '#0369a1',
                    border: '1px solid #e0f2fe',
                    '& .MuiAlert-icon': { alignSelf: 'center' },
                  }}
                >
                  {currentResult.note || 'Lưu ý: Đạt hiệu quả 10-15% đối với Google Index. Bing & Yandex có thể nhận diện và cập nhật nhanh hơn.'}
                </Alert>
              </Box>
            </Fade>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, py: 4, textAlign: 'center', color: 'text.disabled' }}>
              <SendIcon sx={{ fontSize: 48, opacity: 0.25, mb: 1.5, transform: 'rotate(-45deg)' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Chưa có kết quả.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Vui lòng submit 1 URL ở khung bên trái để xem kết quả.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Section 3: History table */}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
          <HistoryIcon sx={{ color: 'primary.main' }} />
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: 'text.primary' }}>
            Lịch sử gửi Index
          </Typography>
        </Box>

        {historyError ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'error.main' }}>
            Có lỗi xảy ra khi tải lịch sử. Vui lòng thử lại sau.
          </Box>
        ) : !historyData ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Skeleton variant="rectangular" height={44} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={44} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={44} sx={{ borderRadius: 2 }} />
          </Box>
        ) : historyData.items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
            <HistoryIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
            <Typography sx={{ fontSize: '0.9rem' }}>Chưa có lịch sử submit nào</Typography>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, py: 1.75 }}>Thời gian</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.75 }}>URL</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.75, align: 'center' }}>OK</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.75, align: 'center' }}>Thất bại</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.75, textAlign: 'right' }}>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyData.items.map((row) => (
                    <TableRow key={row._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ py: 1.5, fontWeight: 500, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {formatVnTime(row.createdAt)}
                      </TableCell>
                      <TableCell sx={{ py: 1.5, fontWeight: 600, maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Tooltip title={row.url} arrow placement="top">
                          <Box component="span" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
                            {row.url}
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ py: 1.5, fontWeight: 700, color: '#10b981' }}>
                        {row.okCount}
                      </TableCell>
                      <TableCell sx={{ py: 1.5, fontWeight: 700, color: '#ef4444' }}>
                        {row.failCount}
                      </TableCell>
                      <TableCell sx={{ py: 1.5, textAlign: 'right' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setSelectedHistoryItem(row)}
                          sx={{
                            borderRadius: 2,
                            fontWeight: 700,
                            textTransform: 'none',
                            borderWidth: '1.5px',
                            '&:hover': {
                              borderWidth: '1.5px',
                            },
                          }}
                        >
                          Xem chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {historyData.total > limit && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => setLimit(prev => prev + 20)}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 700,
                    px: 4,
                    py: 1,
                    textTransform: 'none',
                    borderWidth: '1.5px',
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': {
                      borderWidth: '1.5px',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  Xem thêm lịch sử
                </Button>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* History Item Details Modal */}
      <Dialog
        open={!!selectedHistoryItem}
        onClose={() => setSelectedHistoryItem(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              p: 1.5,
            },
          },
        }}
      >
        {selectedHistoryItem && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: '1.15rem', pb: 1 }}>
              Chi tiết lịch sử submit
              <IconButton onClick={() => setSelectedHistoryItem(null)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: 'divider', py: 2.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                    URL ĐÃ GỬI
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: 'break-all', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {selectedHistoryItem.url}
                    <IconButton size="small" component="a" href={selectedHistoryItem.url} target="_blank" rel="noopener noreferrer">
                      <OpenInNewIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                      THỜI GIAN GỬI
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatVnTime(selectedHistoryItem.createdAt)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                      TRẠNG THÁI GỬI
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      <Box component="span" sx={{ color: '#10b981' }}>{selectedHistoryItem.okCount} thành công</Box>
                      {' / '}
                      <Box component="span" sx={{ color: '#ef4444' }}>{selectedHistoryItem.failCount} thất bại</Box>
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {renderResultDetails(selectedHistoryItem.results)}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button onClick={() => setSelectedHistoryItem(null)} variant="contained" color="primary" sx={{ borderRadius: 2.5, fontWeight: 700, px: 3, textTransform: 'none' }}>
                Đóng
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
