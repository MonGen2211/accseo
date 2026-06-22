import ActivitySection from './ActivitySection';
import AndroidIcon from '@mui/icons-material/Android';
import LinkIcon from '@mui/icons-material/Link';
import DnsIcon from '@mui/icons-material/Dns';
import PlaceIcon from '@mui/icons-material/Place';
import PsychologyIcon from '@mui/icons-material/Psychology';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import PublicIcon from '@mui/icons-material/Public';
import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CallSplitOutlinedIcon from '@mui/icons-material/CallSplitOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SearchIcon from '@mui/icons-material/Search';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import CloudSyncOutlinedIcon from '@mui/icons-material/CloudSyncOutlined';
import { useState, useEffect, lazy, Suspense } from 'react';
import type { Theme, SxProps } from '@mui/material';
import LogoImage from '../../assets/Logo/Logo.png';

const TrendingKeywordsSection = lazy(() => import('./TrendingKeywordsSection'));
const VbplSuggestionsSection = lazy(() => import('./components/vbpl/VbplSuggestionsSection'));
const KeywordPlannerSection = lazy(() => import('./KeywordPlannerSection'));
const QuickSerpChecker = lazy(() => import('./QuickSerpChecker'));
const GoogleIndexChecker = lazy(() => import('./GoogleIndexChecker'));
const ScraperSection = lazy(() => import('../scraper/components/ScraperSection'));
const ScraperHealthSection = lazy(() => import('../scraper/components/ScraperHealthSection'));
const UrlScraperSection = lazy(() => import('../url-scraper/components/UrlScraperSection'));
const ContentAnalysisSection = lazy(() => import('../content-analysis/components/ContentAnalysisSection'));
const ForceIndexUnifiedSection = lazy(() => import('../force-index/components/ForceIndexUnifiedSection'));
const SeoAuditSection = lazy(() => import('../seo-audit/components/SeoAuditSection'));
const GeoTagSection = lazy(() => import('../geo-tag/components/GeoTagSection'));
const UsageStatsSection = lazy(() => import('./UsageStatsSection'));
const DomainPage = lazy(() => import('../domains/components/DomainPage'));
const RequestsPage = lazy(() => import('../requests/components/RequestsPage'));
const UserPage = lazy(() => import('../users/components/UserPage'));
import { useNavigate, useLocation } from 'react-router-dom';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import { domainService } from '../domains/domainService';
import { keywordGroupService } from '../keywords/keywordGroupService';
import { ga4Service } from '../keywords/ga4Service';
import { requestService } from '../requests/requestService';
import type { Ga4OverviewData } from '../keywords/ga4Types';
import type { Domain } from '../../types/domain.types';
import type { KeywordGroup } from '../keywords/types';
import type { Request } from '../requests/types';
import { useToastify } from '../../components/Toastify';
import { useAppSelector, useAppDispatch } from '../../app/store';
import { markAsRead } from '../notifications/notificationSlice';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { StatusBadge, TypeBadge, getDueDateInfo } from '../requests/components/RequestBadges';

// MiniButton helper for rendering miniature inline buttons in the guides
interface MiniButtonProps {
  label: string;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'grey';
  gradient?: 'orange' | 'green' | 'blue';
  icon?: React.ReactNode;
  sx?: SxProps<Theme>;
}

function MiniButton({ label, variant = 'contained', color = 'primary', gradient, icon, sx }: MiniButtonProps) {
  let bgcolor: string | ((theme: Theme) => string) | undefined = undefined;
  let bgGradient = undefined;
  let textColor: string | ((theme: Theme) => string) = 'white';
  let border: string | ((theme: Theme) => string) | undefined = undefined;

  if (gradient === 'orange') {
    bgGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
  } else if (gradient === 'green') {
    bgGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  } else if (gradient === 'blue') {
    bgGradient = 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)';
  }

  if (variant === 'contained' && !bgGradient) {
    if (color === 'primary') bgcolor = '#2563EB';
    else if (color === 'success') bgcolor = '#10b981';
    else if (color === 'warning') bgcolor = '#f59e0b';
    else if (color === 'error') bgcolor = '#ef4444';
    else if (color === 'info') bgcolor = '#38bdf8';
    else if (color === 'grey') {
      bgcolor = (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
      textColor = (theme: Theme) => theme.palette.mode === 'dark' ? '#34d399' : '#059669';
      border = (theme: Theme) => theme.palette.mode === 'dark' ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(5,150,105,0.15)';
    }
  } else if (variant === 'outlined') {
    textColor = color === 'primary' ? '#2563EB' : (color === 'success' ? '#10b981' : (color === 'warning' ? '#f59e0b' : (color === 'error' ? '#ef4444' : '#38bdf8')));
    border = `1px solid ${textColor}`;
    bgcolor = 'transparent';
  }

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        px: 1,
        py: 0.2,
        mx: 0.4,
        borderRadius: 1.5,
        fontSize: '0.7rem',
        fontWeight: 800,
        textTransform: 'none',
        background: bgGradient || bgcolor,
        color: textColor,
        border: border,
        boxShadow: variant === 'contained' && color !== 'grey' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
        verticalAlign: 'middle',
        userSelect: 'none',
        lineHeight: 1.2,
        ...sx
      }}
    >
      {icon}
      {label}
    </Box>
  );
}

