import { useState, useEffect } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TimelineIcon from '@mui/icons-material/Timeline';
import HistoryIcon from '@mui/icons-material/History';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { scraperService } from '../scraperService';
import type { ScraperRun } from '../types';
import ScraperHealthDebugDetails from './ScraperHealthDebugDetails';

interface ScraperHealthHistoryDrawerProps {
  source: string | null;
  open: boolean;
  onClose: () => void;
}

const ANOMALY_MAP: Record<string, { label: string; color: 'error' | 'warning' }> = {
  BREAKAGE: { label: 'Scraper ném lỗi (gãy)', color: 'error' },
  ZERO_OUTPUT: { label: 'Không ra bài nào', color: 'error' },
  LOW_OUTPUT: { label: 'Sản lượng tụt mạnh', color: 'warning' },
  NO_NEW: { label: 'Không có bài mới', color: 'warning' },
  DRIFT_TITLE: { label: 'Lệch Tiêu đề', color: 'warning' },
  DRIFT_PUBLISHEDAT: { label: 'Lệch Ngày đăng', color: 'warning' },
  DRIFT_TAGS: { label: 'Lệch Tags', color: 'warning' },
  DRIFT_METADATA: { label: 'Lệch Metadata', color: 'warning' },
  COVERAGE_GAP: { label: 'Thiếu Parser chuyên mục mới', color: 'warning' },
};

