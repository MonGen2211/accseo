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
	CircularProgress
} from '@mui/material';
import { keywordGroupService } from '../keywordGroupService';
import { z } from 'zod';

const countSchema = z.number().min(1, 'Số lượng tối thiểu là 1').max(3, 'Số lượng tối đa là 3');

interface KeywordAiDialogProps {
	open: boolean;
	loading: boolean;
	onClose: () => void;
	onConfirm: (days: number, top: number, count: number, categories: string[]) => void;
}

export function KeywordAiDialog({ open, loading, onClose, onConfirm }: KeywordAiDialogProps) {
	const [days, setDays] = useState(30);
	const [top, setTop] = useState(100);
	const [count, setCount] = useState(3);
	const [countError, setCountError] = useState<string | null>(null);
	const [categories, setCategories] = useState<string[]>([]);
	const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
	const [loadingCategories, setLoadingCategories] = useState(false);

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
		if (days <= 0 || top <= 0) return;

		const parseResult = countSchema.safeParse(count);
		if (!parseResult.success) {
			setCountError(parseResult.error.issues[0].message);
			return;
		}
		setCountError(null);

		onConfirm(days, top, count, categories);
	};

	return (
		<Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="sm" fullWidth>
			<DialogTitle sx={{ fontWeight: 600 }}>Cấu hình AI Suggestion</DialogTitle>
			<form onSubmit={handleSubmit}>
				<DialogContent dividers>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
						<Typography variant="body2" color="text.secondary">
							Vui lòng nhập các thông số để AI có thể phân tích và tạo bộ keywords.
						</Typography>
						<TextField
							label="Số ngày (Days)"
							type="number"
							variant="outlined"
							fullWidth
							size="small"
							value={days}
							onChange={(e) => setDays(Number(e.target.value))}
							required
							slotProps={{ htmlInput: { min: 1 } }}
						/>
						<TextField
							label="Số lượng (Top)"
							type="number"
							variant="outlined"
							fullWidth
							size="small"
							value={top}
							onChange={(e) => setTop(Number(e.target.value))}
							required
							slotProps={{ htmlInput: { min: 1 } }}
						/>
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
							multiple
							options={categoryOptions}
							loading={loadingCategories}
							value={categories}
							onChange={(_, newValue) => setCategories(newValue)}
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
					<Button onClick={onClose} disabled={loading} color="inherit">
						Hủy
					</Button>
					<Button type="submit" variant="contained" disabled={loading || days <= 0 || top <= 0 || count <= 0}>
						{loading ? 'Đang tạo...' : 'Xác nhận tạo'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
