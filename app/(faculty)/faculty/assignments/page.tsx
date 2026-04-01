"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Trash2, BookOpen, Calendar, Award, Clock, CheckCircle2 } from "lucide-react";
import { assignments, subjects, type Assignment } from "@/lib/data";

export default function AssignmentsPage() {
  const [assignmentList, setAssignmentList] = useState<Assignment[]>(assignments);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subjectId: "",
    dueDate: "",
    maxMarks: "",
  });

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
    setFormData({
      title: "",
      description: "",
      subjectId: "",
      dueDate: "",
      maxMarks: "",
    });
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
    if (!formData.title || !formData.subjectId || !formData.dueDate || !formData.maxMarks) {
      return;
    }

    if (editingAssignment) {
      setAssignmentList(prev =>
        prev.map(a =>
          a.id === editingAssignment.id
            ? {
                ...a,
                title: formData.title,
                description: formData.description,
                subjectId: formData.subjectId,
                dueDate: formData.dueDate,
                maxMarks: parseInt(formData.maxMarks),
              }
            : a
        )
      );
    } else {
      const newAssignment: Assignment = {
        id: `ASG${String(assignmentList.length + 1).padStart(3, '0')}`,
        title: formData.title,
        description: formData.description,
        subjectId: formData.subjectId,
        dueDate: formData.dueDate,
        maxMarks: parseInt(formData.maxMarks),
        status: "active",
        createdAt: new Date().toISOString().split('T')[0],
      };
      setAssignmentList(prev => [...prev, newAssignment]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setAssignmentList(prev => prev.filter(a => a.id !== id));
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
            <p className="text-muted-foreground">
              Manage and create assignments for students
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingAssignment ? "Edit Assignment" : "Create Assignment"}</DialogTitle>
              <DialogDescription>
                {editingAssignment ? "Update the assignment details" : "Create a new assignment for students"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Assignment Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter assignment title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter assignment description and requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxMarks">Max Marks *</Label>
                  <Input
                    id="maxMarks"
                    type="number"
                    placeholder="e.g., 25"
                    value={formData.maxMarks}
                    onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                  />
                </div>
              </div>
              <Button
                onClick={handleSave}
                className="w-full"
                disabled={!formData.title || !formData.subjectId || !formData.dueDate || !formData.maxMarks}
              >
                {editingAssignment ? "Update Assignment" : "Create Assignment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Assignments</CardTitle>
          <CardDescription>
            {assignmentList.length} assignment{assignmentList.length !== 1 ? 's' : ''} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {assignmentList.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{assignment.title}</span>
                      <Badge variant="secondary">{getSubjectCode(assignment.subjectId)}</Badge>
                      {assignment.status === "closed" ? (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Closed
                        </Badge>
                      ) : isOverdue(assignment.dueDate) ? (
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
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {assignment.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(assignment)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(assignment.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
