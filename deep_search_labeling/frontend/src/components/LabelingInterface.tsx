import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Slider,
  Grid,
  Card,
  CardContent,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Save,
  NavigateNext,
  NavigateBefore,
  Undo,
  Redo,
  Help,
  Delete,
} from '@mui/icons-material';
import { PIIClassification, PIIClassificationItem, TextSample } from '../types';

interface LabelingInterfaceProps {
  sample?: TextSample;
  onSave: (classifications: PIIClassificationItem[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const classificationColors: Record<PIIClassification, string> = {
  [PIIClassification.PII]: '#FF5722',
  [PIIClassification.NON_PII]: '#4CAF50',
};

const LabelingInterface: React.FC<LabelingInterfaceProps> = ({
  sample,
  onSave,
  onNext,
  onPrevious,
}) => {
  const [classifications, setClassifications] = useState<PIIClassificationItem[]>([]);
  const [selectedText, setSelectedText] = useState<{
    start: number;
    end: number;
    text: string;
  } | null>(null);
  const [selectedClassification, setSelectedClassification] = useState<PIIClassification>(PIIClassification.PII);
  const [confidence, setConfidence] = useState<number>(0.8);
  const [notes, setNotes] = useState<string>('');
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [undoStack, setUndoStack] = useState<PIIClassificationItem[][]>([]);
  const [redoStack, setRedoStack] = useState<PIIClassificationItem[][]>([]);

  // Mock sample data
  const mockSample: TextSample = sample || {
    id: '1',
    projectId: '1',
    text: 'Hello, my name is John Doe and you can reach me at john.doe@example.com or call me at (555) 123-4567. I live at 123 Main Street, New York, NY 10001.',
    language: 'english',
    status: 'in_progress' as any,
    classifications: [],
    annotatorIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  useEffect(() => {
    if (sample) {
      setClassifications(sample.classifications || []);
    }
  }, [sample]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString();
      const start = range.startOffset;
      const end = range.endOffset;

      setSelectedText({
        start,
        end,
        text: selectedText,
      });
    }
  }, []);

  const addEntity = useCallback(() => {
    if (!selectedText) return;

    // Check for overlapping classifications
    const hasOverlap = classifications.some(
      (item) =>
        (selectedText.start >= item.start && selectedText.start < item.end) ||
        (selectedText.end > item.start && selectedText.end <= item.end) ||
        (selectedText.start <= item.start && selectedText.end >= item.end)
    );

    if (hasOverlap) {
      alert('Selected text overlaps with existing classification');
      return;
    }

    const newClassification: PIIClassificationItem = {
      id: Date.now().toString(),
      start: selectedText.start,
      end: selectedText.end,
      text: selectedText.text,
      classification: selectedClassification,
      confidence,
      notes: notes || undefined,
      annotatorId: 'current-user', // This would come from auth context
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save current state for undo
    setUndoStack((prev) => [...prev, classifications]);
    setRedoStack([]);

    setClassifications((prev) => [...prev, newClassification]);
    setSelectedText(null);
    setNotes('');
  }, [selectedText, selectedClassification, confidence, notes, classifications]);

  const deleteClassification = useCallback((classificationId: string) => {
    setUndoStack((prev) => [...prev, classifications]);
    setRedoStack([]);
    setClassifications((prev) => prev.filter((item) => item.id !== classificationId));
  }, [classifications]);

  const undo = useCallback(() => {
    if (undoStack.length > 0) {
      setRedoStack((prev) => [classifications, ...prev]);
      setClassifications(undoStack[undoStack.length - 1]);
      setUndoStack((prev) => prev.slice(0, -1));
    }
  }, [classifications, undoStack]);

  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      setUndoStack((prev) => [...prev, classifications]);
      setClassifications(redoStack[0]);
      setRedoStack((prev) => prev.slice(1));
    }
  }, [classifications, redoStack]);

