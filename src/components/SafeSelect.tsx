import React, { useState } from 'react';
import { Select as MuiSelect } from '@mui/material';

export default function SafeSelect({ MenuProps, onChange, value, ...props }: React.ComponentProps<typeof MuiSelect>) {
  const [open, setOpen] = useState(false);
  const [openTime, setOpenTime] = useState(0);

  const handleOpen = (e: any) => {
    setOpenTime(Date.now());
    setOpen(true);
    if (props.onOpen) props.onOpen(e);
  };

  const handleClose = (e: any, reason?: string) => {
    if (Date.now() - openTime < 300) {
      return;
    }
    setOpen(false);
    if (props.onClose) props.onClose(e);
  };

  const handleChange = (e: any, child: any) => {
    if (Date.now() - openTime < 300) {
      return;
    }
    if (!props.multiple) {
      setOpen(false);
    }
    if (onChange) onChange(e, child);
  };

  return (
    <MuiSelect
      {...props}
      value={value}
      open={open}
      onOpen={handleOpen}
      onClose={handleClose}
      onChange={handleChange}
      MenuProps={MenuProps}
    />
  );
}
