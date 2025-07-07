import { useState } from 'react';
import { MicrophonePermissionPrompt } from './MicrophonePermissionPrompt';

interface VoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  onStartListening: () => Promise<void>;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  isSupported: boolean;
  permissionState: string;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  error: string | null;
  browserInfo: {
    name: string;
    isMobile: boolean;
    requiresHTTPS: boolean;
    supportsPermissionAPI: boolean;
    isIOS: boolean;
    iosVersion: number | null;
  };
}

export function VoiceControls({
  isListening,
  isSpeaking,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  isSupported,
  permissionState,
  hasPermission,
  requestPermission,
  error,
  browserInfo,
}: VoiceControlsProps) {
  // Show permission prompt if not supported or permission not granted
  if (!isSupported || !hasPermission) {
    return (
      <MicrophonePermissionPrompt
        permissionState={permissionState as any}
        error={error}
        onRequestPermission={requestPermission}
        browserInfo={browserInfo}
        className="mb-6"
      />
    );
  }

  return (
    <div className="flex gap-4 justify-center items-center">
      <button
        onClick={async () => {
          console.log("Voice button clicked, isListening:", isListening);
          if (isListening) {
            console.log("Stopping listening...");
            onStopListening();
          } else {
            console.log("Starting listening...");
            await onStartListening();
          }
        }}
        className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isListening ? (
          <>
            <StopIcon className="w-5 h-5" />
            Stop Recording
          </>
        ) : (
          <>
            <MicrophoneIcon className="w-5 h-5" />
            Start Recording
          </>
        )}
      </button>
      
      {isSpeaking && (
        <button
          onClick={onStopSpeaking}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors"
        >
          <SpeakerIcon className="w-5 h-5" />
          Stop Speaking
        </button>
      )}
    </div>
  );
}

function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  );
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12H7a1 1 0 01-1-1V9a1 1 0 011-1h2l3.536-2.464A1 1 0 0114 6v12a1 1 0 01-1.464.536L9 16z" />
    </svg>
  );
} 