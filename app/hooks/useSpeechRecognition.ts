import { useState, useEffect, useRef, useCallback } from "react";
import { useMicrophonePermission } from "./useMicrophonePermission";
import { useVoiceRecognition } from "./useVoiceRecognition";

interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  isSupported: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  clearTranscript: () => void;
  error: string | null;
  permissionState: string;
  requestPermission: () => Promise<boolean>;
  hasPermission: boolean;
  browserInfo: {
    name: string;
    isMobile: boolean;
    requiresHTTPS: boolean;
    supportsPermissionAPI: boolean;
  };
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  // Use the MediaRecorder-based voice recognition instead of Web Speech API
  const voiceRecognition = useVoiceRecognition();

  // Use microphone permission hook for browser info
  const {
    permissionState,
    requestPermission,
    hasPermission,
    error: permissionError,
    isSupported: microphoneSupported,
    browserInfo,
  } = useMicrophonePermission();

  // Map voice recognition state to speech recognition interface
  const isListening = voiceRecognition.isRecording;
  const isSupported = voiceRecognition.isSupported;
  const transcript = voiceRecognition.transcript;
  const error = voiceRecognition.error || permissionError;

  const startListening = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      console.error("❌ Voice recognition not supported");
      return;
    }

    console.log("🎤 Starting MediaRecorder-based speech recognition...");
    await voiceRecognition.startRecording();
  }, [isSupported, voiceRecognition.startRecording]);

  const stopListening = useCallback(() => {
    if (!isListening) {
      console.log("⚠️ Not currently listening");
      return;
    }

    console.log("🛑 Stopping MediaRecorder-based speech recognition...");
    voiceRecognition.stopRecording();
  }, [isListening, voiceRecognition.stopRecording]);

  const clearTranscript = useCallback(() => {
    console.log("🧹 Clearing transcript");
    voiceRecognition.clearTranscript();
  }, [voiceRecognition.clearTranscript]);

  return {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    clearTranscript,
    error,
    permissionState,
    requestPermission,
    hasPermission,
    browserInfo,
  };
}

// Remove the old Web Speech API type extensions since we no longer use them
// declare global {
//   interface Window {
//     SpeechRecognition: any;
//     webkitSpeechRecognition: any;
//   }
// }
