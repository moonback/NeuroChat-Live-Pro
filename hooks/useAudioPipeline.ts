import { useRef, useCallback, useEffect, useMemo } from 'react';
import { DEFAULT_AUDIO_CONFIG } from '../types';
import { createBlob, decodeAudioData, base64ToArrayBuffer } from '../utils/audioUtils';

export interface AudioPipelineHandlers {
  onAudioChunk: (base64Audio: string) => void;
  onInterrupted: () => void;
  onUserAudioActivity: () => void;
}

export interface AudioPipelineResult {
  analyserRef: React.RefObject<AnalyserNode | null>;
  inputAnalyserRef: React.RefObject<AnalyserNode | null>;
  lastUserAudioTimeRef: React.RefObject<number>;
  setup: (stream: MediaStream) => Promise<{
    inputCtx: AudioContext;
    outputCtx: AudioContext;
    processor: ScriptProcessorNode;
  }>;
  scheduleOutputAudio: (base64Audio: string) => Promise<void>;
  interruptOutput: () => void;
  cleanup: () => void;
  toggleMic: () => boolean;
  getMicMuted: () => boolean;
  mediaStreamRef: React.RefObject<MediaStream | null>;
}

/**
 * Manages the dual AudioContext pipeline (input 16kHz + output 24kHz)
 * and provides helpers for PCM capture and audio scheduling.
 *
 * Extracted from useGeminiLiveSession to keep concerns separate.
 */
export function useAudioPipeline(
  // Use `any` to avoid Blob_2 vs Blob mismatch from @google/genai internal types
  onSendAudio: (blob: any) => void,
  sessionRef: { current: any },
): AudioPipelineResult {
  // Stable ref so the ScriptProcessorNode closure never captures a stale callback
  const onSendAudioRef = useRef(onSendAudio);
  useEffect(() => { onSendAudioRef.current = onSendAudio; }, [onSendAudio]);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const activeSourceInputRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const lastUserAudioTimeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    audioSourcesRef.current.forEach(src => {
      try { src.stop(); src.disconnect(); } catch { /* already stopped */ }
    });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    const nodes = [processorRef, activeSourceInputRef, analyserRef, inputAnalyserRef, gainNodeRef];
    nodes.forEach(nodeRef => {
      if (nodeRef.current) {
        try { nodeRef.current.disconnect(); } catch { /* ok */ }
        if ('onaudioprocess' in nodeRef.current) {
          (nodeRef.current as ScriptProcessorNode).onaudioprocess = null;
        }
        (nodeRef as { current: null }).current = null;
      }
    });

    [inputAudioContextRef, outputAudioContextRef].forEach(ctxRef => {
      if (ctxRef.current) {
        try { ctxRef.current.close(); } catch { /* ok */ }
        ctxRef.current = null;
      }
    });

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => { try { t.stop(); } catch { /* ok */ } });
      mediaStreamRef.current = null;
    }
  }, []);

  const setup = useCallback(async (stream: MediaStream) => {
    cleanup();

    const AudioContextClass: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const inputCtx = new AudioContextClass({ sampleRate: DEFAULT_AUDIO_CONFIG.inputSampleRate });
    const outputCtx = new AudioContextClass({ sampleRate: DEFAULT_AUDIO_CONFIG.outputSampleRate });

    await Promise.all([inputCtx.resume(), outputCtx.resume()]);

    inputAudioContextRef.current = inputCtx;
    outputAudioContextRef.current = outputCtx;
    mediaStreamRef.current = stream;

    // Output chain: gainNode → analyser → destination
    const analyser = outputCtx.createAnalyser();
    analyser.fftSize = 512;
    analyserRef.current = analyser;

    const gainNode = outputCtx.createGain();
    gainNode.connect(analyser);
    analyser.connect(outputCtx.destination);
    gainNodeRef.current = gainNode;

    // Input chain: source → inputAnalyser → processor → destination
    const inputAnalyser = inputCtx.createAnalyser();
    inputAnalyser.fftSize = 256;
    inputAnalyserRef.current = inputAnalyser;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const bufferSize = isMobile ? 1024 : 2048;
    // ScriptProcessorNode is deprecated but still the only reliable cross-browser
    // option for low-latency PCM access until AudioWorklet lands everywhere.
    const processor = inputCtx.createScriptProcessor(bufferSize, 1, 1);
    processorRef.current = processor;

    const source = inputCtx.createMediaStreamSource(stream);
    activeSourceInputRef.current = source;
    source.connect(inputAnalyser);

    processor.onaudioprocess = (e) => {
      if (!sessionRef.current) return;
      try {
        const inputData = e.inputBuffer.getChannelData(0);

        // RMS check — track last user audio for latency measurement
        let sum = 0;
        const step = isMobile ? 4 : 1;
        for (let i = 0; i < inputData.length; i += step) sum += inputData[i] * inputData[i];
        const rms = Math.sqrt(sum / (inputData.length / step));
        if (rms > 0.02) lastUserAudioTimeRef.current = Date.now();

        const pcmBlob = createBlob(inputData, DEFAULT_AUDIO_CONFIG.inputSampleRate);
        if (sessionRef.current) onSendAudioRef.current(pcmBlob);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (!msg.includes('closed')) console.warn('[AudioPipeline] onaudioprocess:', err);
      }
    };

    source.connect(processor);
    processor.connect(inputCtx.destination);

    return { inputCtx, outputCtx, processor };
  // onSendAudio intentionally omitted — accessed via stable ref (onSendAudioRef)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanup, sessionRef]);

  const scheduleOutputAudio = useCallback(async (base64Audio: string) => {
    const ctx = outputAudioContextRef.current;
    const gain = gainNodeRef.current;
    if (!ctx || !gain) return;

    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
    const buffer = await decodeAudioData(
      base64ToArrayBuffer(base64Audio),
      ctx,
      DEFAULT_AUDIO_CONFIG.outputSampleRate,
    );
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
    audioSourcesRef.current.add(source);
    source.onended = () => audioSourcesRef.current.delete(source);
  }, []);

  const interruptOutput = useCallback(() => {
    audioSourcesRef.current.forEach(src => { try { src.stop(); } catch { /* ok */ } });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const toggleMic = useCallback((): boolean => {
    if (!mediaStreamRef.current) return false;
    const tracks = mediaStreamRef.current.getAudioTracks();
    const next = !tracks[0]?.enabled;
    tracks.forEach(t => { t.enabled = next; });
    return !next; // returns isMuted
  }, []);

  const getMicMuted = useCallback((): boolean => {
    return mediaStreamRef.current?.getAudioTracks()[0]?.enabled === false;
  }, []);

  // Stable object identity — all members are useCallback with empty deps,
  // so this memo never re-fires. Prevents disconnect from recreating every render.
  return useMemo(() => ({
    analyserRef,
    inputAnalyserRef,
    lastUserAudioTimeRef,
    mediaStreamRef,
    setup,
    scheduleOutputAudio,
    interruptOutput,
    cleanup,
    toggleMic,
    getMicMuted,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);
}
