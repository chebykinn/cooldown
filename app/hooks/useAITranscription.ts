import { useState, useCallback } from "react";

export type TranscriptionState =
  | "idle"
  | "transcribing"
  | "completed"
  | "error";

interface AITranscriptionHook {
  transcriptionState: TranscriptionState;
  transcript: string;
  confidence: number | null;
  transcribeAudio: (audioBlob: Blob) => Promise<string | null>;
  clearTranscript: () => void;
  error: string | null;
}

interface TranscriptionResponse {
  text: string;
  confidence?: number;
  language?: string;
  duration?: number;
}

export function useAITranscription(): AITranscriptionHook {
  const [transcriptionState, setTranscriptionState] =
    useState<TranscriptionState>("idle");
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transcribeAudio = useCallback(
    async (audioBlob: Blob): Promise<string | null> => {
      if (transcriptionState === "transcribing") {
        console.log("⚠️ Already transcribing audio");
        return null;
      }

      setTranscriptionState("transcribing");
      setError(null);

      try {
        console.log("🤖 Starting AI transcription...");
        console.log(
          `📦 Audio blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`
        );

        // Prepare form data for API request
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        // Send to transcription API
        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const result: TranscriptionResponse = await response.json();

        if (!result.text) {
          throw new Error("No transcription text received from API");
        }

        console.log("✅ Transcription completed:", result.text);

        setTranscript(result.text);
        setConfidence(result.confidence || null);
        setTranscriptionState("completed");

        return result.text;
      } catch (error: any) {
        console.error("❌ Transcription error:", error);

        let errorMessage = "Failed to transcribe audio.";

        if (error.name === "NetworkError" || error.message.includes("fetch")) {
          errorMessage =
            "Network error. Please check your internet connection and try again.";
        } else if (
          error.message.includes("413") ||
          error.message.includes("too large")
        ) {
          errorMessage =
            "Audio file is too large. Please record a shorter message.";
        } else if (
          error.message.includes("415") ||
          error.message.includes("format")
        ) {
          errorMessage =
            "Audio format not supported. Please try recording again.";
        } else if (
          error.message.includes("429") ||
          error.message.includes("rate limit")
        ) {
          errorMessage =
            "Too many requests. Please wait a moment and try again.";
        } else if (
          error.message.includes("401") ||
          error.message.includes("unauthorized")
        ) {
          errorMessage =
            "Transcription service unavailable. Please try again later.";
        } else if (error.message) {
          errorMessage = `Transcription failed: ${error.message}`;
        }

        setError(errorMessage);
        setTranscriptionState("error");
        return null;
      }
    },
    [transcriptionState]
  );

  const clearTranscript = useCallback(() => {
    console.log("🧹 Clearing transcript");
    setTranscript("");
    setConfidence(null);
    setError(null);
    setTranscriptionState("idle");
  }, []);

  return {
    transcriptionState,
    transcript,
    confidence,
    transcribeAudio,
    clearTranscript,
    error,
  };
}
