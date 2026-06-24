import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Link from '@mui/material/Link';
import LoadingButton from '@mui/lab/LoadingButton';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Skeleton from '@mui/material/Skeleton';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';
import Tooltip from '@mui/material/Tooltip';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { serpService, type AiOverviewResponseData, type AiOverviewItemResult, type AiOverviewSource } from '../../dashboard/serpService';
import { useToastify } from '../../../components/Toastify';

interface AiOverviewSectionProps {
  isActive: boolean;
}

export default function AiOverviewSection({ isActive }: AiOverviewSectionProps) {
  const { showToast } = useToastify();

  // Form states
  const [keywordsText, setKeywordsText] = useState('');
  const [domain, setDomain] = useState('');
  const [market, setMarket] = useState('vi-VN'); // Default vi-VN => geo: vn, hl: vi

  // API states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AiOverviewResponseData | null>(null);

  // Selected keyword detail modal state
  const [selectedResult, setSelectedResult] = useState<AiOverviewItemResult | null>(null);

  // Validation errors
  const [keywordsError, setKeywordsError] = useState('');
  const [domainError, setDomainError] = useState('');

  // Parsed keyword stats helper
  const getParsedKeywords = () => {
    return keywordsText
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);
  };

  const parsedKeywords = getParsedKeywords();
  const distinctKeywords = Array.from(new Set(parsedKeywords));
  const keywordCount = distinctKeywords.length;

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setKeywordsError('');
    setDomainError('');

    const cleanDomain = domain.trim().toLowerCase();

    // Validation
    let hasError = false;
    if (distinctKeywords.length === 0) {
      setKeywordsError('Vui lòng nhập ít nhất 1 từ khóa.');
      hasError = true;
    } else if (distinctKeywords.length > 20) {
      setKeywordsError(`Tối đa 20 từ khóa cho mỗi lần quét. Bạn đang nhập ${distinctKeywords.length} từ khóa độc nhất.`);
      hasError = true;
    }

    // Check individual keyword lengths
    const longKeywords = distinctKeywords.filter(k => k.length > 200);
    if (longKeywords.length > 0) {
      setKeywordsError(`Có từ khóa vượt quá 200 ký tự: "${longKeywords[0].slice(0, 30)}..."`);
      hasError = true;
    }

    if (cleanDomain && cleanDomain.length > 253) {
      setDomainError('Domain không được vượt quá 253 ký tự.');
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    setResult(null);

    // Map vi-VN and en-US to geo/hl
    const geo = market === 'en-US' ? 'us' : 'vn';
    const hl = market === 'en-US' ? 'en' : 'vi';

    showToast(`Đang chạy loạt quét AI Overview cho ${distinctKeywords.length} từ khóa (tốn khoảng 5–20 giây / từ khóa)...`, 'info');

    try {
      const response = await serpService.checkAiOverview({
        keywords: distinctKeywords,
        domain: cleanDomain || undefined,
        geo,
        hl,
      });

      if (response.success && response.data) {
        setResult(response.data);
        
        // Notify based on summary
        const { present, blocked, total } = response.data;
        if (blocked > 0) {
          showToast(`Quét hoàn tất: ${present}/${total} có AI Overview, ${blocked} từ bị Google chặn.`, 'warning');
        } else {
          showToast(`Quét hoàn tất thành công! Có AI Overview: ${present}/${total} từ khóa.`, 'success');
        }
      } else {
        throw new Error(response.message || 'Lỗi không xác định từ hệ thống');
      }
    } catch (err: any) {
      console.error('Check AI Overview error:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi hệ thống khi kiểm tra AI Overview';
      showToast(msg, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get distinct domains helper for detailed keyword view
  const getDistinctDomains = (sources: AiOverviewSource[]) => {
    return Array.from(new Set(sources.map(s => s.domain)));
  };

  // Check if any keyword in result suffered from HARD_BLOCK_IP_BURNED
  const hasHardBlock = result?.results.some(r => r.blocked && r.error === 'HARD_BLOCK_IP_BURNED');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, width: '100%' }}>
      {/* Page Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
          Kiểm tra AI Overview
        </Typography>
        <Chip
          label="Google Search AI (SGE)"
          size="small"
          color="secondary"
          sx={{ fontWeight: 800, fontSize: '0.75rem', height: 24 }}
        />
      </Box>

      {/* Setup Form */}
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
        <Box component="form" onSubmit={handleCheck} noValidate>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
              gap: 3,
              alignItems: 'flex-start',
              mb: 2.5,
            }}
          >
            {/* Keywords Textarea */}
            <Box>
              <TextField
                required
                fullWidth
                multiline
                rows={5}
                label="Danh sách từ khóa (mỗi dòng một từ)"
                placeholder="Ví dụ:&#13;tiểu đường là gì&#13;cách nấu phở bò&#13;acc đà nẵng"
                value={keywordsText}
                onChange={(e) => setKeywordsText(e.target.value)}
                error={!!keywordsError}
                helperText={keywordsError || `Nhập danh sách từ khóa để kiểm tra. Độc nhất: ${keywordCount}/20 từ.`}
                disabled={isSubmitting}
              />
              {keywordCount > 10 && keywordCount <= 20 && (
                <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block', fontWeight: 600 }}>
                  ⚠️ Quét trên 10 từ khóa có thể mất 2–3 phút. Vui lòng không đóng trang khi đang quét.
                </Typography>
              )}
            </Box>

            {/* Config Fields */}
            <Stack spacing={2.5}>
              {/* Domain Field */}
              <TextField
                fullWidth
                size="small"
                label="Tên miền của bạn (Tùy chọn)"
                placeholder="Ví dụ: accseo.vn, vinmec.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                error={!!domainError}
                helperText={domainError || 'Kiểm tra tỷ lệ trích dẫn domain này cho cả batch'}
                inputProps={{ maxLength: 253 }}
                disabled={isSubmitting}
              />

              {/* Market & Language Selection */}
              <FormControl fullWidth size="small" disabled={isSubmitting}>
                <InputLabel id="market-select-label">Thị trường / Ngôn ngữ</InputLabel>
                <Select
                  labelId="market-select-label"
                  value={market}
                  label="Thị trường / Ngôn ngữ"
                  onChange={(e) => setMarket(e.target.value)}
                >
                  <MenuItem value="vi-VN">Tiếng Việt - Việt Nam (vi-VN)</MenuItem>
                  <MenuItem value="en-US">English - United States (en-US)</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <LoadingButton
              type="submit"
              variant="contained"
              color="primary"
              loading={isSubmitting}
              loadingPosition="start"
              startIcon={<SearchIcon />}
              sx={{
                borderRadius: '100px',
                px: 4,
                py: 1,
                textTransform: 'none',
                fontWeight: 700,
                boxShadow: 'none',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'scale(1.02)',
                  boxShadow: 'none',
                },
              }}
            >
              Kiểm tra loạt từ khóa
            </LoadingButton>
          </Stack>
        </Box>
      </Paper>

      {/* Loading Skeletons */}
      {isSubmitting && (
        <Stack spacing={2.5}>
          <Skeleton variant="rounded" height={60} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rounded" height={250} sx={{ borderRadius: 4 }} />
        </Stack>
      )}

      {/* Results Container */}
      {!isSubmitting && result && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          {/* Summary Stats Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
              gap: 2.5,
            }}
          >
            {/* Total Keywords */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>TỔNG CỘNG</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.5 }}>
                  {result.total} từ khóa
                </Typography>
              </CardContent>
            </Card>

            {/* Present Keywords */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'rgba(46, 125, 50, 0.02)' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>CÓ AI OVERVIEW</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'success.main', mt: 0.5 }}>
                  {result.present} ({Math.round((result.present / result.total) * 100)}%)
                </Typography>
              </CardContent>
            </Card>

            {/* Blocked Keywords */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: result.blocked > 0 ? 'rgba(211, 47, 47, 0.02)' : 'inherit' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color={result.blocked > 0 ? 'error.main' : 'text.secondary'} sx={{ fontWeight: 700 }}>BỊ GOOGLE CHẶN</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: result.blocked > 0 ? 'error.main' : 'text.primary', mt: 0.5 }}>
                  {result.blocked} từ khóa
                </Typography>
              </CardContent>
            </Card>

            {/* Execution time */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>THỜI GIAN CHẠY</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', mt: 0.5 }}>
                  {(result.tookMs / 1000).toFixed(1)} giây
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Hard Block / Circuit Breaker Warning */}
          {hasHardBlock && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'error.light',
                borderRadius: 4,
                p: 3,
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.12)' : 'rgba(211, 47, 47, 0.03)'),
                display: 'flex',
                gap: 2,
                alignItems: 'flex-start',
              }}
            >
              <ErrorOutlineIcon sx={{ fontSize: 32, color: 'error.main', mt: 0.2 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'error.main', mb: 0.8 }}>
                  PHÁT HIỆN HARD BLOCK (CHẶN IP HÀNG LOẠT)
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                  Hệ thống cào quét bị Google chặn liên tiếp (gặp lỗi chặn cứng IP). Server đã kích hoạt chế độ ngắt mạch (Circuit Breaker) và dừng cào quét các từ khóa còn lại để bảo vệ hệ thống. Vui lòng thử lại toàn bộ hoặc chạy lại các từ khóa bị chặn sau ít phút.
                </Typography>
              </Box>
            </Box>
          )}

          {/* Batch Keywords Result Table */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Kết quả phân tích theo từng từ khóa
              </Typography>
            </Box>
            <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Từ khóa</TableCell>
                    <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Số website đề xuất</TableCell>
                    {result.domain && (
                      <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Được AIO trích dẫn?</TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 800, py: 1.5, align: 'center', width: 120 }}>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.results.map((item, idx) => {
                    const isTarget = result.domain && item.targetCited;
                    return (
                      <TableRow
                        key={idx}
                        sx={{
                          transition: 'background-color 0.15s',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        {/* Keyword Name */}
                        <TableCell sx={{ py: 1.5, fontWeight: 600 }}>{item.keyword}</TableCell>

                        {/* Status Badge */}
                        <TableCell sx={{ py: 1.5 }}>
                          {item.blocked ? (
                            <Chip
                              label={item.error === 'HARD_BLOCK_IP_BURNED' ? 'Dừng (IP Block)' : 'Bị Google chặn'}
                              color="error"
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 800, height: 22 }}
                            />
                          ) : item.present ? (
                            <Chip
                              label="Có AI Overview"
                              color="success"
                              size="small"
                              sx={{ fontWeight: 800, height: 22 }}
                            />
                          ) : (
                            <Chip
                              label="Không có AI"
                              color="default"
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 700, height: 22 }}
                            />
                          )}
                        </TableCell>

                        {/* Count of sources */}
                        <TableCell sx={{ py: 1.5 }}>
                          {!item.blocked && item.present ? `${item.sources.length} website` : '—'}
                        </TableCell>

                        {/* Target Domain Citation */}
                        {result.domain && (
                          <TableCell sx={{ py: 1.5 }}>
                            {item.blocked ? (
                              '—'
                            ) : item.targetCited ? (
                              <Chip
                                label={`✓ #${item.targetPosition}`}
                                color="success"
                                size="small"
                                sx={{ fontWeight: 800, height: 20 }}
                              />
                            ) : (
                              <Chip
                                label="✗"
                                color="error"
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 800, height: 20 }}
                              />
                            )}
                          </TableCell>
                        )}

                        {/* Action buttons */}
                        <TableCell sx={{ py: 1.5 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => setSelectedResult(item)}
                            disabled={item.blocked || !item.present}
                            sx={{
                              borderRadius: '100px',
                              textTransform: 'none',
                              fontWeight: 700,
                              py: 0.3,
                            }}
                          >
                            Chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* Detailed Keyword Result Dialog */}
      <Dialog
        open={!!selectedResult}
        onClose={() => setSelectedResult(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 1 }
        }}
      >
        {selectedResult && (
          <>
            <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Chi tiết AI Overview
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Từ khóa: <strong>{selectedResult.keyword}</strong>
                </Typography>
              </Box>
              <IconButton onClick={() => setSelectedResult(null)} size="small" sx={{ color: 'text.disabled' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2.5 }}>
              {/* Citation highlights for target domain */}
              {selectedResult.domain && (
                <Box>
                  {selectedResult.targetCited ? (
                    <Card
                      elevation={0}
                      sx={{
                        border: '1px solid',
                        borderColor: 'success.light',
                        borderRadius: 3.5,
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(46, 125, 50, 0.08)'
                            : 'rgba(46, 125, 50, 0.03)',
                      }}
                    >
                      <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, '&:last-child': { pb: 2 } }}>
                        <CheckCircleOutlinedIcon sx={{ fontSize: 28, color: 'success.main' }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            Tên miền <strong>{selectedResult.domain}</strong> của bạn đã được trích dẫn ở vị trí <strong>#{selectedResult.targetPosition}</strong>.
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card
                      elevation={0}
                      sx={{
                        border: '1px solid',
                        borderColor: 'error.light',
                        borderRadius: 3.5,
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(211, 47, 47, 0.08)'
                            : 'rgba(211, 47, 47, 0.03)',
                      }}
                    >
                      <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, '&:last-child': { pb: 2 } }}>
                        <WarningAmberIcon sx={{ fontSize: 28, color: 'error.main' }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                            Tên miền <strong>{selectedResult.domain}</strong> của bạn chưa được trích dẫn trong câu trả lời AI này.
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              )}

              {/* Grouped competitors summary */}
              {selectedResult.sources && selectedResult.sources.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 1.5 }}>
                    Các Website Được Đề Xuất (Tổng cộng {getDistinctDomains(selectedResult.sources).length} domain)
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                    {getDistinctDomains(selectedResult.sources).map((d, index) => {
                      const isTarget = selectedResult.domain && d.includes(selectedResult.domain);
                      return (
                        <Chip
                          key={index}
                          avatar={
                            <Box
                              component="img"
                              src={`https://www.google.com/s2/favicons?domain=${d}&sz=32`}
                              alt={d}
                              sx={{ width: 16, height: 16, borderRadius: '4px' }}
                            />
                          }
                          label={d}
                          variant={isTarget ? 'filled' : 'outlined'}
                          color={isTarget ? 'success' : 'default'}
                          sx={{
                            fontWeight: isTarget ? 800 : 600,
                            fontSize: '0.78rem',
                            border: isTarget ? 'none' : '1px solid',
                            borderColor: 'divider',
                          }}
                        />
                      );
                    })}
                  </Stack>
                </Box>
              )}

              {/* Table of detail citations */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 1.5 }}>
                  Danh sách nguồn trích dẫn cụ thể
                </Typography>
                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, py: 1.2, width: 80 }}>Vị trí</TableCell>
                        <TableCell sx={{ fontWeight: 800, py: 1.2, width: 60 }}>Icon</TableCell>
                        <TableCell sx={{ fontWeight: 800, py: 1.2 }}>Tiêu đề (URL)</TableCell>
                        <TableCell sx={{ fontWeight: 800, py: 1.2 }}>Domain</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedResult.sources.map((src, index) => {
                        const isTarget = selectedResult.domain && src.domain.includes(selectedResult.domain);
                        return (
                          <TableRow
                            key={index}
                            sx={{
                              bgcolor: isTarget
                                ? (theme) => theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.05)' : 'rgba(46, 125, 50, 0.02)'
                                : 'inherit'
                            }}
                          >
                            <TableCell sx={{ py: 1.2 }}>
                              <Chip
                                label={`#${src.position}`}
                                size="small"
                                color={isTarget ? 'success' : 'default'}
                                sx={{ fontWeight: 800, height: 20 }}
                              />
                            </TableCell>
                            <TableCell sx={{ py: 1.2 }}>
                              <Box
                                component="img"
                                src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`}
                                alt={src.domain}
                                sx={{ width: 18, height: 18, borderRadius: '4px', display: 'block' }}
                              />
                            </TableCell>
                            <TableCell sx={{ py: 1.2 }}>
                              <Link
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  fontWeight: isTarget ? 700 : 500,
                                  color: isTarget ? 'success.main' : 'primary.main',
                                  textDecoration: 'none',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 'inherit',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    wordBreak: 'break-all'
                                  }}
                                >
                                  {src.title || src.url}
                                </Typography>
                                <OpenInNewIcon sx={{ fontSize: 11, flexShrink: 0 }} />
                              </Link>
                            </TableCell>
                            <TableCell sx={{ py: 1.2 }}>{src.domain}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setSelectedResult(null)} variant="contained" sx={{ borderRadius: '100px', textTransform: 'none', px: 3 }}>
                Đóng
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
