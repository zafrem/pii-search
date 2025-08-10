import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Layout from './components/Layout';
import ProjectList from './components/ProjectList';
import LabelingInterface from './components/LabelingInterface';
import ProjectSettings from './components/ProjectSettings';
import SimpleAnalysisMenu from './components/SimpleAnalysisMenu';
import ExportTrainingData from './components/ExportTrainingData';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  // Handler functions for the labeling interface
  const handleSave = (entities: any[]) => {
    console.log('Saving entities:', entities);
    // TODO: Implement actual save functionality
  };

  const handleNext = () => {
    console.log('Moving to next sample');
    // TODO: Implement navigation to next sample
  };

  const handlePrevious = () => {
    console.log('Moving to previous sample');
    // TODO: Implement navigation to previous sample
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<ProjectList />} />
              <Route path="/projects" element={<ProjectList />} />
              <Route 
                path="/projects/:projectId/label" 
                element={
                  <LabelingInterface 
                    onSave={handleSave}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                  />
                } 
              />
              <Route path="/projects/:projectId/settings" element={<ProjectSettings />} />
              <Route path="/projects/:projectId/analytics" element={<SimpleAnalysisMenu />} />
              <Route path="/analytics" element={<SimpleAnalysisMenu />} />
              <Route path="/export-training" element={<ExportTrainingData />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
