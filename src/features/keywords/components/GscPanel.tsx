import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import {
	fetchGscOverview,
	fetchGscKeywords,
	fetchGscPages,
	setDateRange,
	setActiveTab,
	setGscKeywordsSortField,
	setGscKeywordsSortOrder,
	setGscPagesSortField,
	setGscPagesSortOrder,
	setGscKeywordsPage,
	setGscPagesPage,
} from '../gscSlice';
import type { GscSortField } from '../gscSlice';
import type { GscDateRange, GscContentTab } from '../gscTypes';
import { GscOverviewCards } from './GscOverviewCards';
import { GscKeywordsTable, GscPagesTable } from './GscTables';

interface GscPanelProps {
	domainId: string;
}

const DATE_OPTIONS: { label: string; value: GscDateRange }[] = [
	{ label: '7 ngày', value: 7 },
	{ label: '28 ngày', value: 28 },
	{ label: '90 ngày', value: 90 },
];

const TAB_MAP: { label: string; value: GscContentTab }[] = [
	{ label: 'Tổng quan', value: 'overview' },
	{ label: 'Từ khóa', value: 'keywords' },
	{ label: 'Trang', value: 'pages' },
];

export function GscPanel({ domainId }: GscPanelProps) {
	const dispatch = useAppDispatch();
	const {
		overview,
		keywords,
		pages,
		overviewLoading,
		keywordsLoading,
		pagesLoading,
		dateRange,
		activeTab,
		keywordsSortField,
		keywordsSortOrder,
		pagesSortField,
		pagesSortOrder,
		keywordsPage,
		keywordsLimit,
		keywordsTotal,
		pagesPage,
		pagesLimit,
		pagesTotal,
	} = useAppSelector((state) => state.gsc);

	// Fetch overview
	useEffect(() => {
		if (!domainId) return;
		dispatch(fetchGscOverview({ domainId, days: dateRange }));
	}, [domainId, dateRange, dispatch]);

	// Fetch keywords (with sort + pagination)
	useEffect(() => {
		if (!domainId) return;
		dispatch(fetchGscKeywords({ domainId, sort: keywordsSortField, order: keywordsSortOrder, page: keywordsPage, limit: keywordsLimit }));
	}, [domainId, dateRange, keywordsSortField, keywordsSortOrder, keywordsPage, keywordsLimit, dispatch]);

	// Fetch pages (with sort + pagination)
	useEffect(() => {
		if (!domainId) return;
		dispatch(fetchGscPages({ domainId, sort: pagesSortField, order: pagesSortOrder, page: pagesPage, limit: pagesLimit }));
	}, [domainId, dateRange, pagesSortField, pagesSortOrder, pagesPage, pagesLimit, dispatch]);

	const handleDateChange = (_: React.MouseEvent<HTMLElement>, newRange: GscDateRange | null) => {
		if (newRange !== null) {
			dispatch(setDateRange(newRange));
			dispatch(setGscKeywordsPage(1));
			dispatch(setGscPagesPage(1));
		}
	};

	const handleTabChange = (_: React.SyntheticEvent, newTab: number) => {
		dispatch(setActiveTab(TAB_MAP[newTab].value));
	};

	// Keywords pagination
	const handleKwPageChange = (newPage: number) => {
		dispatch(setGscKeywordsPage(newPage + 1));
	};
	const handleKwRowsPerPageChange = (newLimit: number) => {
		dispatch(setGscKeywordsPage(1));
		dispatch(fetchGscKeywords({ domainId, sort: keywordsSortField, order: keywordsSortOrder, page: 1, limit: newLimit }));
	};

	// Pages pagination
	const handlePgPageChange = (newPage: number) => {
		dispatch(setGscPagesPage(newPage + 1));
	};
	const handlePgRowsPerPageChange = (newLimit: number) => {
		dispatch(setGscPagesPage(1));
		dispatch(fetchGscPages({ domainId, sort: pagesSortField, order: pagesSortOrder, page: 1, limit: newLimit }));
	};

	// Sort handlers
	const handleKeywordsSort = (field: string) => {
		if (field === keywordsSortField) {
			dispatch(setGscKeywordsSortOrder(keywordsSortOrder === 'desc' ? 'asc' : 'desc'));
		} else {
			dispatch(setGscKeywordsSortField(field as GscSortField));
			dispatch(setGscKeywordsSortOrder('desc'));
		}
		dispatch(setGscKeywordsPage(1));
	};

	const handlePagesSort = (field: string) => {
		if (field === pagesSortField) {
			dispatch(setGscPagesSortOrder(pagesSortOrder === 'desc' ? 'asc' : 'desc'));
		} else {
			dispatch(setGscPagesSortField(field as GscSortField));
			dispatch(setGscPagesSortOrder('desc'));
		}
		dispatch(setGscPagesPage(1));
	};

	const activeTabIndex = TAB_MAP.findIndex((t) => t.value === activeTab);

	return (
		<Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
			{/* Header */}
			<Box sx={{ px: 3, pt: 2.5, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
				<Typography sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
					Google Search Console
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
					<GscOverviewCards
						summary={overview?.summary ?? null}
						loading={overviewLoading}
					/>
				)}
				{activeTab === 'keywords' && (
					<GscKeywordsTable
						items={keywords?.items ?? []}
						loading={keywordsLoading}
						page={keywordsPage}
						limit={keywordsLimit}
						total={keywordsTotal}
						sortBy={keywordsSortField}
						sortOrder={keywordsSortOrder}
						onPageChange={handleKwPageChange}
						onRowsPerPageChange={handleKwRowsPerPageChange}
						onSort={handleKeywordsSort}
					/>
				)}
				{activeTab === 'pages' && (
					<GscPagesTable
						items={pages?.items ?? []}
						loading={pagesLoading}
						page={pagesPage}
						limit={pagesLimit}
						total={pagesTotal}
						sortBy={pagesSortField}
						sortOrder={pagesSortOrder}
						onPageChange={handlePgPageChange}
						onRowsPerPageChange={handlePgRowsPerPageChange}
						onSort={handlePagesSort}
					/>
				)}
			</Box>
		</Paper>
	);
}
