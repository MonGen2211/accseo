import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

// Icons
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';
import BoltIcon from '@mui/icons-material/Bolt';

// Inner Pages
import IndexBoosterPage from '../../index-booster/components/IndexBoosterPage';
import ForceIndexOwnerSection from '../../force-index-owner/components/ForceIndexOwnerSection';

interface ForceIndexUnifiedSectionProps {
  isActive?: boolean;
}

export default function ForceIndexUnifiedSection({ isActive = true }: ForceIndexUnifiedSectionProps) {
  // Use session storage or simple state to remember active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<number>(() => {
    const saved = sessionStorage.getItem('force_index_active_subtab');
    // Default to 0, if value is 2 (old Index Owner), redirect to 1 (new index of Ép Index Direct)
    if (saved === '2') return 1;
    return saved ? parseInt(saved, 10) : 0;
  });

  const handleSubTabChange = (val: number) => {
    setActiveSubTab(val);
    sessionStorage.setItem('force_index_active_subtab', String(val));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Title */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsInputAntennaIcon sx={{ color: '#00b894' }} /> Hệ Thống Ép Index Google
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Lựa chọn phương pháp tối ưu nhất để Google index trang web của bạn nhanh chóng
        </Typography>
      </Box>

      {/* Unified Tab Control Panel */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2.5, 
          borderRadius: 4, 
          border: '1px solid', 
          borderColor: 'divider', 
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeSubTab} 
            onChange={(_, val) => handleSubTabChange(val)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              '& .MuiTabs-indicator': {
                display: 'none'
              },
              '& .MuiTab-root': {
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.98rem',
                minHeight: 48,
                px: 3,
                gap: 1,
                borderBottom: '2px solid transparent',
                '&.Mui-selected': {
                  color: 'primary.main',
                  borderColor: 'primary.main'
                }
              }
            }}
          >
            <Tab 
              icon={<BoltIcon sx={{ fontSize: 18 }} />} 
              iconPosition="start" 
              label="Index Booster" 
              id="force-index-subtab-0"
            />
            <Tab 
              icon={<CloudUploadIcon sx={{ fontSize: 18 }} />} 
              iconPosition="start" 
              label="Ép Index Direct" 
              id="force-index-subtab-1"
            />
          </Tabs>
        </Box>

        {/* Tab content wrappers */}
        <Box>
          {activeSubTab === 0 && <IndexBoosterPage isActive={isActive} />}
          {activeSubTab === 1 && <ForceIndexOwnerSection isActive={isActive} />}
        </Box>
      </Paper>
    </Box>
  );
}

