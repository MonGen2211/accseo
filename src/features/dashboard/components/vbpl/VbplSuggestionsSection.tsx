import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  CircularProgress,
  Badge,
  FormControl,
  Select,
  MenuItem,
  Button,
  Stack
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LayersIcon from '@mui/icons-material/Layers';

import { domainService } from '../../../domains/domainService';
import { keywordGroupService } from '../../../keywords/keywordGroupService';
import type { Domain } from '../../../../types/domain.types';
import { useToastify } from '../../../../components/Toastify';

import VbplSuggestionsSeoTopics from './VbplSuggestionsSeoTopics';
import VbplSuggestionsGgTrends from './VbplSuggestionsGgTrends';
import VbplSuggestionsVolume from './VbplSuggestionsVolume';
import VbplSuggestionsAggregatedTopics from './VbplSuggestionsAggregatedTopics';

export default function VbplSuggestionsSection() {
  const { showToast } = useToastify();

  // ================= Shared States =================
  const [activeTab, setActiveTab] = useState<number>(0);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartMinimized, setCartMinimized] = useState<boolean>(false);
  const [domainsList, setDomainsList] = useState<Domain[]>([]);
  const [selectedCartDomainId, setSelectedCartDomainId] = useState<string>('');
  const [isAddingToDomain, setIsAddingToDomain] = useState<boolean>(false);

  // Sub-tab loading states for headers
  const [tab1Loading, setTab1Loading] = useState<boolean>(false);
  const [tab2Loading, setTab2Loading] = useState<boolean>(false);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const result = await domainService.getAll(1, 100);
        setDomainsList(result.items || []);
        if (result.items && result.items.length > 0) {
          setSelectedCartDomainId(result.items[0].id);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách tên miền:', err);
      }
    };
    fetchDomains();
  }, []);

  const handleToggleCart = (itemOrString: any) => {
    const name = typeof itemOrString === 'string' ? itemOrString : itemOrString.name;
    const exists = cartItems.some(k => k.name === name);
    if (exists) {
      setCartItems(prev => prev.filter(k => k.name !== name));
      showToast(`Đã xóa khỏi giỏ hàng: ${name}`, 'info');
    } else {
      const newItem = typeof itemOrString === 'string' 
        ? { name: itemOrString }
        : {
            name: itemOrString.name,
            reason: itemOrString.reason || '',
            currentScore: itemOrString.currentScore,
            avg: itemOrString.avg,
            slope: itemOrString.slope,
            isSpike: itemOrString.isSpike,
            trendTimeline: itemOrString.trendTimeline,
            relatedQueries: itemOrString.relatedQueries,
            relatedTopics: itemOrString.relatedTopics,
          };
      setCartItems(prev => [...prev, newItem]);
      setCartMinimized(false);
      showToast(`Đã thêm vào giỏ hàng: ${name}`, 'success');
    }
  };

  const handleAddCartToDomain = async () => {
    if (!selectedCartDomainId) {
      showToast('Vui lòng chọn tên miền!', 'warning');
      return;
    }
    setIsAddingToDomain(true);
    try {
      const items = cartItems.map(item => ({
        name: item.name,
        reason: item.reason || null,
        status: 'pending_approval' as const,
        currentScore: item.currentScore,
        avg: item.avg,
        slope: item.slope,
        isSpike: item.isSpike,
        trendTimeline: item.trendTimeline,
        relatedQueries: item.relatedQueries,
        relatedTopics: item.relatedTopics,
      }));

      await keywordGroupService.createGroupItems({
        domainId: selectedCartDomainId,
        items,
        aiGen: true
      });

      showToast(`Đã thêm thành công ${cartItems.length} từ khóa vào tên miền!`, 'success');
      setCartItems([]);
    } catch (error: any) {
      console.error('Lỗi khi thêm bộ từ khóa:', error);
      showToast(error?.response?.data?.message || 'Có lỗi xảy ra khi thêm từ khóa vào tên miền!', 'danger');
    } finally {
      setIsAddingToDomain(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Title */}
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <AutoAwesomeIcon sx={{ color: '#f59e0b', fontSize: '1.75rem' }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Gợi ý từ khóa
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Duyệt danh sách từ khoá và chủ đề gợi ý bởi AI giúp tối ưu hoá nội dung SEO
        </Typography>
      </Box>

      {/* Unified Suggestions Panel with Tabs */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: '24px', // Modern M3 Radius
          border: '1px solid', 
          borderColor: 'divider', 
          bgcolor: 'background.paper',
          minHeight: 580,
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
      >
        {/* Sleek Modern Tabs Header */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, val) => setActiveTab(val)}
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
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                borderBottom: '2px solid transparent',
                '&.Mui-selected': {
                  color: 'primary.main',
                  borderColor: 'primary.main'
                },
                '& .MuiTab-iconWrapper': {
                  margin: '0 !important',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }
              }
            }}
          >
            <Tab 
              icon={<AutoAwesomeIcon sx={{ fontSize: '1.25rem' }} />} 
              iconPosition="start" 
              label="AI Gợi ý Chủ đề SEO" 
              id="suggestions-tab-0"
            />
            <Tab 
              icon={
                tab1Loading ? (
                  <CircularProgress size={20} sx={{ color: '#f59e0b' }} />
                ) : (
                  <PsychologyIcon sx={{ fontSize: '1.25rem' }} />
                )
              } 
              iconPosition="start" 
              label="Gợi ý từ khóa (GG Trends)" 
              id="suggestions-tab-1"
            />
            <Tab 
              icon={
                tab2Loading ? (
                  <CircularProgress size={20} sx={{ color: '#10b981' }} />
                ) : (
                  <AutoAwesomeIcon sx={{ fontSize: '1.25rem' }} />
                )
              } 
              iconPosition="start" 
              label="AI Gợi ý Từ khóa (Volume)" 
              id="suggestions-tab-2"
            />
            <Tab 
              icon={<LayersIcon sx={{ fontSize: '1.25rem' }} />} 
              iconPosition="start" 
              label="Chủ đề tổng hợp" 
              id="suggestions-tab-3"
            />
          </Tabs>
        </Box>

        {/* TAB CONTENTS */}
        {activeTab === 0 ? (
          <VbplSuggestionsSeoTopics
            cartItems={cartItems}
            setCartItems={setCartItems}
            cartMinimized={cartMinimized}
            setCartMinimized={setCartMinimized}
            handleToggleCart={handleToggleCart}
          />
        ) : activeTab === 1 ? (
          <VbplSuggestionsGgTrends
            cartItems={cartItems}
            setCartItems={setCartItems}
            cartMinimized={cartMinimized}
            setCartMinimized={setCartMinimized}
            handleToggleCart={handleToggleCart}
            onLoadingChange={setTab1Loading}
          />
        ) : activeTab === 2 ? (
          <VbplSuggestionsVolume
            cartItems={cartItems}
            setCartItems={setCartItems}
            cartMinimized={cartMinimized}
            setCartMinimized={setCartMinimized}
            handleToggleCart={handleToggleCart}
            onLoadingChange={setTab2Loading}
          />
        ) : (
          <VbplSuggestionsAggregatedTopics
            cartItems={cartItems}
            setCartItems={setCartItems}
            cartMinimized={cartMinimized}
            setCartMinimized={setCartMinimized}
            handleToggleCart={handleToggleCart}
          />
        )}
      </Paper>

      {/* Floating cart bar minimized state */}
      {cartItems.length > 0 && cartMinimized && (
        <Box
          onClick={() => setCartMinimized(false)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1200,
            bgcolor: '#1e293b',
            color: 'white',
            borderRadius: '50%',
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.1) translateY(-3px)',
              bgcolor: '#0f172a',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)'
            }
          }}
        >
          <Badge 
            badgeContent={cartItems.length} 
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                height: 18,
                minWidth: 18,
                fontWeight: 800
              }
            }}
          >
            <ShoppingCartIcon sx={{ fontSize: 24, color: '#38bdf8' }} />
          </Badge>
        </Box>
      )}

      {/* Floating cart bar expanded state */}
      {cartItems.length > 0 && !cartMinimized && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1100,
            width: '90%',
            maxWidth: 800,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px', // Modern M3 Radius
            border: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(14, 165, 233, 0.15)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            p: 2,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            '@keyframes slideUp': {
              '0%': { transform: 'translate(-50%, 100px)', opacity: 0 },
              '100%': { transform: 'translate(-50%, 0)', opacity: 1 }
            }
          }}
        >
          {/* Left part: summary */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box 
              sx={{ 
                bgcolor: 'rgba(56, 189, 248, 0.15)', 
                color: '#38bdf8', 
                p: 1, 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                Giỏ hàng từ khóa ({cartItems.length} từ khóa đã chọn)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: { xs: 250, sm: 300 }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {cartItems.map(k => k.name).join(', ')}
              </Typography>
            </Box>
          </Box>

          {/* Right part: action and domain selection */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button
              variant="text"
              color="primary"
              size="small"
              onClick={() => setCartMinimized(true)}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Thu gọn
            </Button>

            <Button
              variant="text"
              color="error"
              size="small"
              onClick={() => {
                setCartItems([]);
                showToast('Đã xóa toàn bộ giỏ hàng!', 'info');
              }}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Dọn dẹp
            </Button>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={selectedCartDomainId}
                onChange={(e) => setSelectedCartDomainId(e.target.value)}
                displayEmpty
                sx={{ borderRadius: '100px', height: 36, bgcolor: 'background.paper', fontSize: '0.85rem' }}
              >
                {domainsList.length === 0 ? (
                  <MenuItem value="" disabled>Không tìm thấy tên miền</MenuItem>
                ) : (
                  domainsList.map(d => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              size="small"
              color="primary"
              disabled={isAddingToDomain || cartItems.length === 0}
              onClick={handleAddCartToDomain}
              sx={{ borderRadius: '100px', height: 36, px: 2.5, fontWeight: 800, textTransform: 'none' }}
            >
              {isAddingToDomain ? 'Đang thêm...' : 'Thêm vào tên miền'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
