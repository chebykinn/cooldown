import { useState, useEffect, useRef, useCallback } from "react";
import { useMicrophonePermission } from "./useMicrophonePermission";

export type AudioRecordingState =
  | "idle"
  | "starting"
  | "recording"
  | "stopping"
  | "processing"
  | "error";

interface AudioRecorderHook {
  recordingState: AudioRecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  audioLevel: number;
  recordingDuration: number;
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
}

export function useAudioRecorder(): AudioRecorderHook {
  const [recordingState, setRecordingState] =
    useState<AudioRecordingState>("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use microphone permission hook
  const {
    permissionState,
    requestPermission,
    hasPermission,
    error: permissionError,
    isSupported: microphoneSupported,
    browserInfo,
  } = useMicrophonePermission();

  // Simplified MediaRecorder support check
  const isMediaRecorderSupported =
    typeof window !== "undefined" && typeof MediaRecorder !== "undefined";

  const isSupported = microphoneSupported && isMediaRecorderSupported;

  // Combine errors from permissions and recording
  const combinedError = error || permissionError;

  // Get optimal audio format for current browser
  const getOptimalAudioFormat = useCallback(() => {
    if (!isMediaRecorderSupported) return undefined;

    // Test formats in order of preference
    const formats = [
      "audio/webm;codecs=opus", // Best quality, Chrome/Firefox
      "audio/mp4;codecs=mp4a.40.2", // Safari, iOS
      "audio/webm", // Fallback WebM
      "audio/mp4", // Fallback MP4
      "audio/wav", // Universal fallback
    ];

    // If isTypeSupported is available, use it to test formats
    if (typeof MediaRecorder.isTypeSupported === "function") {
      for (const format of formats) {
        if (MediaRecorder.isTypeSupported(format)) {
          console.log(`🎵 Using audio format: ${format}`);
          return format;
        }
      }
    }

    // If isTypeSupported is not available, just return undefined and let MediaRecorder use default
    console.log("🎵 Using default MediaRecorder format");
    return undefined;
  }, [isMediaRecorderSupported]);

  // Setup audio level monitoring
  const setupAudioMonitoring = useCallback(
    (stream: MediaStream) => {
      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.85;
        microphone.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateAudioLevel = () => {
          if (analyserRef.current && recordingState === "recording") {
            analyserRef.current.getByteFrequencyData(dataArray);

            // Calculate average volume
            const average =
              dataArray.reduce((sum, value) => sum + value, 0) /
              dataArray.length;
            const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1

            setAudioLevel(normalizedLevel);
            animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
          }
        };

        updateAudioLevel();
      } catch (error) {
        console.warn("⚠️ Could not setup audio monitoring:", error);
      }
    },
    [recordingState]
  );

  // Update recording duration
  const updateDuration = useCallback(() => {
    if (startTimeRef.current && recordingState === "recording") {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setRecordingDuration(Math.floor(elapsed));
    }
  }, [recordingState]);

  // Start duration tracking
  useEffect(() => {
    if (recordingState === "recording") {
      startTimeRef.current = Date.now();
      setRecordingDuration(0);
      durationIntervalRef.current = setInterval(updateDuration, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      if (recordingState === "idle") {
        setRecordingDuration(0);
        startTimeRef.current = null;
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [recordingState, updateDuration]);

  const startRecording = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      setError("Audio recording is not supported in your browser.");
      return;
    }

    if (recordingState !== "idle") {
      console.log("⚠️ Already recording or processing");
      return;
    }

    setRecordingState("starting");
    setError(null);
    setAudioLevel(0);

    try {
      // Check and request microphone permissions
      if (!hasPermission) {
        console.log("🔐 Requesting microphone permission...");
        const permissionGranted = await requestPermission();

        if (!permissionGranted) {
          setRecordingState("error");
          return;
        }
      }

      console.log("🎤 Starting audio recording...");

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100, // High quality for better transcription
        },
      });

      streamRef.current = stream;

      // Setup audio level monitoring
      setupAudioMonitoring(stream);

      // Create MediaRecorder
      const mimeType = getOptimalAudioFormat();
      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Setup MediaRecorder event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(`📦 Audio chunk received: ${event.data.size} bytes`);
        }
      };

      mediaRecorder.onstart = () => {
        console.log("🟢 MediaRecorder started");
        setRecordingState("recording");
      };

      mediaRecorder.onerror = (event) => {
        console.error("❌ MediaRecorder error:", event);
        setError("Recording failed. Please try again.");
        setRecordingState("error");
        cleanup();
      };

      mediaRecorder.onstop = () => {
        console.log("🔴 MediaRecorder stopped");
        setRecordingState("stopping");
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
    } catch (error: any) {
      console.error("❌ Error starting recording:", error);

      let errorMessage = "Failed to start recording.";

      switch (error.name) {
        case "NotAllowedError":
          errorMessage =
            "Microphone access denied. Please allow microphone access and try again.";
          break;
        case "NotFoundError":
          errorMessage =
            "No microphone found. Please connect a microphone and try again.";
          break;
        case "NotReadableError":
          errorMessage =
            "Microphone is being used by another application. Please close other applications and try again.";
          break;
        case "OverconstrainedError":
          errorMessage =
            "Microphone constraints could not be satisfied. Please try with a different microphone.";
          break;
        case "SecurityError":
          errorMessage =
            "Recording blocked due to security restrictions. Please check your browser settings.";
          break;
        default:
          errorMessage = `Recording failed: ${
            error.message || "Unknown error"
          }`;
      }

      setError(errorMessage);
      setRecordingState("error");
      cleanup();
    }
  }, [
    isSupported,
    recordingState,
    hasPermission,
    requestPermission,
    setupAudioMonitoring,
    getOptimalAudioFormat,
  ]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || recordingState !== "recording") {
      console.log("⚠️ Not currently recording");
      return null;
    }

    console.log("🛑 Stopping audio recording...");
    setRecordingState("stopping");

    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        console.log("🔴 Recording stopped, processing audio...");

        if (audioChunksRef.current.length === 0) {
          console.warn("⚠️ No audio data recorded");
          setError("No audio data was recorded. Please try again.");
          setRecordingState("error");
          cleanup();
          resolve(null);
          return;
        }

        // Create blob from audio chunks
        const audioBlob = new Blob(audioChunksRef.current, {
          type: audioChunksRef.current[0]?.type || "audio/wav",
        });

        console.log(
          `🎵 Audio blob created: ${audioBlob.size} bytes, type: ${audioBlob.type}`
        );

        setRecordingState("idle");
        cleanup();
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, [recordingState]);

  const cleanup = useCallback(() => {
    // Stop audio level monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear refs
    mediaRecorderRef.current = null;
    analyserRef.current = null;
    audioChunksRef.current = [];

    // Reset audio level
    setAudioLevel(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    recordingState,
    startRecording,
    stopRecording,
    audioLevel,
    recordingDuration,
    error: combinedError,
    isSupported,
    hasPermission,
    requestPermission,
    permissionState,
    browserInfo,
  };
}
