import React from 'react';
import { SearchStage, StageProgress } from '../types';

interface ProgressIndicatorProps {
  stages: StageProgress[];
  currentStage: SearchStage;
}

const stageInfo = {
  1: {
    name: 'Basic Search',
    description: 'Rule-based pattern matching',
    icon: '🔍'
  },
  2: {
    name: 'Deep Search',
    description: 'Binary ML Classification (PII/non-PII)',
    icon: '🧠'
  },
  3: {
    name: 'Context Search',
    description: 'llama3.2:1b',
    icon: '🎯'
  }
};

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ stages, currentStage }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Detection Progress</h3>
        <div className="text-sm text-gray-600">
          Stage {currentStage} of 3
        </div>
      </div>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200">
          <div 
            className="h-full bg-primary-500 transition-all duration-500 ease-in-out"
            style={{ 
              width: `${((currentStage - 1) / (stages.length - 1)) * 100}%` 
            }}
          />
        </div>

        {/* Stage Indicators */}
        <div className="flex justify-between">
          {stages.map((stage) => {
            const info = stageInfo[stage.stage];
            return (
              <div
                key={stage.stage}
                className={`
                  flex flex-col items-center relative z-10 transition-all duration-300
                  ${stage.isEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}
                `}
              >
                {/* Circle */}
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-300
                    ${stage.isCompleted 
                      ? 'bg-primary-500 border-primary-500 text-white' 
                      : stage.isActive 
                        ? 'bg-primary-100 border-primary-500 text-primary-700' 
                        : stage.isEnabled
                          ? 'bg-white border-gray-300 text-gray-600 hover:border-primary-300'
                          : 'bg-gray-100 border-gray-200 text-gray-400'
                    }
                  `}
                >
                  {stage.isCompleted ? (
                    <span>✓</span>
                  ) : stage.isActive ? (
                    <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{info.icon}</span>
                  )}
                </div>

                {/* Label */}
                <div className="mt-3 text-center max-w-24">
                  <div
                    className={`
                      text-sm font-medium
                      ${stage.isCompleted || stage.isActive 
                        ? 'text-primary-700' 
                        : stage.isEnabled 
                          ? 'text-gray-700' 
                          : 'text-gray-400'
                      }
                    `}
                  >
                    {info.name}
                  </div>
                  <div
                    className={`
                      text-xs mt-1
                      ${stage.isEnabled ? 'text-gray-600' : 'text-gray-400'}
                    `}
                  >
                    {info.description}
                  </div>
                </div>

                {/* Status Badge */}
                {stage.isCompleted && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-4 h-4 bg-success rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Stage Description */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{stageInfo[currentStage].icon}</span>
          <div>
            <div className="text-sm font-medium text-gray-800">
              Currently running: {stageInfo[currentStage].name}
            </div>
            <div className="text-xs text-gray-600">
              {stageInfo[currentStage].description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;