import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables are not set. Supabase features will be disabled."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SessionRecord {
  id?: string;
  session_code: string;
  subject_id: string;
  subject_name: string;
  period: number;
  otp?: string;
  otp_expiry?: number;
  teacher_location?: { lat: number; lng: number };
  active: boolean;
  created_at?: string;
}

// Store session in Supabase
export async function storeSessionInSupabase(
  sessionData: SessionRecord
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("attendance_sessions").upsert({
      session_code: sessionData.session_code,
      subject_id: sessionData.subject_id,
      subject_name: sessionData.subject_name,
      period: sessionData.period,
      otp: sessionData.otp,
      otp_expiry: sessionData.otp_expiry,
      teacher_location: sessionData.teacher_location,
      active: sessionData.active,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Supabase error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to store session:", err);
    return { success: false, error: "Failed to store session" };
  }
}

// Get session from Supabase by code
export async function getSessionFromSupabase(
  sessionCode: string
): Promise<{ success: boolean; session?: SessionRecord; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("session_code", sessionCode)
      .eq("active", true)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Session not found or expired" };
    }

    // Check if session is expired (8 hours)
    const createdAt = new Date(data.created_at).getTime();
    const SESSION_DURATION = 8 * 60 * 60 * 1000;
    if (Date.now() - createdAt > SESSION_DURATION) {
      // Deactivate expired session
      await supabase
        .from("attendance_sessions")
        .update({ active: false })
        .eq("session_code", sessionCode);
      return { success: false, error: "Session has expired" };
    }

    return {
      success: true,
      session: {
        id: data.id,
        session_code: data.session_code,
        subject_id: data.subject_id,
        subject_name: data.subject_name,
        period: data.period,
        otp: data.otp,
        otp_expiry: data.otp_expiry,
        teacher_location: data.teacher_location,
        active: data.active,
        created_at: data.created_at,
      },
    };
  } catch (err) {
    console.error("Failed to get session:", err);
    return { success: false, error: "Failed to retrieve session" };
  }
}

// End session in Supabase
export async function endSessionInSupabase(
  sessionCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("attendance_sessions")
      .update({ active: false })
      .eq("session_code", sessionCode);

    if (error) {
      console.error("Supabase error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to end session:", err);
    return { success: false, error: "Failed to end session" };
  }
}

// Letter Request Types
export type LetterType = "bonafide" | "study" | "loan" | "internship";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface LetterRequestRecord {
  id?: string;
  student_id: string;
  student_name: string;
  student_email: string;
  letter_type: LetterType;
  status: RequestStatus;
  requested_at: string;
  additional_details?: Record<string, string>;
  serial_number?: string;
  admin_notes?: string;
  processed_at?: string;
}

// Create letter request in Supabase
export async function createLetterRequest(
  requestData: LetterRequestRecord
): Promise<{ success: boolean; data?: LetterRequestRecord; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("letter_requests")
      .insert({
        student_id: requestData.student_id,
        student_name: requestData.student_name,
        student_email: requestData.student_email,
        letter_type: requestData.letter_type,
        status: "pending",
        requested_at: new Date().toISOString(),
        additional_details: requestData.additional_details,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Failed to create letter request:", err);
    return { success: false, error: "Failed to create letter request" };
  }
}

// Get all letter requests (for admin)
export async function getAllLetterRequests(): Promise<{
  success: boolean;
  data?: LetterRequestRecord[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("letter_requests")
      .select("*")
      .order("requested_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    console.error("Failed to get letter requests:", err);
    return { success: false, error: "Failed to retrieve letter requests" };
  }
}

// Get letter requests for a student
export async function getStudentLetterRequests(
  studentId: string
): Promise<{ success: boolean; data?: LetterRequestRecord[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("letter_requests")
      .select("*")
      .eq("student_id", studentId)
      .order("requested_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    console.error("Failed to get student letter requests:", err);
    return { success: false, error: "Failed to retrieve letter requests" };
  }
}

// Update letter request status (approve/reject)
export async function updateLetterRequestStatus(
  requestId: string,
  status: RequestStatus,
  adminNotes?: string,
  serialNumber?: string
): Promise<{ success: boolean; data?: LetterRequestRecord; error?: string }> {
  try {
    const updateData: Partial<LetterRequestRecord> = {
      status,
      admin_notes: adminNotes,
      processed_at: new Date().toISOString(),
    };

    if (serialNumber) {
      updateData.serial_number = serialNumber;
    }

    const { data, error } = await supabase
      .from("letter_requests")
      .update(updateData)
      .eq("id", requestId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Failed to update letter request:", err);
    return { success: false, error: "Failed to update letter request" };
  }
}

// Subscribe to letter request changes (real-time)
export function subscribeToLetterRequests(
  callback: (payload: {
    eventType: "INSERT" | "UPDATE" | "DELETE";
    new: LetterRequestRecord | null;
    old: LetterRequestRecord | null;
  }) => void
) {
  const subscription = supabase
    .channel("letter_requests_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "letter_requests" },
      (payload) => {
        callback({
          eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
          new: payload.new as LetterRequestRecord | null,
          old: payload.old as LetterRequestRecord | null,
        });
      }
    )
    .subscribe();

  return subscription;
}

// Subscribe to student's letter requests (real-time)
export function subscribeToStudentLetterRequests(
  studentId: string,
  callback: (payload: {
    eventType: "INSERT" | "UPDATE" | "DELETE";
    new: LetterRequestRecord | null;
    old: LetterRequestRecord | null;
  }) => void
) {
  const subscription = supabase
    .channel(`student_letters_${studentId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "letter_requests",
        filter: `student_id=eq.${studentId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
          new: payload.new as LetterRequestRecord | null,
          old: payload.old as LetterRequestRecord | null,
        });
      }
    )
    .subscribe();

  return subscription;
}
