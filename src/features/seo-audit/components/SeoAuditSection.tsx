import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
  Alert,
  Divider,
  Pagination,
  Grid,
  Skeleton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

// Icons
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HistoryIcon from '@mui/icons-material/History';
import SpeedIcon from '@mui/icons-material/Speed';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';

// New Icons replacing emojis
import SearchIcon from '@mui/icons-material/Search';
import ImageIcon from '@mui/icons-material/Image';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LockIcon from '@mui/icons-material/Lock';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import WarningIcon from '@mui/icons-material/Warning';
import LinkIcon from '@mui/icons-material/Link';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PaletteIcon from '@mui/icons-material/Palette';
import StraightenIcon from '@mui/icons-material/Straighten';
import BarChartIcon from '@mui/icons-material/BarChart';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import InboxIcon from '@mui/icons-material/Inbox';
import SaveIcon from '@mui/icons-material/Save';
import LayersIcon from '@mui/icons-material/Layers';
import AssignmentIcon from '@mui/icons-material/Assignment';

import { saveAs } from 'file-saver';

import { seoAuditService } from '@/features/seo-audit/seoAuditService';
import type { SeoReport, Criterion } from '@/features/seo-audit/types';
import { useToastify } from '@/components/Toastify';

// Vietnamese Time Formatter
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

// Formatting Helper for Bytes
const formatBytes = (bytes: number | undefined | null) => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Threshold-based color generator
const getScoreColor = (score: number) => {
  if (score >= 80) return '#00b894'; // Xanh lá
  if (score >= 50) return '#f1c40f'; // Vàng
  return '#d63031'; // Đỏ
};

// Emojis mapping for 8 sections
const SECTION_CONFIGS: Record<string, { label: string; icon: React.ReactNode }> = {
  seo_basic: { label: 'SEO Cơ Bản', icon: <SearchIcon /> },
  images: { label: 'Tối Ưu Hình Ảnh', icon: <ImageIcon /> },
  performance: { label: 'Tốc Độ & Hiệu Năng', icon: <SpeedIcon /> },
  core_web_vitals: { label: 'Core Web Vitals', icon: <TrendingUpIcon /> },
  security: { label: 'Bảo Mật', icon: <LockIcon /> },
  mobile: { label: 'Mobile & UX', icon: <PhoneIphoneIcon /> },
  errors: { label: 'Lỗi & Console', icon: <WarningIcon /> },
  url_redirect: { label: 'URL & Redirect', icon: <LinkIcon /> },
};

// Sort Criteria: fail -> warn -> pass
const sortCriteria = (criteria: Criterion[]) => {
  const order = { fail: 1, warn: 2, pass: 3 };
  return [...criteria].sort((a, b) => order[a.status] - order[b.status]);
};

// Formatter for Word Document (.doc) Evidence
const formatEvidenceForDoc = (key: string, evidence: unknown): string => {
  if (evidence === null || evidence === undefined) return '';
  try {
    switch (key) {
      case 'title': {
        const ev = evidence as { value?: string; length?: number };
        const val = ev.value || '';
        const len = ev.length || val.length || 0;
        return `<div><strong>Nội dung thẻ Title:</strong> "${val}" (${len} ký tự)</div>`;
      }
      case 'meta_description': {
        const ev = evidence as { value?: string; length?: number };
        const val = ev.value || '';
        const len = ev.length || val.length || 0;
        return `<div><strong>Nội dung Meta Description:</strong> "${val}" (${len} ký tự)</div>`;
      }
      case 'headings': {
        const ev = evidence as { h1?: string[]; h2?: string[]; h3?: string[]; h4?: string[] };
        let html = '';
        const renderList = (tag: string, arr: string[] | undefined) => {
          if (!arr || arr.length === 0) return '';
          return `<div style="margin-top: 5px;"><strong>Danh sách thẻ ${tag.toUpperCase()} (${arr.length}):</strong><ul style="margin: 3px 0 3px 20px; padding: 0;">` +
            arr.map(h => `<li>${h}</li>`).join('') +
            '</ul></div>';
        };
        html += renderList('h1', ev.h1);
        html += renderList('h2', ev.h2);
        html += renderList('h3', ev.h3);
        html += renderList('h4', ev.h4);
        return html;
      }
      case 'canonical':
      case 'favicon': {
        const ev = evidence as { href?: string };
        return `<div><strong>Đường dẫn:</strong> <a href="${ev.href}">${ev.href}</a></div>`;
      }
      case 'robots_txt': {
        const ev = evidence as { url?: string };
        return `<div><strong>Đường dẫn Robots.txt:</strong> <a href="${ev.url}">${ev.url}</a></div>`;
      }
      case 'sitemap': {
        const ev = evidence as { urls?: string[] };
        if (!ev.urls || ev.urls.length === 0) return 'Không tìm thấy sitemap';
        return `<div><strong>Sitemap URLs:</strong><ul style="margin: 3px 0 3px 20px; padding: 0;">` +
          ev.urls.map((u: string) => `<li><a href="${u}">${u}</a></li>`).join('') +
          '</ul></div>';
      }
      case 'keyword_density': {
        const items = (Array.isArray(evidence) ? evidence : []) as Array<{ keyword: string; count: number; density: number }>;
        if (items.length === 0) return '';
        return '<strong>Mật độ từ khóa:</strong><table style="width: auto; border: 1px solid #ddd; border-collapse: collapse; margin-top: 5px;">' +
          '<tr><th style="padding: 4px 8px; border: 1px solid #ddd; background-color: #f8fafc;">Từ khóa</th><th style="padding: 4px 8px; border: 1px solid #ddd; background-color: #f8fafc;">Số lượng</th><th style="padding: 4px 8px; border: 1px solid #ddd; background-color: #f8fafc;">Mật độ</th></tr>' +
          items.slice(0, 10).map((x: { keyword: string; count: number; density: number }) => `<tr><td style="padding: 4px 8px; border: 1px solid #ddd;">${x.keyword}</td><td style="padding: 4px 8px; border: 1px solid #ddd; text-align: center;">${x.count}</td><td style="padding: 4px 8px; border: 1px solid #ddd; text-align: center;">${(x.density * 100).toFixed(2)}%</td></tr>`).join('') +
          '</table>';
      }
      case 'images_alt_missing': {
        const ev = evidence as { images?: Array<{ src?: string } | string> };
        const list = Array.isArray(ev.images) ? ev.images : [];
        if (list.length === 0) return 'Không có ảnh thiếu Alt';
        return `<div><strong>Danh sách ảnh thiếu thẻ ALT (${list.length}):</strong><ul style="margin: 3px 0 3px 20px; padding: 0;">` +
          list.slice(0, 10).map((img: { src?: string } | string) => {
            const src = typeof img === 'string' ? img : (img.src || '');
            return `<li><a href="${src}">${src}</a></li>`;
          }).join('') +
          (list.length > 10 ? `<li>... và ${list.length - 10} ảnh khác</li>` : '') +
          '</ul></div>';
      }
      default: {
        if (typeof evidence === 'object' && evidence !== null) {
          const entries = Object.entries(evidence).filter((entry) => typeof entry[1] !== 'object' && entry[1] !== null && entry[1] !== undefined);
          if (entries.length > 0) {
            return '<div style="margin-top: 5px;">' +
              entries.map(([k, v]) => `<strong>${k}:</strong> ${v}`).join('<br/>') +
              '</div>';
          }
        }
        return '';
      }
    }
  } catch (err) {
    console.error('Error formatting evidence for doc', err);
    return '';
  }
};

