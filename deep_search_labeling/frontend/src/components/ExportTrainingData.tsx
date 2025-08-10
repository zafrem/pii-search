import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Download,
  Refresh,
  FilterList,
  FileDownload,
  DataArray,
  CloudDownload,
} from '@mui/icons-material';
import { PIIClassification } from '../types';

interface ExportConfig {
  format: 'json' | 'csv' | 'jsonl' | 'xml';
  includeMetadata: boolean;
  includeConfidence: boolean;
  includeTimestamps: boolean;
  minConfidence: number;
  classification: 'all' | 'pii' | 'non_pii';
  dateRange: string;
  annotatorFilter: string[];
}

interface TrainingDataStats {
  totalSamples: number;
  piiSamples: number;
  nonPiiSamples: number;
  averageConfidence: number;
  uniqueAnnotators: number;
  dateRange: {
    start: string;
    end: string;
  };
  formatBreakdown: {
    format: string;
    count: number;
    sizeBytes: number;
  }[];
}

interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: string;
  samplesCount: number;
  progress: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  error?: string;
}

const ExportTrainingData: React.FC = () => {
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'json',
    includeMetadata: true,
    includeConfidence: true,
    includeTimestamps: false,
    minConfidence: 0.7,
    classification: 'all',
    dateRange: '30days',
    annotatorFilter: [],
  });

  const [stats, setStats] = useState<TrainingDataStats | null>(null);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    data: any[];
  }>({ open: false, data: [] });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const mockAnnotators = [
    { id: '1', name: 'Alice Johnson' },
    { id: '2', name: 'Bob Smith' },
    { id: '3', name: 'Carol Davis' },
    { id: '4', name: 'David Wilson' },
  ];

  useEffect(() => {
    loadTrainingDataStats();
    loadExportJobs();
  }, [exportConfig.classification, exportConfig.dateRange, exportConfig.minConfidence]);

  const loadTrainingDataStats = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, this would fetch from API
      const mockStats: TrainingDataStats = {
        totalSamples: 2847,
        piiSamples: 1708,
        nonPiiSamples: 1139,
        averageConfidence: 0.876,
        uniqueAnnotators: 4,
        dateRange: {
          start: '2024-01-01',
          end: '2024-02-05',
        },
        formatBreakdown: [
          { format: 'JSON', count: 2847, sizeBytes: 1847392 },
          { format: 'CSV', count: 2847, sizeBytes: 892456 },
          { format: 'JSONL', count: 2847, sizeBytes: 1654823 },
          { format: 'XML', count: 2847, sizeBytes: 2934567 },
        ],
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load training data stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExportJobs = async () => {
    try {
      // Mock export jobs
      const mockJobs: ExportJob[] = [
        {
          id: '1',
          status: 'completed',
          format: 'JSON',
          samplesCount: 2847,
          progress: 100,
          createdAt: '2024-02-05T10:30:00Z',
          completedAt: '2024-02-05T10:32:15Z',
          downloadUrl: '/exports/training-data-20240205-103000.json',
        },
        {
          id: '2',
          status: 'processing',
          format: 'CSV',
          samplesCount: 1708,
          progress: 65,
          createdAt: '2024-02-05T11:15:00Z',
        },
        {
          id: '3',
          status: 'failed',
          format: 'XML',
          samplesCount: 2847,
          progress: 0,
          createdAt: '2024-02-05T09:45:00Z',
          error: 'Memory limit exceeded during XML generation',
        },
      ];

      setExportJobs(mockJobs);
    } catch (error) {
      console.error('Failed to load export jobs:', error);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      // Mock export process
      const newJob: ExportJob = {
        id: Date.now().toString(),
        status: 'processing',
        format: exportConfig.format.toUpperCase(),
        samplesCount: stats?.totalSamples || 0,
        progress: 0,
        createdAt: new Date().toISOString(),
      };

      setExportJobs(prev => [newJob, ...prev]);
      
      setSnackbar({
        open: true,
        message: `Export job started for ${newJob.samplesCount} samples in ${newJob.format} format`,
        severity: 'info',
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportJobs(prev => prev.map(job => 
          job.id === newJob.id 
            ? { ...job, progress: Math.min(job.progress + 20, 100) }
            : job
        ));
      }, 1000);

      // Complete after 5 seconds
      setTimeout(() => {
        clearInterval(progressInterval);
        setExportJobs(prev => prev.map(job => 
          job.id === newJob.id 
            ? { 
                ...job, 
                status: 'completed' as const, 
                progress: 100,
                completedAt: new Date().toISOString(),
                downloadUrl: `/exports/training-data-${Date.now()}.${exportConfig.format}`
              }
            : job
        ));
        
        setSnackbar({
          open: true,
          message: 'Export completed successfully!',
          severity: 'success',
        });
      }, 5000);

    } catch (error) {
      console.error('Export failed:', error);
      setSnackbar({
        open: true,
        message: 'Export failed. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      // Mock preview data
      const mockPreview = [
        {
          id: '1',
          text: 'John Smith called about his account number 12345.',
          classification: PIIClassification.PII,
          confidence: 0.92,
          annotator: 'Alice Johnson',
          timestamp: '2024-02-05T10:30:00Z',
          metadata: {
            source: 'customer_support',
            language: 'en',
            length: 48,
          }
        },
        {
          id: '2',
          text: 'The weather is nice today.',
          classification: PIIClassification.NON_PII,
          confidence: 0.98,
          annotator: 'Bob Smith',
          timestamp: '2024-02-05T09:15:00Z',
          metadata: {
            source: 'general_text',
            language: 'en',
            length: 26,
          }
        },
      ];

      setPreviewDialog({ open: true, data: mockPreview });
    } catch (error) {
      console.error('Failed to load preview:', error);
    }
  };

  const handleDownload = (job: ExportJob) => {
    if (job.downloadUrl) {
      // In real implementation, this would trigger actual download
      setSnackbar({
        open: true,
        message: `Downloading ${job.format} file...`,
        severity: 'info',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'info';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  if (!stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LinearProgress sx={{ width: '300px' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          📤 Export Training Data
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Export labeled training data for ML model development and analysis
        </Typography>
      </Box>

      {/* Statistics Overview */}
      <Box sx={{ mb: 4, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Samples
            </Typography>
            <Typography variant="h4" component="div">
              {stats.totalSamples.toLocaleString()}
            </Typography>
            <Typography variant="body2">
              Ready for export
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              PII Samples
            </Typography>
            <Typography variant="h4" component="div" color="error">
              {stats.piiSamples.toLocaleString()}
            </Typography>
            <Typography variant="body2">
              {((stats.piiSamples / stats.totalSamples) * 100).toFixed(1)}% of total
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Non-PII Samples
            </Typography>
            <Typography variant="h4" component="div" color="success.main">
              {stats.nonPiiSamples.toLocaleString()}
            </Typography>
            <Typography variant="body2">
              {((stats.nonPiiSamples / stats.totalSamples) * 100).toFixed(1)}% of total
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Avg Confidence
            </Typography>
            <Typography variant="h4" component="div" color="primary">
              {(stats.averageConfidence * 100).toFixed(1)}%
            </Typography>
            <Typography variant="body2">
              Quality score
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Export Configuration */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Export Configuration
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 3 }}>
            <FormControl>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={exportConfig.format}
                label="Export Format"
                onChange={(e) => setExportConfig(prev => ({ ...prev, format: e.target.value as any }))}
              >
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="jsonl">JSON Lines</MenuItem>
                <MenuItem value="xml">XML</MenuItem>
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>Classification</InputLabel>
              <Select
                value={exportConfig.classification}
                label="Classification"
                onChange={(e) => setExportConfig(prev => ({ ...prev, classification: e.target.value as any }))}
              >
                <MenuItem value="all">All Classifications</MenuItem>
                <MenuItem value="pii">PII Only</MenuItem>
                <MenuItem value="non_pii">Non-PII Only</MenuItem>
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={exportConfig.dateRange}
                label="Date Range"
                onChange={(e) => setExportConfig(prev => ({ ...prev, dateRange: e.target.value }))}
              >
                <MenuItem value="7days">Last 7 Days</MenuItem>
                <MenuItem value="30days">Last 30 Days</MenuItem>
                <MenuItem value="90days">Last 90 Days</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Min Confidence"
              type="number"
              inputProps={{ min: 0, max: 1, step: 0.1 }}
              value={exportConfig.minConfidence}
              onChange={(e) => setExportConfig(prev => ({ ...prev, minConfidence: parseFloat(e.target.value) }))}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Include Additional Data
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportConfig.includeMetadata}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                  />
                }
                label="Metadata"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportConfig.includeConfidence}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, includeConfidence: e.target.checked }))}
                  />
                }
                label="Confidence Scores"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportConfig.includeTimestamps}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, includeTimestamps: e.target.checked }))}
                  />
                }
                label="Timestamps"
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExport}
              disabled={loading}
            >
              Start Export
            </Button>
            <Button
              variant="outlined"
              startIcon={<DataArray />}
              onClick={handlePreview}
            >
              Preview Data
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadTrainingDataStats}
            >
              Refresh Stats
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Export Jobs */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Export History
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell align="right">Samples</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exportJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Chip
                        label={job.status.toUpperCase()}
                        color={getStatusColor(job.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{job.format}</TableCell>
                    <TableCell align="right">{job.samplesCount.toLocaleString()}</TableCell>
                    <TableCell sx={{ width: '150px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={job.progress}
                          sx={{ flexGrow: 1 }}
                        />
                        <Typography variant="body2">
                          {job.progress}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(job.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {job.status === 'completed' && job.downloadUrl && (
                        <Tooltip title="Download file">
                          <IconButton onClick={() => handleDownload(job)}>
                            <FileDownload />
                          </IconButton>
                        </Tooltip>
                      )}
                      {job.status === 'failed' && job.error && (
                        <Tooltip title={job.error}>
                          <IconButton color="error">
                            <FilterList />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, data: [] })}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Data Preview
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {previewDialog.data.map((sample, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="body1">
                      "{sample.text}"
                    </Typography>
                    <Chip
                      label={sample.classification.toUpperCase()}
                      color={sample.classification === PIIClassification.PII ? 'error' : 'success'}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
                    <span>Confidence: {(sample.confidence * 100).toFixed(1)}%</span>
                    <span>Annotator: {sample.annotator}</span>
                    <span>Date: {new Date(sample.timestamp).toLocaleDateString()}</span>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false, data: [] })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExportTrainingData;