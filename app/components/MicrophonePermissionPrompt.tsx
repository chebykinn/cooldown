import React from 'react';
import { MicrophonePermissionState } from '../hooks/useMicrophonePermission';

interface MicrophonePermissionPromptProps {
  permissionState: MicrophonePermissionState;
  error: string | null;
  onRequestPermission: () => Promise<boolean>;
  browserInfo: {
    name: string;
    isMobile: boolean;
    requiresHTTPS: boolean;
    supportsPermissionAPI: boolean;
    isIOS: boolean;
    iosVersion: number | null;
  };
  className?: string;
}

export function MicrophonePermissionPrompt({
  permissionState,
  error,
  onRequestPermission,
  browserInfo,
  className = "",
}: MicrophonePermissionPromptProps) {
  const handleRequestPermission = async () => {
    await onRequestPermission();
  };

  if (permissionState === 'granted') {
    return null; // Don't show anything if permission is granted
  }

  if (permissionState === 'unsupported') {
    return (
      <div className={`p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 rounded-lg ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Microphone Not Supported
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {error || "Your browser doesn't support microphone access. The MediaDevices API is not available."}
            </p>
            <div className="text-sm text-red-600 dark:text-red-400">
              <p className="font-medium mb-2">Requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Modern browser with MediaDevices API support</li>
                <li>Chrome 25+, Firefox 44+, Safari 14.1+, or Edge 79+</li>
                <li>Enable JavaScript</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (permissionState === 'denied') {
    return (
      <div className={`p-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 rounded-lg ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <MicrophoneSlashIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Microphone Access Denied
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              {error || "Microphone access has been denied. Please follow the instructions below to enable it."}
            </p>
            
            <div className="bg-yellow-50 dark:bg-yellow-800 p-3 rounded border text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                How to enable microphone access:
              </p>
              {getBrowserSpecificInstructions(browserInfo)}
            </div>
            
            <button
              onClick={handleRequestPermission}
              className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (permissionState === 'unavailable') {
    return (
      <div className={`p-4 bg-orange-100 dark:bg-orange-900 border border-orange-400 dark:border-orange-600 rounded-lg ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
              Microphone Unavailable
            </h3>
            <p className="text-orange-700 dark:text-orange-300 mb-4">
              {error || "No microphone could be found or accessed."}
            </p>
            
            <div className="text-sm text-orange-600 dark:text-orange-400">
              <p className="font-medium mb-2">Possible solutions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Connect a microphone or headset</li>
                <li>Check that your microphone is not being used by another application</li>
                <li>Restart your browser</li>
                <li>Check your system's microphone settings</li>
              </ul>
            </div>
            
            <button
              onClick={handleRequestPermission}
              className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default state: unknown or checking
  return (
    <div className={`p-4 bg-blue-100 dark:bg-blue-900 border border-blue-400 dark:border-blue-600 rounded-lg ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <MicrophoneIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Microphone Permission Required
          </h3>
          <p className="text-blue-700 dark:text-blue-300 mb-4">
            To use voice features, please allow microphone access when prompted.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-800 p-3 rounded border text-sm mb-4">
            <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              What to expect:
            </p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
              <li>Your browser will ask for microphone permission</li>
              <li>Click "Allow" or "Yes" to enable voice features</li>
              <li>Your microphone will only be active while recording</li>
              <li>You can revoke permissions anytime in browser settings</li>
            </ul>
          </div>
          
          <button
            onClick={handleRequestPermission}
            disabled={permissionState === 'checking'}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {permissionState === 'checking' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Checking Permissions...
              </>
            ) : (
              <>
                <MicrophoneIcon className="w-5 h-5" />
                Request Microphone Access
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function getBrowserSpecificInstructions(browserInfo: { name: string; isMobile: boolean; isIOS: boolean; iosVersion: number | null }) {
  const { name, isMobile, isIOS, iosVersion } = browserInfo;
  
  if (isMobile) {
    if (isIOS) {
      // Enhanced iOS-specific guidance
      return (
        <div>
          <ol className="list-decimal list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
            <li>Open iOS Settings app</li>
            <li>Go to Safari → Website Settings (or Privacy & Security → Microphone)</li>
            <li>Find this website and set Microphone to "Allow"</li>
            {iosVersion && iosVersion >= 15 && (
              <li>Alternatively: Go to Settings → Privacy & Security → Microphone → Safari</li>
            )}
            <li>Return to this page and refresh</li>
          </ol>
          {iosVersion && iosVersion < 14 && (
            <div className="mt-2 p-2 bg-yellow-200 dark:bg-yellow-800 rounded text-sm">
              <p className="font-medium">Note for iOS {iosVersion}:</p>
              <p>Consider updating to iOS 14.3+ for better microphone support and reliability.</p>
            </div>
          )}
        </div>
      );
    }
    
    switch (name) {
      case 'safari':
        return (
          <ol className="list-decimal list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
            <li>Open iOS Settings</li>
            <li>Go to Safari → Website Settings</li>
            <li>Find Microphone and select "Allow"</li>
            <li>Return to this page and refresh</li>
          </ol>
        );
      case 'chrome':
        return (
          <ol className="list-decimal list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
            <li>Tap the microphone icon in the address bar</li>
            <li>Select "Allow" for this website</li>
            <li>If no icon appears, check site settings in Chrome menu</li>
          </ol>
        );
      default:
        return (
          <p className="text-yellow-700 dark:text-yellow-300">
            Check your browser's site settings and enable microphone access for this website.
          </p>
        );
    }
  }
  
  // Desktop browsers
  switch (name) {
    case 'chrome':
      return (
        <ol className="list-decimal list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
          <li>Click the microphone icon in the address bar</li>
          <li>Select "Always allow" for this site</li>
          <li>Refresh the page if needed</li>
        </ol>
      );
    case 'firefox':
      return (
        <ol className="list-decimal list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
          <li>Click the microphone icon in the address bar</li>
          <li>Select "Allow" and check "Remember this decision"</li>
          <li>Refresh the page if needed</li>
        </ol>
      );
    case 'safari':
      return (
        <ol className="list-decimal list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
          <li>Go to Safari → Settings for This Website</li>
          <li>Set Microphone to "Allow"</li>
          <li>Refresh the page</li>
        </ol>
      );
    case 'edge':
      return (
        <ol className="list-decimal list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
          <li>Click the microphone icon in the address bar</li>
          <li>Select "Allow" for this site</li>
          <li>Refresh the page if needed</li>
        </ol>
      );
    default:
      return (
        <p className="text-yellow-700 dark:text-yellow-300">
          Look for a microphone icon in your browser's address bar and click "Allow" when prompted.
        </p>
      );
  }
}

// Icon components
function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function MicrophoneSlashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 5.586l12.828 12.828M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function ExclamationTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
} 