import { useState, useEffect, useRef, useCallback } from "react";

export type CartesiaTTSState =
  | "idle"
  | "synthesizing"
  | "speaking"
  | "paused"
  | "error";

export interface CartesiaVoice {
  id: string;
  name: string;
  description?: string;
  language: string;
  gender?: "male" | "female" | "neutral";
  age?: "young" | "middle_aged" | "old";
  accent?: string;
}

export interface CartesiaTTSConfig {
  voiceId?: string;
  speed?: number | "slowest" | "slow" | "normal" | "fast" | "fastest";
  emotion?: Array<
    "anger" | "positivity" | "surprise" | "sadness" | "curiosity"
  >;
  volume?: number; // 0-1
  outputFormat?: {
    container: "raw" | "wav" | "mp3";
    encoding: "pcm_s16le" | "pcm_f32le" | "mp3";
    sampleRate: number;
  };
}

export interface CartesiaTTSHook {
  // Core functionality
  speak: (text: string, config?: CartesiaTTSConfig) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;

  // State
  state: CartesiaTTSState;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;

  // Voice management
  voices: CartesiaVoice[];
  selectedVoice: CartesiaVoice | null;
  setSelectedVoice: (voice: CartesiaVoice | null) => void;

  // Configuration
  config: CartesiaTTSConfig;
  setConfig: (config: Partial<CartesiaTTSConfig>) => void;

  // Status
  error: string | null;
  currentText: string | null;
  audioProgress: number; // 0-1
  volume: number; // 0-1
  setVolume: (volume: number) => void;
}

// Default Cartesia voices
const DEFAULT_VOICES: CartesiaVoice[] = [
  {
    id: "a0e99841-438c-4a64-b679-ae501e7d6091",
    name: "Barbershop Man",
    description: "A warm, friendly male voice with professional tone",
    language: "en",
    gender: "male",
    age: "middle_aged",
  },
  {
    id: "694f9389-aac1-45b6-b726-9d9369183238",
    name: "Pleasant Woman",
    description: "A clear, pleasant female voice perfect for conversations",
    language: "en",
    gender: "female",
    age: "middle_aged",
  },
  {
    id: "95856005-0332-41b0-935f-352e296aa0df",
    name: "Young Woman",
    description: "An energetic, youthful female voice",
    language: "en",
    gender: "female",
    age: "young",
  },
];

const DEFAULT_CONFIG: CartesiaTTSConfig = {
  voiceId: DEFAULT_VOICES[0].id,
  speed: "normal",
  emotion: ["positivity"],
  volume: 0.7,
  outputFormat: {
    container: "wav",
    encoding: "pcm_f32le",
    sampleRate: 44100, // Higher quality for better audio
  },
};

