import React from 'react';
import { VoiceRecognitionState } from '../hooks/useVoiceRecognition';
import { MicrophonePermissionPrompt } from './MicrophonePermissionPrompt';

interface AudioRecorderControlsProps {
  state: VoiceRecognitionState;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => Promise<void>;
  audioLevel: number;
  recordingDuration: number;
  isSupported: boolean;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  permissionState: string;
  error: string | null;
  browserInfo: {
    name: string;
    isMobile: boolean;
    requiresHTTPS: boolean;
    supportsPermissionAPI: boolean;
    isIOS: boolean;
    iosVersion: number | null;
  };
  className?: string;
}

export function AudioRecorderControls({
  state,
  onStartRecording,
  onStopRecording,
  audioLevel,
  recordingDuration,
  isSupported,
  hasPermission,
  requestPermission,
  permissionState,
  error,
  browserInfo,
  className = "",
}: AudioRecorderControlsProps) {
  // Show permission prompt if not supported or permission not granted
  if (!isSupported || !hasPermission) {
    return (
      <MicrophonePermissionPrompt
        permissionState={permissionState as any}
        error={error}
        onRequestPermission={requestPermission}
        browserInfo={browserInfo}
        className={className}
      />
    );
  }

  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';
  const isDisabled = isProcessing;

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = (): string => {
    switch (state) {
      case 'recording':
        return 'Recording...';
      case 'processing':
        return 'Processing...';
      case 'error':
        return 'Error occurred';
      case 'completed':
        return 'Completed';
      default:
        return 'Ready to record';
    }
  };

  const getStatusColor = (): string => {
    switch (state) {
      case 'recording':
        return 'text-red-600 dark:text-red-400';
      case 'processing':
        return 'text-blue-600 dark:text-blue-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main recording button */}
      <div className="flex justify-center">
        <button
          onClick={async () => {
            if (isRecording) {
              await onStopRecording();
            } else {
              await onStartRecording();
            }
          }}
          disabled={isDisabled}
          className={`
            relative flex items-center justify-center w-20 h-20 rounded-full font-medium transition-all duration-200 transform
            ${isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse scale-110' 
              : 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105'
            }
            ${isDisabled ? 'opacity-50 cursor-not-allowed scale-100' : ''}
            ${!isDisabled ? 'shadow-lg hover:shadow-xl' : ''}
          `}
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isRecording ? (
            <StopIcon className="w-8 h-8" />
          ) : (
            <MicrophoneIcon className="w-8 h-8" />
          )}
          
          {/* Audio level indicator ring */}
          {isRecording && (
            <div 
              className="absolute inset-0 rounded-full border-4 border-white border-opacity-30"
              style={{
                transform: `scale(${1 + audioLevel * 0.3})`,
                transition: 'transform 0.1s ease-out',
              }}
            />
          )}
        </button>
      </div>

      {/* Status and duration */}
      <div className="text-center space-y-2">
        <p className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </p>
        
        {isRecording && (
          <div className="space-y-2">
            <p className="text-lg font-mono text-gray-900 dark:text-white">
              {formatDuration(recordingDuration)}
            </p>
            
            {/* Audio level bar */}
            <div className="flex justify-center">
              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-100 ease-out"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Transcribing your audio with AI...
          </p>
        )}
      </div>

      {/* Helpful tips */}
      {state === 'idle' && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Tap the microphone to start recording</p>
          <p>Speak clearly for best results</p>
        </div>
      )}
    </div>
  );
}

// Icon components
function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
} 