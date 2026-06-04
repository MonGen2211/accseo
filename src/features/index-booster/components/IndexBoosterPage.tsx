import React, { useState, useEffect } from 'react';
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
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Card,
  CardContent,
  Grid,
  Chip,
  Collapse,
  Checkbox,
  LinearProgress,
  Divider,
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

import { indexBoosterService } from '../indexBoosterService';
import type {
  IndexBoosterHistoryItem,
  IndexBoosterQuotaResponse,
  IndexBoosterSubmitResult,
  CheckIndexResult,
} from '../types';
import { useToastify } from '../../../components/Toastify';

// format time GMT+7 DD/MM/YYYY HH:mm
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

interface ExpandableRowProps {
  item: IndexBoosterHistoryItem;
  isSelected: boolean;
  onSelectToggle: () => void;
  onCheckSingleIndex: (url: string) => Promise<void>;
  checkingUrl: string | null;
  indexStatus: CheckIndexResult | undefined;
}

function ExpandableRow({
  item,
  isSelected,
  onSelectToggle,
  onCheckSingleIndex,
  checkingUrl,
  indexStatus,
}: ExpandableRowProps) {
  const [open, setOpen] = useState(false);

  const getOkFailBadge = (ok: number, fail: number) => {
    const total = ok + fail;
    if (total === 0) return <Chip label="0/0" size="small" variant="outlined" />;
    const color = fail === 0 ? 'success' : ok === 0 ? 'error' : 'warning';
    return (
      <Chip
        label={`${ok}/${total} OK`}
        size="small"
        color={color}
        variant="outlined"
        sx={{ fontWeight: 700 }}
      />
    );
  };

  const renderIndexStatusBadge = (status: CheckIndexResult | undefined) => {
    if (!status) {
      return (
        <Chip
          label="Chưa kiểm tra"
          size="small"
          variant="outlined"
          color="default"
          sx={{ fontWeight: 700, borderStyle: 'dashed' }}
        />
      );
    }

    if (status.indexed === true) {
      return (
        <Chip
          label="Đã index"
          size="small"
          color="success"
          sx={{ fontWeight: 800 }}
        />
      );
    }

    if (status.indexed === false) {
      return (
        <Chip
          label="Chưa index"
          size="small"
          color="warning"
          sx={{ fontWeight: 800 }}
        />
      );
    }

    return (
      <Tooltip title={status.error || "Không xác định"} arrow>
        <Chip
          label="Không xác định"
          size="small"
          color="default"
          sx={{ fontWeight: 700 }}
        />
      </Tooltip>
    );
  };

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell padding="checkbox">
          <Checkbox checked={isSelected} onChange={onSelectToggle} />
        </TableCell>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Tooltip title={item.url} arrow>
            <Typography
              variant="body2"
              component="a"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {item.url}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell align="center">
          {getOkFailBadge(item.okCount, item.failCount)}
        </TableCell>
        <TableCell align="center">
          {renderIndexStatusBadge(indexStatus)}
        </TableCell>
        <TableCell align="center">
          {formatVnTime(item.createdAt)}
        </TableCell>
        <TableCell align="right">
          <Button
            size="small"
            variant="outlined"
            onClick={() => onCheckSingleIndex(item.url)}
            disabled={checkingUrl === item.url}
            startIcon={
              checkingUrl === item.url ? (
                <CircularProgress size={12} color="inherit" />
              ) : (
                <PageviewIcon />
              )
            }
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Check SERP
          </Button>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2, bgcolor: 'action.hover', borderRadius: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                🎯 Trạng thái chi tiết từng kênh
              </Typography>
              <Grid container spacing={2}>
                {/* Hub */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                        KÊNH 1: HUB PAGE
                      </Typography>
                      {item.results?.hub ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Đã đưa vào hub</Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            component="a"
                            href={item.results.hub.hubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: 'primary.main',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.2,
                              wordBreak: 'break-all',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            Xem trang mồi <OpenInNewIcon sx={{ fontSize: 10 }} />
                          </Typography>
                          {item.results.hub.reused && (
                            <Chip label="Dùng lại slug" size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                          )}
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <HelpOutlinedIcon color="disabled" sx={{ fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary">Bỏ qua/Không cấu hình</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Decoy */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                        KÊNH 2: DECOY 302
                      </Typography>
                      {item.results?.forceIndex ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Kích hoạt decoy</Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            component="a"
                            href={item.results.forceIndex.decoyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: 'primary.main',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.2,
                              wordBreak: 'break-all',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            Xem link decoy <OpenInNewIcon sx={{ fontSize: 10 }} />
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <HelpOutlinedIcon color="disabled" sx={{ fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary">Bỏ qua/Không cấu hình</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* IndexNow */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                        KÊNH 3: INDEXNOW
                      </Typography>
                      {item.results?.indexNow ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {Object.entries(item.results.indexNow)
                            .filter(([key]) => key !== '_verified')
                            .map(([engine, status]) => (
                              <Box key={engine} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 650 }}>{engine}:</Typography>
                                <Typography
                                  variant="caption"
                                  color={status.includes('error') ? 'error.main' : 'success.main'}
                                  sx={{ fontWeight: 600, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                >
                                  {status}
                                </Typography>
                              </Box>
                            ))}
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', mt: 0.5 }}>
                            Verify: {item.results.indexNow._verified || 'no'}
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <HelpOutlinedIcon color="disabled" sx={{ fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary">Không hỗ trợ</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Ping */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                        KÊNH 4: PING XML-RPC
                      </Typography>
                      {item.results?.ping ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {Object.entries(item.results.ping).map(([service, status]) => (
                            <Box key={service} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 650, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {service.replace('rpc.', '').replace('.com', '')}:
                              </Typography>
                              <Typography
                                variant="caption"
                                color={status === 'ok' ? 'success.main' : 'error.main'}
                                sx={{ fontWeight: 600 }}
                              >
                                {status}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <HelpOutlinedIcon color="disabled" sx={{ fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary">Không hỗ trợ</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

interface IndexBoosterPageProps {
  isActive?: boolean;
}

export default function IndexBoosterPage({ isActive = true }: IndexBoosterPageProps) {
  const { showToast } = useToastify();

  // Form Inputs
  const [urlsInput, setUrlsInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitResults, setSubmitResults] = useState<IndexBoosterSubmitResult[] | null>(null);

  // Table States
  const [limit, setLimit] = useState(20);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [checkingUrl, setCheckingUrl] = useState<string | null>(null);
  const [isCheckingBulk, setIsCheckingBulk] = useState(false);
  const [indexStatuses, setIndexStatuses] = useState<Record<string, CheckIndexResult>>({});

  // SWR fetching for Quota Status
  const {
    data: quotaData,
    error: quotaError,
    mutate: mutateQuota,
  } = useSWR('/api/v1/index-booster/quota-status', () => indexBoosterService.getQuotaStatus(), {
    revalidateOnFocus: false,
    refreshInterval: isActive ? 60000 : 0, // every 1 min if active, else disabled
  });

  // SWR fetching for History
  const {
    data: historyData,
    error: historyError,
    mutate: mutateHistory,
  } = useSWR(
    ['/api/v1/index-booster/history', limit],
    () => indexBoosterService.getHistory(limit),
    {
      revalidateOnFocus: false,
    }
  );

  // Form URL validation & parsing
  const parsedUrls = urlsInput
    .split('\n')
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  const uniqueUrls = Array.from(new Set(parsedUrls));

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (uniqueUrls.length === 0) {
      setSubmitError('Vui lòng nhập ít nhất 1 URL');
      return;
    }

    if (uniqueUrls.length > 50) {
      setSubmitError('Chỉ hỗ trợ tối đa 50 URL cùng lúc');
      return;
    }

    // Check protocol
    for (const url of uniqueUrls) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        setSubmitError(`URL không hợp lệ: "${url}". Phải bắt đầu bằng http:// hoặc https://`);
        return;
      }
      try {
        new URL(url);
      } catch {
        setSubmitError(`Định dạng URL sai: "${url}"`);
        return;
      }
    }

    setSubmitError('');
    setIsSubmitting(true);
    setSubmitResults(null);

    try {
      const res = await indexBoosterService.submitUrls(uniqueUrls, topicInput.trim() || undefined);
      showToast(`Đã kích hoạt ép index ${res.count} URL thành công!`, 'success');
      setSubmitResults(res.results);
      setUrlsInput('');
      setTopicInput('');
      mutateHistory();
      mutateQuota();
    } catch (err: any) {
      console.error('Submit booster failed:', err);
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi yêu cầu';
      showToast(msg, 'danger');
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check single URL index status
  const handleCheckSingleIndex = async (url: string) => {
    if (checkingUrl) return;
    setCheckingUrl(url);
    try {
      const res = await indexBoosterService.checkIndex([url], 'apify');
      const result = res.results.find((r) => r.url === url);
      if (result) {
        setIndexStatuses((prev) => ({ ...prev, [url]: result }));
        if (result.indexed === true) {
          showToast(`URL đã được Google index!`, 'success');
        } else if (result.indexed === false) {
          showToast(`URL chưa được index trên Google.`, 'warning');
        } else {
          showToast(`Không xác định được trạng thái index (null).`, 'info');
        }
      }
    } catch (err: any) {
      console.error('Check index failed:', err);
      showToast('Gặp lỗi khi kiểm tra index trên SERP', 'danger');
    } finally {
      setCheckingUrl(null);
    }
  };

  // Bulk index check
  const handleCheckBulkIndex = async () => {
    if (selectedUrls.length === 0 || isCheckingBulk) return;
    setIsCheckingBulk(true);
    showToast(`Đang kiểm tra index cho ${selectedUrls.length} URL...`, 'info');
    try {
      const res = await indexBoosterService.checkIndex(selectedUrls, 'apify');
      const newStatuses = { ...indexStatuses };
      res.results.forEach((r) => {
        newStatuses[r.url] = r;
      });
      setIndexStatuses(newStatuses);
      showToast(
        `Đã check xong! Index: ${res.summary.indexed}/${res.summary.total}, Chưa index: ${res.summary.notIndexed}`,
        res.summary.indexed > 0 ? 'success' : 'info'
      );
      setSelectedUrls([]);
    } catch (err: any) {
      console.error('Bulk index check failed:', err);
      showToast('Gặp lỗi khi kiểm tra index hàng loạt', 'danger');
    } finally {
      setIsCheckingBulk(false);
    }
  };

  const handleSelectAllToggle = (checked: boolean) => {
    if (checked) {
      const allUrls = (historyData?.items || []).map((item) => item.url);
      setSelectedUrls(allUrls);
    } else {
      setSelectedUrls([]);
    }
  };

  const handleSelectToggle = (url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const handleRefreshAll = () => {
    mutateHistory();
    mutateQuota();
    showToast('Đã làm mới dữ liệu!', 'success');
  };

  // Color mappings for channels in cards
  const renderChannelRow = (
    channelName: string,
    data: any,
    linkField?: string,
    linkText?: string
  ) => {
    if (!data) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
          <Typography variant="body2" color="text.secondary">{channelName}</Typography>
          <Chip label="Skipped" size="small" variant="outlined" sx={{ height: 20, color: 'text.secondary' }} />
        </Box>
      );
    }

    const hasError = data.error || (data.status && data.status.includes('error'));
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{channelName}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {linkField && data[linkField] ? (
            <Typography
              variant="caption"
              component="a"
              href={data[linkField]}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 0.2,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {linkText || 'Xem link'} <OpenInNewIcon sx={{ fontSize: 10 }} />
            </Typography>
          ) : null}
          <Chip
            label={hasError ? 'Lỗi' : 'Kích hoạt'}
            size="small"
            color={hasError ? 'error' : 'success'}
            sx={{ height: 20, fontWeight: 700 }}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Top Header Widget: Quota status */}
      {quotaError ? (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          Không thể đồng bộ trạng thái Quota từ hệ thống.
        </Alert>
      ) : !quotaData ? (
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 4 }} />
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: '1px solid',
            borderColor: quotaData.totalRemaining === 0 ? 'warning.main' : 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                  ⚡ Quota Indexing API hôm nay
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, mt: 0.5, color: quotaData.totalRemaining === 0 ? 'warning.main' : 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  {quotaData.totalRemaining} <span style={{ fontSize: '1.2rem', color: '#888', fontWeight: 550 }}>còn lại</span>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Tổng số tài khoản dịch vụ hoạt động: {quotaData.accountsCount} ({quotaData.dailyQuotaPerAccount} req/SA)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              {quotaData.totalRemaining === 0 ? (
                <Alert severity="warning" variant="outlined" icon={<WarningAmberIcon />} sx={{ borderRadius: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Hết quota Indexing API hôm nay</Typography>
                  Các URL mới thêm vào hàng đợi sẽ chỉ kích hoạt IndexNow, Ping XML-RPC và Hub page. Google Indexing API sẽ tiếp tục chạy khi reset quota.
                </Alert>
              ) : (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Trạng thái phân phối tài khoản (Round Robin):</Typography>
                  <Grid container spacing={2}>
                    {quotaData.accounts.map((acct, idx) => {
                      const percent = acct.limit > 0 ? (acct.used / acct.limit) * 100 : 0;
                      return (
                        <Grid item xs={12} sm={6} key={acct.account}>
                          <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: 'action.hover' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Tooltip title={acct.account} arrow>
                                <Typography variant="caption" sx={{ fontWeight: 700, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  SA #{idx + 1} ({acct.projectId})
                                </Typography>
                              </Tooltip>
                              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                {acct.used}/{acct.limit}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={percent}
                              color={percent > 90 ? 'error' : percent > 70 ? 'warning' : 'primary'}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Main Submit Panel */}
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
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BoltIcon sx={{ color: '#00b894', fontSize: 28 }} /> Kích hoạt ép Index Booster
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
          Bắn đồng thời 4 kênh: <strong>Trang mồi Hub dofollow (JobPosting schema)</strong>, <strong>Decoy 302 redirect</strong>, <strong>IndexNow (Bing/Yandex)</strong>, và <strong>Ping XML-RPC</strong>.
        </Typography>

        <Box component="form" onSubmit={handleFormSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8.5}>
              <TextField
                label="Danh sách URL cần ép index (Mỗi dòng 1 URL, tối đa 50 URL)"
                placeholder="https://luatvietnam.vn/abc.html&#10;https://xavia.cloud/b"
                multiline
                rows={5}
                fullWidth
                variant="outlined"
                value={urlsInput}
                onChange={(e) => {
                  setUrlsInput(e.target.value);
                  if (submitError) setSubmitError('');
                }}
                disabled={isSubmitting}
                helperText={`Đã nhận dạng: ${uniqueUrls.length} URL duy nhất / 50 URL tối đa`}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3.5,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={3.5} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 2 }}>
              <TextField
                label="Chủ đề / Gom nhóm (Topic - tuỳ chọn)"
                placeholder="phap-luat"
                fullWidth
                variant="outlined"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                disabled={isSubmitting}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3.5,
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isSubmitting || uniqueUrls.length === 0}
                startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ transform: 'rotate(-45deg)' }} />}
                sx={{
                  py: 1.8,
                  borderRadius: 3.5,
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
                {isSubmitting ? 'Đang kích hoạt...' : 'Ép index tổng lực'}
              </Button>
            </Grid>
          </Grid>

          {submitError && (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {submitError}
            </Alert>
          )}

          <Alert severity="info" variant="outlined" icon={<InfoOutlinedIcon />} sx={{ borderRadius: 3 }}>
            Indexing API chạy nền xếp hàng (queue 30–90s/URL), backend sẽ tự động re-submit liên tục trong vòng 3 ngày tới cho đến khi URL được index. Bạn có thể kiểm tra lại sau vài giờ.
          </Alert>
        </Box>
      </Paper>

      {/* Render Submit Results right after submission */}
      {submitResults && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'success.light',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
            🎉 Kết quả ép index đợt vừa gửi ({submitResults.length} URL)
          </Typography>
          <Grid container spacing={2}>
            {submitResults.map((res) => (
              <Grid item xs={12} md={6} key={res.url}>
                <Card variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
                      <Tooltip title={res.url} arrow>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, wordBreak: 'break-all', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>
                          {res.url}
                        </Typography>
                      </Tooltip>
                      <Chip
                        label={`${res.okCount}/${res.okCount + res.failCount} OK`}
                        size="small"
                        color={res.failCount === 0 ? 'success' : 'warning'}
                        sx={{ fontWeight: 800 }}
                      />
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {renderChannelRow('Kênh 1: Hub Page', res.results.hub, 'hubUrl', 'Xem trang mồi')}
                      {renderChannelRow('Kênh 2: Decoy 302', res.results.forceIndex, 'decoyUrl', 'Xem decoy')}
                      {renderChannelRow('Kênh 3: IndexNow', res.results.indexNow)}
                      {renderChannelRow('Kênh 4: Ping XML-RPC', res.results.ping)}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                      {res.note}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* History table */}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            🕰️ Lịch sử ép index tổng lực
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            {selectedUrls.length > 0 && (
              <Button
                variant="contained"
                color="secondary"
                disabled={isCheckingBulk}
                onClick={handleCheckBulkIndex}
                startIcon={isCheckingBulk ? <CircularProgress size={16} color="inherit" /> : <PageviewIcon />}
                sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 700 }}
              >
                Check index chọn ({selectedUrls.length})
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={handleRefreshAll}
              startIcon={<RefreshIcon />}
              sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 750 }}
            >
              Làm mới
            </Button>
          </Box>
        </Box>

        {historyError ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            Lỗi khi lấy dữ liệu lịch sử từ API.
          </Alert>
        ) : !historyData ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedUrls.length > 0 &&
                        selectedUrls.length < historyData.items.length
                      }
                      checked={
                        historyData.items.length > 0 &&
                        selectedUrls.length === historyData.items.length
                      }
                      onChange={(e) => handleSelectAllToggle(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell style={{ width: 50 }} />
                  <TableCell sx={{ fontWeight: 750 }}>Liên kết (Target URL)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 750 }}>Kênh OK</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 750 }}>Trạng thái Index</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 750 }}>Thời gian gửi</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 750 }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyData.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Chưa có lịch sử ép index nào được ghi nhận.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  historyData.items.map((item) => (
                    <ExpandableRow
                      key={item._id}
                      item={item}
                      isSelected={selectedUrls.includes(item.url)}
                      onSelectToggle={() => handleSelectToggle(item.url)}
                      onCheckSingleIndex={handleCheckSingleIndex}
                      checkingUrl={checkingUrl}
                      indexStatus={indexStatuses[item.url]}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
