import { useState, useEffect, useCallback, useRef } from "react";

export type MicrophonePermissionState =
  | "unknown"
  | "checking"
  | "granted"
  | "denied"
  | "unavailable"
  | "unsupported";

interface MicrophonePermissionHook {
  permissionState: MicrophonePermissionState;
  requestPermission: () => Promise<boolean>;
  hasPermission: boolean;
  error: string | null;
  isSupported: boolean;
  browserInfo: {
    name: string;
    isMobile: boolean;
    requiresHTTPS: boolean;
    supportsPermissionAPI: boolean;
    isIOS: boolean;
    iosVersion: number | null;
  };
}

export function useMicrophonePermission(): MicrophonePermissionHook {
  const [permissionState, setPermissionState] =
    useState<MicrophonePermissionState>("unknown");
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Browser detection (keeping minimal info for UI purposes only)
  const browserInfo = {
    name: typeof window !== "undefined" ? getBrowserName() : "unknown",
    isMobile: typeof window !== "undefined" ? isMobileDevice() : false,
    requiresHTTPS: false, // Removed HTTPS requirement checking
    supportsPermissionAPI:
      typeof window !== "undefined" && "permissions" in navigator,
    isIOS: typeof window !== "undefined" ? isIOSDevice() : false,
    iosVersion: typeof window !== "undefined" ? getIOSVersion() : null,
  };

  // Simplified support check - only check if MediaDevices API is available
  const isSupported =
    typeof window !== "undefined" &&
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const hasPermission = permissionState === "granted";

  // Check initial permission state
  useEffect(() => {
    if (!isSupported) {
      setPermissionState("unsupported");
      setError(
        "Your browser does not support microphone access. MediaDevices API is not available."
      );
      return;
    }

    // No more HTTPS or other complex checks - just check permissions
    checkPermissionState();
  }, [isSupported]);

  const checkPermissionState = useCallback(async () => {
    if (!isSupported) return;

    try {
      // Try to check permission using Permissions API if available
      if (browserInfo.supportsPermissionAPI) {
        const permission = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });

        switch (permission.state) {
          case "granted":
            setPermissionState("granted");
            setError(null);
            return;
          case "denied":
            setPermissionState("denied");
            setError(
              "Microphone access has been denied. Please check your browser settings and allow microphone access for this site."
            );
            return;
          case "prompt":
            setPermissionState("unknown");
            setError(null);
            return;
        }
      }

      // For browsers without Permissions API, we'll need to actually request to know the state
      setPermissionState("unknown");
      setError(null);
    } catch (error) {
      console.warn("Unable to check microphone permission state:", error);
      setPermissionState("unknown");
      setError(null);
    }
  }, [isSupported, browserInfo.supportsPermissionAPI]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Microphone access is not supported in your browser.");
      return false;
    }

    if (hasPermission) {
      return true;
    }

    setPermissionState("checking");
    setError(null);

    try {
      console.log("🎤 Requesting microphone permission...");

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log("✅ Microphone permission granted");

      // Store stream reference and immediately stop it
      // We only needed it to check permissions
      streamRef.current = stream;
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      setPermissionState("granted");
      setError(null);
      return true;
    } catch (error: any) {
      console.error("❌ Microphone permission error:", error);

      let errorMessage = "Failed to access microphone.";

      switch (error.name) {
        case "NotAllowedError":
          setPermissionState("denied");
          errorMessage = getMicrophonePermissionGuidance(browserInfo);
          break;
        case "NotFoundError":
          setPermissionState("unavailable");
          errorMessage =
            "No microphone found. Please connect a microphone and try again.";
          break;
        case "NotSupportedError":
          setPermissionState("unsupported");
          errorMessage =
            "Microphone access is not supported in your browser or requires HTTPS.";
          break;
        case "NotReadableError":
          setPermissionState("unavailable");
          errorMessage =
            "Microphone is being used by another application. Please close other applications and try again.";
          break;
        case "OverconstrainedError":
          setPermissionState("unavailable");
          errorMessage =
            "Microphone constraints could not be satisfied. Please try with a different microphone.";
          break;
        case "SecurityError":
          setPermissionState("denied");
          errorMessage =
            "Microphone access blocked due to security restrictions. Please check your browser settings.";
          break;
        case "AbortError":
          setPermissionState("unknown");
          errorMessage = "Microphone request was cancelled. Please try again.";
          break;
        default:
          setPermissionState("denied");
          errorMessage = `Microphone access failed: ${
            error.message || "Unknown error"
          }`;
      }

      setError(errorMessage);
      return false;
    }
  }, [isSupported, hasPermission, browserInfo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    permissionState,
    requestPermission,
    hasPermission,
    error,
    isSupported,
    browserInfo,
  };
}

// Helper functions
function getBrowserName(): string {
  if (typeof window === "undefined") return "unknown";

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("chrome")) return "chrome";
  if (userAgent.includes("firefox")) return "firefox";
  if (userAgent.includes("safari") && !userAgent.includes("chrome"))
    return "safari";
  if (userAgent.includes("edge")) return "edge";
  if (userAgent.includes("opera")) return "opera";

  return "unknown";
}

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function isIOSDevice(): boolean {
  if (typeof window === "undefined") return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function getIOSVersion(): number | null {
  if (typeof window === "undefined" || !isIOSDevice()) return null;

  const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

function getMicrophonePermissionGuidance(browserInfo: {
  name: string;
  isMobile: boolean;
}): string {
  const { name, isMobile } = browserInfo;
  const isIOS = isIOSDevice();

  if (isMobile) {
    if (isIOS) {
      // iOS-specific guidance
      const iosVersion = getIOSVersion();
      return `Microphone access denied. On iPhone/iPad (iOS ${
        iosVersion || "unknown"
      }): Go to Settings > Safari > Website Settings > Microphone, and select "Allow" for this site. You may also need to check Settings > Privacy & Security > Microphone and ensure Safari is enabled.`;
    }

    switch (name) {
      case "safari":
        return "Microphone access denied. On iOS Safari: Go to Settings > Safari > Website Settings > Microphone, and allow access for this site.";
      case "chrome":
        return 'Microphone access denied. On mobile Chrome: Tap the microphone icon in the address bar and select "Allow".';
      default:
        return "Microphone access denied. Please check your browser settings and allow microphone access for this site.";
    }
  } else {
    switch (name) {
      case "chrome":
        return 'Microphone access denied. Click the microphone icon in the address bar and select "Always allow". You may need to reload the page.';
      case "firefox":
        return 'Microphone access denied. Click the microphone icon in the address bar and select "Allow". You may need to reload the page.';
      case "safari":
        return 'Microphone access denied. Go to Safari > Settings for This Website > Microphone and select "Allow".';
      case "edge":
        return 'Microphone access denied. Click the microphone icon in the address bar and select "Allow". You may need to reload the page.';
      default:
        return "Microphone access denied. Please check your browser settings and allow microphone access for this site. You may need to reload the page.";
    }
  }
}
