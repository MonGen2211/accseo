import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import {
	fetchArticles,
	createArticle,
	updateArticle,
	deleteArticle,
	setSelectedArticle,
	clearSelectedArticle,
} from '../articleSlice';
import type { ArticleFormData } from '../../../types/article.types';
import ArticleTable from './ArticleTable';
import ArticleForm from './ArticleForm';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { Paper, Typography } from '@mui/material';

export default function ArticlePage() {
	const dispatch = useAppDispatch();
	const { articles, selectedArticle, loading } = useAppSelector((state) => state.articles);
	const [showForm, setShowForm] = useState(false);
	const [search, setSearch] = useState('');
	const [statusFilter] = useState('');

	useEffect(() => {
		dispatch(fetchArticles());
	}, [dispatch]);

	const filteredArticles = useMemo(() => {
		return articles.filter((a) => {
			const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
			const matchStatus = !statusFilter || a.status === statusFilter;
			return matchSearch && matchStatus;
		});
	}, [articles, search, statusFilter]);

	const handleCreate = () => {
		dispatch(clearSelectedArticle());
		setShowForm(true);
	};

	const handleEdit = (article: typeof selectedArticle) => {
		dispatch(setSelectedArticle(article));
		setShowForm(true);
	};

	const handleDelete = async (id: string) => {
		if (window.confirm('Bạn có chắc muốn xóa bài viết này?')) {
			await dispatch(deleteArticle(id));
		}
	};

	const handleStatusChange = async (articleToUpdate: typeof selectedArticle, newStatus: string) => {
		if (articleToUpdate) {
			const data: ArticleFormData = {
				title: articleToUpdate.title,
				content: articleToUpdate.content,
				excerpt: articleToUpdate.excerpt,
				status: newStatus as import('../../../types/article.types').ArticleStatus,
				category: articleToUpdate.category,
				tags: articleToUpdate.tags,
			};
			await dispatch(updateArticle({ id: articleToUpdate.id, data }));
		}
	};

	const handleSubmit = async (data: ArticleFormData) => {
		if (selectedArticle) {
			await dispatch(updateArticle({ id: selectedArticle.id, data }));
		} else {
			await dispatch(createArticle(data));
		}
		setShowForm(false);
		dispatch(clearSelectedArticle());
	};

	const handleCloseForm = () => {
		setShowForm(false);
		dispatch(clearSelectedArticle());
	};

	return (
		<Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 3 }}>
			<Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
				<Box sx={{ px: 3, pt: 3, pb: 1.5 }}>
					<Typography sx={{ fontSize: '20px', fontWeight: 700, color: 'text.primary' }}>
						Danh sách bài viết
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<ArticleTable
						loading={loading}
						articles={filteredArticles}
						onEdit={handleEdit}
						onDelete={handleDelete}
						onStatusChange={handleStatusChange}
						searchValue={search}
						onSearchChange={setSearch}
						headerActions={
							<Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
								Tạo bài viết
							</Button>
						}
					/>
				</Box>
			</Paper>

			<Dialog open={showForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
				<DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					{selectedArticle ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
					<IconButton size="small" onClick={handleCloseForm}>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent dividers>
					<ArticleForm
						initialData={
							selectedArticle
								? {
									title: selectedArticle.title,
									content: selectedArticle.content,
									excerpt: selectedArticle.excerpt,
									status: selectedArticle.status,
									category: selectedArticle.category,
									tags: selectedArticle.tags,
								}
								: undefined
						}
						onSubmit={handleSubmit}
						onCancel={handleCloseForm}
						loading={loading}
					/>
				</DialogContent>
			</Dialog>
		</Box>
	);
}