const TAB_GUIDES: Record<string, { title: string; content: React.ReactNode }> = {
  overview: {
    title: 'Tổng quan & Báo cáo (Dashboard Overview)',
    content: (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
          HƯỚNG DẪN SỬ DỤNG BẢNG ĐIỀU KHIỂN TỔNG QUAN
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Trang <strong>Tổng quan & Báo cáo</strong> là trung tâm giám sát sức khỏe SEO của toàn bộ hệ thống website. Giao diện được thiết kế gồm 3 phần chính: Hệ thống thẻ chỉ số (Stat Cards), Bảng phân tích chi tiết động (Dynamic Panel) ở bên phải, và các báo cáo lịch sử ở phía dưới.
        </Typography>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          📊 1. HỆ THỐNG THỂ CHỈ SỐ (STAT CARDS)
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Mạng lưới 9 thẻ chỉ số tóm tắt nhanh các dữ liệu quan trọng. Trong đó có 4 thẻ <strong>tương tác được</strong> (bấm vào sẽ thay đổi nội dung hiển thị của Bảng phân tích bên phải):
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>DOMAIN QUẢN LÝ:</strong> Hiển thị tổng số tên miền đang theo dõi. 
            <br />
            <span style={{ color: '#2563eb', fontWeight: 600 }}>👉 Hành động:</span> Nhấp chọn để mở bảng báo cáo lưu lượng truy cập Google Analytics (GA4) bên phải.
          </li>
          <li>
            <strong>YÊU CẦU CẦN XỬ LÝ:</strong> Hiển thị số lượng tác vụ cào báo chí, phân tách từ khóa, hoặc tối ưu nội dung đang chờ xử lý.
            <br />
            <span style={{ color: '#2563eb', fontWeight: 600 }}>👉 Hành động:</span> Nhấp chọn để mở hòm thư Inbox tác vụ, xem hạn chót và nhấn <MiniButton label="Xem chi tiết" color="primary" /> để chuyển hướng xử lý.
          </li>
          <li>
            <strong>BÀI VIẾT ĐÃ INDEX / CHƯA INDEX:</strong> Tỷ lệ lập chỉ mục của các trang bài viết của bạn trên Google Search (Không thể click).
          </li>
          <li>
            <strong>BỘ TỪ KHOÁ TRIỂN KHAI:</strong> Tổng số nhóm từ khóa đã được duyệt để viết bài SEO.
            <br />
            <span style={{ color: '#2563eb', fontWeight: 600 }}>👉 Hành động:</span> Nhấp chọn để xem danh sách nhóm từ khóa đã triển khai bên phải theo từng tên miền.
          </li>
          <li>
            <strong>BỘ TỪ KHOÁ CHỜ PHÊ DUYỆT:</strong> Số nhóm từ khóa mới tạo đang đợi admin duyệt.
            <br />
            <span style={{ color: '#2563eb', fontWeight: 600 }}>👉 Hành động:</span> Nhấp chọn để xem chi tiết danh sách nhóm đang chờ phê duyệt.
          </li>
          <li>
            <strong>CÁC THẺ KHÁC (Chỉ hiển thị dữ liệu):</strong> <em>Bài viết tối ưu chờ duyệt</em>, <em>Bài viết chờ duyệt</em>, và <em>Từ khoá phân tách chờ duyệt</em> giúp cập nhật nhanh tiến độ vận hành (Không thể click).
          </li>
        </Box>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          ⚡ 2. BẢNG PHÂN TÍCH ĐỘNG BÊN PHẢI (DYNAMIC PANEL)
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Hiển thị báo cáo chi tiết dựa theo thẻ chỉ số được kích hoạt ở bên trái:
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Báo cáo Google Analytics (GA4) (Kích hoạt từ thẻ DOMAIN QUẢN LÝ):</strong> 
            <br />
            • Chọn <strong>Tên miền</strong> và <strong>Khoảng thời gian (7 ngày, 30 ngày, 90 ngày)</strong> từ các dropdown ở góc trên của bảng.
            <br />
            • Bảng sẽ hiển thị biểu đồ số lượt xem trang (Pageviews), số người dùng hoạt động (Active Users), lượng truy cập tìm kiếm tự nhiên (Organic Traffic).
          </li>
          <li>
            <strong>Hòm thư tác vụ (Inbox Requests) (Kích hoạt từ thẻ YÊU CẦN CẦN XỬ LÝ):</strong>
            <br />
            • Hiển thị danh sách các thẻ yêu cầu gồm Tên yêu cầu, Loại yêu cầu, Trạng thái (Đang chờ/Đang chạy), Hạn chót.
            <br />
            • Nhấn nút <MiniButton label="Xem chi tiết" color="primary" /> trên từng dòng để di chuyển thẳng tới trang cấu hình chi tiết của yêu cầu đó.
          </li>
          <li>
            <strong>Quản lý Nhóm từ khóa (Kích hoạt từ thẻ BỘ TỪ KHOÁ):</strong>
            <br />
            • Cho phép lọc xem danh sách nhóm từ khóa theo từng Tên miền.
            <br />
            • Nhấn trực tiếp vào từng tên nhóm từ khóa để chuyển hướng nhanh tới trang danh sách từ khóa chi tiết của nhóm đó.
          </li>
        </Box>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          🔥 3. LỊCH SỬ HOẠT ĐỘNG BÊN DƯỚI
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Lịch sử hoạt động gần đây (Activity Logs):</strong> Ghi nhận nhật ký các tác vụ chạy ngầm của hệ thống (ví dụ: "Bắt đầu check index URL...", "Hoàn thành cào trang báo...") giúp bạn giám sát hoạt động thời gian thực.
          </li>
        </Box>
      </Box>
    )
  },
  'trending-keywords': {
    title: 'Google Trending Keywords (Từ khóa xu hướng)',
    content: (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
          HƯỚNG DẪN XEM TỪ KHÓA XU HƯỚNG GOOGLE (TRENDING KEYWORDS)
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Trang <strong>Google Trending Keyword</strong> cập nhật liên tục các cụm từ khóa đang bùng nổ tìm kiếm tại Việt Nam trực tiếp từ Google Trends theo thời gian thực. Công cụ hỗ trợ bạn nắm bắt tâm lý thị trường để lên ý tưởng bài viết "bắt trend" nhanh nhất.
        </Typography>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          ⚙️ 1. BỘ LỌC XU HƯỚNG ĐA NĂNG
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Bộ lọc thời gian:</strong> Chọn xem từ khóa thịnh hành trong khoảng thời gian mong muốn gồm: <strong>4 giờ</strong>, <strong>24 giờ</strong>, <strong>48 giờ</strong>, hoặc <strong>7 ngày</strong> qua.
          </li>
          <li>
            <strong>Chế độ Chỉ đang trending:</strong> Bật công tắc này để lọc ra các từ khóa vẫn đang có lượng tìm kiếm tăng mạnh ở thời điểm hiện tại.
          </li>
          <li>
            <strong>Lọc theo danh mục:</strong> Lọc từ khóa theo hơn 400 chủ đề khác nhau (ví dụ: Pháp luật, Thể thao, Giải trí, Công nghệ...) thông qua dropdown danh mục.
          </li>
        </Box>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          ⚡ 2. CÁC THAO TÁC TRÊN DANH SÁCH
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Lấy dữ liệu mới:</strong> Nhấn nút <MiniButton label="Lấy dữ liệu mới" gradient="orange" icon={<CloudSyncOutlinedIcon sx={{ fontSize: 11 }} />} /> để hệ thống chạy bot cào đồng bộ dữ liệu xu hướng mới nhất từ Google.
          </li>
          <li>
            <strong>Làm mới bảng:</strong> Nhấn nút <MiniButton label="🔄" variant="outlined" color="primary" sx={{ px: 0.5, minWidth: 22, height: 20 }} /> để tải lại danh sách từ cơ sở dữ liệu hiện tại.
          </li>
          <li>
            <strong>Xem bài báo liên quan:</strong> Click vào các ảnh đại diện thu nhỏ (Avatar Group) ở cột **Báo chí** để đọc các bài tin tức nguồn khơi mào cho xu hướng tìm kiếm đó.
          </li>
          <li>
            <strong>Phân tích từ khóa:</strong> Bấm nút <MiniButton label="🔍" variant="outlined" color="primary" sx={{ px: 0.5, minWidth: 22, height: 20 }} /> ở cuối mỗi dòng từ khóa để tự động chuyển hướng sang công cụ **Keyword Planner** phân tích chi tiết lượng tìm kiếm và độ cạnh tranh của từ khóa đó.
          </li>
        </Box>
      </Box>
    )
  },
  vbpl: {
    title: 'Gợi ý từ khóa (Google Trends & AI)',
    content: (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
          HƯỚNG DẪN TÌM Ý TƯỞNG & GỢI Ý TỪ KHÓA CHI TIẾT
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Công cụ <strong>Gợi ý từ khóa</strong> là giải pháp tích hợp giúp bạn tìm kiếm chủ đề ngách, theo dõi xu hướng thực tế của người dùng và mở rộng danh sách từ khóa triển khai SEO. Giao diện được cấu trúc làm 3 tab tính năng độc lập cùng với 1 giỏ lưu trữ từ khóa thông minh (Floating Cart) dưới chân trang.
        </Typography>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          🔥 TAB 1: AI GỢI Ý CHỦ ĐỀ SEO (PUBLIC TRENDS)
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Mặc định hệ thống tự động cập nhật và phân tích các chủ đề xu hướng nóng nhất của danh mục <strong>Chính phủ & Luật pháp</strong> tại Việt Nam trong 3 tháng qua, hỗ trợ đắc lực cho các trang tin tức pháp lý hoặc chính sách.
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Lịch sử phân tích (Horizontal List):</strong> Danh sách các phiên quét cũ được lưu trữ ở thanh trượt ngang trên cùng. Bạn có thể nhấn vào một ngày cụ thể (ví dụ: ngày Hôm nay, hoặc các ngày trước đó) để tải lại kết quả cào cũ mà không tốn tài nguyên chạy lại.
          </li>
          <li>
            <strong>Bắt đầu phân tích ngay / Phân tích mới hôm nay:</strong> Nếu ngày hôm nay chưa có bản quét mới, nút <MiniButton label="Bắt đầu phân tích ngay" gradient="orange" icon={<AutoAwesomeIcon sx={{ fontSize: 11 }} />} /> sẽ hiện ra. Hệ thống sẽ khởi chạy trình duyệt ẩn danh Puppeteer cào dữ liệu Google Trends thực tế cho 20 chủ đề hàng đầu.
          </li>
          <li>
            <strong>Bảng Logs trực quan (Live Console Logs):</strong> Trong khi đang quét, hệ thống hiển thị một khung màu đen mô phỏng màn hình lệnh Terminal, cập nhật liên tục tiến trình cào từng chủ đề. Bạn có thể bấm <MiniButton label="Dừng phân tích (Cancel)" variant="outlined" color="error" /> bất cứ lúc nào để ngắt tiến trình.
          </li>
          <li>
            <strong>Phân tích chi tiết biểu đồ:</strong> Click vào một chủ đề trong bảng kết quả để mở rộng phần xem biểu đồ Recharts chi tiết. Bạn sẽ thấy:
            <br />
            • <em>Biểu đồ dòng thời gian xu hướng (Google Trends Chart):</em> Thể hiện mức độ quan tâm của người dùng Việt Nam trong 12 tháng qua.
            <br />
            • <em>Chỉ số phân tích:</em> Điểm Trends hiện tại (0 - 100), Điểm trung bình cả năm, Tốc độ tăng trưởng (%) và Cảnh báo đột biến (<code>🔥 Có đột biến</code> nếu lượng tìm kiếm tăng đột ngột).
          </li>
          <li>
            <strong>Nút tính năng trên bảng:</strong>
            <br />
            • <em>Lọc kết quả đề xuất:</em> Ô tìm kiếm nhanh cho phép lọc chủ đề theo từ khóa.
            <br />
            • <em>Copy:</em> Nhấn nút <MiniButton label="Copy" gradient="orange" /> để sao chép toàn bộ tên chủ đề của bảng kết quả hiện tại vào clipboard.
            <br />
            • <em>Tải Excel:</em> Nhấn nút <MiniButton label="Tải Excel" variant="outlined" color="success" /> để xuất danh sách chủ đề kèm đầy đủ thông tin xu hướng ra file Excel/CSV.
            <br />
            • <em>Chọn cả bộ / Bỏ chọn cả bộ:</em> Nhấn nút <MiniButton label="Chọn cả bộ (20)" variant="outlined" color="info" /> hoặc <MiniButton label="Bỏ chọn cả bộ" variant="outlined" color="info" /> để thêm hoặc xóa đồng loạt toàn bộ danh sách chủ đề đang hiển thị vào Giỏ từ khóa.
            <br />
            • <em>Thao tác lẻ:</em> Nhấn nút <MiniButton label="+" variant="outlined" color="primary" sx={{ px: 0.5, borderRadius: '50%', minWidth: 20, height: 20 }} /> hoặc dấu tick xanh lá ở cuối dòng của mỗi chủ đề để thêm/xóa chủ đề đó khỏi Giỏ.
          </li>
        </Box>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          ⚙️ TAB 2: AI GỢI Ý CHỦ ĐỀ SEO TỰ CHỌN (CUSTOM TRENDS)
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Phân tích xu hướng dựa trên danh sách từ khóa hạt giống (Seed Keywords) do bạn tự nhập. AI kết hợp cào Google Trends thời gian thực và gom nhóm chủ đề tự động.
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Nút "Tạo dự án mới":</strong> Bấm nút <MiniButton label="Tạo dự án mới" gradient="orange" icon="+" /> ở góc phải để mở hộp thoại cấu hình dự án quét:
            <br />
            • <em>Tên dự án chủ đề:</em> Đặt tên dễ nhớ (ví dụ: "Từ khóa xe ô tô điện").
            <br />
            • <em>Từ khóa hạt giống:</em> Nhập từ khóa gốc cần quét. Gõ phím <code>Enter</code> hoặc phẩy <code>,</code> để thêm nhiều từ khóa.
            <br />
            • <em>Số lượng ý tưởng AI gợi ý:</em> Chọn số chủ đề AI cần sinh ra.
            <br />
            • <em>Khoảng thời gian:</em> Chọn khoảng thời gian quét xu hướng (7 ngày, 30 ngày, 90 ngày).
            <br />
            • Bấm <MiniButton label="Bắt đầu phân tích AI" gradient="orange" /> để chạy.
          </li>
          <li>
            <strong>Xem tiến trình cào:</strong> Khi dự án đang chạy ngầm, bạn có thể bấm nút <MiniButton label="Xem tiến trình" gradient="orange" /> để theo dõi trạng thái cào Puppeteer trực quan của từng từ khóa hạt giống.
          </li>
          <li>
            <strong>Quản lý danh sách dự án (Sơ đồ cây - Folder Tree):</strong> Các dự án được gom nhóm theo từ khóa hạt giống dưới dạng các thư mục. Bạn có thể mở rộng thư mục để xem lịch sử các bản quét (snapshots). Nhấn <MiniButton label="Xem kết quả cào AI" gradient="green" /> để hiển thị chi tiết dự án, nhấn <MiniButton label="Xóa" color="error" variant="outlined" /> để loại bỏ bản quét, hoặc nhấn icon chiếc bút để đổi tên dự án.
          </li>
          <li>
            <strong>Kết quả phân tích chi tiết:</strong> Khi mở chi tiết dự án, bạn có thể click chọn từng chủ đề đề xuất của AI để xem biểu đồ Google Trends của chủ đề đó, kèm theo **Truy vấn liên quan (Related Queries)** và **Chủ đề liên quan (Related Topics)** phổ biến nhất trên Google Search.
          </li>
        </Box>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          🤖 TAB 3: AI GỢI Ý TỪ KHÓA (VOLUME & INTENT)
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          AI phân tích ý định tìm kiếm (Search Intent), ước tính lượng tìm kiếm hàng tháng (Volume), giá thầu CPC và vẽ biểu đồ xu hướng 12 tháng qua.
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Tạo từ khóa mới (Tab con):</strong> Nhập từ khóa chủ đề và số lượng từ khóa muốn AI gợi ý (ví dụ: 15, 30, 50 từ khóa con), sau đó bấm nút <MiniButton label="Yêu cầu AI gợi ý" gradient="green" icon={<AutoAwesomeIcon sx={{ fontSize: 11 }} />} />. Bảng kết quả sẽ hiển thị:
            <br />
            • <em>Từ khóa con:</em> Từ khóa ngách tương thích với bài viết SEO.
            <br />
            • <em>Ý định tìm kiếm (Search Intent):</em> Phân loại gồm Thông tin (Informational - Thẻ xanh dương 🔵), Giao dịch/Mua hàng (Transactional - Thẻ đỏ 🔴), Thương mại/So sánh (Commercial - Thẻ cam 🟠), Định hướng (Navigational - Thẻ lục 🟢).
            <br />
            • <em>Lượng tìm kiếm (Search Volume) & Giá thầu quảng cáo (CPC):</em> Số lượt tìm kiếm trung bình tháng và mức giá quảng cáo dự kiến.
            <br />
            • <em>Biểu đồ xu hướng (Trend 12T & 3T):</em> Cột xu hướng nhỏ biểu thị mức tăng trưởng hoặc suy giảm tìm kiếm 3 tháng gần nhất.
          </li>
          <li>
            <strong>Xem lịch sử mở rộng (Tab con):</strong> Xem lại danh sách các chủ đề từ khóa bạn đã từng mở rộng trước đây để xem lại kết quả cũ một cách nhanh chóng mà không cần gọi lại AI.
          </li>
        </Box>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          🛒 4. GIỎ LƯU TRỮ TỪ KHÓA & TRIỂN KHAI (FLOATING DOCK)
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Khi chọn bất kỳ từ khóa nào từ các tab trên, thanh Giỏ hàng màu tối (Floating Dock) sẽ tự động hiện lên cố định ở chân trang. Đây là nơi tập kết từ khóa trước khi đẩy lên làm bộ từ khóa triển khai viết bài SEO:
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Chọn tên miền (Domain):</strong> Lựa chọn website mà bạn dự kiến triển khai bài viết cho bộ từ khóa này.
          </li>
          <li>
            <strong>Nhóm từ khóa:</strong> Đặt tên nhóm mới hoặc chọn một nhóm từ khóa đã có sẵn trên hệ thống để gom chung.
          </li>
          <li>
            <strong>Nút "Tạo bộ từ khóa triển khai":</strong> Nhấn nút <MiniButton label="Tạo bộ từ khóa triển khai" gradient="orange" /> để gửi bộ từ khóa này lên trang Dashboard chính. Bộ từ khóa này sẽ chuyển sang trạng thái <em>Chờ phê duyệt</em> để admin duyệt viết bài SEO hoặc tự động viết bài.
          </li>
          <li>
            <strong>Nút "Xuất Excel":</strong> Nhấn nút <MiniButton label="Xuất Excel" variant="outlined" color="success" /> để tải toàn bộ từ khóa đang lưu trong giỏ hàng về máy tính dưới định dạng tệp Excel/CSV.
          </li>
        </Box>
      </Box>
    )
  },
  planner: {
    title: 'Keyword Planner',
    content: (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
          HƯỚNG DẪN SỬ DỤNG BỘ LẬP KẾ HOẠCH TỪ KHÓA (KEYWORD PLANNER)
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Công cụ <strong>Keyword Planner</strong> giúp bạn phân tích sâu các chỉ số tìm kiếm của bộ từ khóa mục tiêu, ước tính hiệu quả quảng cáo và tự động gom nhóm từ khóa nhằm xây dựng cấu trúc website tối ưu nhất.
        </Typography>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          📈 1. QUÉT CHỈ SỐ VOLUME & CPC TỪ KHÓA
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Nhập danh sách từ khóa:</strong> Dán danh sách từ khóa của bạn vào ô nhập liệu (mỗi dòng nhập một từ khóa để phân tích riêng biệt).
          </li>
          <li>
            <strong>Thiết lập vùng quét:</strong> Lựa chọn Quốc gia và Ngôn ngữ từ dropdown (ví dụ: Quốc gia Việt Nam, Ngôn ngữ Tiếng Việt) để AI và hệ thống lấy dữ liệu chính xác theo thị trường mục tiêu.
          </li>
          <li>
            <strong>Bắt đầu phân tích:</strong> Nhấn nút <MiniButton label="Phân tích từ khóa" gradient="blue" /> để gửi yêu cầu. Hệ thống sẽ truy vấn dữ liệu từ khóa thời gian thực.
          </li>
          <li>
            <strong>Đọc bảng kết quả:</strong>
            <br />
            • <em>Volume (Lượng tìm kiếm):</em> Số lượt tìm kiếm trung bình hàng tháng trên Google.
            <br />
            • <em>CPC (Cost-Per-Click):</em> Giá thầu quảng cáo Google Ads ước tính (Thấp nhất và Cao nhất) giúp bạn đánh giá giá trị thương mại của từ khóa.
            <br />
            • <em>Độ cạnh tranh (Competition):</em> Mức độ khó khi triển khai SEO hoặc chạy quảng cáo (Thấp, Trung bình, Cao).
            <br />
            • <em>Xuuyên (Trends Chart):</em> Biểu đồ cột nhỏ mô phỏng mức độ quan tâm trong 12 tháng qua.
          </li>
        </Box>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          📂 2. GOM NHÓM TỪ KHÓA TỰ ĐỘNG (KEYWORD CLUSTERING)
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Chức năng giúp giải quyết bài toán cấu trúc web bằng cách tự động phân nhóm các từ khóa có cùng mục đích tìm kiếm (Search Intent).
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Cách sử dụng:</strong> Sau khi đã có danh sách từ khóa kèm chỉ số quét, nhấn nút <MiniButton label="Gom nhóm AI" gradient="orange" />.
          </li>
          <li>
            <strong>Nguyên lý:</strong> Thuật toán sẽ so sánh kết quả tìm kiếm (SERP similarity) của các từ khóa. Những từ khóa nào hiển thị các kết quả giống nhau trên Google sẽ được gom chung thành một nhóm (Cluster).
          </li>
          <li>
            <strong>Ứng dụng SEO:</strong> Dựa vào các nhóm này để thiết lập cấu trúc Silo (chủ đề lớn và các bài viết con) và chỉ cần viết một bài viết chuẩn SEO bao phủ toàn bộ các từ khóa trong cùng một nhóm, tránh lỗi trùng lặp nội dung giữa các trang.
          </li>
        </Box>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          📥 3. XUẤT DỮ LIỆU & LƯU TRỮ
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Copy nhanh:</strong> Nhấn nút <MiniButton label="Copy" color="primary" /> để sao chép nhanh toàn bộ từ khóa hoặc các nhóm từ khóa vào clipboard.
          </li>
          <li>
            <strong>Xuất báo cáo:</strong> Nhấn nút <MiniButton label="Tải Excel" color="success" variant="outlined" /> để xuất file báo cáo chi tiết bao gồm từ khóa, nhóm, lượng tìm kiếm, CPC và độ cạnh tranh để gửi đối tác hoặc lưu trữ.
          </li>
          <li>
            <strong>Đưa vào Giỏ hàng:</strong> Bạn có thể tích chọn các từ khóa tiềm năng nhất và nhấn nút <MiniButton label="+" variant="outlined" color="primary" sx={{ px: 0.5, borderRadius: '50%', minWidth: 20, height: 20 }} /> để đưa vào Giỏ từ khóa triển khai dưới chân trang.
          </li>
        </Box>
      </Box>
    )
  },
  serp: {
    title: 'check Ranking',
    content: (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
          HƯỚNG DẪN KIỂM TRA THỨ HẠNG TỪ KHÓA (SERP CHECKER)
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Công cụ <strong>Kiểm tra thứ hạng SERP (check Ranking)</strong> giúp bạn định vị vị trí xếp hạng thực tế của website của mình cho các từ khóa mục tiêu trên trang kết quả tìm kiếm Google (SERP).
        </Typography>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          1. THIẾT LẬP THAM SỐ QUÉT
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Tên miền cần kiểm tra (Domain):</strong> Nhập tên miền website của bạn (ví dụ: <code>accseo.vn</code>) để hệ thống tìm kiếm vị trí của nó trên trang kết quả.
          </li>
          <li>
            <strong>Nhập danh sách từ khóa:</strong> Điền các từ khóa bạn đang SEO hoặc muốn theo dõi thứ hạng (mỗi dòng nhập một từ khóa).
          </li>
          <li>
            <strong>Chọn vùng địa lý (Geo) và Ngôn ngữ:</strong> Rất quan trọng đối với Local SEO. Bạn có thể chọn quét từ Google Việt Nam (vi), Google Mỹ (us)... để nhận kết quả chính xác theo hành vi tìm kiếm địa phương của người dùng.
          </li>
          <li>
            <strong>Bắt đầu kiểm tra:</strong> Bấm nút <MiniButton label="Kiểm tra thứ hạng" color="primary" /> để bắt đầu quét. Hệ thống sẽ tự động gửi yêu cầu giả lập hành vi tìm kiếm thực tế.
          </li>
        </Box>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          2. PHÂN TÍCH BẢNG THỨ HẠNG KẾT QUẢ
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Vị trí (Rank):</strong> Thứ hạng hiện tại của trang web trên Google. Thể hiện sự tăng/giảm vị trí so với phiên quét trước bằng ký hiệu mũi tên xanh/đỏ (ví dụ: <code>↑ 2</code> hoặc <code>↓ 1</code>).
          </li>
          <li>
            <strong>URL xếp hạng (Ranking URL):</strong> Đường dẫn trang con cụ thể trên website được Google hiển thị cho từ khóa đó. Giúp bạn kiểm tra xem Google có nhận diện đúng trang đích cần SEO hay không.
          </li>
          <li>
            <strong>Xem Top 10 đối thủ:</strong> Bấm nút <MiniButton label="🔍" color="primary" variant="outlined" sx={{ px: 0.5, minWidth: 22, height: 20 }} /> ở cuối dòng từ khóa để mở bảng phân tích Top 10 đối thủ hàng đầu đang xếp hạng trên bạn. Giúp bạn nhanh chóng nghiên cứu cấu trúc bài viết và tối ưu của đối thủ.
          </li>
          <li>
            <strong>Xuất báo cáo Excel:</strong> Nhấn nút <MiniButton label="Tải Excel" color="success" variant="outlined" /> ở góc trên bảng để tải về báo cáo vị trí từ khóa làm tài liệu theo dõi tiến độ SEO hoặc gửi khách hàng.
          </li>
        </Box>
      </Box>
    )
  },
  'index-checker': {
    title: 'Check Index',
    content: (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
          HƯỚNG DẪN KIỂM TRA TRẠNG THÁI LẬP CHỈ MỤC (CHECK INDEX)
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Công cụ <strong>Check Index</strong> giúp bạn xác định nhanh xem các đường dẫn (URL) bài viết, sản phẩm trên website đã được Google lưu trữ (Index) và sẵn sàng hiển thị trên trang tìm kiếm chưa.
        </Typography>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          1. CẤU HÌNH QUÉT URL
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Nhập danh sách URL:</strong> Hỗ trợ dán tối đa 50 đường dẫn URL đồng thời vào ô văn bản bên trái (mỗi dòng một đường dẫn).
          </li>
          <li>
            <strong>Lựa chọn Crawl Engine (Bộ quét):</strong>
            <br />
            • <em>Local Crawler (Cục bộ):</em> Chạy hoàn toàn miễn phí thông qua hệ thống IP của máy chủ chính. Thích hợp cho số lượng URL ít, tuy nhiên nếu quét quá nhiều dễ bị Google chặn IP tạm thời (Rate Limit).
            <br />
            • <em>Apify Cloud (Đám mây):</em> Quét qua mạng lưới đám mây phân tán. Tốc độ quét cực nhanh (~1.7s cho mỗi URL), không bị chặn IP bởi cơ chế xoay vòng proxy, phù hợp khi cần kiểm tra số lượng link lớn.
          </li>
          <li>
            <strong>Nút cào & dọn dẹp:</strong> Bấm nút <MiniButton label="Kiểm tra Index" color="success" /> ở chân trang cấu hình để kích hoạt bot đi kiểm tra. Bạn có thể nhấn <MiniButton label="Xóa toàn bộ" variant="outlined" color="error" /> để dọn sạch ô nhập liệu nhanh chóng.
          </li>
        </Box>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          2. KẾT QUẢ VÀ HÀNH ĐỘNG TIẾP THEO
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Trạng thái Index:</strong>
            <br />
            • Thẻ màu xanh lục <code>Đã Index</code>: URL đã nằm trong bộ nhớ Google Search.
            <br />
            • Thẻ màu đỏ <code>Chưa Index</code>: Trang web chưa được lập chỉ mục (có thể do trang mới, lỗi robots.txt, hoặc chất lượng nội dung chưa tốt).
          </li>
          <li>
            <strong>Tiêu đề và mô tả Cache:</strong> Hiển thị nội dung Title và Description thực tế mà Google đang hiển thị trên kết quả tìm kiếm của link đó.
          </li>
          <li>
            <strong>Hành động tiếp theo:</strong>
            <br />
            • Với các URL <em>Chưa Index</em>, bạn có thể copy danh sách và chuyển sang tab **Ép Index (Google Index Booster)** để gửi yêu cầu lập chỉ mục ngay lập tức.
            <br />
            • Nhấn nút <MiniButton label="Tải Excel" color="success" variant="outlined" /> để xuất báo cáo kiểm tra trạng thái Index phục vụ công việc.
          </li>
        </Box>
      </Box>
    )
  },
  scraper: {
    title: 'Thu thập báo chí (Press Scraper)',
    content: (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
          HƯỚNG DẪN THU THẬP BÀI BÁO TỰ ĐỘNG (PRESS SCRAPER)
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Công cụ <strong>Thu thập báo chí</strong> giúp bạn tự động quét, theo dõi và lấy nội dung bài viết từ các trang báo điện tử lớn tại Việt Nam (vnexpress.net, dantri.com.vn, cafef.vn...) theo chủ đề, phục vụ nghiên cứu thị trường và tìm kiếm ý tưởng nội dung.
        </Typography>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          📡 1. THIẾT LẬP CHIẾN DỊCH CÀO TIN TỨC
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Chọn nguồn báo chí:</strong> Chọn trang báo mong muốn từ danh sách dropdown có sẵn.
          </li>
          <li>
            <strong>Từ khóa chủ đề:</strong> Nhập từ khóa chủ đề bài báo muốn cào (ví dụ: "chính sách thuế", "lãi suất ngân hàng").
          </li>
          <li>
            <strong>Phạm vi thời gian:</strong> Giới hạn ngày xuất bản của bài báo (ví dụ: cào bài viết trong 7 ngày gần đây hoặc 30 ngày gần đây) để đảm bảo thông tin luôn mới nhất.
          </li>
          <li>
            <strong>Bắt đầu cào:</strong> Nhấn nút <MiniButton label="Bắt đầu cào" gradient="orange" /> để kích hoạt bot. Hệ thống sẽ cào các trường thông tin: Tiêu đề, Sapo (Mô tả), Nội dung chi tiết, Ngày xuất bản và lưu trữ vào hệ thống.
          </li>
        </Box>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          🤖 2. HÀNH ĐỘNG AI TÍCH HỢP & GOOGLE SHEETS
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Gen từ khóa AI:</strong> Nhấp nút <MiniButton label="Gen keyword" color="grey" icon={<PsychologyIcon sx={{ fontSize: 11, color: '#10b981' }} />} /> xuất hiện trên từng dòng bài viết cào được để yêu cầu AI đọc hiểu bài viết đó và tự động sinh ra bộ từ khóa SEO tối ưu nhất.
          </li>
          <li>
            <strong>Mở Google Sheets:</strong> Sau khi AI chạy xong, nút chuyển thành <MiniButton label="mở" color="grey" sx={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', bgcolor: 'rgba(16,185,129,0.05)' }} /> màu xanh lục. Bấm vào đây để mở nhanh bảng tính Google Sheets lưu trữ bài viết.
          </li>
          <li>
            <strong>Đồng bộ Google Sheets tự động:</strong> Toàn bộ danh sách bài viết cào được kèm theo bộ từ khóa SEO do AI đề xuất sẽ được tự động đồng bộ hóa lên file Google Sheets dùng chung của dự án, giúp đội ngũ làm nội dung dễ dàng phân chia công việc.
          </li>
        </Box>
      </Box>
    )
  },
  'scraper-url': {
    title: 'URL Scraper',
    content: (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
          HƯỚNG DẪN CÀO DỮ LIỆU URL ĐA NĂNG (URL SCRAPER)
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Công cụ <strong>URL Scraper</strong> dùng để bóc tách cấu trúc HTML và trích xuất nội dung văn bản sạch của bất kỳ trang web nào, giúp bạn phân tích SEO On-page hoặc lấy thông tin bài viết gốc của đối thủ cạnh tranh.
        </Typography>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          1. CHỌN CHẾ ĐỘ CÀO & GIỚI HẠN URL
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Theo dõi link con (Follow links) - TẮT:</strong> Cho phép dán đồng thời tối đa **20 đường dẫn URL** khác nhau vào ô nhập liệu (mỗi dòng một đường dẫn). Bot sẽ quét song song và trích xuất dữ liệu của từng trang.
          </li>
          <li>
            <strong>Theo dõi link con (Follow links) - BẬT:</strong> Khi chọn tính năng này, hệ thống sẽ giới hạn chỉ cho phép nhập **duy nhất 1 URL**. Bot sẽ cào URL chính này, tìm kiếm toàn bộ các liên kết nội bộ (Internal links) có trong trang đó và tự động cào tiếp tất cả các trang con. Ô nhập liệu sẽ hiển thị cảnh báo lỗi và nút cào sẽ bị vô hiệu hóa nếu bạn nhập nhiều hơn 1 URL khi bật tính năng này.
          </li>
          <li>
            <strong>Bắt đầu cào:</strong> Bấm nút <MiniButton label="Bắt đầu cào URL" color="success" /> để kích hoạt bot Puppeteer bóc tách mã nguồn trang web.
          </li>
        </Box>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          2. DỮ LIỆU SEO ON-PAGE TRÍCH XUẤT ĐƯỢC
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Cấu trúc Headings (H1 - H6):</strong> Liệt kê sơ đồ các thẻ tiêu đề của bài viết giúp bạn đánh giá xem bài viết đã phân bố cấu trúc logic và mạch lạc chưa.
          </li>
          <li>
            <strong>Thẻ Meta Title & Meta Description:</strong> Đo lường nội dung tiêu đề và mô tả hiển thị trên Google để xem mức độ tối ưu hóa từ khóa và độ dài ký tự.
          </li>
          <li>
            <strong>Mật độ từ khóa (Keyword Density):</strong> Thống kê chi tiết tỷ lệ phần trăm xuất hiện của các từ đơn, từ đôi, từ ba... giúp bạn phát hiện việc tối ưu quá đà (Over-optimization) hoặc nhồi nhét từ khóa.
          </li>
          <li>
            <strong>Plain Text (Văn bản sạch):</strong> Lọc bỏ toàn bộ quảng cáo, mã JS, mã CSS và thanh menu bên lề, trả về nội dung chữ thuần túy của bài viết giúp bạn dễ dàng copy hoặc dán vào AI để viết bài mới.
          </li>
        </Box>
      </Box>
    )
  },
  'content-analysis': {
    title: 'Tạo Outline (SEO Outline Creator)',
    content: (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
          HƯỚNG DẪN TẠO OUTLINE BÀI VIẾT (SEO OUTLINE CREATOR)
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Công cụ <strong>Tạo Outline</strong> sử dụng trí tuệ nhân tạo (AI) để phân tích cấu trúc của các đối thủ hàng đầu trên kết quả tìm kiếm Google (SERP), từ đó đưa ra các đề xuất về độ dài bài viết, số lượng headings, hình ảnh, mật độ từ khóa NLP và tự động thiết kế một bản dàn ý (brief outline) tối ưu nhất.
        </Typography>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          1. CÁCH KHỞI TẠO PHIÊN PHÂN TÍCH OUTLINE
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Từ khóa phân tích:</strong> Nhập từ khóa quan trọng mà bạn muốn lên dàn ý viết bài (ví dụ: &ldquo;thủ tục ly hôn thuận tình&rdquo;).
          </li>
          <li>
            <strong>Thiết lập vùng quét:</strong> Lựa chọn Vị trí địa lý và Ngôn ngữ tìm kiếm để nhận kết quả chính xác theo thị trường mục tiêu.
          </li>
          <li>
            <strong>Số đối thủ cào quét:</strong> Chọn số lượng đối thủ trên Top SERP (từ 5 đến 15 trang) để bot thu thập dữ liệu cấu trúc.
          </li>
          <li>
            <strong>Bắt đầu phân tích:</strong> Nhấn nút <MiniButton label="Phân tích từ khóa" color="primary" /> để đưa phiên phân tích vào hàng đợi cào quét.
          </li>
        </Box>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          2. KẾT QUẢ VÀ CÁC THAO TÁC HỖ TRỢ
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Đề xuất cấu trúc chuẩn SEO:</strong> AI tổng hợp và tính toán số từ lý tưởng, số lượng thẻ H2, số ảnh cần thiết và mật độ từ khóa của đối thủ.
          </li>
          <li>
            <strong>Dàn ý bài viết tối ưu bằng AI:</strong> Hiển thị cấu trúc H2, H3, H4 gợi ý kèm theo các từ khóa NLP tương ứng. Bạn có thể bật công tắc Chế độ tối giản, copy outline hoặc tải file Markdown (.md).
          </li>
          <li>
            <strong>Xuất Google Doc:</strong> Nhấp nút <MiniButton label="Xuất Google Doc" color="primary" /> để tự động tạo và xuất dàn ý ra trang văn bản Google Docs để bắt đầu viết bài trực tiếp.
          </li>
        </Box>
      </Box>
    )
  },
  indexed: {
    title: 'Ép Index (Google Index Booster)',
    content: (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
          HƯỚNG DẪN ÉP INDEX NHANH BÀI VIẾT (GOOGLE INDEX BOOSTER)
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Công cụ <strong>Ép Index</strong> cho phép bạn gửi trực tiếp danh sách URL bài viết mới hoặc bài viết vừa cập nhật nội dung lên Google bot thông qua kết nối API chính thức của Google Search Console, giúp đẩy nhanh tiến trình lập chỉ mục từ vài tuần xuống còn vài phút.
        </Typography>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          ⚡ 1. QUY TRÌNH GỬI YÊU CẦU ÉP INDEX
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Nhập danh sách URL:</strong> Nhập các đường dẫn URL cần ép index (mỗi dòng nhập một URL). Bạn có thể lọc danh sách các link <em>"Chưa Index"</em> từ kết quả của công cụ **Check Index** để đưa sang đây.
          </li>
          <li>
            <strong>Cơ chế kết nối API:</strong> Công cụ sử dụng tài khoản dịch vụ API (Service Account Key) đã được xác minh quyền sở hữu website trong Google Search Console để gửi yêu cầu.
          </li>
          <li>
            <strong>Bắt đầu ép Index:</strong> Nhấn nút <MiniButton label="Bắt đầu ép Index" gradient="green" /> để gửi hàng loạt yêu cầu. Hệ thống sẽ tự động điều phối để tránh quá tải giới hạn API của Google (200 URL/ngày cho mỗi dự án).
          </li>
        </Box>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          📋 2. GIÁM SÁT TRẠNG THÁI HÀNG ĐỢI (QUEUE MONITOR)
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Trạng thái hàng đợi hiển thị chi tiết:</strong>
            <br />
            • <code>Thành công (Success)</code>: Yêu cầu của bạn đã được API Google Search Console tiếp nhận. Google bot sẽ tiến hành thu thập thông tin trang web đó sớm nhất.
            <br />
            • <code>Đang chờ (Pending)</code>: URL đang nằm trong hàng đợi chờ hệ thống gọi API tuần tự.
            <br />
            • <code>Thất bại (Failed)</code>: Có lỗi xảy ra trong quá trình kết nối API (ví dụ: tài khoản API bị thu hồi quyền, hoặc website của bạn chưa cấu hình xác minh trong Search Console).
          </li>
          <li>
            <strong>Xuất báo cáo:</strong> Nhấn nút <MiniButton label="Tải Excel" color="success" variant="outlined" /> để xuất bảng theo dõi trạng thái ép index nhằm cập nhật tiến độ công việc SEO định kỳ.
          </li>
        </Box>
      </Box>
    )
  },
  'seo-audit': {
    title: 'SEO Audit Website',
    content: (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
          HƯỚNG DẪN KIỂM TRA SỨC KHỎE WEBSITE (SEO AUDIT)
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Công cụ <strong>SEO Audit Website</strong> thực hiện chẩn đoán toàn diện sức khỏe kỹ thuật của trang web, phát hiện sớm các lỗi cấu hình hệ thống, tối ưu hóa on-page và các lỗi ảnh hưởng trực tiếp đến trải nghiệm người dùng cùng thứ hạng tìm kiếm.
        </Typography>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          1. TIẾN HÀNH QUÉT SỨC KHỎE
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Nhập địa chỉ website:</strong> Nhập đường dẫn trang chủ website cần chẩn đoán (ví dụ: <code>https://mywebsite.com</code>).
          </li>
          <li>
            <strong>Bắt đầu Audit:</strong> Nhấn nút <MiniButton label="Phân tích" color="primary" /> để kích hoạt bot quét. Hệ thống sẽ cào các liên kết trên trang web để tìm kiếm lỗi kỹ thuật.
          </li>
        </Box>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          2. CÁC HẠNG MỤC PHÂN TÍCH & BÁO CÁO LỖI
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Technical SEO Audit (Kỹ thuật hệ thống):</strong> Kiểm tra cấu hình file robots.txt, sitemap.xml, tốc độ tải trang (Core Web Vitals), tính tương thích hiển thị trên điện thoại di động (Mobile Friendliness) và chứng chỉ bảo mật SSL/HTTPS.
          </li>
          <li>
            <strong>Lỗi liên kết (Links & Redirects):</strong> Liệt kê các liên kết bị gãy (Lỗi 404), liên kết dẫn tới trang không tồn tại hoặc vòng lặp chuyển hướng quá nhiều lần làm hao tổn ngân sách cào của Google (Crawl Budget).
          </li>
          <li>
            <strong>Lỗi thẻ SEO On-page:</strong> Phát hiện các trang con bị thiếu thẻ Meta Title, Meta Description, tiêu đề bài viết quá dài hoặc quá ngắn, hoặc bị trùng lặp tiêu đề với trang khác.
          </li>
          <li>
            <strong>Phân loại mức độ lỗi:</strong> Báo cáo phân chia làm 3 nhóm chính:
            <br />
            • <em>Lỗi nghiêm trọng (Critical Errors):</em> Cần sửa chữa ngay lập tức vì đây là nguyên nhân trực tiếp khiến Google phạt hoặc không index trang.
            <br />
            • <em>Cảnh báo (Warnings):</em> Các lỗi tối ưu trung bình cần cải thiện dần.
            <br />
            • <em>Đề xuất (Suggestions):</em> Khuyến nghị tối ưu cấu trúc nâng cao giúp nâng cao điểm chất lượng trang.
          </li>
        </Box>
      </Box>
    )
  },
  'geo-tag': {
    title: 'Geo Tag Ảnh (EXIF Gps Coordinate Editor)',
    content: (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
          HƯỚNG DẪN NHÚNG TỌA ĐỘ ĐỊA LÝ VÀO HÌNH ẢNH (GEO TAG)
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
          Công cụ <strong>Geo Tag Ảnh</strong> giúp bạn ghi đè thông tin Kinh độ (Longitude) và Vĩ độ (Latitude) cùng dữ liệu doanh nghiệp trực tiếp vào siêu dữ liệu EXIF của hình ảnh. Đây là kỹ thuật Local SEO cực hiệu quả để giúp doanh nghiệp của bạn thăng hạng trên Google Maps và Google Images Search tại địa phương.
        </Typography>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          📸 HƯỚNG DẪN THỰC HIỆN TỪNG BƯỚC
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '0.82rem' }}>
          <li>
            <strong>Bước 1: Tải hình ảnh lên:</strong> Nhấn chọn hoặc kéo thả các tệp hình ảnh sản phẩm, dịch vụ, cửa hàng của bạn vào ô tải ảnh (hỗ trợ định dạng JPG, JPEG, PNG).
          </li>
          <li>
            <strong>Bước 2: Chọn vị trí tọa độ địa lý:</strong>
            <br />
            • <em>Tìm kiếm địa chỉ:</em> Nhập tên doanh nghiệp hoặc địa chỉ cửa hàng của bạn vào ô tìm kiếm trên bản đồ để lấy tọa độ tự động.
            <br />
            • <em>Bản đồ trực quan:</em> Bạn có thể click trực tiếp lên bản đồ để chấm tọa độ chính xác. Hệ thống sẽ tự động điền các thông tin Vĩ độ (Latitude) và Kinh độ (Longitude).
          </li>
          <li>
            <strong>Bước 3: Bổ sung thông tin doanh nghiệp (EXIF Metadata):</strong> Nhập các thông tin bổ sung như Tên doanh nghiệp (Brand/Owner) và Từ khóa mô tả ảnh (Tags) để tối ưu hóa SEO hình ảnh.
          </li>
          <li>
            <strong>Bước 4: Nhúng dữ liệu & Tải ảnh về:</strong>
            <br />
            • Nhấn nút <MiniButton label="Nhúng tọa độ GPS vào ảnh" gradient="green" /> để chạy ghi đè dữ liệu.
            <br />
            • Sau khi hoàn thành, nhấn nút <MiniButton label="Tải xuống hàng loạt (ZIP)" gradient="green" /> để tải toàn bộ hình ảnh đã nhúng tọa độ về máy tính. Bạn có thể sử dụng các hình ảnh này để đăng tải lên website chính thức hoặc Google Business Profile nhằm tăng độ tin cậy địa lý cho doanh nghiệp.
          </li>
        </Box>
      </Box>
    )
  }
};

