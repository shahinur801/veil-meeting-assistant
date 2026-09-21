/** Capture one JPEG frame from a screen/window the user picks. */

export async function captureScreenJpeg(): Promise<string> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("Screen capture is not available in this browser.");
  }
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
  });
  try {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();
    await new Promise((r) => window.setTimeout(r, 160));
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    const max = 1024;
    const scale = Math.min(1, max / Math.max(vw, vh));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(vw * scale));
    canvas.height = Math.max(1, Math.round(vh * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not capture the screen.");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
    const b64 = dataUrl.split(",")[1] ?? "";
    if (!b64) throw new Error("Empty capture.");
    return b64;
  } finally {
    stream.getTracks().forEach((t) => t.stop());
  }
}