export function useCartesiaTTS(): CartesiaTTSHook {
  const [state, setState] = useState<CartesiaTTSState>("idle");
  const [voices, setVoices] = useState<CartesiaVoice[]>(DEFAULT_VOICES);
  const [selectedVoice, setSelectedVoice] = useState<CartesiaVoice | null>(
    DEFAULT_VOICES[0]
  );
  const [config, setConfigState] = useState<CartesiaTTSConfig>(DEFAULT_CONFIG);
  const [error, setError] = useState<string | null>(null);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [volume, setVolumeState] = useState(0.7);

  // Audio context and playback
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const audioDurationRef = useRef<number>(0);

  // Check support
  const isSupported =
    typeof window !== "undefined" &&
    typeof AudioContext !== "undefined" &&
    typeof fetch !== "undefined";

  // Derived states
  const isSpeaking = state === "speaking";
  const isPaused = state === "paused";

  // Initialize audio context
  useEffect(() => {
    if (!isSupported) return;

    const initAudioContext = async () => {
      try {
        console.log("🔧 Initializing audio context...");
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;

        if (!AudioContextClass) {
          throw new Error("Web Audio API is not supported in this browser");
        }

        audioContextRef.current = new AudioContextClass();
        console.log(
          "✅ Audio context created, state:",
          audioContextRef.current.state
        );

        // Resume audio context if suspended (required by some browsers)
        if (audioContextRef.current.state === "suspended") {
          console.log("▶️ Resuming suspended audio context...");
          await audioContextRef.current.resume();
          console.log(
            "✅ Audio context resumed, new state:",
            audioContextRef.current.state
          );
        }

        // Create audio processing chain: source -> compressor -> gain -> destination
        console.log("🎛️ Creating audio processing nodes...");

        // Compressor to prevent distortion and normalize volume
        compressorRef.current =
          audioContextRef.current.createDynamicsCompressor();
        compressorRef.current.threshold.value = -24;
        compressorRef.current.knee.value = 30;
        compressorRef.current.ratio.value = 12;
        compressorRef.current.attack.value = 0.003;
        compressorRef.current.release.value = 0.25;
        console.log("✅ Compressor node created");

        // Gain node for volume control
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.value = volume;
        console.log("✅ Gain node created");

        // Connect the chain
        compressorRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);
        console.log("🔗 Audio processing chain connected");

        console.log("✅ Audio context initialized for Cartesia TTS", {
          state: audioContextRef.current.state,
          sampleRate: audioContextRef.current.sampleRate,
          hasCompressor: !!compressorRef.current,
          hasGain: !!gainNodeRef.current,
        });
      } catch (error) {
        console.error("❌ Failed to initialize audio context:", error);
        setError("Failed to initialize audio system");
        // Reset refs on failure
        audioContextRef.current = null;
        compressorRef.current = null;
        gainNodeRef.current = null;
      }
    };

    initAudioContext();

    return () => {
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
      }
    };
  }, [isSupported, volume]);

  // Update volume when changed
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // Set volume with validation
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
  }, []);

  // Set configuration with validation
  const setConfig = useCallback((newConfig: Partial<CartesiaTTSConfig>) => {
    setConfigState((prev) => ({
      ...prev,
      ...newConfig,
    }));
  }, []);

  // Clean up audio resources
  const cleanupAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
      } catch (e) {
        // Source might already be stopped
      }
      audioSourceRef.current = null;
    }

    setAudioProgress(0);
  }, []);

  // Create audio buffer from WAV data
  const createAudioBuffer = useCallback(async (audioData: ArrayBuffer) => {
    if (!audioContextRef.current) return null;

    try {
      console.log("🎵 Attempting to decode audio data:", {
        size: audioData.byteLength,
        contextState: audioContextRef.current.state,
        sampleRate: audioContextRef.current.sampleRate,
      });

      // Make a copy of the audio data to avoid transfer issues
      const audioDataCopy = audioData.slice(0);

      // Decode the audio data (WAV format from Cartesia)
      const audioBuffer = await audioContextRef.current.decodeAudioData(
        audioDataCopy
      );
      console.log("✅ Audio buffer created:", {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        length: audioBuffer.length,
      });
      return audioBuffer;
    } catch (error) {
      console.error("❌ Failed to decode audio data:", error);
      console.error("Audio data info:", {
        size: audioData.byteLength,
        first16Bytes: new Uint8Array(audioData.slice(0, 16)),
      });

      // Fallback: Try to handle as raw PCM if WAV decoding fails
      try {
        console.log("🔄 Trying fallback PCM handling...");
        const pcmData = new Float32Array(audioData);
        const sampleRate = 44100;

        const audioBuffer = audioContextRef.current.createBuffer(
          1,
          pcmData.length,
          sampleRate
        );
        audioBuffer.getChannelData(0).set(pcmData);
        console.log("✅ Fallback PCM buffer created");
        return audioBuffer;
      } catch (fallbackError) {
        console.error("❌ Fallback PCM also failed:", fallbackError);
        return null;
      }
    }
  }, []);

  // Play audio buffer
  const playAudioBuffer = useCallback(
    async (audioBuffer: AudioBuffer) => {
      if (!audioContextRef.current) {
        console.log("❌ Audio context not available");
        setError("Audio context not initialized");
        setState("error");
        return;
      }

      // If compressor is not available, create a simple audio chain
      if (!compressorRef.current || !gainNodeRef.current) {
        console.log(
          "⚠️ Compressor or gain node not available, recreating audio chain..."
        );
        try {
          // Recreate the audio processing chain
          compressorRef.current =
            audioContextRef.current.createDynamicsCompressor();
          compressorRef.current.threshold.value = -24;
          compressorRef.current.knee.value = 30;
          compressorRef.current.ratio.value = 12;
          compressorRef.current.attack.value = 0.003;
          compressorRef.current.release.value = 0.25;

          gainNodeRef.current = audioContextRef.current.createGain();
          gainNodeRef.current.gain.value = volume;

          compressorRef.current.connect(gainNodeRef.current);
          gainNodeRef.current.connect(audioContextRef.current.destination);

          console.log("✅ Audio chain recreated successfully");
        } catch (error) {
          console.error("❌ Failed to recreate audio chain:", error);
          setError("Failed to initialize audio processing");
          setState("error");
          return;
        }
      }

      try {
        console.log("🔧 Cleaning up previous audio...");
        cleanupAudio();

        // Ensure audio context is running
        console.log("🔊 Audio context state:", audioContextRef.current.state);
        if (audioContextRef.current.state === "suspended") {
          console.log("▶️ Resuming suspended audio context...");
          await audioContextRef.current.resume();
          console.log(
            "✅ Audio context resumed, new state:",
            audioContextRef.current.state
          );
        }

        console.log("🎵 Creating audio source...");
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;

        // Connect to the processing chain
        console.log("🔗 Connecting audio chain...");
        source.connect(compressorRef.current);

        audioSourceRef.current = source;
        audioDurationRef.current = audioBuffer.duration;

        console.log("📊 Setting up progress tracking...");
        // Track progress
        startTimeRef.current = audioContextRef.current.currentTime;
        const updateProgress = () => {
          if (state === "speaking" && audioContextRef.current) {
            const elapsed =
              audioContextRef.current.currentTime - startTimeRef.current;
            const progress = Math.min(elapsed / audioDurationRef.current, 1);
            setAudioProgress(progress);

            if (progress < 1) {
              requestAnimationFrame(updateProgress);
            }
          }
        };

        source.onended = () => {
          console.log("🎵 Audio playback ended");
          setState("idle");
          setCurrentText(null);
          setAudioProgress(0);
          cleanupAudio();
        };

        console.log("🎯 Setting state to speaking...");
        setState("speaking");

        console.log("🚀 Starting audio source...");
        source.start();

        console.log("📈 Starting progress updates...");
        requestAnimationFrame(updateProgress);

        console.log("🎵 Audio playback started successfully", {
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
          channels: audioBuffer.numberOfChannels,
          volume: volume,
        });
      } catch (error) {
        console.error("❌ Failed to play audio:", error);
        setError("Failed to play audio");
        setState("error");
      }
    },
    [state, cleanupAudio, volume, setError, setState]
  );

  // Synthesize speech using Cartesia API
  const speak = useCallback(
    async (text: string, customConfig?: CartesiaTTSConfig) => {
      if (!text.trim()) return;

      if (!isSupported) {
        setError("Audio playback is not supported in this browser");
        setState("error");
        return;
      }

      try {
        setState("synthesizing");
        setCurrentText(text);
        setError(null);
        cleanupAudio();

        const finalConfig = { ...config, ...customConfig };
        const voiceId =
          finalConfig.voiceId || selectedVoice?.id || DEFAULT_VOICES[0].id;

        console.log("🎤 Synthesizing speech with Cartesia:", {
          text: text.substring(0, 50) + "...",
          voiceId,
          config: finalConfig,
        });

        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 30000); // 30 second timeout

        // Call our backend API that interfaces with Cartesia
        const response = await fetch("/api/cartesia-tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            voiceId,
            config: finalConfig,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        // Get audio data as ArrayBuffer (WAV format from Cartesia)
        const audioData = await response.arrayBuffer();

        console.log("🎵 Received audio data:", {
          size: audioData.byteLength,
          type: response.headers.get("Content-Type"),
        });

        // Create and play audio buffer with timeout
        console.log("🎵 Creating audio buffer...");
        const buffer = await createAudioBuffer(audioData);

        if (buffer) {
          console.log("🎵 Playing audio buffer...");
          playAudioBuffer(buffer);
        } else {
          throw new Error("Failed to create audio buffer");
        }
      } catch (error) {
        console.error("❌ Cartesia TTS error:", error);
        setError(
          error instanceof Error ? error.message : "Failed to synthesize speech"
        );
        setState("error");
        setCurrentText(null);
        setAudioProgress(0);
        cleanupAudio();
      }
    },
    [
      config,
      selectedVoice,
      isSupported,
      cleanupAudio,
      createAudioBuffer,
      playAudioBuffer,
    ]
  );

  // Stop speaking
  const stop = useCallback(() => {
    console.log("🛑 Stopping Cartesia TTS");
    cleanupAudio();
    setState("idle");
    setCurrentText(null);
    setAudioProgress(0);
  }, [cleanupAudio]);

  // Pause speaking
  const pause = useCallback(() => {
    if (
      state !== "speaking" ||
      !audioContextRef.current ||
      !audioSourceRef.current
    )
      return;

    console.log("⏸️ Pausing Cartesia TTS");
    pauseTimeRef.current = audioContextRef.current.currentTime;
    audioSourceRef.current.stop();
    setState("paused");
  }, [state]);

  // Resume speaking
  const resume = useCallback(() => {
    if (state !== "paused" || !currentText) return;

    console.log("▶️ Resuming Cartesia TTS");
    // For simplicity, restart from beginning
    // In a more advanced implementation, we could resume from pause point
    speak(currentText);
  }, [state, currentText, speak]);

  // Update voice when selected voice changes
  useEffect(() => {
    if (selectedVoice) {
      setConfig({ voiceId: selectedVoice.id });
    }
  }, [selectedVoice, setConfig]);

  return {
    // Core functionality
    speak,
    stop,
    pause,
    resume,

    // State
    state,
    isSpeaking,
    isPaused,
    isSupported,

    // Voice management
    voices,
    selectedVoice,
    setSelectedVoice,

    // Configuration
    config,
    setConfig,

    // Status
    error,
    currentText,
    audioProgress,
    volume,
    setVolume,
  };
}