type ActivePanel = 'ga4' | 'deployed' | 'pending' | 'requests';

const formatDefensiveNumber = (num: number): string => {
  if (isNaN(num) || num === null || num === undefined) return '-';
  if (num >= 1e9) {
    return num.toExponential(2); // Tránh bug tràn số
  }
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  iconBgColor: string;
  activeColor?: string;
  active?: boolean;
  onClick?: () => void;
}

function StatCard({ title, value, icon, activeColor = '#2563EB', active, onClick }: StatCardProps) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 3, 
        borderRadius: 2, 
        bgcolor: 'background.paper',
        minHeight: 125, 
        height: '100%',
        position: 'relative', 
        overflow: 'hidden',
        border: '1px solid',
        borderColor: active ? activeColor : 'divider',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          borderColor: activeColor,
          boxShadow: (theme) => theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.5)' 
            : '0 4px 12px rgba(0,0,0,0.05)',
        } : {},
      }}
    >
      <Box sx={{
        position: 'absolute', 
        right: -12, 
        bottom: -12, 
        opacity: (theme) => theme.palette.mode === 'dark' ? 0.04 : 0.06, 
        color: activeColor,
        zIndex: 0,
        '& svg': { fontSize: 70 },
        transition: 'transform 0.4s ease',
        '.MuiPaper-root:hover &': { transform: 'scale(1.1)' },
      }}>
        {icon}
      </Box>
      <Stack spacing={1} sx={{ zIndex: 1, overflow: 'hidden', width: '100%' }}>
        <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </Typography>
        <Tooltip title={value.toLocaleString('en-US')} arrow placement="top">
          <Typography sx={{ 
            fontSize: '2.2rem', 
            fontWeight: 900, 
            color: 'text.primary', 
            lineHeight: 1, 
            cursor: 'help',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%'
          }}>
            {formatDefensiveNumber(value)}
          </Typography>
        </Tooltip>
      </Stack>

      <Box sx={{ zIndex: 1, mt: 1.5 }}>
        {onClick ? (
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: active ? activeColor : 'text.disabled', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: active ? activeColor : 'text.disabled', display: 'inline-block' }} />
            {active ? 'Đang lọc bảng' : 'Nhấp để lọc bảng'}
          </Typography>
        ) : (
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: 'text.disabled', opacity: 0.65, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled', display: 'inline-block', opacity: 0.5 }} />
            Chỉ hiển thị số liệu
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

// ─── Keyword Panel ─────────────────────────────────────────────────────────────
function KeywordPanel({ groups, loading, title, domains, selectedDomainId, onDomainChange, navigate }: {
  groups: KeywordGroup[];
  loading: boolean;
  title: string;
  domains: Domain[];
  selectedDomainId: string;
  onDomainChange: (id: string) => void;
  navigate: (path: string) => void;
}) {
  const STATUS_COLORS: Record<string, string> = {
    deployed:         '#059669',
    pending_approval: '#D97706',
    not_started:      '#6B7280',
    in_progress:      '#2563EB',
    rejected:         '#DC2626',
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: 'text.primary', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentOutlinedIcon color="primary" />
            {title}
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
            Chọn domain để xem danh sách
          </Typography>
        </Box>
        <FormControl size="small">
          <Select
            value={selectedDomainId}
            onChange={(e) => onDomainChange(e.target.value)}
            displayEmpty
            sx={{ fontSize: '0.85rem', minWidth: 160, borderRadius: 2, bgcolor: 'background.default' }}
          >
            <MenuItem value="" disabled>Chọn Domain</MenuItem>
            {domains.map(d => <MenuItem key={d._id} value={d._id}>{d.domain}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
        ) : groups.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
            <AssignmentOutlinedIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
            <Typography sx={{ fontSize: '0.9rem' }}>Không có dữ liệu</Typography>
          </Box>
        ) : (
          groups.map((g) => {
            const id = (g as { _id?: string })._id || g.id;
            const status = (g as { status?: string }).status ?? '';
            const color = STATUS_COLORS[status] ?? '#6B7280';
            const domainId = g.domainId || selectedDomainId;
            const target = `/domains/${domainId}/keywords?search=${encodeURIComponent(g.name)}`;
            return (
              <Box
                key={id}
                onClick={() => navigate(target)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.2, borderBottom: '1px solid', borderColor: 'divider', cursor: 'pointer', mx: -0.5, px: 0.5, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }} noWrap>{g.name.charAt(0).toUpperCase() + g.name.slice(1)}</Typography>
                <Chip
                  label={status === 'deployed' ? 'Đã triển khai' : 'Chờ duyệt'}
                  size="small"
                  sx={{ bgcolor: `${color}1A`, color, fontWeight: 600, fontSize: 11, border: `1px solid ${color}40`, flexShrink: 0 }}
                />
              </Box>
            );
          })
        )}
      </Box>
    </>
  );
}

