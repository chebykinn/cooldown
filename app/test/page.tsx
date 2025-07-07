'use client';

import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useAITranscription } from '../hooks/useAITranscription';
import { useMicrophonePermission } from '../hooks/useMicrophonePermission';
import { MicrophonePermissionPrompt } from '../components/MicrophonePermissionPrompt';
import { AudioRecorderControls } from '../components/AudioRecorderControls';

export default function TestPage() {
  const {
    state: voiceState,
    transcript,
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    clearTranscript,
    audioLevel,
    recordingDuration,
    error,
    isSupported,
    hasPermission,
    requestPermission,
    permissionState,
    browserInfo,
    confidence,
  } = useVoiceRecognition();

  // Separate hooks for testing individual components
  const audioRecorder = useAudioRecorder();
  const aiTranscription = useAITranscription();
  const micPermission = useMicrophonePermission();

  const handleTest = () => {
    console.log("=== COMPREHENSIVE AUDIO RECORDING & AI TRANSCRIPTION TEST ===");
    console.log("Browser:", navigator.userAgent);
    console.log("Is HTTPS:", window.location.protocol === 'https:');
    console.log("Is localhost:", window.location.hostname === 'localhost');
    console.log("Is secure context:", window.isSecureContext);
    console.log("MediaRecorder available:", !!(window.MediaRecorder));
    console.log("MediaRecorder.isTypeSupported available:", typeof MediaRecorder?.isTypeSupported === 'function');
    console.log("MediaDevices available:", !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
    console.log("Permissions API available:", 'permissions' in navigator);
    
    // Enhanced browser info
    console.log("Detected browser:", browserInfo.name);
    console.log("Is mobile:", browserInfo.isMobile);
    console.log("Is iOS:", browserInfo.isIOS);
    console.log("iOS version:", browserInfo.iosVersion);
    console.log("Requires HTTPS:", browserInfo.requiresHTTPS);
    console.log("Supports Permission API:", browserInfo.supportsPermissionAPI);
    
    // Voice Recognition states
    console.log("Voice recognition state:", voiceState);
    console.log("Voice recognition supported:", isSupported);
    console.log("Has microphone permission:", hasPermission);
    console.log("Permission state:", permissionState);
    
    // Individual component states
    console.log("Audio recorder state:", audioRecorder.recordingState);
    console.log("Audio recorder supported:", audioRecorder.isSupported);
    console.log("AI transcription state:", aiTranscription.transcriptionState);
    console.log("Microphone permission state:", micPermission.permissionState);
    console.log("Microphone permission supported:", micPermission.isSupported);
    
    // Test microphone access directly
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          console.log("✅ Direct microphone access granted");
          stream.getTracks().forEach(track => track.stop());
        })
        .catch((error) => {
          console.error("❌ Direct microphone access denied:", error);
        });
    } else {
      console.log("❌ getUserMedia not supported");
    }

    // Test MediaRecorder API
    if (window.MediaRecorder) {
      console.log("✅ MediaRecorder API available");
      
      // Test supported formats
      const formats = [
        'audio/webm;codecs=opus',
        'audio/mp4;codecs=mp4a.40.2',
        'audio/webm',
        'audio/mp4',
        'audio/wav',
      ];
      
      formats.forEach(format => {
        const supported = MediaRecorder.isTypeSupported ? MediaRecorder.isTypeSupported(format) : false;
        console.log(`${supported ? '✅' : '❌'} ${format}: ${supported}`);
      });
    } else {
      console.log("❌ MediaRecorder API not available");
    }
  };

  const handleiPhoneDebug = () => {
    console.log("=== 📱 IPHONE MICROPHONE DEBUG ===");
    console.log("🔍 User Agent:", navigator.userAgent);
    console.log("🌐 Location:", window.location.href);
    console.log("🔒 Protocol:", window.location.protocol);
    console.log("🔐 Secure Context:", window.isSecureContext);
    
    // Browser detection
    console.log("📱 Detected browser:", micPermission.browserInfo.name);
    console.log("📱 Is iOS:", micPermission.browserInfo.isIOS);
    console.log("📱 iOS Version:", micPermission.browserInfo.iosVersion);
    console.log("📱 Is Mobile:", micPermission.browserInfo.isMobile);
    console.log("📱 Requires HTTPS:", micPermission.browserInfo.requiresHTTPS);
    
    // API Availability
    console.log("🎤 navigator.mediaDevices:", !!navigator.mediaDevices);
    console.log("🎤 getUserMedia:", !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
    console.log("🎵 MediaRecorder:", !!window.MediaRecorder);
    console.log("🎵 MediaRecorder.isTypeSupported:", typeof MediaRecorder?.isTypeSupported);
    console.log("🔐 Permissions API:", 'permissions' in navigator);
    
    // Hook states
    console.log("🎯 Microphone Permission State:", micPermission.permissionState);
    console.log("🎯 Microphone Permission Supported:", micPermission.isSupported);
    console.log("🎯 Audio Recorder Supported:", audioRecorder.isSupported);
    console.log("🎯 Voice Recognition Supported:", isSupported);
    console.log("🎯 Has Permission:", hasPermission);
    
    // Errors
    if (micPermission.error) console.log("❌ Microphone Error:", micPermission.error);
    if (audioRecorder.error) console.log("❌ Audio Recorder Error:", audioRecorder.error);
    if (error) console.log("❌ Voice Recognition Error:", error);
    
    console.log("=== END IPHONE DEBUG ===");
  };

  const handlePermissionTest = async () => {
    console.log("=== TESTING PERMISSION REQUEST ===");
    const result = await requestPermission();
    console.log("Permission request result:", result);
  };

  const handleRecordingTest = async () => {
    console.log("=== TESTING AUDIO RECORDING ===");
    if (audioRecorder.recordingState === 'idle') {
      await audioRecorder.startRecording();
    } else if (audioRecorder.recordingState === 'recording') {
      const audioBlob = await audioRecorder.stopRecording();
      console.log("Recording result:", audioBlob);
    }
  };

  const handleTranscriptionTest = async () => {
    console.log("=== TESTING AI TRANSCRIPTION ===");
    
    // For demo purposes, create a small test audio blob
    // In real usage, this would come from the audio recorder
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      const result = await response.json();
      console.log("Transcription API test result:", result);
    } catch (error) {
      console.error("Transcription API test error:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Audio Recording & AI Transcription Test
      </h1>
      
      {/* Voice Recognition Demo */}
      <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Voice Recognition Demo</h2>
        
        <div className="mb-6">
          <AudioRecorderControls
            state={voiceState}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            audioLevel={audioLevel}
            recordingDuration={recordingDuration}
            isSupported={isSupported}
            hasPermission={hasPermission}
            requestPermission={requestPermission}
            permissionState={permissionState}
            error={error}
            browserInfo={audioRecorder.browserInfo}
          />
        </div>

        <div className="mb-4 p-4 bg-white dark:bg-gray-700 rounded border min-h-[100px]">
          <h3 className="font-semibold mb-2">Transcript:</h3>
          {transcript ? (
            <div>
              <p className="text-gray-900 dark:text-white">{transcript}</p>
              {confidence !== null && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                  Confidence: {Math.round(confidence * 100)}%
                </p>
              )}
            </div>
          ) : (
            <span className="text-gray-500">No transcript yet...</span>
          )}
        </div>

        <button
          onClick={clearTranscript}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Clear Transcript
        </button>
      </div>

      {/* Status Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">System Status</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Voice Recognition Status */}
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Voice Recognition</h3>
            <div className="space-y-2 text-sm">
              <p>State: <span className="font-mono text-blue-600">{voiceState}</span></p>
              <p>Supported: <span className={isSupported ? 'text-green-600' : 'text-red-600'}>{isSupported ? 'Yes' : 'No'}</span></p>
              <p>Recording: <span className={isRecording ? 'text-green-600' : 'text-gray-600'}>{isRecording ? 'Yes' : 'No'}</span></p>
              <p>Processing: <span className={isProcessing ? 'text-blue-600' : 'text-gray-600'}>{isProcessing ? 'Yes' : 'No'}</span></p>
              {error && <p className="text-red-600">Error: {error}</p>}
            </div>
          </div>

          {/* Audio Recorder Status */}
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Audio Recorder</h3>
            <div className="space-y-2 text-sm">
              <p>State: <span className="font-mono text-blue-600">{audioRecorder.recordingState}</span></p>
              <p>Supported: <span className={audioRecorder.isSupported ? 'text-green-600' : 'text-red-600'}>{audioRecorder.isSupported ? 'Yes' : 'No'}</span></p>
              <p>Duration: <span className="font-mono">{audioRecorder.recordingDuration}s</span></p>
              <p>Audio Level: <span className="font-mono">{Math.round(audioRecorder.audioLevel * 100)}%</span></p>
              {audioRecorder.error && <p className="text-red-600">Error: {audioRecorder.error}</p>}
            </div>
          </div>

          {/* AI Transcription Status */}
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">AI Transcription</h3>
            <div className="space-y-2 text-sm">
              <p>State: <span className="font-mono text-blue-600">{aiTranscription.transcriptionState}</span></p>
              <p>Has Transcript: <span className={aiTranscription.transcript ? 'text-green-600' : 'text-gray-600'}>{aiTranscription.transcript ? 'Yes' : 'No'}</span></p>
              <p>Confidence: <span className="font-mono">{aiTranscription.confidence ? Math.round(aiTranscription.confidence * 100) + '%' : 'N/A'}</span></p>
              {aiTranscription.error && <p className="text-red-600">Error: {aiTranscription.error}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Browser & Permission Info */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Browser & Permissions</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Browser Information</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p>Browser: <span className="font-mono">{browserInfo.name}</span></p>
                <p>Mobile: <span className={browserInfo.isMobile ? 'text-green-600' : 'text-gray-600'}>{browserInfo.isMobile ? 'Yes' : 'No'}</span></p>
              </div>
              <div>
                <p>Requires HTTPS: <span className={browserInfo.requiresHTTPS ? 'text-yellow-600' : 'text-green-600'}>{browserInfo.requiresHTTPS ? 'Yes' : 'No'}</span></p>
                <p>Permission API: <span className={browserInfo.supportsPermissionAPI ? 'text-green-600' : 'text-yellow-600'}>{browserInfo.supportsPermissionAPI ? 'Yes' : 'No'}</span></p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Permission Status</h3>
            <div className="space-y-2 text-sm">
              <p>State: <span className="font-mono text-blue-600">{permissionState}</span></p>
              <p>Has Permission: <span className={hasPermission ? 'text-green-600' : 'text-red-600'}>{hasPermission ? 'Yes' : 'No'}</span></p>
              <p>Protocol: {typeof window !== 'undefined' ? window.location.protocol : 'unknown'}</p>
              <p>Secure Context: <span className={typeof window !== 'undefined' && window.isSecureContext ? 'text-green-600' : 'text-red-600'}>
                {typeof window !== 'undefined' ? (window.isSecureContext ? 'Yes' : 'No') : 'Unknown'}
              </span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Test Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">System Tests</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <button
              onClick={handleTest}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              Full Diagnostics
            </button>
            <button
              onClick={handleiPhoneDebug}
              className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 text-sm"
            >
              📱 iPhone Debug
            </button>
            <button
              onClick={handlePermissionTest}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
            >
              Test Permissions
            </button>
            <button
              onClick={handleRecordingTest}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Test Recording
            </button>
            <button
              onClick={handleTranscriptionTest}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              Test API
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Component Tests</h3>
          <div className="space-y-2">
            <MicrophonePermissionPrompt
              permissionState={micPermission.permissionState}
              error={micPermission.error}
              onRequestPermission={micPermission.requestPermission}
              browserInfo={micPermission.browserInfo}
              className="mb-4"
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Testing Instructions:</h3>
        <ul className="space-y-1 list-disc list-inside">
          <li>Open browser console (F12) to see detailed logs</li>
          <li>Run "Full Diagnostics" to check all system capabilities</li>
          <li>Test audio recording with the voice recognition demo</li>
          <li>Check AI transcription accuracy with clear speech</li>
          <li>Try different browsers and mobile devices</li>
          <li>Test both HTTP and HTTPS environments</li>
          <li>Ensure you have a valid OpenAI API key configured</li>
        </ul>
      </div>
    </div>
  );
} 