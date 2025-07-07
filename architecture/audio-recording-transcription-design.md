# Audio Recording + AI Transcription - Design Decisions

## Problem Statement

Replace Web Speech API with direct microphone recording and AI-powered transcription because:

1. Web Speech API has inconsistent browser support and behavior
2. Limited control over transcription quality and language models
3. Dependency on browser-specific implementations
4. Want consistent experience across all platforms and browsers
5. Better privacy control with custom transcription service

## Solution Overview

Implement direct audio recording with AI transcription that:

- Records audio directly from microphone using MediaRecorder API
- Supports both desktop and mobile browsers consistently
- Sends audio chunks to AI transcription service (OpenAI Whisper)
- Provides real-time transcription feedback
- Handles audio format optimization for different devices
- Maintains the same user experience as before

## Implementation Strategy

### 1. Audio Recording System (`useAudioRecorder`)

**Core Functionality:**

- Direct microphone access using MediaRecorder API
- Real-time audio chunk recording
- Audio format detection and optimization
- Cross-platform audio encoding (WebM, MP4, WAV fallbacks)
- Audio quality settings for mobile vs desktop

**Recording States:**

- `idle` - Not recording, ready to start
- `starting` - Initializing recording
- `recording` - Actively recording audio
- `stopping` - Finalizing recording
- `processing` - Sending audio for transcription
- `error` - Error occurred during recording

### 2. AI Transcription Service

**Backend API (`/api/transcribe`):**

- Accept audio files in multiple formats
- Convert audio to optimal format for AI service
- Integration with OpenAI Whisper API
- Handle streaming transcription for long recordings
- Error handling and retry logic

**Audio Processing:**

- Audio format conversion (to WAV/MP3 for Whisper)
- Audio compression and quality optimization
- Chunk-based processing for real-time feedback
- Audio duration limits and file size management

### 3. Enhanced Permission Management

**Extended from existing system:**

- Keep existing microphone permission logic
- Add audio recording specific permissions
- Handle MediaRecorder API availability
- Browser compatibility detection for audio recording

### 4. User Experience Enhancements

**Recording Interface:**

- Visual audio level indicators
- Recording time display
- Real-time transcription preview
- Clear recording status feedback
- Audio playback for verification

**Error Handling:**

- Clear messages for recording failures
- Audio format compatibility issues
- Network errors during transcription
- Fallback options when transcription fails

## Technical Architecture

### Frontend Components

1. **`useAudioRecorder`** - Core audio recording hook
2. **`useAITranscription`** - AI transcription management
3. **Enhanced `useMicrophonePermission`** - Extended permission handling
4. **`AudioRecorderControls`** - Recording interface component
5. **Enhanced `VoiceChatApp`** - Integration with new audio system

### Backend APIs

1. **`POST /api/transcribe`** - Audio transcription endpoint
2. **Audio processing utilities** - Format conversion and optimization
3. **OpenAI Whisper integration** - AI transcription service

### Audio Format Strategy

**Desktop Browsers:**

- Primary: WebM with Opus codec (Chrome, Firefox)
- Fallback: MP4 with AAC (Safari)
- Final fallback: WAV (universal support)

**Mobile Browsers:**

- iOS Safari: MP4 with AAC
- Android Chrome: WebM with Opus
- Fallback: WAV for compatibility

**Server Processing:**

- Convert all formats to WAV/MP3 for Whisper
- Optimize audio quality vs file size
- Handle sample rate conversion (16kHz for Whisper)

## Implementation Files

1. **`app/hooks/useAudioRecorder.ts`** - Core audio recording logic
2. **`app/hooks/useAITranscription.ts`** - AI transcription management
3. **`app/api/transcribe/route.ts`** - Backend transcription API
4. **`app/components/AudioRecorderControls.tsx`** - Recording UI
5. **Enhanced existing components** - Integration with new system
6. **Audio utilities** - Format conversion and processing helpers

## Security & Privacy Considerations

**Privacy-First Approach:**

- Audio only sent to transcription when user explicitly requests
- No persistent storage of audio files
- Clear user consent for AI transcription
- Option to use local transcription models in future

**Security Measures:**

- Audio data encryption in transit
- Rate limiting on transcription API
- Audio file size and duration limits
- Secure handling of OpenAI API keys

## Success Metrics

- Consistent recording behavior across all browsers
- High-quality transcription accuracy with AI
- Fast transcription response times (< 5 seconds)
- Reduced "not supported" errors
- Better mobile recording experience
- User control over transcription process

## Technical Requirements

- MediaRecorder API support (available in all modern browsers)
- Audio format conversion on server side
- OpenAI Whisper API integration
- Real-time audio level monitoring
- Robust error handling and recovery
- Audio quality optimization for transcription accuracy
