"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, BookOpen, MapPin } from "lucide-react";
import { timetable, subjects, teachers, timeSlots, type TimetableEntry } from "@/lib/data";

const days = [
  { id: "MON", label: "Monday" },
  { id: "TUE", label: "Tuesday" },
  { id: "WED", label: "Wednesday" },
  { id: "THU", label: "Thursday" },
  { id: "FRI", label: "Friday" },
  { id: "SAT", label: "Saturday" },
];

const typeColors: Record<string, string> = {
  class: "bg-blue-100 text-blue-800 border-blue-200",
  lab: "bg-purple-100 text-purple-800 border-purple-200",
  break: "bg-gray-100 text-gray-800 border-gray-200",
  "ncc/nss": "bg-green-100 text-green-800 border-green-200",
  "self-study": "bg-yellow-100 text-yellow-800 border-yellow-200",
  remedial: "bg-orange-100 text-orange-800 border-orange-200",
};

const typeLabels: Record<string, string> = {
  class: "Theory",
  lab: "Lab",
  break: "Break",
  "ncc/nss": "NCC/NSS",
  "self-study": "Self Study",
  remedial: "Remedial",
};

export default function TimetablePage() {
  const [selectedDay, setSelectedDay] = useState("MON");

  const getTimetableForDay = (day: string) => {
    return timetable
      .filter((entry) => entry.day === day)
      .sort((a, b) => a.period - b.period);
  };

  const getSubjectInfo = (subjectId: string | null) => {
    if (!subjectId) return null;
    return subjects.find((s) => s.id === subjectId);
  };

  const getTeacherInfo = (teacherId: string) => {
    return teachers.find((t) => t.id === teacherId);
  };

  const getTimeSlot = (period: number) => {
    return timeSlots.find((t) => t.period === period);
  };

  const renderPeriod = (entry: TimetableEntry) => {
    const timeSlot = getTimeSlot(entry.period);
    const subject = getSubjectInfo(entry.subjectId);
    const teacher = subject ? getTeacherInfo(subject.teacherId) : null;

    return (
      <div
        key={`${entry.day}-${entry.period}`}
        className={`p-4 rounded-lg border ${
          entry.subjectId
            ? "bg-card hover:shadow-md transition-shadow"
            : "bg-muted/50"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-primary">P{entry.period}</span>
              <span className="text-sm text-muted-foreground">
                {timeSlot?.startTime} - {timeSlot?.endTime}
              </span>
            </div>

            {entry.subjectId ? (
              <>
                <h4 className="font-semibold text-foreground">{subject?.name}</h4>
                <p className="text-sm text-muted-foreground">{subject?.code}</p>
                {teacher && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <Users className="h-3 w-3 inline mr-1" />
                    {teacher.name}
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground font-medium">{typeLabels[entry.type]}</p>
            )}
          </div>

          <Badge variant="outline" className={`${typeColors[entry.type]} capitalize`}>
            {typeLabels[entry.type]}
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Class Timetable</h1>
            <p className="text-muted-foreground">
              3/6 B.Tech (CSE)-4, II Semester - Room A33
            </p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Subjects</p>
                <p className="text-xl font-bold">{subjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Class Hours</p>
                <p className="text-xl font-bold">9:00 AM - 4:00 PM</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Faculty</p>
                <p className="text-xl font-bold">{teachers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Room</p>
                <p className="text-xl font-bold">A33</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timetable Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>View the complete class timetable</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="MON" className="w-full">
            <TabsList className="grid grid-cols-6 mb-6">
              {days.map((day) => (
                <TabsTrigger key={day.id} value={day.id}>
                  {day.label.slice(0, 3)}
                </TabsTrigger>
              ))}
            </TabsList>

            {days.map((day) => (
              <TabsContent key={day.id} value={day.id} className="space-y-3">
                <h3 className="text-lg font-semibold mb-4">{day.label}</h3>
                <div className="space-y-3">
                  {getTimetableForDay(day.id).map(renderPeriod)}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Subject List */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Details</CardTitle>
          <CardDescription>Complete list of subjects and faculty</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {subjects.map((subject) => {
              const teacher = getTeacherInfo(subject.teacherId);
              return (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div>
                    <h4 className="font-medium">{subject.name}</h4>
                    <p className="text-sm text-muted-foreground">{subject.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{teacher?.name}</p>
                    <Badge variant={subject.type === "lab" ? "secondary" : "outline"}>
                      {subject.credits} Credits
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
