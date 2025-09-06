// Service for integrating with the labeling system
export interface LabelingData {
  text: string;
  segments: Array<{
    text: string;
    start: number;
    end: number;
    classification: 'pii' | 'non_pii';
    confidence: number;
  }>;
}

export interface TrainingDataPayload {
  text: string;
  classification: 'pii' | 'non_pii';
}

class LabelingService {
  private readonly labelingBaseUrl = 'http://localhost:8002'; // Deep Search Labeling system
  private readonly deepSearchBaseUrl = 'http://localhost:8000'; // Deep Search Engine

  /**
   * Open the labeling system with pre-populated data from search results
   */
  async openLabelingSystem(data: LabelingData): Promise<void> {
    try {
      // Check if labeling service is available
      const isAvailable = await this.checkLabelingServiceAvailability();
      if (!isAvailable) {
        throw new Error('Labeling service is not available. Please start the labeling backend on port 8002.');
      }

      // Create a new project or add to existing project in labeling system
      const projectData = {
        name: `PII Classification - ${new Date().toISOString()}`,
        description: 'Binary PII/Non-PII classification project',
        classificationTypes: ['pii', 'non_pii'],
        guidelines: 'Classify text segments as either PII (personally identifiable information) or Non-PII.',
        qualityThreshold: 0.8,
        multiAnnotator: false
      };

      // Create project
      const projectResponse = await fetch(`${this.labelingBaseUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData)
      });

      if (!projectResponse.ok) {
        const errorText = await projectResponse.text();
        console.error('Project creation failed:', errorText);
        throw new Error(`Failed to create labeling project: ${projectResponse.status} ${errorText}`);
      }

      const project = await projectResponse.json();
      const projectId = project.data?.id || project.id;

      // Add text sample to project
      const sampleData = {
        text: data.text,
        language: 'english',
        filename: `search-result-${Date.now()}.txt`
      };

      const sampleResponse = await fetch(`${this.labelingBaseUrl}/api/projects/${projectId}/samples`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleData)
      });

      if (!sampleResponse.ok) {
        const errorText = await sampleResponse.text();
        console.error('Sample creation failed:', errorText);
        throw new Error(`Failed to add sample to project: ${sampleResponse.status} ${errorText}`);
      }

      const sample = await sampleResponse.json();
      const sampleId = sample.data?.id || sample.id;

      // Pre-populate with existing classifications if any
      if (data.segments && data.segments.length > 0) {
        for (const segment of data.segments) {
          const classificationData = {
            start: segment.start,
            end: segment.end,
            text: segment.text,
            classification: segment.classification,
            confidence: segment.confidence,
            notes: 'Auto-generated from Deep Search results'
          };

          const classResponse = await fetch(`${this.labelingBaseUrl}/api/samples/${sampleId}/entities`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(classificationData)
          });
          
          if (!classResponse.ok) {
            console.warn(`Failed to add classification for segment: ${segment.text}`);
          }
        }
      }

      // Open labeling system in new window/tab
      const labelingUrl = `${this.labelingBaseUrl}/projects/${projectId}/samples/${sampleId}`;
      window.open(labelingUrl, '_blank', 'width=1400,height=900');

    } catch (error) {
      console.error('Failed to open labeling system:', error);
      throw error;
    }
  }

  /**
   * Submit training data to the Deep Search Engine
   */
  async submitTrainingData(trainingData: TrainingDataPayload[]): Promise<void> {
    try {
      const response = await fetch(`${this.deepSearchBaseUrl}/training/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainingData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit training data');
      }

      const result = await response.json();
      console.log('Training data submitted successfully:', result);

    } catch (error) {
      console.error('Failed to submit training data:', error);
      throw error;
    }
  }

