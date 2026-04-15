"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, RotateCcw, Check, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onCancel?: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError(null);
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    // burn timestamp into bottom-right
    const ts = new Date().toISOString();
    ctx.font = "16px monospace";
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    const metrics = ctx.measureText(ts);
    ctx.fillRect(canvas.width - metrics.width - 20, canvas.height - 36, metrics.width + 16, 28);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(ts, canvas.width - metrics.width - 12, canvas.height - 16);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setPreview(URL.createObjectURL(blob));
        }
      },
      "image/jpeg",
      0.85,
    );
  }

  function confirm() {
    if (capturedBlob) {
      onCapture(capturedBlob);
      setPreview(null);
      setCapturedBlob(null);
    }
  }

  function retake() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setCapturedBlob(null);
  }

  function flipCamera() {
    setFacingMode((m) => (m === "environment" ? "user" : "environment"));
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-white p-8 text-center">
        <Camera className="h-12 w-12 text-tenu-slate/40" />
        <p className="text-sm text-tenu-danger">{error}</p>
        <button
          onClick={startCamera}
          className="rounded-lg bg-tenu-forest px-4 py-2 text-sm text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black">
      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Captured" className="w-full" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button
              onClick={retake}
              className="flex items-center gap-2 rounded-full bg-white/90 px-5 py-3 text-sm font-medium text-tenu-slate"
            >
              <RotateCcw className="h-4 w-4" /> Retake
            </button>
            <button
              onClick={confirm}
              className="flex items-center gap-2 rounded-full bg-tenu-forest px-5 py-3 text-sm font-medium text-white"
            >
              <Check className="h-4 w-4" /> Use photo
            </button>
          </div>
        </>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full"
          />
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6">
            {onCancel && (
              <button
                onClick={onCancel}
                className="rounded-full bg-white/20 p-3 text-white backdrop-blur"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={capture}
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 backdrop-blur"
            >
              <div className="h-12 w-12 rounded-full bg-white" />
            </button>
            <button
              onClick={flipCamera}
              className="rounded-full bg-white/20 p-3 text-white backdrop-blur"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
