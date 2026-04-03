"use client";

import { useState, useMemo } from "react";
import {
  students,
  subjects,
  teachers,
  attendanceRecords,
  getStudentById,
  getSubjectById,
  getTeacherById,
  type AttendanceRecord,
} from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  ClipboardList,
  Search,
  Download,
  Printer,
  Filter,
  Calendar,
  User,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 25;

export default function HODAttendanceLogPage() {
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Get unique dates
  const availableDates = useMemo(() => {
    const dates = new Set(attendanceRecords.map((r) => r.date));
    return Array.from(dates).sort().reverse();
  }, []);

  // Filter records
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter((record) => {
      const student = getStudentById(record.studentId);
      const subject = getSubjectById(record.subjectId);

      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchStudent =
          student?.name.toLowerCase().includes(query) ||
          student?.rollNumber.includes(query) ||
          student?.regdNo.includes(query);
        const matchSubject = subject?.name.toLowerCase().includes(query) ||
          subject?.code.toLowerCase().includes(query);
        if (!matchStudent && !matchSubject) return false;
      }

      // Date filter
      if (selectedDate !== "all" && record.date !== selectedDate) return false;

      // Subject filter
      if (selectedSubject !== "all" && record.subjectId !== selectedSubject)
        return false;

      // Status filter
      if (selectedStatus !== "all" && record.status !== selectedStatus)
        return false;

      // Teacher filter
      if (selectedTeacher !== "all" && record.markedBy !== selectedTeacher)
        return false;

      return true;
    });
  }, [
    searchQuery,
    selectedDate,
    selectedSubject,
    selectedStatus,
    selectedTeacher,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Statistics
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === "present").length;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, percentage };
  }, [filteredRecords]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Date",
      "Student Name",
      "Roll Number",
      "Subject",
      "Subject Code",
      "Period",
      "Status",
      "Marked By",
    ].join(",");

    const rows = filteredRecords.map((record) => {
      const student = getStudentById(record.studentId);
      const subject = getSubjectById(record.subjectId);
      const teacher = getTeacherById(record.markedBy);

      return [
        record.date,
        student?.name || "Unknown",
        student?.rollNumber || "N/A",
        subject?.name || "Unknown",
        subject?.code || "N/A",
        record.period,
        record.status,
        teacher?.name || "System",
      ].join(",");
    });

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Attendance log exported successfully");
  };

  const printReport = () => {
    window.print();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDate("all");
    setSelectedSubject("all");
    setSelectedStatus("all");
    setSelectedTeacher("all");
    setCurrentPage(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              Attendance Log
            </h1>
            <p className="text-muted-foreground mt-1">
              Complete attendance records with detailed filtering
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={printReport}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Present</p>
              <p className="text-3xl font-bold text-success">{stats.present}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Absent</p>
              <p className="text-3xl font-bold text-destructive">{stats.absent}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Attendance %</p>
              <p className="text-3xl font-bold text-primary">{stats.percentage}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Search className="h-3 w-3" />
                Search
              </label>
              <Input
                placeholder="Name, Roll No, Subject..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date
              </label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  {availableDates.map((date) => (
                    <SelectItem key={date} value={date}>
                      {formatDate(date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Subject
              </label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Status
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Teacher Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <User className="h-3 w-3" />
                Marked By
              </label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="All Teachers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {paginatedRecords.length} of {filteredRecords.length} records
        {filteredRecords.length !== attendanceRecords.length && (
          <span> (filtered from {attendanceRecords.length} total)</span>
        )}
      </div>

      {/* Attendance Log Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="w-[80px]">Period</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Marked By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.length > 0 ? (
                  paginatedRecords.map((record) => {
                    const student = getStudentById(record.studentId);
                    const subject = getSubjectById(record.subjectId);
                    const teacher = getTeacherById(record.markedBy);

                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-xs">
                          {formatDate(record.date)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{student?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Roll: {student?.rollNumber}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{subject?.code}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {subject?.name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">P{record.period}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.status === "present" ? "default" : "destructive"
                            }
                            className="flex items-center gap-1 w-fit"
                          >
                            {record.status === "present" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {record.status.charAt(0).toUpperCase() +
                              record.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                              {teacher?.name.charAt(0)}
                            </div>
                            <span className="text-sm">{teacher?.name}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No attendance records found matching your filters
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
