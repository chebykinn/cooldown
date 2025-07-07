import { useState } from "react";
import { CartesiaTTSState, CartesiaVoice, CartesiaTTSConfig } from "../hooks/useCartesiaTTS";

interface CartesiaVoiceControlsProps {
  state: CartesiaTTSState;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: CartesiaVoice[];
  selectedVoice: CartesiaVoice | null;
  config: CartesiaTTSConfig;
  error: string | null;
  currentText: string | null;
  audioProgress: number;
  volume: number;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onVoiceChange: (voice: CartesiaVoice | null) => void;
  onConfigChange: (config: Partial<CartesiaTTSConfig>) => void;
  onVolumeChange: (volume: number) => void;
  className?: string;
}

// Icon components
const SpeakerIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M9 9v6l4 2V7l-4 2H5a1 1 0 00-1 1v2a1 1 0 001 1h4z" />
  </svg>
);

const StopIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
  </svg>
);

const PauseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V17M9 10v4a1 1 0 001 1h4M9 10V9a1 1 0 011-1h4a1 1 0 011 1v1" />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export function CartesiaVoiceControls({
  state,
  isSpeaking,
  isPaused,
  isSupported,
  voices,
  selectedVoice,
  config,
  error,
  currentText,
  audioProgress,
  volume,
  onStop,
  onPause,
  onResume,
  onVoiceChange,
  onConfigChange,
  onVolumeChange,
  className = "",
}: CartesiaVoiceControlsProps) {
  const [showSettings, setShowSettings] = useState(false);

  if (!isSupported) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-700 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-red-700 dark:text-red-300 font-medium">
            Voice synthesis not supported
          </span>
        </div>
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
          Your browser doesn't support the required audio features for Cartesia TTS.
        </p>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (state) {
      case "synthesizing":
        return "text-blue-600 dark:text-blue-400";
      case "speaking":
        return "text-green-600 dark:text-green-400";
      case "paused":
        return "text-yellow-600 dark:text-yellow-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusText = () => {
    switch (state) {
      case "synthesizing":
        return "Generating speech...";
      case "speaking":
        return "Speaking";
      case "paused":
        return "Paused";
      case "error":
        return "Error";
      default:
        return "Ready";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-700">
          <p className="text-red-700 dark:text-red-300 text-sm font-medium">
            Voice Synthesis Error
          </p>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            state === "speaking" || state === "synthesizing" ? "bg-green-500 animate-pulse" : 
            state === "paused" ? "bg-yellow-500" :
            state === "error" ? "bg-red-500" : "bg-gray-400"
          }`}></div>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {isSpeaking && (
            <>
              <button
                onClick={onPause}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                title="Pause speaking"
              >
                <PauseIcon className="w-4 h-4" />
                Pause
              </button>
              <button
                onClick={onStop}
                className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                title="Stop speaking"
              >
                <StopIcon className="w-4 h-4" />
                Stop
              </button>
            </>
          )}

          {isPaused && (
            <>
              <button
                onClick={onResume}
                className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                title="Resume speaking"
              >
                <PlayIcon className="w-4 h-4" />
                Resume
              </button>
              <button
                onClick={onStop}
                className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                title="Stop speaking"
              >
                <StopIcon className="w-4 h-4" />
                Stop
              </button>
            </>
          )}

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings 
                ? "bg-blue-500 text-white" 
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
            title="Voice settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {(isSpeaking || isPaused) && currentText && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Playing: "{currentText.substring(0, 50)}{currentText.length > 50 ? '...' : ''}"</span>
            <span>{Math.round(audioProgress * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${audioProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Voice Settings</h3>
          
          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Voice
            </label>
            <select
              value={selectedVoice?.id || ""}
              onChange={(e) => {
                const voice = voices.find(v => v.id === e.target.value) || null;
                onVoiceChange(voice);
              }}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} ({voice.gender}, {voice.language})
                </option>
              ))}
            </select>
            {selectedVoice?.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {selectedVoice.description}
              </p>
            )}
          </div>

          {/* Speed Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Speed: {config.speed}
            </label>
            <select
              value={config.speed || "normal"}
              onChange={(e) => onConfigChange({ speed: e.target.value as any })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="slowest">Slowest</option>
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
              <option value="fastest">Fastest</option>
            </select>
          </div>

          {/* Volume Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Volume: {Math.round(volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Emotion Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Emotion
            </label>
            <select
              value={config.emotion?.[0] || "positivity"}
              onChange={(e) => onConfigChange({ emotion: [e.target.value as any] })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="positivity">Positive</option>
              <option value="curiosity">Curious</option>
              <option value="surprise">Surprised</option>
              <option value="sadness">Sad</option>
              <option value="anger">Angry</option>
            </select>
          </div>

          {/* Audio Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Audio Quality
            </label>
            <select
              value={config.outputFormat?.sampleRate || 24000}
                             onChange={(e) => onConfigChange({ 
                 outputFormat: { 
                   container: "raw",
                   encoding: "pcm_s16le",
                   ...config.outputFormat,
                   sampleRate: parseInt(e.target.value)
                 }
               })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={16000}>Low (16kHz)</option>
              <option value={24000}>Standard (24kHz)</option>
              <option value={44100}>High (44.1kHz)</option>
            </select>
          </div>
        </div>
      )}

      {/* Info */}
      {state === "idle" && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Powered by Cartesia.ai • Ultra-realistic AI voices</p>
        </div>
      )}
    </div>
  );
} 