// ─── Requests Panel ───────────────────────────────────────────────────────────
function RequestsPanel({ requests, loading, navigate }: { requests: Request[]; loading: boolean; navigate: (path: string) => void }) {
  return (
    <>
      <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: 'text.primary', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <InboxOutlinedIcon color="primary" />
        Yêu cầu cần xử lý
      </Typography>
      <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 2 }}>
        Các yêu cầu đang chờ hoặc đang xử lý
      </Typography>

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
        ) : requests.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
            <InboxOutlinedIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
            <Typography sx={{ fontSize: '0.9rem' }}>Không có yêu cầu nào</Typography>
          </Box>
        ) : requests.map((req) => {
          const due = getDueDateInfo(req.dueDate);
          return (
            <Box
              key={req.id}
              onClick={() => navigate(`/requests/${req.id}`)}
              sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.2, borderBottom: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, mx: -0.5, px: 0.5, borderRadius: 1 }}
            >
              <Avatar src={req.fromUser?.imgAvatar} sx={{ width: 28, height: 28, fontSize: 12, flexShrink: 0, mt: 0.25 }}>
                {req.fromUser?.name?.[0]}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{req.title}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.4, flexWrap: 'wrap', alignItems: 'center' }}>
                  <TypeBadge type={req.type} />
                  <StatusBadge status={req.status} />
                  {due && (
                    <Chip icon={<AccessTimeIcon />} label={due.label} size="small" color={due.color} variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </>
  );
}

