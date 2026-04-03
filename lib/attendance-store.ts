import { AttendanceRecord, AlertLog } from "./data";
import { checkAndSendAttendanceAlert } from "./email-service";

// In-memory store for new attendance records (simulating database)
let newAttendanceRecords: AttendanceRecord[] = [];
let newAlertLogs: AlertLog[] = [];

export function addAttendanceRecord(record: Omit<AttendanceRecord, "id">): AttendanceRecord {
  const newRecord: AttendanceRecord = {
    ...record,
    id: `ATT${Date.now()}`,
  };
  newAttendanceRecords.push(newRecord);

  // Check if attendance falls below 75% and send email alert
  // Use setTimeout to avoid blocking the main thread
  setTimeout(() => {
    checkAndSendAttendanceAlert(record.studentId, record.subjectId);
  }, 100);

  return newRecord;
}

export function addBulkAttendance(records: Omit<AttendanceRecord, "id">[]): AttendanceRecord[] {
  return records.map((record) => addAttendanceRecord(record));
}

export function getNewAttendanceRecords(): AttendanceRecord[] {
  return newAttendanceRecords;
}

export function addAlertLog(log: Omit<AlertLog, "id">): AlertLog {
  const newLog: AlertLog = {
    ...log,
    id: `AL${Date.now()}`,
  };
  newAlertLogs.push(newLog);
  return newLog;
}

export function getNewAlertLogs(): AlertLog[] {
  return newAlertLogs;
}

export function clearStore(): void {
  newAttendanceRecords = [];
  newAlertLogs = [];
}

// Update an existing attendance record
export function updateAttendanceRecord(
  recordId: string,
  updates: Partial<AttendanceRecord>
): AttendanceRecord | null {
  const recordIndex = newAttendanceRecords.findIndex((r) => r.id === recordId);
  if (recordIndex === -1) {
    // Also check in the main attendanceRecords from data.ts
    return null;
  }

  newAttendanceRecords[recordIndex] = {
    ...newAttendanceRecords[recordIndex],
    ...updates,
  };

  return newAttendanceRecords[recordIndex];
}

// Get a single attendance record by ID
export function getAttendanceRecordById(recordId: string): AttendanceRecord | null {
  return (
    newAttendanceRecords.find((r) => r.id === recordId) || null
  );
}

// Delete an attendance record
export function deleteAttendanceRecord(recordId: string): boolean {
  const initialLength = newAttendanceRecords.length;
  newAttendanceRecords = newAttendanceRecords.filter((r) => r.id !== recordId);
  return newAttendanceRecords.length < initialLength;
}
