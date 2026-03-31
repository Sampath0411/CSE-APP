// Anti-Proxy Protection Utilities
// Client-side only - no external libraries

export interface AntiProxySession {
  subjectId?: string;
  subjectName?: string;
  period?: number;
  otp?: string;
  otpExpiry?: number;
  teacherLocation?: { lat: number; lng: number };
  fingerprints: Record<string, string>;
  sessionActive: boolean;
}

// Session storage keys
export const SESSION_KEYS = {
  subjectId: "antiProxy_subjectId",
  subjectName: "antiProxy_subjectName",
  period: "antiProxy_period",
  otp: "antiProxy_otp",
  otpExpiry: "antiProxy_otpExpiry",
  teacherLocation: "antiProxy_teacherLocation",
  fingerprints: "antiProxy_fingerprints",
  sessionActive: "antiProxy_sessionActive",
};

// Generate device fingerprint using browser characteristics
export function generateDeviceFingerprint(): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Canvas fingerprint
  ctx!.textBaseline = "top";
  ctx!.font = "14px 'Arial'";
  ctx!.fillText("Anti-Proxy Fingerprint", 2, 2);
  ctx!.fillStyle = "#f60";
  ctx!.fillRect(125, 1, 62, 20);
  const canvasData = canvas.toDataURL();

  const components = [
    navigator.userAgent,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.language,
    navigator.platform,
    typeof navigator.hardwareConcurrency !== "undefined" ? navigator.hardwareConcurrency : "",
    canvasData,
  ];

  // Simple hash function
  const str = components.join("###");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Haversine formula to calculate distance between two coordinates in meters
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Get current session state
export function getSessionState(): AntiProxySession {
  if (typeof window === "undefined") {
    return { fingerprints: {}, sessionActive: false };
  }

  const subjectId = localStorage.getItem(SESSION_KEYS.subjectId);
  const subjectName = localStorage.getItem(SESSION_KEYS.subjectName);
  const period = localStorage.getItem(SESSION_KEYS.period);
  const otp = localStorage.getItem(SESSION_KEYS.otp);
  const otpExpiry = localStorage.getItem(SESSION_KEYS.otpExpiry);
  const teacherLocation = localStorage.getItem(SESSION_KEYS.teacherLocation);
  const fingerprints = localStorage.getItem(SESSION_KEYS.fingerprints);
  const sessionActive = localStorage.getItem(SESSION_KEYS.sessionActive);

  return {
    subjectId: subjectId || undefined,
    subjectName: subjectName || undefined,
    period: period ? parseInt(period) : undefined,
    otp: otp || undefined,
    otpExpiry: otpExpiry ? parseInt(otpExpiry) : undefined,
    teacherLocation: teacherLocation ? JSON.parse(teacherLocation) : undefined,
    fingerprints: fingerprints ? JSON.parse(fingerprints) : {},
    sessionActive: sessionActive === "true",
  };
}

// Clear session data
export function clearSession(): void {
  if (typeof window === "undefined") return;
  Object.values(SESSION_KEYS).forEach((key) => localStorage.removeItem(key));
}

// Validate OTP
export function validateOTP(inputOtp: string): { valid: boolean; message: string } {
  const session = getSessionState();

  if (!session.otp) {
    return { valid: false, message: "No active OTP session" };
  }

  if (session.otpExpiry && Date.now() > session.otpExpiry) {
    return { valid: false, message: "OTP has expired" };
  }

  if (session.otp !== inputOtp) {
    return { valid: false, message: "Invalid OTP" };
  }

  return { valid: true, message: "OTP verified" };
}

// Get student location with high accuracy
export function getStudentLocation(): Promise<{
  lat: number;
  lng: number;
  accuracy: number;
}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (err) => {
        let message = "Unable to get location";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = "Location permission denied";
            break;
          case err.POSITION_UNAVAILABLE:
            message = "Location unavailable";
            break;
          case err.TIMEOUT:
            message = "Location request timed out";
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  });
}

// Validate location against teacher's location
export function validateLocation(
  studentLat: number,
  studentLng: number,
  teacherLat: number,
  teacherLng: number,
  maxDistance: number = 10
): { valid: boolean; distance: number; message: string } {
  const distance = calculateDistance(studentLat, studentLng, teacherLat, teacherLng);

  if (distance <= maxDistance) {
    return {
      valid: true,
      distance,
      message: `Within range (${Math.round(distance)}m)`,
    };
  }

  return {
    valid: false,
    distance,
    message: `Too far from classroom (${Math.round(distance)}m away, max ${maxDistance}m)`,
  };
}

// Register device fingerprint for student
export function registerFingerprint(studentId: string): { success: boolean; message: string } {
  const session = getSessionState();
  const fingerprint = generateDeviceFingerprint();
  const fingerprints = session.fingerprints || {};

  // Check if this fingerprint is already registered to another student
  for (const [existingId, existingFp] of Object.entries(fingerprints)) {
    if (existingFp === fingerprint && existingId !== studentId) {
      return {
        success: false,
        message: "Suspicious: This device was already used by another student",
      };
    }
  }

  // Check if this student already has a different fingerprint
  if (fingerprints[studentId] && fingerprints[studentId] !== fingerprint) {
    return {
      success: false,
      message: "Proxy detected: Different device from previous attendance",
    };
  }

  // Register fingerprint
  fingerprints[studentId] = fingerprint;
  localStorage.setItem(SESSION_KEYS.fingerprints, JSON.stringify(fingerprints));

  return {
    success: true,
    message: "Device registered",
  };
}

// Check if session is active
export function isSessionActive(): boolean {
  const session = getSessionState();
  return session.sessionActive;
}
