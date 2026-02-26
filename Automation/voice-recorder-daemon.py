#!/usr/bin/env python
"""
NAVADA Voice Recorder Daemon
=============================
Persistent PyAudio recording service that communicates with voice-command.js
over a local TCP socket on port 7778.

Eliminates the overhead of spawning a new Python process for every listen cycle
by keeping PyAudio initialized between requests.

Protocol (TCP, localhost:7778):
  Request  -> JSON line: {"action": "record"|"quick_record", "output": "path.wav", "max_seconds": 30}
  Response <- JSON line: {"speech": true|false, "duration": 1.5, "path": "path.wav"}
                     or: {"error": "message"}

Usage:
  py voice-recorder-daemon.py

Author: NAVADA / Lee Akpareva
"""

import json
import math
import os
import signal
import socket
import struct
import sys
import threading
import time
import traceback
import wave

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = 7778

FORMAT_PA = 8  # pyaudio.paInt16 == 8
CHANNELS = 1
SAMPLE_RATE = 16000
CHUNK = 1024
GAIN = 2.5
SILENCE_THRESHOLD = 200

# "record" defaults
RECORD_SILENCE_DURATION = 1.0
RECORD_MIN_SPEECH = 0.5
RECORD_MAX_SECONDS = 30

# "quick_record" defaults
QUICK_SILENCE_DURATION = 0.8
QUICK_MIN_SPEECH = 0.3
QUICK_MAX_SECONDS = 4

# Device detection keywords (case-insensitive)
DEVICE_KEYWORDS = ["s8", "headset"]
FALLBACK_DEVICE_INDEX = 2

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

_log_lock = threading.Lock()

def log(msg):
    """Log to stderr with timestamp."""
    line = f"[{time.strftime('%Y-%m-%dT%H:%M:%S')}] [voice-recorder-daemon] {msg}"
    with _log_lock:
        print(line, file=sys.stderr, flush=True)

# ---------------------------------------------------------------------------
# PyAudio Manager
# ---------------------------------------------------------------------------

