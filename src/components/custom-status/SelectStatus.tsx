import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export interface StatusOption {
	value: string;
	label: string;
	color: string;
	bgColor: string;
}

const STATUS_PRESETS: Record<string, StatusOption[]> = {
	user: [
		{ value: 'active', label: 'Hoạt động2', color: '#059669', bgColor: '#d1fae5' },
		{ value: 'inactive', label: 'Không hoạt động', color: '#dc2626', bgColor: '#fee2e2' },
	],
	article: [
		{ value: 'draft', label: 'Bản nháp', color: '#475569', bgColor: '#f1f5f9' },
		{ value: 'published', label: 'Xuất bản', color: '#059669', bgColor: '#d1fae5' },
		{ value: 'archived', label: 'Lưu trữ', color: '#dc2626', bgColor: '#fee2e2' },
	],
	keyword: [
		{ value: 'active', label: 'Hoạt động', color: '#059669', bgColor: '#d1fae5' },
		{ value: 'archived', label: 'Lưu trữ', color: '#dc2626', bgColor: '#fee2e2' },
	]
};

export type StatusType = 'user' | 'article' | 'keyword' | string;

interface SelectStatusProps {
	value: string;
	type: StatusType;
	onChange?: (newValue: string) => void;
	disabled?: boolean;
}

export default function SelectStatus({ value, type, onChange, disabled = false }: SelectStatusProps) {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	const options = STATUS_PRESETS[type] || [];

	const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
		if (!disabled && onChange) {
			setAnchorEl(event.currentTarget);
		}
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleSelect = (optionValue: string) => {
		if (onChange && optionValue !== value) {
			onChange(optionValue);
		}
		handleClose();
	};

	const currentOption = options.find((o) => o.value === value) || {
		value,
		label: value || 'Không rõ',
		color: '#475569',
		bgColor: '#f1f5f9',
	};

	return (
		<>
			<Box
				onClick={handleOpen}
				sx={{
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '4px 8px 4px 12px',
					borderRadius: '24px',
					fontSize: '13px',
					fontWeight: 600,
					color: currentOption.color,
					backgroundColor: currentOption.bgColor,
					whiteSpace: 'nowrap',
					minWidth: '80px',
					cursor: disabled || !onChange ? 'default' : 'pointer',
					transition: 'all 0.2s',
					'&:hover': (!disabled && onChange) ? { filter: 'brightness(0.95)' } : {},
				}}
			>
				{currentOption.label}
				{(!disabled && onChange) && (
					<KeyboardArrowDownIcon
						sx={{
							fontSize: 16,
							ml: 0.5,
							transform: open ? 'rotate(180deg)' : 'none',
							transition: 'transform 0.2s'
						}}
					/>
				)}
			</Box>

			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				slotProps={{
					paper: {
						elevation: 0,
						sx: {
							filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
							mt: 1,
							borderRadius: 2,
							minWidth: 120,
						},
					}
				}}
				transformOrigin={{ horizontal: 'center', vertical: 'top' }}
				anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
			>
				{options.map((option) => (
					<MenuItem
						key={option.value}
						selected={option.value === value}
						onClick={() => handleSelect(option.value)}
						sx={{
							fontSize: '13px',
							fontWeight: 500,
							display: 'flex',
							alignItems: 'center',
							gap: 1.5,
							py: 1,
							'&.Mui-selected': {
								backgroundColor: 'rgba(0,0,0,0.04)',
							}
						}}
					>
						<Box
							sx={{
								width: 8,
								height: 8,
								borderRadius: '50%',
								backgroundColor: option.color,
							}}
						/>
						{option.label}
					</MenuItem>
				))}
			</Menu>
		</>
	);
}
