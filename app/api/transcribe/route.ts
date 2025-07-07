import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit for Whisper
const ALLOWED_FORMATS = [
  "audio/webm",
  "audio/mp4",
  "audio/wav",
  "audio/mpeg",
  "audio/ogg",
];

export async function POST(request: NextRequest) {
  try {
    console.log("🤖 Transcription API called");

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OpenAI API key not configured");
      return NextResponse.json(
        { error: "Transcription service not configured" },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    console.log(
      `📦 Received audio file: ${audioFile.name}, size: ${audioFile.size} bytes, type: ${audioFile.type}`
    );

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE) {
      console.error(`❌ File too large: ${audioFile.size} bytes`);
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${
            MAX_FILE_SIZE / (1024 * 1024)
          }MB`,
        },
        { status: 413 }
      );
    }

    // Validate file format
    const fileType = audioFile.type || "unknown";
    if (
      !ALLOWED_FORMATS.some((format) =>
        fileType.startsWith(format.split("/")[0])
      )
    ) {
      console.error(`❌ Unsupported file format: ${fileType}`);
      return NextResponse.json(
        {
          error: `Unsupported audio format: ${fileType}. Supported formats: ${ALLOWED_FORMATS.join(
            ", "
          )}`,
        },
        { status: 415 }
      );
    }

    // Validate file content (basic check)
    if (audioFile.size < 1000) {
      // Less than 1KB is likely not valid audio
      console.error(`❌ File too small: ${audioFile.size} bytes`);
      return NextResponse.json(
        { error: "Audio file appears to be invalid or too short" },
        { status: 400 }
      );
    }

    try {
      console.log("🎵 Sending audio to OpenAI Whisper...");

      // Convert File to the format expected by OpenAI
      const audioBuffer = await audioFile.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: audioFile.type });

      // Create a File object for OpenAI
      const whisperFile = new File([audioBlob], audioFile.name, {
        type: audioFile.type,
      });

      // Call OpenAI Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: whisperFile,
        model: "whisper-1",
        language: "en", // You can make this configurable
        response_format: "verbose_json", // Get more detailed response
        temperature: 0.1, // Lower temperature for more accurate transcription
      });

      console.log("✅ Transcription completed");
      console.log(`📝 Text: ${transcription.text}`);
      console.log(`🌐 Language: ${transcription.language}`);
      console.log(`⏱️ Duration: ${transcription.duration}s`);

      // Return transcription result
      return NextResponse.json({
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        confidence: 1.0, // Whisper doesn't provide confidence scores, so we default to 1.0
      });
    } catch (openaiError: any) {
      console.error("❌ OpenAI API error:", openaiError);

      // Handle specific OpenAI errors
      if (openaiError.status === 429) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        );
      }

      if (openaiError.status === 401) {
        return NextResponse.json(
          { error: "Transcription service authentication failed" },
          { status: 500 }
        );
      }

      if (openaiError.status === 413) {
        return NextResponse.json(
          { error: "Audio file too large for transcription service" },
          { status: 413 }
        );
      }

      // Generic OpenAI error
      return NextResponse.json(
        { error: "Transcription service error. Please try again." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Transcription API error:", error);

    // Handle request parsing errors
    if (error.message?.includes("FormData")) {
      return NextResponse.json(
        { error: "Invalid request format. Please send audio as form data." },
        { status: 400 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to transcribe audio." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to transcribe audio." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to transcribe audio." },
    { status: 405 }
  );
}
