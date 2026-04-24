import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import {
	fetchGa4Overview,
	fetchGa4Pages,
	setGa4DateRange,
	setGa4ActiveTab,
	setGa4PagesPage,
	setGa4SortField,
} from '../ga4Slice';
import type { Ga4DateRange, Ga4ContentTab } from '../ga4Types';
import { Ga4OverviewCards } from './Ga4OverviewCards';
import { Ga4PagesTable } from './Ga4PagesTable';

interface Ga4PanelProps {
	domainId: string;
}

const DATE_OPTIONS: { label: string; value: Ga4DateRange }[] = [
	{ label: '7 ngày', value: 7 },
	{ label: '28 ngày', value: 28 },
	{ label: '90 ngày', value: 90 },
];

const TAB_MAP: { label: string; value: Ga4ContentTab }[] = [
	{ label: 'Tổng quan', value: 'overview' },
	{ label: 'Trang', value: 'pages' },
];

export function Ga4Panel({ domainId }: Ga4PanelProps) {
	const dispatch = useAppDispatch();
	const {
		overview,
		pages,
		overviewLoading,
		pagesLoading,
		dateRange,
		activeTab,
		pagesPage,
		pagesLimit,
		pagesTotal,
		sortField,
	} = useAppSelector((state) => state.ga4);

	// Fetch overview when domainId or dateRange changes
	useEffect(() => {
		if (!domainId) return;
		dispatch(fetchGa4Overview({ domainId, days: dateRange }));
	}, [domainId, dateRange, dispatch]);

	// Fetch pages when relevant state changes
	useEffect(() => {
		if (!domainId) return;
		dispatch(fetchGa4Pages({ domainId, days: dateRange, page: pagesPage, limit: pagesLimit, sort: sortField }));
	}, [domainId, dateRange, pagesPage, pagesLimit, sortField, dispatch]);

	const handleDateChange = (_: React.MouseEvent<HTMLElement>, newRange: Ga4DateRange | null) => {
		if (newRange !== null) {
			dispatch(setGa4DateRange(newRange));
			dispatch(setGa4PagesPage(1));
		}
	};

	const handleTabChange = (_: React.SyntheticEvent, newTab: number) => {
		dispatch(setGa4ActiveTab(TAB_MAP[newTab].value));
	};

	const handlePageChange = (newPage: number) => {
		dispatch(setGa4PagesPage(newPage + 1)); // CustomTable is 0-indexed, API is 1-indexed
	};

	const handleRowsPerPageChange = (newLimit: number) => {
		dispatch(setGa4PagesPage(1));
		dispatch(fetchGa4Pages({ domainId, days: dateRange, page: 1, limit: newLimit, sort: sortField }));
	};

	const [localSortOrder, setLocalSortOrder] = useState<'asc' | 'desc'>('desc');

	const handleSort = (field: string) => {
		if (field === sortField) {
			setLocalSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
		} else {
			dispatch(setGa4SortField(field as import('../ga4Types').Ga4SortField));
			setLocalSortOrder('desc');
		}
		dispatch(setGa4PagesPage(1));
	};

	const activeTabIndex = TAB_MAP.findIndex((t) => t.value === activeTab);

	return (
		<Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
			{/* Header */}
			<Box sx={{ px: 3, pt: 2.5, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
				<Typography sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
					Google Analytics 4
				</Typography>
				<ToggleButtonGroup
					value={dateRange}
					exclusive
					onChange={handleDateChange}
					size="small"
					sx={{
						'& .MuiToggleButton-root': {
							textTransform: 'none',
							fontSize: 12,
							fontWeight: 600,
							px: 1.5,
							py: 0.5,
							borderRadius: '8px !important',
							border: '1px solid',
							borderColor: 'divider',
							'&.Mui-selected': {
								backgroundColor: 'primary.main',
								color: '#fff',
								'&:hover': { backgroundColor: 'primary.dark' },
							},
						},
					}}
				>
					{DATE_OPTIONS.map((opt) => (
						<ToggleButton key={opt.value} value={opt.value}>
							{opt.label}
						</ToggleButton>
					))}
				</ToggleButtonGroup>
			</Box>

			{/* Content Tabs */}
			<Box sx={{ px: 3 }}>
				<Tabs
					value={activeTabIndex}
					onChange={handleTabChange}
					sx={{
						minHeight: 36,
						'& .MuiTab-root': {
							textTransform: 'none',
							fontWeight: 600,
							fontSize: 13,
							minHeight: 36,
							px: 2,
						},
					}}
				>
					{TAB_MAP.map((tab) => (
						<Tab key={tab.value} label={tab.label} />
					))}
				</Tabs>
			</Box>

			{/* Tab Content */}
			<Box sx={{ p: 3, pt: 2 }}>
				{activeTab === 'overview' && (
					<Ga4OverviewCards
						summary={overview?.summary ?? null}
						loading={overviewLoading}
					/>
				)}
				{activeTab === 'pages' && (
					<Ga4PagesTable
						items={pages?.items ?? []}
						loading={pagesLoading}
						page={pagesPage}
						limit={pagesLimit}
						total={pagesTotal}
						sortBy={sortField}
						sortOrder={localSortOrder}
						onPageChange={handlePageChange}
						onRowsPerPageChange={handleRowsPerPageChange}
						onSort={handleSort}
					/>
				)}
			</Box>
		</Paper>
	);
}
