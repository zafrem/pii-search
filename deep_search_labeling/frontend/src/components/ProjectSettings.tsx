import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const ProjectSettings: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Project Settings
      </Typography>
      <Typography variant="body1">
        Project configuration interface coming soon...
      </Typography>
    </Paper>
  );
};

export default ProjectSettings;