// ─── GA4 Chart Panel ──────────────────────────────────────────────────────────
function Ga4Panel({ domains, selectedDomainId, onDomainChange, selectedDays, onDaysChange, ga4Data, loadingGa4 }: {
  domains: Domain[];
  selectedDomainId: string;
  onDomainChange: (id: string) => void;
  selectedDays: number;
  onDaysChange: (days: number) => void;
  ga4Data: Ga4OverviewData | null;
  loadingGa4: boolean;
}) {
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: 'text.primary', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentOutlinedIcon color="primary" />
            Lượt truy cập {selectedDays} ngày qua
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 2 }}>
            Biểu đồ thống kê lượng views từ GA4
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small">
              <Select value={selectedDomainId} onChange={(e) => onDomainChange(e.target.value)} displayEmpty sx={{ fontSize: '0.85rem', minWidth: 160, borderRadius: 2, bgcolor: 'background.default' }}>
                <MenuItem value="" disabled>Chọn Domain</MenuItem>
                {domains.map(d => <MenuItem key={d._id} value={d._id}>{d.domain}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small">
              <Select value={selectedDays} onChange={(e) => onDaysChange(Number(e.target.value))} sx={{ fontSize: '0.85rem', minWidth: 120, borderRadius: 2, bgcolor: 'background.default' }}>
                <MenuItem value={7}>7 ngày</MenuItem>
                <MenuItem value={28}>28 ngày</MenuItem>
                <MenuItem value={90}>90 ngày</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        {ga4Data && ga4Data.trend?.length > 0 && (
          <Box sx={{
            textAlign: 'right',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 184, 148, 0.08)' : 'rgba(0, 184, 148, 0.04)',
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 184, 148, 0.25)' : 'rgba(0, 184, 148, 0.15)'
          }}>
            <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: 'primary.main', lineHeight: 1 }}>
              {new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(ga4Data.summary.screenPageViews)}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, mt: 0.5 }}>Tổng lượt views</Typography>
          </Box>
        )}
      </Box>
 
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 200, pt: 2, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 0, pointerEvents: 'none' }}>
          {[...Array(4)].map((_, i) => <Box key={i} sx={{ borderBottom: '1px dashed', borderColor: 'divider', width: '100%' }} />)}
        </Box>
 
        {loadingGa4 ? (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}><CircularProgress size={30} /></Box>
        ) : (!ga4Data || !ga4Data.trend || ga4Data.trend.length === 0) ? (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, zIndex: 1 }}>
            <AssessmentOutlinedIcon sx={{ fontSize: 40, color: '#94a3b8' }} />
            <Typography sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.9rem' }}>Chưa có dữ liệu truy cập</Typography>
          </Box>
        ) : (() => {
          let chartData: { label: string; value: number; id: number }[] = [];
          if (selectedDays === 90) {
            for (let i = 0; i < ga4Data.trend.length; i += 15) {
              const chunk = ga4Data.trend.slice(i, i + 15);
              const sd = new Date(chunk[0].date);
              chartData.push({ label: `${sd.getDate()}/${sd.getMonth() + 1}`, value: chunk.reduce((a, c) => a + c.screenPageViews, 0), id: i });
            }
          } else if (selectedDays === 28) {
            for (let i = 0; i < ga4Data.trend.length; i += 7) {
              const chunk = ga4Data.trend.slice(i, i + 7);
              const sd = new Date(chunk[0].date);
              chartData.push({ label: `${sd.getDate()}/${sd.getMonth() + 1}`, value: chunk.reduce((a, c) => a + c.screenPageViews, 0), id: i });
            }
          } else {
            chartData = ga4Data.trend.map((t, i) => { const d = new Date(t.date); return { label: `${d.getDate()}/${d.getMonth() + 1}`, value: t.screenPageViews, id: i }; });
          }
          const maxViews = Math.max(...chartData.map(c => c.value), 1);
          const fmt = (v: number) => v === 0 ? '' : new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(v);
 
          const BAR_MAX_PX = 130;
          return chartData.map((item) => {
            const barH = Math.max((item.value / maxViews) * BAR_MAX_PX, 3);
            return (
              <Box key={item.id} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, minWidth: 0, zIndex: 1, pb: '24px' }}>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', mb: 0.5, visibility: item.value > 0 ? 'visible' : 'hidden', lineHeight: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {fmt(item.value)}
                </Typography>
                <Box
                  sx={{ 
                    width: '100%', 
                    maxWidth: 36, 
                    height: `${barH}px`, 
                    bgcolor: 'primary.main', 
                    borderRadius: '4px 4px 0 0', 
                    transition: 'all 0.2s ease-in-out', 
                    '&:hover': { 
                      bgcolor: 'primary.dark' 
                    }, 
                    cursor: 'pointer' 
                  }}
                  title={`${item.label}: ${item.value} views`}
                />
                <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, mt: 0.5, whiteSpace: 'nowrap' }}>{item.label}</Typography>
              </Box>
            );
          });
        })()}
      </Box>
    </>
  );
}

