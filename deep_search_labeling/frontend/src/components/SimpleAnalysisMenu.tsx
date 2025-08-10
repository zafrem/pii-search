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
} from '@mui/material';
import { PIIClassification } from '../types';

interface AnalysisData {
  projectStats: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalSamples: number;
    labeledSamples: number;
    averageAccuracy: number;
  };
  annotatorPerformance: Array<{
    annotatorId: string;
    name: string;
    totalAnnotations: number;
    accuracy: number;
    speed: number;
    qualityScore: number;
    consistencyScore: number;
  }>;
  classificationDistribution: Array<{
    classification: PIIClassification;
    count: number;
    percentage: number;
  }>;
  qualityMetrics: {
    interAnnotatorAgreement: number;
    cohensKappa: number;
    averageConfidence: number;
  };
  modelComparison: Array<{
    modelVersion: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    trainingDate: string;
    sampleCount: number;
  }>;
}

const SimpleAnalysisMenu: React.FC = () => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30days');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const mockProjects = [
    { id: 'all', name: 'All Projects' },
    { id: '1', name: 'Customer Support Emails' },
    { id: '2', name: 'Medical Records' },
    { id: '3', name: 'Financial Documents' },
  ];

  useEffect(() => {
    loadAnalysisData();
  }, [selectedProject, selectedTimeRange]);

  const loadAnalysisData = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockData: AnalysisData = {
        projectStats: {
          totalProjects: 5,
          activeProjects: 3,
          completedProjects: 2,
          totalSamples: 2500,
          labeledSamples: 1875,
          averageAccuracy: 0.892,
        },
        annotatorPerformance: [
          {
            annotatorId: '1',
            name: 'Alice Johnson',
            totalAnnotations: 450,
            accuracy: 0.94,
            speed: 12.5,
            qualityScore: 0.91,
            consistencyScore: 0.88,
          },
          {
            annotatorId: '2',
            name: 'Bob Smith',
            totalAnnotations: 380,
            accuracy: 0.89,
            speed: 15.2,
            qualityScore: 0.87,
            consistencyScore: 0.85,
          },
          {
            annotatorId: '3',
            name: 'Carol Davis',
            totalAnnotations: 520,
            accuracy: 0.92,
            speed: 11.8,
            qualityScore: 0.90,
            consistencyScore: 0.92,
          },
        ],
        classificationDistribution: [
          { classification: PIIClassification.PII, count: 1125, percentage: 60.0 },
          { classification: PIIClassification.NON_PII, count: 750, percentage: 40.0 },
        ],
        qualityMetrics: {
          interAnnotatorAgreement: 0.87,
          cohensKappa: 0.82,
          averageConfidence: 0.89,
        },
        modelComparison: [
          {
            modelVersion: 'v0.0.1',
            accuracy: 0.78,
            precision: 0.82,
            recall: 0.75,
            f1Score: 0.78,
            trainingDate: '2024-01-01',
            sampleCount: 500,
          },
          {
            modelVersion: 'v1.1.0',
            accuracy: 0.85,
            precision: 0.87,
            recall: 0.83,
            f1Score: 0.85,
            trainingDate: '2024-01-15',
            sampleCount: 1000,
          },
          {
            modelVersion: 'v1.2.0',
            accuracy: 0.89,
            precision: 0.91,
            recall: 0.87,
            f1Score: 0.89,
            trainingDate: '2024-01-30',
            sampleCount: 1875,
          },
        ],
      };

      setAnalysisData(mockData);
    } catch (error) {
      console.error('Failed to load analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!analysisData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LinearProgress sx={{ width: '300px' }} />
      </Box>
    );
  }

  const renderOverviewTab = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Key Metrics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Projects
            </Typography>
            <Typography variant="h4" component="div">
              {analysisData.projectStats.totalProjects}
            </Typography>
            <Typography variant="body2">
              {analysisData.projectStats.activeProjects} active
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Labeling Progress
            </Typography>
            <Typography variant="h4" component="div">
              {((analysisData.projectStats.labeledSamples / analysisData.projectStats.totalSamples) * 100).toFixed(1)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(analysisData.projectStats.labeledSamples / analysisData.projectStats.totalSamples) * 100}
              sx={{ mt: 1 }}
            />
            <Typography variant="body2">
              {analysisData.projectStats.labeledSamples} / {analysisData.projectStats.totalSamples} samples
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Average Accuracy
            </Typography>
            <Typography variant="h4" component="div" color="primary">
              {(analysisData.projectStats.averageAccuracy * 100).toFixed(1)}%
            </Typography>
            <Typography variant="body2">
              Inter-annotator agreement: {(analysisData.qualityMetrics.interAnnotatorAgreement * 100).toFixed(1)}%
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Cohen's Kappa
            </Typography>
            <Typography variant="h4" component="div" color="secondary">
              {analysisData.qualityMetrics.cohensKappa.toFixed(3)}
            </Typography>
            <Typography variant="body2">
              Quality measure
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Classification Distribution */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Classification Distribution
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {analysisData.classificationDistribution.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip 
                  label={item.classification.toUpperCase()} 
                  color={item.classification === PIIClassification.PII ? 'error' : 'success'}
                />
                <LinearProgress 
                  variant="determinate" 
                  value={item.percentage} 
                  sx={{ flexGrow: 1, height: 8 }}
                />
                <Typography variant="body2">
                  {item.count} ({item.percentage}%)
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  const renderAnnotatorTab = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Annotator Performance Overview
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Annotator</TableCell>
                  <TableCell align="right">Total Annotations</TableCell>
                  <TableCell align="right">Accuracy</TableCell>
                  <TableCell align="right">Speed (per hour)</TableCell>
                  <TableCell align="right">Quality Score</TableCell>
                  <TableCell align="right">Consistency</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analysisData.annotatorPerformance.map((annotator) => (
                  <TableRow key={annotator.annotatorId}>
                    <TableCell component="th" scope="row">
                      {annotator.name}
                    </TableCell>
                    <TableCell align="right">{annotator.totalAnnotations}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${(annotator.accuracy * 100).toFixed(1)}%`}
                        color={annotator.accuracy > 0.9 ? 'success' : annotator.accuracy > 0.85 ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{annotator.speed.toFixed(1)}</TableCell>
                    <TableCell align="right">{(annotator.qualityScore * 100).toFixed(1)}%</TableCell>
                    <TableCell align="right">{(annotator.consistencyScore * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderModelTab = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Model Performance Comparison
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Model Version</TableCell>
                  <TableCell align="right">Accuracy</TableCell>
                  <TableCell align="right">Precision</TableCell>
                  <TableCell align="right">Recall</TableCell>
                  <TableCell align="right">F1 Score</TableCell>
                  <TableCell align="right">Training Samples</TableCell>
                  <TableCell>Training Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analysisData.modelComparison.map((model) => (
                  <TableRow key={model.modelVersion}>
                    <TableCell component="th" scope="row">
                      <Chip label={model.modelVersion} color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{(model.accuracy * 100).toFixed(1)}%</TableCell>
                    <TableCell align="right">{(model.precision * 100).toFixed(1)}%</TableCell>
                    <TableCell align="right">{(model.recall * 100).toFixed(1)}%</TableCell>
                    <TableCell align="right">{(model.f1Score * 100).toFixed(1)}%</TableCell>
                    <TableCell align="right">{model.sampleCount.toLocaleString()}</TableCell>
                    <TableCell>{new Date(model.trainingDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderQualityTab = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Inter-Annotator Agreement
            </Typography>
            <Typography variant="h4" component="div" color="primary">
              {(analysisData.qualityMetrics.interAnnotatorAgreement * 100).toFixed(1)}%
            </Typography>
            <Typography variant="body2">
              Measures consistency between annotators
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Cohen's Kappa
            </Typography>
            <Typography variant="h4" component="div" color="secondary">
              {analysisData.qualityMetrics.cohensKappa.toFixed(3)}
            </Typography>
            <Typography variant="body2">
              Statistical measure of agreement
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Average Confidence
            </Typography>
            <Typography variant="h4" component="div" sx={{ color: 'success.main' }}>
              {(analysisData.qualityMetrics.averageConfidence * 100).toFixed(1)}%
            </Typography>
            <Typography variant="body2">
              Annotator confidence in labels
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          📊 PII Labeling System Analysis
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Comprehensive analytics and insights for your labeling projects
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Project</InputLabel>
          <Select
            value={selectedProject}
            label="Project"
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            {mockProjects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={selectedTimeRange}
            label="Time Range"
            onChange={(e) => setSelectedTimeRange(e.target.value)}
          >
            <MenuItem value="7days">Last 7 Days</MenuItem>
            <MenuItem value="30days">Last 30 Days</MenuItem>
            <MenuItem value="90days">Last 90 Days</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>

        <Button variant="outlined" onClick={loadAnalysisData} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: '📈 Overview' },
            { id: 'annotators', label: '👥 Annotators' },
            { id: 'models', label: '🤖 Models' },
            { id: 'quality', label: '⭐ Quality' },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'contained' : 'outlined'}
              onClick={() => setActiveTab(tab.id)}
              sx={{ mb: 1 }}
            >
              {tab.label}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Tab Content */}
      <Box>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'annotators' && renderAnnotatorTab()}
        {activeTab === 'models' && renderModelTab()}
        {activeTab === 'quality' && renderQualityTab()}
      </Box>
    </Box>
  );
};

export default SimpleAnalysisMenu;