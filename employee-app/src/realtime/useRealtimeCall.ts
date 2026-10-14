import { useCallback, useRef, useState } from "react";
import { REALTIME_TOKEN_URL, SUPABASE_ANON_KEY } from "../config";

// ── OpenAI Realtime over WebRTC ──────────────────────────────────────────────
// Flow (per the hard constraints):
//   1. Ask our Edge Function for a short-lived ephemeral token (secret stays server-side).
//   2. Capture the mic, open an RTCPeerConnection, play OpenAI's audio back.
//   3. Open a data channel for events → build a live transcript.
//   4. Exchange SDP directly with OpenAI using the ephemeral token. Audio never
//      touches our server.

export type CallStatus = "idle" | "connecting" | "live" | "ended" | "error";

export interface TranscriptLine {
  id: string;
  who: "ai" | "me";
  text: string;
  done: boolean;
}

export interface UseRealtimeCall {
  status: CallStatus;
  error: string | null;
  muted: boolean;
  ready: boolean; // data channel open — safe to inject the opening agenda
  transcript: TranscriptLine[];
  analyser: AnalyserNode | null;
  start: () => Promise<void>;
  end: () => void;
  toggleMute: () => void;
  // inject a text note into the live conversation and let the AI respond to it
  // (used to feed a photo quality-check result back into the call)
  sendContext: (text: string) => void;
  // trigger ONE spoken response guided by per-response instructions, NOT stored in
  // history (used for the opening greeting so it can't be re-fired / duplicated)
  respondWith: (instructions: string) => void;
}

// name → handler. The handler runs in the browser when the AI invokes the tool;
// whatever it returns is JSON-serialised and fed back into the conversation.
export type ToolHandlers = Record<
  string,
  (args: Record<string, unknown>) => Promise<unknown> | unknown
>;

