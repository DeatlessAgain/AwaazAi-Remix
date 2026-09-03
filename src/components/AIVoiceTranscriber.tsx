import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Upload,
  Loader2,
  FileAudio,
  Check,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Languages,
} from 'lucide-react';

interface AIVoiceTranscriberProps {
  onTranscribeComplete: (text: string) => void;
  onClose?: () => void;
}

export const AIVoiceTranscriber: React.FC<AIVoiceTranscriberProps> = ({
  onTranscribeComplete,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setTranscriptionResult(null);
    setRecordedBlob(null);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
        await processAudioBlobForTranscription(audioBlob, 'audio/webm');
      };

      mediaRecorder.start(200);
      setIsRecording(true);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setError(
        'Could not access microphone. Please grant microphone permissions in your browser.'
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setTranscriptionResult(null);

    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      setError('File size too large. Please upload an audio clip under 15MB.');
      return;
    }

    await processAudioBlobForTranscription(file, file.type || 'audio/mp3');
  };

  const processAudioBlobForTranscription = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setError(null);

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
      }
      const base64Audio = btoa(binary);

      const res = await fetch('/api/ai/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to transcribe speech.');
      }

      if (data.transcription) {
        setTranscriptionResult(data.transcription);
      } else {
        setError('No spoken words detected in the audio.');
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Speech recognition failed.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-[#0d0e1a] border border-indigo-500/20 space-y-4 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>AI Speech-to-Script Transcriber</span>
              <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                Gemini 3.5 Transcribe
              </span>
            </h3>
            <p className="text-[11px] text-white/50">
              Speak or upload voice in Urdu, Hindi, or English to transcribe into editable script.
            </p>
          </div>
        </div>
      </div>

      {/* Recording & Upload Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Record Mic Option */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center text-center space-y-3">
          {isRecording ? (
            <div className="space-y-2 flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 animate-ping absolute" />
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 relative z-10 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                  title="Stop recording"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              </div>
              <div className="text-xs font-mono font-bold text-rose-400">
                Recording: {formatTimer(recordingSeconds)}
              </div>
              <div className="text-[10px] text-white/50">Click red button when finished speaking</div>
            </div>
          ) : (
            <div className="space-y-2 flex flex-col items-center">
              <button
                type="button"
                onClick={startRecording}
                disabled={isTranscribing}
                className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                title="Start microphone recording"
              >
                <Mic className="w-5 h-5" />
              </button>
              <div className="text-xs font-bold text-white">Record with Microphone</div>
              <div className="text-[10px] text-white/50">Speak in Urdu, Hindi, or English</div>
            </div>
          )}
        </div>

        {/* Upload Audio File Option */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center text-center space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isTranscribing || isRecording}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-50 text-indigo-300 flex items-center justify-center border border-white/10 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            title="Upload audio clip"
          >
            <Upload className="w-5 h-5" />
          </button>
          <div className="text-xs font-bold text-white">Upload Audio Note</div>
          <div className="text-[10px] text-white/50">Supports MP3, WAV, M4A, WEBM</div>
        </div>
      </div>

      {isTranscribing && (
        <div className="p-3.5 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center gap-2 text-xs text-indigo-200">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Gemini AI is recognizing voice and converting speech into script...</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {transcriptionResult && (
        <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Transcribed Speech Script:</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 max-h-36 overflow-y-auto custom-scrollbar">
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-urdu text-right">
              {transcriptionResult}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onTranscribeComplete(transcriptionResult)}
              className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Insert Transcribed Script to Main Editor</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
