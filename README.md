# ESC Game - Voice Chat Application

A Next.js application with audio recording and AI-powered transcription capabilities.

## Features

- 🎤 **Direct Audio Recording** - Records audio directly from microphone using MediaRecorder API
- 🤖 **AI Transcription** - Transcribes audio using OpenAI Whisper for high accuracy
- 📱 **Cross-Platform Support** - Works on desktop and mobile browsers
- 🔒 **Privacy-First** - Audio only sent to AI when explicitly requested
- 🎯 **Real-time Feedback** - Visual audio level indicators and recording status
- 🌐 **Browser Compatibility** - Supports Chrome, Firefox, Safari, and mobile browsers

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Audio Recording**: MediaRecorder API with multiple format support
- **AI Transcription**: OpenAI Whisper API integration
- **Deployment**: Vercel-ready configuration

## Prerequisites

- Node.js 18+ and npm
- OpenAI API key for transcription services
- HTTPS environment for production (required for microphone access)

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd escgame
npm install
```

### 2. Configure API Keys

Create a `.env.local` file in the project root:

```bash
OPENAI_API_KEY=your_openai_api_key_here
CARTESIA_API_KEY=your_cartesia_api_key_here
```

To get your API keys:

1. **OpenAI API Key**: Visit [OpenAI API Keys](https://platform.openai.com/api-keys), create a new key, and copy it
2. **Cartesia API Key**: Visit [Cartesia Dashboard](https://cartesia.ai/), create an account, and get your API key
3. Copy both keys to your `.env.local` file

**Important**: Never commit your API key to version control. The `.env.local` file is already in `.gitignore`.

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 4. Test the System

Visit `/test` to access the comprehensive testing interface that allows you to:

- Test microphone permissions
- Record audio samples
- Test AI transcription
- Check browser compatibility
- Monitor system status

## AI Voice System

### Audio Recording & AI Transcription

**How It Works:**

1. **Permission Request**: Requests microphone access from the browser
2. **Audio Recording**: Records audio using MediaRecorder API with optimal format detection
3. **Format Optimization**: Automatically selects best audio format for the current browser
4. **AI Transcription**: Sends audio to OpenAI Whisper for transcription
5. **Real-time Feedback**: Provides visual feedback during recording and processing

### AI Text-to-Speech with Cartesia

**How It Works:**

1. **Text Processing**: Receives text responses from the AI chat system
2. **Voice Synthesis**: Uses Cartesia.ai's ultra-realistic AI voices for speech generation
3. **Audio Streaming**: Delivers high-quality audio with < 90ms latency
4. **Playback Control**: Supports play, pause, stop, and speed control
5. **Voice Customization**: Choose from multiple voices with emotion and speed controls

### Supported Audio Formats

- **Primary**: WebM with Opus codec (Chrome, Firefox)
- **Fallback**: MP4 with AAC (Safari, iOS)
- **Universal**: WAV (all browsers)

### Browser Support

| Browser      | Desktop | Mobile | Notes        |
| ------------ | ------- | ------ | ------------ |
| Chrome 25+   | ✅      | ✅     | Full support |
| Firefox 44+  | ✅      | ✅     | Full support |
| Safari 14.1+ | ✅      | ✅     | Full support |
| Edge 79+     | ✅      | ✅     | Full support |

## Architecture

### Frontend Hooks

**Speech-to-Text:**

- **`useVoiceRecognition`** - Main composite hook combining recording and transcription
- **`useAudioRecorder`** - Direct audio recording with MediaRecorder API
- **`useAITranscription`** - AI transcription management
- **`useMicrophonePermission`** - Microphone permission handling

**Text-to-Speech:**

- **`useCartesiaTTS`** - Cartesia.ai text-to-speech with voice selection and controls

### Components

**Speech-to-Text:**

- **`AudioRecorderControls`** - Recording interface with visual feedback
- **`MicrophonePermissionPrompt`** - Permission request guidance

**Text-to-Speech:**

- **`CartesiaVoiceControls`** - Voice selection, speed, emotion, and playback controls

**Main Application:**

- **`VoiceChatApp`** - Main chat application with complete voice features

### Backend APIs

- **`/api/transcribe`** - Audio transcription endpoint using OpenAI Whisper
- **`/api/cartesia-tts`** - Text-to-speech endpoint using Cartesia.ai

## Configuration

### Audio Quality Settings

```typescript
// High quality for better transcription
const audioConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 44100,
  },
};
```

### Transcription Settings

```typescript
// OpenAI Whisper configuration
const transcriptionConfig = {
  model: "whisper-1",
  language: "en",
  response_format: "verbose_json",
  temperature: 0.1, // Lower for accuracy
};
```

## Security & Privacy

- **HTTPS Required**: Microphone access requires secure context
- **Permission-Based**: Explicit user consent for all audio access
- **No Storage**: Audio files are not persistently stored
- **Encrypted Transit**: All API communications are encrypted
- **Rate Limited**: API endpoints include rate limiting

## Deployment

### Environment Variables

For production deployment, set these environment variables:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Vercel Deployment

1. Connect your repository to Vercel
2. Add the OpenAI API key as an environment variable in Vercel dashboard
3. Deploy automatically on push to main branch

### HTTPS Requirement

- Production deployment must use HTTPS for microphone access
- Local development works on `localhost` without HTTPS
- Test on actual mobile devices requires HTTPS

## Troubleshooting

### Common Issues

**"Speech recognition is not supported"**

- Solution: This error indicates missing microphone permissions, not lack of support

**"Microphone access denied"**

- Check browser permissions in settings
- Ensure HTTPS on production domains
- Try refreshing the page and requesting permission again

**"Transcription failed"**

- Verify OpenAI API key is correctly configured
- Check network connectivity
- Ensure audio file is not corrupted

**"No audio data recorded"**

- Check microphone hardware connection
- Verify other applications aren't using the microphone
- Test browser's audio recording permissions

### Debug Mode

Enable verbose logging in the browser console to debug issues:

```javascript
// In browser console
localStorage.setItem("DEBUG_AUDIO", "true");
```

## Development

### Project Structure

```
escgame/
├── app/
│   ├── hooks/                 # Audio and transcription hooks
│   ├── components/           # UI components
│   ├── api/transcribe/       # Transcription API endpoint
│   └── test/                 # Testing interface
├── architecture/             # Design documents
└── public/                   # Static assets
```

### Type Checking

```bash
npx tsc --noEmit
```

### Testing

Visit `/test` for comprehensive system testing, or run:

```bash
npm run dev
# Navigate to http://localhost:3000/test
```

## API Reference

### POST /api/transcribe

Transcribes audio files using OpenAI Whisper.

**Request:**

- Method: POST
- Content-Type: multipart/form-data
- Body: Audio file as FormData

**Response:**

```json
{
  "text": "Transcribed text",
  "language": "en",
  "duration": 5.2,
  "confidence": 1.0
}
```

**Error Codes:**

- 400: Invalid audio file
- 413: File too large (>25MB)
- 415: Unsupported audio format
- 429: Rate limit exceeded
- 500: Server error

## Contributing

1. Follow existing code patterns and TypeScript types
2. Test on multiple browsers and devices
3. Update documentation for new features
4. Ensure HTTPS compatibility

## License

[Add your license information here]
