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
  EyeOff
} from "lucide-react";
import { validateTeacherLogin, validateStudentLogin } from "@/lib/data";

export default function LoginPage() {
  const router = useRouter();

  // Admin login state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  // Student login state
  const [studentId, setStudentId] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [studentError, setStudentError] = useState("");
  const [studentLoading, setStudentLoading] = useState(false);

  const handleAdminLogin = async () => {
    setAdminError("");
    setAdminLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const teacher = validateTeacherLogin(adminEmail, adminPassword);

    if (teacher) {
      sessionStorage.setItem("adminUser", JSON.stringify(teacher));
      router.push("/dashboard");
    } else {
      setAdminError("Invalid email or password.");
    }

    setAdminLoading(false);
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
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Student
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Admin/Faculty
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
                      <span className="animate-spin mr-2">&#9696;</span>
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

              {/* Admin/Faculty Login */}
              <TabsContent value="admin" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email Address</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="faculty@andhrauniversity.edu.in"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <div className="relative">
                    <Input
                      id="adminPassword"
                      type={showAdminPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                    >
                      {showAdminPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {adminError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{adminError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleAdminLogin}
                  className="w-full"
                  disabled={!adminEmail.trim() || !adminPassword.trim() || adminLoading}
                >
                  {adminLoading ? (
                    <>
                      <span className="animate-spin mr-2">&#9696;</span>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In as Admin
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
