import { NextRequest, NextResponse } from "next/server";
import { CartesiaClient } from "@cartesia/cartesia-js";

// Initialize Cartesia client
function getCartesiaClient() {
  const apiKey = process.env.CARTESIA_API_KEY;

  if (!apiKey) {
    throw new Error("CARTESIA_API_KEY environment variable is required");
  }

  return new CartesiaClient({
    apiKey,
  });
}

// Request body interface
interface TTSRequest {
  text: string;
  voiceId?: string;
  config?: {
    voiceId?: string;
    speed?: number | string;
    emotion?: string[];
    outputFormat?: {
      container: string;
      encoding: string;
      sampleRate: number;
    };
  };
}

// Default configuration
const DEFAULT_CONFIG = {
  voiceId: "a0e99841-438c-4a64-b679-ae501e7d6091", // Barbershop Man
  speed: "normal",
  emotion: ["positivity"],
  outputFormat: {
    container: "wav",
    encoding: "pcm_f32le",
    sampleRate: 24000,
  },
};

export async function POST(request: NextRequest) {
  try {
    console.log("🎤 Cartesia TTS API endpoint called");

    // Parse request body
    const body: TTSRequest = await request.json();
    const { text, voiceId, config } = body;

    // Validate input
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Text is too long. Maximum length is 5000 characters" },
        { status: 400 }
      );
    }

    // Merge configuration with defaults
    const finalConfig = {
      voiceId: voiceId || config?.voiceId || DEFAULT_CONFIG.voiceId,
      speed: config?.speed || DEFAULT_CONFIG.speed,
      emotion: config?.emotion || DEFAULT_CONFIG.emotion,
      outputFormat: {
        ...DEFAULT_CONFIG.outputFormat,
        ...config?.outputFormat,
      },
    };

    console.log("🔧 TTS Configuration:", {
      textLength: text.length,
      voiceId: finalConfig.voiceId,
      speed: finalConfig.speed,
      emotion: finalConfig.emotion,
      outputFormat: finalConfig.outputFormat,
    });

    // Initialize Cartesia client
    const cartesia = getCartesiaClient();

    // Prepare voice configuration for Cartesia
    const voiceConfig: any = {
      mode: "id",
      id: finalConfig.voiceId,
    };

    // Add experimental controls if specified
    if (finalConfig.speed !== "normal" || finalConfig.emotion.length > 0) {
      voiceConfig.__experimental_controls = {};

      if (finalConfig.speed !== "normal") {
        voiceConfig.__experimental_controls.speed = finalConfig.speed;
      }

      if (finalConfig.emotion.length > 0) {
        voiceConfig.__experimental_controls.emotion = finalConfig.emotion;
      }
    }

    // Generate speech using Cartesia TTS
    console.log("🎵 Generating speech with Cartesia...");

    const response = await cartesia.tts.bytes({
      modelId: "sonic-2", // Use Sonic 2 model for best quality and speed
      transcript: text,
      voice: voiceConfig,
      outputFormat: {
        container: finalConfig.outputFormat.container as any,
        encoding: finalConfig.outputFormat.encoding as any,
        sampleRate: finalConfig.outputFormat.sampleRate,
      },
    });

    console.log("✅ Speech generated successfully");

    // Return audio data with proper headers
    return new NextResponse(response, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
        "X-Voice-ID": finalConfig.voiceId,
        "X-Text-Length": text.length.toString(),
      },
    });
  } catch (error) {
    console.error("❌ Cartesia TTS error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      // Check for API key errors
      if (error.message.includes("CARTESIA_API_KEY")) {
        return NextResponse.json(
          {
            error: "Server configuration error. Please contact support.",
            details: "Missing API key configuration",
          },
          { status: 500 }
        );
      }

      // Check for rate limiting
      if (
        error.message.includes("rate limit") ||
        error.message.includes("429")
      ) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded. Please try again in a moment.",
            retryAfter: 60,
          },
          { status: 429 }
        );
      }

      // Check for quota/billing errors
      if (
        error.message.includes("quota") ||
        error.message.includes("billing")
      ) {
        return NextResponse.json(
          {
            error: "Service temporarily unavailable. Please try again later.",
            details: "Quota exceeded",
          },
          { status: 503 }
        );
      }

      // Check for invalid voice ID
      if (
        error.message.includes("voice") &&
        error.message.includes("not found")
      ) {
        return NextResponse.json(
          {
            error: "Invalid voice selected. Please choose a different voice.",
            details: "Voice ID not found",
          },
          { status: 400 }
        );
      }

      // Generic API error
      return NextResponse.json(
        {
          error: "Failed to generate speech. Please try again.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Unknown error
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Test endpoint to verify configuration
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.CARTESIA_API_KEY;

    return NextResponse.json({
      status: "Cartesia TTS API is available",
      configured: !!apiKey,
      timestamp: new Date().toISOString(),
      supportedFormats: ["wav", "mp3"],
      supportedEncodings: ["pcm_f32le", "pcm_s16le"],
      defaultVoice: DEFAULT_CONFIG.voiceId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Configuration error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
