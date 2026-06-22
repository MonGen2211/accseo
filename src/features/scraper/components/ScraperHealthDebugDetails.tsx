import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import LaunchIcon from '@mui/icons-material/Launch';
import CodeIcon from '@mui/icons-material/Code';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { ScraperHealthSource, ScraperRun } from '../types';

interface ScraperHealthDebugDetailsProps {
  data: ScraperHealthSource | ScraperRun;
}

const FIELD_MAP: Record<string, string> = {
  title: 'Tiêu đề',
  publishedAt: 'Ngày đăng',
  tags: 'Thẻ (Tags)',
  metadata: 'Dữ liệu chi tiết (Metadata)',
};

export default function ScraperHealthDebugDetails({ data }: ScraperHealthDebugDetailsProps) {
  const {
    fillRates,
    baselineFillRates,
    inserted,
    baselineInserted,
    sectionCounts,
    driftSamples,
    newSectionDetails,
    errorStack,
  } = data;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
      {/* 1. So sánh bài mới và hiệu năng */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CodeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
          Hiệu năng & Sản lượng bài viết
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'background.default' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Số bài mới nhận được:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {inserted} bài
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 500 }}>
                  (Thường ngày: ~{baselineInserted !== null ? `${baselineInserted} bài` : 'N/A'})
                </Typography>
              </Typography>
              {baselineInserted !== null && inserted === 0 && baselineInserted > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: 'error.main' }}>
                  <WarningAmberIcon sx={{ fontSize: 14 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Cảnh báo: Không cào được bài mới nào!
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'background.default' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Tổng số lượng bài cào được:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {data.total} bài
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 500 }}>
                  (Thường ngày: ~{data.baselineTotal !== null ? `${data.baselineTotal} bài` : 'N/A'})
                </Typography>
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* 2. So sánh Fill Rates với Baseline */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
          Chi tiết Tỷ lệ đầy đủ dữ liệu (So với Baseline)
        </Typography>
        {fillRates ? (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Trường dữ liệu</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Tỷ lệ hiện tại</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Tỷ lệ trung bình</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Độ chênh lệch</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(FIELD_MAP).map((field) => {
                  const val = fillRates[field];
                  const baseVal = baselineFillRates ? baselineFillRates[field] : null;
                  if (val === undefined || val === null) return null;

                  const pct = Math.round(val * 100);
                  const basePct = baseVal !== null && baseVal !== undefined ? Math.round(baseVal * 100) : null;
                  const delta = basePct !== null ? pct - basePct : 0;
                  const isLow = pct < 50;

                  return (
                    <TableRow key={field} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 600 }}>{FIELD_MAP[field]}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: isLow ? 'error.main' : 'text.primary' }}>
                        {pct}%
                      </TableCell>
                      <TableCell align="right" color="text.secondary">
                        {basePct !== null ? `${basePct}%` : 'N/A'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: delta < 0 ? 'error.main' : 'success.main' }}>
                        {delta < 0 ? `${delta}% ↓` : delta > 0 ? `+${delta}% ↑` : '0%'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Không có thông tin so sánh tỷ lệ đầy đủ dữ liệu.
          </Typography>
        )}
      </Box>

      {/* 3. Phân bố Chuyên mục (sectionCounts) */}
      {sectionCounts && Object.keys(sectionCounts).length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
            Phân bố bài viết theo Chuyên mục
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Tên chuyên mục</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Số bài cào được</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(sectionCounts).map(([sectionName, count]) => {
                  const isZero = count === 0;
                  return (
                    <TableRow 
                      key={sectionName} 
                      sx={{ 
                        bgcolor: isZero ? 'rgba(211, 47, 47, 0.05)' : 'transparent',
                        '&:last-child td, &:last-child th': { border: 0 } 
                      }}
                    >
                      <TableCell sx={{ fontWeight: isZero ? 700 : 500, color: isZero ? 'error.main' : 'text.primary' }}>
                        {sectionName}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: isZero ? 'error.main' : 'text.primary' }}>
                        {count} bài
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* 4. Bài viết lệch layout mẫu (driftSamples) */}
      {driftSamples && driftSamples.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
            Mẫu bài viết bị lệch layout (Drift Samples):
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {driftSamples.map((group) => {
              const fieldLabel = FIELD_MAP[group.field] || group.field;
              return (
                <Paper key={group.field} variant="outlined" sx={{ p: 1.5, borderRadius: '8px' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main', display: 'block', mb: 1 }}>
                    ⚠️ Bị trôi lệch ở trường: {fieldLabel}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {group.samples.map((sample, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.1 }}>
                          •
                        </Typography>
                        <Link
                          href={sample.url}
                          target="_blank"
                          rel="noopener"
                          variant="caption"
                          sx={{ 
                            fontWeight: 600, 
                            color: 'primary.main', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            wordBreak: 'break-all'
                          }}
                        >
                          {sample.title || 'Mẫu bài viết lỗi'}
                          <LaunchIcon sx={{ fontSize: 12 }} />
                        </Link>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              );
            })}
          </Box>
        </Box>
      )}

      {/* 5. Chuyên mục mới chưa có parser (newSectionDetails) */}
      {newSectionDetails && newSectionDetails.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
            Phát hiện chuyên mục mới (Chưa có Parser):
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {newSectionDetails.map((sec, idx) => (
              <Paper 
                key={idx} 
                variant="outlined" 
                sx={{ 
                  p: 1.5, 
                  borderRadius: '8px', 
                  bgcolor: 'rgba(237, 108, 2, 0.03)',
                  border: '1px solid rgba(237, 108, 2, 0.2)'
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.8 }}>
                  Chuyên mục: <Box component="span" sx={{ color: 'warning.main', fontWeight: 800 }}>{sec.section}</Box> ({sec.count} bài)
                </Typography>
                
                {/* New backend shape: samples list */}
                {sec.samples && sec.samples.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {sec.samples.map((sample, sIdx) => (
                      <Button
                        key={sIdx}
                        variant="outlined"
                        size="small"
                        color="warning"
                        href={sample.url}
                        target="_blank"
                        rel="noopener"
                        title={sample.title || undefined}
                        startIcon={<LaunchIcon sx={{ fontSize: 12 }} />}
                        sx={{ textTransform: 'none', fontSize: '0.7rem', py: 0.2, px: 1 }}
                      >
                        Xem bài mẫu {sec.samples.length > 1 ? `#${sIdx + 1}` : ''}
                      </Button>
                    ))}
                  </Box>
                )}

                {/* Fallback to old shape if present */}
                {!(sec.samples && sec.samples.length > 0) && (sec as any).sampleUrl && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      color="warning"
                      href={(sec as any).sampleUrl}
                      target="_blank"
                      rel="noopener"
                      startIcon={<LaunchIcon sx={{ fontSize: 12 }} />}
                      sx={{ textTransform: 'none', fontSize: '0.7rem', py: 0.2, px: 1 }}
                    >
                      Xem bài mẫu: {(sec as any).sampleTitle || 'Chi tiết'}
                    </Button>
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* 6. Chi tiết Stack Trace lỗi */}
      {errorStack && (
        <Box>
          <Box component="details" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden' }}>
            <Box 
              component="summary" 
              sx={{ 
                p: 1.2, 
                fontWeight: 700, 
                fontSize: '0.75rem', 
                color: 'error.main', 
                cursor: 'pointer',
                bgcolor: 'rgba(211, 47, 47, 0.03)',
                '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.08)' }
              }}
            >
              Xem chi tiết Stack Trace gỡ lỗi (Lỗi gãy scraper)
            </Box>
            <Box 
              component="pre" 
              sx={{ 
                m: 0,
                p: 1.5, 
                fontSize: '11px', 
                fontFamily: 'monospace', 
                bgcolor: 'action.hover', 
                overflowX: 'auto',
                whiteSpace: 'pre',
                maxHeight: '200px',
                overflowY: 'auto'
              }}
            >
              {errorStack}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
