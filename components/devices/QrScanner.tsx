"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui";
import { parseClaimQr, type ClaimCodes } from "@/lib/device-setup";

type CameraState = "starting" | "scanning" | "denied" | "unavailable" | "wrong-code";

const CAMERA_HELP: Record<Exclude<CameraState, "starting" | "scanning">, string> = {
  denied:
    "The browser is not allowed to use the camera. Allow the camera in the address bar, then try again, or type the code instead.",
  unavailable:
    "No camera can be used here. This page needs a camera and a secure (https or localhost) address. Type the code instead.",
  "wrong-code": "That QR code is not an EchoSense box sticker. Point the camera at the sticker on the box.",
};

/**
 * Laptop-camera QR reader for EchoSense box stickers. Calls onCodes once with the
 * device code and setup code; stops the camera when it finds them or unmounts.
 */
export default function QrScanner({ onCodes }: { onCodes: (codes: ClaimCodes) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCodesRef = useRef(onCodes);
  const [state, setState] = useState<CameraState>("starting");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    onCodesRef.current = onCodes;
  }, [onCodes]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    let lastWrong = "";

    const stop = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };

    const scan = () => {
      if (stopped) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
        // Scan a downscaled frame: fast enough for a laptop camera, plenty for a sticker.
        const scale = Math.min(1, 640 / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const image = context.getImageData(0, 0, canvas.width, canvas.height);
          const found = jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" });
          if (found?.data) {
            const codes = parseClaimQr(found.data);
            if (codes) {
              stop();
              onCodesRef.current(codes);
              return;
            }
            if (found.data !== lastWrong) {
              lastWrong = found.data;
              setState("wrong-code");
            }
          }
        }
      }
      frame = requestAnimationFrame(scan);
    };

    const start = async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setState("unavailable");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (caught) {
        const name = caught instanceof DOMException ? caught.name : "";
        setState(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
        return;
      }
      if (stopped) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        // Autoplay of a muted inline camera feed is allowed; a rejection here only
        // means the element was removed while starting.
      }
      setState("scanning");
      frame = requestAnimationFrame(scan);
    };

    void start();
    return stop;
  }, [attempt]);

  const problem = state === "denied" || state === "unavailable";
  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-panel border border-line bg-surface">
        <video
          ref={videoRef}
          muted
          playsInline
          aria-label="Camera view for scanning the box sticker"
          className={`h-full w-full object-cover ${problem ? "hidden" : ""}`}
        />
        {!problem && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-[18%] rounded-panel border-2 border-dashed border-bg/80" />
        )}
        {problem && (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <Camera className="h-8 w-8 text-muted" aria-hidden="true" />
            <p className="max-w-sm text-body text-ink">{CAMERA_HELP[state]}</p>
            {state === "denied" && (
              <Button size="sm" onClick={() => { setState("starting"); setAttempt((count) => count + 1); }}>
                Try the camera again
              </Button>
            )}
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      <p role="status" aria-live="polite" className="mt-2 text-small text-muted">
        {state === "starting" && "Starting the camera…"}
        {state === "scanning" && "Hold the sticker on the box in front of the camera."}
        {state === "wrong-code" && CAMERA_HELP["wrong-code"]}
      </p>
    </div>
  );
}
