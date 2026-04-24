import type { Article } from '../../../types/article.types';
import { CustomTable } from '../../../components/custom-table';
import type { TableField, TableRowData } from '../../../components/custom-table';

interface ArticleTableProps {
	articles: Article[];
	onEdit: (article: Article) => void;
	onDelete: (id: string) => void;
	onStatusChange?: (article: Article, newStatus: string) => void;
	loading: boolean;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	extraFilters?: React.ReactNode;
	headerActions?: React.ReactNode;
}

export default function ArticleTable({
	articles,
	onEdit,
	onDelete,
	onStatusChange,
	loading,
	searchValue,
	onSearchChange,
	extraFilters,
	headerActions,
}: ArticleTableProps) {
	const fields: TableField[] = [
		{ id: 'title', name: 'title', label: 'Tiêu đề', type: 'text', width: 250 },
		{ id: 'category', name: 'category', label: 'Danh mục', type: 'text', width: 120 },
		{ id: 'author', name: 'author', label: 'Tác giả', type: 'text', width: 150 },
		{ id: 'status', name: 'status', label: 'Trạng thái', type: 'status', width: 120, statusType: 'article' },
		{ id: 'createdAt', name: 'createdAt', label: 'Ngày tạo', type: 'date', width: 120 },
		{ id: 'actions', name: 'actions', label: 'Thao tác', type: 'actions', width: 100, align: 'center' },
	];

	const tableData: TableRowData[] = articles.map((article) => ({
		...article,
		// Provide string status so custom-status component can map it properly, though the custom status might need specific matching
		// Let's pass the raw values and see if CustomStatus handles 'draft', 'published', 'archived'
	}));

	return (
		<CustomTable
			fields={fields}
			data={tableData}
			loading={loading}
			searchValue={searchValue}
			onSearchChange={onSearchChange}
			searchPlaceholder="Tìm kiếm bài viết..."
			extraFilters={extraFilters}
			headerActions={headerActions}
			onEdit={(row) => onEdit(row as Article)}
			onDelete={(row) => onDelete(row.id as string)}
			onStatusChange={(row, newStatus) => onStatusChange && onStatusChange(row as Article, newStatus)}
		/>
	);
}
