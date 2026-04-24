import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchArticles, updateArticle } from '../articles/articleSlice';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { CustomTable } from '../../components/custom-table';
import type { TableField, TableRowData } from '../../components/custom-table';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import PublishIcon from '@mui/icons-material/Publish';
import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import type { ArticleFormData } from '../../types/article.types';

interface StatCardProps {
	title: string;
	value: number;
	icon: React.ReactNode;
	bgColor: string;
	iconBgColor: string;
}

function StatCard({ title, value, icon, bgColor, iconBgColor }: StatCardProps) {
	return (
		<Paper
			elevation={0}
			sx={{
				p: 3,
				borderRadius: 3,
				bgcolor: bgColor,
				display: 'flex',
				flexDirection: 'column',
				gap: 2,
				minHeight: 140,
				height: '100%',
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			<Box
				sx={{
					width: 48,
					height: 48,
					borderRadius: 2,
					bgcolor: iconBgColor,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{icon}
			</Box>
			<Box>
				<Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', mb: 0.5, fontWeight: 500 }}>
					{title}
				</Typography>
				<Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
					{value}
				</Typography>
			</Box>
		</Paper>
	);
}

const recentArticleFields: TableField[] = [
	{ id: 'title', name: 'title', label: 'Tiêu đề', type: 'text', width: 250 },
	{ id: 'category', name: 'category', label: 'Danh mục', type: 'text', width: 120 },
	{ id: 'author', name: 'author', label: 'Tác giả', type: 'text', width: 150 },
	{ id: 'status', name: 'status', label: 'Trạng thái', type: 'status', width: 120, statusReadonly: false, statusType: 'article' },
	{ id: 'createdAt', name: 'createdAt', label: 'Ngày tạo', type: 'date', width: 120 },
];


export default function DashboardPage() {
	const dispatch = useAppDispatch();
	const { articles, loading } = useAppSelector((state) => state.articles);
	useEffect(() => {
		dispatch(fetchArticles());
	}, [dispatch]);

	const totalArticles = articles.length;
	const published = articles.filter((a) => a.status === 'published').length;
	const drafts = articles.filter((a) => a.status === 'draft').length;
	const archived = articles.filter((a) => a.status === 'archived').length;

	const recentArticles = [...articles]
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
		.slice(0, 5);

	const handleStatusChange = async (row: TableRowData, newStatus: string) => {
		const articleToUpdate = row as unknown as import('../../types/article.types').Article;
		if (articleToUpdate && articleToUpdate.id) {
			const data: ArticleFormData = {
				title: articleToUpdate.title,
				content: articleToUpdate.content,
				excerpt: articleToUpdate.excerpt,
				status: newStatus as import('../../types/article.types').ArticleStatus,
				category: articleToUpdate.category,
				tags: articleToUpdate.tags,
			};
			await dispatch(updateArticle({ id: articleToUpdate.id, data }));
		}
	};


	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 3 }}>
			{/* Top Section: Stats & Chart */}
			<Box sx={{
				display: 'grid',
				gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
				gap: 3,
			}}>
				{/* Stats Grid (50%) */}
				<Box sx={{
					display: 'grid',
					gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
					gap: 3,
					width: '100%',
				}}>
					<StatCard
						title="Tổng bài viết"
						value={totalArticles}
						icon={<ArticleOutlinedIcon sx={{ color: '#2563eb', fontSize: 26 }} />}
						bgColor="#dbeafe"
						iconBgColor="rgba(37, 99, 235, 0.15)"
					/>
					<StatCard
						title="Đã xuất bản"
						value={published}
						icon={<PublishIcon sx={{ color: '#059669', fontSize: 26 }} />}
						bgColor="#d1fae5"
						iconBgColor="rgba(5, 150, 105, 0.15)"
					/>
					<StatCard
						title="Bản nháp"
						value={drafts}
						icon={<DraftsOutlinedIcon sx={{ color: '#d97706', fontSize: 26 }} />}
						bgColor="#fef3c7"
						iconBgColor="rgba(217, 119, 6, 0.15)"
					/>
					<StatCard
						title="Lưu trữ"
						value={archived}
						icon={<ArchiveOutlinedIcon sx={{ color: '#7c3aed', fontSize: 26 }} />}
						bgColor="#ede9fe"
						iconBgColor="rgba(124, 58, 237, 0.15)"
					/>
				</Box>

				{/* Chart mock (50%) */}
				<Paper variant="outlined" sx={{ borderRadius: 3, p: 3, display: 'flex', flexDirection: 'column' }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
						<Box>
							<Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'text.primary' }}>
								Lượt truy cập 7 ngày qua
							</Typography>
							<Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.5 }}>
								+154% so với tuần trước
							</Typography>
						</Box>
						<Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>
							2.4M
						</Typography>
					</Box>

					{/* Mock Bar Chart */}
					<Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 180, pt: 2 }}>
						{[30, 45, 60, 40, 85, 100, 70].map((height, i) => (
							<Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, height: '100%' }}>
								<Box sx={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
									<Box
										sx={{
											width: '100%',
											maxWidth: 40,
											height: `${height}%`,
											bgcolor: i === 5 ? '#2563eb' : '#eff6ff',
											borderRadius: '6px 6px 4px 4px',
											transition: 'all 0.2s',
											'&:hover': { bgcolor: i === 5 ? '#1d4ed8' : '#dbeafe' },
											cursor: 'pointer'
										}}
									/>
								</Box>
								<Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 600 }}>
									{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}
								</Typography>
							</Box>
						))}
					</Box>
				</Paper>
			</Box>

			{/* Recent Articles */}
			<Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
				<Box sx={{ px: 3, pt: 3, pb: 1.5 }}>
					<Typography sx={{ fontSize: '20px', fontWeight: 700, color: 'text.primary' }}>
						Bài viết gần đây
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<CustomTable
						fields={recentArticleFields}
						loading={loading}
						data={recentArticles as TableRowData[]}
						enablePagination={false}
						onStatusChange={handleStatusChange}
					/>
				</Box>
			</Paper>
		</Box >
	);
}