class AudioManager:
    """
    Manages a persistent PyAudio instance and microphone device selection.
    Re-initializes on device errors (e.g. Bluetooth reconnect).
    """

    def __init__(self):
        self._pa = None
        self._mic_index = None
        self._mic_name = None
        self._lock = threading.Lock()
        self._initialize()

    def _initialize(self):
        """Create PyAudio instance and find the mic."""
        import pyaudio
        if self._pa is not None:
            try:
                self._pa.terminate()
            except Exception:
                pass
        self._pa = pyaudio.PyAudio()
        self._mic_index = self._find_mic()
        if self._mic_index is not None:
            info = self._pa.get_device_info_by_index(self._mic_index)
            self._mic_name = info.get("name", "unknown")
            log(f"PyAudio initialized. Mic: [{self._mic_index}] {self._mic_name}")
        else:
            self._mic_name = None
            log("WARNING: No S8/headset mic found. Will use fallback or retry on next request.")

    def _find_mic(self):
        """Auto-detect S8 Bluetooth mic by device name, fallback to hardcoded index."""
        pa = self._pa

        # First try the fallback index to see if it matches keywords
        try:
            info = pa.get_device_info_by_index(FALLBACK_DEVICE_INDEX)
            name_lower = info.get("name", "").lower()
            if info.get("maxInputChannels", 0) > 0:
                for kw in DEVICE_KEYWORDS:
                    if kw in name_lower:
                        return FALLBACK_DEVICE_INDEX
        except Exception:
            pass

        # Scan all devices
        try:
            device_count = pa.get_device_count()
        except Exception:
            return FALLBACK_DEVICE_INDEX

        for i in range(device_count):
            try:
                d = pa.get_device_info_by_index(i)
                if d.get("maxInputChannels", 0) <= 0:
                    continue
                name_lower = d.get("name", "").lower()
                for kw in DEVICE_KEYWORDS:
                    if kw in name_lower:
                        return i
            except Exception:
                continue

        # Last resort: use fallback index if it has input channels
        try:
            info = pa.get_device_info_by_index(FALLBACK_DEVICE_INDEX)
            if info.get("maxInputChannels", 0) > 0:
                log(f"No keyword match. Using fallback device index {FALLBACK_DEVICE_INDEX}: {info.get('name')}")
                return FALLBACK_DEVICE_INDEX
        except Exception:
            pass

        # Absolute last resort: first available input device
        for i in range(device_count):
            try:
                d = pa.get_device_info_by_index(i)
                if d.get("maxInputChannels", 0) > 0:
                    log(f"Using first available input device [{i}]: {d.get('name')}")
                    return i
            except Exception:
                continue

        return None

    def reinitialize(self):
        """Force re-initialization (e.g. after device error)."""
        with self._lock:
            log("Re-initializing PyAudio (device error recovery)...")
            self._initialize()

    def record(self, output_path, max_seconds, silence_duration, min_speech_duration):
        """
        Record audio, detect speech vs silence, save WAV.
        Returns dict: {"speech": bool, "duration": float, "path": str}
        Raises on unrecoverable error.
        """
        import pyaudio

        with self._lock:
            pa = self._pa
            mic_index = self._mic_index

        if pa is None or mic_index is None:
            self.reinitialize()
            with self._lock:
                pa = self._pa
                mic_index = self._mic_index
            if pa is None or mic_index is None:
                raise RuntimeError("No microphone available after re-initialization")

        stream = None
        try:
            stream = pa.open(
                format=pyaudio.paInt16,
                channels=CHANNELS,
                rate=SAMPLE_RATE,
                input=True,
                input_device_index=mic_index,
                frames_per_buffer=CHUNK,
            )

            frames = []
            silent_chunks = 0
            has_speech = False
            speech_chunks = 0
            max_chunks = int(SAMPLE_RATE / CHUNK * max_seconds)
            silence_chunks_needed = int(SAMPLE_RATE / CHUNK * silence_duration)
            min_speech_chunks = int(SAMPLE_RATE / CHUNK * min_speech_duration)

            log(f"Recording started: max={max_seconds}s, silence_stop={silence_duration}s, min_speech={min_speech_duration}s")

            for _ in range(max_chunks):
                try:
                    data = stream.read(CHUNK, exception_on_overflow=False)
                except Exception as e:
                    log(f"Stream read error: {e}")
                    # Device might have disconnected
                    break

                # Apply gain boost
                shorts = struct.unpack(f"{CHUNK}h", data)
                boosted = tuple(max(-32768, min(32767, int(s * GAIN))) for s in shorts)
                data = struct.pack(f"{CHUNK}h", *boosted)
                frames.append(data)

                # RMS for silence detection
                rms = math.sqrt(sum(s * s for s in boosted) / CHUNK)

                if rms > SILENCE_THRESHOLD:
                    has_speech = True
                    speech_chunks += 1
                    silent_chunks = 0
                else:
                    silent_chunks += 1

                # Stop if speech detected and enough silence follows
                if has_speech and silent_chunks > silence_chunks_needed:
                    log("Silence detected after speech, stopping.")
                    break

            # Clean up stream
            try:
                stream.stop_stream()
                stream.close()
            except Exception:
                pass
            stream = None

            # Evaluate result
            if not has_speech or speech_chunks < min_speech_chunks:
                duration = len(frames) * CHUNK / SAMPLE_RATE
                log(f"No speech detected (has_speech={has_speech}, speech_chunks={speech_chunks}, needed={min_speech_chunks}, listened={duration:.1f}s)")
                return {"speech": False, "duration": 0}

            # Write WAV file
            duration = len(frames) * CHUNK / SAMPLE_RATE

            # Ensure output directory exists
            out_dir = os.path.dirname(output_path)
            if out_dir:
                os.makedirs(out_dir, exist_ok=True)

            wf = wave.open(output_path, "wb")
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(2)  # 16-bit = 2 bytes
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(b"".join(frames))
            wf.close()

            log(f"Recorded {duration:.1f}s of speech -> {output_path}")
            return {"speech": True, "duration": round(duration, 2), "path": output_path}

        except Exception as e:
            # Close stream if still open
            if stream is not None:
                try:
                    stream.stop_stream()
                    stream.close()
                except Exception:
                    pass

            error_msg = str(e)
            log(f"Recording error: {error_msg}")

            # Check if this is a device error requiring re-init
            device_error_keywords = [
                "invalid device",
                "device unavailable",
                "unanticipated host error",
                "internal portaudio",
                "no default input",
                "invalid number of channels",
                "errno",
            ]
            if any(kw in error_msg.lower() for kw in device_error_keywords):
                log("Device error detected, scheduling re-initialization...")
                self.reinitialize()

            raise

    def terminate(self):
        """Clean up PyAudio on shutdown."""
        with self._lock:
            if self._pa is not None:
                try:
                    self._pa.terminate()
                    log("PyAudio terminated.")
                except Exception:
                    pass
                self._pa = None


# ---------------------------------------------------------------------------
# TCP Server
# ---------------------------------------------------------------------------