export default function ScraperHealthHistoryDrawer({ source, open, onClose }: ScraperHealthHistoryDrawerProps) {
  const [runs, setRuns] = useState<ScraperRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [anomaliesOnly, setAnomaliesOnly] = useState(false);
  const [limit, setLimit] = useState(50);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!source) return;
    setLoading(true);
    try {
      const response = await scraperService.getHealthRuns(source, {
        limit,
        anomaliesOnly,
      });
      setRuns(response.runs);
    } catch (error) {
      console.error('Lỗi tải lịch sử runs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && source) {
      fetchHistory();
    }
  }, [open, source, anomaliesOnly, limit]);

  // Chuẩn bị dữ liệu vẽ chart (đảo từ cũ -> mới)
  const chartData = [...runs].reverse().map((run) => {
    const timeLabel = format(new Date(run.createdAt), 'HH:mm dd/MM');
    return {
      name: timeLabel,
      total: run.total,
      inserted: run.inserted,
      baselineTotal: run.baselineTotal || 0,
      fillRateTitle: run.fillRates?.title ? Math.round(run.fillRates.title * 100) : 0,
      fillRatePublishedAt: run.fillRates?.publishedAt ? Math.round(run.fillRates.publishedAt * 100) : 0,
      fillRateTags: run.fillRates?.tags ? Math.round(run.fillRates.tags * 100) : 0,
      fillRateMetadata: run.fillRates?.metadata ? Math.round(run.fillRates.metadata * 100) : 0,
      anomalies: run.anomalies,
      rawDate: run.createdAt,
    };
  });

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload && payload.anomalies && payload.anomalies.length > 0) {
      const hasCritical = payload.anomalies.some((code: string) => code === 'BREAKAGE' || code === 'ZERO_OUTPUT');
      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill={hasCritical ? '#d32f2f' : '#ed6c02'}
          stroke="#fff"
          strokeWidth={2}
          style={{ cursor: 'pointer' }}
        />
      );
    }
    return <circle cx={cx} cy={cy} r={3.5} fill="#10b981" stroke="#fff" strokeWidth={1} />;
  };

  const handleRowClick = (runId: string) => {
    setExpandedRunId(expandedRunId === runId ? null : runId);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: { sx: { bgcolor: 'rgba(0, 0, 0, 0.4)' } }
      }}
      PaperProps={{
        sx: {
          width: { xs: '100%', md: 620 },
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            Lịch sử hoạt động
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
            Nguồn cào: {source}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Filters Area */}
      <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, bgcolor: 'action.hover' }}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={anomaliesOnly}
              onChange={(e) => setAnomaliesOnly(e.target.checked)}
              color="error"
            />
          }
          label={
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Chỉ hiện chạy lỗi / cảnh báo
            </Typography>
          }
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            Số lượt hiển thị:
          </Typography>
          <Select
            size="small"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            sx={{ height: 28, fontSize: '0.75rem', fontWeight: 600 }}
          >
            <MenuItem value={20}>20 lượt</MenuItem>
            <MenuItem value={50}>50 lượt</MenuItem>
            <MenuItem value={100}>100 lượt</MenuItem>
          </Select>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        variant="fullWidth"
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          '& .MuiTab-root': { py: 1.5, minHeight: 48, fontWeight: 700, fontSize: '0.78rem', textTransform: 'none' },
        }}
      >
        <Tab icon={<TimelineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Biểu đồ & Xu hướng" />
        <Tab icon={<WarningAmberIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Danh sách runs lỗi" />
      </Tabs>

      {/* Content Area */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress size={36} />
          </Box>
        ) : runs.length === 0 ? (
          <Box sx={{ py: 10, textAlign: 'center', color: 'text.secondary' }}>
            <WarningAmberIcon sx={{ fontSize: 44, mb: 1, opacity: 0.3 }} />
            <Typography variant="body2">Không tìm thấy lượt chạy nào khớp bộ lọc.</Typography>
          </Box>
        ) : activeTab === 0 ? (
          /* TAB 1: CHARTS */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Chart 1: Sản lượng */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary' }}>
                Biểu đồ Sản lượng bài viết (Total & Inserted vs Baseline)
              </Typography>
              <Box sx={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <RechartsTooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      formatter={(value: any, name: any, props: any) => {
                        if (name === 'anomalies' && value) {
                          if (value.length === 0) return null;
                          return [value.map((code: string) => ANOMALY_MAP[code]?.label || code).join(', '), 'Bất thường'];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#3b82f6"
                      name="Tổng số bài cào"
                      strokeWidth={2}
                      dot={<CustomDot />}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="inserted"
                      stroke="#10b981"
                      name="Bài viết mới"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="baselineTotal"
                      stroke="#f59e0b"
                      name="Baseline sản lượng"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic', textAlign: 'center' }}>
                * Chấm đỏ/vàng biểu thị lượt chạy phát hiện bất thường (Hover vào điểm để xem mã lỗi).
              </Typography>
            </Box>

            <Divider />

            {/* Chart 2: Fill Rates */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary' }}>
                Biểu đồ Độ đầy đủ dữ liệu (Fill Rates)
              </Typography>
              <Box sx={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                    <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(val) => [`${val}%`]} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="fillRatePublishedAt" stroke="#8b5cf6" name="Ngày đăng" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="fillRateTags" stroke="#ec4899" name="Thẻ (Tags)" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="fillRateMetadata" stroke="#06b6d4" name="Metadata" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="fillRateTitle" stroke="#3b82f6" name="Tiêu đề" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Box>
        ) : (
          /* TAB 2: RUNS TABLE WITH DETAILS COLLAPSIBLE */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Danh sách runs ghi nhận cảnh báo
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 35 }} />
                    <TableCell sx={{ fontWeight: 700 }}>Thời gian chạy</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Trạng thái cảnh báo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {runs.map((run) => {
                    const isExpanded = expandedRunId === run._id;
                    const dateStr = format(new Date(run.createdAt), 'HH:mm:ss - dd/MM/yyyy', { locale: vi });
                    return (
                      <>
                        <TableRow
                          key={run._id}
                          hover
                          onClick={() => handleRowClick(run._id)}
                          sx={{ cursor: 'pointer', '& > *': { borderBottom: 'unset' } }}
                        >
                          <TableCell>
                            <IconButton size="small">
                              {isExpanded ? <KeyboardArrowDownIcon /> : <ArrowForwardIosIcon sx={{ fontSize: 10 }} />}
                            </IconButton>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {dateStr}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {run.anomalies.length > 0 ? (
                                run.anomalies.map((code) => {
                                  const config = ANOMALY_MAP[code] || { label: code, color: 'warning' };
                                  return (
                                    <Chip
                                      key={code}
                                      label={config.label}
                                      size="small"
                                      color={config.color}
                                      variant="outlined"
                                      sx={{ fontSize: '0.62rem', height: 20 }}
                                    />
                                  );
                                })
                              ) : (
                                <Chip
                                  label="Không phát hiện lỗi"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ fontSize: '0.62rem', height: 20 }}
                                />
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>

                        {/* Collapsible Details Row */}
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
                            {isExpanded && (
                              <Box sx={{ py: 2, px: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0,0,0,0.01)' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5 }}>
                                  Chi tiết kỹ thuật lượt chạy ({dateStr})
                                </Typography>
                                <ScraperHealthDebugDetails data={run} />
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
