import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DoNotDisturbAltOutlinedIcon from '@mui/icons-material/DoNotDisturbAltOutlined';
import { keywordGroupService } from '../../keywords/keywordGroupService';
import { requestService } from '../requestService';
import { useToastify } from '../../../components/Toastify';
import { useRole } from '../../../hooks/useRole';
import type { RequestStatus } from '../types';
import type { KeywordGroupTrends } from '../../keywords/types';
import { TrendLineChart } from '../../keywords/components/TrendLineChart';
import { RelatedQueriesPanel } from '../../keywords/components/RelatedQueriesPanel';
import { RelatedTopicsPanel } from '../../keywords/components/RelatedTopicsPanel';

interface KeywordItem {
  _id: string;
  value: string;
  status: string;
  isAiGenerated: boolean;
}

interface GroupDetail {
  _id: string;
  name: string;
  status: string;
  sourceType: string;
  domain: { domain: string; metaDescription?: string };
  createdBy: { name: string; email: string; imgAvatar?: string };
  reason?: string | null;
  approvalReason?: string | null;
}

interface Props {
  refId: string;
  requestId: string;
  requestStatus: RequestStatus;
  onActionDone: () => void;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_approval: { label: 'Chờ duyệt',      color: '#D97706' },
  not_started:      { label: 'Chưa triển khai', color: 'text.secondary' },
  in_progress:      { label: 'Đang triển khai', color: '#2563EB' },
  deployed:         { label: 'Đã triển khai',   color: '#059669' },
  rejected:         { label: 'Bị từ chối',      color: '#DC2626' },
};