  const renderHighlightedText = () => {
    const text = mockSample.text;
    let lastIndex = 0;
    const parts = [];

    // Sort classifications by start position
    const sortedClassifications = [...classifications].sort((a, b) => a.start - b.start);

    sortedClassifications.forEach((item, index) => {
      // Add text before classification
      if (item.start > lastIndex) {
        parts.push(text.slice(lastIndex, item.start));
      }

      // Add highlighted classification
      parts.push(
        <Chip
          key={`classification-${index}`}
          label={`${item.text} (${item.classification.toUpperCase()})`}
          style={{
            backgroundColor: classificationColors[item.classification],
            color: 'white',
            margin: '0 2px',
            height: 'auto',
            borderRadius: '4px',
          }}
          onDelete={() => deleteClassification(item.id)}
          deleteIcon={<Delete style={{ color: 'white' }} />}
          size="small"
        />
      );

      lastIndex = item.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const keyboardShortcuts = [
    { key: '1', classification: PIIClassification.PII },
    { key: '2', classification: PIIClassification.NON_PII },
  ];

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            onSave(classifications);
            break;
          case 'z':
            event.preventDefault();
            undo();
            break;
          case 'y':
            event.preventDefault();
            redo();
            break;
        }
      } else {
        const shortcut = keyboardShortcuts.find((s) => s.key === event.key);
        if (shortcut && selectedText) {
          setSelectedClassification(shortcut.classification);
          setTimeout(addEntity, 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [classifications, selectedText, undo, redo, addEntity, onSave, keyboardShortcuts]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Text Annotation Interface
      </Typography>

      <Grid container spacing={3}>
        {/* Main Text Area */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={2} sx={{ p: 3, minHeight: 400 }}>
            <Typography variant="h6" gutterBottom>
              Text Sample
            </Typography>
            <Box
              sx={{
                border: '1px solid #ddd',
                borderRadius: 1,
                p: 2,
                minHeight: 300,
                fontSize: '16px',
                lineHeight: 1.6,
                userSelect: 'text',
                backgroundColor: '#fafafa',
              }}
              onMouseUp={handleTextSelection}
            >
              {renderHighlightedText()}
            </Box>

            {/* Selection Info */}
            {selectedText && (
              <Card sx={{ mt: 2, backgroundColor: '#e3f2fd' }}>
                <CardContent>
                  <Typography variant="subtitle1">
                    Selected: "{selectedText.text}"
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Position: {selectedText.start} - {selectedText.end}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Paper>
        </Grid>

        {/* Annotation Controls */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Annotation Controls
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Classification Type</InputLabel>
              <Select
                value={selectedClassification}
                onChange={(e) => setSelectedClassification(e.target.value as PIIClassification)}
                label="Classification Type"
              >
                {Object.values(PIIClassification).map((classification) => (
                  <MenuItem key={classification} value={classification}>
                    <Chip
                      label={classification.toUpperCase()}
                      size="small"
                      style={{
                        backgroundColor: classificationColors[classification],
                        color: 'white',
                        marginRight: 8,
                      }}
                    />
                    {classification.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography gutterBottom>Confidence: {confidence}</Typography>
            <Slider
              value={confidence}
              onChange={(_, value) => setConfidence(value as number)}
              min={0}
              max={1}
              step={0.1}
              marks
              valueLabelDisplay="auto"
            />

            <TextField
              fullWidth
              label="Notes (optional)"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              margin="normal"
            />

            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={addEntity}
                disabled={!selectedText}
                size="small"
              >
                Add Classification
              </Button>
              
              <Tooltip title="Undo (Ctrl+Z)">
                <span>
                  <IconButton
                    onClick={undo}
                    disabled={undoStack.length === 0}
                    size="small"
                  >
                    <Undo />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Redo (Ctrl+Y)">
                <span>
                  <IconButton
                    onClick={redo}
                    disabled={redoStack.length === 0}
                    size="small"
                  >
                    <Redo />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Help & Shortcuts">
                <IconButton
                  onClick={() => setShowGuidelines(true)}
                  size="small"
                >
                  <Help />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Classification List */}
            <Typography variant="h6" sx={{ mt: 3 }}>
              Classifications ({classifications.length})
            </Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {classifications.map((item) => (
                <Card key={item.id} sx={{ mb: 1, p: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Chip
                        label={item.classification.toUpperCase()}
                        size="small"
                        style={{
                          backgroundColor: classificationColors[item.classification],
                          color: 'white',
                        }}
                      />
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        "{item.text}"
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Confidence: {item.confidence}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => deleteClassification(item.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Navigation */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<NavigateBefore />}
          onClick={onPrevious}
        >
          Previous Sample
        </Button>

        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={() => onSave(classifications)}
        >
          Save Progress
        </Button>

        <Button
          variant="outlined"
          endIcon={<NavigateNext />}
          onClick={onNext}
        >
          Next Sample
        </Button>
      </Box>

      {/* Help Dialog */}
      <Dialog open={showGuidelines} onClose={() => setShowGuidelines(false)} maxWidth="md">
        <DialogTitle>Annotation Guidelines & Shortcuts</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Keyboard Shortcuts
          </Typography>
          <Box sx={{ mb: 2 }}>
            {keyboardShortcuts.map((shortcut) => (
              <Typography key={shortcut.key} variant="body2">
                <strong>{shortcut.key}</strong> - {shortcut.classification.replace('_', ' ')}
              </Typography>
            ))}
            <Typography variant="body2">
              <strong>Ctrl+S</strong> - Save progress
            </Typography>
            <Typography variant="body2">
              <strong>Ctrl+Z</strong> - Undo
            </Typography>
            <Typography variant="body2">
              <strong>Ctrl+Y</strong> - Redo
            </Typography>
          </Box>

          <Typography variant="h6" gutterBottom>
            Annotation Guidelines
          </Typography>
          <Typography variant="body2" paragraph>
            1. Select complete entities only (don't split names or addresses)
          </Typography>
          <Typography variant="body2" paragraph>
            2. Include titles and honorifics with names
          </Typography>
          <Typography variant="body2" paragraph>
            3. Mark uncertain cases with lower confidence scores
          </Typography>
          <Typography variant="body2" paragraph>
            4. Consider context when determining if information is identifying
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGuidelines(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Quick Save */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => onSave(classifications)}
      >
        <Save />
      </Fab>
    </Box>
  );
};

export default LabelingInterface;