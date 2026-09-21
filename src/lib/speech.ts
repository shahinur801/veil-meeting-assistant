type RecognitionCtor = new () => SpeechRecognitionLike;

export type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: SpeechResultEvent) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
};

export type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

export type MicDevice = { deviceId: string; label: string };

export function getSpeechRecognition(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported() {
  return getSpeechRecognition() !== null;
}

export function micSupported() {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

export function pickRecorderMime() {
  if (typeof MediaRecorder === "undefined") return "";
  const options = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return options.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read audio"));
    reader.onload = () => {
      const s = String(reader.result ?? "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    reader.readAsDataURL(blob);
  });
}

export function recordWindow(
  stream: MediaStream,
  mime: string,
  ms: number,
): Promise<Blob> {
  return new Promise((resolve) => {
    const audio = new MediaStream(stream.getAudioTracks());
    let rec: MediaRecorder;
    try {
      rec = mime
        ? new MediaRecorder(audio, { mimeType: mime })
        : new MediaRecorder(audio);
    } catch {
      resolve(new Blob());
      return;
    }
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    rec.onerror = () => resolve(new Blob());
    rec.onstop = () => {
      resolve(new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" }));
    };
    rec.start();
    window.setTimeout(() => {
      try {
        if (rec.state !== "inactive") rec.stop();
      } catch {
        resolve(new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" }));
      }
    }, ms);
  });
}

export function micErrorMessage(err: unknown) {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Microphone is blocked. Allow it in the browser prompt and try again.";
  }
  if (name === "NotFoundError") {
    return "No microphone was found. Plug one in and try again.";
  }
  if (name === "NotReadableError") {
    return "The microphone is in use by another app. Close it and try again.";
  }
  if (name === "SecurityError") {
    return "This window cannot use the microphone. Open Veil in its own tab in Chrome or Edge.";
  }
  return err instanceof Error ? err.message : "Could not open the microphone.";
}

export function audioConstraints(micId?: string): MediaTrackConstraints {
  return {
    echoCancellation: true,
    noiseSuppression: true,
    ...(micId ? { deviceId: { ideal: micId } } : {}),
  };
}

export async function listMicrophones(): Promise<MicDevice[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  let granted = false;
  try {
    const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
    probe.getTracks().forEach((t) => t.stop());
    granted = true;
  } catch {
    /* labels may stay empty */
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  const mics = devices
    .filter((d) => d.kind === "audioinput")
    .map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label || (granted ? `Microphone ${i + 1}` : "Microphone (allow access to name it)"),
    }));
  return mics;
}

export async function startMicMeter(
  deviceId: string,
  onLevel: (level: number) => void,
): Promise<() => void> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: audioConstraints(deviceId || undefined),
  });
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);
  let raf = 0;
  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    onLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
    raf = window.requestAnimationFrame(tick);
  };
  raf = window.requestAnimationFrame(tick);
  return () => {
    window.cancelAnimationFrame(raf);
    source.disconnect();
    void ctx.close();
    stream.getTracks().forEach((t) => t.stop());
  };
}