// Dynamic Evidence Renderer based on key
const renderEvidence = (key: string, evidence: unknown) => {
  if (evidence === null || evidence === undefined) return null;

  try {
    switch (key) {
      case 'title': {
        const ev = evidence as { value?: string; length?: number; max?: number };
        const val = ev.value || '';
        const len = ev.length || val.length || 0;
        const max = ev.max || 60;
        const ratio = Math.min((len / max) * 100, 100);
        return (
          <Box sx={{ mt: 1.5, p: 2, bgcolor: 'action.hover', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.8 }}>Dữ liệu thẻ Title:</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'background.paper', p: 1, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', mb: 1.5, wordBreak: 'break-all' }}>
              "{val}"
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LinearProgress variant="determinate" value={ratio} color={len > max ? 'error' : 'success'} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                {len} / {max} ký tự
              </Typography>
            </Box>
          </Box>
        );
      }

      case 'meta_description': {
        const ev = evidence as { value?: string; length?: number };
        const val = ev.value || '';
        const len = ev.length || val.length || 0;
        return (
          <Box sx={{ mt: 1.5, p: 2, bgcolor: 'action.hover', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.8 }}>Dữ liệu Meta Description:</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'background.paper', p: 1, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', mb: 1, wordBreak: 'break-all' }}>
              "{val}"
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
              Độ dài: {len} ký tự
            </Typography>
          </Box>
        );
      }

      case 'social_meta': {
        const ev = evidence as { openGraph?: Record<string, string>; twitterCard?: Record<string, string> };
        const og = ev.openGraph || {};
        const twitter = ev.twitterCard || {};
        const renderTable = (title: string, obj: Record<string, string>) => {
          const entries = Object.entries(obj);
          if (entries.length === 0) return null;
          return (
            <Box sx={{ flex: 1, minWidth: 280 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1 }}>{title}</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 220, overflowY: 'auto', overflowX: 'auto', borderRadius: 2.5 }}>
                <Table size="small" stickyHeader>
                  <TableBody>
                    {entries.map(([k, v]) => (
                      <TableRow key={k} hover>
                        <TableCell sx={{ fontSize: '0.72rem', py: 0.8, fontWeight: 700, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}>{k}</TableCell>
                        <TableCell sx={{ fontSize: '0.72rem', py: 0.8, borderBottom: '1px solid', borderColor: 'divider', wordBreak: 'break-all' }}>{String(v)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          );
        };
        return (
          <Box sx={{ mt: 1.5, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {renderTable('Open Graph Meta Tags', og)}
            {renderTable('Twitter Card Meta Tags', twitter)}
          </Box>
        );
      }

      case 'google_preview': {
        const ev = evidence as { title?: string; url?: string; description?: string };
        return (
          <Box sx={{ mt: 1.5, p: 2.5, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'action.hover' : '#ffffff', border: '1px solid', borderColor: 'divider', borderRadius: 2.5, maxWidth: 600 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 1.5 }}>Xem trước hiển thị Google Tìm Kiếm (SERP Preview):</Typography>
            <Box sx={{ fontFamily: 'Arial, sans-serif', textAlign: 'left' }}>
              <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#8ab4f8' : '#1a0dab', fontSize: '1.2rem', lineHeight: 1.3, mb: 0.25, '&:hover': { textDecoration: 'underline', cursor: 'pointer' } }}>
                {ev.title || 'Chưa cấu hình Title'}
              </Typography>
              <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#81c784' : '#006621', fontSize: '0.85rem', mb: 0.5, wordBreak: 'break-all' }}>
                {ev.url || 'https://example.com'}
              </Typography>
              <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#bdc1c6' : '#545454', fontSize: '0.82rem', lineHeight: 1.4 }}>
                {ev.description || 'Chưa cấu hình thẻ Meta Description.'}
              </Typography>
            </Box>
          </Box>
        );
      }

      case 'top_keywords':
      case 'keyword_cloud': {
        const ev = evidence as { keywords?: Array<{ word: string; count: number }> };
        const list = ev.keywords || [];
        if (list.length === 0) return null;
        return (
          <Box sx={{ mt: 1.5, p: 2, bgcolor: 'action.hover', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 1.5 }}>Mật độ từ khóa phổ biến:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {list.map((kw: { word: string; count: number }, idx: number) => {
                let col: 'primary' | 'secondary' | 'default' = 'default';
                if (kw.count >= 8) col = 'primary';
                else if (kw.count >= 4) col = 'secondary';
                return (
                  <Chip
                    key={idx}
                    label={`${kw.word} (${kw.count})`}
                    color={col}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700, borderRadius: '100px' }}
                  />
                );
              })}
            </Box>
          </Box>
        );
      }

      case 'keyword_distribution': {
        const ev = evidence as { table?: Array<{ keyword: string; inTitle: boolean; inDescription: boolean; inHeadings: boolean }> };
        const rows = ev.table || [];
        if (rows.length === 0) return null;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 1 }}>Sự phân bố của các từ khóa chính:</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Từ khóa</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Thẻ Title</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Thẻ Description</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Thẻ Heading</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row: { keyword: string; inTitle: boolean; inDescription: boolean; inHeadings: boolean }, idx: number) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{row.keyword}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.75rem' }}>{row.inTitle ? '✅' : '❌'}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.75rem' }}>{row.inDescription ? '✅' : '❌'}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.75rem' }}>{row.inHeadings ? '✅' : '❌'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
      }

      case 'headings': {
        const ev = evidence as { h1?: string[]; h2?: string[]; h3?: string[]; h4?: string[] };
        const renderList = (tag: string, arr: string[] | undefined) => {
          if (!arr || arr.length === 0) return null;
          return (
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                Danh sách thẻ {tag.toUpperCase()} ({arr.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: 1.5, borderLeft: '2px solid', borderColor: 'divider' }}>
                {arr.map((h, i) => (
                  <Typography key={i} variant="body2" sx={{ fontSize: '0.78rem', color: 'text.primary' }}>
                    - {h}
                  </Typography>
                ))}
              </Box>
            </Box>
          );
        };
        return (
          <Box sx={{ mt: 1.5, p: 2, bgcolor: 'action.hover', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
            {renderList('h1', ev.h1)}
            {renderList('h2', ev.h2)}
            {renderList('h3', ev.h3)}
            {renderList('h4', ev.h4)}
          </Box>
        );
      }

      case 'robots_txt': {
        const ev = evidence as { url?: string };
        if (!ev.url) return null;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Button variant="outlined" size="small" href={ev.url} target="_blank" rel="noopener noreferrer" startIcon={<OpenInNewIcon />} sx={{ textTransform: 'none', borderRadius: '100px' }}>
              Mở link Robots.txt
            </Button>
          </Box>
        );
      }

      case 'canonical':
      case 'favicon': {
        const ev = evidence as { href?: string };
        if (!ev.href) return null;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1, fontWeight: 700 }}>Đường dẫn:</Typography>
            <Link href={ev.href} target="_blank" rel="noopener noreferrer" underline="none" sx={{ color: 'primary.main', fontWeight: 500, fontSize: '0.78rem', wordBreak: 'break-all', '&:hover': { textDecoration: 'underline' } }}>
              {ev.href}
            </Link>
          </Box>
        );
      }

      case 'structured_data': {
        const ev = evidence as { types?: string[] };
        const types = ev.types || [];
        if (types.length === 0) return null;
        return (
          <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {types.map((type: string, idx: number) => (
              <Chip key={idx} label={type} size="small" color="primary" sx={{ fontWeight: 700, borderRadius: '100px' }} />
            ))}
          </Box>
        );
      }

      case 'charset': {
        const ev = evidence as { value?: string };
        if (!ev.value) return null;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>Kiểu mã hóa: <Chip label={ev.value} size="small" color="secondary" sx={{ fontWeight: 700, borderRadius: '100px' }} /></Typography>
          </Box>
        );
      }

      case 'compression': {
        const ev = evidence as { algo?: string };
        if (!ev.algo) return null;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>Chuẩn nén truyền tải: <Chip label={ev.algo} size="small" color="success" sx={{ fontWeight: 700, borderRadius: '100px' }} /></Typography>
          </Box>
        );
      }

      case 'viewport': {
        const ev = evidence as { content?: string };
        if (!ev.content) return null;
        return (
          <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.75rem', border: '1px solid', borderColor: 'divider' }}>
            {ev.content}
          </Box>
        );
      }

      case 'deprecated_tags': {
        const ev = evidence as { tags?: string[] };
        const tags = ev.tags || [];
        if (tags.length === 0) return null;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.8 }}>Các thẻ HTML lỗi thời:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {tags.map((t: string, idx: number) => (
                <Chip key={idx} label={`<${t}>`} size="small" color="error" variant="outlined" sx={{ fontWeight: 700, borderRadius: '100px' }} />
              ))}
            </Box>
          </Box>
        );
      }

      case 'modern_image_format': {
        const ev = evidence as { legacy?: string[] };
        const legacy = ev.legacy || [];
        if (legacy.length === 0) return null;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.8 }}>Ảnh định dạng cũ cần tối ưu hóa:</Typography>
            <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {legacy.slice(0, 5).map((url: string, idx: number) => (
                <Link key={idx} href={url} target="_blank" rel="noopener noreferrer" underline="none" sx={{ display: 'block', color: 'primary.main', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 500, fontSize: '0.75rem', '&:hover': { textDecoration: 'underline' } }}>
                  - {url}
                </Link>
              ))}
              {legacy.length > 5 && (
                <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                  ... và {legacy.length - 5} ảnh khác.
                </Typography>
              )}
            </List>
          </Box>
        );
      }

      case 'aspect_ratio':
      case 'image_size': {
        const ev = evidence as { items?: Array<{ src: string; display: string; natural: string }> };
        const items = ev.items || [];
        if (items.length === 0) return null;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 1 }}>Kích thước ảnh thực tế:</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Hình ảnh</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Hiển thị</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Kích thước gốc</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.slice(0, 5).map((row: { src: string; display: string; natural: string }, idx: number) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 32, height: 32, borderRadius: 1, border: '1px solid', borderColor: 'divider', overflow: 'hidden', bgcolor: 'action.hover', flexShrink: 0 }}>
                            <img src={row.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </Box>
                          <Link href={row.src} target="_blank" rel="noopener noreferrer" underline="none" sx={{ display: 'inline-block', color: 'primary.main', maxWidth: 200, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 500, fontSize: '0.75rem', '&:hover': { textDecoration: 'underline' } }}>
                            {row.src}
                          </Link>
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.72rem' }}>{row.display}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.72rem' }}>{row.natural}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {items.length > 5 && (
              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', display: 'block', mt: 1 }}>
                ... và {items.length - 5} ảnh khác.
              </Typography>
            )}
          </Box>
        );
      }

      case 'render_blocking': {
        const ev = evidence as { count?: number; urls?: string[] };
        const count = ev.count || 0;
        const urls = ev.urls || [];
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
              ⚠️ Có {count} tài nguyên chặn quá trình render trang:
            </Typography>
            {urls.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: 1.5, borderLeft: '2px solid', borderColor: 'divider' }}>
                {urls.slice(0, 5).map((url: string, idx: number) => (
                  <Link key={idx} href={url} target="_blank" rel="noopener noreferrer" underline="none" sx={{ color: 'primary.main', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 500, fontSize: '0.75rem', '&:hover': { textDecoration: 'underline' } }}>
                    - {url}
                  </Link>
                ))}
                {urls.length > 5 && (
                  <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                    ... và {urls.length - 5} tài nguyên khác.
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        );
      }

      case 'http_requests': {
        const ev = evidence as { count?: number; bytes?: Record<string, number> };
        const count = ev.count || 0;
        const b = ev.bytes || {};
        const total = Object.values(b).reduce((acc: number, cur: unknown) => acc + (Number(cur) || 0), 0) as number;
        const categories = [
          { key: 'image', label: 'Hình ảnh', color: '#10ac84', val: b.image || 0 },
          { key: 'javascript', label: 'JS Scripts', color: '#ff9f43', val: b.javascript || 0 },
          { key: 'css', label: 'CSS Styles', color: '#2e86de', val: b.css || 0 },
          { key: 'font', label: 'Fonts', color: '#ee5253', val: b.font || 0 },
          { key: 'html', label: 'HTML', color: '#8395a7', val: b.html || 0 },
          { key: 'other', label: 'Khác', color: '#576574', val: b.other || 0 }
        ].filter(c => c.val > 0);

        return (
          <Box sx={{ mt: 1.5, p: 2, bgcolor: 'action.hover', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Yêu cầu HTTP: {count} request (Dung lượng: {formatBytes(total)})
            </Typography>
            
            {/* Custom stacked progress bar */}
            <Box sx={{ width: '100%', height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex', mb: 2, bgcolor: 'action.selected' }}>
              {categories.map((c, idx) => {
                const widthPct = total > 0 ? (c.val / total) * 100 : 0;
                return (
                  <Box
                    key={idx}
                    sx={{
                      width: `${widthPct}%`,
                      height: '100%',
                      bgcolor: c.color
                    }}
                  />
                );
              })}
            </Box>

            {/* Legend grid */}
            <Grid container spacing={1.5}>
              {categories.map((c, idx) => (
                <Grid size={{ xs: 6, sm: 4 }} key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color, flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ fontWeight: 650, color: 'text.secondary' }}>
                    {c.label}: {formatBytes(c.val)}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      }

      case 'load_time':
      case 'ttfb':
      case 'fcp':
      case 'lcp': {
        const ev = evidence as { valueMs?: number; value?: number; goodMaxMs?: number; goodLimit?: number; warnMaxMs?: number; warnLimit?: number };
        const isMs = typeof ev.valueMs === 'number';
        const val = isMs ? ev.valueMs : (ev.value || 0);
        const goodMax = isMs ? ev.goodMaxMs : (ev.goodLimit || 0.1);
        const warnMax = isMs ? ev.warnMaxMs : (ev.warnLimit || 0.25);
        
        let color = '#d63031'; // Red
        let scoreLabel = 'Kém';
        if (val <= goodMax) {
          color = '#00b894'; // Green
          scoreLabel = 'Tốt';
        } else if (val <= warnMax) {
          color = '#f1c40f'; // Yellow
          scoreLabel = 'Cần cải thiện';
        }

        const valueDisplay = isMs ? `${val} ms` : String(val);
        const goodDisplay = isMs ? `${goodMax} ms` : String(goodMax);
        const warnDisplay = isMs ? `${warnMax} ms` : String(warnMax);

        return (
          <Box sx={{ mt: 1.5, p: 2, bgcolor: 'action.hover', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Thời gian đo được: <span style={{ color }}>{valueDisplay}</span> ({scoreLabel})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'text.secondary', mb: 1 }}>
              <span>Tốt (≤ {goodDisplay})</span>
              <span>Khá (≤ {warnDisplay})</span>
              <span>Kém (&gt; {warnDisplay})</span>
            </Box>
            <Box sx={{ position: 'relative', width: '100%', height: 6, bgcolor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min((val / (warnMax * 1.5 || 1)) * 100, 100)}%`, bgcolor: color, borderRadius: 3 }} />
            </Box>
          </Box>
        );
      }

      case 'cls': {
        const ev = evidence as { value?: number };
        const val = typeof ev.value === 'number' ? ev.value : 0;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Điểm tích lũy thay đổi bố cục (CLS): <Chip label={val} size="small" color={val <= 0.1 ? 'success' : 'error'} sx={{ fontWeight: 700, borderRadius: '100px' }} />
            </Typography>
          </Box>
        );
      }

      case 'html_size': {
        const ev = evidence as { kb?: number; avgKb?: number };
        const kb = ev.kb || 0;
        const avgKb = ev.avgKb || 100;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Dung lượng trang HTML: <span style={{ color: kb <= avgKb ? '#00b894' : '#d63031' }}>{kb} KB</span> (Trung bình ngành: {avgKb} KB)
            </Typography>
          </Box>
        );
      }

      case 'dom_size': {
        const ev = evidence as { nodes?: number; limit?: number };
        const nodes = ev.nodes || 0;
        const limit = ev.limit || 1500;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Số lượng DOM nodes: <span style={{ color: nodes <= limit ? '#00b894' : '#d63031' }}>{nodes} nodes</span> (Giới hạn: {limit} nodes)
            </Typography>
          </Box>
        );
      }

      case 'cache_images':
      case 'cache_js':
      case 'cache_css': {
        const ev = evidence as { cached?: number; total?: number };
        const cached = ev.cached || 0;
        const total = ev.total || 0;
        const ratio = total > 0 ? Math.round((cached / total) * 100) : 0;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Tỷ lệ tài nguyên được thiết lập Cache: <span style={{ color: ratio >= 70 ? '#00b894' : '#f1c40f' }}>{cached}/{total} ({ratio}%)</span>
            </Typography>
          </Box>
        );
      }

      // Default count fallback for specific count keys
      default: {
        const ev = evidence as { count?: number };
        if (typeof ev.count === 'number') {
          return (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Số lượng phát hiện: <span style={{ color: ev.count === 0 ? '#00b894' : '#d63031' }}>{ev.count}</span>
              </Typography>
            </Box>
          );
        }
        return null;
      }
    }
  } catch (e) {
    console.error('Error rendering evidence:', e);
    return null;
  }
};

// Metric Card interface and renderer
interface MetricCardProps {
  title: string;
  icon: React.ReactNode;
  value: string;
  statusLabel: string;
  statusColor: string;
  isUnavailable: boolean;
}

const MetricCard = ({ title, icon, value, statusLabel, statusColor, isUnavailable }: MetricCardProps) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3.5,
        bgcolor: isUnavailable ? 'action.hover' : 'transparent',
        borderColor: isUnavailable
          ? 'divider'
          : statusColor === 'text.primary' || statusColor === 'text.secondary'
          ? 'divider'
          : `${statusColor}40`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: isUnavailable
            ? 'divider'
            : statusColor === 'text.primary' || statusColor === 'text.secondary'
            ? 'primary.main'
            : statusColor,
          transform: isUnavailable ? 'none' : 'scale(1.02)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
        <Box sx={{ display: 'flex', color: isUnavailable ? 'text.disabled' : statusColor === 'text.secondary' || statusColor === 'text.primary' ? 'text.secondary' : statusColor, '& svg': { fontSize: '1.25rem' } }}>
          {icon}
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: 0.2 }}>
          {title}
        </Typography>
      </Box>
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 900,
            color: isUnavailable
              ? 'text.disabled'
              : statusColor === 'text.secondary'
              ? 'text.primary'
              : statusColor,
            mb: 0.5,
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontWeight: 700,
            color: isUnavailable
              ? 'text.disabled'
              : statusColor === 'text.primary' || statusColor === 'text.secondary'
              ? 'text.secondary'
              : statusColor,
            fontStyle: isUnavailable ? 'italic' : 'normal',
          }}
        >
          {statusLabel}
        </Typography>
      </Box>
    </Paper>
  );
};

const getMetricStatus = (key: string, val: number | null | undefined) => {
  if (val === null || val === undefined) {
    return { label: 'không đo được', color: 'text.secondary', text: '—' };
  }

  switch (key) {
    case 'ttfb': {
      const s = val / 1000;
      const text = `${s.toFixed(2)}s`;
      if (s <= 0.8) return { label: 'Tốt', color: '#00b894', text };
      if (s <= 1.8) return { label: 'Cần cải thiện', color: '#f1c40f', text };
      return { label: 'Kém', color: '#d63031', text };
    }
    case 'fcp': {
      const s = val / 1000;
      const text = `${s.toFixed(2)}s`;
      if (s <= 1.8) return { label: 'Tốt', color: '#00b894', text };
      if (s <= 3.0) return { label: 'Cần cải thiện', color: '#f1c40f', text };
      return { label: 'Kém', color: '#d63031', text };
    }
    case 'lcp': {
      const s = val / 1000;
      const text = `${s.toFixed(2)}s`;
      if (s <= 2.5) return { label: 'Tốt', color: '#00b894', text };
      if (s <= 4.0) return { label: 'Cần cải thiện', color: '#f1c40f', text };
      return { label: 'Kém', color: '#d63031', text };
    }
    case 'cls': {
      const text = val.toFixed(4);
      if (val <= 0.1) return { label: 'Tốt', color: '#00b894', text };
      if (val <= 0.25) return { label: 'Cần cải thiện', color: '#f1c40f', text };
      return { label: 'Kém', color: '#d63031', text };
    }
    case 'domNodes': {
      const text = val.toLocaleString('en-US');
      if (val < 1500) return { label: 'Tốt (ngưỡng < 1,500)', color: '#00b894', text };
      if (val <= 3000) return { label: 'Cần cải thiện', color: '#f1c40f', text };
      return { label: 'Kém', color: '#d63031', text };
    }
    case 'load': {
      return { label: 'Thời gian tải', color: 'text.primary', text: `${(val / 1000).toFixed(2)}s` };
    }
    case 'requests': {
      return { label: 'Số yêu cầu', color: 'text.primary', text: val.toString() };
    }
    case 'bytes': {
      return { label: 'Tổng dung lượng', color: 'text.primary', text: `${(val / 1048576).toFixed(2)} MB` };
    }
    default:
      return { label: '', color: 'text.primary', text: String(val) };
  }
};

export default function SeoAuditSection() {
  const { showToast } = useToastify();

  // Input states
  const [urlInput, setUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Filtering states
  const [filterStatus, setFilterStatus] = useState<'all' | 'fail' | 'warn'>('all');

  // Detail display state
  const [activeReport, setActiveReport] = useState<SeoReport | null>(null);

  // Pagination states
  const [historyPage, setHistoryPage] = useState(1);
  const historyLimit = 20;

  // Fetch history using SWR
  const {
    data: historyData,
    error: historyError,
    mutate: mutateHistory,
    isValidating: historyValidating,
  } = useSWR(
    ['/api/v1/seo-audit/history', historyPage],
    () => seoAuditService.getHistory(historyPage, historyLimit),
    {
      revalidateOnFocus: false,
    }
  );

  // Run new audit
  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) {
      setSubmitError('Vui lòng nhập URL');
      return;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setSubmitError('URL không hợp lệ. Phải bắt đầu bằng http:// hoặc https://');
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      setSubmitError('Định dạng URL sai cấu trúc');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      showToast('Đang cào trang và đo Core Web Vitals bằng trình duyệt, có thể mất 5–35 giây...', 'info');
      const res = await seoAuditService.runAudit(trimmedUrl);
      setActiveReport(res);
      setUrlInput('');
      mutateHistory();
      showToast('Phân tích SEO Audit hoàn tất!', 'success');
    } catch (err: unknown) {
      console.error('SEO Audit run failed:', err);
      const errorResponse = err as { response?: { data?: { code?: string; message?: string } }; code?: string; message?: string };
      const code = errorResponse.response?.data?.code || errorResponse.code;
      const msg = errorResponse.response?.data?.message || errorResponse.message || 'Gặp lỗi khi chạy phân tích SEO';

      if (code === 'INVALID_URL' || code === 'PRIVATE_URL_NOT_ALLOWED') {
        setSubmitError(msg);
      } else if (code === 'AUDIT_IN_PROGRESS') {
        showToast('Hệ thống đang tiến hành phân tích URL này. Vui lòng đợi vài giây rồi thử lại.', 'warning');
      } else if (code === 'FETCH_FAILED') {
        showToast('Không tải được trang. Vui lòng thử lại với một URL khác.', 'danger');
      } else if (code === 'AUDIT_NOT_FOUND' || code === 'INVALID_AUDIT_ID') {
        showToast('Không tìm thấy bản ghi phân tích này. Đang tải lại danh sách...', 'warning');
        mutateHistory();
      } else {
        showToast(msg, 'danger');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Re-run execution (triggered from footer icon)
  const handleReRunAudit = async (url: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      showToast('Đang chạy lại phân tích SEO...', 'info');
      const res = await seoAuditService.runAudit(url);
      setActiveReport(res);
      mutateHistory();
      showToast('Chạy lại phân tích SEO hoàn tất!', 'success');
    } catch (err: unknown) {
      console.error('SEO Audit re-run failed:', err);
      const errorResponse = err as { response?: { data?: { code?: string; message?: string } }; code?: string; message?: string };
      const code = errorResponse.response?.data?.code || errorResponse.code;
      const msg = errorResponse.response?.data?.message || errorResponse.message || 'Gặp lỗi khi chạy lại phân tích';
      
      if (code === 'INVALID_URL' || code === 'PRIVATE_URL_NOT_ALLOWED') {
        setSubmitError(msg);
      } else if (code === 'AUDIT_IN_PROGRESS') {
        showToast('Hệ thống đang phân tích URL này. Vui lòng đợi rồi thử lại.', 'warning');
      } else {
        showToast(msg, 'danger');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load old detail record
  const handleLoadHistoryDetail = async (id: string) => {
    try {
      showToast('Đang tải dữ liệu báo cáo cũ...', 'info');
      const detail = await seoAuditService.getAuditDetail(id);
      setActiveReport(detail);
      showToast('Đã mở báo cáo thành công!', 'success');
    } catch (err: unknown) {
      console.error('Load details failed:', err);
      const errorResponse = err as { response?: { data?: { code?: string; message?: string } }; code?: string; message?: string };
      const code = errorResponse.response?.data?.code || errorResponse.code;
      if (code === 'AUDIT_NOT_FOUND' || code === 'INVALID_AUDIT_ID') {
        showToast('Báo cáo không tồn tại hoặc đã bị xóa. Đang cập nhật lại lịch sử...', 'warning');
        mutateHistory();
      } else {
        showToast(errorResponse.response?.data?.message || errorResponse.message || 'Không thể mở báo cáo này', 'danger');
      }
    }
  };

  // Export report to Microsoft Word document (.doc)
  const handleExportDoc = () => {
    if (!activeReport) return;
    
    // Construct HTML content for Word
    let htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>Báo cáo SEO Audit - ${activeReport.url}</title>
  <!--[if gte mso 9]>
  <xml>
   <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
   </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.5;
      color: #1e293b;
      margin: 20px;
    }
    .header {
      border-bottom: 3px solid #00b894;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 24pt;
      font-weight: bold;
      color: #0f172a;
      margin: 0 0 5px 0;
    }
    .url {
      font-size: 11pt;
      color: #0984e3;
      margin: 0 0 10px 0;
    }
    .meta {
      font-size: 9pt;
      color: #64748b;
    }
    .score-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 25px;
    }
    .score-value {
      font-size: 32pt;
      font-weight: 900;
      display: inline-block;
      margin-right: 15px;
    }
    .stats-table {
      width: 100%;
      margin-top: 10px;
    }
    .stats-table td {
      border: none;
      padding: 5px 10px;
      font-size: 10pt;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 8.5pt;
    }
    .badge-pass { background-color: #e6fcf5; color: #00b894; border: 1px solid #00b894; }
    .badge-warn { background-color: #fff9db; color: #d97706; border: 1px solid #d97706; }
    .badge-fail { background-color: #fff5f5; color: #d63031; border: 1px solid #d63031; }
    
    .badge-critical { background-color: #ffe5e5; color: #c0392b; }
    .badge-medium { background-color: #fff9db; color: #d97706; }
    .badge-low { background-color: #f1f2f6; color: #57606f; }
    
    .section-title {
      font-size: 16pt;
      font-weight: bold;
      color: #0f172a;
      margin-top: 30px;
      margin-bottom: 10px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 5px;
    }
    
    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    .report-table th {
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      font-weight: bold;
      padding: 10px;
      font-size: 10pt;
      text-align: left;
    }
    .report-table td {
      border: 1px solid #cbd5e1;
      padding: 10px;
      font-size: 9.5pt;
      vertical-align: top;
    }
    
    .metrics-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .metrics-table th {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 8px;
      font-size: 9pt;
      text-align: left;
    }
    .metrics-table td {
      border: 1px solid #e2e8f0;
      padding: 8px;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">Báo Cáo SEO Audit & AI On-page</h1>
    <div class="url">Đường dẫn phân tích: <a href="${activeReport.url}">${activeReport.url}</a></div>
    <div class="meta">Ngày phân tích: ${formatVnTime(activeReport.createdAt)}</div>
  </div>

  <div class="score-box">
    <table class="stats-table">
      <tr>
        <td style="width: 120px; text-align: center; vertical-align: middle;">
          <div style="font-size: 10pt; color: #64748b; margin-bottom: 5px;">ĐIỂM SEO</div>
          <div class="score-value" style="color: ${getScoreColor(activeReport.score)};">${activeReport.score}</div>
        </td>
        <td>
          <strong>Thống kê kết quả kiểm tra tiêu chí:</strong>
          <ul style="margin: 5px 0 0 0; padding-left: 20px;">
            <li>Đạt: <span class="badge badge-pass">${activeReport.summary.pass}</span></li>
            <li>Cần cải thiện: <span class="badge badge-warn">${activeReport.summary.warn}</span></li>
            <li>Không đạt: <span class="badge badge-fail">${activeReport.summary.fail}</span></li>
            <li>Tổng cộng: <strong>${activeReport.summary.total}</strong> tiêu chí</li>
          </ul>
        </td>
      </tr>
    </table>
  </div>
`;

    // Add Performance Metrics if available
    if (activeReport.metrics) {
      const getPerformanceRating = (key: string, val: number | null | undefined) => {
        if (val === null || val === undefined) return { label: 'không đo được', class: 'badge-low' };
        if (key === 'ttfbMs') return val <= 800 ? { label: 'Tốt', class: 'badge-pass' } : val <= 1800 ? { label: 'Cần cải thiện', class: 'badge-warn' } : { label: 'Kém', class: 'badge-fail' };
        if (key === 'fcpMs') return val <= 1800 ? { label: 'Tốt', class: 'badge-pass' } : val <= 3000 ? { label: 'Cần cải thiện', class: 'badge-warn' } : { label: 'Kém', class: 'badge-fail' };
        if (key === 'lcpMs') return val <= 2500 ? { label: 'Tốt', class: 'badge-pass' } : val <= 4000 ? { label: 'Cần cải thiện', class: 'badge-warn' } : { label: 'Kém', class: 'badge-fail' };
        if (key === 'cls') return val <= 0.1 ? { label: 'Tốt', class: 'badge-pass' } : val <= 0.25 ? { label: 'Cần cải thiện', class: 'badge-warn' } : { label: 'Kém', class: 'badge-fail' };
        return { label: 'Bình thường', class: 'badge-pass' };
      };
      
      const formatValue = (key: string, val: number | null | undefined) => {
        if (val === null || val === undefined) return '—';
        if (['ttfbMs', 'fcpMs', 'lcpMs', 'loadMs'].includes(key)) return `${(val / 1000).toFixed(2)}s`;
        if (key === 'totalBytes') return `${(val / 1048576).toFixed(2)} MB`;
        if (key === 'cls') return val.toFixed(4);
        return val.toLocaleString('vi-VN');
      };

      htmlContent += `
  <h2>⚡ Chỉ số Hiệu năng & Trải nghiệm (Page Metrics)</h2>
  <table class="metrics-table">
    <thead>
      <tr>
        <th>Chỉ số</th>
        <th>Kết quả đo</th>
        <th>Đánh giá</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Thời gian phản hồi đầu tiên (TTFB)</td>
        <td>${formatValue('ttfbMs', activeReport.metrics.ttfbMs)}</td>
        <td><span class="badge ${getPerformanceRating('ttfbMs', activeReport.metrics.ttfbMs).class}">${getPerformanceRating('ttfbMs', activeReport.metrics.ttfbMs).label}</span></td>
      </tr>
      <tr>
        <td>Hiển thị nội dung đầu tiên (FCP)</td>
        <td>${formatValue('fcpMs', activeReport.metrics.fcpMs)}</td>
        <td><span class="badge ${getPerformanceRating('fcpMs', activeReport.metrics.fcpMs).class}">${getPerformanceRating('fcpMs', activeReport.metrics.fcpMs).label}</span></td>
      </tr>
      <tr>
        <td>Hiển thị nội dung lớn nhất (LCP)</td>
        <td>${formatValue('lcpMs', activeReport.metrics.lcpMs)}</td>
        <td><span class="badge ${getPerformanceRating('lcpMs', activeReport.metrics.lcpMs).class}">${getPerformanceRating('lcpMs', activeReport.metrics.lcpMs).label}</span></td>
      </tr>
      <tr>
        <td>Thay đổi bố cục lũy kế (CLS)</td>
        <td>${formatValue('cls', activeReport.metrics.cls)}</td>
        <td><span class="badge ${getPerformanceRating('cls', activeReport.metrics.cls).class}">${getPerformanceRating('cls', activeReport.metrics.cls).label}</span></td>
      </tr>
      <tr>
        <td>Thời gian tải trang hoàn tất</td>
        <td>${formatValue('loadMs', activeReport.metrics.loadMs)}</td>
        <td>-</td>
      </tr>
      <tr>
        <td>Tổng số lượng HTTP Requests</td>
        <td>${formatValue('totalRequests', activeReport.metrics.totalRequests)}</td>
        <td>-</td>
      </tr>
      <tr>
        <td>Tổng dung lượng trang web</td>
        <td>${formatValue('totalBytes', activeReport.metrics.totalBytes)}</td>
        <td>-</td>
      </tr>
      <tr>
        <td>Số lượng thẻ DOM Nodes đã render</td>
        <td>${formatValue('domNodes', activeReport.metrics.domNodes)}</td>
        <td><span class="badge ${activeReport.metrics.domNodes && activeReport.metrics.domNodes > 1500 ? 'badge-warn' : 'badge-pass'}">${activeReport.metrics.domNodes && activeReport.metrics.domNodes > 1500 ? 'Cần tối ưu' : 'Tốt'}</span></td>
      </tr>
    </tbody>
  </table>
`;
    }

    // Add Detailed Checklist Sections
    activeReport.sections.forEach((sec) => {
      htmlContent += `
  <h2 class="section-title">${sec.label} (${sec.pass}/${sec.total} đạt)</h2>
  <table class="report-table">
    <thead>
      <tr>
        <th style="width: 25%;">Tiêu chí kiểm tra</th>
        <th style="width: 15%;">Kết quả</th>
        <th style="width: 20%;">Trọng số</th>
        <th style="width: 40%;">Khuyến nghị & Bằng chứng thực tế</th>
      </tr>
    </thead>
    <tbody>
`;

      sec.criteria.forEach((c) => {
        const isUnavailable = c.message && c.message.includes('Không đo được');
        const finalStatus = isUnavailable ? 'warn' : c.status;
        const statusText = finalStatus === 'pass' ? 'Đạt' : finalStatus === 'warn' ? 'Cần cải thiện' : 'Không đạt';
        const statusClass = finalStatus === 'pass' ? 'badge-pass' : finalStatus === 'warn' ? 'badge-warn' : 'badge-fail';
        
        const importanceClass = c.importance === 'critical' ? 'badge-critical' : c.importance === 'medium' ? 'badge-medium' : 'badge-low';
        
        const evidenceHtml = formatEvidenceForDoc(c.key, c.evidence);

        htmlContent += `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
        <td>
          <span class="badge ${importanceClass}">${c.importanceLabel}</span>
        </td>
        <td>
          <div style="font-weight: bold; color: #0f172a; margin-bottom: 5px;">${c.message}</div>
          <div style="color: #64748b; font-size: 8.5pt; margin-bottom: 8px;">💡 Mô tả: ${c.description}</div>
          ${evidenceHtml ? `<div style="margin-top: 10px; background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 8px; border-radius: 4px;">${evidenceHtml}</div>` : ''}
        </td>
      </tr>
`;
      });

      htmlContent += `
    </tbody>
  </table>
`;
    });

    htmlContent += `
</body>
</html>
`;

    // Download document as .doc
    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
    const filename = `Seo_Audit_Report_${activeReport.url.replace(/https?:\/\/(www\.)?/, '').replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
    saveAs(blob, filename);
  };

  // Status Badge Renderer
  const renderStatusBadge = (status: 'pass' | 'warn' | 'fail') => {
    switch (status) {
      case 'pass':
        return (
          <Chip
            label="Đạt"
            icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#00b894 !important' }} />}
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: 'rgba(0, 184, 148, 0.1)',
              color: '#00b894',
              border: '1px solid rgba(0, 184, 148, 0.3)',
              borderRadius: '100px',
            }}
          />
        );
      case 'warn':
        return (
          <Chip
            label="Cần cải thiện"
            icon={<WarningAmberIcon sx={{ fontSize: '14px !important', color: '#f1c40f !important' }} />}
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: 'rgba(241, 196, 15, 0.1)',
              color: '#f1c40f',
              border: '1px solid rgba(241, 196, 15, 0.3)',
              borderRadius: '100px',
            }}
          />
        );
      case 'fail':
        return (
          <Chip
            label="Không đạt"
            icon={<CancelIcon sx={{ fontSize: '14px !important', color: '#d63031 !important' }} />}
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: 'rgba(214, 48, 49, 0.1)',
              color: '#d63031',
              border: '1px solid rgba(214, 48, 49, 0.3)',
              borderRadius: '100px',
            }}
          />
        );
    }
  };

  // Filter and sort sections
  const visibleSections = (activeReport?.sections || [])
    .map((sec) => {
      const filteredCriteria = sec.criteria.filter((c) => {
        if (filterStatus === 'all') return true;
        return c.status === filterStatus;
      });
      // Sort: fail -> warn -> pass
      const sortedCriteria = sortCriteria(filteredCriteria);
      return { ...sec, criteria: sortedCriteria };
    })
    .filter((sec) => sec.criteria.length > 0);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide everything by default */
          body * {
            visibility: hidden;
            box-shadow: none !important;
          }
          
          /* Only show the print target and its children */
          #printable-report, #printable-report * {
            visibility: visible;
          }
          
          /* Position printable report at the top of the print page */
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: flex !important;
            flex-direction: column !important;
            gap: 20px !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Hide non-printable elements within the report */
          .no-print, 
          #printable-report button, 
          #printable-report .MuiButton-root,
          #printable-report .no-print-element {
            display: none !important;
          }
          
          /* Force expand collapse/accordions for printing */
          #printable-report .MuiCollapse-root {
            display: block !important;
            height: auto !important;
            visibility: visible !important;
          }
          
          #printable-report .MuiCollapse-wrapper {
            display: block !important;
            visibility: visible !important;
          }
          
          #printable-report .MuiAccordionDetails-root {
            display: flex !important;
            visibility: visible !important;
          }
          
          /* Optimize page backgrounds for printing */
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background-color: #ffffff !important;
          }
        }
      `}} />
      <Grid container spacing={3.5}>
      {/* COLUMN A: Input form & Detailed Report */}
      <Grid size={{ xs: 12, lg: 8.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          
          {/* 1. URL Input Form Panel */}
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
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <SpeedIcon sx={{ color: '#00b894', fontSize: 30 }} /> Phân tích SEO Audit & AI On-page
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
              Điền URL bài viết để hệ thống chạy giả lập Chrome kiểm tra các chỉ số Core Web Vitals, HTML On-page và đề xuất tối ưu.
            </Typography>

            <Box component="form" onSubmit={handleRunAudit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <TextField
                  label="Đường dẫn trang web cần kiểm tra (URL)"
                  placeholder="https://example.com/bai-viet"
                  fullWidth
                  variant="outlined"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (submitError) setSubmitError('');
                  }}
                  disabled={isSubmitting}
                  sx={{
                    flex: 1,
                    minWidth: 280,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                    },
                  }}
                />

                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={isSubmitting}
                  loadingPosition="start"
                  disabled={!urlInput.trim()}
                  startIcon={<SendIcon sx={{ transform: 'rotate(-45deg)' }} />}
                  sx={{
                    py: 1.8,
                    px: 4,
                    borderRadius: '100px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                    bgcolor: 'primary.main',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  Phân tích
                </LoadingButton>
              </Box>

              {submitError && (
                <Alert severity="error" sx={{ borderRadius: 3 }}>
                  {submitError}
                </Alert>
              )}
            </Box>
          </Paper>

          {/* 2. Loading State */}
          {isSubmitting && (
            <Paper
              elevation={0}
              sx={{
                p: 8,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
              }}
            >
              <CircularProgress size={50} thickness={4.5} sx={{ color: '#00b894' }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Đang chạy phân tích SEO Audit</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
                  Đang tải trang và đo Core Web Vitals..., có thể mất <strong>5–35 giây</strong>...<br />
                  Vui lòng không tắt trang hoặc bấm gửi lại yêu cầu!
                </Typography>
              </Box>
            </Paper>
          )}

          {/* 3. Detailed Report Render */}
          {activeReport && !isSubmitting && (
            <Box id="printable-report" sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              
              {/* Report summary overview card */}
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    SEO Audit Report
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', '@media print': { display: 'none' } }}>
                    <Button
                      variant="outlined"
                      onClick={handleExportDoc}
                      startIcon={<ArticleIcon />}
                      sx={{
                        fontWeight: 700,
                        borderRadius: '100px',
                        textTransform: 'none',
                        borderColor: 'divider',
                        color: 'text.primary',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderColor: 'text.secondary',
                          transform: 'scale(1.02)',
                        }
                      }}
                    >
                      Xuất File Word (.doc)
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => window.print()}
                      startIcon={<PictureAsPdfIcon />}
                      sx={{
                        fontWeight: 700,
                        borderRadius: '100px',
                        textTransform: 'none',
                        bgcolor: 'primary.main',
                        color: '#ffffff',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          transform: 'scale(1.02)',
                        }
                      }}
                    >
                      Xuất PDF
                    </Button>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                  <Link
                    href={activeReport.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="none"
                    sx={{
                      fontWeight: 500,
                      color: 'primary.main',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: '0.92rem',
                      wordBreak: 'break-all',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {activeReport.url} <OpenInNewIcon sx={{ fontSize: 13 }} />
                  </Link>
                  
                  <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />
                  
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Ngày phân tích: {formatVnTime(activeReport.createdAt)}
                  </Typography>
                </Box>

                {/* Redirect indicator */}
                {activeReport.finalUrl && activeReport.finalUrl !== activeReport.url && (
                  <Alert severity="warning" variant="outlined" sx={{ borderRadius: 3, mb: 3, borderStyle: 'dashed' }}>
                    Redirect tới: <strong>{activeReport.finalUrl}</strong>
                  </Alert>
                )}

                <Grid container spacing={4} sx={{ alignItems: 'center' }}>
                  {/* Total score gauge circle */}
                  <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Box
                      sx={{
                        width: 150,
                        height: 150,
                        borderRadius: '50%',
                        border: `10px solid ${getScoreColor(activeReport.score)}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h3" sx={{ fontWeight: 900, color: getScoreColor(activeReport.score), lineHeight: 1 }}>
                        {activeReport.score}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, mt: 0.5, letterSpacing: 0.5 }}>
                        ĐIỂM SEO
                      </Typography>
                    </Box>
                  </Grid>

                  {/* 3 counter blocks */}
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 4 }}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            borderColor: 'rgba(0, 184, 148, 0.25)',
                            bgcolor: 'rgba(0, 184, 148, 0.04)',
                            borderRadius: 3.5,
                          }}
                        >
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#00b894' }}>
                            {activeReport.summary.pass}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#00b894', display: 'block', mt: 0.5 }}>
                            Đạt
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid size={{ xs: 4 }}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            borderColor: 'rgba(241, 196, 15, 0.25)',
                            bgcolor: 'rgba(241, 196, 15, 0.04)',
                            borderRadius: 3.5,
                          }}
                        >
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#f1c40f' }}>
                            {activeReport.summary.warn}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#f1c40f', display: 'block', mt: 0.5 }}>
                            Cần cải thiện
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid size={{ xs: 4 }}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            borderColor: 'rgba(214, 48, 49, 0.25)',
                            bgcolor: 'rgba(214, 48, 49, 0.04)',
                            borderRadius: 3.5,
                          }}
                        >
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#d63031' }}>
                            {activeReport.summary.fail}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#d63031', display: 'block', mt: 0.5 }}>
                            Không đạt
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mt: 2, fontWeight: 700, textAlign: 'center' }}>
                      Tổng số: <strong>{activeReport.summary.total}</strong> tiêu chí kiểm tra
                    </Typography>
                  </Grid>
                </Grid>

                {activeReport.metrics && (
                  <>
                    <Divider sx={{ my: 3.5 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 950, mb: 2, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                      Các chỉ số hiệu năng (Core Web Vitals & Page Metrics)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        {(() => {
                          const m = activeReport.metrics.ttfbMs;
                          const isNull = m === null || m === undefined;
                          const status = getMetricStatus('ttfb', m);
                          return (
                            <MetricCard
                              title="TTFB"
                              icon={<AccessTimeIcon />}
                              value={status.text}
                              statusLabel={status.label}
                              statusColor={status.color}
                              isUnavailable={isNull}
                            />
                          );
                        })()}
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        {(() => {
                          const m = activeReport.metrics.fcpMs;
                          const isNull = m === null || m === undefined;
                          const status = getMetricStatus('fcp', m);
                          return (
                            <MetricCard
                              title="FCP"
                              icon={<PaletteIcon />}
                              value={status.text}
                              statusLabel={status.label}
                              statusColor={status.color}
                              isUnavailable={isNull}
                            />
                          );
                        })()}
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        {(() => {
                          const m = activeReport.metrics.lcpMs;
                          const isNull = m === null || m === undefined;
                          const status = getMetricStatus('lcp', m);
                          return (
                            <MetricCard
                              title="LCP"
                              icon={<StraightenIcon />}
                              value={status.text}
                              statusLabel={status.label}
                              statusColor={status.color}
                              isUnavailable={isNull}
                            />
                          );
                        })()}
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        {(() => {
                          const m = activeReport.metrics.cls;
                          const isNull = m === null || m === undefined;
                          const status = getMetricStatus('cls', m);
                          return (
                            <MetricCard
                              title="CLS"
                              icon={<BarChartIcon />}
                              value={status.text}
                              statusLabel={status.label}
                              statusColor={status.color}
                              isUnavailable={isNull}
                            />
                          );
                        })()}
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        {(() => {
                          const m = activeReport.metrics.loadMs;
                          const isNull = m === null || m === undefined;
                          const status = getMetricStatus('load', m);
                          return (
                            <MetricCard
                              title="Tải trang"
                              icon={<FlashOnIcon />}
                              value={status.text}
                              statusLabel={status.label}
                              statusColor={status.color}
                              isUnavailable={isNull}
                            />
                          );
                        })()}
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        {(() => {
                          const m = activeReport.metrics.totalRequests;
                          const isNull = m === null || m === undefined;
                          const status = getMetricStatus('requests', m);
                          return (
                            <MetricCard
                              title="HTTP Requests"
                              icon={<InboxIcon />}
                              value={isNull ? '—' : status.text}
                              statusLabel={isNull ? 'không đo được' : 'Số yêu cầu'}
                              statusColor={status.color}
                              isUnavailable={isNull}
                            />
                          );
                        })()}
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        {(() => {
                          const m = activeReport.metrics.totalBytes;
                          const isNull = m === null || m === undefined;
                          const status = getMetricStatus('bytes', m);
                          return (
                            <MetricCard
                              title="Dung lượng"
                              icon={<SaveIcon />}
                              value={isNull ? '—' : status.text}
                              statusLabel={isNull ? 'không đo được' : 'Tổng dung lượng'}
                              statusColor={status.color}
                              isUnavailable={isNull}
                            />
                          );
                        })()}
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        {(() => {
                          const m = activeReport.metrics.domNodes;
                          const isNull = m === null || m === undefined;
                          const status = getMetricStatus('domNodes', m);
                          return (
                            <MetricCard
                              title="DOM Nodes"
                              icon={<LayersIcon />}
                              value={isNull ? '—' : status.text}
                              statusLabel={isNull ? 'không đo được' : status.label}
                              statusColor={status.color}
                              isUnavailable={isNull}
                            />
                          );
                        })()}
                      </Grid>
                    </Grid>
                  </>
                )}
              </Paper>

              {/* Filtering bar */}
              <Box className="no-print" sx={{ display: 'flex', gap: 1.25, mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', mr: 0.5 }}>
                  Lọc theo kết quả kiểm tra:
                </Typography>
                
                <Chip
                  label="Hiện tất cả"
                  clickable
                  onClick={() => setFilterStatus('all')}
                  variant={filterStatus === 'all' ? 'filled' : 'outlined'}
                  color={filterStatus === 'all' ? 'primary' : 'default'}
                  sx={{ fontWeight: 700, borderRadius: '100px' }}
                />
                
                <Chip
                  label="Chỉ Không Đạt"
                  clickable
                  onClick={() => setFilterStatus('fail')}
                  variant={filterStatus === 'fail' ? 'filled' : 'outlined'}
                  color={filterStatus === 'fail' ? 'error' : 'default'}
                  sx={{ fontWeight: 700, borderRadius: '100px' }}
                />

                <Chip
                  label="Chỉ Cần Cải Thiện"
                  clickable
                  onClick={() => setFilterStatus('warn')}
                  variant={filterStatus === 'warn' ? 'filled' : 'outlined'}
                  color={filterStatus === 'warn' ? 'warning' : 'default'}
                  sx={{ fontWeight: 700, borderRadius: '100px' }}
                />
              </Box>

              {/* Sections & Nested Criteria Render */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {visibleSections.map((sec) => {
                  const config = SECTION_CONFIGS[sec.key] || { label: sec.label, icon: <AssignmentIcon /> };

                  return (
                    <Accordion
                      key={sec.key}
                      defaultExpanded
                      sx={{
                        borderRadius: 4,
                        '&:before': { display: 'none' },
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                        boxShadow: 'none',
                        '&.Mui-expanded': {
                          margin: '0 0 8px 0'
                        }
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<KeyboardArrowDownIcon />}
                        sx={{
                          bgcolor: 'action.hover',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1.5, flexWrap: 'wrap', gap: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', color: 'primary.main', '& svg': { fontSize: '1.5rem' } }}>
                              {config.icon}
                            </Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                              {config.label}
                            </Typography>
                          </Box>
                          
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                            {sec.pass}/{sec.total} đạt
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      
                      <AccordionDetails sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {sec.criteria.map((c) => {
                          const isUnavailable = c.message && c.message.includes('Không đo được');
                          const finalStatus = isUnavailable ? 'warn' : c.status;
                          
                          const statusBadge = renderStatusBadge(finalStatus);
                          const renderedBadge = isUnavailable ? (
                            <Tooltip title="Máy chủ chưa khởi động được trình duyệt Chromium để đo, vui lòng chạy lại sau" arrow>
                              <span>{statusBadge}</span>
                            </Tooltip>
                          ) : statusBadge;

                          return (
                            <Accordion
                              key={c.key}
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 3,
                                boxShadow: 'none',
                                '&:before': { display: 'none' },
                                '&.Mui-expanded': {
                                  margin: 0
                                }
                              }}
                            >
                              <AccordionSummary expandIcon={<KeyboardArrowDownIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 1.5, flexWrap: 'wrap', gap: 1.5 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 220 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      {c.status === 'pass' ? (
                                        <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />
                                      ) : c.status === 'warn' ? (
                                        <WarningAmberIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                                      ) : (
                                        <CancelIcon sx={{ fontSize: 20, color: 'error.main' }} />
                                      )}
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                      {c.name}
                                    </Typography>
                                  </Box>
                                  
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Chip
                                      label={c.importanceLabel}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '0.62rem',
                                        fontWeight: 800,
                                        borderRadius: '100px',
                                        bgcolor: (theme) => {
                                          const isDark = theme.palette.mode === 'dark';
                                          if (c.importance === 'critical') return isDark ? 'rgba(255, 118, 117, 0.15)' : 'rgba(214, 48, 49, 0.08)';
                                          if (c.importance === 'medium') return isDark ? 'rgba(254, 202, 87, 0.15)' : 'rgba(217, 119, 6, 0.08)';
                                          return isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(100, 116, 139, 0.08)';
                                        },
                                        color: (theme) => {
                                          const isDark = theme.palette.mode === 'dark';
                                          if (c.importance === 'critical') return isDark ? '#ff7675' : '#d63031';
                                          if (c.importance === 'medium') return isDark ? '#fbc531' : '#d97706';
                                          return isDark ? '#cbd5e1' : '#475569';
                                        },
                                        border: (theme) => {
                                          const isDark = theme.palette.mode === 'dark';
                                          if (c.importance === 'critical') return `1px solid ${isDark ? 'rgba(255, 118, 117, 0.3)' : 'rgba(214, 48, 49, 0.2)'}`;
                                          if (c.importance === 'medium') return `1px solid ${isDark ? 'rgba(254, 202, 87, 0.3)' : 'rgba(217, 119, 6, 0.2)'}`;
                                          return `1px solid ${isDark ? 'rgba(203, 213, 225, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`;
                                        }
                                      }}
                                    />
                                    {/* <Chip
                                      label={`Tác động: ${c.weight}%`}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '0.62rem',
                                        fontWeight: 800,
                                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 206, 201, 0.15)' : 'rgba(9, 132, 227, 0.08)',
                                        color: (theme) => theme.palette.mode === 'dark' ? '#81ecec' : '#0984e3',
                                        border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 206, 201, 0.3)' : 'rgba(9, 132, 227, 0.2)'}`,
                                      }}
                                    /> */}
                                  </Box>
                                </Box>
                              </AccordionSummary>
                              
                              <AccordionDetails sx={{ pt: 0, px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Divider sx={{ mb: 1.5 }} />

                                {/* 1. Description */}
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>Mô tả tiêu chuẩn:</Typography>
                                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                                    {c.description}
                                  </Typography>
                                </Box>

                                {/* 2. Status message */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
                                  {renderedBadge}
                                  <Typography variant="body2" sx={{ fontWeight: 650 }}>
                                    {c.message}
                                  </Typography>
                                </Box>

                                {/* 3. Evidence */}
                                {c.evidence !== null && c.evidence !== undefined && renderEvidence(c.key, c.evidence)}

                                {/* 4. Fix Guide */}
                                {c.fixGuide && (
                                  <Box sx={{ mt: 2, p: 2.5, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'action.hover' : '#f8fafc', border: '1px solid', borderColor: 'divider', borderRadius: 3.5 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main', display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.5 }}>
                                      Hướng dẫn cách sửa đổi
                                    </Typography>
                                    
                                    {c.fixGuide.summary && (
                                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, display: 'block' }}>
                                        {c.fixGuide.summary}
                                      </Typography>
                                    )}

                                    {c.fixGuide.example && c.fixGuide.example.trim() !== '' && (
                                      <Box sx={{ mb: 2 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>Mẫu cấu hình hoặc Code tham khảo:</Typography>
                                        <Box
                                          component="pre"
                                          sx={{
                                            p: 2,
                                            bgcolor: '#1e293b',
                                            color: '#f8fafc',
                                            borderRadius: 2,
                                            fontFamily: 'monospace',
                                            fontSize: '0.78rem',
                                            overflowX: 'auto',
                                            whiteSpace: 'pre-wrap',
                                            margin: 0
                                          }}
                                        >
                                          {c.fixGuide.example}
                                        </Box>
                                      </Box>
                                    )}

                                    {c.fixGuide.whereToChange && c.fixGuide.whereToChange.length > 0 && (
                                      <Box sx={{ mb: 1.5 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>Vị trí cần điều chỉnh:</Typography>
                                        <Box sx={{ pl: 2 }}>
                                          {c.fixGuide.whereToChange.map((item, idx) => (
                                            <Typography key={idx} variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>• {item}</Typography>
                                          ))}
                                        </Box>
                                      </Box>
                                    )}

                                    {c.fixGuide.commonCauses && c.fixGuide.commonCauses.length > 0 && (
                                      <Box sx={{ mb: 1.5 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>Nguyên nhân thường gặp:</Typography>
                                        <Box sx={{ pl: 2 }}>
                                          {c.fixGuide.commonCauses.map((item, idx) => (
                                            <Typography key={idx} variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>• {item}</Typography>
                                          ))}
                                        </Box>
                                      </Box>
                                    )}

                                    {c.fixGuide.bestPractices && c.fixGuide.bestPractices.length > 0 && (
                                      <Box sx={{ mb: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>Phương pháp tối ưu khuyên dùng (Best Practices):</Typography>
                                        <Box sx={{ pl: 2 }}>
                                          {c.fixGuide.bestPractices.map((item, idx) => (
                                            <Typography key={idx} variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>• {item}</Typography>
                                          ))}
                                        </Box>
                                      </Box>
                                    )}
                                  </Box>
                                )}
                              </AccordionDetails>
                            </Accordion>
                          );
                        })}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>

              {/* Report Footer with processing latency & Re-run button */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Thời gian phản hồi: {activeReport.responseMs ? (activeReport.responseMs / 1000).toFixed(2) : '0.00'}s
                </Typography>
                
                <LoadingButton
                  className="no-print"
                  variant="outlined"
                  size="small"
                  onClick={() => handleReRunAudit(activeReport.url)}
                  loading={isSubmitting}
                  startIcon={<RefreshIcon />}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '100px',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    }
                  }}
                >
                  Chạy lại
                </LoadingButton>
              </Paper>

            </Box>
          )}

          {/* Empty welcome screen if no report is active */}
          {!activeReport && !isSubmitting && (
            <Paper
              elevation={0}
              sx={{
                p: 8,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                textAlign: 'center'
              }}
            >
              <SearchIcon sx={{ fontSize: 50, opacity: 0.8, color: 'text.secondary' }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Chưa có báo cáo phân tích nào</Typography>
              <Typography variant="body2" color="text.secondary">
                Vui lòng nhập URL trang web ở trên để tiến hành cào dữ liệu và phân tích On-page,<br />
                hoặc nhấp chọn một báo cáo có sẵn từ danh sách lịch sử bên phải.
              </Typography>
            </Paper>
          )}

        </Box>
      </Grid>

      {/* COLUMN B: Right Sidebar History Panel */}
      <Grid size={{ xs: 12, lg: 3.5 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            minHeight: 500,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <HistoryIcon sx={{ fontSize: 18 }} /> Lịch sử SEO Audit
            </Typography>
            <IconButton
              size="small"
              onClick={() => mutateHistory()}
              disabled={historyValidating}
            >
              <RefreshIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          {historyError ? (
            <Alert severity="error" sx={{ borderRadius: 3, py: 1 }}>Lỗi khi tải lịch sử</Alert>
          ) : !historyData ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={68} sx={{ borderRadius: 2.5 }} />
              ))}
            </Box>
          ) : historyData.items.length === 0 ? (
            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', textAlign: 'center', py: 8 }}>
              Chưa có lần audit nào.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, gap: 3.5 }}>
              <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {historyData.items.map((item) => {
                  const isActive = activeReport?.id === item.id;
                  const hostname = item.url.replace('https://', '').replace('http://', '').split('/')[0];
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        border: '1px solid',
                        borderColor: isActive ? 'primary.main' : 'divider',
                        borderRadius: 3,
                        bgcolor: isActive ? 'action.selected' : 'transparent',
                        transition: 'all 0.2s',
                        overflow: 'hidden',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        }
                      }}
                    >
                      <ListItemButton
                        onClick={() => handleLoadHistoryDetail(item.id)}
                        sx={{ p: 1.75, flexDirection: 'column', alignItems: 'stretch' }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start', mb: 1 }}>
                          <Tooltip title={item.url} arrow>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', wordBreak: 'break-all', flex: 1, mr: 1, fontSize: '0.85rem' }}>
                              {hostname}
                            </Typography>
                          </Tooltip>
                          <Chip
                            label={item.score}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              bgcolor: `${getScoreColor(item.score)}15`,
                              color: getScoreColor(item.score),
                              border: `1px solid ${getScoreColor(item.score)}50`,
                              borderRadius: '100px',
                            }}
                          />
                        </Box>
                        
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            fontSize: '0.72rem'
                          }}
                        >
                          {item.url}
                        </Typography>
                        
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block', fontSize: '0.7rem' }}>
                          {formatVnTime(item.createdAt)}
                        </Typography>
                      </ListItemButton>
                    </Box>
                  );
                })}
              </List>

              {historyData.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
                  <Pagination
                    count={historyData.totalPages}
                    page={historyPage}
                    onChange={(_, val) => setHistoryPage(val)}
                    size="small"
                  />
                </Box>
              )}
            </Box>
          )}

        </Paper>
      </Grid>
    </Grid>
    </>
  );
}
