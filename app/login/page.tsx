"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  GraduationCap,
  UserCog,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { validateTeacherLogin, validateStudentLogin } from "@/lib/data";

export default function LoginPage() {
  const router = useRouter();

  // Faculty login state
  const [facultyEmail, setFacultyEmail] = useState("");
  const [facultyPassword, setFacultyPassword] = useState("");
  const [showFacultyPassword, setShowFacultyPassword] = useState(false);
  const [facultyError, setFacultyError] = useState("");
  const [facultyLoading, setFacultyLoading] = useState(false);

  // HOD login state
  const [hodEmail, setHODEmail] = useState("");
  const [hodPassword, setHODPassword] = useState("");
  const [showHODPassword, setShowHODPassword] = useState(false);
  const [hodError, setHODError] = useState("");
  const [hodLoading, setHODLoading] = useState(false);

  // Student login state
  const [studentId, setStudentId] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [studentError, setStudentError] = useState("");
  const [studentLoading, setStudentLoading] = useState(false);

  const handleFacultyLogin = async () => {
    setFacultyError("");
    setFacultyLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const teacher = validateTeacherLogin(facultyEmail, facultyPassword);

    if (teacher) {
      if (teacher.role === "hod") {
        setFacultyError("HOD accounts should use the HOD login tab.");
      } else {
        sessionStorage.setItem("facultyUser", JSON.stringify(teacher));
        router.push("/faculty");
      }
    } else {
      setFacultyError("Invalid email or password.");
    }

    setFacultyLoading(false);
  };

  const handleHODLogin = async () => {
    setHODError("");
    setHODLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const teacher = validateTeacherLogin(hodEmail, hodPassword);

    if (teacher) {
      if (teacher.role !== "hod") {
        setHODError("Faculty accounts should use the Faculty login tab.");
      } else {
        sessionStorage.setItem("hodUser", JSON.stringify(teacher));
        router.push("/hod");
      }
    } else {
      setHODError("Invalid email or password.");
    }

    setHODLoading(false);
  };

  const handleStudentLogin = async () => {
    setStudentError("");
    setStudentLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const student = validateStudentLogin(studentId.trim(), studentPassword);

    if (student) {
      sessionStorage.setItem("studentUser", JSON.stringify(student));
      router.push("/student");
    } else {
      setStudentError("Invalid ID or password. Default password is: Student123");
    }

    setStudentLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4 overflow-hidden">
            <Image
              src="/au-logo.png"
              alt="Andhra University Logo"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">CSSE Super Student App</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Andhra University - Department of CSSE
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access the attendance system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Student
                </TabsTrigger>
                <TabsTrigger value="faculty" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Faculty
                </TabsTrigger>
                <TabsTrigger value="hod" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  HOD
                </TabsTrigger>
              </TabsList>

              {/* Student Login */}
              <TabsContent value="student" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Registration / Roll Number</Label>
                  <Input
                    id="studentId"
                    placeholder="e.g., 3235064022211 or 22211"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentPassword">Password</Label>
                  <div className="relative">
                    <Input
                      id="studentPassword"
                      type={showStudentPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleStudentLogin()}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowStudentPassword(!showStudentPassword)}
                    >
                      {showStudentPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Default password for all students: <code className="bg-muted px-1 rounded">Student123</code>
                  </p>
                </div>

                {studentError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{studentError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleStudentLogin}
                  className="w-full"
                  disabled={!studentId.trim() || !studentPassword.trim() || studentLoading}
                >
                  {studentLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In as Student
                    </>
                  )}
                </Button>

                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="font-medium mb-1">Test Student Accounts:</p>
                  <ul className="text-muted-foreground text-xs space-y-0.5">
                    <li>Regd: <code className="bg-muted px-1 rounded">3235064022211</code> | Pass: <code className="bg-muted px-1 rounded">Student123</code></li>
                    <li>Roll: <code className="bg-muted px-1 rounded">22212</code> | Pass: <code className="bg-muted px-1 rounded">Student123</code></li>
                  </ul>
                </div>
              </TabsContent>

              {/* Faculty Login */}
              <TabsContent value="faculty" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="facultyEmail">Email Address</Label>
                  <Input
                    id="facultyEmail"
                    type="email"
                    placeholder="faculty@andhrauniversity.edu.in"
                    value={facultyEmail}
                    onChange={(e) => setFacultyEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facultyPassword">Password</Label>
                  <div className="relative">
                    <Input
                      id="facultyPassword"
                      type={showFacultyPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={facultyPassword}
                      onChange={(e) => setFacultyPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleFacultyLogin()}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowFacultyPassword(!showFacultyPassword)}
                    >
                      {showFacultyPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {facultyError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{facultyError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleFacultyLogin}
                  className="w-full"
                  disabled={!facultyEmail.trim() || !facultyPassword.trim() || facultyLoading}
                >
                  {facultyLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In as Faculty
                    </>
                  )}
                </Button>

                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="font-medium mb-1">Test Faculty Accounts:</p>
                  <ul className="text-muted-foreground text-xs space-y-0.5">
                    <li>aneela@andhrauniversity.edu.in / <code className="bg-muted px-1 rounded">admin123</code></li>
                  </ul>
                </div>
              </TabsContent>

              {/* HOD Login */}
              <TabsContent value="hod" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hodEmail">Email Address</Label>
                  <Input
                    id="hodEmail"
                    type="email"
                    placeholder="hod@andhrauniversity.edu.in"
                    value={hodEmail}
                    onChange={(e) => setHODEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hodPassword">Password</Label>
                  <div className="relative">
                    <Input
                      id="hodPassword"
                      type={showHODPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={hodPassword}
                      onChange={(e) => setHODPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleHODLogin()}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowHODPassword(!showHODPassword)}
                    >
                      {showHODPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {hodError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{hodError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleHODLogin}
                  className="w-full"
                  disabled={!hodEmail.trim() || !hodPassword.trim() || hodLoading}
                >
                  {hodLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In as HOD
                    </>
                  )}
                </Button>

                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="font-medium mb-1">Test HOD Account:</p>
                  <ul className="text-muted-foreground text-xs space-y-0.5">
                    <li>hod@andhrauniversity.edu.in / <code className="bg-muted px-1 rounded">hod123</code></li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          3/6 BTECH (CSE)-4, II Semester - Room A33
        </p>
      </div>
    </div>
  );
}
