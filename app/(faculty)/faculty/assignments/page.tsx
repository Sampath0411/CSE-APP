"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, BookOpen, Calendar, Award, Clock, CheckCircle2, Users, Save, XCircle, UserCheck, RefreshCw } from "lucide-react";
import { assignments as defaultAssignments, subjects, students, type Assignment, type Teacher } from "@/lib/data";
import {
  getSubmissions,
  markAssignmentAsSubmitted,
  unmarkAssignmentAsSubmitted,
  type AssignmentSubmission
} from "@/lib/assignment-submissions-store";
import {
  getAllAssignments,
  saveAssignments,
  updateAssignmentStatus,
  deleteAssignment as deleteAssignmentFromStore
} from "@/lib/assignments-store";

export default function AssignmentsPage() {
  const [assignmentList, setAssignmentList] = useState<Assignment[]>([]);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [faculty, setFaculty] = useState<Teacher | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedAssignmentForMarking, setSelectedAssignmentForMarking] = useState<Assignment | null>(null);
  const [markingRemark, setMarkingRemark] = useState("");
  const [showMarkingDialog, setShowMarkingDialog] = useState(false);
  const [studentSubmissions, setStudentSubmissions] = useState<Map<string, boolean>>(new Map());

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subjectId: "",
    dueDate: "",
    maxMarks: "",
  });

  useEffect(() => {
    const storedFaculty = sessionStorage.getItem("facultyUser");
    if (storedFaculty) {
      setFaculty(JSON.parse(storedFaculty));
    }
    loadSubmissions();
    const loadedAssignments = getAllAssignments(defaultAssignments);
    setAssignmentList(loadedAssignments);
  }, []);

  useEffect(() => {
    if (assignmentList.length > 0) {
      saveAssignments(assignmentList);
    }
  }, [assignmentList]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAssignmentList(prev => updateAssignmentStatus(prev));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadSubmissions = () => {
    setSubmissions(getSubmissions());
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || subjectId;
  };

  const getSubjectCode = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.code || subjectId;
  };

  const handleOpenAdd = () => {
    setEditingAssignment(null);
    setFormData({ title: "", description: "", subjectId: "", dueDate: "", maxMarks: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      subjectId: assignment.subjectId,
      dueDate: assignment.dueDate,
      maxMarks: assignment.maxMarks.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.subjectId || !formData.dueDate || !formData.maxMarks) return;

    if (editingAssignment) {
      setAssignmentList(prev =>
        prev.map(a =>
          a.id === editingAssignment.id
            ? { ...a, title: formData.title, description: formData.description, subjectId: formData.subjectId, dueDate: formData.dueDate, maxMarks: parseInt(formData.maxMarks) }
            : a
        )
      );
    } else {
      const newId = `ASG${Date.now().toString(36).toUpperCase()}`;
      const newAssignment: Assignment = {
        id: newId,
        title: formData.title,
        description: formData.description,
        subjectId: formData.subjectId,
        dueDate: formData.dueDate,
        maxMarks: parseInt(formData.maxMarks),
        status: "active",
        createdAt: new Date().toISOString().split("T")[0],
      };
      setAssignmentList(prev => [...prev, newAssignment]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setAssignmentList(prev => prev.filter(a => a.id !== id));
    deleteAssignmentFromStore(id);
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const openMarkingDialog = (assignment: Assignment) => {
    setSelectedAssignmentForMarking(assignment);
    setMarkingRemark("");
    const currentSubmissions = new Map<string, boolean>();
    students.forEach(student => {
      const hasSubmitted = submissions.some(s => s.assignmentId === assignment.id && s.studentId === student.id);
      currentSubmissions.set(student.id, hasSubmitted);
    });
    setStudentSubmissions(currentSubmissions);
    setShowMarkingDialog(true);
  };

  const toggleStudentSubmission = (studentId: string, checked: boolean) => {
    setStudentSubmissions(prev => {
      const newMap = new Map(prev);
      newMap.set(studentId, checked);
      return newMap;
    });
  };

  const saveMarkingChanges = () => {
    if (!selectedAssignmentForMarking || !faculty) return;
    students.forEach(student => {
      const shouldBeSubmitted = studentSubmissions.get(student.id) || false;
      const currentlySubmitted = submissions.some(s => s.assignmentId === selectedAssignmentForMarking!.id && s.studentId === student.id);
      if (shouldBeSubmitted && !currentlySubmitted) {
        markAssignmentAsSubmitted(selectedAssignmentForMarking.id, student.id, faculty.id, faculty.name, markingRemark || undefined);
      } else if (!shouldBeSubmitted && currentlySubmitted) {
        unmarkAssignmentAsSubmitted(selectedAssignmentForMarking.id, student.id);
      }
    });
    loadSubmissions();
    setShowMarkingDialog(false);
    setSelectedAssignmentForMarking(null);
  };

  const getSubmissionCount = (assignmentId: string) => submissions.filter(s => s.assignmentId === assignmentId).length;
  const activeAssignments = assignmentList.filter(a => a.status === "active");
  const closedAssignments = assignmentList.filter(a => a.status === "closed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
            <p className="text-muted-foreground">Manage and create assignments for students</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { const loaded = getAllAssignments(defaultAssignments); setAssignmentList(loaded); }}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 mr-2" />Add Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingAssignment ? "Edit Assignment" : "Create Assignment"}</DialogTitle>
                <DialogDescription>{editingAssignment ? "Update the assignment details" : "Create a new assignment for students"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Assignment Title *</Label>
                  <Input id="title" placeholder="Enter assignment title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select value={formData.subjectId} onValueChange={(value) => setFormData({ ...formData, subjectId: value })}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>{subject.name} ({subject.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Enter assignment description..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input id="dueDate" type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxMarks">Max Marks *</Label>
                    <Input id="maxMarks" type="number" placeholder="e.g., 25" value={formData.maxMarks} onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })} />
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full" disabled={!formData.title || !formData.subjectId || !formData.dueDate || !formData.maxMarks}>
                  {editingAssignment ? "Update Assignment" : "Create Assignment"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            Active Assignments <Badge variant="secondary" className="ml-2">{activeAssignments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="closed">
            Closed Assignments <Badge variant="secondary" className="ml-2">{closedAssignments.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Assignments</CardTitle>
              <CardDescription>Currently open assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {activeAssignments.map((assignment) => {
                    const submissionCount = getSubmissionCount(assignment.id);
                    const submissionPercentage = Math.round((submissionCount / students.length) * 100);
                    return (
                      <div key={assignment.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{assignment.title}</span>
                            <Badge variant="secondary">{getSubjectCode(assignment.subjectId)}</Badge>
                            {isOverdue(assignment.dueDate) ? (
                              <Badge variant="destructive">Overdue</Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-100 text-green-700">Active</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{getSubjectName(assignment.subjectId)}</p>
                          {assignment.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{assignment.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Due: {formatDate(assignment.dueDate)}</span>
                            <span className="flex items-center gap-1"><Award className="h-4 w-4" />{assignment.maxMarks} marks</span>
                            <span className="flex items-center gap-1"><Users className="h-4 w-4" />{submissionCount}/{students.length} submitted ({submissionPercentage}%)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => openMarkingDialog(assignment)} className="text-primary">
                            <UserCheck className="h-4 w-4 mr-1" />Mark Submissions
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(assignment)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(assignment.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="closed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Closed Assignments</CardTitle>
              <CardDescription>Past assignments that are now closed</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {closedAssignments.map((assignment) => {
                    const submissionCount = getSubmissionCount(assignment.id);
                    const submissionPercentage = Math.round((submissionCount / students.length) * 100);
                    return (
                      <div key={assignment.id} className="flex items-start justify-between p-4 border rounded-lg bg-muted/30">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-muted-foreground">{assignment.title}</span>
                            <Badge variant="secondary">{getSubjectCode(assignment.subjectId)}</Badge>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />Closed
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{getSubjectName(assignment.subjectId)}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Due: {formatDate(assignment.dueDate)}</span>
                            <span className="flex items-center gap-1"><Award className="h-4 w-4" />{assignment.maxMarks} marks</span>
                            <span className="flex items-center gap-1"><Users className="h-4 w-4" />{submissionCount}/{students.length} submitted ({submissionPercentage}%)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => openMarkingDialog(assignment)}>
                            <UserCheck className="h-4 w-4 mr-1" />View/Mark
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(assignment.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showMarkingDialog} onOpenChange={setShowMarkingDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />Mark Student Submissions
            </DialogTitle>
            <DialogDescription>
              {selectedAssignmentForMarking && (
                <span>{selectedAssignmentForMarking.title} - {getSubjectName(selectedAssignmentForMarking.subjectId)}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedAssignmentForMarking && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-xl font-bold">{students.length}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="text-xl font-bold text-green-600">{getSubmissionCount(selectedAssignmentForMarking.id)}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Not Submitted</p>
                  <p className="text-xl font-bold text-red-600">{students.length - getSubmissionCount(selectedAssignmentForMarking.id)}</p>
                </div>
              </div>
              <div>
                <Label htmlFor="remark">Remark (optional)</Label>
                <Input id="remark" placeholder="e.g., Submitted via email..." value={markingRemark} onChange={(e) => setMarkingRemark(e.target.value)} className="mt-2" />
              </div>
              <div className="border rounded-lg">
                <div className="p-3 bg-muted border-b flex items-center justify-between">
                  <span className="font-medium">Student</span>
                  <span className="font-medium">Submitted</span>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="divide-y">
                    {students.map((student) => {
                      const isSubmitted = studentSubmissions.get(student.id) || false;
                      return (
                        <div key={student.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {student.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-xs text-muted-foreground">Roll: {student.rollNumber}</p>
                            </div>
                          </div>
                          <Checkbox checked={isSubmitted} onCheckedChange={(checked) => toggleStudentSubmission(student.id, checked as boolean)} />
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { const newMap = new Map(); students.forEach(s => newMap.set(s.id, true)); setStudentSubmissions(newMap); }}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />Mark All
                </Button>
                <Button variant="outline" size="sm" onClick={() => { const newMap = new Map(); students.forEach(s => newMap.set(s.id, false)); setStudentSubmissions(newMap); }}>
                  <XCircle className="h-4 w-4 mr-1" />Unmark All
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkingDialog(false)}>Cancel</Button>
            <Button onClick={saveMarkingChanges}>
              <Save className="h-4 w-4 mr-2" />Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
