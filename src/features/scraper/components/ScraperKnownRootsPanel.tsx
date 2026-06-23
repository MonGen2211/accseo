import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
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
  Tabs,
  Tab,
} from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import RestoreIcon from '@mui/icons-material/Restore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditIcon from '@mui/icons-material/Edit';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import { format, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';

import { scraperService } from '../scraperService';
import type { KnownRoot } from '../types';
import { useToastify } from '../../../components/Toastify';

export default function ScraperKnownRootsPanel() {
  const { showToast } = useToastify();

  // State
  const [sources, setSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [items, setItems] = useState<KnownRoot[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0); // 0-indexed for TablePagination
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<'new' | 'acknowledged' | 'ignored'>('new');
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRoot, setSelectedRoot] = useState<KnownRoot | null>(null);
  const [actionType, setActionType] = useState<'acknowledged' | 'ignored' | 'edit_note' | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load Sources
  useEffect(() => {
    const loadSources = async () => {
      try {
        const data = await scraperService.getKnownRootSources();
        const srcList = data.sources || [];
        setSources(srcList);
        if (srcList.length > 0) {
          setSelectedSource(srcList[0]);
        }
      } catch (err: any) {
        console.error('Lỗi tải danh sách nguồn:', err);
        showToast('Không thể tải danh sách nguồn', 'danger');
      }
    };
    loadSources();
  }, []);

  // Fetch roots function
  const loadRoots = useCallback(async () => {
    if (!selectedSource) return;
    setLoading(true);
    setError(null);
    try {
      const data = await scraperService.getKnownRoots({
        status,
        source: selectedSource,
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
  }, [status, selectedSource, page, limit]);

  useEffect(() => {
    loadRoots();
  }, [loadRoots]);

  // Handle discover (quét thủ công)
  const handleDiscover = async () => {
    if (!selectedSource) return;
    setDiscovering(true);
    try {
      const res = await scraperService.discoverKnownRoots(selectedSource);
      showToast(res.message || 'Đã quét xong gốc site', 'success');
      loadRoots();
    } catch (err: any) {
      console.error('Lỗi khi quét gốc site:', err);
      const errMsg = err.response?.data?.message || err.message || 'Quét gốc site thất bại';
      showToast(errMsg, 'danger');
    } finally {
      setDiscovering(false);
    }
  };

  // Handle pagination
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Open dialog for classification or editing note
  const handleOpenDialog = (root: KnownRoot, type: 'acknowledged' | 'ignored' | 'edit_note') => {
    setSelectedRoot(root);
    setActionType(type);
    setNoteInput(type === 'edit_note' ? (root.note || '') : '');
    setOpenDialog(true);
  };

  // Save action from dialog
  const handleSaveAction = async () => {
    if (!selectedRoot || !actionType) return;
    
    // Note validation: cannot send empty note if it is explicitly edited or set
    const trimmedNote = noteInput.trim();
    if (actionType === 'edit_note' && !trimmedNote) {
      showToast('Ghi chú không được để trống khi sửa', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      let payload: { status?: 'new' | 'acknowledged' | 'ignored'; note?: string } = {};
      
      if (actionType === 'edit_note') {
        payload.note = trimmedNote;
      } else {
        payload.status = actionType;
        if (trimmedNote) {
          payload.note = trimmedNote;
        }
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
        return <Chip label="Đang crawl" color="success" size="small" sx={{ fontWeight: 700 }} />;
      case 'ignored':
        return <Chip label="Phớt lờ" color="default" size="small" sx={{ fontWeight: 700 }} />;
      default:
        return null;
    }
  };

  const getEmptyStateMessage = () => {
    switch (status) {
      case 'new':
        return 'Không có gốc mới nào cần xử lý — map scraper đang phủ đủ.';
      case 'acknowledged':
        return 'Chưa có gốc nào được đánh dấu đang crawl.';
      default:
        return 'Không tìm thấy gốc site nào phù hợp với bộ lọc.';
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
        Đây là các &apos;gốc&apos; (mục cấp 1 trong đường dẫn) phát hiện trên site nguồn. Gốc lạ chứa nhiều bài (vd <code>tin-moi</code>) mà scraper chưa crawl &rarr; báo dev thêm vào cấu hình rồi đánh dấu <strong>Đang crawl</strong>; trang phụ không cần thì <strong>Phớt lờ</strong>. Tab <strong>Map đang crawl</strong> cho biết hiện đang phủ những gốc nào. Bấm <strong>Kiểm tra ngay</strong> để quét lại trang chủ tức thì.
      </Alert>

      {/* Filter and Table Panel */}
      <Paper sx={{ p: 2.5, borderRadius: '16px' }}>
        {/* Source Dropdown and Discover Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ minWidth: 240 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>
              Nguồn dữ liệu
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={selectedSource}
                onChange={(e) => {
                  setSelectedSource(e.target.value);
                  setPage(0);
                }}
                disabled={sources.length === 0}
              >
                {sources.map((src) => (
                  <MenuItem key={src} value={src}>
                    {src.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Button
            variant="contained"
            color="primary"
            disabled={discovering || !selectedSource}
            onClick={handleDiscover}
            startIcon={discovering ? <CircularProgress size={16} color="inherit" /> : <TroubleshootIcon />}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              color: '#fff',
              height: 40,
            }}
          >
            {discovering ? 'Đang kiểm tra...' : 'Kiểm tra ngay'}
          </Button>
        </Box>

        {/* Status Tab Filter */}
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={status}
            onChange={(_, val) => {
              setStatus(val);
              setPage(0);
            }}
            indicatorColor="primary"
            textColor="primary"
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                minHeight: 40,
                px: 3,
                py: 1,
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: 'primary.main',
                }
              }
            }}
          >
            <Tab value="new" label="Chưa xử lý" />
            <Tab value="acknowledged" label="Map đang crawl" />
            <Tab value="ignored" label="Đã phớt lờ" />
          </Tabs>
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
              {getEmptyStateMessage()}
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
                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Segment</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>URL Mẫu</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5, width: 140 }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Ghi chú</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5, width: 160 }}>Phát hiện lúc</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 1.5, width: 260, textAlign: 'right' }}>Hành động</TableCell>
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
                                Đang crawl
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
                            <>
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
                              <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => handleOpenDialog(item, 'edit_note')}
                                sx={{
                                  textTransform: 'none',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  px: 1.5,
                                }}
                              >
                                Sửa ghi chú
                              </Button>
                            </>
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
          {actionType === 'acknowledged' && 'Đánh dấu Đang crawl'}
          {actionType === 'ignored' && 'Đánh dấu Phớt lờ'}
          {actionType === 'edit_note' && 'Sửa ghi chú'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Gốc site: <strong>{selectedRoot?.segment}</strong> ({selectedRoot?.source})
            </Typography>
          </Box>
          <TextField
            autoFocus
            label="Ghi chú"
            placeholder={actionType === 'edit_note' ? 'Nhập ghi chú mới...' : 'Ghi chú (không bắt buộc)'}
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
