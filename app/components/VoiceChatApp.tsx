'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType } from '../types/chat';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useCartesiaTTS } from '../hooks/useCartesiaTTS';
import { ChatMessage } from './ChatMessage';
import { AudioRecorderControls } from './AudioRecorderControls';
import { CartesiaVoiceControls } from './CartesiaVoiceControls';

export function VoiceChatApp() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    state: voiceState,
    transcript,
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    clearTranscript,
    audioLevel,
    recordingDuration,
    error: voiceError,
    isSupported: voiceRecognitionSupported,
    hasPermission,
    requestPermission,
    permissionState,
    browserInfo,
    confidence,
  } = useVoiceRecognition();

  const {
    speak,
    stop: stopSpeaking,
    pause: pauseSpeaking,
    resume: resumeSpeaking,
    state: ttsState,
    isSpeaking,
    isPaused,
    isSupported: speechSynthesisSupported,
    voices,
    selectedVoice,
    config: ttsConfig,
    error: ttsError,
    currentText: currentTTSText,
    audioProgress,
    volume,
    setSelectedVoice,
    setConfig: setTTSConfig,
    setVolume,
  } = useCartesiaTTS();

  const isVoiceSupported = voiceRecognitionSupported && speechSynthesisSupported;

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update input text when transcript changes and is completed
  useEffect(() => {
    if (transcript && voiceState === 'completed') {
      setInputText(transcript);
    }
  }, [transcript, voiceState]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setError(null);
    setIsLoading(true);
    clearTranscript();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Speak the AI response
      if (speechSynthesisSupported) {
        speak(data.response);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    sendMessage(inputText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartRecording = async () => {
    console.log("VoiceChatApp: Starting recording...");
    setInputText('');
    clearTranscript();
    await startRecording();
  };

  const handleStopRecording = async () => {
    console.log("VoiceChatApp: Stopping recording...");
    await stopRecording();
  };

  // Auto-send message when transcription is completed
  useEffect(() => {
    if (voiceState === 'completed' && transcript.trim()) {
      console.log("VoiceChatApp: Auto-sending transcript:", transcript);
      sendMessage(transcript);
    }
  }, [voiceState, transcript]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          AI Voice Chat
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300">
          {isVoiceSupported 
            ? 'Speak naturally or type your message' 
            : 'Type your message to chat with AI'
          }
        </p>
      </div>

      {/* Chat Messages */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
            <p>Start a conversation by typing or speaking!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="text-left mb-4">
                <div className="inline-block bg-gray-200 dark:bg-gray-700 p-3 rounded-lg rounded-bl-none">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="text-gray-600 dark:text-gray-300 ml-2">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 rounded-lg">
          <p className="text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}
      
      {voiceError && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 rounded-lg">
          <p className="text-yellow-700 dark:text-yellow-200">
            <strong>Voice Recognition:</strong> {voiceError}
          </p>
        </div>
      )}

      {/* Confidence indicator */}
      {confidence !== null && voiceState === 'completed' && (
        <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Transcription confidence: {Math.round(confidence * 100)}%
          </p>
        </div>
      )}

      {/* Voice Recognition Controls */}
      <div className="mb-6">
        <AudioRecorderControls
          state={voiceState}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          audioLevel={audioLevel}
          recordingDuration={recordingDuration}
          isSupported={isVoiceSupported}
          hasPermission={hasPermission}
          requestPermission={requestPermission}
          permissionState={permissionState}
          error={voiceError}
          browserInfo={browserInfo}
        />
      </div>

      {/* Text-to-Speech Controls */}
      <div className="mb-6">
        <CartesiaVoiceControls
          state={ttsState}
          isSpeaking={isSpeaking}
          isPaused={isPaused}
          isSupported={speechSynthesisSupported}
          voices={voices}
          selectedVoice={selectedVoice}
          config={ttsConfig}
          error={ttsError}
          currentText={currentTTSText}
          audioProgress={audioProgress}
          volume={volume}
          onStop={stopSpeaking}
          onPause={pauseSpeaking}
          onResume={resumeSpeaking}
          onVoiceChange={setSelectedVoice}
          onConfigChange={setTTSConfig}
          onVolumeChange={setVolume}
        />
      </div>

      {/* Text Input */}
      <div className="flex gap-2">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isRecording ? 'Recording...' : isProcessing ? 'Processing...' : 'Type your message here...'}
          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          disabled={isRecording || isProcessing || isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim() || isLoading || isRecording || isProcessing}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* Status indicator */}
      {isRecording && (
        <div className="mt-4 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">
            🎤 Recording... Speak now
          </p>
        </div>
      )}
      
      {isProcessing && (
        <div className="mt-4 text-center">
          <p className="text-blue-600 dark:text-blue-400 font-medium">
            🤖 Processing your audio...
          </p>
        </div>
      )}
    </div>
  );
} 