export function useRealtimeCall(tools: ToolHandlers = {}): UseRealtimeCall {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const startedRef = useRef(false); // guards against opening two connections at once

  // accumulate streaming transcript deltas keyed by item/response id
  const aiBufRef = useRef<Record<string, string>>({});
  const meBufRef = useRef<Record<string, string>>({});

  // keep the latest tool handlers without re-creating the event listener
  const toolsRef = useRef<ToolHandlers>(tools);
  toolsRef.current = tools;
  // in-flight function calls keyed by item id (name/call_id + streamed args)
  const fnCallsRef = useRef<
    Record<string, { call_id: string; name: string; args: string }>
  >({});
  // call_ids we've already executed, so the two possible trigger events don't double-run
  const executedRef = useRef<Set<string>>(new Set());

  // half-duplex mic gating: the mic stays muted while the AI is speaking so it
  // can't hear (and react to) its own voice / room echo and cut itself off.
  const manualMutedRef = useRef(false); // the user's Mute button state
  const aiSpeakingRef = useRef(false); // AI audio currently playing

  const pushLine = useCallback((line: TranscriptLine) => {
    setTranscript((prev) => {
      const i = prev.findIndex((l) => l.id === line.id);
      if (i === -1) return [...prev, line];
      const next = prev.slice();
      next[i] = line;
      return next;
    });
  }, []);

  // send an event up the data channel to OpenAI
  const sendEvent = useCallback((obj: unknown) => {
    const dc = dcRef.current;
    if (dc && dc.readyState === "open") dc.send(JSON.stringify(obj));
  }, []);

  // run a tool the AI asked for, then hand the result back and let it reply
  const runTool = useCallback(
    async (name: string, callId: string, argsStr: string) => {
      const handler = toolsRef.current[name];
      let output: unknown;
      try {
        const args = argsStr ? JSON.parse(argsStr) : {};
        output = handler ? await handler(args) : { error: `Unknown tool: ${name}` };
      } catch (e) {
        output = { error: String(e) };
      }
      sendEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(output),
        },
      });
      sendEvent({ type: "response.create" });
    },
    [sendEvent],
  );

  // mic is live only when the user hasn't muted AND the AI isn't speaking
  const applyMic = useCallback(() => {
    const track = micRef.current?.getAudioTracks()[0];
    if (track) track.enabled = !manualMutedRef.current && !aiSpeakingRef.current;
  }, []);

  const handleEvent = useCallback(
    (evt: MessageEvent) => {
      let msg: any;
      try {
        msg = JSON.parse(evt.data);
      } catch {
        return;
      }
      switch (msg.type) {
        // Reserve the user's transcript slot the moment their turn is created,
        // BEFORE the AI's reply streams in — keeps messages in spoken order even
        // though input transcription finishes slightly later than the AI reply.
        // GA emits "conversation.item.added"; older beta used "...created".
        case "conversation.item.added":
        case "conversation.item.created": {
          const item = msg.item;
          if (item?.role === "user" && item?.type === "message") {
            const id = `me-${item.id}`;
            if (meBufRef.current[id] === undefined) {
              meBufRef.current[id] = "";
              pushLine({ id, who: "me", text: "", done: false });
            }
          }
          break;
        }
        // AI speech transcript, streamed (GA: response.output_audio_transcript.*,
        // older beta: response.audio_transcript.*) — handle both.
        case "response.output_audio_transcript.delta":
        case "response.audio_transcript.delta": {
          const id = `ai-${msg.response_id ?? msg.item_id}`;
          aiBufRef.current[id] = (aiBufRef.current[id] ?? "") + (msg.delta ?? "");
          pushLine({ id, who: "ai", text: aiBufRef.current[id], done: false });
          break;
        }
        case "response.output_audio_transcript.done":
        case "response.audio_transcript.done": {
          const id = `ai-${msg.response_id ?? msg.item_id}`;
          pushLine({
            id,
            who: "ai",
            text: msg.transcript ?? aiBufRef.current[id] ?? "",
            done: true,
          });
          break;
        }
        // user's mic, transcribed by the server (streaming with gpt-4o-mini-transcribe)
        case "conversation.item.input_audio_transcription.delta": {
          const id = `me-${msg.item_id}`;
          meBufRef.current[id] = (meBufRef.current[id] ?? "") + (msg.delta ?? "");
          pushLine({ id, who: "me", text: meBufRef.current[id], done: false });
          break;
        }
        case "conversation.item.input_audio_transcription.completed": {
          const id = `me-${msg.item_id}`;
          pushLine({
            id,
            who: "me",
            text: msg.transcript ?? meBufRef.current[id] ?? "",
            done: true,
          });
          break;
        }
        // ── tool (function) call lifecycle ──────────────────────────────────
        case "response.output_item.added": {
          const item = msg.item;
          if (item?.type === "function_call") {
            fnCallsRef.current[item.id] = {
              call_id: item.call_id,
              name: item.name,
              args: "",
            };
          }
          break;
        }
        case "response.function_call_arguments.delta": {
          const f = fnCallsRef.current[msg.item_id];
          if (f) f.args += msg.delta ?? "";
          break;
        }
        case "response.function_call_arguments.done": {
          const f = fnCallsRef.current[msg.item_id];
          const name = f?.name ?? msg.name;
          const callId = f?.call_id ?? msg.call_id;
          const args = msg.arguments ?? f?.args ?? "";
          delete fnCallsRef.current[msg.item_id];
          if (name && callId && !executedRef.current.has(callId)) {
            executedRef.current.add(callId);
            void runTool(name, callId, args);
          }
          break;
        }
        // authoritative fallback: response.done carries the full function_call items
        case "response.done": {
          const items = msg.response?.output ?? [];
          for (const item of items) {
            if (
              item?.type === "function_call" &&
              item.call_id &&
              !executedRef.current.has(item.call_id)
            ) {
              executedRef.current.add(item.call_id);
              void runTool(item.name, item.call_id, item.arguments ?? "");
            }
          }
          break;
        }
        // ── half-duplex: close the mic while the AI speaks, reopen when done ──
        case "output_audio_buffer.started": {
          aiSpeakingRef.current = true;
          applyMic();
          break;
        }
        case "output_audio_buffer.stopped":
        case "output_audio_buffer.cleared": {
          // brief delay so the speaker tail finishes before the mic reopens
          setTimeout(() => {
            aiSpeakingRef.current = false;
            applyMic();
          }, 200);
          break;
        }
        case "error": {
          setError(msg.error?.message ?? "Realtime error");
          break;
        }
      }
    },
    [pushLine, runTool, applyMic],
  );

  const start = useCallback(async () => {
    if (startedRef.current) return; // already connecting/live — don't open a second call
    startedRef.current = true;
    setError(null);
    setTranscript([]);
    setReady(false);
    setMuted(false);
    manualMutedRef.current = false;
    aiSpeakingRef.current = false;
    fnCallsRef.current = {};
    executedRef.current = new Set();
    setStatus("connecting");
    try {
      // 1. ephemeral token from our Edge Function
      const tokenRes = await fetch(REALTIME_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Supabase Edge Functions require the anon apikey to be invoked
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      const session = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(
          typeof session?.error === "string"
            ? session.error
            : JSON.stringify(session?.error ?? session),
        );
      }
      // GA returns the token at `value`; older beta nested it under client_secret.value
      const ephemeralKey: string | undefined =
        session?.value ?? session?.client_secret?.value;
      if (!ephemeralKey) throw new Error("No ephemeral token returned");

      // 2. peer connection + remote audio sink
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audioEl = new Audio();
      audioEl.autoplay = true;
      audioElRef.current = audioEl;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      // 3. mic in + a waveform analyser for the UI.
      // echoCancellation strips the AI's own voice back out of the mic (vital on
      // speakers, not headphones) so it doesn't hear/transcribe itself.
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micRef.current = mic;
      pc.addTrack(mic.getTracks()[0], mic);

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const node = audioCtx.createAnalyser();
      node.fftSize = 256;
      audioCtx.createMediaStreamSource(mic).connect(node);
      setAnalyser(node);

      // 4. data channel for events (transcript)
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = handleEvent;
      dc.onopen = () => setReady(true); // channel live → caller can inject the agenda

      // 5. SDP offer → OpenAI (direct), using the ephemeral token
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // GA WebRTC SDP exchange. The model is already bound to the ephemeral token.
      const sdpRes = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
      });
      if (!sdpRes.ok) throw new Error(`OpenAI SDP exchange failed (${sdpRes.status})`);
      const answer = { type: "answer" as const, sdp: await sdpRes.text() };
      await pc.setRemoteDescription(answer);

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setStatus("live");
        if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
          setStatus((s) => (s === "ended" ? s : "error"));
        }
      };
      setStatus("live");
    } catch (e: any) {
      startedRef.current = false; // allow a retry after a failed connect
      setError(e?.message ?? String(e));
      setStatus("error");
    }
  }, [handleEvent]);

  const end = useCallback(() => {
    startedRef.current = false;
    aiSpeakingRef.current = false;
    manualMutedRef.current = false;
    setReady(false);
    dcRef.current?.close();
    pcRef.current?.getSenders().forEach((s) => s.track?.stop());
    pcRef.current?.close();
    micRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    pcRef.current = null;
    dcRef.current = null;
    micRef.current = null;
    setAnalyser(null);
    setStatus("ended");
  }, []);

  const toggleMute = useCallback(() => {
    manualMutedRef.current = !manualMutedRef.current;
    setMuted(manualMutedRef.current);
    applyMic();
  }, [applyMic]);

  // feed an out-of-band note (e.g. a photo QC result) to the model, then have it respond
  const sendContext = useCallback(
    (text: string) => {
      sendEvent({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text }],
        },
      });
      sendEvent({ type: "response.create" });
    },
    [sendEvent],
  );

  // one-off spoken response with per-response instructions; nothing is added to
  // the conversation history, so a later (e.g. echo-triggered) turn can't repeat it
  const respondWith = useCallback(
    (instructions: string) => {
      sendEvent({ type: "response.create", response: { instructions } });
    },
    [sendEvent],
  );

  return {
    status,
    error,
    muted,
    ready,
    transcript,
    analyser,
    start,
    end,
    toggleMute,
    sendContext,
    respondWith,
  };
}
