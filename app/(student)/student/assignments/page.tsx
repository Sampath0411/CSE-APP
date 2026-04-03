"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { BookOpen, Calendar, Award, Clock, CheckCircle2, AlertCircle, Upload, FileText, UserCheck, RefreshCw } from "lucide-react";
import { assignments as defaultAssignments, subjects, type Assignment, type Student } from "@/lib/data";
import {
  getSubmissions,
  saveSubmissions,
  hasStudentSubmitted,
  getStudentSubmission,
  type AssignmentSubmission
} from "@/lib/assignment-submissions-store";
import { getAllAssignments, updateAssignmentStatus } from "@/lib/assignments-store";

export default function StudentAssignmentsPage() {
  const [assignmentList, setAssignmentList] = useState<Assignment[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  useEffect(() => {
    const storedStudent = sessionStorage.getItem("studentUser");
    if (storedStudent) {
      setStudent(JSON.parse(storedStudent));
    }

    // Load submissions from store
    setSubmissions(getSubmissions());

    // Load assignments from shared store (same as faculty portal)
    const loadedAssignments = getAllAssignments(defaultAssignments);
    setAssignmentList(loadedAssignments);
  }, []);

  // Auto-check for overdue assignments every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setAssignmentList(prev => updateAssignmentStatus(prev));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const refreshSubmissions = () => {
    setSubmissions(getSubmissions());
  };

  const hasSubmitted = (assignmentId: string) => {
    if (!student) return false;
    return hasStudentSubmitted(assignmentId, student.id);
  };

  const getSubmission = (assignmentId: string) => {
    if (!student) return null;
    return getStudentSubmission(assignmentId, student.id);
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || subjectId;
  };

  const getSubjectCode = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.code || subjectId;
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleSubmit = () => {
    if (!student || !selectedAssignment || !submissionContent.trim()) return;

    setIsSubmitting(true);

    const newSubmission: AssignmentSubmission = {
      assignmentId: selectedAssignment.id,
      studentId: student.id,
      submittedAt: new Date().toISOString(),
      content: submissionContent,
      status: "submitted",
    };

    const currentSubmissions = getSubmissions();
    const updatedSubmissions = [...currentSubmissions, newSubmission];
    saveSubmissions(updatedSubmissions);
    refreshSubmissions();

    setTimeout(() => {
      setIsSubmitting(false);
      setShowSubmitDialog(false);
      setSubmissionContent("");
      setSelectedAssignment(null);
    }, 1000);
  };

  const openSubmitDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionContent("");
    setShowSubmitDialog(true);
  };

  const refreshAssignments = () => {
    const loadedAssignments = getAllAssignments(defaultAssignments);
    setAssignmentList(loadedAssignments);
  };

  const activeAssignments = assignmentList.filter(a => a.status === "active");
  const closedAssignments = assignmentList.filter(a => a.status === "closed");

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Assignments</h1>
            <p className="text-muted-foreground">
              View and track your assignments
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refreshAssignments}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Active Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Active Assignments
            <Badge variant="secondary">{activeAssignments.length}</Badge>
          </CardTitle>
          <CardDescription>
            Currently open assignments that need to be submitted
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeAssignments.length > 0 ? (
            <div className="space-y-4">
              {activeAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className={`p-4 border rounded-lg ${
                    isOverdue(assignment.dueDate)
                      ? "border-destructive bg-destructive/5"
                      : "border-border hover:bg-muted/50"
                  } transition-colors`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{assignment.title}</span>
                        <Badge variant="secondary">{getSubjectCode(assignment.subjectId)}</Badge>
                        {isOverdue(assignment.dueDate) ? (
                          <Badge variant="destructive">Overdue</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getSubjectName(assignment.subjectId)}
                      </p>
                      {assignment.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {assignment.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {formatDate(assignment.dueDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          {assignment.maxMarks} marks
                        </span>
                      </div>

                      {/* Submit Button */}
                      {hasSubmitted(assignment.id) ? (
                        <div className="mt-4 flex items-center gap-2">
                          {getSubmission(assignment.id)?.markedByFaculty ? (
                            <>
                              <Badge variant="default" className="bg-blue-600">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Marked by Faculty
                              </Badge>
                              {getSubmission(assignment.id)?.facultyRemark && (
                                <span className="text-xs text-muted-foreground">
                                  Note: {getSubmission(assignment.id)?.facultyRemark}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Submitted
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(getSubmission(assignment.id)?.submittedAt || "").toLocaleString()}
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="mt-4"
                          onClick={() => openSubmitDialog(assignment)}
                          disabled={isOverdue(assignment.dueDate)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Submit Assignment
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No active assignments</p>
              <p className="text-sm">You&apos;re all caught up!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Closed Assignments */}
      {closedAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Completed Assignments
              <Badge variant="secondary">{closedAssignments.length}</Badge>
            </CardTitle>
            <CardDescription>
              Past assignments that are now closed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {closedAssignments.map((assignment) => {
                const submission = getSubmission(assignment.id);
                return (
                  <div
                    key={assignment.id}
                    className="p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-muted-foreground">{assignment.title}</span>
                          <Badge variant="secondary">{getSubjectCode(assignment.subjectId)}</Badge>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Closed
                          </Badge>
                          {submission && (
                            submission.markedByFaculty ? (
                              <Badge variant="default" className="bg-blue-600">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Faculty Marked
                              </Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Submitted
                              </Badge>
                            )
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getSubjectName(assignment.subjectId)}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {formatDate(assignment.dueDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            {assignment.maxMarks} marks
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Created: {formatDate(assignment.createdAt)}
                          </span>
                        </div>
                        {submission && (
                          <p className="text-xs text-green-600 mt-2">
                            Submitted on: {new Date(submission.submittedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Assignment Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Submit Assignment
            </DialogTitle>
            <DialogDescription>
              {selectedAssignment && (
                <span>
                  {selectedAssignment.title} - {getSubjectName(selectedAssignment.subjectId)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Submission</label>
              <Textarea
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="Enter your assignment submission here..."
                rows={6}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Max Marks: {selectedAssignment?.maxMarks}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!submissionContent.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">&#9696;</span>
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Assignment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
