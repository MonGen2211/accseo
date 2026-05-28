import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box, Typography, CircularProgress, Button, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface TrendResponseData {
  keyword: string;
  geo: string;
  timeframe: string;
  success: boolean;
  totalPoints: number;
  dataPoints: TrendDataPoint[];
  peak: { value: number; date: string } | null;
}

export interface TrendCacheEntry {
  loading: boolean;
  data: TrendResponseData | null;
  error: string | null;
}

interface GoogleTrendsModalProps {
  open: boolean;
  onClose: () => void;
  keyword: string | null;
  activeEntry: TrendCacheEntry | null;
  onRefresh: (kw: string) => void;
}

const loadingMessages = [
  "Đang khởi động trình duyệt tàng hình...",
  "Đang giả lập thao tác người dùng thực...",
  "Đang vượt qua hệ thống bảo mật của Google...",
  "Đang nhờ hệ thống AI giải mã Captcha ẩn...",
  "Đang truy cập trang Google Trends...",
  "Đang thu thập và phân tích biểu đồ...",
  "Sắp xong rồi, chờ xíu nha bạn êy..."
];

const FancyLoader = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      height: 350, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider',
      background: 'radial-gradient(circle at center, #f8fafc 0%, #ffffff 100%)'
    }}>
      <Box sx={{ position: 'relative', width: 90, height: 90, mb: 4 }}>
        <CircularProgress size={90} thickness={2} sx={{ color: '#e2e8f0', position: 'absolute', top: 0, left: 0 }} />
        <CircularProgress 
          size={90} 
          thickness={4} 
          sx={{ 
            color: '#3b82f6', 
            position: 'absolute', 
            top: 0, left: 0,
            animationDuration: '2s'
          }} 
          disableShrink 
        />
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingUpIcon sx={{ fontSize: 40, color: '#2563eb', animation: 'pulseTrend 1.5s infinite ease-in-out' }} />
        </Box>
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', mb: 1, letterSpacing: '-0.5px' }}>
        Đang phân tích dữ liệu...
      </Typography>
      <Box sx={{ height: 24, overflow: 'hidden' }}>
        <Typography 
          color="text.secondary" 
          sx={{ 
            fontWeight: 500,
            animation: 'fadeInOutMsg 4s infinite' 
          }}
        >
          {loadingMessages[msgIndex]}
        </Typography>
      </Box>

      <style>
        {`
          @keyframes pulseTrend {
            0% { transform: scale(0.85); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; color: #1d4ed8; }
            100% { transform: scale(0.85); opacity: 0.8; }
          }
          @keyframes fadeInOutMsg {
            0% { opacity: 0; transform: translateY(10px); }
            10% { opacity: 1; transform: translateY(0); }
            90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
          }
        `}
      </style>
    </Box>
  );
};

const TrendView = ({ keyword, entry, onRefresh }: { keyword: string; entry: TrendCacheEntry; onRefresh: () => void }) => {
  const { loading, data, error } = entry;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', flex: 1 }}>
          Mức độ quan tâm theo thời gian ({keyword})
        </Typography>
        <Button 
          size="small" 
          startIcon={<RefreshIcon fontSize="small" />} 
          onClick={onRefresh}
          disabled={loading}
          sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.8rem' }}
        >
          {loading ? 'Đang tải...' : 'Tải lại'}
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr' }, gap: 3 }}>
        
        {loading && <FancyLoader />}

        {error && !loading && (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        )}

        {!loading && data && data.dataPoints && data.dataPoints.length > 0 && (
          <Box sx={{ position: 'relative', width: '100%', height: 350, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 2, pt: 3 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dataPoints} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: '#757575' }} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => val.split(',')[0]}
                  minTickGap={30}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#757575' }} 
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                  labelStyle={{ fontWeight: 600, color: '#333', marginBottom: 4 }}
                  formatter={(value: any) => [value, 'Mức độ quan tâm']}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#1976d2" 
                  strokeWidth={2.5} 
                  dot={false}
                  activeDot={{ r: 6, fill: '#1976d2', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}

        {!loading && data && (!data.dataPoints || data.dataPoints.length === 0) && (
          <Alert severity="info" sx={{ my: 2 }}>Không có đủ dữ liệu Google Trends cho từ khóa này.</Alert>
        )}
      </Box>
    </Box>
  );
};

export default function GoogleTrendsModal({ open, onClose, keyword, activeEntry, onRefresh }: GoogleTrendsModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth sx={{ '& .MuiDialog-paper': { bgcolor: 'background.default', backgroundImage: 'none', height: '90vh' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Google Trends</Typography>
          <Typography variant="body2" color="text.secondary">
            Từ khóa: <Typography component="span" sx={{ fontWeight: 700 }} color="primary">{keyword}</Typography> (3 tháng qua)
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3, bgcolor: 'background.paper', overflowY: 'auto' }}>
        {keyword && activeEntry ? (
          <TrendView 
            keyword={keyword} 
            entry={activeEntry} 
            onRefresh={() => onRefresh(keyword)} 
          />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