const getNotificationStyle = (n: any) => {
  if (n.type === 'SCRAPER_HEALTH_ALERT') {
    let data = n.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {}
    }
    const isRecovered = data?.recovered === true || data?.recovered === 'true';
    if (isRecovered) {
      return {
        icon: <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: 'success.main', flexShrink: 0 }} />,
        bgcolor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.09)' : 'rgba(46, 125, 50, 0.04)',
        hoverBorder: '#2e7d32'
      };
    }
    const severity = data?.severity || 'WARN';
    if (severity === 'CRITICAL') {
      return {
        icon: <ErrorOutlinedIcon sx={{ fontSize: 18, color: 'error.main', flexShrink: 0 }} />,
        bgcolor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.09)' : 'rgba(211, 47, 47, 0.04)',
        hoverBorder: '#d32f2f'
      };
    } else {
      return {
        icon: <WarningAmberIcon sx={{ fontSize: 18, color: 'warning.main', flexShrink: 0 }} />,
        bgcolor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(237, 108, 2, 0.09)' : 'rgba(237, 108, 2, 0.04)',
        hoverBorder: '#ed6c02'
      };
    }
  }
  return {
    icon: <NotificationsNoneOutlinedIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />,
    bgcolor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(0, 184, 148, 0.05)' : 'rgba(0, 184, 148, 0.02)',
    hoverBorder: 'primary.main'
  };
};

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { showToast } = useToastify();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, allowedPages } = useAppSelector(state => state.auth);
  const canView = (pageKey: string) => allowedPages === null || (Array.isArray(allowedPages) && allowedPages.includes(pageKey));
  const { items: notifItems } = useAppSelector(state => state.notifications);

  const [stats, setStats] = useState({
    domains: 0,
    deployedKeywords: 0,
    pendingKeywords: 0,
    pendingRequests: 0,
    pendingKeywordSegments: 0,
    pendingArticles: 0,
    pendingOptimizedArticles: 0,
    indexedArticles: 0,
    notIndexedArticles: 0,
  });
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [selectedDays, setSelectedDays] = useState(7);
  const [ga4Data, setGa4Data] = useState<Ga4OverviewData | null>(null);
  const [loadingGa4, setLoadingGa4] = useState(false);

  const [activePanel, setActivePanel] = useState<ActivePanel>('ga4');
  const [panelGroups, setPanelGroups] = useState<KeywordGroup[]>([]);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [activitiesDialogOpen, setActivitiesDialogOpen] = useState(false);

  const [inboxRequests, setInboxRequests] = useState<Request[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const handleNotifClick = (notif: any) => {
    if (!notif.isRead) {
      dispatch(markAsRead(notif._id));
    }

    // Normalize notifications data from FCM if it is in string format
    let data = notif.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {}
    }
    if (data && typeof data === 'object') {
      if (typeof data.recovered === 'string') {
        data.recovered = data.recovered === 'true';
      }
    }

    if (notif.type === 'SCRAPER_HEALTH_ALERT') {
      navigate('/scraper/health', { state: { highlightSource: data?.source } });
    } else if (data?.requestId) {
      navigate(`/requests/${data.requestId}`);
    } else if (data?.entityType === 'keyword_group') {
      navigate('/domains');
    }
  };



  // Load dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      const [domainsResult, statsResult, inboxResult] = await Promise.allSettled([
        domainService.getAll(),
        keywordGroupService.getDashboardStatsByCurrentUser(),
        requestService.getInbox({ page: 1, limit: 20 }),
      ]);

      if (domainsResult.status === 'fulfilled') {
        const items = domainsResult.value.items;
        if (items.length > 0) {
          setDomains(items);
          setSelectedDomainId(items[0]._id);
        }
      } else {
        showToast('Lỗi tải Domain', 'danger');
      }

      if (statsResult.status === 'fulfilled') {
        const s = statsResult.value;
        setStats(prev => ({ ...prev, domains: s?.domainTotal ?? 0, deployedKeywords: s?.group?.deployed ?? 0, pendingKeywords: s?.group?.pendingApproval ?? 0 }));
      }

      if (inboxResult.status === 'fulfilled') {
        const active = inboxResult.value.items.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS');
        setInboxRequests(active);
        setStats(prev => ({ ...prev, pendingRequests: active.length }));
      }
    };
    fetchDashboardStats();
  }, [showToast]);

  // Load GA4
  useEffect(() => {
    if (!selectedDomainId || activePanel !== 'ga4') return;
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingGa4(true);
    ga4Service.getOverview(selectedDomainId, selectedDays)
      .then(data => { if (mounted) setGa4Data(data); })
      .catch(() => { if (mounted) setGa4Data(null); })
      .finally(() => { if (mounted) setLoadingGa4(false); });
    return () => { mounted = false; };
  }, [selectedDomainId, selectedDays, activePanel]);

  // Load requests when panel switches to 'requests'
  useEffect(() => {
    if (activePanel !== 'requests') return;
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingRequests(true);
    requestService.getInbox({ page: 1, limit: 20 })
      .then(res => { if (mounted) setInboxRequests(res.items.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS')); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoadingRequests(false); });
    return () => { mounted = false; };
  }, [activePanel]);


  // Load panel keywords
  useEffect(() => {
    if (activePanel === 'ga4' || activePanel === 'requests' || !selectedDomainId) return;
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingPanel(true);
    const status = activePanel === 'deployed' ? 'deployed' : 'pending_approval';
    keywordGroupService.getGroups(selectedDomainId, 1, 20, '', 'desc', status)
      .then(res => { if (mounted) setPanelGroups(res.items); })
      .catch(() => { if (mounted) setPanelGroups([]); })
      .finally(() => { if (mounted) setLoadingPanel(false); });
    return () => { mounted = false; };
  }, [activePanel, selectedDomainId]);

  const handleCardClick = (panel: ActivePanel) => {
    setActivePanel(panel);
  };

  const unreadNotifs = notifItems.filter(n => !n.isRead).slice(0, 2);

  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname;
    if (path === '/domains') return 'domains';
    if (path === '/requests') return 'requests';
    if (path === '/users') return 'users';
    if (path === '/scraper/health') return 'scraper-health';
    return sessionStorage.getItem('dashboard_active_tab') || 'overview';
  });

  useEffect(() => {
    const path = location.pathname;
    if (path === '/domains') {
      setActiveTab('domains');
    } else if (path === '/requests') {
      setActiveTab('requests');
    } else if (path === '/users') {
      setActiveTab('users');
    } else if (path === '/scraper/health') {
      setActiveTab('scraper-health');
    } else if (path === '/') {
      const currentSavedTab = sessionStorage.getItem('dashboard_active_tab') || 'overview';
      if (['domains', 'requests', 'users', 'scraper-health'].includes(currentSavedTab)) {
        setActiveTab('overview');
        sessionStorage.setItem('dashboard_active_tab', 'overview');
      } else {
        setActiveTab(currentSavedTab);
      }
    }
  }, [location.pathname]);

  const [guideOpen, setGuideOpen] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return sessionStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      sessionStorage.setItem('sidebar_collapsed', String(next));
      window.dispatchEvent(new CustomEvent('sidebar_toggle', { detail: next }));
      return next;
    });
  };

  const handleTabChange = (tabId: string) => {
    if (tabId === 'overview') {
      navigate('/');
      setActiveTab('overview');
      sessionStorage.setItem('dashboard_active_tab', 'overview');
    } else if (tabId === 'domains') {
      navigate('/domains');
      setActiveTab('domains');
      sessionStorage.setItem('dashboard_active_tab', 'domains');
    } else if (tabId === 'requests') {
      navigate('/requests');
      setActiveTab('requests');
      sessionStorage.setItem('dashboard_active_tab', 'requests');
    } else if (tabId === 'users') {
      navigate('/users');
      setActiveTab('users');
      sessionStorage.setItem('dashboard_active_tab', 'users');
    } else if (tabId === 'scraper-health') {
      navigate('/scraper/health');
      setActiveTab('scraper-health');
      sessionStorage.setItem('dashboard_active_tab', 'scraper-health');
    } else {
      if (window.location.pathname !== '/') {
        navigate('/');
      }
      setActiveTab(tabId);
      sessionStorage.setItem('dashboard_active_tab', tabId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dockCategories = [
    {
      title: 'Tổng quan',
      items: [
        { id: 'overview', label: 'Tổng quan & Báo cáo', icon: <SpaceDashboardIcon sx={{ fontSize: 20 }} /> },
        { id: 'domains', label: 'Quản lý tên miền', icon: <LanguageOutlinedIcon sx={{ fontSize: 20 }} />, pageKey: 'domains' },
        { id: 'requests', label: 'Yêu cầu & Nhóm', icon: <AssignmentOutlinedIcon sx={{ fontSize: 20 }} />, pageKey: 'requests' },
        { id: 'users', label: 'Người dùng', icon: <PeopleOutlinedIcon sx={{ fontSize: 20 }} />, pageKey: 'users' },
      ]
    },
    {
      title: 'Quản lý từ khóa',
      items: [
        { id: 'trending-keywords', label: 'Xu hướng từ khóa', icon: <TrendingUpOutlinedIcon sx={{ fontSize: 20 }} /> },
        { id: 'vbpl', label: 'Gợi ý từ khóa AI', icon: <AutoAwesomeIcon sx={{ fontSize: 20 }} /> },
        { id: 'planner', label: 'Lập kế hoạch từ khóa', icon: <SearchIcon sx={{ fontSize: 20 }} /> },
        { id: 'serp', label: 'Kiểm tra thứ hạng (SERP)', icon: <EmojiEventsIcon sx={{ fontSize: 20 }} /> },
      ]
    },
    {
      title: 'Dịch vụ cào & Chỉ mục',
      items: [
        { id: 'index-checker', label: 'Kiểm tra lập chỉ mục', icon: <CloudDoneOutlinedIcon sx={{ fontSize: 20 }} /> },
        { id: 'scraper', label: 'Thu thập báo chí', icon: <ArticleOutlinedIcon sx={{ fontSize: 20 }} /> },
        { id: 'scraper-health', label: 'Tình trạng Scraper', icon: <DnsIcon sx={{ fontSize: 20 }} />, pageKey: 'scraper_health' },
        { id: 'scraper-url', label: 'Cào dữ liệu từ URL', icon: <LinkIcon sx={{ fontSize: 20 }} /> },
        { id: 'indexed', label: 'Ép chỉ mục Google', icon: <AndroidIcon sx={{ fontSize: 20 }} /> },
      ]
    },
    {
      title: 'Tối ưu & Đánh giá SEO',
      items: [
        { id: 'content-analysis', label: 'Tạo Outline bài viết AI', icon: <PsychologyIcon sx={{ fontSize: 20 }} /> },
        { id: 'seo-audit', label: 'Đánh giá SEO (Audit)', icon: <AssessmentOutlinedIcon sx={{ fontSize: 20 }} /> },
        { id: 'geo-tag', label: 'Định vị tọa độ ảnh (Geo Tag)', icon: <PlaceIcon sx={{ fontSize: 20 }} /> },
      ]
    }
  ];

  const sidebarWidth = sidebarCollapsed ? 76 : 260;

  const logoContainerSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: '10px',
    border: '1px solid',
    borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    background: (theme: Theme) => theme.palette.mode === 'dark' 
      ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
    boxShadow: (theme: Theme) => theme.palette.mode === 'dark'
      ? '0 4px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
      : '0 3px 6px rgba(0, 0, 0, 0.05), inset 0 1.5px 0 rgba(255, 255, 255, 0.9), 0 1px 2px rgba(0, 0, 0, 0.03)',
    transition: 'all 0.25s ease-in-out',
    '&:hover': {
      transform: 'translateY(-1.5px)',
      boxShadow: (theme: Theme) => theme.palette.mode === 'dark'
        ? '0 6px 14px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
        : '0 5px 10px rgba(0, 0, 0, 0.1), inset 0 1.5px 0 rgba(255, 255, 255, 1)',
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', md: 'row' }, 
      position: 'relative',
      ml: { xs: -2, md: -3 },
      mr: { xs: -2, md: -3 },
      mt: { xs: -2, md: -3 },
      mb: { xs: -12, md: -14 },
      minHeight: '100vh',
      zoom: 0.8
    }}>

      {/* Sidebar navigation */}
      <Paper
        elevation={0}
        sx={{
          width: { xs: '100%', md: sidebarWidth },
          flexShrink: 0,
          pt: 2, // Cố định padding top 16px để căn chỉnh dọc chuẩn với Header
          pl: sidebarCollapsed ? 1.5 : 2,
          pr: { xs: sidebarCollapsed ? 1.5 : 2, md: 0 }, // Bỏ padding right ở desktop để thanh scroll sát mép viền
          pb: { xs: 1.5, md: 0 }, // Giảm padding-bottom ở desktop để cuộn sát đáy
          borderRadius: 0,
          border: 'none',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          position: { xs: 'static', md: 'fixed' },
          left: 0,
          top: 0,
          bottom: { xs: 'auto', md: 0 },
          zIndex: 1100,
          height: { xs: 'auto', md: 'auto' },
          overflow: 'hidden', // Chỉ cho phép cuộn list ở trong, cố định header logo
          boxShadow: 'none',
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1), padding 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Brand logo / header inside sidebar */}
        <Box sx={{ 
          pl: 0,
          pr: sidebarCollapsed ? 0 : 2, 
          pt: 1.5,
          pb: 1.5,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: sidebarCollapsed ? 'center' : 'space-between', 
          flexDirection: sidebarCollapsed ? 'column' : 'row',
          gap: 1.5 
        }}>
          {!sidebarCollapsed && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={logoContainerSx}>
                <Box 
                  component="img"
                  src={LogoImage}
                  alt="ACC Logo"
                  sx={{ width: 28, height: 28, objectFit: 'contain' }}
                />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.5px' }}>
                ACC SEO
              </Typography>
            </Box>
          )}
          {sidebarCollapsed && (
            <Box sx={{ ...logoContainerSx, mb: 0.5 }}>
              <Box 
                component="img"
                src={LogoImage}
                alt="ACC Logo"
                sx={{ width: 28, height: 28, objectFit: 'contain' }}
              />
            </Box>
          )}
          <IconButton 
            onClick={toggleSidebar}
            size="small"
            sx={{ 
              color: 'text.secondary',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
              p: 0.5,
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            {sidebarCollapsed ? <ChevronRightIcon sx={{ fontSize: 18 }} /> : <ChevronLeftIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2, mr: sidebarCollapsed ? 0 : 2, borderStyle: 'solid', borderColor: 'divider' }} />

        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2, 
            flexGrow: 1,
            overflowY: 'auto',
            pb: 4, // Khoảng đệm dưới cùng khi cuộn xuống hết
            pr: 0,
            // Scrollbar phong cách tối giản, hiện đại
            '&::-webkit-scrollbar': {
              width: '5px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          {dockCategories.map((category, catIdx) => (
            <Box 
              key={category.title} 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 0.5,
                pr: sidebarCollapsed ? 0 : 2
              }}
            >
              {catIdx > 0 && (
                <Divider 
                  sx={{ 
                    borderStyle: 'solid', 
                    mb: 1.5, 
                    mt: 0.5,
                    borderColor: 'divider' 
                  }} 
                />
              )}
              
              {!sidebarCollapsed && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: '0.68rem', 
                    color: 'text.disabled', 
                    letterSpacing: '1.2px', 
                    px: 2, 
                    mb: 0.8,
                    textTransform: 'uppercase'
                  }}
                >
                  {category.title}
                </Typography>
              )}

               {category.items.map((tab) => {
                if (tab.pageKey && !canView(tab.pageKey)) {
                  return null;
                }
                const isActive = activeTab === tab.id;
                const content = (
                  <Box
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                      gap: sidebarCollapsed ? 0 : 2,
                      py: 1.2,
                      px: sidebarCollapsed ? 0 : 2,
                      width: sidebarCollapsed ? 46 : 'auto',
                      height: 46,
                      mx: sidebarCollapsed ? 'auto' : 0,
                      borderRadius: '100px',
                      cursor: 'pointer',
                      color: isActive ? 'primary.main' : 'text.secondary',
                      bgcolor: isActive 
                        ? (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 184, 148, 0.09)' : 'rgba(0, 184, 148, 0.06)'
                        : 'transparent',
                      border: 'none',
                      position: 'relative',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.9rem',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 8,
                        width: 4,
                        height: isActive ? 16 : 0,
                        borderRadius: '2px',
                        bgcolor: 'primary.main',
                        transition: 'height 0.2s ease-in-out',
                      },
                      '&:hover': {
                        color: isActive ? 'primary.main' : 'text.primary',
                        bgcolor: isActive 
                          ? (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 184, 148, 0.12)' : 'rgba(0, 184, 148, 0.08)'
                          : 'action.hover',
                        transform: (!isActive && !sidebarCollapsed) ? 'translateX(4px)' : 'none',
                        '& .MuiSvgIcon-root': {
                          color: isActive ? 'primary.main' : 'text.primary',
                          transform: 'scale(1.05)',
                        }
                      },
                      '&:active': {
                        transform: 'scale(0.97)'
                      },
                      '& .MuiSvgIcon-root': {
                        fontSize: 20,
                        color: isActive ? 'primary.main' : 'text.secondary',
                        transition: 'all 0.2s ease-in-out',
                        ml: sidebarCollapsed ? 0 : 0.5,
                      }
                    }}
                  >
                    {tab.icon}
                    {!sidebarCollapsed && (
                      <Typography sx={{ fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit' }}>
                        {tab.label}
                      </Typography>
                    )}
                  </Box>
                );

                if (sidebarCollapsed) {
                  return (
                    <Tooltip key={tab.id} title={tab.label} placement="right" arrow>
                      {content}
                    </Tooltip>
                  );
                }
                return content;
              })}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ 
        flexGrow: 1, 
        minWidth: 0, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 3, 
        p: { xs: 1.5, md: 2 }, 
        ml: { xs: 0, md: `${sidebarWidth}px` },
        transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>

      {/* Tab Content Panels */}
      <Box sx={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
        <Stack spacing={4}>
          {/* Header */}
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Stack spacing={1}>
              <Typography variant="h4" sx={{ letterSpacing: '-0.5px', fontWeight: 800, mb: 1 }}>
                Xin chào, {user?.name || 'Admin'}! 👋
              </Typography>

              {unreadNotifs.length > 0 ? (
                <Stack spacing={1} sx={{ width: '100%', maxWidth: 650 }}>
                  {unreadNotifs.map(n => {
                    const style = getNotificationStyle(n);
                    return (
                      <Stack 
                        key={n._id} 
                        direction="row" 
                        spacing={1.5}
                        onClick={() => handleNotifClick(n)}
                        sx={{ 
                          alignItems: 'flex-start',
                          cursor: 'pointer',
                          p: 1.2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: style.bgcolor,
                          transition: 'all 0.2s',
                          '&:hover': { 
                            bgcolor: 'action.hover',
                            transform: 'translateX(4px)',
                            borderColor: style.hoverBorder
                          },
                          width: '100%'
                        }}
                      >
                        {style.icon}
                        <Box sx={{ flexGrow: 1, minWidth: 0, mt: -0.2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                            {n.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                            {n.body}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.disabled', flexShrink: 0, mr: 1, alignSelf: 'flex-start' }}>
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                        </Typography>
                        {!n.isRead && (
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0, alignSelf: 'center' }} />
                        )}
                      </Stack>
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Không có thông báo mới
                </Typography>
              )}
            </Stack>
          </Stack>

          {/* Cards + Panel */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 4, alignItems: 'start' }}>
            {/* Left: stat cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              <StatCard
                title="Tên miền quản lý"
                value={stats.domains}
                icon={<PublicIcon sx={{ color: '#2563eb', fontSize: 22 }} />}
                bgColor="#bfdbfe" iconBgColor="#dbeafe"
                activeColor="#2563EB"
                active={activePanel === 'ga4'}
                onClick={() => handleCardClick('ga4')}
              />
              <StatCard
                title="Yêu cầu cần xử lý"
                value={stats.pendingRequests}
                icon={<InboxOutlinedIcon sx={{ color: '#4f46e5', fontSize: 22 }} />}
                bgColor="#c7d2fe" iconBgColor="#e0e7ff"
                activeColor="#4f46e5"
                active={activePanel === 'requests'}
                onClick={() => handleCardClick('requests')}
              />
              <StatCard
                title="Bài viết đã Index"
                value={stats.indexedArticles}
                icon={<CloudDoneOutlinedIcon sx={{ color: '#16A34A', fontSize: 22 }} />}
                bgColor="#bbf7d0" iconBgColor="#dcfce7"
                activeColor="#16A34A"
              />
              <StatCard
                title="Bài viết chưa Index"
                value={stats.notIndexedArticles}
                icon={<CloudOffOutlinedIcon sx={{ color: '#6B7280', fontSize: 22 }} />}
                bgColor="#e5e7eb" iconBgColor="#f3f4f6"
                activeColor="#6B7280"
              />
              <StatCard
                title="Bài viết tối ưu chờ duyệt"
                value={stats.pendingOptimizedArticles}
                icon={<TuneOutlinedIcon sx={{ color: '#6366f1', fontSize: 22 }} />}
                bgColor="#e0e7ff" iconBgColor="#c7d2fe"
                activeColor="#6366f1"
              />
              <StatCard
                title="Bài viết chờ duyệt"
                value={stats.pendingArticles}
                icon={<ArticleOutlinedIcon sx={{ color: '#8b5cf6', fontSize: 22 }} />}
                bgColor="#ede9fe" iconBgColor="#ddd6fe"
                activeColor="#8b5cf6"
              />
              <StatCard
                title="Bộ từ khóa triển khai"
                value={stats.deployedKeywords}
                icon={<DraftsOutlinedIcon sx={{ color: '#4f46e5', fontSize: 22 }} />}
                bgColor="#e0e7ff" iconBgColor="#c7d2fe"
                activeColor="#4f46e5"
                active={activePanel === 'deployed'}
                onClick={() => handleCardClick('deployed')}
              />
              <StatCard
                title="Bộ từ khóa chờ duyệt"
                value={stats.pendingKeywords}
                icon={<PendingActionsIcon sx={{ color: '#D97706', fontSize: 22 }} />}
                bgColor="#fde68a" iconBgColor="#fef3c7"
                activeColor="#D97706"
                active={activePanel === 'pending'}
                onClick={() => handleCardClick('pending')}
              />
              <StatCard
                title="Từ khóa phân tách chờ duyệt"
                value={stats.pendingKeywordSegments}
                icon={<CallSplitOutlinedIcon sx={{ color: '#EA580C', fontSize: 22 }} />}
                bgColor="#fed7aa" iconBgColor="#ffedd5"
                activeColor="#EA580C"
              />
            </Box>

            {/* Right: dynamic panel */}
            <Paper elevation={0} sx={{ borderRadius: 4, p: 3, display: 'flex', flexDirection: 'column', height: 400, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
              {activePanel === 'ga4' && (
                <Ga4Panel
                  domains={domains}
                  selectedDomainId={selectedDomainId}
                  onDomainChange={setSelectedDomainId}
                  selectedDays={selectedDays}
                  onDaysChange={setSelectedDays}
                  ga4Data={ga4Data}
                  loadingGa4={loadingGa4}
                />
              )}
              {activePanel === 'requests' && (
                <RequestsPanel requests={inboxRequests} loading={loadingRequests} navigate={navigate} />
              )}
              {(activePanel === 'deployed' || activePanel === 'pending') && (
                <KeywordPanel
                  groups={panelGroups}
                  loading={loadingPanel}
                  title={activePanel === 'deployed' ? 'Từ khoá đã triển khai' : 'Từ khoá chờ phê duyệt'}
                  domains={domains}
                  selectedDomainId={selectedDomainId}
                  onDomainChange={setSelectedDomainId}
                  navigate={navigate}
                />
              )}
            </Paper>
          </Box>

          {/* System Usage Stats Section */}
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>}>
            <UsageStatsSection />
          </Suspense>

          {/* Bottom section: Activity Logs */}
          {activeTab === 'overview' && (
            <ActivitySection onViewAll={() => setActivitiesDialogOpen(true)} />
          )}
        </Stack>
      </Box>

      {activeTab === 'trending-keywords' && (
        <Box sx={{ mt: 1 }}>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
            <TrendingKeywordsSection />
          </Suspense>
        </Box>
      )}

      {activeTab === 'vbpl' && (
        <Box sx={{ mt: 1 }}>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
            <VbplSuggestionsSection />
          </Suspense>
        </Box>
      )}

      {activeTab === 'planner' && (
        <Box sx={{ mt: 1 }}>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
            <KeywordPlannerSection />
          </Suspense>
        </Box>
      )}

      {activeTab === 'serp' && (
        <Box sx={{ mt: 1 }}>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
            <QuickSerpChecker />
          </Suspense>
        </Box>
      )}

      {activeTab === 'index-checker' && (
        <Box sx={{ mt: 1 }}>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
            <GoogleIndexChecker isActive={activeTab === 'index-checker'} />
          </Suspense>
        </Box>
      )}

      {activeTab === 'scraper' && (
        <Box sx={{ mt: 1 }}>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
            <ScraperSection />
          </Suspense>
        </Box>
      )}

      {activeTab === 'scraper-health' && (
        <Box sx={{ mt: 1 }}>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
            <ScraperHealthSection />
          </Suspense>
        </Box>
      )}

      {activeTab === 'scraper-url' && (
        <Box sx={{ mt: 1 }}>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
            <UrlScraperSection />
          </Suspense>
        </Box>
      )}

      {activeTab === 'content-analysis' && (
        <Box sx={{ mt: 1 }}>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
            <ContentAnalysisSection isActive={activeTab === 'content-analysis'} />
          </Suspense>
        </Box>
      )}

      {activeTab === 'indexed' && (
        <Box sx={{ mt: 1 }}>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
            <ForceIndexUnifiedSection isActive={activeTab === 'indexed'} />
          </Suspense>
        </Box>
      )}

      {activeTab === 'seo-audit' && (
        <Box sx={{ mt: 1 }}>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
            <SeoAuditSection />
          </Suspense>
        </Box>
      )}

      {activeTab === 'geo-tag' && (
        <Box sx={{ mt: 1 }}>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
            <GeoTagSection />
          </Suspense>
        </Box>
      )}

      {activeTab === 'domains' && (
        <Box sx={{ mt: 1 }}>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
            <DomainPage />
          </Suspense>
        </Box>
      )}

      {activeTab === 'requests' && (
        <Box sx={{ mt: 1 }}>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
            <RequestsPage />
          </Suspense>
        </Box>
      )}

      {activeTab === 'users' && (
        <Box sx={{ mt: 1 }}>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
            <UserPage />
          </Suspense>
        </Box>
      )}

      </Box>

      {/* Nút hướng dẫn sử dụng dạng nút tròn ở góc dưới bên phải */}
      <Tooltip title="Hướng dẫn sử dụng" placement="left" arrow>
        <IconButton
          onClick={() => setGuideOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1200,
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: '#fff',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              bgcolor: 'primary.dark',
              transform: 'scale(1.08) translateY(-2px)',
            },
            '&:active': {
              transform: 'scale(0.95) translateY(0)'
            }
          }}
        >
          <HelpOutlinedIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </Tooltip>

      {/* Dialog xem toàn bộ hoạt động */}
      <Dialog
        open={activitiesDialogOpen}
        onClose={() => setActivitiesDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.2rem', pb: 1, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box 
            sx={{ 
              width: 32, 
              height: 32, 
              borderRadius: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#fff' 
            }}
          >
            <HistoryOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
          Toàn bộ lịch sử hoạt động hệ thống
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'divider', p: 0, height: 600 }}>
          <Box sx={{ height: '100%', overflow: 'hidden' }}>
            <ActivitySection />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button 
            onClick={() => setActivitiesDialogOpen(false)} 
            variant="contained"
            sx={{
              borderRadius: '100px',
              fontWeight: 800,
              textTransform: 'none',
              px: 3,
              py: 0.8,
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Hướng dẫn sử dụng */}
      <Dialog
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.2rem', pb: 1, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box 
            sx={{ 
              width: 32, 
              height: 32, 
              borderRadius: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: 'linear-gradient(135deg, #00b894 0%, #00a884 100%)',
              color: '#fff' 
            }}
          >
            <HelpOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
          {TAB_GUIDES[activeTab]?.title || 'Hướng dẫn sử dụng'}
        </DialogTitle>
        
        <DialogContent dividers sx={{ borderColor: 'divider', py: 2.5 }}>
          {TAB_GUIDES[activeTab]?.content || (
            <Typography variant="body2" color="text.secondary">
              Không có hướng dẫn chi tiết cho tính năng này.
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button 
            onClick={() => setGuideOpen(false)} 
            variant="contained"
            sx={{
              borderRadius: '100px',
              fontWeight: 800,
              textTransform: 'none',
              px: 3,
              py: 0.8,
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            Đã hiểu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
