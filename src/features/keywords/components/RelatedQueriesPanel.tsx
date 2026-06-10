import { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper, Link, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import type { SerpRelatedQueriesData } from '../types';

interface Props {
  data: SerpRelatedQueriesData | null | undefined;
  timeRange?: string;
}

function fixTrendsDate(link: string, timeRange: string): string {
  const dateValue = timeRange.endsWith('-d') ? `now+${timeRange}` : `today+${timeRange}`;
  return link.replace(/date=[^&]+/, `date=${dateValue}`);
}

function formatTopRank(index: number): string {
  if (index === 0) return '#1 · Phổ biến nhất';
  return `#${index + 1}`;
}

export function RelatedQueriesPanel({ data, timeRange = '3-m' }: Props) {
  const [tab, setTab] = useState(0);

  const rows = tab === 0 ? (data?.rising ?? []) : (data?.top ?? []);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', height: '100%' }}>
      <Box sx={{ px: 2, pt: 1.5, pb: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <BarChartIcon sx={{ fontSize: 18, color: 'primary.main' }} />
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Từ khoá liên quan</Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ 
          px: 2, 
          minHeight: 36, 
          '& .MuiTabs-indicator': {
            display: 'none'
          },
          '& .MuiTab-root': { 
            minHeight: 36, 
            fontSize: 13, 
            textTransform: 'none', 
            py: 0.5,
            borderBottom: '2px solid transparent',
            '&.Mui-selected': {
              color: 'primary.main',
              borderColor: 'primary.main',
            }
          } 
        }}
      >
        <Tab icon={<TrendingUpIcon sx={{ fontSize: 15 }} />} iconPosition="start" label={`Đang tăng (${data?.rising?.length ?? 0})`} />
        <Tab icon={<BarChartIcon sx={{ fontSize: 15 }} />} iconPosition="start" label={`Hàng đầu (${data?.top?.length ?? 0})`} />
      </Tabs>

      <Box sx={{ p: 2, minHeight: 180, maxHeight: 320, overflowY: 'auto' }}>
        {rows.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 3 }}>
            Không có dữ liệu
          </Typography>
        )}
        {rows.map((item, i) => (
          <Box
            key={i}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 0.75, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}
          >
            {item.link ? (
              <Link href={fixTrendsDate(item.link, timeRange)} target="_blank" rel="noopener noreferrer" underline="hover" variant="body2" sx={{ fontSize: 13, flex: 1 }}>
                {item.query}
              </Link>
            ) : (
              <Typography variant="body2" sx={{ fontSize: 13, flex: 1 }}>{item.query}</Typography>
            )}
            {tab === 0 ? (
              <Chip
                label={item.value}
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontSize: 11, height: 20, fontWeight: 600, flexShrink: 0 }}
              />
            ) : (
              <Typography
                variant="caption"
                sx={{ flexShrink: 0, fontWeight: 600, fontSize: 11, color: 'primary.main', whiteSpace: 'nowrap' }}
              >
                {formatTopRank(i)}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
