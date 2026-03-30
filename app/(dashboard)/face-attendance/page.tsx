"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  Scan,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  AlertTriangle,
  RefreshCw,
  Clock,
} from "lucide-react";
import * as tf from "@tensorflow/tfjs";
import { subjects, students, type Student } from "@/lib/data";
import { addAttendanceRecord } from "@/lib/attendance-store";

// Model labels from the trained model
const MODEL_LABELS = ["Somesh", "Deepesh", "Balu", "Susheel"];
const CONFIDENCE_THRESHOLD = 0.85; // 85%

type DetectionStatus = "idle" | "loading" | "ready" | "detecting" | "success" | "error";

interface DetectionResult {
  label: string;
  confidence: number;
  matchedStudent?: Student;
}

interface AttendanceRecord {
  studentName: string;
  rollNumber: string;
  subject: string;
  period: number;
  timestamp: string;
  confidence: number;
}

export default function FaceAttendancePage() {
  const [status, setStatus] = useState<DetectionStatus>("idle");
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [attendanceLog, setAttendanceLog] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string>("");
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
 const requestRef = useRef<number>();

  // Load the Teachable Machine model
  const loadModel = useCallback(async () => {
    setIsModelLoading(true);
    setError("");

    try {
      await tf.setBackend("webgl");
      const loadedModel = await tf.loadLayersModel("/models/face-detection/model.json");
      setModel(loadedModel);
      setStatus("ready");
    } catch (err) {
      console.error("Failed to load model:", err);
      setError("Failed to load face detection model. Please refresh the page.");
      setStatus("error");
    } finally {
      setIsModelLoading(false);
    }
  }, []);

  // Initialize model on mount
  useEffect(() => {
    loadModel();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      stopWebcam();
    };
  }, [loadModel]);

  // Start webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setWebcamActive(true);
      }
    } catch (err) {
      setError("Failed to access camera. Please allow camera permissions.");
      setStatus("error");
    }
  };

  // Stop webcam
  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setWebcamActive(false);
    }
  };

  // Predict face from video frame
  const predictFace = async () => {
    if (!model || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== 4) return;

    // Draw video frame to canvas
    canvas.width = 224;
    canvas.height = 224;
    ctx.drawImage(video, 0, 0, 224, 224);

    // Get image data and preprocess
    const imageData = ctx.getImageData(0, 0, 224, 224);
    const tensor = tf.browser
      .fromPixels(imageData)
      .toFloat()
      .expandDims(0)
      .div(255);

    // Make prediction
    const predictions = model.predict(tensor) as tf.Tensor;
    const probabilities = await predictions.data();

    // Get highest confidence prediction
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    const confidence = probabilities[maxIndex];
    const label = MODEL_LABELS[maxIndex];

    // Cleanup tensors
    tensor.dispose();
    predictions.dispose();

    return { label, confidence };
  };

  // Start face detection
  const startDetection = async () => {
    if (!selectedSubject || !selectedPeriod) {
      setError("Please select subject and period first");
      return;
    }

    setStatus("detecting");
    setError("");
    setDetectionResult(null);

    await startWebcam();

    // Run detection loop
    const detectLoop = async () => {
      if (status !== "detecting") return;

      const result = await predictFace();

      if (result && result.confidence >= CONFIDENCE_THRESHOLD) {
        // Find matching student by name (case-insensitive)
        const matchedStudent = students.find(
          (s) => s.name.toLowerCase().includes(result.label.toLowerCase())
        );

        const detectionData: DetectionResult = {
          label: result.label,
          confidence: result.confidence,
          matchedStudent,
        };

        setDetectionResult(detectionData);

        if (matchedStudent) {
          // Mark attendance
          const today = new Date().toISOString().split("T")[0];
          addAttendanceRecord({
            studentId: matchedStudent.id,
            subjectId: selectedSubject,
            date: today,
            period: parseInt(selectedPeriod),
            status: "present",
            markedBy: "FACE_SYSTEM",
          });

          // Add to log
          const subject = subjects.find((s) => s.id === selectedSubject);
          setAttendanceLog((prev) => [
            {
              studentName: matchedStudent.name,
              rollNumber: matchedStudent.rollNumber,
              subject: subject?.name || "Unknown",
              period: parseInt(selectedPeriod),
              timestamp: new Date().toLocaleTimeString(),
              confidence: Math.round(result.confidence * 100),
            },
            ...prev.slice(0, 9), // Keep last 10
          ]);

          setStatus("success");
          stopWebcam();
        } else {
          setStatus("error");
          setError(`Detected ${result.label} but no matching student found in database.`);
        }
      } else {
        // Continue detection
        requestRef.current = requestAnimationFrame(detectLoop);
      }
    };

    // Start detection after a short delay for camera warmup
    setTimeout(() => {
      detectLoop();
    }, 1000);
  };

  // Stop detection
  const stopDetection = () => {
    setStatus("ready");
    stopWebcam();
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  };

  // Reset for next scan
  const resetScan = () => {
    setStatus("ready");
    setDetectionResult(null);
    setError("");
    stopWebcam();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Scan className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Face Recognition Attendance</h1>
            <p className="text-muted-foreground">
              Mark attendance using AI-powered face detection
            </p>
          </div>
        </div>
      </div>

      {/* Model Info */}
      <Alert>
        <Users className="h-4 w-4" />
        <AlertTitle>Trained Model</AlertTitle>
        <AlertDescription>
          This system recognizes: {MODEL_LABELS.join(", ")}. Detection confidence must be ≥85% to mark attendance.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Configure Session
            </CardTitle>
            <CardDescription>Select subject and period before scanning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subject Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map((period) => (
                    <SelectItem key={period} value={period.toString()}>
                      Period {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="pt-4">
              {status === "detecting" ? (
                <Button variant="destructive" className="w-full" onClick={stopDetection}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Stop Scanning
                </Button>
              ) : status === "success" ? (
                <Button className="w-full" onClick={resetScan}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Scan Next Student
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={startDetection}
                  disabled={!selectedSubject || !selectedPeriod || isModelLoading || status === "loading"}
                >
                  {isModelLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading Model...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Start Face Scan
                    </>
                  )}
                </Button>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Camera Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Camera Feed</CardTitle>
            <CardDescription>Position face in center for best results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              {status === "detecting" || status === "ready" ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {status === "detecting" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-48 h-48 border-4 border-primary rounded-full animate-pulse" />
                    </div>
                  )}
                </>
              ) : status === "success" ? (
                <div className="flex flex-col items-center justify-center h-full bg-green-50">
                  <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
                  <p className="text-lg font-semibold text-green-800">
                    {detectionResult?.matchedStudent?.name}
                  </p>
                  <p className="text-sm text-green-600">
                    Confidence: {Math.round((detectionResult?.confidence || 0) * 100)}%
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Camera className="h-16 w-16 mb-4 opacity-20" />
                  <p>Camera will activate when you start scanning</p>
                </div>
              )}
            </div>

            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />
          </CardContent>
        </Card>
      </div>

      {/* Results and Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Result */}
        {detectionResult && (
          <Card>
            <CardHeader>
              <CardTitle>Detection Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Detected Person</p>
                    <p className="text-lg font-semibold">{detectionResult.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <Badge
                      variant={detectionResult.confidence >= CONFIDENCE_THRESHOLD ? "default" : "destructive"}
                      className="text-lg"
                    >
                      {Math.round(detectionResult.confidence * 100)}%
                    </Badge>
                  </div>
                </div>

                {detectionResult.matchedStudent && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600 font-medium mb-2">Attendance Marked For:</p>
                    <p className="font-semibold">{detectionResult.matchedStudent.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Roll: {detectionResult.matchedStudent.rollNumber}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Attendance Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceLog.length > 0 ? (
              <div className="space-y-2">
                {attendanceLog.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{log.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.subject} - Period {log.period}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {log.confidence}%
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{log.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No attendance records yet. Start scanning to mark attendance.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
