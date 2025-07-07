import { useState, useCallback, useEffect } from "react";
import { useAudioRecorder } from "./useAudioRecorder";
import { useAITranscription } from "./useAITranscription";

export type VoiceRecognitionState =
  | "idle"
  | "recording"
  | "processing"
  | "completed"
  | "error";

interface VoiceRecognitionHook {
  // Main state
  state: VoiceRecognitionState;
  transcript: string;
  isRecording: boolean;
  isProcessing: boolean;

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearTranscript: () => void;

  // Audio monitoring
  audioLevel: number;
  recordingDuration: number;

  // Status and errors
  error: string | null;
  isSupported: boolean;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  permissionState: string;
  browserInfo: {
    name: string;
    isMobile: boolean;
    requiresHTTPS: boolean;
    supportsPermissionAPI: boolean;
    isIOS: boolean;
    iosVersion: number | null;
  };

  // Additional info
  confidence: number | null;
  transcriptionDuration?: number;
}

export function useVoiceRecognition(): VoiceRecognitionHook {
  const [state, setState] = useState<VoiceRecognitionState>("idle");

  // Use audio recording hook
  const {
    recordingState,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    audioLevel,
    recordingDuration,
    error: recordingError,
    isSupported,
    hasPermission,
    requestPermission,
    permissionState,
    browserInfo,
  } = useAudioRecorder();

  // Use AI transcription hook
  const {
    transcriptionState,
    transcript,
    confidence,
    transcribeAudio,
    clearTranscript: clearAITranscript,
    error: transcriptionError,
  } = useAITranscription();

  // Combine errors
  const error = recordingError || transcriptionError;

  // Derived states
  const isRecording = recordingState === "recording";
  const isProcessing = transcriptionState === "transcribing";

  // Update main state based on sub-states
  useEffect(() => {
    if (recordingError || transcriptionError) {
      setState("error");
    } else if (recordingState === "recording") {
      setState("recording");
    } else if (
      transcriptionState === "transcribing" ||
      recordingState === "stopping"
    ) {
      setState("processing");
    } else if (transcriptionState === "completed" && transcript) {
      setState("completed");
    } else {
      setState("idle");
    }
  }, [
    recordingState,
    transcriptionState,
    recordingError,
    transcriptionError,
    transcript,
  ]);

  const startRecording = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      console.error("❌ Voice recognition not supported");
      return;
    }

    if (state !== "idle") {
      console.log("⚠️ Voice recognition not in idle state:", state);
      return;
    }

    console.log("🎤 Starting voice recognition...");

    // Clear any previous transcript
    clearAITranscript();

    // Start audio recording
    await startAudioRecording();
  }, [isSupported, state, clearAITranscript, startAudioRecording]);

  const stopRecording = useCallback(async (): Promise<void> => {
    if (!isRecording) {
      console.log("⚠️ Not currently recording");
      return;
    }

    console.log("🛑 Stopping voice recognition...");

    try {
      // Stop audio recording and get the audio blob
      const audioBlob = await stopAudioRecording();

      if (!audioBlob) {
        console.error("❌ No audio data received");
        setState("error");
        return;
      }

      console.log("🤖 Starting transcription...");

      // Transcribe the audio
      const transcribedText = await transcribeAudio(audioBlob);

      if (transcribedText) {
        console.log("✅ Voice recognition completed:", transcribedText);
      } else {
        console.error("❌ Transcription failed");
      }
    } catch (error) {
      console.error("❌ Error during voice recognition:", error);
      setState("error");
    }
  }, [isRecording, stopAudioRecording, transcribeAudio]);

  const clearTranscript = useCallback(() => {
    console.log("🧹 Clearing voice recognition");
    clearAITranscript();
    setState("idle");
  }, [clearAITranscript]);

  return {
    // Main state
    state,
    transcript,
    isRecording,
    isProcessing,

    // Actions
    startRecording,
    stopRecording,
    clearTranscript,

    // Audio monitoring
    audioLevel,
    recordingDuration,

    // Status and errors
    error,
    isSupported,
    hasPermission,
    requestPermission,
    permissionState,
    browserInfo,

    // Additional info
    confidence,
  };
}
