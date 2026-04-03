"use client";

import { Assignment } from "@/lib/data";

const ASSIGNMENTS_KEY = "assignments_data";

// Initialize assignments from localStorage or return null
export function getStoredAssignments(): Assignment[] | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(ASSIGNMENTS_KEY);
  return stored ? JSON.parse(stored) : null;
}

// Save assignments to localStorage
export function saveAssignments(assignments: Assignment[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
}

// Auto-update assignment status based on due date
export function updateAssignmentStatus(assignments: Assignment[]): Assignment[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return assignments.map(assignment => {
    const dueDate = new Date(assignment.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    // Auto-close if past due date
    if (dueDate < today && assignment.status === "active") {
      return { ...assignment, status: "closed" };
    }
    return assignment;
  });
}

// Get all assignments (with auto-updated status)
export function getAllAssignments(defaultAssignments: Assignment[]): Assignment[] {
  const stored = getStoredAssignments();
  if (stored) {
    // Update status based on dates and return
    return updateAssignmentStatus(stored);
  }
  // First time - save defaults and return them
  saveAssignments(defaultAssignments);
  return defaultAssignments;
}

// Add new assignment
export function addAssignment(assignment: Assignment): void {
  const assignments = getStoredAssignments() || [];
  assignments.push(assignment);
  saveAssignments(assignments);
}

// Update assignment
export function updateAssignment(updatedAssignment: Assignment): void {
  const assignments = getStoredAssignments() || [];
  const index = assignments.findIndex(a => a.id === updatedAssignment.id);
  if (index >= 0) {
    assignments[index] = updatedAssignment;
    saveAssignments(assignments);
  }
}

// Delete assignment
export function deleteAssignment(assignmentId: string): void {
  const assignments = getStoredAssignments() || [];
  const filtered = assignments.filter(a => a.id !== assignmentId);
  saveAssignments(filtered);
}

// Close assignment manually
export function closeAssignment(assignmentId: string): void {
  const assignments = getStoredAssignments() || [];
  const index = assignments.findIndex(a => a.id === assignmentId);
  if (index >= 0) {
    assignments[index].status = "closed";
    saveAssignments(assignments);
  }
}

// Reopen assignment
export function reopenAssignment(assignmentId: string): void {
  const assignments = getStoredAssignments() || [];
  const index = assignments.findIndex(a => a.id === assignmentId);
  if (index >= 0) {
    assignments[index].status = "active";
    saveAssignments(assignments);
  }
}