  /**
   * Get training status from the Deep Search Engine
   */
  async getTrainingStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.deepSearchBaseUrl}/training/status`);
      
      if (!response.ok) {
        throw new Error('Failed to get training status');
      }

      const result = await response.json();
      return result.data;

    } catch (error) {
      console.error('Failed to get training status:', error);
      throw error;
    }
  }

  /**
   * Deploy a trained model to replace the current engine
   */
  async deployTrainedModel(modelVersion: string): Promise<void> {
    try {
      const response = await fetch(`${this.deepSearchBaseUrl}/model/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          model_version: modelVersion,
          replace_current: true 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to deploy trained model');
      }

      const result = await response.json();
      console.log('Model deployed successfully:', result);

    } catch (error) {
      console.error('Failed to deploy model:', error);
      throw error;
    }
  }

  /**
   * Get available trained models
   */
  async getAvailableModels(): Promise<any[]> {
    try {
      const response = await fetch(`${this.deepSearchBaseUrl}/models`);
      
      if (!response.ok) {
        throw new Error('Failed to get available models');
      }

      const result = await response.json();
      return result.data || [];

    } catch (error) {
      console.error('Failed to get available models:', error);
      throw error;
    }
  }

  /**
   * Create a backup of the current model before replacement
   */
  async backupCurrentModel(): Promise<string> {
    try {
      const response = await fetch(`${this.deepSearchBaseUrl}/model/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to backup current model');
      }

      const result = await response.json();
      return result.data.backup_id;

    } catch (error) {
      console.error('Failed to backup model:', error);
      throw error;
    }
  }

  /**
   * Rollback to a previous model version
   */
  async rollbackModel(backupId: string): Promise<void> {
    try {
      const response = await fetch(`${this.deepSearchBaseUrl}/model/rollback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backup_id: backupId })
      });

      if (!response.ok) {
        throw new Error('Failed to rollback model');
      }

      const result = await response.json();
      console.log('Model rollback successful:', result);

    } catch (error) {
      console.error('Failed to rollback model:', error);
      throw error;
    }
  }

  /**
   * Set engine mode (simple or advanced)
   */
  async setEngineMode(useSimple: boolean): Promise<void> {
    try {
      const response = await fetch(`${this.deepSearchBaseUrl}/engine/mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ use_simple: useSimple })
      });

      if (!response.ok) {
        throw new Error('Failed to set engine mode');
      }

      const result = await response.json();
      console.log('Engine mode updated:', result);

    } catch (error) {
      console.error('Failed to set engine mode:', error);
      throw error;
    }
  }

  /**
   * Listen for labeling completion and automatically submit training data
   * Only runs when labeling service is available
   */
  setupPeriodicTrainingSync(): void {
    // Check if labeling service is available before setting up sync
    this.checkLabelingServiceAvailability().then(isAvailable => {
      if (!isAvailable) {
        console.log('Labeling service not available, skipping periodic training sync');
        return;
      }

      // Set up periodic check for new labeled data
      const checkInterval = 5 * 60 * 1000; // 5 minutes

      setInterval(async () => {
        try {
          // Check for completed labeling projects
          const response = await fetch(`${this.labelingBaseUrl}/api/projects?status=completed`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (response.ok) {
            const projects = await response.json();
            
            for (const project of projects.data || []) {
              await this.processCompletedProject(project.id);
            }
          }
        } catch (error) {
          // Silently handle connection errors to avoid spamming console
          console.debug('Labeling service not available for periodic sync');
        }
      }, checkInterval);
    });
  }

  /**
   * Check if labeling service is available
   */
  private async checkLabelingServiceAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.labelingBaseUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Manually process all completed projects
   */
  async processCompletedProjects(): Promise<void> {
    try {
      // Check if labeling service is available
      const isAvailable = await this.checkLabelingServiceAvailability();
      if (!isAvailable) {
        throw new Error('Labeling service is not available. Please start the labeling backend on port 8002.');
      }

      const response = await fetch(`${this.labelingBaseUrl}/api/projects?status=completed`);
      
      if (response.ok) {
        const projects = await response.json();
        
        for (const project of projects.data || []) {
          await this.processCompletedProject(project.id);
        }
        
        console.log(`Processed ${projects.data?.length || 0} completed projects`);
      }
    } catch (error) {
      console.error('Error processing completed projects:', error);
      throw error;
    }
  }

  /**
   * Process a completed labeling project and extract training data
   */
  private async processCompletedProject(projectId: string): Promise<void> {
    try {
      // Get all samples from the project
      const samplesResponse = await fetch(`${this.labelingBaseUrl}/api/projects/${projectId}/samples`);
      
      if (!samplesResponse.ok) return;

      const samples = await samplesResponse.json();
      const trainingData: TrainingDataPayload[] = [];

      for (const sample of samples.data || []) {
        // Get classifications for each sample
        const classificationsResponse = await fetch(`${this.labelingBaseUrl}/api/samples/${sample.id}/classifications`);
        
        if (classificationsResponse.ok) {
          const classifications = await classificationsResponse.json();
          
          for (const classification of classifications.data || []) {
            trainingData.push({
              text: classification.text,
              classification: classification.classification
            });
          }
        }
      }

      if (trainingData.length > 0) {
        await this.submitTrainingData(trainingData);
        
        // Mark project as processed
        await fetch(`${this.labelingBaseUrl}/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'archived' })
        });
      }

    } catch (error) {
      console.error('Error processing completed project:', error);
    }
  }
}

export const labelingService = new LabelingService();

// Auto-start periodic training sync
labelingService.setupPeriodicTrainingSync();