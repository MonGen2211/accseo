import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { MetaSetupSection, IntegrationsContentGSC, IntegrationsContentGA4 } from './IntegrationsTab';
import TrendingSchedulesPage from './TrendingSchedulesPage';
import { domainService } from '../../domains/domainService';
import type { Domain } from '../../../types/domain.types';

export default function SettingsPage() {
	const [domains, setDomains] = useState<Domain[]>([]);
	const [selectedDomainId, setSelectedDomainId] = useState<string>('');

	const fetchDomains = () => {
		domainService.getAll(1, 100).then((res) => {
			setDomains(res.items);
		});
	};

	useEffect(() => {
		fetchDomains();
	}, []);

	return (
		<Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
			<Box>
				<Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Set up</Typography>
				<Typography variant="body2" color="text.secondary">
					Cấu hình các lịch scan, đồng bộ và kết nối API
				</Typography>
			</Box>

			<Box sx={{ maxWidth: 400 }}>
				<FormControl fullWidth size="small">
					<InputLabel>Chọn Domain cần cấu hình</InputLabel>
					<Select
						value={selectedDomainId}
						label="Chọn Domain cần cấu hình"
						onChange={(e) => setSelectedDomainId(e.target.value)}
					>
						{domains.map((d) => (
							<MenuItem key={d._id} value={d._id}>{d.domain}</MenuItem>
						))}
					</Select>
				</FormControl>
			</Box>

			{selectedDomainId && (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 800 }}>
					<Box>
						<Typography variant="h6" sx={{ mb: 2, fontWeight: 700, pb: 1, borderBottom: 1, borderColor: 'divider' }}>1. Cấu hình Meta Description</Typography>
						<MetaSetupSection domain={domains.find(d => d._id === selectedDomainId)} onUpdate={fetchDomains} />
					</Box>

					<Box>
						<Typography variant="h6" sx={{ mb: 2, fontWeight: 700, pb: 1, borderBottom: 1, borderColor: 'divider' }}>2. Cấu hình Google Search Console (GSC)</Typography>
						<IntegrationsContentGSC domain={domains.find(d => d._id === selectedDomainId)} onUpdate={fetchDomains} />
					</Box>

					<Box>
						<Typography variant="h6" sx={{ mb: 2, fontWeight: 700, pb: 1, borderBottom: 1, borderColor: 'divider' }}>3. Cấu hình Google Analytics 4 (GA4)</Typography>
						<IntegrationsContentGA4 domain={domains.find(d => d._id === selectedDomainId)} onUpdate={fetchDomains} />
					</Box>
				</Box>
			)}

			{/* Global System Settings */}
			<Box sx={{ borderTop: 1, borderColor: 'divider', pt: 4, mt: selectedDomainId ? 2 : 0 }}>
				<Typography variant="h6" sx={{ mb: 3, fontWeight: 700, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
					4. Cấu hình Lịch đồng bộ Google Trending hệ thống
				</Typography>
				<Box sx={{ width: '100%' }}>
					<TrendingSchedulesPage />
				</Box>
			</Box>
		</Box>
	);
}
