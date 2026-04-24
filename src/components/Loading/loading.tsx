import { Box, CircularProgress } from '@mui/material';

export const Loading = () => (
    <Box
      sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}
    >
      <CircularProgress />
    </Box>
  );
