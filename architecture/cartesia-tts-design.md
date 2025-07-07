# Cartesia.ai Text-to-Speech - Design Decisions

## Problem Statement

Replace Web Speech API SpeechSynthesis with Cartesia.ai for text-to-speech because:

1. Better voice quality and naturalness than browser voices
2. Consistent voice experience across all platforms and browsers
3. Real-time streaming capabilities for low latency
4. Professional-grade AI voices with emotional expression
5. Custom voice options and voice cloning capabilities
6. More control over voice characteristics and output quality

## Solution Overview

Implement Cartesia.ai text-to-speech that:

- Uses Cartesia.ai's real-time voice synthesis API
- Supports both streaming and non-streaming modes
- Provides high-quality, natural-sounding voices
- Maintains low latency for real-time conversation
- Offers voice selection and customization options
- Handles audio playback and streaming efficiently

## Cartesia.ai Features

### Voice Quality

- **Ultra-realistic voices** - State-of-the-art AI voice synthesis
- **Low latency** - Real-time streaming (< 300ms)
- **Emotional expression** - Natural intonation and emotion
- **Multiple voices** - Various voice options and styles
- **Custom voices** - Voice cloning and customization capabilities

### API Options

- **WebSocket Streaming** - Real-time audio streaming
- **REST API** - Traditional request/response for shorter texts
- **Multiple formats** - PCM, MP3, WAV output formats
- **Real-time factors** - Faster than real-time synthesis

## Implementation Strategy

### 1. Cartesia.ai Text-to-Speech Hook (`useCartesiaTTS`)

**Core Functionality:**

- Text-to-speech conversion using Cartesia.ai API
- Real-time audio streaming for immediate playback
- Voice selection and configuration management
- Audio playback control (play, pause, stop)
- Queue management for multiple text requests

**States:**

- `idle` - Ready to synthesize speech
- `synthesizing` - Converting text to audio
- `speaking` - Audio is currently playing
- `paused` - Playback is paused
- `error` - Error occurred during synthesis or playback

### 2. Backend API Integration

**Backend API (`/api/cartesia-tts`):**

- Accept text and voice configuration
- Interface with Cartesia.ai API
- Handle streaming audio responses
- Audio format conversion and optimization
- Error handling and retry logic

**Streaming Implementation:**

- WebSocket connection for real-time audio
- Chunked audio processing and playback
- Buffer management for smooth playback
- Connection management and reconnection

### 3. Audio Management System

**Audio Playback:**

- Web Audio API for precise control
- Audio buffer management for streaming
- Volume and playback speed control
- Queue system for multiple speech requests

**Performance Optimization:**

- Audio pre-loading and caching
- Efficient memory management
- Network optimization for streaming
- Fallback handling for connection issues

## Technical Architecture

### Frontend Components

1. **`useCartesiaTTS`** - Main text-to-speech hook
2. **`useCartesiaAudio`** - Audio playback and streaming management
3. **Enhanced voice controls** - Updated UI for Cartesia.ai features
4. **Voice selection component** - Choose from available Cartesia voices

### Backend APIs

1. **`POST /api/cartesia-tts`** - Text-to-speech conversion endpoint
2. **`WS /api/cartesia-stream`** - WebSocket streaming for real-time audio
3. **Cartesia.ai client integration** - Official SDK or direct API calls

### Voice Configuration

**Available Voices:**

- Multiple personality types (professional, casual, friendly)
- Different accents and languages
- Male and female voice options
- Custom voice upload capabilities

**Voice Settings:**

- Speed control (0.5x to 2.0x)
- Pitch adjustment
- Emotional tone settings
- Audio quality selection

## Implementation Files ✅ COMPLETED

1. **`app/hooks/useCartesiaTTS.ts`** ✅ - Core text-to-speech logic with Web Audio API
2. **`app/api/cartesia-tts/route.ts`** ✅ - Backend TTS API with Cartesia.ai integration
3. **`app/components/CartesiaVoiceControls.tsx`** ✅ - Voice control UI with settings
4. **`app/components/VoiceChatApp.tsx`** ✅ - Updated to use Cartesia TTS
5. **Removed `app/hooks/useSpeechSynthesis.ts`** ✅ - Old Web Speech API hook removed
6. **Updated documentation** ✅ - README and environment setup

## Security & Privacy Considerations

**API Security:**

- Secure API key storage and rotation
- Rate limiting and usage monitoring
- Request validation and sanitization
- Encrypted API communications

**Privacy Measures:**

- Clear user consent for AI voice synthesis
- No persistent storage of audio data
- Optional local caching with user control
- Transparent data usage policies

## Performance Requirements

**Latency Targets:**

- Initial synthesis: < 500ms
- Streaming latency: < 300ms
- Audio buffer: 1-3 seconds ahead
- Network timeout: 10 seconds

**Quality Settings:**

- High quality: 48kHz, 16-bit for critical applications
- Standard quality: 24kHz, 16-bit for general use
- Low bandwidth: 16kHz, 16-bit for mobile/slow connections

## Cost Optimization

**Usage Management:**

- Text length optimization (chunk long texts)
- Caching of common phrases or responses
- Usage analytics and monitoring
- Cost alerts and limits

**Efficiency Measures:**

- Reuse connections for multiple requests
- Batch processing when possible
- Intelligent voice selection defaults
- Graceful degradation for quota limits

## Migration Strategy

**Phase 1: Implementation**

- Create new Cartesia.ai hooks and components
- Implement backend API integration
- Add voice selection and configuration

**Phase 2: Integration**

- Replace useSpeechSynthesis with useCartesiaTTS
- Update all components using text-to-speech
- Add new voice control features

**Phase 3: Optimization**

- Implement streaming for real-time performance
- Add caching and performance optimizations
- Fine-tune voice settings and quality

**Phase 4: Cleanup**

- Remove old Web Speech API dependencies
- Update documentation and testing
- Performance monitoring and optimization

## Success Metrics

- Voice quality improvements (user feedback)
- Latency reduction (< 300ms streaming)
- Cross-platform consistency (same voice everywhere)
- User engagement with voice features
- Cost efficiency vs quality balance
- System reliability and uptime

## Technical Requirements

- Cartesia.ai API key and account setup
- WebSocket support for real-time streaming
- Web Audio API for advanced playback control
- Proper error handling and fallbacks
- Usage monitoring and cost management
