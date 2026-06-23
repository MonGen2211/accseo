import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
  TablePagination,
} from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import RestoreIcon from '@mui/icons-material/Restore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { format, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';

import { scraperService } from '../scraperService';
import type { KnownRoot } from '../types';
import { useToastify } from '../../../components/Toastify';

export default function ScraperKnownRootsPanel() {
  const { showToast } = useToastify();

  // State
  const [items, setItems] = useState<KnownRoot[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0); // 0-indexed for TablePagination
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<'new' | 'acknowledged' | 'ignored' | ''>('new');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRoot, setSelectedRoot] = useState<KnownRoot | null>(null);
  const [actionType, setActionType] = useState<'acknowledged' | 'ignored' | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch function
  const loadRoots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scraperService.getKnownRoots({
        status,
        source: 'thuvienphapluat',
        page: page + 1, // API is 1-indexed
        limit,
      });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error('Lỗi tải danh sách gốc site:', err);
      const errMsg = err.response?.data?.message || err.message || 'Không thể tải danh sách gốc site';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [status, page, limit]);

  useEffect(() => {
    loadRoots();
  }, [loadRoots]);

  // Handle pagination
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Open dialog for classification
  const handleOpenDialog = (root: KnownRoot, type: 'acknowledged' | 'ignored') => {
    setSelectedRoot(root);
    setActionType(type);
    setNoteInput('');
    setOpenDialog(true);
  };

  // Save action from dialog
  const handleSaveAction = async () => {
    if (!selectedRoot || !actionType) return;
    setSubmitting(true);
    try {
      const payload: { status: 'acknowledged' | 'ignored'; note?: string } = {
        status: actionType,
      };
      if (noteInput.trim()) {
        payload.note = noteInput.trim();
      }

      await scraperService.updateKnownRoot(selectedRoot.id, payload);
      showToast('Đã cập nhật gốc site thành công', 'success');
      setOpenDialog(false);
      loadRoots();
    } catch (err: any) {
      console.error('Lỗi cập nhật gốc site:', err);
      const errMsg = err.response?.data?.message || err.message || 'Cập nhật gốc site thất bại';
      showToast(errMsg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  // Restore root back to 'new'
  const handleRestore = async (root: KnownRoot) => {
    try {
      await scraperService.updateKnownRoot(root.id, {
        status: 'new',
        note: '',
      });
      showToast('Đã khôi phục gốc site về chưa xử lý', 'success');
      loadRoots();
    } catch (err: any) {
      console.error('Lỗi khôi phục gốc site:', err);
      const errMsg = err.response?.data?.message || err.message || 'Khôi phục gốc site thất bại';
      showToast(errMsg, 'danger');
    }
  };

  // Format dates
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isValid(d) ? format(d, 'HH:mm dd/MM/yyyy', { locale: vi }) : '-';
  };

  // Render Status Badge
  const renderStatus = (statusVal: 'new' | 'acknowledged' | 'ignored') => {
    switch (statusVal) {
      case 'new':
        return <Chip label="Chưa xử lý" color="warning" size="small" sx={{ fontWeight: 700 }} />;
      case 'acknowledged':
        return <Chip label="Đã xử lý" color="success" size="small" sx={{ fontWeight: 700 }} />;
      case 'ignored':
        return <Chip label="Phớt lờ" color="default" size="small" sx={{ fontWeight: 700 }} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Alert Nghiệp vụ */}
      <Alert
        severity="info"
        icon={<InfoOutlinedIcon sx={{ color: '#3498db' }} />}
        sx={{
          borderRadius: '12px',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(52, 152, 219, 0.15)' : 'rgba(52, 152, 219, 0.05)',
          border: '1px solid',
          borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(52, 152, 219, 0.3)' : 'rgba(52, 152, 219, 0.2)',
          '& .MuiAlert-message': { color: 'text.primary', fontSize: '0.9rem', lineHeight: 1.6 }
        }}
      >
        Đây là các <strong>&apos;gốc&apos;</strong> (mục cấp 1 trong đường dẫn) mà hệ thống phát hiện trên site nhưng có thể scraper chưa crawl. Nếu thấy một gốc lạ chứa nhiều bài (vd <code>tin-moi</code>), báo dev thêm vào cấu hình crawl rồi đánh dấu <strong>Đã xử lý</strong>. Nếu là trang phụ không cần crawl (giới thiệu, liên hệ...), đánh dấu <strong>Phớt lờ</strong>. Đã xử lý/Phớt lờ sẽ không hiện lại ở danh sách &apos;Chưa xử lý&apos;.
      </Alert>

      {/* Filter and Table Panel */}
      <Paper sx={{ p: 2.5, borderRadius: '16px' }}>
        {/* Filter bar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
          <Box sx={{ minWidth: 200 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>
              Trạng thái gốc site
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as any);
                  setPage(0);
                }}
              >
                <MenuItem value="new">Chưa xử lý (new)</MenuItem>
                <MenuItem value="acknowledged">Đã xử lý (acknowledged)</MenuItem>
                <MenuItem value="ignored">Phớt lờ (ignored)</MenuItem>
                <MenuItem value="">Tất cả trạng thái</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Loading Spinner */}
        {loading && items.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: '12px' }}>
            {error}
          </Alert>
        ) : items.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              {status === 'new'
                ? 'Không có gốc mới nào cần xử lý — map scraper đang phủ đủ.'
                : 'Không tìm thấy gốc site nào phù hợp với bộ lọc.'}
            </Typography>
          </Box>
        ) : (
          <Box>
            <TableContainer
              sx={{
                borderRadius: '12px',
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
              }}
            >
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Gốc (Segment)</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>URL Mẫu</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5, width: 140 }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Ghi chú</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5, width: 160 }}>Phát hiện lúc</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5, width: 220, textAlign: 'right' }}>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>
                        {item.segment}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={item.sampleUrl}>
                          <Button
                            href={item.sampleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
                            sx={{
                              textTransform: 'none',
                              fontSize: '0.85rem',
                              color: 'primary.main',
                              fontWeight: 600,
                              p: 0,
                              minWidth: 0,
                              justifyContent: 'flex-start',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              maxWidth: 280,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.sampleUrl}
                          </Button>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {renderStatus(item.status)}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.note || '-'}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {formatDate(item.firstSeenAt)}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          {item.status === 'new' ? (
                            <>
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<CheckCircleOutlinedIcon />}
                                onClick={() => handleOpenDialog(item, 'acknowledged')}
                                sx={{
                                  textTransform: 'none',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  color: '#fff',
                                  px: 1.5,
                                }}
                              >
                                Đã xử lý
                              </Button>
                              <Button
                                variant="outlined"
                                color="inherit"
                                size="small"
                                startIcon={<HighlightOffIcon />}
                                onClick={() => handleOpenDialog(item, 'ignored')}
                                sx={{
                                  textTransform: 'none',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  color: 'text.secondary',
                                  borderColor: 'divider',
                                  px: 1.5,
                                }}
                              >
                                Phớt lờ
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outlined"
                              color="warning"
                              size="small"
                              startIcon={<RestoreIcon />}
                              onClick={() => handleRestore(item)}
                              sx={{
                                textTransform: 'none',
                                borderRadius: '6px',
                                fontWeight: 700,
                                px: 1.5,
                              }}
                            >
                              Khôi phục
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Table pagination */}
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={limit}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage="Số dòng mỗi trang:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong số ${count}`}
              sx={{ mt: 1 }}
            />
          </Box>
        )}
      </Paper>

      {/* Dialog Nhập Ghi Chú */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {actionType === 'acknowledged' ? 'Đánh dấu Đã xử lý' : 'Đánh dấu Phớt lờ'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Gốc site: <strong>{selectedRoot?.segment}</strong> ({selectedRoot?.source})
            </Typography>
          </Box>
          <TextField
            autoFocus
            label="Ghi chú (không bắt buộc)"
            fullWidth
            multiline
            rows={3}
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            inputProps={{ maxLength: 500 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
            Hủy
          </Button>
          <Button
            onClick={handleSaveAction}
            variant="contained"
            color="primary"
            sx={{ borderRadius: '8px', color: '#fff' }}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