export default function KeywordGroupReviewPanel({ refId, requestId, requestStatus, onActionDone }: Props) {
  const { showToast } = useToastify();
  const canReview = useRole(['REVIEWER', 'MAR_SPECIALIST']);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [trends, setTrends] = useState<KeywordGroupTrends | null>(null);
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);
  const [keywordTotal, setKeywordTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, trendsData] = await Promise.all([
        keywordGroupService.getGroupById(refId),
        keywordGroupService.getGroupTrends(refId),
      ]);
      setGroup(data.group as unknown as GroupDetail);
      setTrends(trendsData);
      setKeywords(data.keywords.items);
      setKeywordTotal(data.keywords.total);
    } catch {
      showToast('Không thể tải thông tin bộ keyword', 'danger');
    } finally {
      setLoading(false);
    }
  }, [refId, showToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async () => {
    if (!group) return;
    setActionLoading(true);
    try {
      await keywordGroupService.approveGroup(refId, undefined, true);
      await requestService.resolve(requestId, { action: 'DONE', note: 'Đã phê duyệt bộ keyword' });
      showToast('Đã phê duyệt bộ keyword', 'success');
      onActionDone();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message || 'Có lỗi xảy ra';
      showToast(Array.isArray(msg) ? msg.join(', ') : String(msg), 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!group || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await keywordGroupService.rejectGroup(refId, rejectReason, true);
      await requestService.resolve(requestId, { action: 'REJECTED', note: rejectReason });
      showToast('Đã từ chối bộ keyword', 'success');
      setRejectOpen(false);
      onActionDone();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message || 'Có lỗi xảy ra';
      showToast(Array.isArray(msg) ? msg.join(', ') : String(msg), 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={28} />
      </Paper>
    );
  }

  if (!group) return null;

  const statusCfg = STATUS_MAP[group.status] ?? { label: group.status, color: 'text.secondary' };
  const isGroupPending = group.status === 'pending_approval';
  const isRequestActive = !['DONE', 'REJECTED', 'CANCELLED'].includes(requestStatus);
  const canAct = canReview && isGroupPending && isRequestActive;

  return (
    <>
      <Paper sx={{ p: 2.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 2 }}>Bộ keyword đính kèm</Typography>

        {/* Group meta */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, mb: 2 }}>
          <Box sx={{ minWidth: 160 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Tên bộ keyword</Typography>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{group.name}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Domain</Typography>
            <Typography sx={{ fontWeight: 500, fontSize: 14 }}>{group.domain?.domain}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Trạng thái</Typography>
            <Box sx={{ mt: 0.25 }}>
              <Chip
                label={statusCfg.label}
                size="small"
                sx={{ bgcolor: `${statusCfg.color}1A`, color: statusCfg.color, fontWeight: 600, fontSize: 11, border: `1px solid ${statusCfg.color}40` }}
              />
            </Box>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Người tạo</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
              <Avatar src={group.createdBy?.imgAvatar} sx={{ width: 22, height: 22, fontSize: 10 }}>
                {group.createdBy?.name?.[0]}
              </Avatar>
              <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{group.createdBy?.name}</Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Số keyword</Typography>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{keywordTotal}</Typography>
          </Box>
        </Box>

        {/* Lý do đề xuất */}
        {group.reason && (
          <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5, mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Lý do đề xuất
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>{group.reason}</Typography>
          </Box>
        )}

        {/* Keyword chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
          {keywords.map((kw) => (
            <Chip key={kw._id} label={kw.value} size="small" variant="outlined" sx={{ fontSize: 12 }} />
          ))}
          {keywordTotal > keywords.length && (
            <Chip label={`+${keywordTotal - keywords.length} từ khoá`} size="small" sx={{ fontSize: 12, color: 'text.secondary' }} />
          )}
        </Box>

        {/* Trends section */}
        {trends && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
              Phân tích xu hướng
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[
                { label: `Điểm hiện tại: ${trends.currentScore}`, color: '#6366f1' },
                { label: `TB: ${trends.avg}`, color: '#0ea5e9' },
                { label: `Xu hướng: ${trends.slope > 0 ? '+' : ''}${trends.slope}`, color: trends.slope > 0 ? '#059669' : '#dc2626' },
                ...(trends.isSpike ? [{ label: 'Spike', color: '#d97706' }] : []),
                ...(trends.isPartial ? [{ label: 'Dữ liệu chưa đầy đủ', color: 'text.secondary' }] : []),
              ].map(({ label, color }) => (
                <Chip key={label} label={label} size="small"
                  sx={{ bgcolor: `${color}18`, color, fontWeight: 600, fontSize: 11, border: `1px solid ${color}40` }}
                />
              ))}
            </Box>

            {trends.trendTimeline.length > 0 && (
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  Biểu đồ xu hướng — {group.name}
                </Typography>
                <TrendLineChart data={trends.trendTimeline} currentScore={trends.currentScore} height={180} showAxes />
              </Box>
            )}

            {(trends.relatedQueries ?? trends.relatedTopics) && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <RelatedQueriesPanel data={trends.relatedQueries} timeRange="3-m" />
                <RelatedTopicsPanel data={trends.relatedTopics} timeRange="3-m" />
              </Box>
            )}
          </Box>
        )}

        {/* Rejection reason */}
        {group.status === 'rejected' && group.approvalReason && (
          <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 1.5, border: '1px solid #fecaca', mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 600 }}>Lý do từ chối</Typography>
            <Typography variant="body2" sx={{ color: '#DC2626', mt: 0.25 }}>{group.approvalReason}</Typography>
          </Box>
        )}

        {/* Approved note */}
        {['not_started', 'in_progress', 'deployed'].includes(group.status) && (
          <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 1.5, border: '1px solid #bbf7d0', mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600 }}>Đã được phê duyệt</Typography>
          </Box>
        )}

        {/* Action buttons */}
        {canAct && (
          <Box sx={{ display: 'flex', gap: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={actionLoading ? <CircularProgress size={14} color="inherit" /> : <CheckCircleOutlinedIcon />}
              onClick={handleApprove}
              disabled={actionLoading}
              sx={{ borderRadius: '100px', height: 36, px: 2.5, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}
            >
              Phê duyệt
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DoNotDisturbAltOutlinedIcon />}
              onClick={() => { setRejectReason(''); setRejectOpen(true); }}
              disabled={actionLoading}
              sx={{ borderRadius: '100px', height: 36, px: 2.5, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}
            >
              Từ chối
            </Button>
          </Box>
        )}
      </Paper>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '28px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Từ chối bộ keyword</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5, maxHeight: '70vh', overflowY: 'auto' }}>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Bộ: <strong>{group.name}</strong>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Lý do từ chối *"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Từ khoá chưa phù hợp với chiến lược..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setRejectOpen(false)} sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>Huỷ</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={actionLoading || !rejectReason.trim()}
            sx={{ borderRadius: '100px', height: 40, px: 3, textTransform: 'none', fontWeight: 700, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }}
          >
            {actionLoading ? 'Đang từ chối...' : 'Xác nhận từ chối'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
