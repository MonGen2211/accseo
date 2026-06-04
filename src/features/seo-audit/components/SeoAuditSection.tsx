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
} from '@mui/material';

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

import { seoAuditService } from '../seoAuditService';
import type { SeoReport, Criterion } from '../types';
import { useToastify } from '../../../components/Toastify';

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
const SECTION_CONFIGS: Record<string, { label: string; icon: string }> = {
  seo_basic: { label: 'SEO Cơ Bản', icon: '🔍' },
  images: { label: 'Tối Ưu Hình Ảnh', icon: '🖼️' },
  performance: { label: 'Tốc Độ & Hiệu Năng', icon: '⚡' },
  core_web_vitals: { label: 'Core Web Vitals', icon: '📈' },
  security: { label: 'Bảo Mật', icon: '🔒' },
  mobile: { label: 'Mobile & UX', icon: '📱' },
  errors: { label: 'Lỗi & Console', icon: '⚠️' },
  url_redirect: { label: 'URL & Redirect', icon: '🔗' },
};

// Sort Criteria: fail -> warn -> pass
const sortCriteria = (criteria: Criterion[]) => {
  const order = { fail: 1, warn: 2, pass: 3 };
  return [...criteria].sort((a, b) => order[a.status] - order[b.status]);
};

// Dynamic Evidence Renderer based on key
const renderEvidence = (key: string, evidence: any) => {
  if (evidence === null || evidence === undefined) return null;

  try {
    switch (key) {
      case 'title': {
        const val = evidence.value || '';
        const len = evidence.length || val.length || 0;
        const max = evidence.max || 60;
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
        const val = evidence.value || '';
        const len = evidence.length || val.length || 0;
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
        const og = evidence.openGraph || {};
        const twitter = evidence.twitterCard || {};
        const renderTable = (title: string, obj: Record<string, any>) => {
          const entries = Object.entries(obj);
          if (entries.length === 0) return null;
          return (
            <Box sx={{ flex: 1, minWidth: 280 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1 }}>{title}</Typography>
              <Box sx={{ maxHeight: 220, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
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
              </Box>
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
        return (
          <Box sx={{ mt: 1.5, p: 2.5, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'action.hover' : '#ffffff', border: '1px solid', borderColor: 'divider', borderRadius: 2.5, maxWidth: 600 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 1.5 }}>Xem trước hiển thị Google Tìm Kiếm (SERP Preview):</Typography>
            <Box sx={{ fontFamily: 'Arial, sans-serif', textAlign: 'left' }}>
              <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#8ab4f8' : '#1a0dab', fontSize: '1.2rem', lineHeight: 1.3, mb: 0.25, '&:hover': { textDecoration: 'underline', cursor: 'pointer' } }}>
                {evidence.title || 'Chưa cấu hình Title'}
              </Typography>
              <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#81c784' : '#006621', fontSize: '0.85rem', mb: 0.5, wordBreak: 'break-all' }}>
                {evidence.url || 'https://example.com'}
              </Typography>
              <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#bdc1c6' : '#545454', fontSize: '0.82rem', lineHeight: 1.4 }}>
                {evidence.description || 'Chưa cấu hình thẻ Meta Description.'}
              </Typography>
            </Box>
          </Box>
        );
      }

      case 'top_keywords':
      case 'keyword_cloud': {
        const list = evidence.keywords || [];
        if (list.length === 0) return null;
        return (
          <Box sx={{ mt: 1.5, p: 2, bgcolor: 'action.hover', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 1.5 }}>Mật độ từ khóa phổ biến:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {list.map((kw: any, idx: number) => {
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
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                  />
                );
              })}
            </Box>
          </Box>
        );
      }

      case 'keyword_distribution': {
        const rows = evidence.table || [];
        if (rows.length === 0) return null;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 1 }}>Sự phân bố của các từ khóa chính:</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
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
                  {rows.map((row: any, idx: number) => (
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
            {renderList('h1', evidence.h1)}
            {renderList('h2', evidence.h2)}
            {renderList('h3', evidence.h3)}
            {renderList('h4', evidence.h4)}
          </Box>
        );
      }

      case 'robots_txt': {
        if (!evidence.url) return null;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Button variant="outlined" size="small" href={evidence.url} target="_blank" rel="noopener noreferrer" startIcon={<OpenInNewIcon />} sx={{ textTransform: 'none', borderRadius: 2 }}>
              Mở link Robots.txt
            </Button>
          </Box>
        );
      }

      case 'canonical':
      case 'favicon': {
        if (!evidence.href) return null;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1, fontWeight: 700 }}>Đường dẫn:</Typography>
            <Typography variant="body2" component="a" href={evidence.href} target="_blank" rel="noopener noreferrer" sx={{ color: 'primary.main', textDecoration: 'underline', fontSize: '0.78rem', wordBreak: 'break-all' }}>
              {evidence.href}
            </Typography>
          </Box>
        );
      }

      case 'structured_data': {
        const types = evidence.types || [];
        if (types.length === 0) return null;
        return (
          <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {types.map((type: string, idx: number) => (
              <Chip key={idx} label={type} size="small" color="primary" sx={{ fontWeight: 700, borderRadius: 2 }} />
            ))}
          </Box>
        );
      }

      case 'charset': {
        if (!evidence.value) return null;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>Kiểu mã hóa: <Chip label={evidence.value} size="small" color="secondary" sx={{ fontWeight: 700 }} /></Typography>
          </Box>
        );
      }

      case 'compression': {
        if (!evidence.algo) return null;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>Chuẩn nén truyền tải: <Chip label={evidence.algo} size="small" color="success" sx={{ fontWeight: 700 }} /></Typography>
          </Box>
        );
      }

      case 'viewport': {
        if (!evidence.content) return null;
        return (
          <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.75rem', border: '1px solid', borderColor: 'divider' }}>
            {evidence.content}
          </Box>
        );
      }

      case 'deprecated_tags': {
        const tags = evidence.tags || [];
        if (tags.length === 0) return null;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.8 }}>Các thẻ HTML lỗi thời:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {tags.map((t: string, idx: number) => (
                <Chip key={idx} label={`<${t}>`} size="small" color="error" variant="outlined" sx={{ fontWeight: 700 }} />
              ))}
            </Box>
          </Box>
        );
      }

      case 'modern_image_format': {
        const legacy = evidence.legacy || [];
        if (legacy.length === 0) return null;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.8 }}>Ảnh định dạng cũ cần tối ưu hóa:</Typography>
            <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {legacy.slice(0, 5).map((url: string, idx: number) => (
                <Typography key={idx} variant="caption" component="a" href={url} target="_blank" rel="noopener noreferrer" sx={{ display: 'block', color: 'primary.main', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', '&:hover': { textDecoration: 'underline' } }}>
                  - {url}
                </Typography>
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
        const items = evidence.items || [];
        if (items.length === 0) return null;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 1 }}>Kích thước ảnh thực tế:</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Hình ảnh</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Hiển thị</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Kích thước gốc</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.slice(0, 5).map((row: any, idx: number) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 32, height: 32, borderRadius: 1, border: '1px solid', borderColor: 'divider', overflow: 'hidden', bgcolor: 'action.hover', flexShrink: 0 }}>
                            <img src={row.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </Box>
                          <Typography variant="caption" component="a" href={row.src} target="_blank" rel="noopener noreferrer" sx={{ display: 'inline-block', color: 'primary.main', maxWidth: 200, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', '&:hover': { textDecoration: 'underline' } }}>
                            {row.src}
                          </Typography>
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
        const count = evidence.count || 0;
        const urls = evidence.urls || [];
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
              ⚠️ Có {count} tài nguyên chặn quá trình render trang:
            </Typography>
            {urls.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: 1.5, borderLeft: '2px solid', borderColor: 'divider' }}>
                {urls.slice(0, 5).map((url: string, idx: number) => (
                  <Typography key={idx} variant="caption" component="a" href={url} target="_blank" rel="noopener noreferrer" sx={{ color: 'primary.main', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', '&:hover': { textDecoration: 'underline' } }}>
                    - {url}
                  </Typography>
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
        const count = evidence.count || 0;
        const b = evidence.bytes || {};
        const total = Object.values(b).reduce((acc: number, cur: any) => acc + (Number(cur) || 0), 0) as number;
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
        const isMs = typeof evidence.valueMs === 'number';
        const val = isMs ? evidence.valueMs : (evidence.value || 0);
        const goodMax = isMs ? evidence.goodMaxMs : (evidence.goodLimit || 0.1);
        const warnMax = isMs ? evidence.warnMaxMs : (evidence.warnLimit || 0.25);
        
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
        const val = typeof evidence.value === 'number' ? evidence.value : 0;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Điểm tích lũy thay đổi bố cục (CLS): <Chip label={val} size="small" color={val <= 0.1 ? 'success' : 'error'} sx={{ fontWeight: 700 }} />
            </Typography>
          </Box>
        );
      }

      case 'html_size': {
        const kb = evidence.kb || 0;
        const avgKb = evidence.avgKb || 100;
        return (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Dung lượng trang HTML: <span style={{ color: kb <= avgKb ? '#00b894' : '#d63031' }}>{kb} KB</span> (Trung bình ngành: {avgKb} KB)
            </Typography>
          </Box>
        );
      }

      case 'dom_size': {
        const nodes = evidence.nodes || 0;
        const limit = evidence.limit || 1500;
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
        const cached = evidence.cached || 0;
        const total = evidence.total || 0;
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
        if (typeof evidence.count === 'number') {
          return (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Số lượng phát hiện: <span style={{ color: evidence.count === 0 ? '#00b894' : '#d63031' }}>{evidence.count}</span>
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
  icon: string;
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
          boxShadow: isUnavailable ? 'none' : `0 4px 12px ${statusColor}10`,
          borderColor: isUnavailable
            ? 'divider'
            : statusColor === 'text.primary' || statusColor === 'text.secondary'
            ? 'primary.main'
            : statusColor,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '1.1rem', lineHeight: 1 }}>
          {icon}
        </Typography>
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
    } catch (err: any) {
      console.error('SEO Audit run failed:', err);
      const code = err?.response?.data?.code || err?.code;
      const msg = err?.response?.data?.message || err?.message || 'Gặp lỗi khi chạy phân tích SEO';

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
    } catch (err: any) {
      console.error('SEO Audit re-run failed:', err);
      const code = err?.response?.data?.code || err?.code;
      const msg = err?.response?.data?.message || err?.message || 'Gặp lỗi khi chạy lại phân tích';
      
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
    } catch (err: any) {
      console.error('Load details failed:', err);
      const code = err?.response?.data?.code || err?.code;
      if (code === 'AUDIT_NOT_FOUND' || code === 'INVALID_AUDIT_ID') {
        showToast('Báo cáo không tồn tại hoặc đã bị xóa. Đang cập nhật lại lịch sử...', 'warning');
        mutateHistory();
      } else {
        showToast(err?.response?.data?.message || err?.message || 'Không thể mở báo cáo này', 'danger');
      }
    }
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
              borderRadius: 2,
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
              borderRadius: 2,
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
              borderRadius: 2,
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

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || !urlInput.trim()}
                  startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ transform: 'rotate(-45deg)' }} />}
                  sx={{
                    py: 1.8,
                    px: 4,
                    borderRadius: 3,
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
                  {isSubmitting ? 'Đang phân tích...' : 'Phân tích'}
                </Button>
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              
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
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  🔍 SEO Audit Report
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                  <Typography
                    variant="body2"
                    component="a"
                    href={activeReport.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      fontWeight: 700,
                      color: 'primary.main',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: '0.92rem',
                      wordBreak: 'break-all',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {activeReport.url} <OpenInNewIcon sx={{ fontSize: 13 }} />
                  </Typography>
                  
                  <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />
                  
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Ngày phân tích: {formatVnTime(activeReport.createdAt)}
                  </Typography>
                </Box>

                {/* Redirect indicator */}
                {activeReport.finalUrl && activeReport.finalUrl !== activeReport.url && (
                  <Alert severity="warning" variant="outlined" sx={{ borderRadius: 3, mb: 3, borderStyle: 'dashed' }}>
                    ↪ Redirect tới: <strong>{activeReport.finalUrl}</strong>
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
                        boxShadow: `0 0 24px ${getScoreColor(activeReport.score)}22`,
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
                            🟢 Đạt
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
                            🟡 Cần cải thiện
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
                            🔴 Không đạt
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
                      📊 Các chỉ số hiệu năng (Core Web Vitals & Page Metrics)
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
                              icon="⏱️"
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
                              icon="🎨"
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
                              icon="📐"
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
                              icon="📊"
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
                              icon="⚡"
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
                              icon="📦"
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
                              icon="💾"
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
                              icon="🏗️"
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
              <Box sx={{ display: 'flex', gap: 1.25, mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', mr: 0.5 }}>
                  Lọc theo kết quả kiểm tra:
                </Typography>
                
                <Chip
                  label="Hiện tất cả"
                  clickable
                  onClick={() => setFilterStatus('all')}
                  variant={filterStatus === 'all' ? 'filled' : 'outlined'}
                  color={filterStatus === 'all' ? 'primary' : 'default'}
                  sx={{ fontWeight: 700, borderRadius: 2.5 }}
                />
                
                <Chip
                  label="Chỉ Không Đạt (🔴)"
                  clickable
                  onClick={() => setFilterStatus('fail')}
                  variant={filterStatus === 'fail' ? 'filled' : 'outlined'}
                  color={filterStatus === 'fail' ? 'error' : 'default'}
                  sx={{ fontWeight: 700, borderRadius: 2.5 }}
                />

                <Chip
                  label="Chỉ Cần Cải Thiện (🟡)"
                  clickable
                  onClick={() => setFilterStatus('warn')}
                  variant={filterStatus === 'warn' ? 'filled' : 'outlined'}
                  color={filterStatus === 'warn' ? 'warning' : 'default'}
                  sx={{ fontWeight: 700, borderRadius: 2.5 }}
                />
              </Box>

              {/* Sections & Nested Criteria Render */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {visibleSections.map((sec) => {
                  const config = SECTION_CONFIGS[sec.key] || { label: sec.label, icon: '📋' };

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
                            <Typography sx={{ fontSize: '1.25rem', lineHeight: 1 }}>
                              {config.icon}
                            </Typography>
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
                                    <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>
                                      {c.status === 'pass' ? '✅' : c.status === 'warn' ? '⚠️' : '❌'}
                                    </Typography>
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
                                        bgcolor: c.importance === 'critical' ? 'rgba(214,48,49,0.1)' : c.importance === 'medium' ? 'rgba(241,196,15,0.1)' : 'rgba(127,140,141,0.1)',
                                        color: c.importance === 'critical' ? '#d63031' : c.importance === 'medium' ? '#f1c40f' : '#7f8c8d',
                                        border: `1px solid ${c.importance === 'critical' ? '#d63031' : c.importance === 'medium' ? '#f1c40f' : '#7f8c8d'}50`
                                      }}
                                    />
                                    <Chip
                                      label={`Tác động: ${c.weight}%`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ height: 18, fontSize: '0.62rem', fontWeight: 750, color: 'text.secondary' }}
                                    />
                                  </Box>
                                </Box>
                              </AccordionSummary>
                              
                              <AccordionDetails sx={{ pt: 0, px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Divider sx={{ mb: 1.5 }} />

                                {/* 1. Description */}
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>Mô tả tiêu chuẩn:</Typography>
                                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                                    💡 {c.description}
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
                                      💡 Hướng dẫn cách sửa đổi
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
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleReRunAudit(activeReport.url)}
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon />}
                  sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 700 }}
                >
                  🔄 Chạy lại
                </Button>
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
              <Box sx={{ fontSize: 50, opacity: 0.8 }}>🔍</Box>
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
  );
}
