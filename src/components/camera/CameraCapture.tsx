"use client";

/**
 * CameraCapture — web getUserMedia capture surface. Éditorial v2
 * (#T150): the viewfinder is an inverted black plate (0px radius, no
 * shadow); controls on it are white — filled white shutter square,
 * hairline-framed white icon buttons, underlined typographic
 * secondary actions. The shutter is the primary capture action.
 */

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
      <div className="flex flex-col items-center justify-center gap-4 border border-tenu-hairline bg-tenu-canvas p-8 text-center">
        <Camera className="h-12 w-12 text-tenu-ash" />
        <p className="text-sm text-tenu-danger">{error}</p>
        <button
          onClick={startCamera}
          className="hig-press min-h-11 bg-tenu-cta px-5 text-sm font-medium text-tenu-cta-text"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden bg-tenu-band-inverted">
      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Captured" className="w-full" />
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6">
            <button
              onClick={retake}
              className="hig-press flex min-h-11 items-center gap-2 px-3 text-sm font-medium text-white underline decoration-1 underline-offset-4"
            >
              <RotateCcw className="h-4 w-4" /> Retake
            </button>
            <button
              onClick={confirm}
              className="hig-press flex min-h-11 items-center gap-2 bg-white px-5 py-3 text-sm font-medium text-tenu-ink"
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
                aria-label="Cancel"
                className="hig-press flex h-11 w-11 items-center justify-center border border-white/60 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={capture}
              aria-label="Take photo"
              className="hig-press flex h-16 w-16 items-center justify-center border border-white bg-transparent"
            >
              <div className="h-12 w-12 bg-white" />
            </button>
            <button
              onClick={flipCamera}
              aria-label="Flip camera"
              className="hig-press flex h-11 w-11 items-center justify-center border border-white/60 text-white"
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