class RecorderDaemon:
    """
    Single-threaded TCP server that accepts one connection at a time,
    reads a JSON command, performs recording, and returns JSON result.
    """

    def __init__(self, audio_manager):
        self._audio = audio_manager
        self._server_socket = None
        self._running = False

    def start(self):
        """Start listening for connections."""
        self._running = True

        self._server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._server_socket.settimeout(1.0)  # Allow periodic shutdown checks
        self._server_socket.bind((LISTEN_HOST, LISTEN_PORT))
        self._server_socket.listen(1)  # Single connection backlog

        log(f"Daemon listening on {LISTEN_HOST}:{LISTEN_PORT}")

        while self._running:
            try:
                conn, addr = self._server_socket.accept()
            except socket.timeout:
                continue
            except OSError:
                if self._running:
                    log("Server socket error, stopping.")
                break

            try:
                self._handle_connection(conn, addr)
            except Exception as e:
                log(f"Unhandled error in connection handler: {e}")
                traceback.print_exc(file=sys.stderr)
            finally:
                try:
                    conn.close()
                except Exception:
                    pass

    def _handle_connection(self, conn, addr):
        """Handle a single client connection: read command, record, send response."""
        conn.settimeout(5.0)  # 5s to receive the command

        # Read data until newline or connection close
        buf = b""
        while True:
            try:
                chunk = conn.recv(4096)
            except socket.timeout:
                self._send_response(conn, {"error": "Timeout waiting for command"})
                return
            except Exception as e:
                log(f"Recv error: {e}")
                return

            if not chunk:
                break
            buf += chunk
            if b"\n" in buf:
                break
            if len(buf) > 65536:
                self._send_response(conn, {"error": "Command too large"})
                return

        # Parse JSON command
        raw = buf.split(b"\n")[0].strip()
        if not raw:
            self._send_response(conn, {"error": "Empty command"})
            return

        try:
            cmd = json.loads(raw.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            self._send_response(conn, {"error": f"Invalid JSON: {e}"})
            return

        action = cmd.get("action", "")

        # Handle non-recording actions first (no output path needed)
        if action == "ping":
            self._send_response(conn, {"status": "ok", "pid": os.getpid()})
            return
        elif action == "reinit":
            self._audio.reinitialize()
            self._send_response(conn, {"status": "reinitialized"})
            return

        output_path = cmd.get("output", "")

        if not output_path:
            self._send_response(conn, {"error": "Missing 'output' path"})
            return

        # Normalize path for Windows
        output_path = os.path.normpath(output_path)

        # Determine parameters based on action
        if action == "record":
            max_seconds = cmd.get("max_seconds", RECORD_MAX_SECONDS)
            silence_duration = cmd.get("silence_duration", RECORD_SILENCE_DURATION)
            min_speech = cmd.get("min_speech", RECORD_MIN_SPEECH)
        elif action == "quick_record":
            max_seconds = cmd.get("max_seconds", QUICK_MAX_SECONDS)
            silence_duration = cmd.get("silence_duration", QUICK_SILENCE_DURATION)
            min_speech = cmd.get("min_speech", QUICK_MIN_SPEECH)
        else:
            self._send_response(conn, {"error": f"Unknown action: {action}"})
            return

        # Clamp max_seconds to sane range
        max_seconds = max(1, min(60, max_seconds))

        # Remove timeout for recording phase — recording can take up to max_seconds
        conn.settimeout(None)

        # Perform recording
        try:
            result = self._audio.record(
                output_path=output_path,
                max_seconds=max_seconds,
                silence_duration=silence_duration,
                min_speech_duration=min_speech,
            )
            self._send_response(conn, result)
        except Exception as e:
            log(f"Recording failed: {e}")
            self._send_response(conn, {"error": str(e)})

    def _send_response(self, conn, data):
        """Send a JSON response terminated by newline."""
        try:
            payload = json.dumps(data) + "\n"
            conn.sendall(payload.encode("utf-8"))
        except Exception as e:
            log(f"Failed to send response: {e}")

    def stop(self):
        """Signal the server to stop."""
        self._running = False
        if self._server_socket is not None:
            try:
                self._server_socket.close()
            except Exception:
                pass
            self._server_socket = None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    log("Starting NAVADA Voice Recorder Daemon...")
    log(f"PID: {os.getpid()}")
    log(f"Sample rate: {SAMPLE_RATE}Hz, Chunk: {CHUNK}, Gain: {GAIN}, Silence threshold: {SILENCE_THRESHOLD}")

    # Check PyAudio is available
    try:
        import pyaudio
        log(f"PyAudio version: {pyaudio.__version__} (PortAudio {pyaudio.get_portaudio_version_text()})")
    except ImportError:
        log("FATAL: PyAudio not installed. Run: pip install pyaudio")
        sys.exit(1)

    # Initialize audio
    audio = AudioManager()

    # Create server
    daemon = RecorderDaemon(audio)

    # Signal handlers for graceful shutdown
    def shutdown_handler(signum, frame):
        sig_name = signal.Signals(signum).name if hasattr(signal, "Signals") else str(signum)
        log(f"Received {sig_name}, shutting down...")
        daemon.stop()

    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    # On Windows, also handle SIGBREAK if available
    if hasattr(signal, "SIGBREAK"):
        signal.signal(signal.SIGBREAK, shutdown_handler)

    try:
        daemon.start()
    except KeyboardInterrupt:
        log("KeyboardInterrupt, shutting down...")
    except Exception as e:
        log(f"Fatal error: {e}")
        traceback.print_exc(file=sys.stderr)
    finally:
        daemon.stop()
        audio.terminate()
        log("Daemon stopped.")


if __name__ == "__main__":
    main()
