import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  LinearProgress,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
} from '@mui/material';
import {
  MoreVert,
  Add,
  Edit,
  Delete,
  PlayArrow,
  Analytics,
  GetApp,
} from '@mui/icons-material';
import { Project, ProjectStatus } from '../types';
import { useNavigate } from 'react-router-dom';

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Customer Support Emails',
    description: 'Labeling PII entities in customer support email conversations',
    classificationTypes: ['pii', 'non_pii'] as any,
    guidelines: 'Follow standard PII guidelines for customer data',
    status: ProjectStatus.ACTIVE,
    createdBy: 'admin',
    totalSamples: 1000,
    completedSamples: 750,
    qualityThreshold: 0.8,
    multiAnnotator: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    name: 'Medical Records',
    description: 'Identifying sensitive information in medical documents',
    classificationTypes: ['pii', 'non_pii'] as any,
    guidelines: 'Extra care needed for medical data',
    status: ProjectStatus.ACTIVE,
    createdBy: 'manager',
    totalSamples: 500,
    completedSamples: 200,
    qualityThreshold: 0.9,
    multiAnnotator: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
  },
];

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [newProject, setNewProject] = React.useState({
    name: '',
    description: '',
    guidelines: '',
    qualityThreshold: 0.8,
    multiAnnotator: true,
  });

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return 'success';
      case ProjectStatus.PAUSED:
        return 'warning';
      case ProjectStatus.COMPLETED:
        return 'primary';
      case ProjectStatus.ARCHIVED:
        return 'default';
      default:
        return 'default';
    }
  };

  const handleCreateProject = () => {
    // Here you would call the API to create a new project
    console.log('Creating project:', newProject);
    setCreateDialogOpen(false);
    setNewProject({
      name: '',
      description: '',
      guidelines: '',
      qualityThreshold: 0.8,
      multiAnnotator: true,
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Labeling Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Project
        </Button>
      </Box>

      <Grid container spacing={3}>
        {mockProjects.map((project) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={project.id}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {project.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, project)}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {project.description}
                </Typography>

                <Chip
                  label={project.status}
                  color={getStatusColor(project.status) as any}
                  size="small"
                  sx={{ mb: 2 }}
                />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Progress: {project.completedSamples} / {project.totalSamples}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(project.completedSamples / project.totalSamples) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Quality Threshold: {project.qualityThreshold * 100}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Multi-annotator: {project.multiAnnotator ? 'Yes' : 'No'}
                </Typography>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<PlayArrow />}
                  onClick={() => navigate(`/projects/${project.id}/label`)}
                >
                  Start Labeling
                </Button>
                <Button
                  size="small"
                  startIcon={<Analytics />}
                  onClick={() => navigate(`/projects/${project.id}/analytics`)}
                >
                  Analytics
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Project Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/projects/${selectedProject?.id}/settings`);
          handleMenuClose();
        }}>
          <Edit sx={{ mr: 1 }} />
          Edit Project
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/projects/${selectedProject?.id}/export`);
          handleMenuClose();
        }}>
          <GetApp sx={{ mr: 1 }} />
          Export Data
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Delete sx={{ mr: 1 }} />
          Delete Project
        </MenuItem>
      </Menu>

      {/* Create Project Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            variant="outlined"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Annotation Guidelines"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={newProject.guidelines}
            onChange={(e) => setNewProject({ ...newProject, guidelines: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Quality Threshold"
            type="number"
            inputProps={{ min: 0, max: 1, step: 0.1 }}
            variant="outlined"
            value={newProject.qualityThreshold}
            onChange={(e) => setNewProject({ ...newProject, qualityThreshold: parseFloat(e.target.value) })}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateProject} variant="contained">
            Create Project
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default ProjectList;