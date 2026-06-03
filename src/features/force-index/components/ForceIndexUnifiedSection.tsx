import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

// Icons
import AndroidIcon from '@mui/icons-material/Android';
import HubIcon from '@mui/icons-material/Hub';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';

// Inner Pages
import ForceIndexPage from './ForceIndexPage';
import ForceIndexV2Page from '../../force-index-v2/components/ForceIndexV2Page';
import ForceIndexOwnerSection from '../../force-index-owner/components/ForceIndexOwnerSection';

export default function ForceIndexUnifiedSection() {
  // Use session storage or simple state to remember active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<number>(() => {
    const saved = sessionStorage.getItem('force_index_active_subtab');
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
              '& .MuiTab-root': {
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.98rem',
                minHeight: 48,
                px: 3,
                gap: 1
              }
            }}
          >
            <Tab 
              icon={<AndroidIcon sx={{ fontSize: 18 }} />} 
              iconPosition="start" 
              label="Ép Index Decoy" 
              id="force-index-subtab-0"
            />
            <Tab 
              icon={<HubIcon sx={{ fontSize: 18 }} />} 
              iconPosition="start" 
              label="Ép Index Link Hub" 
              id="force-index-subtab-1"
            />
            <Tab 
              icon={<CloudUploadIcon sx={{ fontSize: 18 }} />} 
              iconPosition="start" 
              label="Index Owner" 
              id="force-index-subtab-2"
            />
          </Tabs>
        </Box>

        {/* Tab content wrappers */}
        <Box>
          {activeSubTab === 0 && <ForceIndexPage />}
          {activeSubTab === 1 && <ForceIndexV2Page />}
          {activeSubTab === 2 && <ForceIndexOwnerSection />}
        </Box>
      </Paper>
    </Box>
  );
}
