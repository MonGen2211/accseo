import React, { useEffect, useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	Box,
	Typography,
	Autocomplete,
	CircularProgress,
	LinearProgress,
} from '@mui/material';
import { keywordGroupService } from '../keywordGroupService';
import { z } from 'zod';
import { useAiProgress } from '../hooks/useAiProgress';

const countSchema = z.number().min(1, 'Số lượng tối thiểu là 1').max(3, 'Số lượng tối đa là 3');

interface KeywordAiDialogProps {
	open: boolean;
	loading: boolean;
	onClose: () => void;
	onConfirm: (count: number, categories: string[]) => void;
}

export function KeywordAiDialog({ open, loading, onClose, onConfirm }: KeywordAiDialogProps) {
	const [count, setCount] = useState(3);
	const [countError, setCountError] = useState<string | null>(null);
	const [categories, setCategories] = useState<string[]>([]);
	const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
	const [loadingCategories, setLoadingCategories] = useState(false);
	const progress = useAiProgress(loading);

	useEffect(() => {
		let isMounted = true;
		const loadData = async () => {
			if (open && categoryOptions.length === 0) {

				setLoadingCategories(true);
				try {
					const res = await keywordGroupService.getCategories();
					if (isMounted) setCategoryOptions(res);
				} catch (err) {
					console.error('Failed to load categories', err);
				} finally {
					if (isMounted) setLoadingCategories(false);
				}
			}
		};
		loadData();
		return () => { isMounted = false; };
	}, [open, categoryOptions.length]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const parseResult = countSchema.safeParse(count);
		if (!parseResult.success) {
			setCountError(parseResult.error.issues[0].message);
			return;
		}
		setCountError(null);

		onConfirm(count, categories);
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle sx={{ fontWeight: 600, pb: loading ? 0 : undefined }}>Cấu hình AI Suggestion</DialogTitle>
			{loading && (
				<Box sx={{ px: 3, pt: 1.5, pb: 0.5 }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
						<Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
							✨ AI đang phân tích và tạo keywords, bạn có thể đóng hộp thoại này...
						</Typography>
						<Typography variant="caption" color="primary" sx={{ fontWeight: 700, ml: 1, whiteSpace: 'nowrap' }}>
							{Math.round(progress)}%
						</Typography>
					</Box>
					<LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 2, height: 6 }} />
				</Box>
			)}
			<form onSubmit={handleSubmit}>
				<DialogContent dividers>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
						<Typography variant="body2" color="text.secondary">
							Vui lòng nhập các thông số để AI có thể phân tích và tạo bộ keywords.
						</Typography>
						<TextField
							label="Số lượng kết quả cần (Count)"
							type="number"
							variant="outlined"
							fullWidth
							size="small"
							value={count}
							onChange={(e) => {
								const val = Number(e.target.value);
								setCount(val);
								const result = countSchema.safeParse(val);
								setCountError(result.success ? null : result.error.issues[0].message);
							}}
							required
							error={!!countError}
							helperText={countError}
							slotProps={{ htmlInput: { min: 1, max: 3 } }}
						/>
						<Autocomplete
							options={categoryOptions}
							loading={loadingCategories}
							value={categories.length > 0 ? categories[0] : null}
							onChange={(_, newValue) => setCategories(newValue ? [newValue] : [])}
							slotProps={{
								listbox: {
									sx: { maxHeight: 160 },
								},
								popper: {
									modifiers: [
										{
											name: 'flip',
											enabled: false,
										},
										{
											name: 'preventOverflow',
											enabled: false,
										},
									],
								},
							}}
							renderInput={(params) => {
								const mergedSlotProps = {
									...params.slotProps,
									input: {
										...params.slotProps?.input,
										endAdornment: (
											<React.Fragment>
												{loadingCategories ? <CircularProgress color="inherit" size={20} /> : null}
												{params.slotProps?.input?.endAdornment}
											</React.Fragment>
										),
									},
								};

								return (
									<TextField
										{...params}
										variant="outlined"
										label="Danh mục (Categories)"
										size="small"
										placeholder="Chọn danh mục..."
										slotProps={mergedSlotProps}
									/>
								);
							}}
						/>
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={onClose} color="inherit">
						{loading ? 'Đóng (vẫn xử lý nền)' : 'Hủy'}
					</Button>
					<Button type="submit" variant="contained" disabled={loading || count <= 0}>
						{loading ? 'Đang tạo...' : 'Xác nhận tạo'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
