"use client";

import { useState, useMemo } from "react";
import {
  students,
  subjects,
  attendanceRecords,
  ATTENDANCE_THRESHOLD,
  calculateStudentAttendance,
  getStudentById,
  getSubjectById,
  type Student,
  type Subject,
} from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  BookOpen,
  GraduationCap,
  Search,
  Download,
  Printer,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Eye,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { toast } from "sonner";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1"];

export default function HODAttendanceReportsPage() {
  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("6");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [attendanceThreshold, setAttendanceThreshold] = useState<number>(75);
  const [showOnlyDefaulters, setShowOnlyDefaulters] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Get unique dates from attendance records
  const availableDates = useMemo(() => {
    const dates = new Set(attendanceRecords.map((r) => r.date));
    return Array.from(dates).sort().reverse();
  }, []);

  // Get subjects filtered by semester
  const filteredSubjects = useMemo(() => {
    return selectedSubject === "all" ? subjects : subjects.filter((s) => s.id === selectedSubject);
  }, [selectedSubject]);

  // Day-wise Report Data
  const dayWiseData = useMemo(() => {
    const dateRecords = attendanceRecords.filter((r) => r.date === selectedDate);
    const presentCount = dateRecords.filter((r) => r.status === "present").length;
    const absentCount = dateRecords.filter((r) => r.status === "absent").length;
    const totalCount = dateRecords.length;

    // Group by subject
    const subjectStats = subjects.map((subject) => {
      const subjectRecords = dateRecords.filter((r) => r.subjectId === subject.id);
      const present = subjectRecords.filter((r) => r.status === "present").length;
      const total = subjectRecords.length;
      return {
        subject,
        present,
        total,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    });

    // Get absentees for the day
    const absenteeMap = new Map<string, { student: Student; records: typeof dateRecords }>();
    dateRecords
      .filter((r) => r.status === "absent")
      .forEach((record) => {
        const student = getStudentById(record.studentId);
        if (student) {
          if (!absenteeMap.has(student.id)) {
            absenteeMap.set(student.id, { student, records: [] });
          }
          absenteeMap.get(student.id)!.records.push(record);
        }
      });

    return {
      summary: { present: presentCount, absent: absentCount, total: totalCount },
      subjectStats,
      absentees: Array.from(absenteeMap.values()),
    };
  }, [selectedDate]);

  // Subject-wise Report Data
  const subjectWiseData = useMemo(() => {
    return filteredSubjects.map((subject) => {
      const subjectRecords = attendanceRecords.filter(
        (r) =>
          r.subjectId === subject.id &&
          r.date >= dateRange.start &&
          r.date <= dateRange.end
      );

      // Calculate attendance for each student in this subject
      const studentAttendance = students
        .filter((s) => s.semester === parseInt(selectedSemester))
        .map((student) => {
          const studentRecords = subjectRecords.filter((r) => r.studentId === student.id);
          const present = studentRecords.filter((r) => r.status === "present").length;
          const total = studentRecords.length;
          return {
            student,
            present,
            total,
            percentage: total > 0 ? Math.round((present / total) * 100) : 100,
          };
        });

      const totalPresent = subjectRecords.filter((r) => r.status === "present").length;
      const totalRecords = subjectRecords.length;

      // Count defaulters
      const defaulters = studentAttendance.filter((s) => s.percentage < attendanceThreshold);

      return {
        subject,
        overallPercentage: totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0,
        studentAttendance,
        defaulterCount: defaulters.length,
        totalStudents: studentAttendance.length,
      };
    });
  }, [filteredSubjects, dateRange, selectedSemester, attendanceThreshold]);

  // Semester-wise Report Data
  const semesterData = useMemo(() => {
    const semesterStudents = students.filter((s) => s.semester === parseInt(selectedSemester));

    return semesterStudents
      .map((student) => {
        const attendance = calculateStudentAttendance(student.id);
        const eligible = attendance.percentage >= attendanceThreshold;

        // Get subject-wise breakdown
        const subjectWise = subjects.map((subject) => {
          const subjAttendance = calculateStudentAttendance(student.id, subject.id);
          return {
            subject,
            ...subjAttendance,
          };
        });

        // Check if skipping any specific subjects
        const skippedSubjects = subjectWise.filter((s) => s.percentage < 60);

        return {
          student,
          ...attendance,
          eligible,
          subjectWise,
          skippedSubjects,
        };
      })
      .filter((item) => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            item.student.name.toLowerCase().includes(query) ||
            item.student.rollNumber.includes(query) ||
            item.student.regdNo.includes(query)
          );
        }
        if (showOnlyDefaulters) {
          return !item.eligible;
        }
        return true;
      });
  }, [selectedSemester, attendanceThreshold, searchQuery, showOnlyDefaulters]);

  // Export functions
  const exportToCSV = (data: unknown[], filename: string) => {
    const headers = Object.keys(data[0] || {}).join(",");
    const rows = data.map((row) =>
      Object.values(row || {})
        .map((val) => `"${val}"`)
        .join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    toast.success(`${filename} downloaded successfully`);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Attendance Reports</h1>
            <p className="text-muted-foreground mt-1">
              Multi-dimensional attendance analysis and reporting
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportToCSV(semesterData, "attendance-report")}>
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

      {/* Global Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Threshold:</span>
              <Select
                value={attendanceThreshold.toString()}
                onValueChange={(v) => setAttendanceThreshold(parseInt(v))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">60%</SelectItem>
                  <SelectItem value="65">65%</SelectItem>
                  <SelectItem value="70">70%</SelectItem>
                  <SelectItem value="75">75%</SelectItem>
                  <SelectItem value="80">80%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Semester:</span>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6th Sem</SelectItem>
                  <SelectItem value="4">4th Sem</SelectItem>
                  <SelectItem value="2">2nd Sem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs defaultValue="day" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="day" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Day-wise
          </TabsTrigger>
          <TabsTrigger value="subject" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Subject-wise
          </TabsTrigger>
          <TabsTrigger value="semester" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Semester-wise
          </TabsTrigger>
        </TabsList>

        {/* Day-wise Report */}
        <TabsContent value="day" className="space-y-6">
          {/* Day Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Present</p>
                  <p className="text-3xl font-bold text-success">{dayWiseData.summary.present}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Absent</p>
                  <p className="text-3xl font-bold text-destructive">{dayWiseData.summary.absent}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Attendance %</p>
                  <p className="text-3xl font-bold text-primary">
                    {dayWiseData.summary.total > 0
                      ? Math.round((dayWiseData.summary.present / dayWiseData.summary.total) * 100)
                      : 0}
                    %
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Date Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Absentee Report</CardTitle>
              <CardDescription>Select a date to view absentees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex h-9 w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm"
                  />
                </div>
              </div>

              {/* Subject-wise for the day */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3">Subject-wise Attendance for {selectedDate}</h4>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayWiseData.subjectStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject.code" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${value}%`, "Attendance"]} />
                      <Bar dataKey="percentage" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Absentees Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Roll No</th>
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Missed Periods</th>
                      <th className="text-center py-3 px-4 font-medium">Overall Attendance</th>
                      <th className="text-center py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayWiseData.absentees.length > 0 ? (
                      dayWiseData.absentees.map(({ student, records }) => {
                        const overall = calculateStudentAttendance(student.id);
                        return (
                          <tr key={student.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 font-mono">{student.rollNumber}</td>
                            <td className="py-3 px-4 font-medium">{student.name}</td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {records.map((r) => {
                                  const subject = getSubjectById(r.subjectId);
                                  return (
                                    <Badge key={r.id} variant="secondary" className="text-xs">
                                      P{r.period}: {subject?.code}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`font-semibold ${
                                  overall.percentage < attendanceThreshold
                                    ? "text-destructive"
                                    : "text-success"
                                }`}
                              >
                                {overall.percentage}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {overall.percentage < attendanceThreshold ? (
                                <Badge variant="destructive">Defaulter</Badge>
                              ) : (
                                <Badge variant="default" className="bg-green-100 text-green-700">
                                  Good
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-muted-foreground">
                          No absentees found for {selectedDate}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subject-wise Report */}
        <TabsContent value="subject" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Attendance Analysis</CardTitle>
              <CardDescription>Analyze attendance patterns by subject</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-[250px]">
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                    className="flex h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">To Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                    className="flex h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm"
                  />
                </div>
              </div>

              {/* Subject Summary */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {subjectWiseData.map(({ subject, overallPercentage, defaulterCount, totalStudents }) => (
                  <Card key={subject.id} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{subject.code}</Badge>
                        <span
                          className={`text-lg font-bold ${
                            overallPercentage >= attendanceThreshold ? "text-success" : "text-destructive"
                          }`}
                        >
                          {overallPercentage}%
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">{subject.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {defaulterCount} of {totalStudents} students below threshold
                      </p>
                      <div className="mt-3">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${overallPercentage >= attendanceThreshold ? "bg-success" : "bg-destructive"}`}
                            style={{ width: `${overallPercentage}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Student-wise Subject Attendance */}
              {selectedSubject !== "all" && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Individual Student Attendance</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Roll No</th>
                          <th className="text-left py-3 px-4 font-medium">Name</th>
                          <th className="text-center py-3 px-4 font-medium">Present</th>
                          <th className="text-center py-3 px-4 font-medium">Total</th>
                          <th className="text-center py-3 px-4 font-medium">Percentage</th>
                          <th className="text-center py-3 px-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectWiseData[0]?.studentAttendance.map(({ student, present, total, percentage }) => (
                          <tr key={student.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 font-mono">{student.rollNumber}</td>
                            <td className="py-3 px-4">{student.name}</td>
                            <td className="py-3 px-4 text-center">{present}</td>
                            <td className="py-3 px-4 text-center">{total}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={percentage >= attendanceThreshold ? "text-success" : "text-destructive"}>
                                {percentage}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {percentage >= attendanceThreshold ? (
                                <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive mx-auto" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Semester-wise Report */}
        <TabsContent value="semester" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Semester Attendance Summary</CardTitle>
              <CardDescription>Final eligibility report for examinations</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="defaulters"
                    checked={showOnlyDefaulters}
                    onCheckedChange={(checked) => setShowOnlyDefaulters(checked as boolean)}
                  />
                  <label htmlFor="defaulters" className="text-sm">
                    Show only defaulters
                  </label>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{semesterData.length}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Eligible</p>
                  <p className="text-2xl font-bold text-success">
                    {semesterData.filter((s) => s.eligible).length}
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Not Eligible</p>
                  <p className="text-2xl font-bold text-destructive">
                    {semesterData.filter((s) => !s.eligible).length}
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Average %</p>
                  <p className="text-2xl font-bold text-primary">
                    {semesterData.length > 0
                      ? Math.round(semesterData.reduce((acc, s) => acc + s.percentage, 0) / semesterData.length)
                      : 0}
                    %
                  </p>
                </div>
              </div>

              {/* Eligibility Chart */}
              <div className="h-[200px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Eligible", value: semesterData.filter((s) => s.eligible).length },
                        { name: "Not Eligible", value: semesterData.filter((s) => !s.eligible).length },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      label
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Students Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Roll No</th>
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-center py-3 px-4 font-medium">Present</th>
                      <th className="text-center py-3 px-4 font-medium">Total</th>
                      <th className="text-center py-3 px-4 font-medium">%</th>
                      <th className="text-center py-3 px-4 font-medium">Status</th>
                      <th className="text-center py-3 px-4 font-medium">Skipped Subjects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semesterData.length > 0 ? (
                      semesterData.map((item) => (
                        <tr key={item.student.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-mono">{item.student.rollNumber}</td>
                          <td className="py-3 px-4 font-medium">{item.student.name}</td>
                          <td className="py-3 px-4 text-center">{item.present}</td>
                          <td className="py-3 px-4 text-center">{item.total}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-bold ${item.eligible ? "text-success" : "text-destructive"}`}>
                              {item.percentage}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.eligible ? (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Eligible
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Not Eligible
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.skippedSubjects.length > 0 ? (
                              <div className="flex flex-wrap justify-center gap-1">
                                {item.skippedSubjects.map((s) => (
                                  <Badge key={s.subject.id} variant="secondary" className="text-xs">
                                    {s.subject.code}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          No students found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
