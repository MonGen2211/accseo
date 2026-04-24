import { useState } from 'react';
import type { ArticleFormData, ArticleStatus } from '../../../types/article.types';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';

interface ArticleFormProps {
  initialData?: ArticleFormData;
  onSubmit: (data: ArticleFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const EMPTY_FORM: ArticleFormData = {
  title: '',
  content: '',
  excerpt: '',
  status: 'draft',
  category: '',
  tags: [],
};

export default function ArticleForm({ initialData, onSubmit, onCancel, loading }: ArticleFormProps) {
  const [form, setForm] = useState<ArticleFormData>(initialData || EMPTY_FORM);
  const [tagInput, setTagInput] = useState('');

  const handleChange = (field: keyof ArticleFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
      <TextField
        label="Tiêu đề"
        value={form.title}
        onChange={(e) => handleChange('title', e.target.value)}
        placeholder="Nhập tiêu đề bài viết"
        required
        fullWidth
      />

      <TextField
        label="Tóm tắt"
        value={form.excerpt}
        onChange={(e) => handleChange('excerpt', e.target.value)}
        placeholder="Tóm tắt nội dung bài viết"
        multiline
        rows={2}
        fullWidth
      />

      <TextField
        label="Nội dung"
        value={form.content}
        onChange={(e) => handleChange('content', e.target.value)}
        placeholder="Viết nội dung bài viết..."
        multiline
        rows={5}
        required
        fullWidth
      />

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Danh mục"
          value={form.category}
          onChange={(e) => handleChange('category', e.target.value)}
          placeholder="Frontend, Backend, DevOps..."
          required
        />
        <TextField
          select
          label="Trạng thái"
          value={form.status}
          onChange={(e) => handleChange('status', e.target.value as ArticleStatus)}
        >
          <MenuItem value="draft">Nháp</MenuItem>
          <MenuItem value="published">Đã xuất bản</MenuItem>
          <MenuItem value="archived">Lưu trữ</MenuItem>
        </TextField>
      </div>

      {/* Tags */}
      <Box>
        <TextField
          label="Tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onBlur={handleAddTag}
          placeholder="Nhập tag và Enter..."
          fullWidth
          helperText="Nhấn Enter để thêm tag"
        />
        {form.tags.length > 0 && (
          <Box className="flex flex-wrap gap-1 mt-2">
            {form.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                color="primary"
                variant="outlined"
                onDelete={() => handleRemoveTag(tag)}
              />
            ))}
          </Box>
        )}
      </Box>

      <Box className="flex justify-end gap-2 mt-2 pt-4 border-t border-gray-100">
        <Button variant="text" color="inherit" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </Box>
    </form>
  );
}
